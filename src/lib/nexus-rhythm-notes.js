import { Ticks, secondsToTicks } from '@audiotool/nexus/utils';
import {
  deviceLabel,
  nexusDeviceCreateOptions,
} from '@/lib/lark-instruments';
import { findLarkDevices } from '@/lib/nexus-instruments';
import {
  ensureMixerChannelInTransaction,
  primeDeviceForPlayback,
  wireDeviceToMixerChannel,
} from '@/lib/nexus-mixer-routing';

function fieldValue(field) {
  if (field == null) return undefined;
  return typeof field === 'object' && 'value' in field ? field.value : field;
}

function getProjectBpm(nexusDoc) {
  const configs = nexusDoc.queryEntities?.ofTypes('config')?.get?.() ?? [];
  const cfg = configs[0];
  const bpm = fieldValue(cfg?.fields?.tempoBpm);
  return typeof bpm === 'number' && bpm > 0 ? bpm : 125;
}

function nextTrackOrder(nexusDoc) {
  const types = ['noteTrack', 'audioTrack', 'patternTrack', 'automationTrack'];
  let max = 0;
  for (const type of types) {
    const tracks = nexusDoc.queryEntities?.ofTypes(type)?.get?.() ?? [];
    for (const tr of tracks) {
      const o = fieldValue(tr.fields?.orderAmongTracks);
      if (typeof o === 'number' && o > max) max = o;
    }
  }
  return max + 1;
}

function assertDocumentReady(nexusDoc) {
  if (!nexusDoc?.modify) {
    throw new Error('Audiotool project is not open. Select a connected project and try again.');
  }
  const connected = nexusDoc.connected?.value ?? nexusDoc.connected;
  if (connected === false) {
    throw new Error('Lost connection to Audiotool. Wait a moment and try again.');
  }
}

/**
 * Write MIDI note plans onto a Nexus instrument in the open project.
 */
export async function applyNotesToInstrument(
  nexusDoc,
  { instrument, mood, notePlans, regionDuration, bpm: bpmOverride },
) {
  assertDocumentReady(nexusDoc);

  if (!notePlans?.length) {
    throw new Error('No notes to write. Try humming louder or closer to the mic.');
  }

  const label = deviceLabel(instrument, mood);
  const bpm = bpmOverride ?? getProjectBpm(nexusDoc);

  const { deviceType, options: deviceOptions } = nexusDeviceCreateOptions(instrument, {
    label,
    positionX: 140,
    positionY: 200,
  });

  const existing = nexusDoc.queryEntities?.ofTypes(deviceType)?.get?.() ?? [];
  const offset = (existing.length % 4) * 220;
  const larkDevicesToRemove = findLarkDevices(nexusDoc);
  const orderAmongTracks = nextTrackOrder(nexusDoc);

  const duration =
    regionDuration
    ?? Math.max(Ticks.Bars(1), secondsToTicks(8, bpm) + Ticks.Beat);

  let noteCount = 0;
  let cabled = false;

  await nexusDoc.modify((t) => {
    for (const entity of larkDevicesToRemove) {
      try {
        t.removeWithDependencies(entity);
      } catch {
        // ignore stale entity
      }
    }

    const collection = t.create('noteCollection', {});
    const device = t.create(deviceType, {
      ...deviceOptions,
      positionX: deviceOptions.positionX + offset,
    });

    primeDeviceForPlayback(t, device);

    const track = t.create('noteTrack', {
      player: device.location,
      orderAmongTracks,
    });

    t.create('noteRegion', {
      collection: collection.location,
      track: track.location,
      region: {
        positionTicks: 0,
        durationTicks: duration,
        displayName: label,
      },
    });

    const mixerChannel = ensureMixerChannelInTransaction(t);
    cabled = wireDeviceToMixerChannel(t, device, mixerChannel);

    for (const plan of notePlans) {
      t.create('note', {
        collection: collection.location,
        positionTicks: plan.positionTicks,
        durationTicks: plan.durationTicks,
        pitch: plan.pitch,
        velocity: plan.velocity,
      });
      noteCount += 1;
    }
  });

  if (!cabled) {
    throw new Error(
      'Notes were added but the instrument is not wired to Master. Cable the instrument output to a free socket on the Master stagebox.',
    );
  }

  return { noteCount, bpm, cabled, deviceType };
}

/** @deprecated Use applyNotesToInstrument after transcribeHumToNotes */
export async function applyRhythmToInstrument(nexusDoc, { instrument, mood, rhythm }) {
  const bpm = rhythm.bpm ?? getProjectBpm(nexusDoc);
  const notePlans = rhythm.onsets.map((onset, index) => {
    const positionTicks = Math.max(
      0,
      Math.round(secondsToTicks(onset.timeSec, bpm) / Ticks.SemiQuaver) * Ticks.SemiQuaver,
    );
    let pitch = 60;
    if (instrument === 'Drums') pitch = index % 4 === 0 ? 36 : index % 2 ? 38 : 42;
    return {
      positionTicks,
      durationTicks: Math.round(Ticks.SemiQuaver * 0.85),
      pitch,
      velocity: 0.35 + onset.strength * 0.55,
    };
  });
  return applyNotesToInstrument(nexusDoc, {
    instrument,
    mood,
    notePlans,
    bpm,
    regionDuration: Math.max(
      Ticks.Bars(1),
      secondsToTicks(Math.max(rhythm.durationSec, 1), bpm) + Ticks.Beat,
    ),
  });
}
