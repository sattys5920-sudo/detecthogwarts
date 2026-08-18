import { useState } from 'react';
import { useNotebook, type NotebookEntry } from '../hooks/useNotebook';

const INK_TEXT: Record<NotebookEntry['ink'], string> = {
  black: 'text-ink-black',
  red: 'text-ink-red',
  indigo: 'text-ink-indigo',
};

const INK_BG: Record<NotebookEntry['ink'], string> = {
  black: 'bg-ink-black',
  red: 'bg-ink-red',
  indigo: 'bg-ink-indigo',
};

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
}

function Spiral() {
  return (
    <div className="absolute inset-y-3 left-0 flex w-4 flex-col items-center justify-between">
      {Array.from({ length: 10 }).map((_, i) => (
        <span key={i} className="h-2.5 w-2.5 rounded-full border border-ink-700/40 bg-paper-50" />
      ))}
    </div>
  );
}

export default function NotebookPage() {
  const { entries } = useNotebook();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = entries.find((e) => e.id === openId);
  const unresolved = entries.filter((e) => e.status !== '확인됨').length;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-sm border border-ink-700/20 bg-paper-50 pl-8 pr-4 py-5 shadow-[0_2px_10px_rgba(42,28,18,0.15)]">
        <Spiral />

        {open ? (
          <div className="notebook-page">
            <button
              type="button"
              onClick={() => setOpenId(null)}
              className="mb-3 text-xs text-ink-500/60 underline-offset-2 hover:text-ink-700 hover:underline"
            >
              ← 목록으로
            </button>
            <p className={`font-mono text-[11px] tracking-wide ${INK_TEXT[open.ink]}`}>{open.status}</p>
            <h2 className="font-display mt-1 text-3xl leading-tight text-ink-900">{open.title}</h2>
            <p className="mt-1 font-mono text-[10px] text-ink-500/60">{formatDate(open.registeredAt)} 등록</p>
            <p className="mt-4 font-serif-kr text-sm leading-relaxed text-ink-900">{open.desc}</p>
          </div>
        ) : (
          <div className="notebook-page">
            <h2 className="font-display text-3xl text-ink-900">탐사 수첩</h2>
            <p className="mt-1 font-mono text-[11px] text-ink-500/70">
              단서 {entries.length}건 · 미해결 {unresolved}건
            </p>

            <div className="mt-4 flex flex-col">
              {entries.length === 0 && (
                <p className="py-8 text-center text-sm text-ink-500/60">아직 등록된 단서가 없습니다.</p>
              )}
              {entries.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setOpenId(e.id)}
                  className="flex items-center gap-2.5 border-b border-ink-700/10 py-3 text-left last:border-b-0"
                >
                  <span className={`h-2 w-2 flex-none rounded-full ${INK_BG[e.ink]}`} />
                  <span className="min-w-0 flex-1">
                    <span className="font-display block text-lg leading-none text-ink-900">{e.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-ink-700/60">{e.desc}</span>
                  </span>
                  <span className={`flex-none font-mono text-[10px] ${INK_TEXT[e.ink]}`}>{e.status}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
