/**
 * Lark UI instrument → Audiotool Nexus device type.
 * Piano/Guitar use Gakki (soundfont player) — not Heisenberg (synth).
 */
export const NEXUS_DEVICE_BY_INSTRUMENT = {
  Piano: 'gakki',
  Bass: 'bassline',
  Drums: 'beatbox8',
  Guitar: 'gakki',
};

/** Gakki soundfont IDs from Audiotool Nexus defaults. */
export const GAKKI_SOUNDFONT_ID = {
  piano: 'ce79731c-f100-4f54-9ccc-2d2c60269483',
  guitar: '56ada375-bc78-4912-b447-d80e06457a80',
};

const GAKKI_SOUNDFONT_BY_INSTRUMENT = {
  Piano: GAKKI_SOUNDFONT_ID.piano,
  Guitar: GAKKI_SOUNDFONT_ID.guitar,
};

/** Options passed to `t.create(deviceType, …)` for a Lark transform. */
export function nexusDeviceCreateOptions(instrument, { label, positionX, positionY }) {
  const deviceType = NEXUS_DEVICE_BY_INSTRUMENT[instrument] ?? 'gakki';
  const options = {
    displayName: label,
    positionX,
    positionY,
    isActive: true,
  };

  if (deviceType === 'gakki') {
    options.soundfontId = GAKKI_SOUNDFONT_BY_INSTRUMENT[instrument]
      ?? GAKKI_SOUNDFONT_ID.piano;
    options.gain = 0.7;
  }

  return { deviceType, options };
}

/** Human-readable Studio device name (plugin window title). */
export function studioDeviceName(instrument) {
  const type = NEXUS_DEVICE_BY_INSTRUMENT[instrument];
  if (type === 'gakki') return 'Gakki';
  if (type === 'bassline') return 'Bassline';
  if (type === 'beatbox8') return 'Beatbox 8';
  if (type === 'heisenberg') return 'Heisenberg';
  return type ?? 'device';
}

const MOOD_STYLE = {
  Calm: 'soft, gentle dynamics, spacious mix',
  Rock: 'driving energy, punchy rhythm, bold tone',
  Melancholic: 'minor tonality, emotional, subdued brightness',
  Energetic: 'bright, upbeat, lively rhythm and forward motion',
};

export function buildElevenLabsMusicPrompt(instrument, mood) {
  const style = MOOD_STYLE[mood] ?? 'balanced studio mix';
  return [
    `Short instrumental ${instrument} sketch, ${style}.`,
    'One simple monophonic melody, steady tempo, no drums unless target is drums.',
    'No vocals. Studio mix, dry enough to layer in a DAW.',
  ].join(' ');
}

export function buildElevenLabsLayerPrompt({ instrument, mood, layerType, bpm }) {
  const style = MOOD_STYLE[mood] ?? 'balanced studio mix';
  const rhythmHint = Number.isFinite(bpm) ? `around ${Math.round(bpm)} BPM` : 'steady tempo';
  return [
    `Create one ${layerType} layer for a ${instrument} idea, ${style}, ${rhythmHint}.`,
    'No lead vocals, no spoken words.',
    'Designed to sit underneath an existing melody in a DAW.',
  ].join(' ');
}

export function deviceLabel(instrument, mood) {
  const parts = ['Lark', instrument];
  if (mood) parts.push(mood);
  return parts.join(' · ');
}
