/**
 * Lark UI instrument → Audiotool Nexus device type.
 * Primary targets + optional Studio layers share this map.
 */

export const NEXUS_DEVICE_BY_INSTRUMENT = {
  Piano: 'gakki',
  Guitar: 'gakki',
  Bass: 'bassline',
  Drums: 'beatbox8',
  Synth: 'heisenberg',
  Analog: 'pulverisateur',
  Pad: 'space',
  '909': 'beatbox9',
  Sampler: 'machiniste',
  Arp: 'matrixArpeggiator',
  Matrix: 'tonematrix',
};

/** Studio plugin window title for each Nexus device type. */
export const NEXUS_DEVICE_DISPLAY_NAME = {
  gakki: 'Gakki',
  bassline: 'Bassline',
  beatbox8: 'Beatbox 8',
  beatbox9: 'Beatbox 9',
  heisenberg: 'Heisenberg',
  pulverisateur: 'Pulverisateur',
  space: 'Space',
  machiniste: 'Machiniste',
  matrixArpeggiator: 'Matrix Arpeggiator',
  tonematrix: 'Tonematrix',
};

/** Drum targets — hum pitch is mapped to kick/snare/hat MIDI. */
export const DRUM_INSTRUMENTS = new Set(['Drums', '909']);

export function isDrumInstrument(instrument) {
  return DRUM_INSTRUMENTS.has(instrument);
}

/** What you hummed — one primary lead in Studio. */
export const TARGET_INSTRUMENTS = [
  { value: 'Piano', icon: '🎹', supportsAudiotool: true, supportsElevenLabs: true },
  { value: 'Guitar', icon: '🎵', supportsAudiotool: true, supportsElevenLabs: true },
  { value: 'Bass', icon: '🎸', supportsAudiotool: true, supportsElevenLabs: true },
  { value: 'Drums', icon: '🥁', supportsAudiotool: true, supportsElevenLabs: true },
];

/**
 * Optional Nexus tracks written alongside the primary on transform.
 * `hideWhenPrimary` skips redundant layers (e.g. Bass layer when lead is Bass).
 */
export const STUDIO_LAYERS = [
  { value: 'Pad', icon: '🌌', hideWhenPrimary: null },
  { value: 'Bass', icon: '🎸', hideWhenPrimary: 'Bass' },
  { value: 'Arp', icon: '✨', hideWhenPrimary: null },
  { value: 'Synth', icon: '🎛️', hideWhenPrimary: null },
  { value: '909', icon: '🪘', hideWhenPrimary: 'Drums' },
];

export function availableStudioLayers(primaryInstrument) {
  return STUDIO_LAYERS.filter(
    (layer) => !layer.hideWhenPrimary || layer.hideWhenPrimary !== primaryInstrument,
  );
}

export function sanitizeStudioLayers(layers, primaryInstrument) {
  const allowed = new Set(availableStudioLayers(primaryInstrument).map((l) => l.value));
  return (layers ?? []).filter((layer) => allowed.has(layer));
}

/** ElevenLabs mood layer types (MP3, preview + optional Studio import). */
export const WOW_PASS_LAYERS = [
  { value: 'hook double', icon: '🎵', defaultOn: true },
  { value: 'pad bed', icon: '🌌', defaultOn: false },
  { value: 'riser', icon: '📈', defaultOn: true },
  { value: 'texture', icon: '✨', defaultOn: false },
  { value: 'sub pulse', icon: '🔉', defaultOn: false },
  { value: 'impact', icon: '💥', defaultOn: true },
];

export function defaultWowPassLayerTypes() {
  return WOW_PASS_LAYERS.filter((layer) => layer.defaultOn).map((layer) => layer.value);
}

export function sanitizeWowPassLayers(layers) {
  const allowed = new Set(WOW_PASS_LAYERS.map((layer) => layer.value));
  return (layers ?? []).filter((layer) => allowed.has(layer));
}

export function wowPassLayerDurationMs(layerType, humDurationMs) {
  const durationMs = humDurationMs ?? 8000;
  switch (layerType) {
    case 'hook double':
      return Math.min(Math.max(durationMs * 0.9, 6000), 22000);
    case 'pad bed':
      return Math.min(Math.max(durationMs * 0.95, 8000), 30000);
    case 'riser':
      return 5000;
    case 'texture':
      return Math.min(Math.max(durationMs * 0.5, 4000), 12000);
    case 'sub pulse':
      return 4000;
    case 'impact':
      return 3000;
    default:
      return Math.min(Math.max(durationMs, 3000), 22000);
  }
}

/** Devices that output MIDI only — Lark adds a synth voice + note cable. */
export const NOTE_CHAIN_VOICE_BY_DEVICE = {
  matrixArpeggiator: 'heisenberg',
};

export function deviceNeedsNoteChainVoice(deviceType) {
  return deviceType in NOTE_CHAIN_VOICE_BY_DEVICE;
}

export function noteChainVoiceType(deviceType) {
  return NOTE_CHAIN_VOICE_BY_DEVICE[deviceType] ?? null;
}

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
  } else if (deviceType !== 'tonematrix' && deviceType !== 'matrixArpeggiator') {
    options.gain = 0.7;
  }

  return { deviceType, options };
}

/** Human-readable Studio device name (plugin window title). */
export function studioDeviceName(instrument) {
  const type = NEXUS_DEVICE_BY_INSTRUMENT[instrument];
  return NEXUS_DEVICE_DISPLAY_NAME[type] ?? type ?? 'device';
}

export function deviceLabel(instrument, mood) {
  const parts = ['Lark', instrument];
  if (mood) parts.push(mood);
  return parts.join(' · ');
}

export function layerDeviceLabel(layer, mood) {
  const parts = ['Lark', layer];
  if (mood) parts.push(mood);
  return parts.join(' · ');
}

const MOOD_STYLE = {
  Calm: 'soft, gentle dynamics, spacious mix',
  Rock: 'driving energy, punchy rhythm, bold tone',
  Melancholic: 'minor tonality, emotional, subdued brightness',
  Energetic: 'bright, upbeat, lively rhythm and forward motion',
};

const ELEVENLABS_INSTRUMENT_LABEL = {
  Synth: 'synthesizer',
  Analog: 'analog synthesizer',
  Pad: 'synth pad',
  '909': '909 drum machine',
  Sampler: 'sampler',
  Arp: 'arpeggiated synthesizer',
  Matrix: 'step sequencer melody',
};

export function buildElevenLabsMusicPrompt(instrument, mood) {
  const style = MOOD_STYLE[mood] ?? 'balanced studio mix';
  const label = ELEVENLABS_INSTRUMENT_LABEL[instrument] ?? instrument.toLowerCase();
  return [
    `Short instrumental ${label} sketch, ${style}.`,
    'One simple monophonic melody, steady tempo, no drums unless target is drums.',
    'No vocals. Studio mix, dry enough to layer in a DAW.',
  ].join(' ');
}

export function buildElevenLabsLayerPrompt({ instrument, mood, layerType, bpm, humContext }) {
  const style = MOOD_STYLE[mood] ?? 'balanced studio mix';
  const rhythmHint = Number.isFinite(humContext?.bpm ?? bpm)
    ? `around ${Math.round(humContext?.bpm ?? bpm)} BPM`
    : Number.isFinite(bpm)
      ? `around ${Math.round(bpm)} BPM`
      : 'steady tempo';
  const label = ELEVENLABS_INSTRUMENT_LABEL[instrument] ?? instrument.toLowerCase();
  const assetIntent = {
    'hook double': 'a catchy melodic support line that reinforces the hook',
    'pad bed': 'a wide ambient pad bed that fills space under the melody',
    riser: 'a transition riser that builds tension into the next phrase',
    texture: 'a subtle rhythmic texture and ear candy layer',
    'sub pulse': 'a low sub pulse that reinforces the downbeat',
    impact: 'a short impact hit for downbeats and section starts',
  }[layerType] ?? `one ${layerType} layer`;

  const toneHint = humContext?.melodicHint
    ? `Layer with a ${label} that complements a ${humContext.melodicHint}. Match its tempo (${rhythmHint}) and register.`
    : `Layer with a ${label} idea, ${style}, ${rhythmHint}.`;

  return [
    `Create ${assetIntent}. ${toneHint}`,
    'No lead vocals, no spoken words.',
    'Make it exciting and polished, designed to stack on top of an existing hum recording in a DAW.',
  ].join(' ');
}
