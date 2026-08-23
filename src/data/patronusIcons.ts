import type { PatronusId } from '../game/forest/types';
import snake from '../assets/patronus/snake.png';
import tiger from '../assets/patronus/tiger.png';
import squirrel from '../assets/patronus/squirrel.png';
import panther from '../assets/patronus/panther.png';
import lark from '../assets/patronus/lark.png';

/** Filled in as each species' artwork is provided; species without one yet just show no image. */
export const PATRONUS_ICONS: Partial<Record<PatronusId, string>> = {
  snake,
  tiger,
  squirrel,
  panther,
  lark,
};
