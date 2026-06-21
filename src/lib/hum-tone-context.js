/** Build ElevenLabs prompt hints from a Basic Pitch transcription. */
export function humToneContextFromTranscription(transcription) {
  const notePlans = transcription?.notePlans ?? [];
  const bpm = transcription?.bpm ?? null;

  if (!notePlans.length) {
    return { bpm, noteCount: 0 };
  }

  const pitches = notePlans.map((n) => n.pitch);
  const pitchMin = Math.min(...pitches);
  const pitchMax = Math.max(...pitches);
  const pitchCenter = Math.round(pitches.reduce((sum, p) => sum + p, 0) / pitches.length);

  return {
    bpm,
    noteCount: notePlans.length,
    pitchMin,
    pitchMax,
    pitchCenter,
    melodicHint: `hummed melody spanning MIDI notes ${pitchMin}–${pitchMax}, roughly ${notePlans.length} notes`,
  };
}
