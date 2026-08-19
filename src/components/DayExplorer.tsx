import { useState } from 'react';
import type { ClueDef, DayContent, InvestigationNode } from '../data/investigation/types';
import { useDayProgress } from '../hooks/useDayProgress';
import type { NotebookEntry } from '../hooks/useNotebook';

function deriveClue(text: string, preset?: ClueDef): ClueDef {
  if (preset) return preset;
  return { title: text.length > 24 ? `${text.slice(0, 24)}…` : text, desc: text, ink: 'black', status: '기록됨' };
}

interface DayExplorerProps {
  day: DayContent;
  notebookEntries: NotebookEntry[];
  onRegister: (sourceId: string, clue: ClueDef) => void;
}

export default function DayExplorer({ day, notebookEntries, onRegister }: DayExplorerProps) {
  const { seen, markSeen } = useDayProgress(day.day);
  const [openNodeId, setOpenNodeId] = useState<string | null>(null);
  const [openOptionId, setOpenOptionId] = useState<string | null>(null);

  const registeredIds = new Set(notebookEntries.map((e) => e.sourceId).filter(Boolean));
  const openNode = day.nodes.find((n) => n.id === openNodeId);
  const openOption = openNode?.options.find((o) => o.id === openOptionId);

  function seenKey(node: InvestigationNode, optionId: string) {
    return `d${day.day}-${node.id}-${optionId}`;
  }

  function selectOption(node: InvestigationNode, optionId: string) {
    setOpenOptionId(optionId);
    markSeen(seenKey(node, optionId));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-sm border border-ink-700/15 bg-paper-50 p-3.5">
        {day.opening.map((line, i) => (
          <p key={i} className="text-center font-serif-kr text-sm italic leading-relaxed text-ink-900">
            {line}
          </p>
        ))}
      </div>

      {!openNode && (
        <div className="grid grid-cols-2 gap-2">
          {day.nodes.map((node) => {
            const allSeen = node.options.every((o) => seen.has(seenKey(node, o.id)));
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => {
                  setOpenNodeId(node.id);
                  setOpenOptionId(null);
                }}
                className="tablet-tab rounded-lg px-3 py-2.5 text-left text-sm font-bold text-ink-900"
              >
                {node.title}
                {allSeen && <span className="ml-1 text-[10px] font-normal text-seal-600">(확인 완료)</span>}
              </button>
            );
          })}
        </div>
      )}

      {openNode && !openOption && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setOpenNodeId(null)}
            className="self-start text-xs text-ink-500/60 underline-offset-2 hover:text-ink-700 hover:underline"
          >
            ← 목록으로
          </button>
          <p className="text-sm font-bold text-ink-900">{openNode.title}</p>
          {openNode.intro?.map((line, i) => (
            <p key={i} className="text-sm leading-relaxed text-ink-900">
              {line}
            </p>
          ))}
          <div className="flex flex-col gap-1.5">
            {openNode.options.map((o) => {
              const done = seen.has(seenKey(openNode, o.id));
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => selectOption(openNode, o.id)}
                  className="tablet-tab rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-900"
                >
                  {o.label}
                  {done && <span className="ml-1 text-[10px] text-seal-600">(확인 완료)</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {openNode && openOption && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setOpenOptionId(null)}
            className="self-start text-xs text-ink-500/60 underline-offset-2 hover:text-ink-700 hover:underline"
          >
            ← 다른 곳을 조사한다
          </button>
          <div className="flex flex-col gap-1.5 rounded-sm border border-ink-700/15 bg-paper-100/60 p-3">
            {openOption.lines.map((line, i) => (
              <p key={i} className="text-sm leading-relaxed text-ink-900">
                {line}
              </p>
            ))}
          </div>
          <button
            type="button"
            disabled={registeredIds.has(seenKey(openNode, openOption.id))}
            onClick={() => onRegister(seenKey(openNode, openOption.id), deriveClue(openOption.lines.join(' '), openOption.clue))}
            className="self-start text-[11px] font-bold text-ink-500/40 underline-offset-2 hover:text-seal-600 hover:underline disabled:text-seal-600 disabled:no-underline"
          >
            {registeredIds.has(seenKey(openNode, openOption.id)) ? '수첩에 등록됨' : '수첩에 등록'}
          </button>
        </div>
      )}
    </div>
  );
}
