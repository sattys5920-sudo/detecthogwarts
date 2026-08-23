import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel';
import Button from '../components/Button';
import Card from '../components/Card';
import Letterhead from '../components/Letterhead';
import PushSetup from '../components/PushSetup';
import SectionTitle from '../components/SectionTitle';
import { useGame } from '../context/GameContext';
import { HOUSES, SCHOOL_NAME } from '../data/school';
import { DEFAULT_PREFS, setPref, subscribePrefs, type NotificationPrefs } from '../firebase/notificationPrefs';
import { patronusById } from '../game/forest/patronus';
import gryffindorCrest from '../assets/crests/gryffindor.png';
import hufflepuffCrest from '../assets/crests/hufflepuff.png';
import ravenclawCrest from '../assets/crests/ravenclaw.png';
import slytherinCrest from '../assets/crests/slytherin.png';

const HOUSE_CRESTS: Record<string, string> = {
  flame: gryffindorCrest,
  moonlight: ravenclawCrest,
  earth: hufflepuffCrest,
  wind: slytherinCrest,
};

const RESOURCE_STATS: { key: 'hp' | 'mp' | 'stamina'; maxKey: 'maxHp' | 'maxMp' | 'maxStamina'; label: string }[] = [
  { key: 'hp', maxKey: 'maxHp', label: 'HP' },
  { key: 'mp', maxKey: 'maxMp', label: 'MP' },
  { key: 'stamina', maxKey: 'maxStamina', label: '스태미나' },
];

const CAPABILITY_STATS: { key: 'intelligence' | 'spellPower' | 'agility'; label: string }[] = [
  { key: 'intelligence', label: '지능' },
  { key: 'spellPower', label: '주문 공격력' },
  { key: 'agility', label: '민첩' },
];

function PrefRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <span className="text-sm text-ink-900">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`rounded-sm border px-3 py-1 font-mono text-[11px] font-bold transition-colors ${
          value ? 'border-seal-700 bg-seal-600 text-paper-50' : 'border-ink-700/25 bg-paper-200 text-ink-700/60'
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

      <Card ornate className="text-center">
        <p className="mb-3 font-mono text-[10px] font-bold tracking-[0.2em] text-gold-600">탐구자 기록부</p>
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
          <span className="rounded-sm border border-ink-700/25 bg-paper-100 px-2.5 py-1 text-[11px] font-bold text-ink-700">
            {house ? house.name : '기숙사 미배정'}
          </span>
          {game.grade && (
            <span className="rounded-sm border border-ink-700/25 bg-paper-100 px-2.5 py-1 text-[11px] font-bold text-ink-700">
              {game.grade}학년
            </span>
          )}
          <span className="rounded-sm border border-ink-700/25 bg-paper-100 px-2.5 py-1 text-[11px] font-bold text-ink-700">
            탐구자
          </span>
        </div>

        <div className="my-4 h-px bg-ink-700/10" />

        <div className="flex flex-col gap-2 text-left">
          {RESOURCE_STATS.map((s) => {
            const value = game.stats[s.key];
            const max = game.stats[s.maxKey];
            return (
              <div key={s.key} className="flex items-center gap-2 text-xs">
                <span className="w-16 flex-none text-ink-500/70">{s.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full border border-ink-700/15 bg-paper-200">
                  <div className="h-full bg-ink-black transition-all duration-300" style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }} />
                </div>
                <span className="w-14 flex-none text-right font-mono text-ink-red">{value}/{max}</span>
              </div>
            );
          })}
          {CAPABILITY_STATS.map((s) => {
            const value = game.stats[s.key];
            return (
              <div key={s.key} className="flex items-center gap-2 text-xs">
                <span className="w-16 flex-none text-ink-500/70">{s.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full border border-ink-700/15 bg-paper-200">
                  <div className="h-full bg-ink-black transition-all duration-300" style={{ width: `${Math.min(100, value)}%` }} />
                </div>
                <span className="w-14 flex-none text-right font-mono text-ink-red">{value}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {game.assignedHouse ? (
        <div>
          <SectionTitle className="mb-2">소속 기숙사</SectionTitle>
          <Card className="text-center">
            {house && HOUSE_CRESTS[house.id] && (
              <img src={HOUSE_CRESTS[house.id]} alt={house.name} className="mx-auto h-32 w-auto" />
            )}
            <p className="mt-2 font-serif-kr font-semibold text-ink-900">{house?.name}</p>
            <p className="text-xs text-ink-500/70">적성 검사를 통해 정식 배정되었습니다.</p>
          </Card>
        </div>
      ) : (
        <div>
          <SectionTitle className="mb-2">소속 기숙사</SectionTitle>
          <Card>
            <p className="text-sm text-ink-700/70">아직 기숙사가 배정되지 않았습니다.</p>
            <p className="mt-1 text-xs text-ink-500/60">관리자가 배정하면 여기에 표시됩니다.</p>
          </Card>
        </div>
      )}

      {game.patronus ? (
        <div>
          <SectionTitle className="mb-2">배정 패트로누스</SectionTitle>
          <Card className="text-center">
            <p className="font-serif-kr font-semibold text-ink-900">
              {patronusById(game.patronus).name} <span className="text-seal-600">· {patronusById(game.patronus).effectLabel}</span>
            </p>
            <p className="mt-1 text-xs text-ink-500/70">{patronusById(game.patronus).description}</p>
          </Card>
        </div>
      ) : (
        <div>
          <SectionTitle className="mb-2">배정 패트로누스</SectionTitle>
          <Card>
            <p className="text-sm text-ink-700/70">아직 패트로누스가 배정되지 않았습니다.</p>
            <p className="mt-1 text-xs text-ink-500/60">관리자가 배정하면 여기에 표시됩니다.</p>
          </Card>
        </div>
      )}

      <div>
        <SectionTitle className="mb-2">알림 설정</SectionTitle>
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

      <div>
        <SectionTitle className="mb-2">모바일 푸시 알림</SectionTitle>
        <Card>
          <PushSetup />
        </Card>
      </div>

      {game.isAdmin && (
        <div>
          <SectionTitle className="mb-2">관리자 기능</SectionTitle>
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
