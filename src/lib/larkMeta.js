// Encode/decode Lark-specific fields in an Audiotool project's description field.
// Format: "lark-meta:{json}\n\n{rest of description}"

const PREFIX = 'lark-meta:';

/**
 * Encode Lark metadata into a string to embed in an AT project description.
 * @param {object} meta - { instrument, mood, sourceAudioUrl, outputUrl }
 * @param {string} existingDescription - existing project description (non-lark part)
 */
export function encodeLarkMeta(meta, existingDescription = '') {
  // Strip any previous lark-meta line from description
  const cleaned = existingDescription.replace(/^lark-meta:.*$/m, '').trimStart();
  return `${PREFIX}${JSON.stringify(meta)}\n${cleaned}`.trim();
}

/**
 * Decode Lark metadata from an Audiotool project description.
 * @param {string} description
 * @returns {{ meta: object|null, description: string }}
 */
export function decodeLarkMeta(description = '') {
  const lines = description.split('\n');
  const metaLine = lines.find(l => l.startsWith(PREFIX));
  if (!metaLine) return { meta: null, description };
  try {
    const meta = JSON.parse(metaLine.slice(PREFIX.length));
    const rest = lines.filter(l => !l.startsWith(PREFIX)).join('\n').trim();
    return { meta, description: rest };
  } catch {
    return { meta: null, description };
  }
}