import type { House } from '../types/game';

export const SCHOOL_NAME = '아르카눔 마법학교';

export const HOUSES: House[] = [
  { id: 'flame', name: '불꽃탑', element: '용기와 열정', color: '#a34b28', accent: '#c9603a', icon: '🔥' },
  { id: 'moonlight', name: '달빛탑', element: '지혜와 신비', color: '#5b4a9e', accent: '#8b7bd8', icon: '🌙' },
  { id: 'earth', name: '대지탑', element: '성실과 인내', color: '#2f7a56', accent: '#3f9c74', icon: '🌳' },
  { id: 'wind', name: '바람탑', element: '자유와 재치', color: '#8a6420', accent: '#c9963e', icon: '🍃' },
];
