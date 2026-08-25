import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Letterhead from '../components/Letterhead';
import { usePageBack } from '../context/BackContext';
import { useGame } from '../context/GameContext';
import { dexCount, growthProgress, isReady, remainingSeconds } from '../game/herbFarm/engine';
import { HERBS, TOTAL_HERB_COUNT, herbById } from '../game/herbFarm/herbs';
import type { FarmSlot, HarvestResult, Herb, HerbFarmState } from '../game/herbFarm/types';
import { ensureFarm, harvest, harvestAll, plant, subscribeFarm } from '../firebase/herbFarm';

function stars(rarity: number) {
  return '★'.repeat(rarity) + '☆'.repeat(5 - rarity);
}

function rarityColor(rarity: number) {
  if (rarity >= 5) return 'text-gold-600';
  if (rarity >= 4) return 'text-seal-600';
  if (rarity >= 3) return 'text-ink-red';
  return 'text-ink-700/70';
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '완료';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return m > 0 ? `${h} 시간 ${m} 분` : `${h} 시간`;
  if (m > 0) return s > 0 ? `${m} 분 ${s} 초` : `${m} 분`;
  return `${s} 초`;
}

function SlotCard({
  slot,
  now,
  busy,
  onPlant,
  onHarvest,
}: {
  slot: FarmSlot;
  now: number;
  busy: boolean;
  onPlant: () => void;
  onHarvest: () => void;
}) {
  const herb = slot.herbId ? herbById(slot.herbId) : null;
  const ready = isReady(slot, now);

  if (!herb) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 py-7 text-center">
        <span className="text-2xl text-ink-500/40">＋</span>
        <button
          type="button"
          onClick={onPlant}
          disabled={busy}
          className="tablet-btn px-3 py-1.5 text-xs font-bold disabled:opacity-40"
        >
          약초 심기
        </button>
      </Card>
    );
  }

  if (ready) {
    return (
      <Card className="flex flex-col items-center gap-1.5 py-5 text-center">
        <span className="text-2xl">🌿</span>
        <p className="font-serif-kr text-sm font-bold text-ink-900">{herb.name}</p>
        <p className={`font-mono text-[10px] ${rarityColor(herb.rarity)}`}>{stars(herb.rarity)}</p>
        <p className="text-xs font-bold text-seal-600">수확 가능!</p>
        <button
          type="button"
          onClick={onHarvest}
          disabled={busy}
          className="tablet-btn tablet-btn-dark mt-1 px-3 py-1.5 text-xs font-bold disabled:opacity-40"
        >
          수확하기
        </button>
      </Card>
    );
  }

  const progress = Math.round(growthProgress(slot, now) * 100);
  return (
    <Card className="flex flex-col items-center gap-1.5 py-5 text-center">
      <span className="text-2xl opacity-70">🌱</span>
      <p className="font-serif-kr text-sm font-bold text-ink-900/80">{herb.name}</p>
      <p className={`font-mono text-[10px] ${rarityColor(herb.rarity)}`}>{stars(herb.rarity)}</p>
      <p className="text-[11px] text-ink-700/70">성장 중 · {progress}%</p>
      <div className="h-1.5 w-full max-w-[7rem] overflow-hidden rounded-full bg-ink-700/10">
        <div className="h-full rounded-full bg-seal-500/70" style={{ width: `${progress}%` }} />
      </div>
      <p className="font-mono text-[10px] text-ink-500/70">남은 시간 {formatDuration(remainingSeconds(slot, now))}</p>
    </Card>
  );
}

function DexModal({ farm, onClose }: { farm: HerbFarmState; onClose: () => void }) {
  const [selected, setSelected] = useState<Herb | null>(null);
  const count = dexCount(farm);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black/60 px-4" role="dialog" aria-modal="true">
      <div className="deckle-edge flex max-h-[85vh] w-full max-w-sm flex-col border border-seal-500/40 bg-paper-50 p-5">
        <div className="flex items-center justify-between">
          <p className="font-serif-kr text-base font-bold text-ink-900">📖 약초 도감</p>
          <button type="button" onClick={onClose} className="text-xs text-ink-500/70 underline-offset-2 hover:underline">
            닫기
          </button>
        </div>
        <p className="mt-1 font-mono text-[11px] text-ink-500/70">수집률 {count} / {TOTAL_HERB_COUNT}</p>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink-700/10">
          <div className="h-full rounded-full bg-gold-500/80" style={{ width: `${(count / TOTAL_HERB_COUNT) * 100}%` }} />
        </div>

        {selected ? (
          <div className="mt-4 flex flex-1 flex-col overflow-y-auto">
            <button type="button" onClick={() => setSelected(null)} className="mb-2 self-start text-xs text-ink-500/60 underline-offset-2 hover:underline">
              ← 목록으로
            </button>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span className="text-3xl">🌿</span>
              <p className="font-serif-kr text-lg font-bold text-ink-900">{selected.name}</p>
              <p className={`font-mono text-xs ${rarityColor(selected.rarity)}`}>{stars(selected.rarity)}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-700/80">{selected.description}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-3 font-mono text-[11px] text-ink-500/70">
                <span>성장 시간 {formatDuration(selected.growthTime)}</span>
                <span>HP +{selected.healAmount}</span>
                <span>MP +{selected.mpAmount}</span>
                <span>스태미나 +{selected.staminaAmount}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid flex-1 grid-cols-5 gap-2 overflow-y-auto pb-1">
            {HERBS.map((h) => {
              const discovered = h.id in farm.dex;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => discovered && setSelected(h)}
                  disabled={!discovered}
                  className={`flex aspect-square flex-col items-center justify-center rounded-sm border text-lg ${
                    discovered ? 'border-ink-700/25 bg-paper-100' : 'border-ink-700/10 bg-ink-700/5 text-ink-500/40'
                  }`}
                  title={discovered ? h.name : '???'}
                >
                  {discovered ? '🌿' : '❓'}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function HarvestPopup({ results, onClose }: { results: HarvestResult[]; onClose: () => void }) {
  const totalHeal = results.reduce((sum, r) => sum + r.healAmount, 0);
  const totalMp = results.reduce((sum, r) => sum + r.mpAmount, 0);
  const totalStamina = results.reduce((sum, r) => sum + r.staminaAmount, 0);
  const anyNew = results.some((r) => r.isNewDiscovery);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black/60 px-6" role="alertdialog" aria-modal="true">
      <div className="deckle-edge flex max-h-[85vh] w-full max-w-xs flex-col border border-seal-500/40 bg-paper-50 p-5 text-center">
        {anyNew && <p className="flex-none font-mono text-[10px] font-bold tracking-widest text-seal-600">✨ 새로운 약초 발견!</p>}
        <div className="mt-3 flex flex-1 flex-col gap-3 overflow-y-auto">
          {results.map((r, i) => (
            <div key={`${r.herb.id}-${i}`} className="flex flex-col items-center gap-1">
              <span className="text-2xl">🌿</span>
              <p className="font-serif-kr text-base font-bold text-ink-900">
                {r.herb.name} {r.isNewDiscovery && <span className="ml-1 text-[10px] font-bold text-seal-600">NEW!</span>}
              </p>
              <p className={`font-mono text-[10px] ${rarityColor(r.herb.rarity)}`}>{stars(r.herb.rarity)}</p>
              <p className="text-sm font-bold text-seal-600">HP +{r.healAmount} · MP +{r.mpAmount} · 스태미나 +{r.staminaAmount}</p>
            </div>
          ))}
        </div>
        {results.length > 1 && (
          <p className="mt-3 flex-none font-mono text-[11px] text-ink-500/70">
            총 HP +{totalHeal} · MP +{totalMp} · 스태미나 +{totalStamina}
          </p>
        )}
        <button type="button" onClick={onClose} className="tablet-btn tablet-btn-dark mt-5 w-full flex-none px-4 py-2 text-xs font-bold">
          확인
        </button>
      </div>
    </div>
  );
}

export default function HerbFarmPage() {
  const game = useGame();
  const navigate = useNavigate();
  const [farm, setFarm] = useState<HerbFarmState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [showDex, setShowDex] = useState(false);
  const [harvestPopup, setHarvestPopup] = useState<HarvestResult[] | null>(null);
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [busyAll, setBusyAll] = useState(false);

  usePageBack(useCallback(() => navigate('/recess'), [navigate]));

  useEffect(() => {
    if (!game.playerId) return;
    let unsub: (() => void) | undefined;
    ensureFarm(game.playerId).then(() => {
      unsub = subscribeFarm(game.playerId!, setFarm);
    });
    return () => unsub?.();
  }, [game.playerId]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!game.playerId || !farm) {
    return (
      <div className="flex flex-col gap-4">
        <Letterhead label="약초 농장" context="온실 문을 여는 중..." meta="휴게시간" />
      </div>
    );
  }

  const readySlots = farm.slots.filter((s) => isReady(s, now));

  async function handlePlant(slotId: number) {
    setBusySlot(slotId);
    try {
      await plant(game.playerId!, slotId);
    } finally {
      setBusySlot(null);
    }
  }

  async function handleHarvest(slotId: number) {
    setBusySlot(slotId);
    try {
      const result = await harvest(game.playerId!, slotId);
      game.adjustStat('hp', result.healAmount);
      game.adjustStat('mp', result.mpAmount);
      game.adjustStat('stamina', result.staminaAmount);
      setHarvestPopup([result]);
    } finally {
      setBusySlot(null);
    }
  }

  async function handleHarvestAll() {
    setBusyAll(true);
    try {
      const results = await harvestAll(game.playerId!);
      if (results.length > 0) {
        const totalHeal = results.reduce((sum, r) => sum + r.healAmount, 0);
        const totalMp = results.reduce((sum, r) => sum + r.mpAmount, 0);
        const totalStamina = results.reduce((sum, r) => sum + r.staminaAmount, 0);
        game.adjustStat('hp', totalHeal);
        game.adjustStat('mp', totalMp);
        game.adjustStat('stamina', totalStamina);
        setHarvestPopup(results);
      }
    } finally {
      setBusyAll(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Letterhead label="약초 농장" context="약초를 심고, 시간이 지나면 돌아와 수확하세요." meta="휴게시간" />

      <button type="button" onClick={() => navigate('/recess')} className="self-start text-xs text-ink-500/60 underline-offset-2 hover:text-ink-700 hover:underline">
        ← 방 목록으로
      </button>

      <Card className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-bold tracking-widest text-ink-500/70">현재 HP</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 w-28 overflow-hidden rounded-full bg-ink-700/10">
              <div
                className="h-full rounded-full bg-seal-500/70"
                style={{ width: `${game.stats.maxHp > 0 ? Math.min(100, (game.stats.hp / game.stats.maxHp) * 100) : 0}%` }}
              />
            </div>
            <span className="font-mono text-xs text-ink-700/80">{game.stats.hp} / {game.stats.maxHp}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDex(true)}
          className="flex-none rounded-sm bg-ink-black px-3 py-1.5 text-xs font-bold text-paper-50"
        >
          📖 도감 {dexCount(farm)}/{TOTAL_HERB_COUNT}
        </button>
      </Card>

      {readySlots.length > 0 && (
        <Card className="flex items-center justify-between gap-3 border-seal-500/40">
          <p className="text-sm font-bold text-ink-900">수확 가능한 약초 {readySlots.length} 개가 있어요!</p>
          <button
            type="button"
            onClick={handleHarvestAll}
            disabled={busyAll}
            className="tablet-btn tablet-btn-dark flex-none px-3 py-1.5 text-xs font-bold disabled:opacity-40"
          >
            모두 수확
          </button>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        {farm.slots.map((slot) => (
          <SlotCard
            key={slot.slotId}
            slot={slot}
            now={now}
            busy={busySlot === slot.slotId}
            onPlant={() => handlePlant(slot.slotId)}
            onHarvest={() => handleHarvest(slot.slotId)}
          />
        ))}
      </div>

      {showDex && <DexModal farm={farm} onClose={() => setShowDex(false)} />}
      {harvestPopup && <HarvestPopup results={harvestPopup} onClose={() => setHarvestPopup(null)} />}
    </div>
  );
}
