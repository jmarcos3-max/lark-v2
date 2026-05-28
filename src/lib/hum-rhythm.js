const DEFAULT_BPM = 120;
const FRAME = 1024;
const HOP = 512;
const MIN_ONSET_GAP_SEC = 0.07;

function mixToMono(buffer) {
  const { length, numberOfChannels, sampleRate } = buffer;
  if (numberOfChannels === 1) {
    return { samples: buffer.getChannelData(0), sampleRate };
  }
  const mono = new Float32Array(length);
  for (let c = 0; c < numberOfChannels; c++) {
    const ch = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) {
      mono[i] += ch[i] / numberOfChannels;
    }
  }
  return { samples: mono, sampleRate };
}

function estimateBpmFromOnsets(onsets) {
  if (onsets.length < 3) return DEFAULT_BPM;
  const intervals = [];
  for (let i = 1; i < onsets.length; i++) {
    const dt = onsets[i].timeSec - onsets[i - 1].timeSec;
    if (dt > 0.18 && dt < 2.5) intervals.push(dt);
  }
  if (!intervals.length) return DEFAULT_BPM;
  intervals.sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)];
  let bpm = Math.round(60 / median);
  while (bpm < 60) bpm *= 2;
  while (bpm > 180) bpm /= 2;
  return Math.min(180, Math.max(60, bpm));
}

function mergeCloseOnsets(onsets) {
  const out = [];
  for (const o of onsets) {
    const last = out[out.length - 1];
    if (last && o.timeSec - last.timeSec < MIN_ONSET_GAP_SEC) {
      if (o.strength > last.strength) out[out.length - 1] = o;
    } else {
      out.push(o);
    }
  }
  return out;
}

function fallbackGrid(durationSec, bpm) {
  const beatSec = 60 / bpm;
  const grid = [];
  for (let t = 0; t < durationSec - 0.05; t += beatSec) {
    grid.push({ timeSec: t, strength: 0.55 });
  }
  return grid;
}

/**
 * Detect rhythmic onsets in a humming recording (energy peaks).
 * @returns {{ onsets: { timeSec: number, strength: number }[], bpm: number, durationSec: number }}
 */
export async function analyzeRhythmFromBlob(blob) {
  const ctx = new AudioContext();
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const { samples, sampleRate } = mixToMono(buffer);
    const durationSec = buffer.duration;

    const energies = [];
    for (let i = 0; i + FRAME < samples.length; i += HOP) {
      let sum = 0;
      for (let j = 0; j < FRAME; j++) {
        const s = samples[i + j];
        sum += s * s;
      }
      energies.push(Math.sqrt(sum / FRAME));
    }

    const sorted = [...energies].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
    const threshold = Math.max(0.008, median * 2.8);

    const raw = [];
    for (let i = 1; i < energies.length - 1; i++) {
      const e = energies[i];
      if (e > threshold && e >= energies[i - 1] && e >= energies[i + 1]) {
        raw.push({
          timeSec: (i * HOP) / sampleRate,
          strength: Math.min(1, e / (threshold * 1.8)),
        });
      }
    }

    let onsets = mergeCloseOnsets(raw);
    let bpm = estimateBpmFromOnsets(onsets);
    if (onsets.length < 2) {
      onsets = fallbackGrid(durationSec, bpm);
    }

    return { onsets, bpm, durationSec };
  } finally {
    await ctx.close();
  }
}
