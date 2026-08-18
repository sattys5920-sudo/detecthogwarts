import { useState } from 'react';
import type { ClueDef, SceneItem } from '../data/investigation/types';

interface SceneExplorerProps {
  items: SceneItem[];
  onClue: (clue: ClueDef) => void;
}

export default function SceneExplorer({ items, onClue }: SceneExplorerProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [registered, setRegistered] = useState<Record<string, boolean>>({});

  function open(item: SceneItem) {
    setOpenId((id) => (id === item.id ? null : item.id));
    if (item.clue && !registered[item.id]) {
      onClue(item.clue);
      setRegistered((r) => ({ ...r, [item.id]: true }));
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => (
        <div key={item.id} className="rounded-sm border border-ink-700/15 bg-paper-50">
          <button type="button" onClick={() => open(item)} className="flex w-full items-center gap-2.5 p-3 text-left">
            <span className="text-lg">{item.icon}</span>
            <span className="flex-1 text-sm font-semibold text-ink-900">{item.name}</span>
            {registered[item.id] && <span className="text-xs text-seal-600">✓</span>}
          </button>
          {openId === item.id && (
            <p className="border-t border-ink-700/10 px-3 py-2.5 text-sm leading-relaxed text-ink-700">{item.text}</p>
          )}
        </div>
      ))}
    </div>
  );
}
