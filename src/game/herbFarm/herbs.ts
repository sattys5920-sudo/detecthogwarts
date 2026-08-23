import type { Herb, HerbRarity } from './types';

function seedFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}
function rand01(id: string, salt: number): number {
  return (seedFor(`${id}:${salt}`) % 1000) / 1000;
}
function randInt(id: string, salt: number, min: number, max: number): number {
  return min + Math.floor(rand01(id, salt) * (max - min + 1));
}

// [growthTime min/max in minutes, healAmount/mpAmount/staminaAmount min/max]
const RARITY_RANGES: Record<
  HerbRarity,
  { growthMin: number; growthMax: number; healMin: number; healMax: number; mpMin: number; mpMax: number; staMin: number; staMax: number }
> = {
  1: { growthMin: 5, growthMax: 20, healMin: 5, healMax: 15, mpMin: 3, mpMax: 10, staMin: 3, staMax: 10 },
  2: { growthMin: 20, growthMax: 60, healMin: 15, healMax: 30, mpMin: 10, mpMax: 20, staMin: 10, staMax: 20 },
  3: { growthMin: 60, growthMax: 180, healMin: 30, healMax: 50, mpMin: 20, mpMax: 35, staMin: 20, staMax: 35 },
  4: { growthMin: 180, growthMax: 480, healMin: 50, healMax: 80, mpMin: 35, mpMax: 55, staMin: 35, staMax: 55 },
  5: { growthMin: 480, growthMax: 1440, healMin: 80, healMax: 120, mpMin: 55, mpMax: 85, staMin: 55, staMax: 85 },
};

interface Row {
  id: string;
  name: string;
  rarity: HerbRarity;
  description: string;
}

const ROWS: Row[] = [
  // ★ 일반
  { id: 'dittany', name: '디타니', rarity: 1, description: '베인 상처와 찰과상을 순식간에 아물게 하는 흔한 치료용 약초.' },
  { id: 'mugwort', name: '쑥', rarity: 1, description: '생명력이 강해 아무 데서나 자라는 기본 약초. 몸을 따뜻하게 데워준다.' },
  { id: 'lavender', name: '라벤더', rarity: 1, description: '은은한 향으로 긴장된 신경을 가라앉히는 진정 효과가 있는 약초.' },
  { id: 'nettle', name: '쐐기풀', rarity: 1, description: '만지면 따갑지만 달여 마시면 피로 회복에 좋은 약초.' },
  { id: 'dandelion', name: '민들레', rarity: 1, description: '어디서나 눈에 띄는 노란 들꽃. 소화를 돕는 효능이 있다.' },
  { id: 'chamomile', name: '카모마일', rarity: 1, description: '달콤한 사과향이 나는 꽃. 마시면 마음이 편안해진다.' },
  { id: 'valerian', name: '발레리안', rarity: 1, description: '뿌리에서 강한 냄새가 나지만 숙면을 돕는 효능이 뛰어나다.' },
  { id: 'aloe', name: '알로에', rarity: 1, description: '두꺼운 잎 속 즙이 화상과 상처를 진정시켜 준다.' },
  { id: 'aconite', name: '아코나이트', rarity: 1, description: '보랏빛 꽃이 피는 약초. 소량만 다루면 약재로 유용하다.' },
  { id: 'mistletoe', name: '겨우살이', rarity: 1, description: '겨울에도 시들지 않는 상록 기생 식물. 오래전부터 약재로 쓰였다.' },
  { id: 'laceweed', name: '레이스윙', rarity: 1, description: '얇은 잎맥이 레이스처럼 비치는 풀. 은은한 회복 효과가 있다.' },
  { id: 'st-johns-wort', name: '세인트존스워트', rarity: 1, description: '노란 별 모양 꽃이 피는 풀. 마음을 밝게 해준다고 전해진다.' },
  // ★★ 고급
  { id: 'asphodel', name: '아스포델', rarity: 2, description: '희고 긴 꽃대가 특징인 약초. 정교한 물약의 재료로 쓰인다.' },
  { id: 'daisy', name: '데이지', rarity: 2, description: '흔해 보이지만 마력이 깃든 품종은 회복력이 남다르다.' },
  { id: 'dried-nettle', name: '말린 쐐기풀', rarity: 2, description: '오래 말려 약효가 응축된 쐐기풀. 생것보다 효과가 강하다.' },
  { id: 'flobberworm-leaf', name: '플로버웜', rarity: 2, description: '느릿느릿 자라는 덩굴풀. 끈적한 진액에 회복 성분이 있다.' },
  { id: 'flame-lily', name: '플레임릴리', rarity: 2, description: '불꽃처럼 붉게 피어나는 백합. 은근한 활력을 불어넣는다.' },
  { id: 'spearmint', name: '스피어민트', rarity: 2, description: '알싸하고 시원한 향의 박하. 정신을 맑게 해준다.' },
  { id: 'rosemary', name: '로즈메리', rarity: 2, description: '솔잎처럼 뾰족한 잎을 가진 향초. 오래된 치유 전통에 쓰였다.' },
  { id: 'sage', name: '세이지', rarity: 2, description: '은회색 잎이 특징인 약초. 정화와 회복의 효능을 함께 지닌다.' },
  { id: 'moondew', name: '문듀', rarity: 2, description: '달빛이 비칠 때만 이슬처럼 맺히는 진액을 머금은 풀.' },
  { id: 'sluggorn', name: '슬러그혼', rarity: 2, description: '나선형으로 말려 자라는 독특한 뿌리풀. 향이 진하다.' },
  { id: 'snakegrass', name: '스네이크그래스', rarity: 2, description: '뱀처럼 구불구불 자라는 풀. 해독 효능으로 알려져 있다.' },
  { id: 'silverleaf', name: '은빛 잎사귀', rarity: 2, description: '달빛을 받으면 은은하게 빛나는 잎. 회복력이 남다르다.' },
  // ★★★ 희귀
  { id: 'mandrake', name: '맨드레이크', rarity: 3, description: '사람 모양 뿌리를 가진 강력한 약초. 뽑을 때 큰 비명을 지른다.' },
  { id: 'belladonna', name: '밸라도나', rarity: 3, description: '검붉은 열매를 맺는 위험한 약초. 정제하면 강한 효력을 낸다.' },
  { id: 'chinese-chomping', name: '중국 쩌러기', rarity: 3, description: '먼 동방에서 건너온 신비한 뿌리풀. 씹으면 활력이 솟는다.' },
  { id: 'bitrid', name: '비트리드', rarity: 3, description: '단단한 껍질 속에 진한 회복 진액을 품은 덩이뿌리.' },
  { id: 'venomous-tentacula-thorn', name: '독성 텐터큘라', rarity: 3, description: '가시덩굴 식물의 순한 개체. 조심스레 다루면 약재가 된다.' },
  { id: 'sweetslug', name: '스위트슬러그', rarity: 3, description: '달콤한 냄새로 벌레를 유인하는 식충 식물. 즙이 진귀하다.' },
  { id: 'black-hellebore', name: '블랙헬레보어', rarity: 3, description: '검은 꽃잎을 가진 독한 약초. 소량이면 강한 치유제가 된다.' },
  { id: 'evening-primrose', name: '달맞이꽃', rarity: 3, description: '밤에만 피어나는 노란 꽃. 달빛 아래서 약효가 짙어진다.' },
  { id: 'silver-daisy', name: '은빛 데이지', rarity: 3, description: '은가루를 뿌린 듯 반짝이는 희귀한 데이지 변종.' },
  { id: 'starlight-mushroom', name: '별빛 버섯', rarity: 3, description: '어둠 속에서 별처럼 반짝이는 버섯. 채집이 쉽지 않다.' },
  { id: 'moonflower', name: '문플라워', rarity: 3, description: '보름달이 뜬 밤에만 활짝 피는 신비로운 꽃.' },
  { id: 'whispering-willow-leaf', name: '위스퍼링 윌로우 잎', rarity: 3, description: '바람이 스치면 속삭이는 소리를 내는 버드나무의 잎.' },
  // ★★★★ 특수
  { id: 'devils-snare-bud', name: '악마의 덫', rarity: 4, description: '위험한 조이는 덩굴 식물의 어린 순. 다루기 까다롭지만 강력하다.' },
  { id: 'venomous-tentacula-bloom', name: '베네무스 텐터큘라', rarity: 4, description: '이빨 달린 꽃을 피우는 육식 식물. 진귀한 약재로 손꼽힌다.' },
  { id: 'fluxweed', name: '플럭스위드', rarity: 4, description: '보름달이 뜬 밤에만 채집해야 진정한 효력을 발휘하는 약초.' },
  { id: 'gravorn-root', name: '그래포른 뿌리', rarity: 4, description: '땅속 깊이 뻗어 자라는 굵은 뿌리. 오랜 세월 마력을 머금었다.' },
  { id: 'flame-thorn', name: '불꽃쐐기', rarity: 4, description: '건드리면 따뜻한 불씨가 튀는 진귀한 가시풀.' },
  { id: 'moon-mandrake', name: '달의 맨드레이크', rarity: 4, description: '달빛 아래서만 자라는 맨드레이크의 희귀 변종.' },
  { id: 'golden-dittany', name: '황금 디타니', rarity: 4, description: '황금빛으로 물든 디타니. 일반 개체보다 훨씬 강력하다.' },
  { id: 'ghost-lavender', name: '유령 라벤더', rarity: 4, description: '반투명하게 빛나는 라벤더. 만지면 서늘한 기운이 감돈다.' },
  // ★★★★★ 전설
  { id: 'sorcerers-dittany', name: '마법사의 디타니', rarity: 5, description: '전설적인 대마법사가 길렀다고 전해지는 최상급 디타니.' },
  { id: 'ancient-mandrake', name: '고대 맨드레이크', rarity: 5, description: '수백 년을 땅속에서 자라온 거대한 맨드레이크의 뿌리.' },
  { id: 'phoenix-blossom', name: '불사조의 꽃', rarity: 5, description: '불사조의 깃털이 떨어진 자리에서만 피어난다는 전설의 꽃.' },
  { id: 'moon-tear', name: '달의 눈물', rarity: 5, description: '보름달이 가장 밝은 밤, 이슬처럼 맺힌다는 전설의 결정.' },
  { id: 'arcadia-bloom', name: '아르카디아의 꽃', rarity: 5, description: '잃어버린 다섯 번째 기숙사의 정원에서 유래했다는 전설의 꽃.' },
  { id: 'tree-of-life-fruit', name: '생명의 나무 열매', rarity: 5, description: '태초의 생명력을 품었다는 전설 속 나무가 맺은 열매.' },
];

function buildHerb(row: Row): Herb {
  const range = RARITY_RANGES[row.rarity];
  const growthMinutes = randInt(row.id, 1, range.growthMin, range.growthMax);
  const healAmount = randInt(row.id, 2, range.healMin, range.healMax);
  const mpAmount = randInt(row.id, 3, range.mpMin, range.mpMax);
  const staminaAmount = randInt(row.id, 4, range.staMin, range.staMax);
  return {
    id: row.id,
    name: row.name,
    rarity: row.rarity,
    growthTime: growthMinutes * 60,
    healAmount,
    mpAmount,
    staminaAmount,
    description: row.description,
  };
}

export const HERBS: Herb[] = ROWS.map(buildHerb);

export const HERBS_BY_RARITY: Record<HerbRarity, Herb[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
for (const herb of HERBS) HERBS_BY_RARITY[herb.rarity].push(herb);

export function herbById(id: string): Herb | undefined {
  return HERBS.find((h) => h.id === id);
}

export const TOTAL_HERB_COUNT = HERBS.length;
