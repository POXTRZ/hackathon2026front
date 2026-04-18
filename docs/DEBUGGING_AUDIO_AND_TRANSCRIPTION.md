# 🔍 Debugging Guide: Audio Playback and Transcription Issues

## Overview

This guide helps debug three main issues that can occur with audio playback from ElevenLabs and transcription display in the frontend.

---

## Problem 1: Audio Questions Not Playing (AudioBase64 Not Received)

### Symptoms
- Feedback questions appear but no audio player shows
- Console shows "⚠️ No audio found for question"
- Only text logs visible in backend

### Root Causes
1. Backend not returning `feedbackQuestionsWithAudio` with `audioBase64`
2. ElevenLabs API call failing silently
3. Audio not being encoded to base64 before returning

### Step-by-Step Debugging

#### Step 1: Check Console Logs
Open browser DevTools (F12) and look for:
```
✅ Respuesta del backend:
📊 Preguntas de feedback con audio:
```

If you see this, the backend is responding. Check what's inside.

#### Step 2: Log the Audio Response
In the console, type:
```javascript
// After recording and seeing feedback questions
const response = window.lastBackendResponse;
console.log("Audio questions:", response?.feedbackQuestionsWithAudio);

// Check each question
response?.feedbackQuestionsWithAudio?.forEach((q, i) => {
  console.log(`Q${i+1} audio size:`, q.audioBase64?.length);
  console.log(`Q${i+1} has audio:`, !!q.audioBase64);
});
```

#### Step 3: Verify Backend Response Format
The backend should return this structure:
```json
{
  "success": true,
  "feedbackQuestionsWithAudio": [
    {
      "id": "q1",
      "question": "¿Cuál es el diagnóstico?",
      "audioBase64": "//NExAAhnoIAVgQA...",
      "analysis": "Contexto clínico"
    }
  ]
}
```

**Key checks:**
- [ ] `feedbackQuestionsWithAudio` exists
- [ ] It's an array with items
- [ ] Each item has `audioBase64` field
- [ ] `audioBase64` starts with "//NE" (MP3 magic bytes in base64)
- [ ] `audioBase64` length > 1000 bytes

#### Step 4: Check ElevenLabs Configuration

In backend, verify:
```typescript
// Should have valid voice ID
ELEVENLABS_VOICE_ID = "pNInz6obpgDQGcFmaJgB" // Valid UUID
ELEVENLABS_API_KEY = "sk-..." // Valid API key

// NOT:
ELEVENLABS_VOICE_ID = "Antoni" // ❌ Wrong - this is a name
```

#### Step 5: Test ElevenLabs Directly

From backend, test the API:
```bash
curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB" \
  -H "xi-api-key: sk-YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test text"}' \
  --output test.mp3
```

If this fails, the API key or voice ID is wrong.

#### Step 6: Add Console Logs to Frontend

Edit `ReportsView.tsx` to add more logging:
```typescript
const uploadAndAnalyzeAudio = async (audioBlob: Blob) => {
  try {
    clearError();
    const formData = reportsService.createAudioFormData(
      audioBlob,
      selectedPatient.id,
      selectedDoctor.id,
      selectedDoctor.specialty,
    );

    const result = await reportsService.uploadAudioWithFeedback(formData);

    // ADD THIS LOGGING:
    console.log("=== BACKEND RESPONSE ===");
    console.log("Response:", result);
    console.log("Feedback questions count:", result.feedbackQuestions?.length);
    console.log("Audio questions count:", result.feedbackQuestionsWithAudio?.length);
    
    result.feedbackQuestionsWithAudio?.forEach((q, idx) => {
      console.log(`Q${idx + 1}:`, {
        id: q.id,
        question: q.question.substring(0, 50) + "...",
        audioBase64Length: q.audioBase64?.length || 0,
        audioBase64Sample: q.audioBase64?.substring(0, 50) || "NOT FOUND",
      });
    });
```

### Solution

If audio is not received:

1. **Check backend ElevenLabs service** - Is it being called?
2. **Verify API key** - Is it valid and has quota?
3. **Verify voice ID** - Is it a valid UUID?
4. **Check error handling** - Is it failing silently?
5. **Add try-catch** in backend to log errors

Backend code should look like:
```typescript
try {
  const audioBase64 = await this.elevenlabsService.synthesizeVoice(question.question);
  question.audioBase64 = audioBase64;
} catch (error) {
  console.error("ElevenLabs error:", error);
  // Still return question without audio, don't fail
}
```

---

## Problem 2: No Real-Time Transcription Display

### Symptoms
- Recording completes but no transcription appears
- Section below recording is empty
- Transcription state might be empty string

### Root Causes
1. Backend not returning `transcription` field
2. Frontend state not being set correctly
3. Conditional rendering hiding the transcription
4. Backend speech-to-text failing

### Step-by-Step Debugging

#### Step 1: Check Backend Response
Look for `transcription` field in the response:
```javascript
const response = /* backend response */;
console.log("Transcription:", response.transcription);
console.log("Transcription length:", response.transcription?.length);
console.log("Transcription empty:", response.transcription === "");
```

#### Step 2: Verify Speech-to-Text Service
Backend should use Google Cloud Speech-to-Text or similar:
```typescript
const transcription = await speechToTextService.transcribe(audioBuffer);
console.log("Transcription result:", transcription);
```

If empty, the speech-to-text is failing:
- [ ] Audio file is valid
- [ ] Service credentials are correct
- [ ] Audio quality is sufficient (not silent)
- [ ] Language setting is correct (Spanish)

#### Step 3: Check Frontend State
In `ReportsView.tsx`, verify:
```typescript
const uploadAndAnalyzeAudio = async (audioBlob: Blob) => {
  const result = await reportsService.uploadAudioWithFeedback(formData);
  
  console.log("Setting transcription:", result.transcription);
  setTranscription(result.transcription || "");
  
  // After setting state, log it
  setTimeout(() => {
    console.log("Transcription state was set");
  }, 100);
};
```

#### Step 4: Verify Rendering Condition
The transcription section renders when:
```typescript
{transcription && (
  // This section only shows if transcription is truthy (non-empty string)
)}
```

**Check:**
- [ ] `transcription` is not empty string ""
- [ ] `transcription` is not null
- [ ] `transcription` is not undefined

#### Step 5: Test with Manual Input
Try setting transcription manually in browser console:
```javascript
// Find the React component and manually set state
// This tests if the rendering works
```

### Solution

If transcription is missing:

1. **Backend:** Return `transcription` field in response
   ```typescript
   return {
     success: true,
     transcription: "Patient presents with fever...",
     feedbackQuestions: [...],
     // ...
   };
   ```

2. **Backend:** Verify speech-to-text service is working
   ```bash
   # Test Google Cloud Speech-to-Text API
   curl -X POST "https://speech.googleapis.com/v1/speech:recognize" \
     -H "Authorization: Bearer $(gcloud auth print-access-token)" \
     -H "Content-Type: application/json" \
     -d @request.json
   ```

3. **Backend:** Log transcription result
   ```typescript
   console.log("📝 Transcription:", transcription);
   if (!transcription) {
     console.warn("⚠️ Empty transcription!");
   }
   ```

---

## Problem 3: Finalize Button Removed ✅

### What Changed
- ❌ Removed "🏁 Terminar Reporte" button
- ❌ Removed report finalization logic
- ❌ Removed `reportFinalized` state
- ✅ Simplified to focus on feedback collection

### Why
The finalize button was confusing because:
1. It appeared only after submitting feedback
2. It wasn't clear what "finalize" meant
3. The report should be saved when user completes all steps
4. Currently, focus is on collecting feedback, not finalizing

### Current Flow
1. Record audio ✓
2. See transcription ✓
3. Get feedback questions ✓
4. Answer questions ✓
5. Submit feedback ✓
6. See validity score ✓

The report is considered "complete" when all steps are done.

---

## Comprehensive Debugging Checklist

### For Audio Playback Issues

- [ ] Check browser console for "✅ Respuesta del backend"
- [ ] Verify `feedbackQuestionsWithAudio` array has items
- [ ] Check each question has `audioBase64` field
- [ ] Verify `audioBase64` length > 1000 bytes
- [ ] Verify `audioBase64` starts with "//NE"
- [ ] Test ElevenLabs API directly with cURL
- [ ] Check ElevenLabs API key is valid
- [ ] Check voice ID is valid UUID (not a name)
- [ ] Check backend logs for ElevenLabs errors
- [ ] Add try-catch in backend to catch audio errors

### For Transcription Issues

- [ ] Check backend response has `transcription` field
- [ ] Verify transcription is not empty string
- [ ] Check speech-to-text service is configured
- [ ] Test speech-to-text API directly
- [ ] Verify audio file quality (not silent)
- [ ] Check backend logs for transcription errors
- [ ] Verify language setting is correct
- [ ] Add console logs to see state being set
- [ ] Test with clear audio input
- [ ] Check for silent sections in audio

### General Debugging

- [ ] Open DevTools (F12)
- [ ] Go to Console tab
- [ ] Look for red error messages
- [ ] Look for orange warning messages
- [ ] Check Network tab for failed requests
- [ ] Check HTTP response codes (200 = success)
- [ ] Look for 404 (not found), 401 (unauthorized), 500 (server error)

---

## Common Error Messages and Solutions

### "⚠️ No audio found for question"

**Cause:** Backend returned `feedbackQuestions` but not `feedbackQuestionsWithAudio`

**Solution:**
```typescript
// Backend should return BOTH:
return {
  feedbackQuestions: [...],
  feedbackQuestionsWithAudio: [...], // ← This is missing
};
```

### "audioBase64Length: 0"

**Cause:** ElevenLabs didn't generate audio

**Solution:**
1. Check ElevenLabs API key
2. Check voice ID is valid
3. Check text is not empty
4. Check error logs in backend

### "Cannot read property 'audioBase64' of undefined"

**Cause:** Question not found in `feedbackWithAudio` array

**Solution:**
```typescript
// Make sure both arrays match by ID:
const audioQuestion = feedbackWithAudio.find(q => q.id === question.id);
if (!audioQuestion) {
  console.warn(`Question ${question.id} has no audio`);
}
```

### "Transcription is empty"

**Cause:** Speech-to-text returned empty result

**Solution:**
1. Verify audio is not silent
2. Check Google Cloud credentials
3. Verify language setting
4. Try with different audio

---

## Testing with Mock Data

To test without backend, you can mock the response:

```typescript
const mockResponse = {
  success: true,
  reportId: "test-123",
  transcription: "Paciente con fiebre de 38.5°C...",
  analysis: { /* ... */ },
  feedbackQuestions: [
    {
      id: "q1",
      question: "¿Cuál es el diagnóstico?",
      analysis: "Contexto clínico"
    }
  ],
  feedbackQuestionsWithAudio: [
    {
      id: "q1",
      question: "¿Cuál es el diagnóstico?",
      audioBase64: "//NExAA..." // Mock base64
    }
  ]
};

// Then in your code:
setTranscription(mockResponse.transcription);
setFeedbackWithAudio(mockResponse.feedbackQuestionsWithAudio);
```

---

## Tools for Debugging

### 1. Browser DevTools
- F12 or Right-click → Inspect
- Console tab for logs
- Network tab for API requests
- Application tab for localStorage

### 2. Backend Logging
```typescript
console.log("=== DEBUG ===");
console.log("Audio generated:", !!audioBase64);
console.log("Audio length:", audioBase64?.length);
console.log("Transcription:", transcription);
```

### 3. cURL for API Testing
```bash
# Test backend endpoint
curl -X POST http://localhost:3000/reports/upload-audio-with-feedback \
  -F "audio=@recording.wav" \
  -F "patientId=PAT001" \
  -F "doctorId=DOC001" \
  -F "specialty=Emergencia"

# Test ElevenLabs
curl -X POST https://api.elevenlabs.io/v1/text-to-speech/VOICE_ID \
  -H "xi-api-key: KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test"}'
```

### 4. Postman
- Import API endpoints
- Test with different payloads
- Save responses for analysis

---

## When to Contact Support

Document and report:
- [ ] Browser console errors (screenshot)
- [ ] Network tab response (screenshot)
- [ ] Backend logs (full output)
- [ ] Backend response JSON (paste)
- [ ] Steps to reproduce
- [ ] Expected vs actual behavior

---

## Summary

| Issue | Check First | If Still Failing |
|-------|------------|------------------|
| No audio | Backend response has `feedbackQuestionsWithAudio` | ElevenLabs API key and voice ID |
| No transcription | Backend response has `transcription` field | Speech-to-text service and credentials |
| Empty values | Frontend logs show values being set | Backend actually returning data |
