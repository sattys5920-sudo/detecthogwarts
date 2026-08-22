export interface Npc {
  id: string;
  name: string;
  role: string;
  desc: string;
}

export const NPCS: Npc[] = [
  {
    id: 'quinix',
    name: '아리텔 퀴닉스',
    role: '호그와트 교장',
    desc: '학교 및 사건에 대한 정보를 알고 있다.',
  },
  {
    id: 'monia',
    name: '리즈 모니아',
    role: '교내 신문부 · 후플푸프 12학년',
    desc: '학생들의 소문이나 학교 내부 정보를 알고 있다.',
  },
  {
    id: 'wood',
    name: '나이스 가이 우드',
    role: '호그스미드 호프 사장',
    desc: '호그스미드 및 외부 인물에 대한 정보를 알고 있다.',
  },
  {
    id: 'tom',
    name: '톰 사이스',
    role: '그리핀도르 8학년',
    desc: '학교 곳곳을 돌아다니며 다양한 것을 목격했을 가능성이 있다.',
  },
];

export function npcById(id: string): Npc | null {
  return NPCS.find((n) => n.id === id) ?? null;
}
