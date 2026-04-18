# 🎵 Audio Playback & Report Finalization - Quick Start Guide

## What's New? 🆕

Two major features have been added to the Reports module:

1. **AudioPlayer Component** - Full-featured audio player for feedback questions
2. **Report Finalization** - New "Terminar Reporte" button to save reports to database

## Getting Started

### 1. Audio Playback

The AudioPlayer component is automatically integrated into the feedback questions section. When the backend returns `feedbackQuestionsWithAudio`, users will see:

```
┌─────────────────────────────────────────┐
│ Pregunta 1 de 5                         │
│ "¿Cuál es el diagnóstico principal?"   │
├─────────────────────────────────────────┤
│ ▶️ ⏱️ 1:23 / 3:45  🔊 ──●── 🔇 P1/5  │  ← AudioPlayer
├─────────────────────────────────────────┤
│ 💡 Contexto: Paciente con síntomas...   │
├─────────────────────────────────────────┤
│ [Escribe tu respuesta...]               │  ← Answer field
└─────────────────────────────────────────┘
```

**What users can do:**
- Click ▶️ to play the question audio
- Drag the timeline to jump to any time
- Adjust volume with the slider
- Click 🔇 to mute
- See current time / total duration

### 2. Report Finalization

After submitting feedback and getting a validity score, users will see a new button:

```
┌──────────────────────────────────────┐
│ [Enviar Retroalimentación] [🏁 Terminar Reporte] │
└──────────────────────────────────────┘
```

Clicking "Terminar Reporte" will:
1. Send `PATCH /reports/:reportId/finalize` to backend
2. Update report status to "procesado"
3. Show final confirmation with details

## Code Overview

### New Files

**`src/features/reports/components/AudioPlayer.tsx`**
- Self-contained audio player component
- Handles base64 MP3 decoding
- Full playback controls
- Error handling built-in

### Modified Files

**`src/features/reports/components/ReportsView.tsx`**
- Integrated AudioPlayer in feedback questions
- Enhanced finalization handler
- Improved final confirmation display

**`src/features/ai/hooks/useAI.ts`**
- Fixed `stopRecording()` return type
- Better type safety

## Using the Features

### For Users

1. **Record audio**: Click 🎤 Iniciar Grabación
2. **Get feedback**: System shows questions with audio
3. **Listen to questions**: Click ▶️ on AudioPlayer
4. **Answer questions**: Type responses in input fields
5. **Submit feedback**: Click "Enviar Retroalimentación"
6. **Review validity**: See score and recommendations
7. **Finalize report**: Click "🏁 Terminar Reporte"
8. **Confirmation**: See detailed completion info

### For Developers

#### Using AudioPlayer in Other Components

```tsx
import { AudioPlayer } from '@/features/reports/components/AudioPlayer';

export function MyComponent() {
  const audioBase64 = "//NExAAhnoIAVgQA..."; // From backend
  
  return (
    <AudioPlayer
      audioBase64={audioBase64}
      questionNumber={1}
      totalQuestions={5}
      className="mb-4"
    />
  );
}
```

#### Checking Report Status

```tsx
// After finalization
const result = await reportsService.finalizeReport(reportId, {
  finalNotes: "Reporte completado por médico"
});

console.log(result.report.estado); // Should be "procesado"
```

## API Integration

### Backend Requirements

The backend should return audio in this format:

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

**Important:** The `audioBase64` must be:
- Valid Base64 encoded string
- MP3 format
- Complete audio data (not truncated)

### Finalization Endpoint

```
PATCH /reports/:reportId/finalize

Request:
{
  "finalNotes": "Optional notes"
}

Response:
{
  "success": true,
  "report": { ...Report },
  "message": "Report finalized successfully"
}
```

## Testing the Features

### Quick Test

1. Navigate to Reports section
2. Click "🎤 Iniciar Grabación"
3. Speak for 5+ seconds (e.g., "Paciente con fiebre, náuseas")
4. Click again to stop
5. Wait for analysis
6. When questions appear, you should see:
   - Question text
   - AudioPlayer (if backend returns audio)
   - Input field
7. Click ▶️ on AudioPlayer to test audio playback
8. Type an answer in the input field
9. Click "Enviar Retroalimentación"
10. After validation, click "🏁 Terminar Reporte"
11. See final confirmation

### Testing Audio Playback

```typescript
// In browser console (after questions load)
console.log(document.querySelector('audio')?.src);
// Should show: blob:http://localhost:5173/...
```

### Testing Finalization

```typescript
// Check if button appears
const button = document.querySelector('[title="🏁 Terminar Reporte"]');
console.log(button?.disabled); // Should be false after feedback submitted
```

## Troubleshooting

### "AudioPlayer not showing"

**Cause:** Backend not returning `feedbackQuestionsWithAudio`

**Solution:** 
- Check backend logs for ElevenLabs errors
- Verify `ELEVENLABS_API_KEY` is set
- Check if voice ID is valid

### "Audio won't play"

**Cause:** Invalid base64 or CORS issue

**Solution:**
- Open DevTools → Console → check for errors
- Verify base64 string length > 1000
- Check browser's audio context is allowed

### "Button not working"

**Cause:** `reportId` not set or network error

**Solution:**
- Check `reportId` in component state: `console.log(reportId)`
- Check Network tab in DevTools for failed requests
- Check backend response for errors

### "Report won't finalize"

**Cause:** Backend endpoint not implemented

**Solution:**
- Verify backend has `/reports/:id/finalize` endpoint
- Check status code (should be 200)
- Check response format matches expected

## Component Props Reference

### AudioPlayer Props

```typescript
interface AudioPlayerProps {
  audioBase64: string;      // Required: Base64 MP3 audio
  questionNumber?: number;  // Optional: Shows "P1/5"
  totalQuestions?: number;  // Optional: Shows "P1/5"
  className?: string;       // Optional: Extra CSS classes
}
```

### Example with All Props

```tsx
<AudioPlayer
  audioBase64={question.audioBase64}
  questionNumber={index + 1}
  totalQuestions={totalQuestions}
  className="mb-3 border border-blue-500"
/>
```

## Performance Tips

1. **Audio files:** Keep under 1MB when base64 encoded
2. **Number of questions:** Typically 3-5 questions for UX
3. **Memory:** Audio URLs are cleaned up on unmount
4. **Caching:** Browser caches blob URLs, so replaying is fast

## Browser Support

Works in all modern browsers:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## File Structure

```
src/features/reports/
├── components/
│   ├── AudioPlayer.tsx          ← New component
│   └── ReportsView.tsx           ← Updated
├── services/
│   └── reports.service.ts        ← No changes needed
└── hooks/
    └── (none)
```

## Key Code Changes

### Before (Old Way)
```tsx
<button onClick={() => playAudio(audioUrl)}>
  <Volume2 size={18} />
</button>
```

### After (New Way)
```tsx
<AudioPlayer
  audioBase64={feedbackWithAudio[idx].audioBase64}
  questionNumber={idx + 1}
  totalQuestions={feedbackQuestions.length}
/>
```

## Next Steps

1. ✅ Frontend is ready
2. ⏳ Backend needs to:
   - Ensure ElevenLabs TTS is working
   - Return `audioBase64` in `feedbackQuestionsWithAudio`
   - Implement `/reports/:id/finalize` endpoint
3. 🧪 Test end-to-end flow
4. 🚀 Deploy to production

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Audio plays but no volume | Check volume slider (🔊) position |
| Timestamp wrong format | Browser auto-handles, just works |
| Skip ahead doesn't work | Audio still loading, wait for ⏱️ |
| Can't finalize report | Check that feedback was submitted first |
| Page slow with audio | Reduce number of questions or audio bitrate |

## Examples

### Complete Flow Example

```tsx
// 1. User records audio
const { startRecording, stopRecording } = useAI();
await startRecording();
// ... user speaks ...
const audioBlob = await stopRecording();

// 2. Backend analyzes
const result = await reportsService.uploadAudioWithFeedback(formData);
setReportId(result.reportId);
setFeedbackQuestions(result.feedbackQuestions);
setFeedbackWithAudio(result.feedbackQuestionsWithAudio); // Has audio!

// 3. Render with AudioPlayer (automatic via ReportsView)
// AudioPlayer handles audio playback
// Component shows: Play button, timeline, volume, etc.

// 4. User answers questions
const answers = [
  { questionId: 'q1', answer: 'Infección respiratoria' },
  { questionId: 'q2', answer: 'Sí' },
];

// 5. Submit feedback
const feedback = await reportsService.submitFeedback(reportId, {
  responses: answers
});
setValidityScore(feedback.validityScore);

// 6. Finalize report
const finalized = await reportsService.finalizeReport(reportId, {
  finalNotes: "Completado"
});
// Show confirmation
```

## More Resources

- **Full Documentation**: See `docs/AUDIO_AND_FINALIZE_IMPLEMENTATION.md`
- **Implementation Summary**: See `IMPLEMENTATION_SUMMARY.md`
- **API Reference**: See backend documentation
- **Code Comments**: Check `AudioPlayer.tsx` for detailed comments

## Support

If you encounter issues:

1. Check browser console for errors (F12)
2. Check Network tab for failed requests
3. Check backend logs for API errors
4. Read the full documentation in `docs/` folder
5. Review error messages carefully

---

**Status**: ✅ Ready to use
**Last Updated**: 2024
**Version**: 1.0.0
