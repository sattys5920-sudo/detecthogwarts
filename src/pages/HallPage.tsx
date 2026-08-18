import { useState } from 'react';
import Letterhead from '../components/Letterhead';
import NibIcon from '../components/NibIcon';
import { useGame } from '../context/GameContext';
import { SCHOOL_NAME } from '../data/school';

interface Post {
  id: string;
  kind: string;
  ink: 'black' | 'red' | 'indigo';
  author: string;
  title: string;
  excerpt: string;
  meta: string;
}

const INITIAL_POSTS: Post[] = [
  {
    id: 'p1',
    kind: '교내공지',
    ink: 'black',
    author: '사무실',
    title: '정기 점검 안내',
    excerpt: '이번 주말 도서관 시설 점검이 있습니다. 이용에 참고해 주세요.',
    meta: '3분 전',
  },
  {
    id: 'p2',
    kind: '탐사공지',
    ink: 'red',
    author: '탐사부',
    title: '새 탐사 공개 예정',
    excerpt: '오늘 밤, 새로운 탐사 활동이 공개됩니다. 참여자는 미리 준비할 것.',
    meta: '1시간 전',
  },
  {
    id: 'p3',
    kind: '사무공지',
    ink: 'indigo',
    author: '사무실',
    title: '분실물 안내',
    excerpt: '은빛 나침반을 주운 사람은 사무실로 가져다 줄 것.',
    meta: '어제',
  },
];

const INK_TEXT: Record<Post['ink'], string> = {
  black: 'text-ink-black',
  red: 'text-ink-red',
  indigo: 'text-ink-indigo',
};

const INK_BORDER: Record<Post['ink'], string> = {
  black: 'border-l-ink-black',
  red: 'border-l-ink-red',
  indigo: 'border-l-ink-indigo',
};

export default function HallPage() {
  const game = useGame();
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [draft, setDraft] = useState('');

  function handlePost() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setPosts((prev) => [
      {
        id: `p-${Date.now()}`,
        kind: '자유게시',
        ink: 'black',
        author: game.nickname || '이름 없음',
        title: trimmed,
        excerpt: '',
        meta: '방금 전',
      },
      ...prev,
    ]);
    setDraft('');
  }

  return (
    <div className="flex flex-col gap-4">
      <Letterhead label="연회장" context={SCHOOL_NAME} meta="2026.08.18 · 초승달 · 저녁 식사 시간" />

      <div className="flex items-center gap-2 rounded-sm border border-ink-700/15 bg-paper-50 p-2.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePost()}
          placeholder="오늘 있었던 일을 나눠보세요"
          maxLength={80}
          className="flex-1 bg-transparent px-1.5 text-sm text-ink-900 outline-none placeholder:text-ink-500/40"
        />
        <button
          type="button"
          onClick={handlePost}
          disabled={!draft.trim()}
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-ink-black text-paper-50 disabled:opacity-40"
          aria-label="게시하기"
        >
          <NibIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {posts.map((p) => (
          <div key={p.id} className={`rounded-sm border border-ink-700/15 border-l-[3px] bg-paper-50 p-3.5 ${INK_BORDER[p.ink]}`}>
            <div className="flex items-center justify-between">
              <p className={`font-mono text-[11px] tracking-wide ${INK_TEXT[p.ink]}`}>{p.kind}</p>
              <p className="text-[11px] font-bold text-ink-700/70">{p.author}</p>
            </div>
            <p className="mt-1 font-bold text-ink-900">{p.title}</p>
            {p.excerpt && <p className="mt-1 text-sm leading-relaxed text-ink-700/80">{p.excerpt}</p>}
            <p className="mt-1.5 font-mono text-[10px] text-ink-500/80">{p.meta}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
