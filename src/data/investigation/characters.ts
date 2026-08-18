export interface Character {
  id: string;
  name: string;
  icon: string;
}

export const CHARACTERS: Character[] = [
  { id: 'paul', name: '파울', icon: '🗝️' },
  { id: 'agnes', name: '아네스', icon: '🥀' },
  { id: 'shane', name: '셰인', icon: '📘' },
  { id: 'tachibana', name: '타치바나', icon: '⚔️' },
  { id: 'selena', name: '셀레나', icon: '🪄' },
  { id: 'suspect5', name: '용의자 5', icon: '🌫️' },
  { id: 'inspector', name: '조사관', icon: '🔍' },
  { id: 'professor', name: '교수', icon: '🎓' },
];
