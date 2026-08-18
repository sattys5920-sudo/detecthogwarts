import type { NotebookEntry } from '../../hooks/useNotebook';

export type ClueDef = Omit<NotebookEntry, 'id' | 'registeredAt'>;

export interface Topic {
  id: string;
  prompt: string;
  response: string;
  clue?: ClueDef;
  /** Titles of notebook clues that must already be registered before this topic can be asked. */
  requiresClueTitles?: string[];
  followUp?: {
    prompt: string;
    response: string;
    clue?: ClueDef;
    /** Titles of notebook clues that must already be registered before this follow-up can be asked. */
    requiresClueTitles?: string[];
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

export interface RoomLine {
  speaker: string;
  icon: string;
  text: string;
}

export interface DayContent {
  day: number;
  title: string;
  summary: string;
  objective?: string;
  sceneItems?: SceneItem[];
  npcs?: DayNpcEntry[];
  /** Lines the fellow investigators say when the day's chat room opens, before any suspect joins. */
  roomIntro?: RoomLine[];
  /** Lines the fellow investigators say once the player is done talking for the day. */
  roomOutro?: RoomLine[];
  closing: string;
  finalDeduction?: boolean;
}
