import { Ticks } from '@audiotool/nexus/utils';
import { getAudioDurationMs } from '@/lib/elevenlabs-api';
import {
  MOOD_LAYERS_NAME,
  MOOD_LAYERS_STUDIO_PREFIX,
  MOOD_LAYERS_STUDIO_PREFIX_LEGACY,
} from '@/lib/lark-copy';
import { moodLayerImportScopeHint } from '@/lib/audiotool-scope';

/** @deprecated Use MOOD_LAYERS_STUDIO_PREFIX */
export const LARK_WOW_PREFIX = MOOD_LAYERS_STUDIO_PREFIX;
const LARK_WOW_PREFIX_LEGACY = 'Lark · Wow · ';

function displayNameOf(entity) {
  const field = entity?.fields?.displayName;
  return field?.value ?? field ?? '';
}

function isLarkMoodLayerDeviceName(name) {
  return typeof name === 'string'
    && (
      name.startsWith(MOOD_LAYERS_STUDIO_PREFIX)
      || name.startsWith(MOOD_LAYERS_STUDIO_PREFIX_LEGACY)
      || name.startsWith(LARK_WOW_PREFIX_LEGACY)
    );
}

/** Prior ElevenLabs mood-layer audio devices written by Lark. */
export function findLarkWowAudioDevices(nexusDoc) {
  const devices = nexusDoc.queryEntities?.ofTypes('audioDevice')?.get?.() ?? [];
  return devices.filter((device) => isLarkMoodLayerDeviceName(displayNameOf(device)));
}

export function wowStudioDisplayName(layerLabel) {
  const safe = String(layerLabel ?? 'layer')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return `${MOOD_LAYERS_STUDIO_PREFIX}${safe || 'layer'}`.slice(0, 120);
}

/** Audiotool expects a real audio file — wrap ElevenLabs blobs as named MP3 Files. */
export function prepareMp3UploadFile(blob, layerLabel) {
  const slug = String(layerLabel ?? 'layer')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .toLowerCase() || 'layer';
  const type = blob?.type && blob.type !== 'application/octet-stream'
    ? blob.type
    : 'audio/mpeg';

  if (blob instanceof File && blob.size > 0) {
    const name = blob.name?.endsWith('.mp3') ? blob.name : `${slug}.mp3`;
    if (blob.type && blob.type !== 'application/octet-stream') return blob;
    return new File([blob], name, { type });
  }

  return new File([blob], `${slug}.mp3`, { type });
}

async function readLocalDurationSeconds(file) {
  if (typeof AudioContext !== 'undefined') {
    const context = new AudioContext();
    try {
      const decoded = await context.decodeAudioData(await file.arrayBuffer());
      if (Number.isFinite(decoded.duration) && decoded.duration > 0) {
        return decoded.duration;
      }
    } catch {
      // fall back to HTMLAudioElement metadata
    } finally {
      await context.close();
    }
  }
  return (await getAudioDurationMs(file)) / 1000;
}

function formatAudiotoolUploadError(err, layerLabel) {
  const parts = [];
  if (err instanceof Error) {
    parts.push(err.message);
    if (err.cause instanceof Error) parts.push(err.cause.message);
  } else {
    parts.push(String(err));
  }
  const text = parts.filter(Boolean).join(' — ');
  if (/permission_denied|insufficient rights|insufficient_permissions|grpc code 7/i.test(text)) {
    return `${MOOD_LAYERS_NAME} import was denied (${text}). ${moodLayerImportScopeHint()}`;
  }
  if (text.includes('createSample')) {
    return (
      `Audiotool rejected the "${layerLabel}" sample (${text}). `
      + moodLayerImportScopeHint()
    );
  }
  return `Upload failed for ${layerLabel}: ${text}`;
}

async function uploadLayerSample(samplesApi, { file, displayName, bpm }) {
  const baseOptions = {
    file,
    displayName,
    preventTabClose: true,
    tags: ['sample'],
    visibility: 'unlisted',
  };

  const normalizedBpm = Number.isFinite(bpm) && bpm > 0 ? Math.round(bpm) : undefined;
  const attempts = normalizedBpm
    ? [{ ...baseOptions, bpm: normalizedBpm }, baseOptions]
    : [baseOptions];

  let lastError = null;
  for (const options of attempts) {
    const upload = await samplesApi.upload(options);
    if (!(upload instanceof Error)) {
      return upload;
    }
    lastError = upload;
  }

  throw new Error(formatAudiotoolUploadError(lastError, displayName));
}

/**
 * Upload ElevenLabs MP3 layers to Audiotool and insert them on the timeline.
 * @param {import('@audiotool/nexus').AudiotoolClient['samples']} samplesApi
 * @param {import('@audiotool/nexus').SyncedDocument} nexusDoc
 */
export async function importWowLayersToStudio(samplesApi, nexusDoc, {
  layers = [],
  bpm,
  replaceExisting = true,
  onProgress,
} = {}) {
  if (!samplesApi?.upload) {
    throw new Error('Audiotool sample upload is unavailable. Sign in and try again.');
  }
  if (!nexusDoc?.modify) {
    throw new Error('Open an Audiotool project first (Step 2).');
  }

  const importable = layers.filter((layer) => layer?.blob?.size > 0);
  if (!importable.length) {
    throw new Error(`No ${MOOD_LAYERS_NAME} to import. Generate ${MOOD_LAYERS_NAME} first.`);
  }

  if (replaceExisting) {
    const existing = findLarkWowAudioDevices(nexusDoc);
    if (existing.length) {
      await nexusDoc.modify((t) => {
        for (const device of existing) {
          try {
            t.removeWithDependencies(device);
          } catch {
            // ignore stale entities
          }
        }
      });
    }
  }

  const imported = [];

  for (let index = 0; index < importable.length; index += 1) {
    const layer = importable[index];
    onProgress?.(`Uploading ${layer.label} (${index + 1}/${importable.length})…`);

    const displayName = wowStudioDisplayName(layer.label);
    const file = prepareMp3UploadFile(layer.blob, layer.label);
    const upload = await uploadLayerSample(samplesApi, { file, displayName, bpm });

    const uploaded = await upload.uploaded;
    if (uploaded instanceof Error) {
      throw new Error(formatAudiotoolUploadError(uploaded, layer.label));
    }

    const durationSeconds = await readLocalDurationSeconds(file);
    const normalizedBpm = Number.isFinite(bpm) && bpm > 0 ? Math.round(bpm) : undefined;

    const sampleInsert = {
      name: upload.name,
      durationSeconds,
      ...(normalizedBpm ? { bpm: normalizedBpm } : {}),
    };

    await nexusDoc.modify((t) => {
      t.insertSample(sampleInsert, {
        displayName,
        region: {
          positionTicks: index > 0 ? Ticks.Bars(index) : 0,
        },
        sample: normalizedBpm ? { bpm: normalizedBpm } : { bpm: 'project' },
      });
    });

    imported.push(layer.label);
  }

  return { imported, count: imported.length };
}
