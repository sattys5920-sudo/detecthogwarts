import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel';
import Button from '../components/Button';
import Card from '../components/Card';
import Letterhead from '../components/Letterhead';
import { useGame } from '../context/GameContext';
import { HOUSES, SCHOOL_NAME } from '../data/school';
import { DEFAULT_PREFS, setPref, subscribePrefs, type NotificationPrefs } from '../firebase/notificationPrefs';

const STAT_LABELS: { key: 'hp' | 'intelligence' | 'stamina' | 'spellPower'; label: string }[] = [
  { key: 'hp', label: 'HP' },
  { key: 'intelligence', label: '지능' },
  { key: 'stamina', label: '스태미나' },
  { key: 'spellPower', label: '주문 공격력' },
];

const ITEMS = [
  { name: '나침반', count: 1 },
  { name: '부적', count: 2 },
  { name: '마법약', count: 2 },
  { name: '촛불', count: 1 },
];

function ItemGlyph({ name, className = '' }: { name: string; className?: string }) {
  const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {name === '나침반' && (
        <>
          <circle cx="12" cy="12" r="8" {...stroke} />
          <path d="M14 9l-1.3 4.3L9 15l1.3-4.3L14 9Z" fill="currentColor" />
        </>
      )}
      {name === '부적' && <path d="M12 3 20 12 12 21 4 12Z" fill="currentColor" />}
      {name === '마법약' && (
        <>
          <path d="M9 3h6M10 3v5l-4.5 8a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 8V3" {...stroke} />
          <path d="M7.5 14h9" {...stroke} />
        </>
      )}
      {name === '촛불' && (
        <>
          <path d="M9 21h6M10 21V9h4v12" {...stroke} />
          <path d="M12 3c1.5 1.8 1.5 3.2 0 4.5C10.5 6.2 10.5 4.8 12 3Z" fill="currentColor" />
        </>
      )}
    </svg>
  );
}

function PrefRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <span className="text-sm text-ink-900">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`rounded-full px-3 py-1 font-mono text-[11px] font-bold transition-colors ${
          value ? 'bg-seal-600 text-paper-50' : 'bg-paper-200 text-ink-700/60'
        }`}
      >
        {value ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const game = useGame();
  const navigate = useNavigate();
  const house = HOUSES.find((h) => h.id === game.houseId);
  const initial = game.nickname ? game.nickname[0] : '?';
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(game.nickname);
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    if (!game.playerId) return;
    return subscribePrefs(game.playerId, setPrefs);
  }, [game.playerId]);

  function updatePref(key: keyof NotificationPrefs, value: boolean) {
    if (!game.playerId) return;
    setPref(game.playerId, key, value);
  }

  function handlePickPhoto() {
    fileRef.current?.click();
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const size = 96;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      game.setAvatar(canvas.toDataURL('image/jpeg', 0.75));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
    e.target.value = '';
  }

  function saveName() {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed.length <= 12) {
      game.setNickname(trimmed);
    }
    setEditingName(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <Letterhead label="내 정보" context={SCHOOL_NAME} meta="2026.08.18 · 초승달 · 수업 3교시" />

      {game.justAssigned && house && (
        <div className="deckle-edge flex items-center justify-between gap-3 border border-seal-500/40 bg-paper-100 p-3.5">
          <p className="font-serif-kr text-sm text-ink-900">
            <b className="text-seal-600">{house.name}</b>에 배정되었습니다!
          </p>
          <button
            type="button"
            onClick={game.clearJustAssigned}
            className="flex-none text-xs text-ink-500/60 underline-offset-2 hover:text-ink-700 hover:underline"
          >
            확인
          </button>
        </div>
      )}

      <Card className="text-center">
        <div className="relative mx-auto h-16 w-16">
          <button
            type="button"
            onClick={handlePickPhoto}
            className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-ink-black text-xl font-bold text-paper-50"
            style={{ boxShadow: '0 0 0 3px var(--color-paper-50), 0 0 0 4px var(--color-ink-700)' }}
            aria-label="프로필 사진 변경"
          >
            {game.avatarDataUrl ? (
              <img src={game.avatarDataUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </button>
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-paper-50 px-1.5 py-0.5 text-[9px] font-bold text-ink-700 shadow">
            수정
          </span>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

        {editingName ? (
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveName()}
              maxLength={12}
              autoFocus
              className="w-32 rounded-lg border border-ink-700/20 bg-paper-100/60 px-2 py-1 text-center font-gothic text-xl text-ink-black outline-none focus:border-seal-500"
            />
            <button type="button" onClick={saveName} className="text-xs font-bold text-seal-600">
              저장
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setNameDraft(game.nickname);
              setEditingName(true);
            }}
            className="font-gothic mt-2 text-2xl text-ink-black"
          >
            {game.nickname || '이름 없음'} <span className="text-xs text-ink-500/40">(수정)</span>
          </button>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          <span className="rounded-full border border-ink-700/20 bg-paper-100 px-2.5 py-1 text-[11px] font-bold text-ink-700">
            {house ? house.name : '기숙사 미배정'}
          </span>
          <span className="rounded-full border border-ink-700/20 bg-paper-100 px-2.5 py-1 text-[11px] font-bold text-ink-700">
            탐구자
          </span>
        </div>

        <div className="my-4 h-px bg-ink-700/10" />

        <div className="flex flex-col gap-2 text-left">
          {STAT_LABELS.map((s) => (
            <div key={s.key} className="flex items-center gap-2 text-xs">
              <span className="w-16 flex-none text-ink-500/70">{s.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full border border-ink-700/15 bg-paper-200">
                <div className="h-full bg-ink-black transition-all duration-300" style={{ width: `${game.stats[s.key]}%` }} />
              </div>
              <span className="w-6 flex-none text-right font-mono text-ink-red">{game.stats[s.key]}</span>
            </div>
          ))}
        </div>

        <div className="my-4 h-px bg-ink-700/10" />

        <div className="grid grid-cols-4 gap-2">
          {ITEMS.map((it) => (
            <div
              key={it.name}
              className="flex flex-col items-center gap-1 rounded-lg border-2 border-ink-700/25 bg-paper-100 py-2.5 shadow-[inset_0_0_0_2px_var(--color-paper-50)]"
            >
              <ItemGlyph name={it.name} className="h-6 w-6 text-seal-600" />
              <span className="text-center text-[10px] leading-tight font-bold text-ink-900">{it.name}</span>
              <span className="font-mono text-[10px] text-ink-red">x{it.count}</span>
            </div>
          ))}
        </div>
      </Card>

      {game.assignedHouse ? (
        <div>
          <p className="mb-2 text-xs font-bold text-ink-700/70">소속 기숙사</p>
          <Card>
            <span className="block h-2 w-8 rounded-full" style={{ backgroundColor: house?.color }} />
            <p className="mt-2 font-serif-kr font-semibold text-ink-900">{house?.name}</p>
            <p className="text-xs text-ink-500/70">적성 검사를 통해 정식 배정되었습니다.</p>
          </Card>
        </div>
      ) : (
        <div>
          <p className="mb-2 text-xs font-bold text-ink-700/70">소속 기숙사 · 임시 선택</p>
          <p className="mb-2 text-[11px] text-ink-500/60">정식 배정 전까지 임시로 골라둘 수 있어요.</p>
          <div className="grid grid-cols-4 gap-2">
            {HOUSES.map((h) => {
              const selected = game.houseId === h.id;
              return (
                <button key={h.id} type="button" onClick={() => game.setHouse(h.id)} className="flex flex-col items-center gap-1.5">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-2 font-gothic text-base text-paper-50 transition-shadow ${
                      selected ? 'shadow-[0_0_0_3px_var(--color-paper-50),0_0_0_5px_var(--color-seal-500)]' : ''
                    }`}
                    style={{ backgroundColor: h.color, borderColor: 'rgba(42,28,18,0.4)' }}
                  >
                    {h.name}
                  </span>
                  <span className={`text-[11px] font-bold ${selected ? 'text-seal-600' : 'text-ink-700/60'}`}>{h.element}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-bold text-ink-700/70">알림 설정</p>
        <Card className="flex flex-col divide-y divide-ink-700/10">
          <PrefRow label="전체 알림" value={prefs.master} onChange={(v) => updatePref('master', v)} />
          <PrefRow label="새 팝업 · 피드 · 이벤트" value={prefs.event} onChange={(v) => updatePref('event', v)} />
          <PrefRow label="전체 대화" value={prefs.chat} onChange={(v) => updatePref('chat', v)} />
          <PrefRow label="태그 알림" value={prefs.mention} onChange={(v) => updatePref('mention', v)} />
        </Card>
        {!prefs.master && (
          <p className="mt-1.5 text-[11px] text-ink-500/60">전체 알림이 꺼져 있어 모든 알림이 차단됩니다. 개별 설정은 그대로 유지돼요.</p>
        )}
      </div>

      {game.isAdmin && (
        <div>
          <p className="mb-2 text-xs font-bold text-ink-700/70">관리자 기능</p>
          <AdminPanel />
        </div>
      )}

      <Button
        variant="ghost"
        onClick={() => {
          game.resetPlayer();
          navigate('/');
        }}
      >
        로그아웃
      </Button>
    </div>
  );
}
