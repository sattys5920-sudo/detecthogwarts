import type { DayContent } from './types';

export const DAYS: DayContent[] = [
  {
    day: 1,
    title: '사건',
    summary: '에드먼드 엘리오, 회랑에서 시신으로 발견',
    objective: '오늘의 과제 — 현장의 단서를 모두 조사하라',
    script: [
      {
        id: 's1',
        type: 'narration',
        text: '스산한 회랑 끝, 낡은 촛불 하나만이 어둠을 밝히고 있다.',
      },
      {
        id: 's2',
        type: 'narration',
        text: '그 아래, 미동도 없는 한 사람의 형체가 보인다.',
      },
      {
        id: 's3',
        type: 'choice',
        options: [
          { id: 'body', text: '시체를 본다' },
          { id: 'beside', text: '시체 옆을 본다' },
        ],
      },
      {
        id: 's4a',
        type: 'narration',
        branchOf: { choiceBeatId: 's3', optionId: 'body' },
        text: '심장이 내려앉는 기분으로 다가간다. 놀란 표정으로 굳어버린 얼굴이 먼저 눈에 들어온다.',
      },
      {
        id: 's4b',
        type: 'narration',
        branchOf: { choiceBeatId: 's3', optionId: 'beside' },
        text: '차마 얼굴을 볼 용기가 나지 않아, 먼저 주변으로 시선을 돌린다.',
      },
      {
        id: 's5',
        type: 'narration',
        text: '가까이서 보니, 후플푸프의 교복을 입은 그는 에드먼드 엘리오다. 이미 숨이 끊긴 지 오래인 듯하다.',
        clue: { title: '에드먼드 엘리오의 시신', desc: '회랑에서 시신으로 발견됨. 외상은 크지 않다.', ink: 'black', status: '확인됨' },
      },
      {
        id: 's6',
        type: 'narration',
        text: '시신 옆 바닥에는 낯선 문장이 그려져 있다. 지금 학교의 어느 기숙사와도 일치하지 않는다.',
        clue: { title: '제5 기숙사의 문장', desc: '현재 존재하는 4개 기숙사 어디에도 속하지 않는 낯선 문장. 시신 옆에 남겨져 있었다.', ink: 'red', status: '조사 중' },
      },
      {
        id: 's7',
        type: 'narration',
        text: '문장 옆에는 서툰 손글씨로 "ARCADIA"라는 이름이 적혀 있다. 에드먼드가 마지막으로 남긴 것처럼 보인다.',
        clue: { title: '다잉 메시지: ARCADIA', desc: '문장 옆에 적힌 이름. 피해자가 마지막으로 남긴 것처럼 보이지만 확실하지 않다.', ink: 'red', status: '조사 중' },
      },
      {
        id: 's8',
        type: 'choice',
        options: [
          { id: 'bag', text: '소지품을 살핀다' },
          { id: 'floor', text: '바닥의 흔적을 살핀다' },
        ],
      },
      {
        id: 's9a',
        type: 'narration',
        branchOf: { choiceBeatId: 's8', optionId: 'bag' },
        text: '가방부터 열어본다.',
      },
      {
        id: 's9b',
        type: 'narration',
        branchOf: { choiceBeatId: 's8', optionId: 'floor' },
        text: '먼저 바닥을 훑어본다.',
      },
      {
        id: 's10',
        type: 'narration',
        text: '가방 안은 뒤진 흔적이 있다. 노트와 필기구는 남아 있지만, 그가 늘 들고 다니던 서류철은 보이지 않는다.',
        clue: { title: '사라진 문서의 흔적', desc: '피해자의 가방이 뒤져진 흔적이 있고, 평소 들고 다니던 서류철이 사라졌다.', ink: 'indigo', status: '조사 중' },
      },
      {
        id: 's11',
        type: 'narration',
        text: '바닥 먼지 위로 발자국 여러 개가 뒤엉켜 있다. 몸싸움이 있었던 것으로 보인다.',
        clue: { title: '몸싸움의 흔적', desc: '현장 바닥에 여러 사람의 발자국이 뒤엉켜 있다. 몸싸움이 있었던 정황.', ink: 'black', status: '조사 중' },
      },
    ],
    closing:
      '조사가 진행되며 여섯 명의 이름이 사건과 얽혀 있다는 사실이 드러났다. 아네스 루(여자친구), 셰인 송(오랜 친구), 타치바나 고(라이벌), 셀레나 미고 교수, 정체를 알 수 없는 인물, 그리고 학교 관리인 파울 슈미트. 내일부터 이들을 직접 만나 이야기를 들어볼 차례다.',
  },
  {
    day: 2,
    title: '용의자',
    summary: '여섯 사람을 심문한다',
    objective: '오늘의 과제 — 여섯 용의자 모두와 이야기하라',
    roomIntro: [
      { speaker: '불가', icon: '🔥', text: '오늘은 다 모였다며? 한 명씩 불러서 물어보자.' },
      { speaker: '서호', icon: '📘', text: '여섯 명 다야... 시간 좀 걸리겠는데.' },
      { speaker: '유리', icon: '🧭', text: '누구부터 갈지는 네가 정해.' },
    ],
    roomOutro: [
      { speaker: '유리', icon: '🧭', text: '다들 뭔가 숨기고 있는 느낌인데.' },
      { speaker: '불가', icon: '🔥', text: '그래도 오늘 알아낸 게 많아. 내일은 60년 전 사건 쪽을 파보자.' },
    ],
    npcs: [
      {
        npcId: 'agnes',
        script: {
          greeting: '...무슨 일이야, {name}? 나 아직도 믿기지가 않아.',
          topics: [
            {
              id: 'love',
              prompt: '연애 문제에 대해 묻는다',
              response: '요즘 좀 소원했어. 에드먼드가 뭔가 숨기는 게 있는 것 같아서, 바람이라도 피우나 싶어 몰래 따라다닌 적이 있어.',
              followUp: {
                prompt: '따라가다가 뭘 보게 됐는지 묻는다',
                response: '따라가다가... 이상한 걸 봤어. 낡은 문서 더미랑, "제5 기숙사"라는 이름. 그게 뭔지는 나도 몰라. 무서워서 아무한테도 말 못했어.',
                clue: { title: '아네스가 목격한 낡은 문서', desc: '에드먼드를 몰래 따라가다 발견. 제5 기숙사라는 이름이 적혀 있었다.', ink: 'indigo', status: '조사 중' },
              },
            },
            {
              id: 'arcadia',
              prompt: '제5 기숙사에 대해 묻는다',
              response: '제5 기숙사? ...그런 거 몰라.',
              followUp: {
                prompt: '정말 모르냐고 다시 캐묻는다',
                response: '...사실 알아. 에드먼드를 따라가다가 본 적 있어. 근데 그 얘기하면 위험할 것 같아서 말 안 했어.',
                clue: { title: '아네스의 침묵', desc: '처음엔 부인했지만, 캐묻자 제5 기숙사의 존재를 알고 있었다고 시인했다.', ink: 'red', status: '조사 중' },
              },
            },
            {
              id: 'alibi',
              prompt: '사건 당일 행적을 묻는다',
              response: '그날 밤 사실... 사건 현장 근처에 있었어. 에드먼드가 걱정돼서 몰래 따라갔거든. 근데 나는 아무것도 못 봤어. 진짜야.',
              clue: { title: '아네스의 알리바이', desc: '사건 당일 현장 근처에 있었다고 인정. 목격한 것은 없다고 주장한다.', ink: 'black', status: '조사 중' },
            },
          ],
        },
      },
      {
        npcId: 'shane',
        script: {
          greeting: '...에드먼드 얘기지, {name}. 나도 아직 정리가 안 됐어.',
          topics: [
            {
              id: 'relation',
              prompt: '피해자와의 관계를 묻는다',
              response: '오랜 친구야. 최근엔 계속 뭔가를 조사하고 다녔어. 위험해 보여서 말렸는데 안 들었어.',
              followUp: {
                prompt: '왜 그렇게까지 말렸는지 묻는다',
                response: '그건... 말할 수 없어.',
                clue: { title: '셰인의 이상 반응', desc: '제5 기숙사 이야기만 나오면 말을 잇지 못한다. 무언가에 억눌린 듯하다.', ink: 'red', status: '조사 중' },
              },
            },
            {
              id: 'family',
              prompt: '가족에 대해 묻는다',
              response: '우리 할아버지는... 오래전에 돌아가셨어. 학교에서. 그 이상은 나도 몰라. 아무도 얘기해준 적이 없거든.',
              clue: { title: '셰인 할아버지의 죽음', desc: '60년 전 학교에서 사망. 자세한 경위는 가족에게도 알려지지 않았다.', ink: 'indigo', status: '조사 중' },
            },
            {
              id: 'alibi',
              prompt: '사건 당일 행적을 묻는다',
              response: '그날은 종일 도서관에 있었어. 사서님한테 물어봐도 돼.',
              clue: { title: '셰인의 알리바이', desc: '사건 당일 도서관에서 사서와 함께 있었음이 확인된다.', ink: 'black', status: '확인됨' },
            },
          ],
        },
      },
      {
        npcId: 'tachibana',
        script: {
          greeting: '할 말 없어. 빨리 끝내줘, {name}.',
          topics: [
            {
              id: 'relation',
              prompt: '피해자와의 관계를 묻는다',
              response: '라이벌... 이라고 해두자. 항상 걔한테 밀렸어. 성적도, 뭐든.',
            },
            {
              id: 'research',
              prompt: '요즘 하던 연구에 대해 묻는다',
              response: '...그런 거 왜 물어.',
              followUp: {
                prompt: '숨기지 말고 말해달라고 한다',
                response: '금지된 마법을 좀 조사했어. 그냥 조사만 한 거야, 쓴 적은 없어.',
                clue: { title: '타치바나의 금지 마법 연구', desc: '정신·육체를 망가뜨리는 금지된 마법을 조사했다고 시인. 실제 사용 여부는 불명.', ink: 'red', status: '조사 중' },
              },
            },
            {
              id: 'alibi',
              prompt: '사건 당일 행적을 묻는다',
              response: '그날 밤엔... 나도 잘 기억이 안 나. 미안.',
              clue: { title: '타치바나의 모호한 알리바이', desc: '사건 당일 행적을 얼버무렸다. 무언가를 숨기는 듯하다.', ink: 'red', status: '조사 중' },
            },
          ],
        },
      },
      {
        npcId: 'selena',
        script: {
          greeting: '슬픈 일이에요, {name}. 제가 아는 선에서 답해드리죠.',
          topics: [
            {
              id: 'relation',
              prompt: '피해자와의 관계를 묻는다',
              response: '엘리오 군은... 성실한 학생이었죠. 안타까운 일이에요.',
            },
            {
              id: 'tachibana',
              prompt: '타치바나 고와의 관계를 묻는다',
              response: '제 제자예요. 방어술에 재능이 있어서 개인적으로 지도하고 있어요.',
              followUp: {
                prompt: '무엇을 지도하고 있는지 묻는다',
                response: '...학생 개인사까지 알려드릴 의무는 없다고 생각하는데요.',
                requiresClueTitles: ['타치바나의 금지 마법 연구'],
                clue: { title: '셀레나와 타치바나의 은밀한 관계', desc: '개인 지도를 하고 있다고 밝혔지만, 구체적인 내용은 완강히 거부했다.', ink: 'red', status: '조사 중' },
              },
            },
            {
              id: 'alibi',
              prompt: '사건 당일 행적을 묻는다',
              response: '연구실에 있었어요. 확인해 보셔도 좋아요.',
              clue: { title: '셀레나의 알리바이 주장', desc: '사건 당일 연구실에 있었다고 주장. 사실 여부는 불명확하다.', ink: 'indigo', status: '조사 중' },
            },
          ],
        },
      },
      {
        npcId: 'unknown5',
        script: {
          greeting: '...',
          topics: [
            {
              id: 'approach',
              prompt: '다가가 말을 건다',
              response: '그는 짧게 당신을 바라보다가, 아무 말 없이 자리를 뜬다. 무언가를 숨기고 있는 것은 분명해 보인다.',
              clue: { title: '정체불명의 인물', desc: '제5 기숙사의 잔재와 관련된 것으로 보이나, 아직 정체가 밝혀지지 않았다.', ink: 'indigo', status: '미해결' },
            },
          ],
        },
      },
      {
        npcId: 'paul',
        script: {
          greeting: '무엇을 도와드릴까요, {name}.',
          topics: [
            {
              id: 'relation',
              prompt: '피해자와의 관계를 묻는다',
              response: '엘리오 학생요? 종종 이것저것 물어보러 왔었죠. 도와줄 수 있는 건 도와줬습니다.',
            },
            {
              id: 'school',
              prompt: '학교 구조에 대해 아는 것을 묻는다',
              response: '이 학교 구석구석, 저만큼 잘 아는 사람 없을 겁니다. 필요하면 말씀하세요.',
            },
            {
              id: 'alibi',
              prompt: '사건 당일 행적을 묻는다',
              response: '순찰 중이었습니다. 늦은 시간까지요.',
              clue: { title: '파울의 알리바이 주장', desc: '사건 당일 밤 순찰 중이었다고 주장했다.', ink: 'black', status: '조사 중' },
            },
          ],
        },
      },
    ],
    closing: '여섯 사람 모두 뭔가를 숨기고 있는 듯하다. 하지만 이 시점에서는 누구도 확실히 범인처럼 보이지 않는다. 더 파고들어야 한다.',
  },
  {
    day: 3,
    title: '제5 기숙사',
    summary: '옛 기록보관소에서 60년 전 사건을 추적한다',
    objective: '오늘의 과제 — 제5 기숙사의 실체를 확인하라',
    roomIntro: [
      { speaker: '서호', icon: '📘', text: '기록보관소는 오랜만이네.' },
      { speaker: '유리', icon: '🧭', text: '여기 어딘가에 제5 기숙사 얘기가 있을 거야. 찾아보자.' },
    ],
    roomOutro: [
      { speaker: '불가', icon: '🔥', text: '제5 기숙사, 진짜였구나...' },
      { speaker: '서호', icon: '📘', text: '이게 이번 사건이랑 어떻게 이어지는지 계속 파봐야겠어.' },
    ],
    sceneItems: [
      {
        id: 'roster',
        icon: '📜',
        name: '폐쇄된 기숙사 명부',
        text: '먼지 쌓인 명부 속, 지금은 존재하지 않는 다섯 번째 기숙사 "아르카디아"의 이름이 보인다. 학생 명단 사이에 "안토니우 아르카디아"라는 이름이 눈에 띈다.',
        clue: { title: '제5 기숙사 학생 명부', desc: "60년 전 명부에서 '아르카디아' 기숙사가 공식적으로 존재했음을 확인. '안토니우 아르카디아'라는 이름이 눈에 띈다.", ink: 'indigo', status: '확인됨' },
      },
      {
        id: 'morningvale',
        icon: '📖',
        name: '삭제된 교수 기록',
        text: '대부분 검게 지워진 문서. 그래도 몇 줄은 남아 있다 — "모닝베일 교수", "의식", "돌아온 자만이 아름답다"라는 구절.',
        clue: { title: '모닝베일 교수의 흔적', desc: '대부분 삭제되었지만, 남은 조각에서 사이비에 가까운 교리의 흔적이 발견된다.', ink: 'red', status: '조사 중' },
      },
      {
        id: 'victims',
        icon: '🕊️',
        name: '희생자 명단 파편',
        text: '절반쯤 타버린 종이. 이름 대부분이 지워졌지만 "송(宋)"이라는 성씨가 남아 있다.',
        clue: { title: '희생자 명단의 파편', desc: "이름 일부가 지워져 있지만 '송(宋)' 성씨가 포함되어 있는 것이 보인다.", ink: 'black', status: '조사 중' },
      },
    ],
    npcs: [
      {
        npcId: 'shane',
        script: {
          greeting: '...또 왜, {name}.',
          topics: [
            {
              id: 'victims-list',
              prompt: '희생자 명단에서 "송" 성씨를 봤다고 말한다',
              requiresClueTitles: ['희생자 명단의 파편'],
              response:
                '...그게, 우리 할아버지 얘기일 거야. 말하려고 하면 목이 조이는 것 같아. 마법부가 무슨 짓을 해놓은 게 분명해.',
              clue: { title: '셰인 가문의 진실', desc: '셰인의 할아버지가 60년 전 제5 기숙사 사건의 희생자였음이 확인된다. 마법부의 봉인 마법으로 발설이 제한되어 있다.', ink: 'red', status: '확인됨' },
            },
          ],
        },
      },
    ],
    closing: '제5 기숙사는 실제로 존재했고, 그 안에서 벌어진 일은 지금까지 철저히 은폐되어 왔다. 이번 살인은 단순한 개인적 원한이 아닐지도 모른다.',
  },
  {
    day: 4,
    title: '시간',
    summary: '사건 당일 밤의 행적을 재구성한다',
    objective: '오늘의 과제 — 사건 당일 밤의 순서를 재구성하라',
    roomIntro: [
      { speaker: '유리', icon: '🧭', text: '변신 물약 흔적이라니, 심상치 않은데.' },
      { speaker: '불가', icon: '🔥', text: '타치바나한테 다시 가보자. 뭔가 더 알고 있을 거야.' },
    ],
    roomOutro: [
      { speaker: '서호', icon: '📘', text: '밀친 것뿐이라니... 그럼 진짜 범인은 따로 있다는 거네.' },
    ],
    sceneItems: [
      {
        id: 'potion',
        icon: '🧪',
        name: '변신 물약의 흔적',
        text: '현장 근처에서 정체를 알 수 없는 물약의 잔여물이 발견되었다. 냄새와 색이 변신 마법에 쓰이는 재료와 일치한다.',
        clue: { title: '변신 물약의 흔적', desc: '현장 근처에서 발견된 물약 잔여물. 변신 마법에 쓰이는 재료로 보인다.', ink: 'indigo', status: '조사 중' },
      },
      {
        id: 'witness',
        icon: '👁️',
        name: '목격자 진술 조각',
        text: '사건 시각 즈음, 셀레나 교수로 보이는 인물이 현장 근처를 서성였다는 목격담이 있다. 그러나 본인은 그 시각 연구실에 있었다고 진술했다.',
        clue: { title: '엇갈리는 목격 정보', desc: '사건 시각 즈음 셀레나 교수로 보이는 인물이 목격되었으나, 본인의 알리바이 진술과 어긋난다.', ink: 'red', status: '조사 중' },
      },
    ],
    npcs: [
      {
        npcId: 'tachibana',
        script: {
          greeting: '...또 왔네, {name}.',
          topics: [
            {
              id: 'potion',
              prompt: '변신 물약에 대해 추궁한다',
              response: '그게 무슨 소리야, 난 모르는 일이야.',
              requiresClueTitles: ['변신 물약의 흔적'],
              followUp: {
                prompt: '증거가 있다고 말한다',
                response: '...들켰네. 셀레나 교수님 지시였어. 서로 모습을 바꿔서... 진상 보고서를 가져오라고 하셨어.',
                clue: { title: '변신 물약의 진실', desc: '타치바나가 셀레나 교수와 변신 물약으로 서로의 모습을 바꿨다고 시인했다. 셀레나의 지시로 진상 보고서를 훔치러 갔다는 것.', ink: 'red', status: '확인됨' },
              },
            },
            {
              id: 'that-night',
              prompt: '그날 밤 에드먼드와 무슨 일이 있었는지 묻는다',
              requiresClueTitles: ['변신 물약의 진실'],
              response: '밀쳤어... 몸싸움이 있었고, 걔가 쓰러졌어. 난... 죽은 줄 알았어. 보고서만 챙겨서 도망쳤어.',
              clue: { title: '타치바나의 자백 — 밀쳤을 뿐', desc: '타치바나가 에드먼드를 밀쳐 쓰러뜨리고 진상 보고서를 가져갔다고 시인. 죽은 줄 알았다고 진술했다.', ink: 'black', status: '확인됨' },
            },
          ],
        },
      },
    ],
    closing: '타치바나는 에드먼드를 밀쳤을 뿐, 살해하지 않았다. 그렇다면 그를 마지막으로 만난 사람은 누구인가?',
  },
  {
    day: 5,
    title: '마지막 주문',
    summary: '파울 슈미트를 마주한다',
    objective: '오늘의 과제 — 진실을 마주하고 추리를 완성하라',
    roomIntro: [
      { speaker: '불가', icon: '🔥', text: '파울 아저씨... 설마.' },
      { speaker: '유리', icon: '🧭', text: '확실한 증거 없이 함부로 말하지 마. 가서 직접 물어보자.' },
    ],
    roomOutro: [
      { speaker: '서호', icon: '📘', text: '이제 우리가 알아낸 걸 정리할 시간이야.' },
    ],
    sceneItems: [
      {
        id: 'keys',
        icon: '🗝️',
        name: '관리인의 열쇠 꾸러미',
        text: '학교의 거의 모든 문과 비밀 통로를 열 수 있는 열쇠 꾸러미. 파울 슈미트가 항상 지니고 다닌다.',
        clue: { title: "파울의 열쇠 꾸러미", desc: '학교의 모든 비밀 통로에 접근할 수 있는 열쇠를 가지고 있다.', ink: 'black', status: '조사 중' },
      },
    ],
    npcs: [
      {
        npcId: 'paul',
        script: {
          greeting: '...할 이야기가 남았습니까, {name}.',
          topics: [
            {
              id: 'report',
              prompt: '진상 보고서의 행방을 묻는다',
              response: '그건... 타치바나가 가져갔을 겁니다. 저도 몰라요.',
              requiresClueTitles: ['타치바나의 자백 — 밀쳤을 뿐'],
              followUp: {
                prompt: '거짓말하지 말라고 한다',
                response: '...맞습니다. 제가 그 자리에 있었어요. 하지만 제가 갔을 땐 이미 보고서가 없었습니다.',
                clue: { title: '파울의 현장 인정', desc: '사건 현장에 있었다는 사실을 인정했다. 도착했을 땐 이미 보고서가 사라진 뒤였다고 주장한다.', ink: 'red', status: '조사 중' },
              },
            },
            {
              id: 'arcadia',
              prompt: '제5 기숙사와의 관계를 묻는다',
              response: '...60년 전 이야기를, 아직도 기억하고 있습니다. 그때 저는 아무것도 할 수 없었어요. 이번엔 달라야 했습니다.',
              clue: { title: '파울과 60년 전 사건', desc: '파울이 60년 전 사건과 개인적으로 깊이 연관되어 있음을 암시했다.', ink: 'red', status: '확인됨' },
            },
            {
              id: 'message',
              prompt: '다잉메시지 "ARCADIA"에 대해 묻는다',
              response: '...제가 남겼습니다. 에드먼드가 아니라.',
              requiresClueTitles: ['제5 기숙사 학생 명부'],
              clue: { title: '파울의 자백', desc: "현장에 남겨진 'ARCADIA' 메시지가 에드먼드가 아니라 파울 자신이 남긴 것이라고 인정했다.", ink: 'red', status: '확인됨' },
            },
          ],
        },
      },
    ],
    closing: '모든 단서가 한 사람을 가리키고 있다. 이제 당신의 추리를 정리할 시간이다.',
    finalDeduction: true,
  },
];
