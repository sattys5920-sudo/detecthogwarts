export interface Npc {
  id: string;
  name: string;
  role: string;
  desc: string;
}

export const NPCS: Npc[] = [
  {
    id: 'quinix',
    name: '퀴닉스 교수',
    role: '호그와트 교수',
    desc: '학교 및 사건에 대한 정보를 알고 있다.',
  },
  {
    id: 'monia',
    name: '모니아',
    role: '후플푸프 소속 기자 선배',
    desc: '학생들의 소문이나 학교 내부 정보를 알고 있다.',
  },
  {
    id: 'wood',
    name: '우드 사장님',
    role: '호그스미드의 정보통 술집 운영자',
    desc: '호그스미드 및 외부 인물에 대한 정보를 알고 있다.',
  },
  {
    id: 'tom',
    name: '톰',
    role: '그리핀도르 8학년',
    desc: '학교 곳곳을 돌아다니며 다양한 것을 목격했을 가능성이 있다.',
  },
];

export function npcById(id: string): Npc | null {
  return NPCS.find((n) => n.id === id) ?? null;
}
