import {
  ELEVENLABS_API_BASE,
  ELEVENLABS_API_KEY,
} from '@/lib/elevenlabs-config';
import {
  buildElevenLabsLayerPrompt,
  buildElevenLabsMusicPrompt,
} from '@/lib/lark-instruments';

function apiHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (ELEVENLABS_API_KEY) {
    headers['xi-api-key'] = ELEVENLABS_API_KEY;
  }
  return headers;
}

export async function fetchAudioBlob(sourceUrl, existingBlob = null) {
  if (existingBlob instanceof Blob && existingBlob.size > 0) {
    return existingBlob;
  }
  if (!sourceUrl) {
    throw new Error('Record or import humming first.');
  }
  try {
    const res = await fetch(sourceUrl);
    if (!res.ok) {
      throw new Error('Could not load your recording.');
    }
    const blob = await res.blob();
    if (!blob?.size) {
      throw new Error('Recording is empty. Record or import again.');
    }
    return blob;
  } catch (err) {
    if (existingBlob instanceof Blob && existingBlob.size > 0) {
      return existingBlob;
    }
    const message = err instanceof Error ? err.message : 'Could not load your recording.';
    throw new Error(message);
  }
}

/** Duration in ms; falls back to 8s if metadata is missing. */
export function getAudioDurationMs(blob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      const seconds = audio.duration;
      URL.revokeObjectURL(url);
      if (Number.isFinite(seconds) && seconds > 0) {
        resolve(Math.round(seconds * 1000));
      } else {
        resolve(8000);
      }
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(8000);
    };
    audio.src = url;
  });
}

/**
 * Generate instrumental audio from instrument + mood (ElevenLabs Music API).
 * Uses your humming length as target duration; melody is interpreted via prompt.
 */
export async function composeInstrumentalFromHumming({
  instrument,
  mood,
  durationMs,
}) {
  if (!ELEVENLABS_API_KEY && !import.meta.env.DEV) {
    throw new Error('ElevenLabs API key is not configured.');
  }

  const musicLengthMs = Math.min(600_000, Math.max(3_000, Math.round(durationMs)));
  const prompt = buildElevenLabsMusicPrompt(instrument, mood);

  const url = `${ELEVENLABS_API_BASE}/v1/music?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({
      prompt,
      music_length_ms: musicLengthMs,
      model_id: 'music_v1',
      force_instrumental: true,
    }),
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const json = await res.json();
      detail = json?.detail?.[0]?.msg ?? json?.message ?? JSON.stringify(json);
    } catch {
      try {
        detail = await res.text();
      } catch {
        // keep statusText
      }
    }
    throw new Error(`ElevenLabs (${res.status}): ${detail}`);
  }

  const blob = await res.blob();
  if (!blob.size) {
    throw new Error('ElevenLabs returned empty audio.');
  }
  return blob;
}

async function composeLayerFromPrompt(prompt, durationMs) {
  if (!ELEVENLABS_API_KEY && !import.meta.env.DEV) {
    throw new Error('ElevenLabs API key is not configured.');
  }

  const musicLengthMs = Math.min(180_000, Math.max(3_000, Math.round(durationMs)));
  const url = `${ELEVENLABS_API_BASE}/v1/music?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({
      prompt,
      music_length_ms: musicLengthMs,
      model_id: 'music_v1',
      force_instrumental: true,
    }),
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const json = await res.json();
      detail = json?.detail?.[0]?.msg ?? json?.message ?? JSON.stringify(json);
    } catch {
      try {
        detail = await res.text();
      } catch {
        // keep statusText
      }
    }
    throw new Error(`ElevenLabs (${res.status}): ${detail}`);
  }

  const blob = await res.blob();
  if (!blob.size) {
    throw new Error('ElevenLabs returned empty layer audio.');
  }
  return blob;
}

export async function composeMoodLayers({
  instrument,
  mood,
  bpm,
  durationMs,
  layerTypes = ['pad texture', 'percussion bed', 'counter melody'],
}) {
  const layers = [];
  for (const layerType of layerTypes) {
    const prompt = buildElevenLabsLayerPrompt({
      instrument,
      mood,
      layerType,
      bpm,
    });
    const blob = await composeLayerFromPrompt(prompt, durationMs);
    layers.push({
      id: `${Date.now()}-${layerType.replace(/\s+/g, '-')}`,
      label: layerType,
      prompt,
      blob,
      url: URL.createObjectURL(blob),
    });
  }
  return layers;
}
