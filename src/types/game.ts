export interface Clue {
  id: string;
  name: string;
  description: string;
  icon: string;
  sourceLabel: string;
  isKeyEvidence: boolean;
}

export interface DialogueOption {
  id: string;
  question: string;
  answer: string;
  unlocksClueId?: string;
}

export interface Suspect {
  id: string;
  name: string;
  role: string;
  house: string;
  emblem: string;
  summary: string;
  alibi: string;
  dialogues: DialogueOption[];
}

export interface Location {
  id: string;
  name: string;
  description: string;
  icon: string;
  clueIds: string[];
}

export interface Solution {
  culpritId: string;
  motive: string;
  requiredClueIds: string[];
  briefing: string;
}

export interface House {
  id: string;
  name: string;
  element: string;
  color: string;
}
