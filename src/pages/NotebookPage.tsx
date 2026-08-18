import Letterhead from '../components/Letterhead';

interface Clue {
  id: string;
  ink: 'black' | 'red' | 'indigo';
  title: string;
  desc: string;
  status: string;
}

const CLUES: Clue[] = [
  {
    id: 'c1',
    ink: 'indigo',
    title: '은빛 나침반',
    desc: '사무실에 분실물로 접수됨. 바늘이 늘 같은 방향을 가리킨다.',
    status: '확인됨',
  },
  {
    id: 'c2',
    ink: 'red',
    title: '회랑의 차가운 바람',
    desc: '탐사 중 포착된 이상 현상. 출처를 알 수 없음.',
    status: '조사 중',
  },
  {
    id: 'c3',
    ink: 'black',
    title: '낡은 편지 조각',
    desc: '누군가 흘리고 간 것으로 보임. 글씨가 반쯤 지워져 있다.',
    status: '미해결',
  },
];

const INK_TEXT: Record<Clue['ink'], string> = {
  black: 'text-ink-black',
  red: 'text-ink-red',
  indigo: 'text-ink-indigo',
};

const INK_BORDER: Record<Clue['ink'], string> = {
  black: 'border-l-ink-black',
  red: 'border-l-ink-red',
  indigo: 'border-l-ink-indigo',
};

export default function NotebookPage() {
  const unresolved = CLUES.filter((c) => c.status !== '확인됨').length;

  return (
    <div className="flex flex-col gap-4">
      <Letterhead label="탐사 수첩" context="지금까지 기록된 단서들" meta={`단서 ${CLUES.length}건 · 미해결 ${unresolved}건`} />

      <div className="flex flex-col gap-3">
        {CLUES.map((c) => (
          <div key={c.id} className={`rounded-sm border border-ink-700/15 border-l-[3px] bg-paper-50 p-3.5 ${INK_BORDER[c.ink]}`}>
            <div className="flex items-center justify-between">
              <p className="font-bold text-ink-900">{c.title}</p>
              <span className={`font-mono text-[11px] tracking-wide ${INK_TEXT[c.ink]}`}>{c.status}</span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-ink-700/80">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
