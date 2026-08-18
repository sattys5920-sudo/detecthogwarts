export interface Npc {
  id: string;
  name: string;
  role: string;
  icon: string;
}

export const NPCS: Npc[] = [
  { id: 'agnes', name: '아네스 루', role: '피해자의 여자친구', icon: '🥀' },
  { id: 'shane', name: '셰인 송', role: '피해자의 오랜 친구', icon: '📖' },
  { id: 'tachibana', name: '타치바나 고', role: '피해자의 라이벌', icon: '⚔️' },
  { id: 'selena', name: '셀레나 미고 교수', role: '방어술 교수', icon: '🪄' },
  { id: 'unknown5', name: '???', role: '신원 미상', icon: '🌫️' },
  { id: 'paul', name: '파울 슈미트', role: '학교 관리인', icon: '🗝️' },
];
