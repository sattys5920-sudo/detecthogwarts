import type { NotebookEntry } from '../../hooks/useNotebook';

export type ClueDef = Omit<NotebookEntry, 'id' | 'registeredAt'>;

export interface InvestigationOption {
  id: string;
  label: string;
  lines: string[];
  clue?: ClueDef;
}

/** A single thing a player can investigate that day: a location, a suspect, a piece of evidence. */
export interface InvestigationNode {
  id: string;
  title: string;
  intro?: string[];
  options: InvestigationOption[];
}

export interface DayContent {
  day: number;
  title: string;
  objective: string;
  opening: string[];
  nodes: InvestigationNode[];
  closing: string[];
  unlockNote?: string;
  finalDay?: boolean;
}
