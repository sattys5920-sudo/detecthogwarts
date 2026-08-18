import type { ScriptBeat } from './types';

export function eligibleBeats(beats: ScriptBeat[], choices: Record<string, string>): ScriptBeat[] {
  return beats.filter((b) => !b.branchOf || choices[b.branchOf.choiceBeatId] === b.branchOf.optionId);
}
