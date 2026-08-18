import type { NotebookEntry } from '../../hooks/useNotebook';

export type ClueDef = Omit<NotebookEntry, 'id' | 'registeredAt'>;

export interface Topic {
  id: string;
  prompt: string;
  response: string;
  clue?: ClueDef;
  followUp?: {
    prompt: string;
    response: string;
    clue?: ClueDef;
  };
}

export interface NpcScript {
  greeting: string;
  topics: Topic[];
}

export interface SceneItem {
  id: string;
  icon: string;
  name: string;
  text: string;
  clue?: ClueDef;
}

export interface DayNpcEntry {
  npcId: string;
  script: NpcScript;
}

export interface DayContent {
  day: number;
  title: string;
  summary: string;
  sceneItems?: SceneItem[];
  npcs?: DayNpcEntry[];
  closing: string;
  finalDeduction?: boolean;
}
