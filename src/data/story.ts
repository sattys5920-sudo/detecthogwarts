import type { Clue, DialogueOption, House, Location, Solution, Suspect } from '../types/game';

export const SCHOOL_NAME = '아르카눔 마법학교';
export const CASE_TITLE = '사라진 별자리구슬 사건';

export const PROLOGUE = [
  `아르카눔 마법학교의 밤하늘 아래, 내일이면 일 년에 한 번뿐인 "별빛 축제"가 열립니다.`,
  `축제의 상징인 "현자의 별자리구슬"은 수백 년간 천문탑 전시실의 결계 걸린 유리 진열장 안에 잠들어 있었습니다.`,
  `그러나 오늘 새벽, 진열장이 부서지고 별자리구슬이 감쪽같이 사라졌습니다.`,
  `교장 아우렐리아 몬드레이는 축제 개막 전에 사건을 해결해 달라며, 수사부 소속인 당신에게 조사를 의뢰합니다.`,
  `단서를 모으고, 용의자들과 대화하며, 진실에 다가가 보세요.`,
];

export const HOUSES: House[] = [
  { id: 'flame', name: '불꽃탑', element: '용기와 열정', color: '#c9603a' },
  { id: 'moonlight', name: '달빛탑', element: '지혜와 신비', color: '#8b7bd8' },
  { id: 'earth', name: '대지탑', element: '성실과 인내', color: '#3f9c74' },
  { id: 'wind', name: '바람탑', element: '자유와 재치', color: '#d9ab4f' },
];

export const CLUES: Clue[] = [
  {
    id: 'clue_broken_case',
    name: '부서진 유리 진열장',
    description:
      '진열장의 잠금장치가 산성 용액에 녹아내려 부서져 있습니다. 물리적으로 힘을 가한 흔적은 없습니다.',
    icon: '🧊',
    sourceLabel: '천문탑 전시실',
    isKeyEvidence: false,
  },
  {
    id: 'clue_solvent_residue',
    name: '정체불명의 산성 얼룩',
    description:
      '잠금장치 주변에 남은 끈적한 갈색 얼룩에서 옅은 화학약품 냄새가 납니다. 아무나 만들 수 있는 물질이 아닙니다.',
    icon: '🧪',
    sourceLabel: '천문탑 전시실',
    isKeyEvidence: true,
  },
  {
    id: 'clue_forensic_report',
    name: '결계 감정 보고서',
    description:
      '결계 마법사가 작성한 보고서. "이 정도로 정교하게 결계를 녹이는 용액은 숙련된 연금술사만이 조제할 수 있다"고 적혀 있습니다.',
    icon: '📋',
    sourceLabel: '천문탑 전시실',
    isKeyEvidence: false,
  },
  {
    id: 'clue_restricted_book',
    name: '금서 대출 기록부',
    description:
      '사건 이틀 전, "몬드레이"라는 이름으로 별자리구슬의 진짜 힘을 다룬 금서가 대출되었습니다. 그런데 교장의 이름은 "아우렐리아"입니다 — 필체가 어딘가 낯익습니다.',
    icon: '📖',
    sourceLabel: '도서관 금서고',
    isKeyEvidence: false,
  },
  {
    id: 'clue_muddy_bootprints',
    name: '진흙 발자국',
    description: '온실에서 시작해 실험실 쪽으로 이어지는 커다란 장화 자국이 남아 있습니다.',
    icon: '🥾',
    sourceLabel: '온실',
    isKeyEvidence: false,
  },
  {
    id: 'clue_debt_letter',
    name: '빚 독촉장',
    description:
      '실험실 쓰레기통에 구겨진 채 버려진 편지. "이번 달 안에 갚지 않으면…"이라는 문구가 보이지만 수신인 이름은 지워져 있습니다.',
    icon: '✉️',
    sourceLabel: '연금술 실험실',
    isKeyEvidence: true,
  },
  {
    id: 'clue_supply_log',
    name: '재료 대출 기록',
    description:
      '사건 당일 늦은 밤, "부식성 용액 - 은빛등급"이 반출된 기록이 있습니다. 서명란은 급하게 휘갈겨져 있어 알아보기 어렵습니다.',
    icon: '🧾',
    sourceLabel: '연금술 실험실',
    isKeyEvidence: false,
  },
  {
    id: 'clue_collector_letter',
    name: '수집가에게 보내는 편지 초안',
    description:
      '"희귀한 별의 유물을 은밀히 구매하실 분을 찾습니다"로 시작하는 편지 초안이 축제 소품 상자 틈에서 발견되었습니다.',
    icon: '🕯️',
    sourceLabel: '대강당 소품 창고',
    isKeyEvidence: true,
  },
  {
    id: 'clue_ethan_receipt',
    name: '축제 준비 영수증',
    description:
      '사건 시각, 에단이 대강당에서 여러 학생들과 함께 물품을 정리하고 있었다는 시간이 찍힌 영수증입니다.',
    icon: '🧺',
    sourceLabel: '에단과의 대화',
    isKeyEvidence: false,
  },
  {
    id: 'clue_lyra_minutes',
    name: '천문 동아리 회의록',
    description: '사건 시각, 리라가 동아리 정기 회의에서 발언한 기록이 시간과 함께 남아 있습니다.',
    icon: '🌙',
    sourceLabel: '리라와의 대화',
    isKeyEvidence: false,
  },
  {
    id: 'clue_penelope_testimony',
    name: '사서의 증언',
    description:
      '페넬로피는 낯선 필체로 가명 대출을 한 사람이 "코르빈 애쉬 교수"라고 확신합니다. 예전에 그의 손글씨를 본 적이 있다고 말합니다.',
    icon: '🗝️',
    sourceLabel: '페넬로피와의 대화',
    isKeyEvidence: false,
  },
  {
    id: 'clue_witness_shadow',
    name: '톰의 목격담',
    description:
      '자정 무렵 순찰 중이던 톰은 실험실 방향에서 천문탑 쪽으로 걸어가는 그림자를 보았다고 말합니다. "망토에서 옅은 화학약품 냄새가 났다"고 덧붙입니다.',
    icon: '👣',
    sourceLabel: '톰과의 대화',
    isKeyEvidence: false,
  },
  {
    id: 'clue_ashe_alibi',
    name: '애쉬 교수의 알리바이',
    description:
      '그는 사건 당일 자정 무렵 혼자 연구실에서 논문을 쓰고 있었다고 주장하지만, 이를 증명해 줄 사람은 아무도 없습니다.',
    icon: '❓',
    sourceLabel: '애쉬 교수와의 대화',
    isKeyEvidence: false,
  },
];

export const LOCATIONS: Location[] = [
  {
    id: 'loc_tower',
    name: '천문탑 전시실',
    description: '별자리구슬이 보관되어 있던 곳. 사건 현장입니다.',
    icon: '🔭',
    clueIds: ['clue_broken_case', 'clue_solvent_residue', 'clue_forensic_report'],
  },
  {
    id: 'loc_library',
    name: '도서관 금서고',
    description: '위험한 마법 지식이 보관된 서고. 사서 페넬로피가 관리합니다.',
    icon: '📚',
    clueIds: ['clue_restricted_book'],
  },
  {
    id: 'loc_greenhouse',
    name: '온실',
    description: '희귀 마법 식물을 기르는 유리 온실. 연금술 재료가 재배됩니다.',
    icon: '🌿',
    clueIds: ['clue_muddy_bootprints'],
  },
  {
    id: 'loc_lab',
    name: '연금술 실험실',
    description: '코르빈 애쉬 교수가 관리하는 실험실.',
    icon: '⚗️',
    clueIds: ['clue_debt_letter', 'clue_supply_log'],
  },
  {
    id: 'loc_hall',
    name: '대강당',
    description: '별빛 축제 준비가 한창인 장소.',
    icon: '🏛️',
    clueIds: ['clue_collector_letter', 'clue_ethan_receipt'],
  },
];

function dlg(id: string, question: string, answer: string, unlocksClueId?: string): DialogueOption {
  return { id, question, answer, unlocksClueId };
}

export const SUSPECTS: Suspect[] = [
  {
    id: 'ethan',
    name: '에단 발크로프트',
    role: '3학년, 별빛 축제 준비위원장',
    house: '대지탑',
    emblem: '🏔️',
    summary: '축제 준비에 진심인 성실한 학생. 별자리구슬을 축제 상징으로 적극 활용하려 했습니다.',
    alibi: '사건 시각, 대강당에서 여러 학생들과 함께 물품을 정리하고 있었다고 주장합니다.',
    dialogues: [
      dlg(
        'ethan_q1',
        '별자리구슬에 대해 어떻게 생각하나요?',
        '축제의 자랑이죠! 사실 올해는 개막식 때 구슬을 무대 중앙에 세워두자고 제안했었어요. 교장 선생님이 안전상의 이유로 반려하셨지만요.',
      ),
      dlg(
        'ethan_q2',
        '사건이 일어난 시각엔 어디에 있었나요?',
        '자정까지 대강당에서 예산 영수증을 정리하고 있었어요. 저 말고도 축제 준비팀 애들 서너 명이 같이 있었으니 물어보셔도 돼요. 아, 여기 그때 정리하던 영수증이에요.',
        'clue_ethan_receipt',
      ),
      dlg(
        'ethan_q3',
        '평소 애쉬 교수님과는 어떤 사이인가요?',
        '축제용 폭죽 재료를 받으러 몇 번 실험실에 갔었어요. 요즘 좀 예민해 보이시더라고요. 빚 때문이라는 소문도 있고...',
      ),
    ],
  },
  {
    id: 'lyra',
    name: '리라 손우드',
    role: '4학년, 천문 동아리 회장',
    house: '달빛탑',
    emblem: '🌙',
    summary: '별자리구슬의 마력을 연구해 온 학구파 학생. 구슬의 힘에 대해 누구보다 잘 압니다.',
    alibi: '사건 시각, 천문 동아리 정기 회의를 주재하고 있었다고 주장합니다.',
    dialogues: [
      dlg(
        'lyra_q1',
        '별자리구슬의 진짜 힘이 뭔가요?',
        '전설에 따르면 별의 위치를 읽어 미래의 재앙을 예언한다고 해요. 대부분은 미신이라 여기지만, 저는 진지하게 연구해왔어요.',
      ),
      dlg(
        'lyra_q2',
        '사건이 일어난 시각엔 어디에 있었나요?',
        '천문 동아리 정기 회의 중이었어요. 회의록에 제 발언이 시간별로 다 기록돼 있으니 확인해 보세요.',
        'clue_lyra_minutes',
      ),
      dlg(
        'lyra_q3',
        '금서고에서 구슬에 관한 책을 본 적 있나요?',
        '네, 여러 번요. 그런데 최근에 제가 찾던 책이 이미 대출 중이더라고요. 좀 의아했어요.',
      ),
    ],
  },
  {
    id: 'ashe',
    name: '코르빈 애쉬 교수',
    role: '연금술 교사',
    house: '교수진',
    emblem: '⚗️',
    summary: '엄격하지만 유능한 연금술 교사. 최근 씀씀이가 커졌다는 소문이 돌고 있습니다.',
    alibi: '사건 시각, 혼자 연구실에서 논문을 쓰고 있었다고 주장하지만 증인은 없습니다.',
    dialogues: [
      dlg(
        'ashe_q1',
        '최근 형편이 어렵다는 소문이 있던데요.',
        '...누가 그런 소릴 하던가요. 교사 월급이 넉넉지 않은 건 사실이지만, 그게 사건과 무슨 상관이죠?',
      ),
      dlg(
        'ashe_q2',
        '사건이 일어난 시각엔 어디에 있었나요?',
        '연구실에서 혼자 논문을 쓰고 있었습니다. 늦은 시간이라 아무도 못 봤겠지만요.',
        'clue_ashe_alibi',
      ),
      dlg(
        'ashe_q3',
        '실험실의 부식성 용액 재고가 비어 있던데요.',
        '...수업 준비로 다 썼습니다. 그게 왜 궁금하신 겁니까?',
      ),
    ],
  },
  {
    id: 'penelope',
    name: '페넬로피 그레이브스',
    role: '도서관 사서, 금서고 관리인',
    house: '무소속',
    emblem: '🗝️',
    summary: '수십 년간 금서고를 지켜온 깐깐한 사서. 대출 기록을 꼼꼼히 살핍니다.',
    alibi: '사건 시각, 금서고 재고 조사를 하고 있었습니다.',
    dialogues: [
      dlg(
        'penelope_q1',
        '최근 금서 대출 기록에서 이상한 점이 있었나요?',
        '있었죠. "몬드레이"라는 이름으로 별자리구슬 관련 금서가 대출됐는데, 필체가 교장 선생님 것과 달랐어요.',
      ),
      dlg(
        'penelope_q2',
        '그 필체가 누구 것인지 짐작 가는 사람이 있나요?',
        '확신해요. 코르빈 애쉬 교수의 글씨예요. 예전에 그가 제출한 재료 요청서를 여러 번 봤거든요. 독특한 "ㅅ" 자 모양을 잊을 수가 없죠.',
        'clue_penelope_testimony',
      ),
      dlg(
        'penelope_q3',
        '사건이 일어난 시각엔 어디에 있었나요?',
        '금서고에서 재고 조사를 하고 있었어요. 조수 학생 두 명이 같이 있었으니 확인해 보셔도 좋아요.',
      ),
    ],
  },
  {
    id: 'tom',
    name: '톰 래스본',
    role: '2학년, 시설 관리 보조',
    house: '불꽃탑',
    emblem: '🔥',
    summary: '용돈을 벌기 위해 밤늦게까지 시설 관리 아르바이트를 하는 학생.',
    alibi: '사건 시각, 순찰 경로에 따라 교내를 돌고 있었습니다.',
    dialogues: [
      dlg(
        'tom_q1',
        '어젯밤 순찰 중에 특별한 일이 있었나요?',
        '있었어요! 자정쯤 실험실 쪽에서 천문탑으로 걸어가는 그림자를 봤어요. 처음엔 그냥 순찰하는 선생님인 줄 알았는데...',
      ),
      dlg(
        'tom_q2',
        '그 사람에 대해 더 기억나는 게 있나요?',
        '망토에서 옅은 화학약품 냄새가 났던 것 같아요. 실험실 근처라 그런가 싶었는데, 지금 생각해보니 좀 이상했어요.',
        'clue_witness_shadow',
      ),
      dlg(
        'tom_q3',
        '순찰 경로는 업무일지에 기록되나요?',
        '네, 매일 시간대별로 기록해요. 관리실에 가시면 확인하실 수 있을 거예요.',
      ),
    ],
  },
];

export const SOLUTION: Solution = {
  culpritId: 'ashe',
  motive:
    '빚에 시달리던 코르빈 애쉬 교수는 별자리구슬을 암시장 수집가에게 팔아 넘겨 급전을 마련하려 했습니다. 연금술 지식으로 진열장의 결계 자물쇠를 산성 용액으로 녹이고, 가명으로 금서를 빌려 구슬의 가치를 미리 조사했습니다.',
  requiredClueIds: ['clue_solvent_residue', 'clue_debt_letter', 'clue_collector_letter'],
  briefing:
    '용의자를 지목하고, 그 근거가 되는 핵심 단서 3가지를 선택하세요. 정확한 조합이어야 사건을 해결할 수 있습니다.',
};
