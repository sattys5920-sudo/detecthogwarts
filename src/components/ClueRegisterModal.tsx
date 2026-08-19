import { useState } from 'react';

interface ClueRegisterModalProps {
  sourceText: string;
  alreadyRegistered: boolean;
  onConfirm: (title: string) => void;
  onClose: () => void;
}

export default function ClueRegisterModal({ sourceText, alreadyRegistered, onConfirm, onClose }: ClueRegisterModalProps) {
  const [title, setTitle] = useState('');

  function confirm() {
    const trimmed = title.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black/50 px-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-lg border border-ink-700/20 bg-paper-50 p-4 shadow-[0_8px_30px_rgba(23,19,15,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-mono text-[11px] font-bold text-seal-600">조사 수첩에 등록</p>
        <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-ink-700/70">{sourceText}</p>

        {alreadyRegistered && (
          <p className="mt-2 text-[11px] font-bold text-ink-500/60">이미 수첩에 등록된 말입니다. 다시 등록하면 새 항목으로 추가됩니다.</p>
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && confirm()}
          placeholder="단서 제목을 입력하세요"
          maxLength={40}
          autoFocus
          className="mt-3 w-full rounded-lg border border-ink-700/20 bg-paper-100/60 px-2.5 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-500/40 focus:border-seal-500"
        />

        <div className="mt-3 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="text-xs text-ink-500/60 hover:underline">
            취소
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!title.trim()}
            className="rounded-lg bg-ink-black px-3 py-1.5 text-xs font-bold text-paper-50 disabled:opacity-40"
          >
            수첩에 등록
          </button>
        </div>
      </div>
    </div>
  );
}
