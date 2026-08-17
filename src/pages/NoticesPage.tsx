import Letterhead from '../components/Letterhead';
import { SCHOOL_NAME } from '../data/school';

interface Notice {
  id: string;
  kind: string;
  ink: 'black' | 'red' | 'indigo';
  title: string;
  excerpt: string;
  meta: string;
}

const NOTICES: Notice[] = [
  {
    id: 'n1',
    kind: '교내공지',
    ink: 'black',
    title: '정기 점검 안내',
    excerpt: '이번 주말 도서관 시설 점검이 있습니다. 이용에 참고해 주세요.',
    meta: '사무실 · 3분 전',
  },
  {
    id: 'n2',
    kind: '임무공지',
    ink: 'red',
    title: '새 임무 공개 예정',
    excerpt: '오늘 밤, 새로운 임무가 공개됩니다. 참여자는 미리 준비할 것.',
    meta: '임무부 · 1시간 전',
  },
  {
    id: 'n3',
    kind: '사무공지',
    ink: 'indigo',
    title: '분실물 안내',
    excerpt: '은빛 나침반을 주운 사람은 사무실로 가져다 줄 것.',
    meta: '사무실 · 어제',
  },
];

const INK_TEXT: Record<Notice['ink'], string> = {
  black: 'text-ink-black',
  red: 'text-ink-red',
  indigo: 'text-ink-indigo',
};

const INK_BORDER: Record<Notice['ink'], string> = {
  black: 'border-l-ink-black',
  red: 'border-l-ink-red',
  indigo: 'border-l-ink-indigo',
};

export default function NoticesPage() {
  return (
    <div className="flex flex-col gap-4">
      <Letterhead label="HWCF" context={SCHOOL_NAME} meta="2026.08.18 · 초승달 · 수업 3교시" />

      <div className="flex flex-col gap-3">
        {NOTICES.map((n) => (
          <div key={n.id} className={`rounded-sm border border-ink-700/15 border-l-[3px] bg-paper-50 p-3.5 ${INK_BORDER[n.ink]}`}>
            <p className={`font-mono text-[11px] tracking-wide ${INK_TEXT[n.ink]}`}>{n.kind}</p>
            <p className="mt-1 font-bold text-ink-900">{n.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-700/80">{n.excerpt}</p>
            <p className="mt-1.5 font-mono text-[10px] text-ink-500/80">{n.meta}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
