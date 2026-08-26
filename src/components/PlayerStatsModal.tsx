import { useState } from 'react';
import { MAX_STAT_VALUE, type PlayerStats } from '../context/GameContext';
import { overridePlayerStats } from '../firebase/players';

const STAT_ROWS: { key: keyof PlayerStats; label: string }[] = [
  { key: 'hp', label: 'HP' },
  { key: 'maxHp', label: '최대 HP' },
  { key: 'mp', label: 'MP' },
  { key: 'maxMp', label: '최대 MP' },
  { key: 'stamina', label: '스태미나' },
  { key: 'maxStamina', label: '최대 스태미나' },
  { key: 'intelligence', label: '지능' },
  { key: 'spellPower', label: '주문 공격력' },
  { key: 'agility', label: '민첩' },
];

const DEFAULT_STATS: PlayerStats = {
  hp: 100, maxHp: 100,
  mp: 100, maxMp: 100,
  stamina: 100, maxStamina: 100,
  intelligence: 50, spellPower: 50, agility: 50,
};

interface PlayerStatsModalProps {
  playerId: string;
  nickname: string;
  stats: PlayerStats | null;
  statsUpdatedAt: number | null;
  onClose: () => void;
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function PlayerStatsModal({ playerId, nickname, stats, statsUpdatedAt, onClose }: PlayerStatsModalProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PlayerStats>(stats ?? DEFAULT_STATS);
  const [saving, setSaving] = useState(false);

  function setField(key: keyof PlayerStats, raw: string) {
    const n = Number(raw);
    const clamped = Number.isFinite(n) ? Math.max(0, Math.min(MAX_STAT_VALUE, Math.round(n))) : 0;
    setDraft((prev) => ({ ...prev, [key]: clamped }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await overridePlayerStats(playerId, draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black/50 px-6" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-xs flex-col overflow-y-auto rounded-lg border border-ink-700/20 bg-paper-50 p-4 shadow-[0_8px_30px_rgba(23,19,15,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-mono text-[11px] font-bold text-seal-600">{nickname} 님의 스탯</p>
        <p className="mt-0.5 text-[10px] text-ink-500/50">
          {stats ? `마지막 동기화: ${statsUpdatedAt ? formatTime(statsUpdatedAt) : '-'}` : '아직 기기에서 동기화된 적이 없습니다 (기본값 표시)'}
        </p>

        <div className="mt-3 flex flex-col gap-1.5">
          {STAT_ROWS.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-ink-700/70">{row.label}</span>
              {editing ? (
                <input
                  type="number"
                  min={0}
                  max={MAX_STAT_VALUE}
                  value={draft[row.key]}
                  onChange={(e) => setField(row.key, e.target.value)}
                  className="w-20 rounded-sm border border-ink-700/20 bg-paper-100/60 px-2 py-1 text-right text-xs text-ink-900 outline-none focus:border-seal-500"
                />
              ) : (
                <span className="font-mono font-bold text-ink-900">{draft[row.key]}</span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-none justify-end gap-3">
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setDraft(stats ?? DEFAULT_STATS);
                  setEditing(false);
                }}
                className="text-xs text-ink-500/60 hover:underline"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-ink-black px-3 py-1.5 text-xs font-bold text-paper-50 disabled:opacity-40"
              >
                {saving ? '저장 중…' : '저장'}
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={onClose} className="text-xs text-ink-500/60 hover:underline">
                닫기
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-lg bg-ink-black px-3 py-1.5 text-xs font-bold text-paper-50"
              >
                수정
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
