import { MOOD_LAYERS_STUDIO_PREFIX } from '@/lib/lark-copy';

function safeFilename(label) {
  return String(label ?? 'layer')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .toLowerCase() || 'layer';
}

/** Trigger browser downloads for each mood layer MP3 (fallback when Studio import fails). */
export function downloadMoodLayers(layers = []) {
  const importable = layers.filter((layer) => layer?.blob?.size > 0);
  if (!importable.length) return 0;

  importable.forEach((layer, index) => {
    const url = URL.createObjectURL(layer.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeFilename(layer.label)}.mp3`;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 1000 + index * 200);
  });

  return importable.length;
}

export function moodLayerDownloadHint() {
  return `Downloaded as MP3 — drag into Audiotool Studio or upload as ${MOOD_LAYERS_STUDIO_PREFIX}… samples.`;
}
