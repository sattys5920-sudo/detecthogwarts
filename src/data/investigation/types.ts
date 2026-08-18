import type { NotebookEntry } from '../../hooks/useNotebook';

export type ClueDef = Omit<NotebookEntry, 'id' | 'registeredAt'>;

/**
 * A single beat in an admin-paced script: either a narration line (GM
 * description or a character line) or a choice point. The admin's "다음"
 * button reveals beats one at a time to every connected player; a choice
 * beat pauses the reveal until a player picks an option.
 */
export interface ScriptBeat {
  id: string;
  type: 'narration' | 'choice';
  speaker?: string;
  icon?: string;
  text?: string;
  clue?: ClueDef;
  options?: { id: string; text: string }[];
  /** Only eligible to be revealed once the referenced choice was resolved to this option. */
  branchOf?: { choiceBeatId: string; optionId: string };
}

export interface DayContent {
  day: number;
  title: string;
  summary: string;
  objective?: string;
  /** Admin-paced script (visual-novel style) that makes up the day's whole conversation area. */
  script: ScriptBeat[];
  closing: string;
  finalDeduction?: boolean;
}
