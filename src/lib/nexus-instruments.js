import {
  deviceLabel,
  nexusDeviceCreateOptions,
} from '@/lib/lark-instruments';
import {
  ensureMixerChannelInTransaction,
  primeDeviceForPlayback,
  wireDeviceToMixerChannel,
} from '@/lib/nexus-mixer-routing';

export const LARK_DEVICE_PREFIX = 'Lark · ';

function displayNameOf(entity) {
  const field = entity?.fields?.displayName;
  return field?.value ?? field ?? '';
}

/** Lark-tagged devices to remove before a new transform (query outside modify). */
export function findLarkDevices(nexusDoc) {
  const all = nexusDoc.queryEntities?.get?.() ?? [];
  return all.filter((entity) => {
    const name = displayNameOf(entity);
    return typeof name === 'string' && name.startsWith(LARK_DEVICE_PREFIX);
  });
}

/** @deprecated Use resolveMixerChannelInput from nexus-mixer-routing */
export function findMixerChannelForDevice(nexusDoc) {
  return resolveMixerChannelInput(nexusDoc);
}

/**
 * Add an Audiotool device for the chosen instrument, cable it to the mixer, and replace prior Lark devices.
 * @param {import('@audiotool/nexus').SyncedDocument} nexusDoc
 */
export async function addInstrumentDevice(nexusDoc, instrument, mood) {
  if (!nexusDoc?.modify) {
    throw new Error('Audiotool project is not open. Sign in and open or create a project.');
  }

  const label = deviceLabel(instrument, mood);
  const { deviceType, options: deviceOptions } = nexusDeviceCreateOptions(instrument, {
    label,
    positionX: 140,
    positionY: 200,
  });
  const existing = nexusDoc.queryEntities?.ofTypes(deviceType)?.get?.() ?? [];
  const offset = (existing.length % 4) * 220;
  const larkDevicesToRemove = findLarkDevices(nexusDoc);
  let cabled = false;
  let hasMixerChannel = false;

  await nexusDoc.modify((t) => {
    for (const entity of larkDevicesToRemove) {
      try {
        t.removeWithDependencies(entity);
      } catch {
        // ignore
      }
    }

    const device = t.create(deviceType, {
      ...deviceOptions,
      positionX: deviceOptions.positionX + offset,
    });

    primeDeviceForPlayback(t, device);

    const mixerChannel = ensureMixerChannelInTransaction(t);
    hasMixerChannel = Boolean(mixerChannel);
    cabled = wireDeviceToMixerChannel(t, device, mixerChannel);
  });

  return { deviceType, cabled, hasMixerChannel };
}
