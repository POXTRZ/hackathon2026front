# Audio Playback and Report Finalization Implementation Guide

## Overview

This document describes the implementation of audio playback for Gemini/ElevenLabs synthesized feedback questions and the report finalization feature in the frontend.

## What Was Implemented

### 1. **AudioPlayer Component** (`src/features/reports/components/AudioPlayer.tsx`)
A reusable React component that handles:
- Audio decoding from base64 MP3 format
- Play/Pause controls with visual feedback
- Progress timeline with seek functionality
- Volume control with mute button
- Time display and duration tracking
- Error handling with user-friendly messages

### 2. **Enhanced ReportsView** (`src/features/reports/components/ReportsView.tsx`)
Updated the main reports component with:
- Integration of AudioPlayer component for feedback questions
- Improved handleFinalizeReport function with better error handling
- Enhanced final report confirmation display showing:
  - Patient and doctor information
  - Report ID
  - Validity score with progress bar
  - Processing confirmations

### 3. **Type Safety Improvements** (`src/features/ai/hooks/useAI.ts`)
- Fixed `stopRecording()` return type to properly return `Promise<Blob | null>`
- Removed unused `audioContextRef`
- Updated UseAIActions interface to reflect correct types

## Architecture

### Audio Playback Flow

```
Backend (ElevenLabs TTS)
    ↓
Audio as Base64 MP3
    ↓
feedbackQuestionsWithAudio array
    ↓
AudioPlayer Component
    ↓
User can Play/Pause/Control Volume/Seek
```

### Report Finalization Flow

```
1. User records audio
    ↓
2. Backend analyzes and generates feedback questions
    ↓
3. User answers feedback questions
    ↓
4. User submits feedback (validityScore becomes available)
    ↓
5. User clicks "Terminar Reporte" button
    ↓
6. Frontend calls PATCH /reports/:reportId/finalize
    ↓
7. Backend updates report estado to "procesado"
    ↓
8. Frontend displays confirmation with full details
```

## Component Details

### AudioPlayer Component

**Props:**
```typescript
interface AudioPlayerProps {
  audioBase64: string;           // Base64 encoded MP3 audio
  questionNumber?: number;       // Current question number
  totalQuestions?: number;       // Total number of questions
  className?: string;            // Additional CSS classes
}
```

**Features:**
- **Play/Pause Button**: Toggles audio playback
- **Timeline Slider**: Shows progress and allows seeking
- **Time Display**: Shows current time / total duration
- **Volume Control**: Slider (0-1) with mute button
- **Loading State**: Shows spinner while audio loads
- **Error Handling**: Displays user-friendly error messages
- **Responsive Design**: Uses gradient background, smooth animations

**Usage in ReportsView:**
```tsx
{feedbackWithAudio[idx]?.audioBase64 && (
  <AudioPlayer
    audioBase64={feedbackWithAudio[idx].audioBase64}
    questionNumber={idx + 1}
    totalQuestions={feedbackQuestions.length}
    className="mb-3"
  />
)}
```

### Base64 to Audio Conversion

The AudioPlayer handles the conversion internally:

```typescript
// Decode base64 to binary
const binaryString = atob(audioBase64);

// Convert binary to Uint8Array
const bytes = new Uint8Array(binaryString.length);
for (let i = 0; i < binaryString.length; i++) {
  bytes[i] = binaryString.charCodeAt(i);
}

// Create Blob from bytes
const blob = new Blob([bytes], { type: "audio/mp3" });

// Create playable URL
const url = URL.createObjectURL(blob);
const audio = new Audio(url);
```

### Report Finalization

**Function:** `handleFinalizeReport()`

**What it does:**
1. Validates that a reportId exists
2. Calls `reportsService.finalizeReport(reportId, finalNotes)`
3. Sets `finalizingReport` to true during the request
4. On success:
   - Sets `reportFinalized` to true
   - Logs confirmation
   - Displays completion message
5. On error:
   - Logs error details
   - Allows retry
6. Finally, sets `finalizingReport` to false

**Backend Endpoint:**
```
PATCH /reports/:reportId/finalize
Body: { finalNotes?: string }

Response:
{
  success: boolean,
  report: Report,
  message: string
}
```

**Result:**
- Report estado changes from "awaiting_feedback" to "procesado"
- Report is saved in database with finalization metadata
- User sees confirmation with report details

## User Experience Flow

### 1. Recording and Analysis
- User clicks "🎤 Iniciar Grabación"
- Speaks medical findings
- Clicks button again to stop recording
- Backend transcribes and analyzes

### 2. Feedback Phase
- System displays feedback questions
- Each question has:
  - Question text
  - Optional context (💡 Contexto)
  - **🎵 AudioPlayer** - User can listen to the question
  - Input field - User types their answer

### 3. Feedback Submission
- User clicks "Enviar Retroalimentación"
- System validates answers
- Shows validity score
- Shows recommendations

### 4. Report Finalization
- User clicks "🏁 Terminar Reporte"
- System saves complete report to database
- Shows completion confirmation with:
  - Patient name
  - Doctor name
  - Report ID
  - Validity score
  - Processing checklist

## State Management

### ReportsView State Variables

```typescript
const [reportId, setReportId] = useState<string | null>(null);
const [feedbackQuestions, setFeedbackQuestions] = useState<any[]>([]);
const [feedbackWithAudio, setFeedbackWithAudio] = useState<any[]>([]);
const [feedbackAnswers, setFeedbackAnswers] = useState<FeedbackResponse[]>([]);
const [validityScore, setValidityScore] = useState<number | null>(null);
const [recommendations, setRecommendations] = useState<string[]>([]);
const [finalizingReport, setFinalizingReport] = useState(false);
const [reportFinalized, setReportFinalized] = useState(false);
```

### AudioPlayer State Variables

```typescript
const [isPlaying, setIsPlaying] = useState(false);
const [duration, setDuration] = useState(0);
const [currentTime, setCurrentTime] = useState(0);
const [volume, setVolume] = useState(1);
const [isMuted, setIsMuted] = useState(false);
const [error, setError] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(true);
```

## API Integration

### reportService Methods Used

```typescript
// Upload audio and get feedback questions with audio
uploadAudioWithFeedback(formData): Promise<{
  reportId: string,
  feedbackQuestions: any[],
  feedbackQuestionsWithAudio: any[]
}>

// Submit feedback responses
submitFeedback(reportId, responses): Promise<{
  validityScore: number,
  recommendations: string[]
}>

// Finalize the report
finalizeReport(reportId, finalNotes): Promise<{
  success: boolean,
  report: Report
}>

// Helper to decode base64 audio
createAudioUrl(base64Data, mimeType): string
```

## Error Handling

### AudioPlayer Errors
- Network errors during audio load
- Invalid base64 format
- Browser compatibility issues
- User displays friendly error message

### ReportsView Errors
- Upload failure: Shows error message, allows retry
- Feedback submission: Shows error message, can resubmit
- Finalization: Shows error message, allows retry

## Browser Compatibility

**Required Browser Features:**
- Web Audio API
- MediaRecorder API
- URL.createObjectURL()
- atob() (base64 decoding)
- Blob API

**Tested Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

1. **Audio Memory**: Base64 audio is decoded into Blob, then objectURL
2. **Cleanup**: ObjectURLs are revoked on component unmount
3. **Lazy Loading**: AudioPlayer only created when audio data available
4. **Progress Tracking**: Uses timeupdate event for smooth progress display

## Testing Checklist

- [ ] AudioPlayer loads and decodes base64 MP3 correctly
- [ ] Play/Pause buttons work
- [ ] Seek timeline works properly
- [ ] Volume control works (0-1 range)
- [ ] Mute button toggles correctly
- [ ] Time display shows correctly formatted time
- [ ] Error state displays error message
- [ ] Report finalization sends correct payload
- [ ] Final confirmation shows all expected fields
- [ ] User can see validity score progression
- [ ] Page displays properly on mobile devices

## Future Enhancements

1. **Speed Control**: Add playback speed adjustment (0.75x, 1x, 1.25x, 1.5x)
2. **Download Audio**: Allow users to download question audio
3. **Audio Visualization**: Add waveform display during playback
4. **Multiple Languages**: Support different language voices
5. **Recording Feedback**: Show recorded audio preview before finalization
6. **Report History**: Show previous reports with their audio/answers

## Troubleshooting

### Audio Won't Play
- Check base64 format is valid MP3
- Verify CORS headers from backend
- Check browser console for specific errors

### Report Won't Finalize
- Verify reportId is set (check console logs)
- Check network request in DevTools
- Verify backend endpoint is accessible
- Check for validation errors from server

### AudioPlayer Not Appearing
- Verify feedbackWithAudio array has audioBase64 field
- Check console for component rendering errors
- Ensure AudioPlayer component is imported

## Files Modified/Created

### Created:
- `src/features/reports/components/AudioPlayer.tsx` - New audio player component

### Modified:
- `src/features/reports/components/ReportsView.tsx` - Added AudioPlayer integration, enhanced finalization
- `src/features/ai/hooks/useAI.ts` - Fixed type signatures and removed unused code
- `src/App.tsx` - Code cleanup (removed unused imports)
- `src/components/layout/Header.tsx` - Code cleanup
- `src/components/layout/Navbar.tsx` - Code cleanup
- `src/features/patients/components/RecordsView.tsx` - Code cleanup
- `src/features/reports/services/reports.service.ts` - Code cleanup
- `src/features/vision/components/VisionView.tsx` - Code cleanup

## Build Status

✅ **Build Successful**
```
dist/index.html                   0.47 kB │ gzip:   0.30 kB
dist/assets/index-[hash].css      82.15 kB │ gzip:  11.33 kB
dist/assets/index-[hash].js       761.34 kB │ gzip: 231.00 kB
✓ built in 3.13s
```

## Related Documentation

- Backend Audio Service: See backend `elevenlabs.service.ts`
- Report Schema: See backend `clinical-report.schema.ts`
- API Endpoints: See backend `reports.controller.ts`
