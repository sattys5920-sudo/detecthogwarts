import agnesAvatar from '../../assets/characters/agnes.png';
import elioAvatar from '../../assets/characters/elio.png';
import paulAvatar from '../../assets/characters/paul.png';
import selenaAvatar from '../../assets/characters/selena.png';
import shaneAvatar from '../../assets/characters/shane.png';
import tachibanaAvatar from '../../assets/characters/tachibana.png';

export interface Character {
  id: string;
  name: string;
  avatar?: string;
}

export const CHARACTERS: Character[] = [
  { id: 'paul', name: '파울', avatar: paulAvatar },
  { id: 'agnes', name: '아네스', avatar: agnesAvatar },
  { id: 'shane', name: '셰인', avatar: shaneAvatar },
  { id: 'tachibana', name: '타치바나', avatar: tachibanaAvatar },
  { id: 'selena', name: '셀레나', avatar: selenaAvatar },
  { id: 'elio', name: '엘리오', avatar: elioAvatar },
  { id: 'inspector', name: '조사관' },
  { id: 'professor', name: '교수' },
];
