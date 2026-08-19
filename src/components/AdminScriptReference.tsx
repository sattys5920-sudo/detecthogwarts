import { useState } from 'react';
import type { DayContent } from '../data/investigation/types';

export default function AdminScriptReference({ day }: { day: DayContent }) {
  const [open, setOpen] = useState(false);
  const [openNodeId, setOpenNodeId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2 rounded-sm border border-ink-700/15 bg-paper-100/40 p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="self-start text-xs font-bold text-ink-700/70 underline-offset-2 hover:text-ink-900 hover:underline"
      >
        {open ? '대본 참고 닫기' : '대본 참고 열기 (관리자 전용)'}
      </button>

      {open && (
        <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
          <p className="text-[11px] italic leading-relaxed text-ink-700/70">{day.opening.join(' ')}</p>

          {day.nodes.map((node) => {
            const expanded = openNodeId === node.id;
            return (
              <div key={node.id} className="rounded-sm border border-ink-700/10 bg-paper-50 p-2">
                <button
                  type="button"
                  onClick={() => setOpenNodeId(expanded ? null : node.id)}
                  className="w-full text-left text-xs font-bold text-ink-900"
                >
                  {node.title}
                </button>
                {expanded && (
                  <div className="mt-1.5 flex flex-col gap-2">
                    {node.intro && node.intro.length > 0 && (
                      <p className="text-[11px] leading-relaxed text-ink-700/70">{node.intro.join(' ')}</p>
                    )}
                    {node.options.map((o) => (
                      <div key={o.id} className="border-l-2 border-seal-500/30 pl-2">
                        <p className="text-[11px] font-bold text-seal-600">{o.label}</p>
                        {o.lines.map((line, i) => (
                          <p key={i} className="text-[11px] leading-relaxed text-ink-900">
                            {line}
                          </p>
                        ))}
                        {o.clue && <p className="mt-0.5 text-[10px] text-ink-500/60">단서: {o.clue.title}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="rounded-sm border border-ink-700/10 bg-paper-50 p-2">
            <p className="text-xs font-bold text-ink-900">하루 마무리</p>
            {day.closing.map((line, i) => (
              <p key={i} className="text-[11px] leading-relaxed text-ink-700/70">
                {line}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
