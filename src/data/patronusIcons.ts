import type { PatronusId } from '../game/forest/types';
import snake from '../assets/patronus/snake.png';
import tiger from '../assets/patronus/tiger.png';
import squirrel from '../assets/patronus/squirrel.png';
import panther from '../assets/patronus/panther.png';
import lark from '../assets/patronus/lark.png';
import cat from '../assets/patronus/cat.png';
import fox from '../assets/patronus/fox.png';
import snail from '../assets/patronus/snail.png';
import gecko from '../assets/patronus/gecko.png';
import giraffe from '../assets/patronus/giraffe.png';

// 조랑말/해달은 아직 전용 아이콘 이미지가 없어 빠져 있다 — 이미지가 오면 여기에 추가하면 된다.
export const PATRONUS_ICONS: Partial<Record<PatronusId, string>> = {
  snake,
  tiger,
  squirrel,
  panther,
  lark,
  cat,
  fox,
  snail,
  gecko,
  giraffe,
};
