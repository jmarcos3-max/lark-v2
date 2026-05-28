const STORAGE_KEY = 'lark_raw_audio_library';
const DB_NAME = 'lark_raw_audio';
const STORE_NAME = 'blobs';
const MAX_ENTRIES = 50;

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeEntry) : [];
  } catch {
    return [];
  }
}

function writeAll(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

/** Migrate older entries that stored ephemeral blob: URLs in localStorage. */
function normalizeEntry(entry) {
  if (!entry?.id) return entry;
  if ('remoteUrl' in entry) return entry;
  const legacyUrl = entry.url ?? null;
  return {
    id: entry.id,
    name: entry.name,
    projectTitle: entry.projectTitle ?? null,
    createdAt: entry.createdAt,
    remoteUrl: legacyUrl && !legacyUrl.startsWith('blob:') ? legacyUrl : null,
  };
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putBlob(id, blob) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getBlob(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function deleteBlob(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function listRawAudioEntries() {
  return readAll().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/**
 * Save a recording to the local library (IndexedDB blob + metadata).
 * @param {{ blob?: Blob, remoteUrl?: string | null, name?: string, projectTitle?: string | null }} params
 */
export async function addRawAudioEntry({ blob, remoteUrl = null, name, projectTitle = null }) {
  const id = crypto.randomUUID();
  let stored = false;

  if (blob instanceof Blob && blob.size > 0) {
    await putBlob(id, blob);
    stored = true;
  } else if (remoteUrl && !remoteUrl.startsWith('blob:')) {
    try {
      const res = await fetch(remoteUrl);
      if (res.ok) {
        await putBlob(id, await res.blob());
        stored = true;
      }
    } catch {
      // keep metadata + remoteUrl for playback attempt
    }
  }

  if (!stored && !remoteUrl) return null;

  const entry = {
    id,
    name: name?.trim() || 'Voice Recording',
    projectTitle: projectTitle?.trim() || null,
    createdAt: new Date().toISOString(),
    remoteUrl: remoteUrl && !remoteUrl.startsWith('blob:') ? remoteUrl : null,
  };

  const next = [entry, ...readAll().filter((e) => e.id !== id)];
  writeAll(next);
  return entry;
}

export async function removeRawAudioEntry(id) {
  writeAll(readAll().filter((e) => e.id !== id));
  try {
    await deleteBlob(id);
  } catch {
    // ignore
  }
}

export function renameRawAudioEntry(id, name) {
  const trimmed = name?.trim();
  if (!id || !trimmed) return false;
  const next = readAll().map((e) => (e.id === id ? { ...e, name: trimmed } : e));
  writeAll(next);
  return true;
}

/** URL suitable for <audio src> — prefers locally stored blob. */
export async function resolveRawAudioUrl(entry) {
  if (!entry?.id) return null;

  try {
    const blob = await getBlob(entry.id);
    if (blob && blob.size > 0) {
      return URL.createObjectURL(blob);
    }
  } catch {
    // fall through
  }

  if (entry.remoteUrl) return entry.remoteUrl;
  return null;
}

export async function getRawAudioBlob(entry) {
  if (!entry?.id) return null;
  try {
    const blob = await getBlob(entry.id);
    if (blob?.size) return blob;
  } catch {
    // fall through
  }
  if (!entry.remoteUrl) return null;
  try {
    const res = await fetch(entry.remoteUrl);
    if (!res.ok) return null;
    return res.blob();
  } catch {
    return null;
  }
}

export async function downloadRawAudio(entry) {
  const blob = await getRawAudioBlob(entry);
  const safeName = (entry.name || 'recording').replace(/[^\w\s.-]/g, '_').trim() || 'recording';

  if (blob) {
    const ext = blob.type.includes('mpeg') || blob.type.includes('mp3')
      ? 'mp3'
      : blob.type.includes('wav')
        ? 'wav'
        : blob.type.includes('mp4')
          ? 'm4a'
          : 'webm';
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `${safeName}.${ext}`;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
    return;
  }

  if (entry.remoteUrl) {
    const anchor = document.createElement('a');
    anchor.href = entry.remoteUrl;
    anchor.download = safeName;
    anchor.rel = 'noopener';
    anchor.target = '_blank';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }
}
