import { Ticks } from '@audiotool/nexus/utils';
import { isDrumInstrument } from '@/lib/lark-instruments';

/**
 * Adapt transcribed note plans for a Studio layer (same hum, different role).
 * @param {Array<{ positionTicks: number, durationTicks: number, pitch: number, velocity: number }>} notePlans
 */
export function adaptNotePlansForLayer(notePlans, layer, primaryInstrument) {
  if (isDrumInstrument(layer) || layer === '909') {
    return notePlans.map((plan) => {
      let pitch = plan.pitch;
      if (pitch < 45) pitch = 36;
      else if (pitch < 55) pitch = 38;
      else pitch = 42;
      return {
        ...plan,
        pitch,
        velocity: Math.min(1, (plan.velocity ?? 0.6) * 1.05),
      };
    });
  }

  if (layer === 'Bass' && primaryInstrument !== 'Bass') {
    return notePlans.map((plan) => ({
      ...plan,
      pitch: Math.max(28, Math.min(55, plan.pitch - 24)),
      velocity: Math.min(1, (plan.velocity ?? 0.6) * 0.85),
    }));
  }

  if (layer === 'Pad') {
    return notePlans.map((plan) => ({
      ...plan,
      durationTicks: Math.min(
        plan.durationTicks * 2,
        Ticks.Beat * 2,
      ),
      velocity: Math.min(1, (plan.velocity ?? 0.6) * 0.5),
    }));
  }

  if (layer === 'Arp') {
    return notePlans.map((plan) => ({
      ...plan,
      durationTicks: Math.max(
        Math.round(Ticks.SemiQuaver * 0.5),
        Math.round(plan.durationTicks * 0.45),
      ),
      velocity: Math.min(1, (plan.velocity ?? 0.6) * 0.72),
    }));
  }

  if (layer === 'Synth') {
    return notePlans.map((plan) => ({
      ...plan,
      velocity: Math.min(1, (plan.velocity ?? 0.6) * 0.68),
    }));
  }

  return notePlans.map((plan) => ({ ...plan }));
}
