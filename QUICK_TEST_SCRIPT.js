/**
 * 🧪 QUICK TEST SCRIPT FOR AUDIO & TRANSCRIPTION DEBUGGING
 *
 * Usage:
 * 1. Copy this entire script
 * 2. Open browser DevTools (F12)
 * 3. Go to Console tab
 * 4. Paste entire script and press Enter
 * 5. Follow prompts or call functions directly
 */

const DebugTester = {
  // Store last response for inspection
  lastResponse: null,
  audioBlobs: {},

  /**
   * 🔧 Utility: Pretty print JSON
   */
  prettyPrint: function (obj) {
    return JSON.stringify(obj, null, 2);
  },

  /**
   * 📡 Test 1: Check API Connectivity
   */
  testAPIConnectivity: async function () {
    console.log("🔄 Testing API connectivity...");
    try {
      const response = await fetch("http://localhost:3000/reports/stats");
      if (response.ok) {
        console.log("✅ Backend is reachable!");
        const data = await response.json();
        console.log("Response:", this.prettyPrint(data));
        return true;
      } else {
        console.error("❌ Backend responded with status:", response.status);
        return false;
      }
    } catch (error) {
      console.error("❌ Cannot reach backend:", error.message);
      console.log("💡 Make sure backend is running on http://localhost:3000");
      return false;
    }
  },

  /**
   * 🎙️ Test 2: Create and upload dummy audio
   */
  createDummyAudio: function () {
    console.log("🎙️ Creating dummy audio blob...");
    // Create a simple 1-second silence audio (WAV format)
    const sampleRate = 44100;
    const duration = 1; // 1 second
    const channels = 1;
    const sampleCount = sampleRate * duration;

    // Create WAV file header
    const audioBuffer = new ArrayBuffer(44 + sampleCount * 2);
    const view = new DataView(audioBuffer);

    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + sampleCount * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, sampleCount * 2, true);

    const blob = new Blob([audioBuffer], { type: "audio/wav" });
    console.log("✅ Created dummy audio:", blob.size, "bytes");
    this.audioBlobs.dummy = blob;
    return blob;
  },

  /**
   * 📤 Test 3: Upload audio with feedback
   */
  testUploadAudioWithFeedback: async function (audioBlob = null) {
    console.log("📤 Testing upload with feedback...");

    // Use provided blob or create dummy
    const blob = audioBlob || this.createDummyAudio();

    const formData = new FormData();
    formData.append("audio", blob, "recording.wav");
    formData.append("patientId", "PAT001");
    formData.append("doctorId", "DOC001");
    formData.append("specialty", "Cardiología");

    try {
      console.log("⏳ Sending request to /reports/upload-audio-with-feedback...");
      const response = await fetch(
        "http://localhost:3000/reports/upload-audio-with-feedback",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      this.lastResponse = data;

      if (response.ok) {
        console.log("✅ Upload successful!");
        console.log("Full response:", this.prettyPrint(data));
        return data;
      } else {
        console.error("❌ Upload failed:", response.status);
        console.error("Error:", this.prettyPrint(data));
        return null;
      }
    } catch (error) {
      console.error("❌ Upload error:", error);
      return null;
    }
  },

  /**
   * ✓ Test 4: Validate response structure
   */
  validateResponse: function (response = null) {
    const resp = response || this.lastResponse;

    if (!resp) {
      console.error("❌ No response to validate. Upload audio first.");
      return false;
    }

    console.log("✓ Validating response structure...\n");

    const checks = {
      "Has success field": resp.success === true,
      "Has reportId": !!resp.reportId,
      "Has transcription": !!resp.transcription,
      "Transcription not empty": (resp.transcription?.length || 0) > 0,
      "Has feedbackQuestions": Array.isArray(resp.feedbackQuestions),
      "Questions not empty": (resp.feedbackQuestions?.length || 0) > 0,
      "Has feedbackQuestionsWithAudio":
        Array.isArray(resp.feedbackQuestionsWithAudio),
      "Audio questions not empty":
        (resp.feedbackQuestionsWithAudio?.length || 0) > 0,
    };

    let allPassed = true;
    for (const [check, passed] of Object.entries(checks)) {
      const icon = passed ? "✅" : "❌";
      console.log(`${icon} ${check}`);
      if (!passed) allPassed = false;
    }

    // Detailed audio checks
    if (resp.feedbackQuestionsWithAudio?.length > 0) {
      console.log("\n📊 Audio Questions Detail:");
      resp.feedbackQuestionsWithAudio.forEach((q, idx) => {
        const audioLength = q.audioBase64?.length || 0;
        const hasAudio = audioLength > 100;
        const icon = hasAudio ? "✅" : "❌";
        console.log(
          `${icon} Q${idx + 1}: ${audioLength} bytes - ${q.question?.substring(0, 50)}...`
        );
      });
    }

    console.log("\n" + (allPassed ? "✅ All checks passed!" : "❌ Some checks failed"));
    return allPassed;
  },

  /**
   * 🔊 Test 5: Test audio decoding
   */
  testAudioDecoding: function (questionIndex = 0, response = null) {
    const resp = response || this.lastResponse;

    if (!resp?.feedbackQuestionsWithAudio?.[questionIndex]) {
      console.error(
        `❌ No question at index ${questionIndex}. Upload audio first.`
      );
      return false;
    }

    const q = resp.feedbackQuestionsWithAudio[questionIndex];
    const base64 = q.audioBase64;

    if (!base64) {
      console.error(`❌ Question ${questionIndex} has no audioBase64`);
      return false;
    }

    console.log(`🔊 Testing audio decoding for Q${questionIndex + 1}...`);

    try {
      // Step 1: Decode base64
      console.log("  1️⃣ Decoding base64...");
      const binaryString = atob(base64);
      console.log(`     ✅ Decoded: ${binaryString.length} bytes`);

      // Step 2: Create Uint8Array
      console.log("  2️⃣ Converting to Uint8Array...");
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      console.log(`     ✅ Created array: ${bytes.length} bytes`);

      // Step 3: Create Blob
      console.log("  3️⃣ Creating Blob...");
      const blob = new Blob([bytes], { type: "audio/mp3" });
      console.log(`     ✅ Blob created: ${blob.size} bytes`);

      // Step 4: Create playable URL
      console.log("  4️⃣ Creating playable URL...");
      const url = URL.createObjectURL(blob);
      console.log(`     ✅ URL created: ${url}`);

      // Save for later playback
      this.audioBlobs[`q${questionIndex}`] = {
        blob,
        url,
        base64,
      };

      console.log("\n✅ Audio decoding successful!");
      console.log(
        `💡 To play it: DebugTester.playAudio(${questionIndex})`
      );
      return true;
    } catch (error) {
      console.error("❌ Decoding failed:", error.message);
      return false;
    }
  },

  /**
   * 🎵 Test 6: Play audio
   */
  playAudio: function (questionIndex = 0) {
    const audio = this.audioBlobs[`q${questionIndex}`];

    if (!audio) {
      console.error(
        `❌ No decoded audio for Q${questionIndex}. Run testAudioDecoding first.`
      );
      return;
    }

    console.log(`🎵 Playing audio for Q${questionIndex + 1}...`);

    const audioElement = new Audio(audio.url);
    audioElement.play().catch((err) => {
      console.error("❌ Playback failed:", err.message);
    });

    console.log("▶️ Playing... (check speaker)");
  },

  /**
   * 📋 Test 7: Full diagnostic report
   */
  runFullDiagnostics: async function () {
    console.log("\n" + "=".repeat(50));
    console.log("🚀 FULL DIAGNOSTIC TEST");
    console.log("=".repeat(50) + "\n");

    // Test 1: Connectivity
    console.log("TEST 1: API Connectivity");
    console.log("-".repeat(50));
    const canConnect = await this.testAPIConnectivity();
    if (!canConnect) {
      console.error("❌ Cannot proceed without backend connection");
      return;
    }
    console.log();

    // Test 2-3: Upload
    console.log("TEST 2: Upload Audio");
    console.log("-".repeat(50));
    const response = await this.testUploadAudioWithFeedback();
    if (!response) {
      console.error("❌ Upload failed, cannot proceed");
      return;
    }
    console.log();

    // Test 4: Validate
    console.log("TEST 3: Validate Response");
    console.log("-".repeat(50));
    this.validateResponse(response);
    console.log();

    // Test 5: Audio decoding
    if (response.feedbackQuestionsWithAudio?.length > 0) {
      console.log("TEST 4: Audio Decoding");
      console.log("-".repeat(50));
      this.testAudioDecoding(0, response);
      console.log();

      // Test 6: Play audio
      console.log("TEST 5: Audio Playback");
      console.log("-".repeat(50));
      this.playAudio(0);
      console.log();
    }

    console.log("=".repeat(50));
    console.log("✅ DIAGNOSTICS COMPLETE");
    console.log("=".repeat(50));
  },

  /**
   * 🆘 Quick reference
   */
  help: function () {
    console.log(`
╔════════════════════════════════════════════════════════╗
║         QUICK TEST SCRIPT - COMMAND REFERENCE          ║
╚════════════════════════════════════════════════════════╝

Available Functions:

1️⃣  DebugTester.testAPIConnectivity()
    └─ Check if backend is running

2️⃣  DebugTester.testUploadAudioWithFeedback()
    └─ Upload dummy audio and get response

3️⃣  DebugTester.validateResponse()
    └─ Check if response has all required fields

4️⃣  DebugTester.testAudioDecoding(0)
    └─ Test if audio base64 can be decoded (0 = first question)

5️⃣  DebugTester.playAudio(0)
    └─ Play decoded audio (0 = first question)

6️⃣  DebugTester.runFullDiagnostics()
    └─ Run all tests at once (RECOMMENDED!)

Utilities:

DebugTester.lastResponse
    └─ Inspect last API response

DebugTester.prettyPrint(object)
    └─ Format JSON for readability

Example Session:
  > DebugTester.runFullDiagnostics()
  > DebugTester.validateResponse()
  > DebugTester.playAudio(0)

Help:
  > DebugTester.help()
    `);
  },
};

// Auto-print help on load
console.log("✅ Debug Tester loaded! Run: DebugTester.help()");
DebugTester.help();
