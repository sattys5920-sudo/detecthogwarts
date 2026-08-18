import type { DayContent } from './types';

export const DAYS: DayContent[] = [
  {
    day: 1,
    title: '시체가 발견된 밤',
    summary: '8개 장면 · 관리자 진행',
    objective: '오늘의 목표 — 사건 현장과 6명의 용의자를 소개하고, \'아르카디아\'라는 첫 번째 수수께끼를 던진다.',
    script: [
      // 1. 프롤로그 — 봉쇄된 학교
      {
        id: 'd1s1n0', type: 'narration',
        text: '밤 10시 17분. 종이 울리고 학교 전체의 출입문이 잠긴다. 플레이어는 사건 현장으로 호출된다. 복도에는 교직원과 학생들이 모여 있지만 아무도 안으로 들어가지 못한다.',
      },
      {
        id: 'd1s1n1', type: 'narration',
        speaker: '파울', icon: '🗝️',
        text: '여기서부터는 제가 안내하겠습니다. 시신이 발견된 뒤 복도는 그대로 보존했습니다.',
      },
      {
        id: 'd1s1n2', type: 'narration',
        speaker: '교수', icon: '🎓',
        text: '학생이 죽었습니다. 지금부터 누구도 학교 밖으로 나갈 수 없습니다.',
      },
      {
        id: 'd1s1n3', type: 'narration',
        speaker: '파울', icon: '🗝️',
        text: '발견 시각은 10시 17분. 피해자는 후플푸프 11학년, 에드먼드 엘리오입니다.',
      },
      {
        id: 'd1s1c', type: 'choice',
        options: [{ id: 'A', text: '발견 시각부터 기록한다.' }, { id: 'B', text: '누가 처음 발견했는지 묻는다.' }, { id: 'C', text: '현장으로 바로 간다.' }],
      },
      {
        id: 'd1s1rA', type: 'narration',
        branchOf: { choiceBeatId: 'd1s1c', optionId: 'A' },
        text: '사건의 공식 시간축이 열린다.',
      },
      {
        id: 'd1s1rB', type: 'narration',
        branchOf: { choiceBeatId: 'd1s1c', optionId: 'B' },
        text: '파울이 발견자를 직접 밝히고, 현장 보존을 강조한다.',
      },
      {
        id: 'd1s1rC', type: 'narration',
        branchOf: { choiceBeatId: 'd1s1c', optionId: 'C' },
        text: '다음 조사로 이동한다.',
      },
      // 2. 현장 — 시체
      {
        id: 'd1s2n0', type: 'narration',
        text: '에드먼드는 오래된 석조 바닥에 쓰러져 있다. 머리 뒤쪽에 충격 흔적이 있으나 단순 추락만으로 설명하기 어려운 흔적이 남아 있다. 오른손에는 종이 조각이 구겨져 있다.',
      },
      {
        id: 'd1s2n1', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '이건 단순히 쓰러진 것처럼 보이지 않습니다.',
      },
      {
        id: 'd1s2n2', type: 'narration',
        speaker: '파울', icon: '🗝️',
        text: '시체는 제가 건드리지 않았습니다.',
      },
      {
        id: 'd1s2n3', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '그럼 이 종이는?',
      },
      {
        id: 'd1s2n4', type: 'narration',
        speaker: '파울', icon: '🗝️',
        text: '그것도 발견 당시 그대로입니다.',
      },
      {
        id: 'd1s2c', type: 'choice',
        options: [{ id: 'A', text: '오른손의 종이를 조사한다.' }, { id: 'B', text: '머리 뒤쪽을 조사한다.' }, { id: 'C', text: '옷과 주머니를 조사한다.' }],
      },
      {
        id: 'd1s2rA', type: 'narration',
        branchOf: { choiceBeatId: 'd1s2c', optionId: 'A' },
        text: '\'...아르카디아...\'라는 일부 문자를 확인한다.',
        clue: { title: 'E02. 에드먼드의 구겨진 메모', desc: '아르카디아에 대한 조사 흔적', ink: 'red', status: '확인됨' },
      },
      {
        id: 'd1s2rB', type: 'narration',
        branchOf: { choiceBeatId: 'd1s2c', optionId: 'B' },
        text: '한 번의 충격만으로는 사망 여부를 판단하기 어렵다는 단서를 얻는다.',
      },
      {
        id: 'd1s2rC', type: 'narration',
        branchOf: { choiceBeatId: 'd1s2c', optionId: 'C' },
        text: '진상 보고서는 보이지 않는다.',
      },
      // 3. 현장 — 아르카디아의 문장
      {
        id: 'd1s3n0', type: 'narration',
        text: '시체 옆 바닥에는 낯선 문장이 붉은 물질로 그려져 있다. 오래된 기숙사 문장처럼 보인다.',
      },
      {
        id: 'd1s3n1', type: 'narration',
        speaker: '학생', icon: '👤',
        text: '저런 기호... 학교에 저런 기숙사가 있었어요?',
      },
      {
        id: 'd1s3n2', type: 'narration',
        speaker: '파울', icon: '🗝️',
        text: '제가 오래 일했지만 처음 보는 문장입니다.',
      },
      {
        id: 'd1s3c', type: 'choice',
        options: [{ id: 'A', text: '문장을 스케치한다.' }, { id: 'B', text: '붉은 물질의 성질을 확인한다.' }, { id: 'C', text: '파울에게 문장을 아는지 재차 묻는다.' }],
      },
      {
        id: 'd1s3rA', type: 'narration',
        branchOf: { choiceBeatId: 'd1s3c', optionId: 'A' },
        text: '나중에 60년 전 기록과 대조할 수 있는 증거를 확보한다.',
        clue: { title: 'E01. 현장 사진', desc: '아르카디아 문장과 안토니우 아르카디아의 이름', ink: 'red', status: '확인됨' },
      },
      {
        id: 'd1s3rB', type: 'narration',
        branchOf: { choiceBeatId: 'd1s3c', optionId: 'B' },
        text: '혈액과 비슷하지만 일부 성분이 섞여 있다는 단서.',
      },
      {
        id: 'd1s3rC', type: 'narration',
        branchOf: { choiceBeatId: 'd1s3c', optionId: 'C' },
        text: '파울은 모른다고 답하지만 질문을 불편해한다.',
      },
      // 4. 현장 — 안토니우 아르카디아
      {
        id: 'd1s4n0', type: 'narration',
        text: '문장 아래에는 사람이 쓴 듯한 이름이 남아 있다. \'안토니우 아르카디아\'.',
      },
      {
        id: 'd1s4n1', type: 'narration',
        speaker: '아네스', icon: '🥀',
        text: '그 이름... 에드먼드가 며칠 전에 말했어요.',
      },
      {
        id: 'd1s4n2', type: 'narration',
        speaker: '셰인', icon: '📘',
        text: '나한테도 한 번 물어봤어. 그런데 내가 대답할 수 없었어.',
      },
      {
        id: 'd1s4c', type: 'choice',
        options: [{ id: 'A', text: '이름을 용의자들에게 보여준다.' }, { id: 'B', text: '안토니우가 누구인지 먼저 기록한다.' }, { id: 'C', text: '다잉메시지라고 판단한다.' }],
      },
      {
        id: 'd1s4rA', type: 'narration',
        branchOf: { choiceBeatId: 'd1s4c', optionId: 'A' },
        text: '각자의 반응 차이를 확인한다.',
      },
      {
        id: 'd1s4rB', type: 'narration',
        branchOf: { choiceBeatId: 'd1s4c', optionId: 'B' },
        text: '60년 전 사건 조사 항목이 생성된다.',
      },
      {
        id: 'd1s4rC', type: 'narration',
        branchOf: { choiceBeatId: 'd1s4c', optionId: 'C' },
        text: '현재는 확정할 수 없으며, 이후 반전의 씨앗이 된다.',
      },
      // 5. 아네스 조사
      {
        id: 'd1s5n0', type: 'narration',
        text: '아네스는 차갑게 침착하지만 에드먼드가 죽었다는 말을 듣자 잠시 표정이 무너진다.',
      },
      {
        id: 'd1s5n1', type: 'narration',
        speaker: '아네스', icon: '🥀',
        text: '저는 그를 죽이지 않았어요. 물론... 그날 밤 그를 따라간 건 맞아요.',
      },
      {
        id: 'd1s5n2', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '왜 따라갔습니까?',
      },
      {
        id: 'd1s5n3', type: 'narration',
        speaker: '아네스', icon: '🥀',
        text: '바람을 피우는 줄 알았으니까요. 그리고 따라가다 이상한 문을 봤어요. 그 뒤로는 모르는 척했어요.',
      },
      {
        id: 'd1s5c', type: 'choice',
        options: [{ id: 'A', text: '불륜 의심부터 묻는다.' }, { id: 'B', text: '이상한 문을 묻는다.' }, { id: 'C', text: '제5 기숙사를 아느냐고 묻는다.' }],
      },
      {
        id: 'd1s5rA', type: 'narration',
        branchOf: { choiceBeatId: 'd1s5c', optionId: 'A' },
        text: '아네스가 질투 때문에 피해자와 다퉜다는 사실을 얻는다.',
      },
      {
        id: 'd1s5rB', type: 'narration',
        branchOf: { choiceBeatId: 'd1s5c', optionId: 'B' },
        text: '아네스가 지하 복도의 잠긴 문을 봤다고 말한다.',
      },
      {
        id: 'd1s5rC', type: 'narration',
        branchOf: { choiceBeatId: 'd1s5c', optionId: 'C' },
        text: '아네스는 \'그 이름은 처음 듣는다\'고 거짓말한다.',
      },
      // 6. 셰인 조사
      {
        id: 'd1s6n0', type: 'narration',
        text: '셰인은 친구를 잃은 충격과 두려움이 섞여 있다. 특정 질문을 할 때 관자놀이를 누른다.',
      },
      {
        id: 'd1s6n1', type: 'narration',
        speaker: '셰인', icon: '📘',
        text: '에드먼드한테 그 조사를 그만두라고 했어요.',
      },
      {
        id: 'd1s6n2', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '왜요?',
      },
      {
        id: 'd1s6n3', type: 'narration',
        speaker: '셰인', icon: '📘',
        text: '그냥... 위험해 보여서.',
      },
      {
        id: 'd1s6n4', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '아르카디아를 아나요?',
      },
      {
        id: 'd1s6n5', type: 'narration',
        speaker: '셰인', icon: '📘',
        text: '...말하려고 하면 머리가 깨질 것처럼 아파요.',
      },
      {
        id: 'd1s6c', type: 'choice',
        options: [{ id: 'A', text: '할아버지 이야기를 묻는다.' }, { id: 'B', text: '왜 말하면 아픈지 묻는다.' }, { id: 'C', text: '에드먼드와 싸웠는지 묻는다.' }],
      },
      {
        id: 'd1s6rA', type: 'narration',
        branchOf: { choiceBeatId: 'd1s6c', optionId: 'A' },
        text: '가족이 60년 전 사건과 관련되었다는 단서.',
      },
      {
        id: 'd1s6rB', type: 'narration',
        branchOf: { choiceBeatId: 'd1s6c', optionId: 'B' },
        text: '마법부가 과거 사건 관련 발언을 제한하는 봉인 마법을 걸었다는 단서.',
      },
      {
        id: 'd1s6rC', type: 'narration',
        branchOf: { choiceBeatId: 'd1s6c', optionId: 'C' },
        text: '조사를 막으려 여러 차례 다퉜다는 사실.',
      },
      // 7. 타치바나 조사
      {
        id: 'd1s7n0', type: 'narration',
        text: '타치바나는 평소보다 말이 짧다. 에드먼드와 라이벌이었다는 사실을 인정하지만 살인에 대해서는 부정한다.',
      },
      {
        id: 'd1s7n1', type: 'narration',
        speaker: '타치바나', icon: '⚔️',
        text: '그를 싫어했습니다. 인정하죠. 하지만 죽이고 싶지는 않았습니다.',
      },
      {
        id: 'd1s7n2', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '금지된 마법을 연구했다는 소문이 있습니다.',
      },
      {
        id: 'd1s7n3', type: 'narration',
        speaker: '타치바나', icon: '⚔️',
        text: '연구한 건 맞습니다. 사용한 적은 없습니다.',
      },
      {
        id: 'd1s7c', type: 'choice',
        options: [{ id: 'A', text: '연구 내용을 묻는다.' }, { id: 'B', text: '에드먼드와 마지막으로 만났는지 묻는다.' }, { id: 'C', text: '교수와 관계를 묻는다.' }],
      },
      {
        id: 'd1s7rA', type: 'narration',
        branchOf: { choiceBeatId: 'd1s7c', optionId: 'A' },
        text: '정신을 흐리거나 신체를 약화시키는 금지된 마법 연구라는 단서.',
      },
      {
        id: 'd1s7rB', type: 'narration',
        branchOf: { choiceBeatId: 'd1s7c', optionId: 'B' },
        text: '타치바나는 \'그날 밤 만나지 않았다\'고 거짓말한다.',
      },
      {
        id: 'd1s7rC', type: 'narration',
        branchOf: { choiceBeatId: 'd1s7c', optionId: 'C' },
        text: '셀레나 교수의 지도를 받았다는 사실.',
      },
      // 8. 1일차 종료 — 첫 번째 의문
      {
        id: 'd1s8n0', type: 'narration',
        text: '모든 진술을 정리하던 중, 현장 사진에서 이상한 점이 발견된다. \'안토니우 아르카디아\'의 필체와 문장의 붉은 흔적이 서로 다른 시점에 남겨진 것처럼 보인다.',
      },
      {
        id: 'd1s8n1', type: 'narration',
        speaker: '파울', icon: '🗝️',
        text: '죽은 사람이 마지막으로 남긴 글이라면... 왜 이렇게 또렷하죠?',
      },
      {
        id: 'd1s8n2', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '그게 오히려 이상한 겁니다.',
      },
      {
        id: 'd1s8c', type: 'choice',
        options: [{ id: 'A', text: '필체 분석을 의뢰한다.' }, { id: 'B', text: '아르카디아를 옛 기숙사로 가정한다.' }, { id: 'C', text: '용의자 6명을 모두 의심한다.' }],
      },
      {
        id: 'd1s8rA', type: 'narration',
        branchOf: { choiceBeatId: 'd1s8c', optionId: 'A' },
        text: '안토니우라는 이름은 에드먼드의 필체가 아닐 가능성이 열린다.',
        clue: { title: 'E14. 현장 필체 분석', desc: '안토니우 아르카디아의 이름이 에드먼드의 다잉메시지가 아닐 가능성', ink: 'red', status: '확인됨' },
      },
      {
        id: 'd1s8rB', type: 'narration',
        branchOf: { choiceBeatId: 'd1s8c', optionId: 'B' },
        text: 'DAY 2의 기록실 조사가 해금된다.',
      },
      {
        id: 'd1s8rC', type: 'narration',
        branchOf: { choiceBeatId: 'd1s8c', optionId: 'C' },
        text: '전체 용의자 프로필이 확정된다.',
      },
    ],
    closing: '1일차 조사를 마쳤다. 내일은 새로운 실마리를 찾아야 한다.',
  },
  {
    day: 2,
    title: '알리바이의 밤',
    summary: '8개 장면 · 관리자 진행',
    objective: '오늘의 목표 — 6명의 알리바이를 검증하고, 각각의 비밀이 살인과 반드시 일치하지 않는다는 구조를 만든다.',
    script: [
      // 1. 기록실 — 공식 시간표
      {
        id: 'd2s1n0', type: 'narration',
        text: '학교의 자동 기록 장치와 초상화의 목격 기록을 비교한다.',
      },
      {
        id: 'd2s1n1', type: 'narration',
        speaker: '기록 담당자', icon: '📗',
        text: '밤 9시부터 10시까지는 자동으로 위치가 기록됩니다. 다만 변신 마법은 별개입니다.',
      },
      {
        id: 'd2s1c', type: 'choice',
        options: [{ id: 'A', text: '자동 기록을 우선한다.' }, { id: 'B', text: '초상화 증언을 확인한다.' }, { id: 'C', text: '변신 마법 가능성을 기록한다.' }],
      },
      {
        id: 'd2s1rA', type: 'narration',
        branchOf: { choiceBeatId: 'd2s1c', optionId: 'A' },
        text: '공식 알리바이 표가 생성된다.',
      },
      {
        id: 'd2s1rB', type: 'narration',
        branchOf: { choiceBeatId: 'd2s1c', optionId: 'B' },
        text: '목격이 실제 인물인지 검증할 필요가 생긴다.',
      },
      {
        id: 'd2s1rC', type: 'narration',
        branchOf: { choiceBeatId: 'd2s1c', optionId: 'C' },
        text: '셀레나와 타치바나의 연결 단서가 생성된다.',
      },
      // 2. 아네스의 밤
      {
        id: 'd2s2n0', type: 'narration',
        text: '아네스의 알리바이를 확인한다.',
      },
      {
        id: 'd2s2n1', type: 'narration',
        speaker: '아네스', icon: '🥀',
        text: '저는 기숙사에 있었어요. 다만 9시 40분쯤 잠깐 나갔어요.',
      },
      {
        id: 'd2s2n2', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '왜요?',
      },
      {
        id: 'd2s2n3', type: 'narration',
        speaker: '아네스', icon: '🥀',
        text: '에드먼드가 돌아오지 않아서요. 따라갔다가 지하 복도 입구를 보고 돌아왔어요.',
      },
      {
        id: 'd2s2c', type: 'choice',
        options: [{ id: 'A', text: '지하 복도 흔적을 조사한다.' }, { id: 'B', text: '아네스의 친구를 확인한다.' }, { id: 'C', text: '불륜 관련 물건을 조사한다.' }],
      },
      {
        id: 'd2s2rA', type: 'narration',
        branchOf: { choiceBeatId: 'd2s2c', optionId: 'A' },
        text: '아네스가 실제로 그곳에 있었다는 흔적.',
      },
      {
        id: 'd2s2rB', type: 'narration',
        branchOf: { choiceBeatId: 'd2s2c', optionId: 'B' },
        text: '9시 50분경 돌아온 것을 확인.',
      },
      {
        id: 'd2s2rC', type: 'narration',
        branchOf: { choiceBeatId: 'd2s2c', optionId: 'C' },
        text: '에드먼드를 미행한 동기가 확인된다.',
      },
      // 3. 셰인의 밤
      {
        id: 'd2s3n0', type: 'narration',
        text: '셰인은 도서관에서 실제로 공부하고 있었다.',
      },
      {
        id: 'd2s3n1', type: 'narration',
        speaker: '사서', icon: '📚',
        text: '셰인은 8시 30분부터 거의 움직이지 않았습니다. 중간에 화장실에 간 것 말고는요.',
      },
      {
        id: 'd2s3n2', type: 'narration',
        speaker: '셰인', icon: '📘',
        text: '제가 숨기는 게 있다면... 할아버지 이야기입니다. 살인과는 관계없어요.',
      },
      {
        id: 'd2s3c', type: 'choice',
        options: [{ id: 'A', text: '사서 기록을 확보한다.' }, { id: 'B', text: '봉인 마법을 조사한다.' }, { id: 'C', text: '할아버지 기록을 찾는다.' }],
      },
      {
        id: 'd2s3rA', type: 'narration',
        branchOf: { choiceBeatId: 'd2s3c', optionId: 'A' },
        text: '셰인의 알리바이가 사실임을 확인.',
      },
      {
        id: 'd2s3rB', type: 'narration',
        branchOf: { choiceBeatId: 'd2s3c', optionId: 'B' },
        text: '셰인이 말할 수 없는 이유를 확인.',
      },
      {
        id: 'd2s3rC', type: 'narration',
        branchOf: { choiceBeatId: 'd2s3c', optionId: 'C' },
        text: 'DAY 3의 60년 전 사건으로 연결.',
      },
      // 4. 타치바나의 연구실
      {
        id: 'd2s4n0', type: 'narration',
        text: '타치바나는 사건 시각에 연구실에 있었다고 주장한다. 연구실에는 실제 연구 흔적이 있다.',
      },
      {
        id: 'd2s4n1', type: 'narration',
        speaker: '타치바나', icon: '⚔️',
        text: '저는 그 시간에 연구했습니다. 금지된 마법인 건 맞습니다. 하지만 사람을 죽이는 마법은 아니었습니다.',
      },
      {
        id: 'd2s4n2', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '누가 연구를 시켰습니까?',
      },
      {
        id: 'd2s4n3', type: 'narration',
        speaker: '타치바나', icon: '⚔️',
        text: '...교수님입니다.',
      },
      {
        id: 'd2s4c', type: 'choice',
        options: [{ id: 'A', text: '연구 노트를 본다.' }, { id: 'B', text: '셀레나와의 지시 관계를 묻는다.' }, { id: 'C', text: '알리바이를 확인한다.' }],
      },
      {
        id: 'd2s4rA', type: 'narration',
        branchOf: { choiceBeatId: 'd2s4c', optionId: 'A' },
        text: '육체 약화·감각 왜곡 계열의 마법 연구.',
        clue: { title: 'E04. 타치바나의 연구 노트', desc: '금지된 마법 연구. 살인마법은 아님', ink: 'red', status: '확인됨' },
      },
      {
        id: 'd2s4rB', type: 'narration',
        branchOf: { choiceBeatId: 'd2s4c', optionId: 'B' },
        text: '셀레나가 연구를 지속적으로 지시했다는 단서.',
      },
      {
        id: 'd2s4rC', type: 'narration',
        branchOf: { choiceBeatId: 'd2s4c', optionId: 'C' },
        text: '연구 기록이 실제로 존재한다는 단서.',
      },
      // 5. 셀레나의 밤
      {
        id: 'd2s5n0', type: 'narration',
        text: '셀레나는 사건 시간에 자신의 방에서 학생 과제물을 정리했다고 주장한다.',
      },
      {
        id: 'd2s5n1', type: 'narration',
        speaker: '셀레나', icon: '🪄',
        text: '타치바나는 문제를 일으키는 학생이지만, 제가 그를 죽음으로 몰아넣을 이유는 없습니다.',
      },
      {
        id: 'd2s5c', type: 'choice',
        options: [{ id: 'A', text: '과제물 기록을 조사한다.' }, { id: 'B', text: '타치바나의 연구를 추궁한다.' }, { id: 'C', text: '변신 물약을 조사한다.' }],
      },
      {
        id: 'd2s5rA', type: 'narration',
        branchOf: { choiceBeatId: 'd2s5c', optionId: 'A' },
        text: '실제 작업 흔적이 있다.',
      },
      {
        id: 'd2s5rB', type: 'narration',
        branchOf: { choiceBeatId: 'd2s5c', optionId: 'B' },
        text: '셀레나가 순간적으로 과민반응한다.',
      },
      {
        id: 'd2s5rC', type: 'narration',
        branchOf: { choiceBeatId: 'd2s5c', optionId: 'C' },
        text: '최근 변신 물약 재료가 사용된 기록이 나온다.',
      },
      // 6. 용의자 5 조사
      {
        id: 'd2s6n0', type: 'narration',
        text: '이 인물은 자신이 아르카디아의 잔재와 연결되어 있음을 일부 인정한다.',
      },
      {
        id: 'd2s6n1', type: 'narration',
        speaker: '용의자 5', icon: '🌫️',
        text: '아르카디아는 죽지 않았습니다. 이름만 지워졌을 뿐이에요.',
      },
      {
        id: 'd2s6n2', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '에드먼드를 죽였습니까?',
      },
      {
        id: 'd2s6n3', type: 'narration',
        speaker: '용의자 5', icon: '🌫️',
        text: '아니요. 하지만 그가 너무 많은 것을 알아낸 건 사실입니다.',
      },
      {
        id: 'd2s6c', type: 'choice',
        options: [{ id: 'A', text: '연구 장소를 조사한다.' }, { id: 'B', text: '교단의 구조를 묻는다.' }, { id: 'C', text: '에드먼드와의 접촉을 묻는다.' }],
      },
      {
        id: 'd2s6rA', type: 'narration',
        branchOf: { choiceBeatId: 'd2s6c', optionId: 'A' },
        text: '옛 교리와 관련된 연구물이 발견된다.',
      },
      {
        id: 'd2s6rB', type: 'narration',
        branchOf: { choiceBeatId: 'd2s6c', optionId: 'B' },
        text: '모닝베일의 교리가 현재까지 변형되어 전승되었다는 단서.',
      },
      {
        id: 'd2s6rC', type: 'narration',
        branchOf: { choiceBeatId: 'd2s6c', optionId: 'C' },
        text: '최근 한 차례 만났다는 사실.',
      },
      // 7. 파울의 알리바이
      {
        id: 'd2s7n0', type: 'narration',
        text: '파울은 사건 시간에 서쪽 보일러실을 점검했다고 말한다.',
      },
      {
        id: 'd2s7n1', type: 'narration',
        speaker: '파울', icon: '🗝️',
        text: '밤 9시 30분부터 10시 10분까지 보일러실에 있었습니다. 학교가 오래돼서요.',
      },
      {
        id: 'd2s7c', type: 'choice',
        options: [{ id: 'A', text: '보일러 기록을 확인한다.' }, { id: 'B', text: '파울의 동선을 묻는다.' }, { id: 'C', text: '왜 사건 현장을 잘 아는지 묻는다.' }],
      },
      {
        id: 'd2s7rA', type: 'narration',
        branchOf: { choiceBeatId: 'd2s7c', optionId: 'A' },
        text: '실제로 출입 기록이 남아 있다.',
      },
      {
        id: 'd2s7rB', type: 'narration',
        branchOf: { choiceBeatId: 'd2s7c', optionId: 'B' },
        text: '서쪽 구역과 사건 현장 사이의 비밀 통로가 있음을 암시.',
      },
      {
        id: 'd2s7rC', type: 'narration',
        branchOf: { choiceBeatId: 'd2s7c', optionId: 'C' },
        text: '관리인으로서 학교 구조를 잘 안다는 자연스러운 답변.',
      },
      // 8. 2일차 종료 — 완벽하지 않은 알리바이
      {
        id: 'd2s8n0', type: 'narration',
        text: '여섯 명 중 누구도 즉시 범인으로 확정되지 않는다. 그러나 변신 물약과 지하 통로가 동시에 등장한다.',
      },
      {
        id: 'd2s8n1', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '알리바이는 사실일 수도 있고, 일부만 사실일 수도 있습니다.',
      },
      {
        id: 'd2s8n2', type: 'narration',
        speaker: '파울', icon: '🗝️',
        text: '그렇다면 과거부터 봐야겠군요.',
      },
      {
        id: 'd2s8c', type: 'choice',
        options: [{ id: 'A', text: '아르카디아 기록을 찾는다.' }, { id: 'B', text: '변신 물약 기록을 추적한다.' }, { id: 'C', text: '진상 보고서의 행방을 찾는다.' }],
      },
      {
        id: 'd2s8rA', type: 'narration',
        branchOf: { choiceBeatId: 'd2s8c', optionId: 'A' },
        text: 'DAY 3 해금.',
      },
      {
        id: 'd2s8rB', type: 'narration',
        branchOf: { choiceBeatId: 'd2s8c', optionId: 'B' },
        text: '셀레나·타치바나의 비밀 조사 노드.',
      },
      {
        id: 'd2s8rC', type: 'narration',
        branchOf: { choiceBeatId: 'd2s8c', optionId: 'C' },
        text: '에드먼드가 무엇을 찾았는지 조사 시작.',
      },
    ],
    closing: '2일차 조사를 마쳤다. 내일은 새로운 실마리를 찾아야 한다.',
  },
  {
    day: 3,
    title: '사라진 기숙사',
    summary: '8개 장면 · 관리자 진행',
    objective: '오늘의 목표 — 아르카디아와 모닝베일의 교리를 밝히고, 사건이 단순한 학생 간 원한이 아님을 확정한다.',
    script: [
      // 1. 폐기된 기록 보관소
      {
        id: 'd3s1n0', type: 'narration',
        text: '오래된 문서에서 \'아르카디아\'라는 제5 기숙사의 이름을 발견한다.',
      },
      {
        id: 'd3s1n1', type: 'narration',
        speaker: '기록', icon: '📜',
        text: '아르카디아 기숙사. 60년 전 폐쇄. 공식 사유: 구조적 위험.',
      },
      {
        id: 'd3s1c', type: 'choice',
        options: [{ id: 'A', text: '공식 사유를 믿는다.' }, { id: 'B', text: '폐쇄 직전 기록을 찾는다.' }, { id: 'C', text: '기숙사 문장을 대조한다.' }],
      },
      {
        id: 'd3s1rA', type: 'narration',
        branchOf: { choiceBeatId: 'd3s1c', optionId: 'A' },
        text: '곧바로 모순된 문서가 발견된다.',
      },
      {
        id: 'd3s1rB', type: 'narration',
        branchOf: { choiceBeatId: 'd3s1c', optionId: 'B' },
        text: '학생 사망 사건이 반복되었다는 단서.',
      },
      {
        id: 'd3s1rC', type: 'narration',
        branchOf: { choiceBeatId: 'd3s1c', optionId: 'C' },
        text: '현장 문장과 완전히 일치.',
        clue: { title: 'E06. 아르카디아 기숙사 기록', desc: '제5 기숙사의 존재', ink: 'indigo', status: '확인됨' },
      },
      // 2. 모닝베일
      {
        id: 'd3s2n0', type: 'narration',
        text: '당시 교수 겸 사감의 기록을 발견한다.',
      },
      {
        id: 'd3s2n1', type: 'narration',
        speaker: '기록', icon: '📜',
        text: '모닝베일. 아르카디아 기숙사 사감. 아름다움의 경계를 넘어선 교육을 주장.',
      },
      {
        id: 'd3s2c', type: 'choice',
        options: [{ id: 'A', text: '그의 교리를 조사한다.' }, { id: 'B', text: '그의 최후를 조사한다.' }, { id: 'C', text: '학생 증언을 찾는다.' }],
      },
      {
        id: 'd3s2rA', type: 'narration',
        branchOf: { choiceBeatId: 'd3s2c', optionId: 'A' },
        text: '\'죽음의 경계를 넘어야 한다\'는 교리.',
        clue: { title: 'E07. 모닝베일 기록', desc: '사이비 교리의 핵심', ink: 'red', status: '확인됨' },
      },
      {
        id: 'd3s2rB', type: 'narration',
        branchOf: { choiceBeatId: 'd3s2c', optionId: 'B' },
        text: '사건 후 행방이 공식 기록에서 사라짐.',
      },
      {
        id: 'd3s2rC', type: 'narration',
        branchOf: { choiceBeatId: 'd3s2c', optionId: 'C' },
        text: '교리가 사이비 종교처럼 퍼졌다는 증언.',
      },
      // 3. 희생의 의식
      {
        id: 'd3s3n0', type: 'narration',
        text: '금지된 의식의 단서를 찾는다.',
      },
      {
        id: 'd3s3n1', type: 'narration',
        speaker: '기록', icon: '📜',
        text: '한 명의 생명을 대가로, 한 명이 죽음의 문턱을 경험한다.',
      },
      {
        id: 'd3s3c', type: 'choice',
        options: [{ id: 'A', text: '대가가 무엇인지 조사한다.' }, { id: 'B', text: '의식 결과를 조사한다.' }, { id: 'C', text: '마법의 이름을 찾는다.' }],
      },
      {
        id: 'd3s3rA', type: 'narration',
        branchOf: { choiceBeatId: 'd3s3c', optionId: 'A' },
        text: '다른 인간의 생명이 필요했다는 사실.',
      },
      {
        id: 'd3s3rB', type: 'narration',
        branchOf: { choiceBeatId: 'd3s3c', optionId: 'B' },
        text: '의식을 치른 뒤 살아남은 학생들이 극단적 행동을 했다는 기록.',
        clue: { title: 'E08. 희생자 명단', desc: '의식의 실체', ink: 'black', status: '확인됨' },
      },
      {
        id: 'd3s3rC', type: 'narration',
        branchOf: { choiceBeatId: 'd3s3c', optionId: 'C' },
        text: '구체적 주문명은 삭제되어 있음.',
      },
      // 4. 셰인의 할아버지
      {
        id: 'd3s4n0', type: 'narration',
        text: '셰인의 할아버지가 당시 희생자였다는 사실이 드러난다.',
      },
      {
        id: 'd3s4n1', type: 'narration',
        speaker: '셰인', icon: '📘',
        text: '이제 이해했죠? 제가 왜 말하지 못했는지.',
      },
      {
        id: 'd3s4n2', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '할아버지가 아르카디아의 희생자였습니까?',
      },
      {
        id: 'd3s4n3', type: 'narration',
        speaker: '셰인', icon: '📘',
        text: '네. 하지만 그 사실을 말하려 하면 마법이 저를 막습니다.',
      },
      {
        id: 'd3s4c', type: 'choice',
        options: [{ id: 'A', text: '셰인을 믿는다.' }, { id: 'B', text: '그에게 더 말하게 한다.' }, { id: 'C', text: '마법부 기록을 찾는다.' }],
      },
      {
        id: 'd3s4rA', type: 'narration',
        branchOf: { choiceBeatId: 'd3s4c', optionId: 'A' },
        text: '봉인 마법의 존재가 확인된다.',
        clue: { title: 'E05. 셰인의 봉인 흔적', desc: '마법부가 60년 전 사건을 은폐한 증거', ink: 'indigo', status: '확인됨' },
      },
      {
        id: 'd3s4rB', type: 'narration',
        branchOf: { choiceBeatId: 'd3s4c', optionId: 'B' },
        text: '고통이 심해져 더 이상 진술할 수 없다.',
      },
      {
        id: 'd3s4rC', type: 'narration',
        branchOf: { choiceBeatId: 'd3s4c', optionId: 'C' },
        text: '은폐 지시의 흔적이 발견된다.',
      },
      // 5. 안토니우 아르카디아
      {
        id: 'd3s5n0', type: 'narration',
        text: '오래된 기록에서 안토니우 아르카디아라는 이름이 반복적으로 발견된다.',
      },
      {
        id: 'd3s5n1', type: 'narration',
        speaker: '기록', icon: '📜',
        text: '안토니우 아르카디아 — 사건 관련 증언자. 이후 행방 불명.',
      },
      {
        id: 'd3s5c', type: 'choice',
        options: [{ id: 'A', text: '안토니우를 피해자로 본다.' }, { id: 'B', text: '교단원으로 본다.' }, { id: 'C', text: '모닝베일과의 관계를 찾는다.' }],
      },
      {
        id: 'd3s5rA', type: 'narration',
        branchOf: { choiceBeatId: 'd3s5c', optionId: 'A' },
        text: '사건의 핵심 인물이라는 단서.',
      },
      {
        id: 'd3s5rB', type: 'narration',
        branchOf: { choiceBeatId: 'd3s5c', optionId: 'B' },
        text: '당시 교리와 연결된 기록이 있으나 결정적이지 않다.',
      },
      {
        id: 'd3s5rC', type: 'narration',
        branchOf: { choiceBeatId: 'd3s5c', optionId: 'C' },
        text: '둘 사이의 관계가 아직 비어 있어 DAY 4로 연결.',
      },
      // 6. 진상 보고서의 존재
      {
        id: 'd3s6n0', type: 'narration',
        text: '에드먼드가 찾았던 문서의 일부가 발견된다.',
      },
      {
        id: 'd3s6n1', type: 'narration',
        speaker: '에드먼드의 메모', icon: '💬',
        text: '이 보고서가 공개되면 학교는 더 이상 숨길 수 없다. 하지만 지금 공개하면 아직 남아 있는 자들이 움직일 수 있다.',
      },
      {
        id: 'd3s6c', type: 'choice',
        options: [{ id: 'A', text: '에드먼드가 공개를 망설인 이유를 조사한다.' }, { id: 'B', text: '보고서 전체를 찾는다.' }, { id: 'C', text: '누가 보고서를 노렸는지 조사한다.' }],
      },
      {
        id: 'd3s6rA', type: 'narration',
        branchOf: { choiceBeatId: 'd3s6c', optionId: 'A' },
        text: '피해자가 사건을 막는 것과 폭로 사이에서 고민했다는 사실.',
        clue: { title: 'E09. 진상 보고서 일부', desc: '학교·마법부 은폐의 증거', ink: 'indigo', status: '확인됨' },
      },
      {
        id: 'd3s6rB', type: 'narration',
        branchOf: { choiceBeatId: 'd3s6c', optionId: 'B' },
        text: '보고서가 이미 사라졌다는 사실.',
      },
      {
        id: 'd3s6rC', type: 'narration',
        branchOf: { choiceBeatId: 'd3s6c', optionId: 'C' },
        text: '셀레나와 타치바나의 연결로 이동.',
      },
      // 7. 파울의 과거
      {
        id: 'd3s7n0', type: 'narration',
        text: '파울은 과거 사건을 잘 알고 있는 듯한 모습을 보인다.',
      },
      {
        id: 'd3s7n1', type: 'narration',
        speaker: '파울', icon: '🗝️',
        text: '오래된 학교에는 오래된 죄가 있습니다. 누군가는 그것을 기억해야 합니다.',
      },
      {
        id: 'd3s7c', type: 'choice',
        options: [{ id: 'A', text: '그가 왜 이런 말을 하는지 묻는다.' }, { id: 'B', text: '안토니우를 아느냐고 묻는다.' }, { id: 'C', text: '모닝베일을 아느냐고 묻는다.' }],
      },
      {
        id: 'd3s7rA', type: 'narration',
        branchOf: { choiceBeatId: 'd3s7c', optionId: 'A' },
        text: '파울은 관리인이라 오래된 이야기를 들었다고 둘러댄다.',
      },
      {
        id: 'd3s7rB', type: 'narration',
        branchOf: { choiceBeatId: 'd3s7c', optionId: 'B' },
        text: '잠깐 침묵한 뒤 모른다고 답한다.',
      },
      {
        id: 'd3s7rC', type: 'narration',
        branchOf: { choiceBeatId: 'd3s7c', optionId: 'C' },
        text: '\'기록에서 본 이름일 뿐\'이라고 답한다.',
      },
      // 8. 3일차 종료 — 과거가 현재를 침범하다
      {
        id: 'd3s8n0', type: 'narration',
        text: '현장 문장과 아르카디아 기숙사 문장이 일치한다. 그러나 \'안토니우 아르카디아\'의 이름은 에드먼드가 남긴 것이 아닐 가능성이 커진다.',
      },
      {
        id: 'd3s8n1', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '누군가 60년 전 사건을 현재의 살인에 덧씌웠습니다.',
      },
      {
        id: 'd3s8n2', type: 'narration',
        speaker: '파울', icon: '🗝️',
        text: '그렇다면 범인은 과거를 알고 있겠군요.',
      },
      {
        id: 'd3s8c', type: 'choice',
        options: [{ id: 'A', text: '타치바나의 연구를 다시 본다.' }, { id: 'B', text: '진상 보고서 탈취를 추적한다.' }, { id: 'C', text: '현장 필체를 재검사한다.' }],
      },
      {
        id: 'd3s8rA', type: 'narration',
        branchOf: { choiceBeatId: 'd3s8c', optionId: 'A' },
        text: 'DAY 4 핵심으로 연결.',
      },
      {
        id: 'd3s8rB', type: 'narration',
        branchOf: { choiceBeatId: 'd3s8c', optionId: 'B' },
        text: '변신 물약과 대치 장면으로 연결.',
      },
      {
        id: 'd3s8rC', type: 'narration',
        branchOf: { choiceBeatId: 'd3s8c', optionId: 'C' },
        text: '\'안토니우\'가 다잉메시지가 아닐 가능성이 상승.',
      },
    ],
    closing: '3일차 조사를 마쳤다. 내일은 새로운 실마리를 찾아야 한다.',
  },
  {
    day: 4,
    title: '죽기 전의 에드먼드',
    summary: '8개 장면 · 관리자 진행',
    objective: '오늘의 목표 — 사건 당일 시간축을 분 단위로 재구성하고, 타치바나와 셀레나가 실제 범행을 했지만 살인범은 아니라는 반전을 만든다.',
    script: [
      // 1. 변신 물약 기록
      {
        id: 'd4s1n0', type: 'narration',
        text: '실험실 기록에서 두 사람이 같은 날 변신 물약을 사용한 흔적을 찾는다.',
      },
      {
        id: 'd4s1n1', type: 'narration',
        speaker: '기록', icon: '📜',
        text: '사용자 신원 확인 불가. 동일한 두 개의 복용량.',
      },
      {
        id: 'd4s1c', type: 'choice',
        options: [{ id: 'A', text: '복용량을 비교한다.' }, { id: 'B', text: '물약 사용 시간을 확인한다.' }, { id: 'C', text: '사용자를 특정한다.' }],
      },
      {
        id: 'd4s1rA', type: 'narration',
        branchOf: { choiceBeatId: 'd4s1c', optionId: 'A' },
        text: '두 사람이 서로의 모습을 바꾸었을 가능성이 열린다.',
        clue: { title: 'E03. 변신 물약 기록', desc: '셀레나와 타치바나가 서로 모습을 바꿨음을 암시', ink: 'indigo', status: '확인됨' },
      },
      {
        id: 'd4s1rB', type: 'narration',
        branchOf: { choiceBeatId: 'd4s1c', optionId: 'B' },
        text: '사건 직전 두 사람이 각각 다른 위치에 있었음이 확인된다.',
      },
      {
        id: 'd4s1rC', type: 'narration',
        branchOf: { choiceBeatId: 'd4s1c', optionId: 'C' },
        text: '결정적 증거는 없지만 셀레나와 타치바나가 압축된다.',
      },
      // 2. 타치바나의 진술 붕괴
      {
        id: 'd4s2n0', type: 'narration',
        text: '타치바나는 사건 시간의 기억을 묻자 대답하지 못한다.',
      },
      {
        id: 'd4s2n1', type: 'narration',
        speaker: '타치바나', icon: '⚔️',
        text: '그 시간에... 제가 어디 있었는지는 확실히 말할 수 없습니다.',
      },
      {
        id: 'd4s2n2', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '왜 기억이 없습니까?',
      },
      {
        id: 'd4s2n3', type: 'narration',
        speaker: '타치바나', icon: '⚔️',
        text: '교수님과 관련된 일입니다.',
      },
      {
        id: 'd4s2c', type: 'choice',
        options: [{ id: 'A', text: '정면으로 추궁한다.' }, { id: 'B', text: '교수를 추궁한다.' }, { id: 'C', text: '기억보다 물리적 증거를 찾는다.' }],
      },
      {
        id: 'd4s2rA', type: 'narration',
        branchOf: { choiceBeatId: 'd4s2c', optionId: 'A' },
        text: '타치바나가 변신 물약을 사용했다는 사실을 털어놓는다.',
      },
      {
        id: 'd4s2rB', type: 'narration',
        branchOf: { choiceBeatId: 'd4s2c', optionId: 'B' },
        text: '셀레나가 \'학생의 실수\'라고 방어한다.',
      },
      {
        id: 'd4s2rC', type: 'narration',
        branchOf: { choiceBeatId: 'd4s2c', optionId: 'C' },
        text: '타치바나가 실제로 현장에 있었다는 흔적을 찾는다.',
      },
      // 3. 에드먼드가 밀친 순간
      {
        id: 'd4s3n0', type: 'narration',
        text: '복도 흔적을 분석해 에드먼드가 뒤로 넘어져 머리를 부딪힌 시점을 추정한다.',
      },
      {
        id: 'd4s3n1', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '이 충격은 치명상이 아니었습니다.',
      },
      {
        id: 'd4s3n2', type: 'narration',
        speaker: '의무 담당자', icon: '➕',
        text: '살아 있었다는 뜻입니다.',
      },
      {
        id: 'd4s3c', type: 'choice',
        options: [{ id: 'A', text: '타치바나에게 묻는다.' }, { id: 'B', text: '사망 시각을 다시 계산한다.' }, { id: 'C', text: '누가 이후 접근했는지 조사한다.' }],
      },
      {
        id: 'd4s3rA', type: 'narration',
        branchOf: { choiceBeatId: 'd4s3c', optionId: 'A' },
        text: '타치바나가 결국 에드먼드를 밀쳤다고 인정한다.',
        clue: { title: 'E10. 현장 충격 흔적', desc: '타치바나의 공격이 있었음', ink: 'black', status: '확인됨' },
      },
      {
        id: 'd4s3rB', type: 'narration',
        branchOf: { choiceBeatId: 'd4s3c', optionId: 'B' },
        text: '발견 시각과 실제 사망 시각 사이에 공백이 생긴다.',
        clue: { title: 'E11. 생존 흔적', desc: '타치바나의 공격 직후 에드먼드가 살아 있었음', ink: 'black', status: '확인됨' },
      },
      {
        id: 'd4s3rC', type: 'narration',
        branchOf: { choiceBeatId: 'd4s3c', optionId: 'C' },
        text: '관리인 통로가 등장.',
      },
      // 4. 진상 보고서 탈취
      {
        id: 'd4s4n0', type: 'narration',
        text: '타치바나가 에드먼드에게서 진상 보고서를 가져갔음을 확인한다.',
      },
      {
        id: 'd4s4n1', type: 'narration',
        speaker: '타치바나', icon: '⚔️',
        text: '죽었다고 생각했습니다. 그래서... 문서를 가져갔습니다.',
      },
      {
        id: 'd4s4n2', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '그 문서는 지금 어디 있습니까?',
      },
      {
        id: 'd4s4n3', type: 'narration',
        speaker: '타치바나', icon: '⚔️',
        text: '교수님에게 줬습니다.',
      },
      {
        id: 'd4s4c', type: 'choice',
        options: [{ id: 'A', text: '셀레나에게 보고서의 행방을 묻는다.' }, { id: 'B', text: '왜 가져갔는지 묻는다.' }, { id: 'C', text: '살인 의도를 추궁한다.' }],
      },
      {
        id: 'd4s4rA', type: 'narration',
        branchOf: { choiceBeatId: 'd4s4c', optionId: 'A' },
        text: '셀레나가 보고서를 확보했음을 인정.',
      },
      {
        id: 'd4s4rB', type: 'narration',
        branchOf: { choiceBeatId: 'd4s4c', optionId: 'B' },
        text: '셀레나가 들키면 자신도 위험하다고 말했다는 단서.',
      },
      {
        id: 'd4s4rC', type: 'narration',
        branchOf: { choiceBeatId: 'd4s4c', optionId: 'C' },
        text: '타치바나는 자신은 죽이지 않았다고 주장.',
      },
      // 5. 셀레나의 선택
      {
        id: 'd4s5n0', type: 'narration',
        text: '셀레나는 타치바나를 보호하려다 자신이 사건에 관여했다는 사실을 드러낸다.',
      },
      {
        id: 'd4s5n1', type: 'narration',
        speaker: '셀레나', icon: '🪄',
        text: '그 아이는 실수를 했습니다. 저는 그 실수를 덮으려고 했을 뿐이에요.',
      },
      {
        id: 'd4s5n2', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '당신이 타치바나의 모습으로 움직였죠?',
      },
      {
        id: 'd4s5n3', type: 'narration',
        speaker: '셀레나', icon: '🪄',
        text: '...네.',
      },
      {
        id: 'd4s5c', type: 'choice',
        options: [{ id: 'A', text: '보고서를 왜 훔쳤는지 묻는다.' }, { id: 'B', text: '에드먼드를 죽였는지 묻는다.' }, { id: 'C', text: '타치바나에게 살인을 명령했는지 묻는다.' }],
      },
      {
        id: 'd4s5rA', type: 'narration',
        branchOf: { choiceBeatId: 'd4s5c', optionId: 'A' },
        text: '자신들의 연구가 드러날 것을 막기 위해서였다는 사실.',
      },
      {
        id: 'd4s5rB', type: 'narration',
        branchOf: { choiceBeatId: 'd4s5c', optionId: 'B' },
        text: '셀레나는 죽이지 않았다고 답한다.',
      },
      {
        id: 'd4s5rC', type: 'narration',
        branchOf: { choiceBeatId: 'd4s5c', optionId: 'C' },
        text: '죽이라고 압박한 적은 있지만 실제로 죽었다고 생각했다는 진술.',
      },
      // 6. 파울의 비밀 통로
      {
        id: 'd4s6n0', type: 'narration',
        text: '관리인용 도면에서 사건 현장과 보일러실을 잇는 오래된 통로가 발견된다.',
      },
      {
        id: 'd4s6n1', type: 'narration',
        speaker: '파울', icon: '🗝️',
        text: '그 통로는 사용하지 않습니다. 위험하니까요.',
      },
      {
        id: 'd4s6n2', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '그런데 당신은 존재를 알고 있군요.',
      },
      {
        id: 'd4s6n3', type: 'narration',
        speaker: '파울', icon: '🗝️',
        text: '관리인이라면 학교의 구조를 알아야 합니다.',
      },
      {
        id: 'd4s6c', type: 'choice',
        options: [{ id: 'A', text: '통로를 직접 조사한다.' }, { id: 'B', text: '시간 기록을 확인한다.' }, { id: 'C', text: '통로의 출구를 확인한다.' }],
      },
      {
        id: 'd4s6rA', type: 'narration',
        branchOf: { choiceBeatId: 'd4s6c', optionId: 'A' },
        text: '파울의 출입 흔적이 발견될 수 있는 노드.',
        clue: { title: 'E12. 비밀 통로 도면', desc: '파울이 현장으로 이동할 수 있었음', ink: 'black', status: '확인됨' },
      },
      {
        id: 'd4s6rB', type: 'narration',
        branchOf: { choiceBeatId: 'd4s6c', optionId: 'B' },
        text: '파울의 공식 알리바이와 실제 이동 가능 시간이 충돌.',
      },
      {
        id: 'd4s6rC', type: 'narration',
        branchOf: { choiceBeatId: 'd4s6c', optionId: 'C' },
        text: '에드먼드가 쓰러진 장소까지 접근 가능.',
      },
      // 7. 마지막 생존 흔적
      {
        id: 'd4s7n0', type: 'narration',
        text: '에드먼드가 밀친 뒤에도 움직였다는 흔적이 발견된다.',
      },
      {
        id: 'd4s7n1', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '그는 타치바나가 떠난 뒤에도 살아 있었습니다.',
      },
      {
        id: 'd4s7n2', type: 'narration',
        speaker: '셰인', icon: '📘',
        text: '그럼... 그 뒤에 누군가가 왔다는 거잖아요.',
      },
      {
        id: 'd4s7c', type: 'choice',
        options: [{ id: 'A', text: '현장 발자국을 조사한다.' }, { id: 'B', text: '시체 주변의 흔적을 재검사한다.' }, { id: 'C', text: '파울의 알리바이를 다시 본다.' }],
      },
      {
        id: 'd4s7rA', type: 'narration',
        branchOf: { choiceBeatId: 'd4s7c', optionId: 'A' },
        text: '두 번째 접근자의 흔적이 발견된다.',
      },
      {
        id: 'd4s7rB', type: 'narration',
        branchOf: { choiceBeatId: 'd4s7c', optionId: 'B' },
        text: '아르카디아 문장이 사망 후에 그려졌을 가능성.',
      },
      {
        id: 'd4s7rC', type: 'narration',
        branchOf: { choiceBeatId: 'd4s7c', optionId: 'C' },
        text: '보일러실에서 현장까지 이동 가능한 시간이 확인.',
      },
      // 8. 4일차 종료 — 진짜 질문
      {
        id: 'd4s8n0', type: 'narration',
        text: '이제 플레이어는 타치바나와 셀레나의 범죄를 알게 된다. 하지만 둘 모두 최종 살인범은 아니다.',
      },
      {
        id: 'd4s8n1', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '타치바나는 에드먼드를 죽이지 않았습니다. 셀레나도 마지막 순간에는 현장에 없었습니다.',
      },
      {
        id: 'd4s8n2', type: 'narration',
        speaker: '파울', icon: '🗝️',
        text: '그럼 남는 사람은 누구죠?',
      },
      {
        id: 'd4s8c', type: 'choice',
        options: [{ id: 'A', text: '파울의 동선을 조사한다.' }, { id: 'B', text: '현장 연출자를 찾는다.' }, { id: 'C', text: '진상 보고서가 왜 사라졌는지 다시 생각한다.' }],
      },
      {
        id: 'd4s8rA', type: 'narration',
        branchOf: { choiceBeatId: 'd4s8c', optionId: 'A' },
        text: 'DAY 5 최종 추리 해금.',
      },
      {
        id: 'd4s8rB', type: 'narration',
        branchOf: { choiceBeatId: 'd4s8c', optionId: 'B' },
        text: '아르카디아 문장과 안토니우의 이름으로 연결.',
      },
      {
        id: 'd4s8rC', type: 'narration',
        branchOf: { choiceBeatId: 'd4s8c', optionId: 'C' },
        text: '\'보고서가 없어진 뒤에도 사건을 증명해야 한다\'는 파울의 동기와 연결.',
      },
    ],
    closing: '4일차 조사를 마쳤다. 내일은 새로운 실마리를 찾아야 한다.',
  },
  {
    day: 5,
    title: '마지막 주문',
    summary: '8개 장면 · 관리자 진행',
    objective: '오늘의 목표 — 파울 슈미트를 진범으로 특정한다. 플레이어가 모든 단서를 조합해 \'왜 이 방식으로 살해했는가\'까지 설명하도록 한다.',
    script: [
      // 1. 파울의 과거
      {
        id: 'd5s1n0', type: 'narration',
        text: '관리인 기록에서 파울이 단순한 직원이 아니라 오래된 사건 자료를 수집해 왔다는 사실이 드러난다.',
      },
      {
        id: 'd5s1n1', type: 'narration',
        speaker: '파울', icon: '🗝️',
        text: '학교는 기억하지 않으면 같은 일을 반복합니다.',
      },
      {
        id: 'd5s1n2', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '당신은 60년 전 사건을 알고 있었죠?',
      },
      {
        id: 'd5s1n3', type: 'narration',
        speaker: '파울', icon: '🗝️',
        text: '...알고 있었습니다.',
      },
      {
        id: 'd5s1c', type: 'choice',
        options: [{ id: 'A', text: '모닝베일과의 관계를 묻는다.' }, { id: 'B', text: '안토니우를 묻는다.' }, { id: 'C', text: '왜 에드먼드를 도왔는지 묻는다.' }],
      },
      {
        id: 'd5s1rA', type: 'narration',
        branchOf: { choiceBeatId: 'd5s1c', optionId: 'A' },
        text: '파울이 모닝베일의 교리를 연구해 왔다는 사실.',
      },
      {
        id: 'd5s1rB', type: 'narration',
        branchOf: { choiceBeatId: 'd5s1c', optionId: 'B' },
        text: '파울이 안토니우의 이름을 알고 있었음이 드러난다.',
      },
      {
        id: 'd5s1rC', type: 'narration',
        branchOf: { choiceBeatId: 'd5s1c', optionId: 'C' },
        text: '처음에는 진실을 밝히기 위해 도왔다고 주장.',
      },
      // 2. 진상 보고서의 행방
      {
        id: 'd5s2n0', type: 'narration',
        text: '보고서는 셀레나가 가져갔고, 셀레나는 일부를 숨겼다. 파울은 이 사실을 알고 있었다.',
      },
      {
        id: 'd5s2n1', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '보고서가 사라진 뒤 당신은 무엇을 했습니까?',
      },
      {
        id: 'd5s2n2', type: 'narration',
        speaker: '파울', icon: '🗝️',
        text: '기다렸습니다.',
      },
      {
        id: 'd5s2n3', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '무엇을요?',
      },
      {
        id: 'd5s2n4', type: 'narration',
        speaker: '파울', icon: '🗝️',
        text: '누군가가 진실을 말할 수밖에 없는 순간을요.',
      },
      {
        id: 'd5s2c', type: 'choice',
        options: [{ id: 'A', text: '그 순간이 살인이었는지 묻는다.' }, { id: 'B', text: '현장 문장을 보여준다.' }, { id: 'C', text: '안토니우 이름의 필체를 보여준다.' }],
      },
      {
        id: 'd5s2rA', type: 'narration',
        branchOf: { choiceBeatId: 'd5s2c', optionId: 'A' },
        text: '파울이 침묵한다.',
      },
      {
        id: 'd5s2rB', type: 'narration',
        branchOf: { choiceBeatId: 'd5s2c', optionId: 'B' },
        text: '파울이 문장을 보자 미세하게 반응한다.',
      },
      {
        id: 'd5s2rC', type: 'narration',
        branchOf: { choiceBeatId: 'd5s2c', optionId: 'C' },
        text: '파울이 \'그 이름은 반드시 남아야 했다\'고 말한다.',
      },
      // 3. 현장 연출의 의미
      {
        id: 'd5s3n0', type: 'narration',
        text: '아르카디아 문장과 안토니우의 이름이 \'다잉메시지\'가 아니라 의도된 연출임을 입증한다.',
      },
      {
        id: 'd5s3n1', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '에드먼드가 남긴 게 아닙니다. 누군가가 남겼어요.',
      },
      {
        id: 'd5s3n2', type: 'narration',
        speaker: '파울', icon: '🗝️',
        text: '그렇다면 그 사람이 왜 그랬을까요?',
      },
      {
        id: 'd5s3c', type: 'choice',
        options: [{ id: 'A', text: '아르카디아를 세상에 알리기 위해서.' }, { id: 'B', text: '범인을 다른 사람으로 보이게 하기 위해서.' }, { id: 'C', text: '모닝베일을 되살리기 위해서.' }],
      },
      {
        id: 'd5s3rA', type: 'narration',
        branchOf: { choiceBeatId: 'd5s3c', optionId: 'A' },
        text: '파울의 목적과 일치.',
      },
      {
        id: 'd5s3rB', type: 'narration',
        branchOf: { choiceBeatId: 'd5s3c', optionId: 'B' },
        text: '파울이 책임을 떠넘길 의도가 있었음을 검토.',
      },
      {
        id: 'd5s3rC', type: 'narration',
        branchOf: { choiceBeatId: 'd5s3c', optionId: 'C' },
        text: '현재 증거와 맞지 않는다는 판단.',
      },
      // 4. 사망 시각 재구성
      {
        id: 'd5s4n0', type: 'narration',
        text: '의학 기록과 현장 흔적을 조합한다.',
      },
      {
        id: 'd5s4n1', type: 'narration',
        speaker: '기록', icon: '📜',
        text: '10시 17분 발견. 하지만 사망은 그보다 앞선 시점이며, 타치바나의 공격 직후에는 생존 반응이 있었다.',
      },
      {
        id: 'd5s4c', type: 'choice',
        options: [{ id: 'A', text: '타치바나를 범인으로 확정한다.' }, { id: 'B', text: '셀레나를 범인으로 확정한다.' }, { id: 'C', text: '두 사건을 분리한다.' }],
      },
      {
        id: 'd5s4rA', type: 'narration',
        branchOf: { choiceBeatId: 'd5s4c', optionId: 'A' },
        text: '핵심 증거와 맞지 않아 실패.',
      },
      {
        id: 'd5s4rB', type: 'narration',
        branchOf: { choiceBeatId: 'd5s4c', optionId: 'B' },
        text: '보고서 탈취 동기만으로는 실제 살인을 설명하지 못함.',
      },
      {
        id: 'd5s4rC', type: 'narration',
        branchOf: { choiceBeatId: 'd5s4c', optionId: 'C' },
        text: '\'공격\'과 \'살인\'이 서로 다른 범행이라는 핵심 결론.',
      },
      // 5. 파울의 알리바이 붕괴
      {
        id: 'd5s5n0', type: 'narration',
        text: '보일러실 기록과 비밀 통로를 대조한다.',
      },
      {
        id: 'd5s5n1', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '보일러실에 있었던 건 맞습니다. 하지만 계속 있었던 건 아니죠.',
      },
      {
        id: 'd5s5n2', type: 'narration',
        speaker: '파울', icon: '🗝️',
        text: '관리인은 학교 안을 돌아다닙니다. 그게 제 일입니다.',
      },
      {
        id: 'd5s5n3', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '그래서 당신은 누구보다 쉽게 현장에 갈 수 있었죠.',
      },
      {
        id: 'd5s5c', type: 'choice',
        options: [{ id: 'A', text: '비밀 통로를 제시한다.' }, { id: 'B', text: '발자국 증거를 제시한다.' }, { id: 'C', text: '둘 다 제시한다.' }],
      },
      {
        id: 'd5s5rA', type: 'narration',
        branchOf: { choiceBeatId: 'd5s5c', optionId: 'A' },
        text: '파울이 현장 접근 가능성을 인정.',
      },
      {
        id: 'd5s5rB', type: 'narration',
        branchOf: { choiceBeatId: 'd5s5c', optionId: 'B' },
        text: '파울의 신발과 현장 흔적이 일치.',
        clue: { title: 'E13. 파울의 신발 흔적', desc: '현장 흔적과 연결', ink: 'black', status: '확인됨' },
      },
      {
        id: 'd5s5rC', type: 'narration',
        branchOf: { choiceBeatId: 'd5s5c', optionId: 'C' },
        text: '파울의 알리바이가 사실상 붕괴.',
      },
      // 6. 살인의 이유
      {
        id: 'd5s6n0', type: 'narration',
        text: '파울이 드디어 자신의 생각을 털어놓는다.',
      },
      {
        id: 'd5s6n1', type: 'narration',
        speaker: '파울', icon: '🗝️',
        text: '에드먼드는 진실을 찾았습니다. 하지만 결국 망설였죠. 보고서를 숨기려 했습니다.',
      },
      {
        id: 'd5s6n2', type: 'narration',
        speaker: '조사관', icon: '🔍',
        text: '그래서 죽였습니까?',
      },
      {
        id: 'd5s6n3', type: 'narration',
        speaker: '파울', icon: '🗝️',
        text: '보고서 하나가 사라지면 또 덮일 겁니다. 하지만 학생이 죽고, 아르카디아의 이름이 다시 나타난다면... 이번에는 모두가 보게 됩니다.',
      },
      {
        id: 'd5s6c', type: 'choice',
        options: [{ id: 'A', text: '에드먼드의 선택을 비난한다.' }, { id: 'B', text: '파울이 원하는 것이 폭로였다고 지적한다.' }, { id: 'C', text: '그럼에도 살인이 정당하지 않다고 말한다.' }],
      },
      {
        id: 'd5s6rA', type: 'narration',
        branchOf: { choiceBeatId: 'd5s6c', optionId: 'A' },
        text: '파울은 \'그가 틀렸다고 생각했다\'고 말한다.',
      },
      {
        id: 'd5s6rB', type: 'narration',
        branchOf: { choiceBeatId: 'd5s6c', optionId: 'B' },
        text: '파울이 침묵으로 사실상 인정.',
        clue: { title: 'E15. 파울의 개인 기록', desc: '사건을 공론화하려는 목적', ink: 'red', status: '확인됨' },
      },
      {
        id: 'd5s6rC', type: 'narration',
        branchOf: { choiceBeatId: 'd5s6c', optionId: 'C' },
        text: '파울은 \'정당화하려는 게 아니다\'라고 답한다.',
      },
      // 7. 최종 대질
      {
        id: 'd5s7n0', type: 'narration',
        text: '모든 용의자를 한자리에 모아 사건을 재구성한다.',
      },
      {
        id: 'd5s7n1', type: 'narration',
        speaker: '아네스', icon: '🥀',
        text: '저는 그를 따라갔지만 죽이지 않았어요.',
      },
      {
        id: 'd5s7n2', type: 'narration',
        speaker: '셰인', icon: '📘',
        text: '저는 그를 말렸지만 그날 밤 도서관에 있었습니다.',
      },
      {
        id: 'd5s7n3', type: 'narration',
        speaker: '타치바나', icon: '⚔️',
        text: '제가 밀쳤습니다. 하지만 그는 살아 있었습니다.',
      },
      {
        id: 'd5s7n4', type: 'narration',
        speaker: '셀레나', icon: '🪄',
        text: '제가 보고서를 가져갔습니다. 하지만 살인은 아닙니다.',
      },
      {
        id: 'd5s7n5', type: 'narration',
        speaker: '용의자 5', icon: '🌫️',
        text: '저는 아르카디아의 잔재와 관련됐지만 그를 죽이지 않았습니다.',
      },
      {
        id: 'd5s7n6', type: 'narration',
        speaker: '파울', icon: '🗝️',
        text: '...',
      },
      {
        id: 'd5s7c', type: 'choice',
        options: [{ id: 'A', text: '타치바나의 공격과 실제 살인을 구분한다.' }, { id: 'B', text: '셀레나의 보고서 탈취와 살인을 구분한다.' }, { id: 'C', text: '파울에게 마지막으로 묻는다.' }],
      },
      {
        id: 'd5s7rA', type: 'narration',
        branchOf: { choiceBeatId: 'd5s7c', optionId: 'A' },
        text: '사건의 두 단계가 확정된다.',
      },
      {
        id: 'd5s7rB', type: 'narration',
        branchOf: { choiceBeatId: 'd5s7c', optionId: 'B' },
        text: '보고서의 행방과 살인의 행방이 분리된다.',
      },
      {
        id: 'd5s7rC', type: 'narration',
        branchOf: { choiceBeatId: 'd5s7c', optionId: 'C' },
        text: '파울의 침묵이 결정적 증거가 된다.',
      },
      // 8. 엔딩 도입부 (최종 추리는 아래 FinalDeduction에서 진행)
      {
        id: 'd5s8n0', type: 'narration',
        text: '플레이어는 최종 선택 화면에서 범인과 범행 과정을 제출한다.',
      },
      {
        id: 'd5s8n1', type: 'narration',
        text: '이제 최종 추리를 정리할 시간이다: 누가 에드먼드를 죽였는가, 타치바나는 무엇을 했는가, 셀레나는 무엇을 훔쳤는가, 현장 연출은 누구의 것이며 왜였는가.',
      },
    ],
    closing: '모든 단서가 한 사람을 가리키고 있다. 이제 당신의 추리를 정리할 시간이다.',
    finalDeduction: true,
  },
];
