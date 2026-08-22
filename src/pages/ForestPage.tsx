import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import PaperTexture from '../components/PaperTexture';
import { useGame } from '../context/GameContext';
import {
  choosePath,
  confirmEvent,
  ForestFullError,
  joinParty,
  leaveExpedition,
  leaveParty,
  startExpedition,
  submitCombatAction,
  subscribeParty,
  upgradeSpell,
} from '../firebase/forest';
import { currentActingPlayerId, MAX_SEATS, TOTAL_STAGES } from '../game/forest/engine';
import { eventById } from '../game/forest/events';
import { SPELLS, spellDcAtLevel, spellPowerAtLevel } from '../game/forest/spells';
import type { ForestParty, Player, Spell, SpellCategory } from '../game/forest/types';

const CATEGORY_SECTION: { category: SpellCategory; label: string }[] = [
  { category: 'attack', label: '개인 공격' },
  { category: 'aoeAttack', label: '전체 공격' },
  { category: 'defense', label: '개인 방어' },
  { category: 'aoeDefense', label: '전체 방어' },
  { category: 'heal', label: '개인 치유' },
  { category: 'aoeHeal', label: '전체 치유' },
];

const STATUS_LABEL: Record<string, string> = {
  burn: '🔥 화상', bleed: '🩸 출혈', stun: '💫 제압', weaken: '⬇️ 약화', vulnerable: '⚠️ 취약', slow: '🐌 둔화',
};

function HpBar({ hp, maxHp, colorClass = 'bg-seal-600' }: { hp: number; maxHp: number; colorClass?: string }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full border border-ink-700/15 bg-paper-200">
      <div className={`h-full ${colorClass} transition-all duration-300`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function PlayerCard({ player, isActing, targetable, onTarget }: { player: Player; isActing: boolean; targetable: boolean; onTarget?: () => void }) {
  const content = (
    <Card className={`flex flex-col gap-1.5 p-3 ${isActing ? 'border-seal-600' : ''} ${player.downed ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between">
        <p className="font-gothic text-base text-ink-black">{player.nickname}</p>
        {player.downed && <span className="rounded-full bg-ink-700 px-1.5 py-0.5 text-[9px] font-bold text-paper-50">다운</span>}
      </div>
      <HpBar hp={player.hp} maxHp={player.maxHp} />
      <p className="font-mono text-[10px] text-ink-500/70">
        HP {player.hp}/{player.maxHp} {player.shield > 0 && <span className="text-ink-indigo">🛡{player.shield}</span>}
      </p>
      <div className="flex flex-wrap gap-1">
        {player.statusEffects.map((s, i) => (
          <span key={i} className="rounded-full bg-paper-200 px-1.5 py-0.5 text-[9px] text-ink-700">{STATUS_LABEL[s.type] ?? s.type}</span>
        ))}
      </div>
    </Card>
  );
  if (targetable && onTarget) {
    return (
      <button type="button" onClick={onTarget} className="text-left">
        {content}
      </button>
    );
  }
  return content;
}

function MonsterCard({ name, hp, maxHp, defenseDC, statusEffects, shield, targetable, onTarget }: {
  name: string; hp: number; maxHp: number; defenseDC: number; statusEffects: { type: string }[]; shield: number; targetable: boolean; onTarget?: () => void;
}) {
  if (hp <= 0) return null;
  const content = (
    <Card className="flex flex-col gap-1.5 p-3">
      <p className="font-gothic text-base text-ink-black">{name}</p>
      <HpBar hp={hp} maxHp={maxHp} colorClass="bg-ink-indigo" />
      <p className="font-mono text-[10px] text-ink-500/70">
        HP {hp}/{maxHp} · 방어 DC {defenseDC} {shield > 0 && <span className="text-ink-indigo">🛡{shield}</span>}
      </p>
      <div className="flex flex-wrap gap-1">
        {statusEffects.map((s, i) => (
          <span key={i} className="rounded-full bg-paper-200 px-1.5 py-0.5 text-[9px] text-ink-700">{STATUS_LABEL[s.type] ?? s.type}</span>
        ))}
      </div>
    </Card>
  );
  if (targetable && onTarget) {
    return (
      <button type="button" onClick={onTarget} className="text-left">
        {content}
      </button>
    );
  }
  return content;
}

function SkillPanel({ player, onUpgrade }: { player: Player; onUpgrade: (spellId: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="flex flex-col gap-2">
      <button type="button" className="flex items-center justify-between" onClick={() => setOpen((v) => !v)}>
        <p className="font-gothic text-lg text-ink-black">내 스킬 강화</p>
        <span className="font-mono text-xs text-seal-600">보유 포인트 {player.skillPoints}{open ? ' ▲' : ' ▼'}</span>
      </button>
      {open && (
        <div className="grid grid-cols-1 gap-1.5">
          {SPELLS.map((s) => {
            const level = player.spellLevels[s.id] ?? 0;
            return (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-ink-700/10 bg-paper-100/50 px-2.5 py-1.5">
                <div>
                  <p className="text-xs font-bold text-ink-900">{s.name} <span className="font-mono text-[10px] text-ink-500/60">Lv.{level}</span></p>
                  <p className="text-[10px] text-ink-500/60">위력 {spellPowerAtLevel(s, level)} · DC {spellDcAtLevel(s, level)}</p>
                </div>
                <button
                  type="button"
                  disabled={player.skillPoints <= 0 || level >= 5}
                  onClick={() => onUpgrade(s.id)}
                  className="flex-none rounded-full bg-ink-black px-2.5 py-1 text-[10px] font-bold text-paper-50 disabled:opacity-30"
                >
                  강화 +1
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default function ForestPage() {
  const game = useGame();
  const navigate = useNavigate();
  const [party, setParty] = useState<ForestParty | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [targetMode, setTargetMode] = useState<{ spell: Spell } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeParty(setParty), []);

  useEffect(() => {
    if (!game.playerId) return;
    joinParty(game.playerId, game.nickname).catch((e) => {
      setJoinError(e instanceof ForestFullError ? e.message : '입장에 실패했습니다. 다시 시도해 주세요.');
    });
  }, [game.playerId, game.nickname]);

  if (!game.hasEntered) return <Navigate to="/" replace />;
  if (joinError) {
    return (
      <div className="relative flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <PaperTexture />
        <Card className="w-full max-w-xs">
          <p className="font-gothic text-2xl text-ink-black">🌲 금지된 숲</p>
          <p className="mt-2 text-sm text-ink-700/70">{joinError}</p>
          <Button className="mt-4 w-full" onClick={() => navigate('/recess')}>휴게시간으로 돌아가기</Button>
        </Card>
      </div>
    );
  }
  if (!party || !game.playerId) {
    return (
      <div className="relative flex min-h-svh flex-col items-center justify-center gap-3 px-6 text-center">
        <PaperTexture />
        <p className="text-sm text-ink-700/70">숲 입구를 확인하는 중...</p>
      </div>
    );
  }

  const me = party.seats.find((p) => p?.id === game.playerId) ?? null;
  const seatedCount = party.seats.filter((p) => p !== null).length;

  async function guard(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  // ---------- lobby ----------
  if (party.status === 'lobby') {
    if (!me) {
      return (
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-3 px-6 text-center">
          <PaperTexture />
          <p className="text-sm text-ink-700/70">입장하는 중...</p>
        </div>
      );
    }
    return (
      <div className="relative flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <PaperTexture />
        <Card className="w-full max-w-xs">
          <p className="font-gothic text-2xl text-ink-black">🌲 금지된 숲</p>
          <p className="mt-1 text-sm text-ink-700/70">2~4인 협동 탐사. 동료가 모이면 시작하세요.</p>
          <div className="mt-4 flex flex-col gap-1.5 text-left">
            {Array.from({ length: MAX_SEATS }).map((_, i) => {
              const seat = party.seats[i];
              return (
                <div key={i} className={`rounded-lg border px-3 py-2 text-sm ${seat ? 'border-seal-500/40 bg-paper-100 font-bold text-ink-900' : 'border-dashed border-ink-700/20 text-ink-500/50'}`}>
                  {seat ? seat.nickname : '빈 자리'}
                </div>
              );
            })}
          </div>
          <Button
            className="mt-4 w-full"
            disabled={seatedCount < 2 || busy}
            onClick={() => guard(() => startExpedition())}
          >
            {seatedCount < 2 ? `최소 2명 필요 (${seatedCount}/${MAX_SEATS})` : '탐사 시작'}
          </Button>
          <Button
            variant="ghost"
            className="mt-2 w-full"
            onClick={() => guard(async () => { await leaveParty(game.playerId!); navigate('/recess'); })}
          >
            나가기
          </Button>
        </Card>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="relative flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <PaperTexture />
        <Card className="w-full max-w-xs">
          <p className="font-gothic text-2xl text-ink-black">🌲 금지된 숲</p>
          <p className="mt-2 text-sm text-ink-700/70">이미 다른 파티가 탐사를 진행하고 있습니다.</p>
          <Button className="mt-4 w-full" onClick={() => navigate('/recess')}>휴게시간으로 돌아가기</Button>
        </Card>
      </div>
    );
  }

  // ---------- cleared / failed ----------
  if (party.status === 'cleared' || party.status === 'failed') {
    const cleared = party.status === 'cleared';
    const result = party.result;
    return (
      <div className="relative min-h-svh px-4 py-8">
        <PaperTexture />
        <div className="mx-auto flex max-w-md flex-col gap-3">
          <Card>
            <p className="font-gothic text-2xl text-ink-black">🌲 금지된 숲</p>
            <p className={`mt-1 font-gothic text-3xl ${cleared ? 'text-seal-600' : 'text-ink-700/60'}`}>{cleared ? '탐사 클리어!' : '탐사 실패'}</p>
            {result && (
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-ink-700/80">
                <p>진행 단계: {result.stagesCleared}/{TOTAL_STAGES}</p>
                <p>처치한 몬스터: {result.monstersDefeated}</p>
                <p>사용한 주문: {result.spellsCast}</p>
                <p>치유량: {result.healingDone}</p>
                <p>받은 피해: {result.damageTaken}</p>
                <p>보너스 획득: {result.bonusesGained}</p>
                {result.bossName && <p className="col-span-2">보스: {result.bossName}</p>}
              </div>
            )}
            {cleared && <p className="mt-3 text-xs text-seal-600">보상: 최대 HP 증가 · 스킬 포인트 지급</p>}
          </Card>
          {me && <SkillPanel player={me} onUpgrade={(spellId) => guard(() => upgradeSpell(game.playerId!, spellId))} />}
          <Button onClick={() => guard(async () => { await leaveExpedition(); navigate('/recess'); })}>확인하고 나가기</Button>
        </div>
      </div>
    );
  }

  // ---------- exploring ----------
  if (party.status === 'exploring' && party.paths) {
    return (
      <div className="relative min-h-svh px-4 py-8">
        <PaperTexture />
        <div className="mx-auto flex max-w-md flex-col gap-3">
          <Card>
            <div className="flex items-center justify-between">
              <p className="font-gothic text-xl text-ink-black">🌲 금지된 숲 탐사</p>
              <p className="font-mono text-sm font-bold text-seal-600">{party.stage} / {TOTAL_STAGES}</p>
            </div>
          </Card>
          <div className="flex flex-col gap-1.5">
            {party.seats.filter((p): p is Player => !!p).map((p) => (
              <PlayerCard key={p.id} player={p} isActing={false} targetable={false} />
            ))}
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-ink-700/80">갈림길을 선택하세요</p>
            <div className="flex flex-col gap-2">
              {party.paths.map((choice, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={busy}
                  onClick={() => guard(() => choosePath(i))}
                  className="text-left"
                >
                  <Card className="hover:border-seal-500/40">
                    <p className="font-serif-kr font-semibold text-ink-900">{['①', '②', '③'][i]} {choice.label}</p>
                    {choice.revealedCategory && <p className="mt-0.5 text-[10px] text-ink-500/60">단서: {choice.revealedCategory}</p>}
                  </Card>
                </button>
              ))}
            </div>
          </div>
          {me && <SkillPanel player={me} onUpgrade={(spellId) => guard(() => upgradeSpell(game.playerId!, spellId))} />}
          <button
            type="button"
            className="self-center text-xs text-ink-500/40 underline-offset-2 hover:text-ink-700 hover:underline"
            onClick={() => navigate('/recess')}
          >
            (숲에 남은 채로) 잠시 나가기
          </button>
        </div>
      </div>
    );
  }

  // ---------- event reveal ----------
  if (party.status === 'event' && party.currentEventId) {
    const event = eventById(party.currentEventId);
    const recentLogs = party.log.filter((l) => l.stage === party.stage).slice(-4);
    return (
      <div className="relative flex min-h-svh flex-col items-center justify-center gap-4 px-6">
        <PaperTexture />
        <Card className="w-full max-w-xs text-center">
          <p className="font-mono text-[11px] tracking-wide text-seal-600">🌙 이벤트 발생</p>
          <p className="mt-2 font-gothic text-xl text-ink-black">{event.title}</p>
          <p className="mt-1 text-sm text-ink-700/80">{event.description}</p>
          <div className="mt-3 flex flex-col gap-1 text-left">
            {recentLogs.map((l, i) => (
              <p key={i} className="text-xs text-ink-700/70">{l.text}</p>
            ))}
          </div>
          <Button className="mt-4 w-full" disabled={busy} onClick={() => guard(() => confirmEvent())}>확인</Button>
        </Card>
      </div>
    );
  }

  // ---------- combat ----------
  if (party.status === 'combat' && party.combat) {
    const combat = party.combat;
    const actingId = currentActingPlayerId(party);
    const isMyTurn = actingId === game.playerId;
    const aliveMonsters = combat.monsters.filter((m) => m.hp > 0);

    function cancelTargeting() {
      setTargetMode(null);
    }

    async function cast(spell: Spell, targetMonsterIndex?: number, targetPlayerId?: string) {
      setTargetMode(null);
      await guard(() => submitCombatAction(game.playerId!, { kind: 'spell', spellId: spell.id, targetMonsterIndex, targetPlayerId }));
    }

    function onSpellClick(spell: Spell) {
      if (spell.category === 'attack') {
        setTargetMode({ spell });
        return;
      }
      if (spell.category === 'heal') {
        setTargetMode({ spell });
        return;
      }
      cast(spell);
    }

    return (
      <div className="relative min-h-svh px-4 py-6">
        <PaperTexture />
        <div className="mx-auto flex max-w-md flex-col gap-3">
          <Card>
            <p className="font-gothic text-xl text-ink-black">{combat.isBoss ? '⚔️ 보스 전투' : '⚔️ 전투'}</p>
            <p className="mt-0.5 text-xs text-ink-500/60">{party.stage}단계 · {combat.round}라운드</p>
          </Card>

          <div className="flex flex-col gap-1.5">
            {aliveMonsters.map((m) => {
              const realIndex = combat.monsters.indexOf(m);
              return (
                <MonsterCard
                  key={realIndex}
                  name={m.name}
                  hp={m.hp}
                  maxHp={m.maxHp}
                  defenseDC={m.defenseDC}
                  statusEffects={m.statusEffects}
                  shield={m.shield}
                  targetable={isMyTurn && targetMode?.spell.category === 'attack'}
                  onTarget={() => targetMode && cast(targetMode.spell, realIndex)}
                />
              );
            })}
          </div>

          <div className="flex flex-col gap-1.5">
            {party.seats.filter((p): p is Player => !!p).map((p) => (
              <PlayerCard
                key={p.id}
                player={p}
                isActing={p.id === actingId}
                targetable={isMyTurn && targetMode?.spell.category === 'heal'}
                onTarget={() => targetMode && cast(targetMode.spell, undefined, p.id)}
              />
            ))}
          </div>

          {isMyTurn ? (
            targetMode ? (
              <Card className="flex items-center justify-between">
                <p className="text-sm font-bold text-ink-900">{targetMode.spell.name} — 대상을 선택하세요</p>
                <button type="button" onClick={cancelTargeting} className="text-xs text-ink-500/60 underline">취소</button>
              </Card>
            ) : (
              <Card className="flex flex-col gap-2.5">
                <p className="font-gothic text-lg text-ink-black">내 턴 — 주문/행동 선택</p>
                {CATEGORY_SECTION.map(({ category, label }) => {
                  const spells = SPELLS.filter((s) => s.category === category);
                  return (
                    <div key={category}>
                      <p className="mb-1 text-[10px] font-bold text-ink-500/60">{label}</p>
                      <div className="grid grid-cols-1 gap-1">
                        {spells.map((s) => {
                          const level = me.spellLevels[s.id] ?? 0;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              disabled={busy}
                              onClick={() => onSpellClick(s)}
                              className="flex items-center justify-between rounded-lg border border-ink-700/15 bg-paper-100/60 px-2.5 py-1.5 text-left hover:border-seal-500/40"
                            >
                              <span className="text-xs font-bold text-ink-900">{s.name} <span className="text-[10px] font-normal text-ink-500/60">Lv.{level}</span></span>
                              <span className="font-mono text-[10px] text-ink-500/60">DC{spellDcAtLevel(s, level)} · 위력{spellPowerAtLevel(s, level)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {me.items.length > 0 && (
                  <div>
                    <p className="mb-1 text-[10px] font-bold text-ink-500/60">아이템</p>
                    <div className="flex flex-wrap gap-1.5">
                      {me.items.map((item, i) => (
                        <button
                          key={i}
                          type="button"
                          disabled={busy}
                          onClick={() => guard(() => submitCombatAction(game.playerId!, { kind: 'item', itemName: item }))}
                          className="rounded-full bg-ink-black px-2.5 py-1 text-[10px] font-bold text-paper-50"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => guard(() => submitCombatAction(game.playerId!, { kind: 'pass' }))}
                  className="self-center text-xs text-ink-500/50 underline-offset-2 hover:text-ink-700 hover:underline"
                >
                  턴 넘기기
                </button>
              </Card>
            )
          ) : (
            <Card className="text-center text-sm text-ink-700/70">
              {actingId ? `${party.seats.find((p) => p?.id === actingId)?.nickname ?? ''}님의 턴을 기다리는 중...` : '전투가 진행되는 중...'}
            </Card>
          )}

          <div className="rounded-lg border border-ink-700/15 bg-paper-50 px-3 py-2">
            <p className="mb-1 font-mono text-[10px] font-bold text-ink-500/60">전투 기록</p>
            <div className="flex max-h-28 flex-col-reverse gap-0.5 overflow-y-auto text-[11px] text-ink-700/80">
              {party.log.slice(-8).reverse().map((l, i) => (
                <p key={i}>{l.text}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-3 px-6 text-center">
      <PaperTexture />
      <p className="text-sm text-ink-700/70">숲을 불러오는 중...</p>
    </div>
  );
}
