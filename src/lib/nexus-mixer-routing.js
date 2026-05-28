/** @typedef {import('@audiotool/nexus').SyncedDocument} SyncedDocument */

const MIXER_STRIP_TYPES = [
  'mixerChannel',
  'mixerGroup',
  'mixerAux',
  'mixerDelayAux',
  'mixerReverbAux',
];

function fieldValue(field) {
  if (field == null) return undefined;
  return typeof field === 'object' && 'value' in field ? field.value : field;
}

function mixerInputLocation(channel) {
  return channel?.fields?.audioInput?.location ?? null;
}

function deviceOutputLocation(device) {
  return device?.fields?.audioOutput?.location ?? null;
}

function locationsEqual(a, b) {
  if (a == null || b == null) return false;
  if (a === b) return true;
  if (typeof a.equals === 'function') return a.equals(b);
  return String(a) === String(b);
}

/** Cables routed into this mixer channel input (read-only document query). */
export function cablesIntoMixerChannel(nexusDoc, channel) {
  const inputLoc = mixerInputLocation(channel);
  if (!inputLoc) return [];

  const pointedTo = nexusDoc.queryEntities
    ?.pointedToBy
    ?.locations(inputLoc)
    ?.ofTypes('desktopAudioCable')
    ?.get?.() ?? [];

  if (pointedTo.length) return pointedTo;

  return nexusDoc.queryEntities
    ?.pointingTo
    ?.locations(inputLoc)
    ?.ofTypes('desktopAudioCable')
    ?.get?.() ?? [];
}

function cablesIntoMixerChannelInTransaction(t, channel) {
  const inputLoc = mixerInputLocation(channel);
  if (!inputLoc) return [];

  const cables = t.entities?.ofTypes?.('desktopAudioCable')?.get?.() ?? [];
  return cables.filter((cable) =>
    locationsEqual(fieldValue(cable.fields?.toSocket), inputLoc),
  );
}

function stripOrderValue(strip) {
  return fieldValue(strip?.fields?.displayParameters?.orderAmongStrips);
}

/** Next globally unique orderAmongStrips for mixer strips. */
export function nextOrderAmongStripsInTransaction(t) {
  let max = -1;
  for (const type of MIXER_STRIP_TYPES) {
    const strips = t.entities?.ofTypes?.(type)?.get?.() ?? [];
    for (const strip of strips) {
      const order = stripOrderValue(strip);
      if (typeof order === 'number' && order > max) max = order;
    }
  }
  return max + 1;
}

/**
 * Ensure Master (stagebox) exists. New API projects may not have mixer entities until Studio loads once.
 * @param {import('@audiotool/nexus').TransactionBuilder} t
 */
export function ensureMixerMasterInTransaction(t) {
  return (
    t.entities?.ofTypes?.('mixerMaster')?.getOne?.()
    ?? t.create('mixerMaster', {
      positionX: 480,
      positionY: 280,
    })
  );
}

/**
 * Pick a free mixer channel or create one (inside an open modify transaction).
 * @param {import('@audiotool/nexus').TransactionBuilder} t
 */
export function ensureMixerChannelInTransaction(t) {
  ensureMixerMasterInTransaction(t);

  const channels = t.entities?.ofTypes?.('mixerChannel')?.get?.() ?? [];
  const free = channels.find((ch) => cablesIntoMixerChannelInTransaction(t, ch).length === 0);
  if (free) return free;
  if (channels.length) return channels[channels.length - 1];

  return t.create('mixerChannel', {
    displayParameters: {
      displayName: 'Lark',
      orderAmongStrips: nextOrderAmongStripsInTransaction(t),
      colorIndex: 6,
    },
  });
}

/**
 * Pick a mixer channel strip on the stagebox (Master) for a new device.
 * @param {SyncedDocument} nexusDoc
 */
export function resolveMixerChannelInput(nexusDoc) {
  const channels = nexusDoc.queryEntities?.ofTypes('mixerChannel')?.get?.() ?? [];
  if (!channels.length) return null;

  const free = channels.find((ch) => cablesIntoMixerChannel(nexusDoc, ch).length === 0);
  return free ?? channels[channels.length - 1];
}

/**
 * Cable device audio out → mixer channel in (stagebox socket).
 */
export function wireDeviceToMixerChannel(t, device, channel) {
  const fromSocket = deviceOutputLocation(device);
  const toSocket = mixerInputLocation(channel);
  if (!fromSocket || !toSocket) return false;

  t.create('desktopAudioCable', {
    fromSocket,
    toSocket,
    colorIndex: 0,
  });
  return true;
}

/** Turn on common devices and set a sensible level. */
export function primeDeviceForPlayback(t, device) {
  if (!device?.fields) return;

  const { isActive, gain } = device.fields;
  if (isActive) {
    try {
      t.update(isActive, true);
    } catch {
      // not all devices expose isActive
    }
  }
  if (gain) {
    try {
      const current = fieldValue(gain);
      if (typeof current !== 'number' || current < 0.15) {
        t.update(gain, 0.7);
      }
    } catch {
      // ignore
    }
  }
}
