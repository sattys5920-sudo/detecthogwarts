import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import ForestChatFeed from '../components/ForestChatFeed';
import PaperTexture from '../components/PaperTexture';
import { useGame } from '../context/GameContext';
import {
  castVote,
  confirmEvent,
  ForestFullError,
  forceResolveVoteTimeout,
  joinParty,
  leaveExpedition,
  leaveParty,
  resolveTie,
  setReady,
  startExpedition,
  submitCombatAction,
  subscribeParty,
  upgradeSpell,
} from '../firebase/forest';
import { allSeatsReady, currentActingPlayerId, MAX_SEATS, TOTAL_STAGES, VOTE_DURATION_MS } from '../game/forest/engine';
import { eventById } from '../game/forest/events';
import { maxMpFor, SPELLS, spellDcAtLevel, spellMpCost, spellPowerAtLevel } from '../game/forest/spells';
import type { ForestParty, LogEntry, Player, Spell, SpellCategory } from '../game/forest/types';

const VALID_ROOMS = ['a', 'b'];
const ROOM_LABEL: Record<string, string> = { a: 'A', b: 'B' };
const VOTE_DURATION_SEC = VOTE_DURATION_MS / 1000;

const STATUS_LABEL_TEXT: Record<ForestParty['status'], string> = {
  lobby: '대기 중', exploring: '탐사 중', event: '이벤트', combat: '전투', cleared: '클리어', failed: '실패',
};

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
  const maxMp = maxMpFor(player.intelligence);
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
      <HpBar hp={player.mp} maxHp={maxMp} colorClass="bg-ink-indigo" />
      <p className="font-mono text-[10px] text-ink-500/70">MP {player.mp}/{maxMp}</p>
      <p className="font-mono text-[10px] text-ink-500/50">지능 {player.intelligence} · 주문력 {player.spellPower} · 방어력 {player.defense}</p>
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

function ForestHeader({ roomLabel, stage, status, voteState }: {
  roomLabel: string; stage: number; status: ForestParty['status']; voteState?: 'voting' | 'tie';
}) {
  const label = voteState === 'tie' ? '동률 · 파티장 선택' : voteState === 'voting' ? '투표 중' : STATUS_LABEL_TEXT[status];
  return (
    <div className="flex items-center justify-between rounded-lg border border-ink-700/15 bg-paper-100/70 px-3 py-2">
      <p className="font-gothic text-base text-ink-black">🌲 금지된 숲 {roomLabel}</p>
      <div className="text-right">
        <p className="font-mono text-xs font-bold text-seal-600">탐사 {String(stage).padStart(2, '0')} / {TOTAL_STAGES}</p>
        <p className="text-[10px] text-ink-500/60">{label}</p>
      </div>
    </div>
  );
}

function TurnOrderStrip({ party }: { party: ForestParty }) {
  const combat = party.combat;
  if (!combat) return null;
  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-ink-700/15 bg-paper-50 px-2 py-1.5">
      <span className="flex-none font-mono text-[9px] font-bold text-ink-500/50">순서</span>
      {combat.turnOrder.map((key, i) => {
        const [kind, idRaw] = key.split(':');
        let label = '?';
        let alive = true;
        if (kind === 'player') {
          const p = party.seats.find((s) => s?.id === idRaw);
          label = p?.nickname ?? '?';
          alive = !!p && p.hp > 0 && !p.downed;
        } else {
          const m = combat.monsters[Number(idRaw)];
          label = m?.name ?? '?';
          alive = !!m && m.hp > 0;
        }
        const isCurrent = i === combat.turnIndex;
        return (
          <span
            key={`${key}-${i}`}
            className={`flex-none rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isCurrent ? 'bg-seal-600 text-paper-50' : alive ? 'bg-paper-200 text-ink-700' : 'bg-paper-200/40 text-ink-500/30 line-through'
            }`}
          >
            {kind === 'player' ? '🧙' : '👹'} {label}
          </span>
        );
      })}
    </div>
  );
}

function SidePanel({ tab, onTabChange, roomId, log, myId, myNickname, statusContent }: {
  tab: 'chat' | 'party';
  onTabChange: (t: 'chat' | 'party') => void;
  roomId: string;
  log: LogEntry[];
  myId: string;
  myNickname: string;
  statusContent: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => onTabChange('chat')}
          className={`flex-1 rounded-full px-3 py-1.5 text-xs font-bold ${tab === 'chat' ? 'bg-ink-black text-paper-50' : 'bg-paper-200 text-ink-700'}`}
        >
          💬 채팅
        </button>
        <button
          type="button"
          onClick={() => onTabChange('party')}
          className={`flex-1 rounded-full px-3 py-1.5 text-xs font-bold ${tab === 'party' ? 'bg-ink-black text-paper-50' : 'bg-paper-200 text-ink-700'}`}
        >
          👥 파티
        </button>
      </div>
      {tab === 'chat' ? (
        <ForestChatFeed roomId={roomId} log={log} myId={myId} myNickname={myNickname} />
      ) : (
        <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto">{statusContent}</div>
      )}
    </div>
  );
}

export default function ForestPage() {
  const game = useGame();
  const navigate = useNavigate();
  const { roomId = '' } = useParams<{ roomId: string }>();
  const [party, setParty] = useState<ForestParty | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [targetMode, setTargetMode] = useState<{ spell: Spell } | null>(null);
  const [pendingAction, setPendingAction] = useState<{ spell: Spell; targetMonsterIndex?: number; targetPlayerId?: string; targetLabel: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'party'>('chat');
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [voteReveal, setVoteReveal] = useState(false);
  const [combatIntro, setCombatIntro] = useState(false);
  const lastSeenVoteResultRef = useRef<string | null>(null);
  const combatBannerShownRef = useRef(false);
  const roomLabel = ROOM_LABEL[roomId] ?? '';

  useEffect(() => {
    if (!VALID_ROOMS.includes(roomId)) return;
    return subscribeParty(roomId, setParty);
  }, [roomId]);

  useEffect(() => {
    if (!game.playerId || !VALID_ROOMS.includes(roomId)) return;
    joinParty(roomId, game.playerId, game.nickname).catch((e) => {
      setJoinError(e instanceof ForestFullError ? e.message : '입장에 실패했습니다. 다시 시도해 주세요.');
    });
  }, [roomId, game.playerId, game.nickname]);

  useEffect(() => {
    if (!party || party.status !== 'cleared' || !party.seats.some((p) => p?.id === game.playerId)) return;
    const key = `arcanum-forest-reward-${roomId}-${party.updatedAt}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, 'true');
    game.adjustStat('spellPower', 3);
  }, [party, roomId, game]);

  // Ticks once a second while a vote is open so the countdown display stays live.
  useEffect(() => {
    if (!party || party.status !== 'exploring' || !party.votingEndsAt || party.voteTieOptions) return;
    const id = setInterval(() => setNowTick(Date.now()), 250);
    return () => clearInterval(id);
  }, [party?.status, party?.votingEndsAt, party?.voteTieOptions]);

  // Once the vote's countdown elapses, any client present calls the timeout resolver — a no-op if it's already resolved.
  useEffect(() => {
    if (!party || party.status !== 'exploring' || !party.votingEndsAt || party.voteTieOptions) return;
    const msLeft = party.votingEndsAt - Date.now();
    const t = setTimeout(() => {
      forceResolveVoteTimeout(roomId).catch(() => {});
    }, Math.max(0, msLeft) + 50);
    return () => clearTimeout(t);
  }, [roomId, party?.status, party?.votingEndsAt, party?.voteTieOptions]);

  // Shows a brief "투표 결과" overlay whenever a new vote resolution appears in party state.
  useEffect(() => {
    if (!party?.lastVoteResult) return;
    const key = `${party.stage}:${party.lastVoteResult.chosenIndex}:${party.lastVoteResult.pathLabel}`;
    if (lastSeenVoteResultRef.current === key) return;
    lastSeenVoteResultRef.current = key;
    setVoteReveal(true);
    const t = setTimeout(() => setVoteReveal(false), 1400);
    return () => clearTimeout(t);
  }, [party?.lastVoteResult, party?.stage]);

  // Shows a brief "몬스터가 나타났다!" banner on entering combat, after any vote-result overlay finishes.
  useEffect(() => {
    if (!party) return;
    if (party.status !== 'combat') {
      combatBannerShownRef.current = false;
      return;
    }
    if (combatBannerShownRef.current || voteReveal) return;
    combatBannerShownRef.current = true;
    setCombatIntro(true);
    const t = setTimeout(() => setCombatIntro(false), 1100);
    return () => clearTimeout(t);
  }, [party?.status, voteReveal]);

  if (!game.hasEntered) return <Navigate to="/" replace />;
  if (!VALID_ROOMS.includes(roomId)) return <Navigate to="/recess" replace />;
  if (joinError) {
    return (
      <div className="relative flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <PaperTexture />
        <Card className="w-full max-w-xs">
          <p className="font-gothic text-2xl text-ink-black">🌲 금지된 숲 {roomLabel}</p>
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
    setActionError(null);
    try {
      await fn();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : '요청을 처리하지 못했습니다. 다시 시도해 주세요.');
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
    const ready = allSeatsReady(party);
    const meReady = me.ready;
    return (
      <div className="relative flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <PaperTexture />
        <Card className="w-full max-w-xs">
          <p className="font-gothic text-2xl text-ink-black">🌲 금지된 숲 {roomLabel}</p>
          <p className="mt-1 text-sm text-ink-700/70">2~4인 협동 탐사. 모두 준비를 마치면 시작할 수 있어요.</p>
          <div className="mt-4 flex flex-col gap-1.5 text-left">
            {Array.from({ length: MAX_SEATS }).map((_, i) => {
              const seat = party.seats[i];
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${seat ? 'border-seal-500/40 bg-paper-100 font-bold text-ink-900' : 'border-dashed border-ink-700/20 text-ink-500/50'}`}
                >
                  <span>{seat ? seat.nickname : '빈 자리'}</span>
                  {seat && (
                    <span className={`font-mono text-[10px] font-bold ${seat.ready ? 'text-seal-600' : 'text-ink-500/40'}`}>
                      {seat.ready ? '준비 완료' : '대기 중'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <Button
            variant={meReady ? 'ghost' : 'primary'}
            className="mt-4 w-full"
            disabled={busy}
            onClick={() => guard(() => setReady(roomId, game.playerId!, !meReady))}
          >
            {meReady ? '준비 취소' : '탐사 준비 완료'}
          </Button>
          <Button
            className="mt-2 w-full"
            disabled={!ready || busy}
            onClick={() => guard(() => startExpedition(roomId))}
          >
            {seatedCount < 2 ? `최소 2명 필요 (${seatedCount}/${MAX_SEATS})` : ready ? '탐사 가기' : '전원 준비 대기 중'}
          </Button>
          {actionError && <p className="mt-2 text-xs font-bold text-seal-600">{actionError}</p>}
          <Button
            variant="ghost"
            className="mt-2 w-full"
            onClick={() => guard(async () => { await leaveParty(roomId, game.playerId!); navigate('/recess'); })}
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
          <p className="font-gothic text-2xl text-ink-black">🌲 금지된 숲 {roomLabel}</p>
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
            <p className="font-gothic text-2xl text-ink-black">🌲 금지된 숲 {roomLabel}</p>
            <p className={`mt-1 font-gothic text-3xl ${cleared ? 'text-seal-600' : 'text-ink-700/60'}`}>{cleared ? '✦ VICTORY ✦' : '☠ DEFEAT'}</p>
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
            {cleared && <p className="mt-3 text-xs text-seal-600">파티 전원 주문 공격력 +3</p>}
          </Card>
          {me && <SkillPanel player={me} onUpgrade={(spellId) => guard(() => upgradeSpell(roomId, game.playerId!, spellId))} />}
          <Button onClick={() => guard(async () => { await leaveExpedition(roomId); navigate('/recess'); })}>
            {cleared ? '계속 탐사' : '탐사 종료'}
          </Button>
        </div>
      </div>
    );
  }

  // ---------- exploring ----------
  if (party.status === 'exploring' && party.paths) {
    const paths = party.paths;
    const seatedIds = party.seats.filter((p): p is Player => !!p).map((p) => p.id);
    const myVote = game.playerId ? party.votes[game.playerId] : undefined;
    const votedCount = seatedIds.filter((id) => party.votes[id] !== undefined).length;
    const secondsLeft = party.votingEndsAt ? Math.max(0, Math.ceil((party.votingEndsAt - nowTick) / 1000)) : null;
    const isHost = game.playerId === party.hostId;

    if (voteReveal && party.lastVoteResult) {
      const r = party.lastVoteResult;
      return (
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
          <PaperTexture />
          <Card className="w-full max-w-xs">
            <p className="font-mono text-[11px] tracking-wide text-ink-500/60">투표 결과</p>
            <div className="mt-3 flex flex-col gap-1.5 text-left">
              {r.tally.map((t, i) => (
                <div
                  key={i}
                  className={`rounded-lg border px-3 py-2 text-sm ${i === r.chosenIndex ? 'border-seal-500 bg-seal-600/10 font-bold text-seal-600' : 'border-ink-700/15 text-ink-700/70'}`}
                >
                  {['①', '②', '③'][i]} {t.label} · {t.count}표
                </div>
              ))}
            </div>
            <p className="mt-4 font-gothic text-lg text-ink-black">✦ {r.pathLabel}(으)로 이동합니다 ✦</p>
          </Card>
        </div>
      );
    }

    const statusContent = party.seats
      .filter((p): p is Player => !!p)
      .map((p) => <PlayerCard key={p.id} player={p} isActing={false} targetable={false} />);

    return (
      <div className="relative min-h-svh px-4 py-6">
        <PaperTexture />
        <div className="mx-auto flex max-w-md flex-col gap-3">
          <ForestHeader roomLabel={roomLabel} stage={party.stage} status={party.status} voteState={party.voteTieOptions ? 'tie' : 'voting'} />

          {party.voteTieOptions ? (
            <Card className="flex flex-col gap-2.5 text-center">
              <p className="text-sm font-bold text-seal-600">⚠️ 투표가 동률입니다</p>
              <p className="text-xs text-ink-700/70">
                {isHost
                  ? '파티장으로서 최종 선택을 해주세요.'
                  : `파티장(${party.seats.find((p) => p?.id === party.hostId)?.nickname ?? ''})이 최종 선택을 기다리는 중...`}
              </p>
              <div className="flex flex-col gap-2">
                {party.voteTieOptions.map((idx) => (
                  <Button key={idx} disabled={!isHost || busy} onClick={() => guard(() => resolveTie(roomId, game.playerId!, idx))} className="w-full">
                    {['①', '②', '③'][idx]} {paths[idx].label}
                  </Button>
                ))}
              </div>
              {actionError && <p className="text-xs font-bold text-seal-600">{actionError}</p>}
            </Card>
          ) : (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-ink-700/80">갈림길 투표</p>
                <p className="font-mono text-[10px] text-ink-500/60">{votedCount}/{seatedIds.length}명 · {secondsLeft ?? 0}초</p>
              </div>
              {secondsLeft !== null && (
                <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-paper-200">
                  <div
                    className="h-full bg-seal-600 transition-all duration-1000 ease-linear"
                    style={{ width: `${Math.min(100, (secondsLeft / VOTE_DURATION_SEC) * 100)}%` }}
                  />
                </div>
              )}
              <div className="flex flex-col gap-2">
                {paths.map((choice, i) => {
                  const voterNames = seatedIds
                    .filter((id) => party.votes[id] === i)
                    .map((id) => party.seats.find((s) => s?.id === id)?.nickname)
                    .filter((n): n is string => !!n);
                  const isMine = myVote === i;
                  return (
                    <button key={i} type="button" disabled={busy} onClick={() => guard(() => castVote(roomId, game.playerId!, i))} className="text-left">
                      <Card className={isMine ? 'border-seal-500' : 'hover:border-seal-500/40'}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-serif-kr font-semibold text-ink-900">{['①', '②', '③'][i]} {choice.label}</p>
                            {choice.revealedCategory && <p className="mt-0.5 text-[10px] text-ink-500/60">단서: {choice.revealedCategory}</p>}
                          </div>
                          {voterNames.length > 0 && <span className="flex-none font-mono text-[10px] font-bold text-seal-600">{voterNames.length}표</span>}
                        </div>
                        {voterNames.length > 0 && <p className="mt-1 truncate text-[10px] text-ink-500/60">{voterNames.join(', ')}</p>}
                      </Card>
                    </button>
                  );
                })}
              </div>
              {actionError && <p className="mt-2 text-xs font-bold text-seal-600">{actionError}</p>}
            </div>
          )}

          {me && <SkillPanel player={me} onUpgrade={(spellId) => guard(() => upgradeSpell(roomId, game.playerId!, spellId))} />}

          <SidePanel
            tab={sidebarTab}
            onTabChange={setSidebarTab}
            roomId={roomId}
            log={party.log}
            myId={game.playerId ?? ''}
            myNickname={me?.nickname ?? game.nickname}
            statusContent={statusContent}
          />

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
    if (voteReveal && party.lastVoteResult) {
      const r = party.lastVoteResult;
      return (
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
          <PaperTexture />
          <Card className="w-full max-w-xs">
            <p className="font-mono text-[11px] tracking-wide text-ink-500/60">투표 결과</p>
            <div className="mt-3 flex flex-col gap-1.5 text-left">
              {r.tally.map((t, i) => (
                <div
                  key={i}
                  className={`rounded-lg border px-3 py-2 text-sm ${i === r.chosenIndex ? 'border-seal-500 bg-seal-600/10 font-bold text-seal-600' : 'border-ink-700/15 text-ink-700/70'}`}
                >
                  {['①', '②', '③'][i]} {t.label} · {t.count}표
                </div>
              ))}
            </div>
            <p className="mt-4 font-gothic text-lg text-ink-black">✦ {r.pathLabel}(으)로 이동합니다 ✦</p>
          </Card>
        </div>
      );
    }

    const event = eventById(party.currentEventId);
    const recentLogs = party.log.filter((l) => l.stage === party.stage).slice(-4);
    const statusContent = party.seats
      .filter((p): p is Player => !!p)
      .map((p) => <PlayerCard key={p.id} player={p} isActing={false} targetable={false} />);

    return (
      <div className="relative min-h-svh px-4 py-6">
        <PaperTexture />
        <div className="mx-auto flex max-w-md flex-col gap-3">
          <ForestHeader roomLabel={roomLabel} stage={party.stage} status={party.status} />
          <Card className="text-center">
            <p className="font-mono text-[11px] tracking-wide text-seal-600">🌙 이벤트 발생</p>
            <p className="mt-2 font-gothic text-xl text-ink-black">{event.title}</p>
            <p className="mt-1 text-sm text-ink-700/80">{event.description}</p>
            <div className="mt-3 flex flex-col gap-1 text-left">
              {recentLogs.map((l, i) => (
                <p key={i} className="text-xs text-ink-700/70">{l.text}</p>
              ))}
            </div>
            <Button className="mt-4 w-full" disabled={busy} onClick={() => guard(() => confirmEvent(roomId))}>확인</Button>
          </Card>
          <SidePanel
            tab={sidebarTab}
            onTabChange={setSidebarTab}
            roomId={roomId}
            log={[]}
            myId={game.playerId ?? ''}
            myNickname={me?.nickname ?? game.nickname}
            statusContent={statusContent}
          />
        </div>
      </div>
    );
  }

  // ---------- combat ----------
  if (party.status === 'combat' && party.combat) {
    if (combatIntro) {
      return (
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-3 px-6 text-center">
          <PaperTexture />
          <p className="font-gothic text-2xl text-seal-600">⚠️ 몬스터가 나타났다!</p>
        </div>
      );
    }

    const combat = party.combat;
    const actingId = currentActingPlayerId(party);
    const isMyTurn = actingId === game.playerId;
    const aliveMonsters = combat.monsters.filter((m) => m.hp > 0);
    const statusContent = party.seats
      .filter((p): p is Player => !!p)
      .map((p) => <PlayerCard key={p.id} player={p} isActing={p.id === actingId} targetable={false} />);

    function cancelTargeting() {
      setTargetMode(null);
    }

    function cancelPending() {
      setPendingAction(null);
    }

    function pickTarget(targetMonsterIndex: number | undefined, targetPlayerId: string | undefined, targetLabel: string) {
      if (!targetMode) return;
      setPendingAction({ spell: targetMode.spell, targetMonsterIndex, targetPlayerId, targetLabel });
      setTargetMode(null);
    }

    function confirmPending() {
      if (!pendingAction) return;
      const { spell, targetMonsterIndex, targetPlayerId } = pendingAction;
      setPendingAction(null);
      guard(() => submitCombatAction(roomId, game.playerId!, { kind: 'spell', spellId: spell.id, targetMonsterIndex, targetPlayerId }));
    }

    function onSpellClick(spell: Spell) {
      if (spell.category === 'attack' || spell.category === 'heal') {
        setTargetMode({ spell });
        return;
      }
      guard(() => submitCombatAction(roomId, game.playerId!, { kind: 'spell', spellId: spell.id }));
    }

    return (
      <div className="relative min-h-svh px-4 py-6">
        <PaperTexture />
        <div className="mx-auto flex max-w-md flex-col gap-3">
          <ForestHeader roomLabel={roomLabel} stage={party.stage} status={party.status} />

          <Card>
            <div className="flex items-center justify-between">
              <p className="font-gothic text-lg text-ink-black">{combat.isBoss ? '⚔️ 보스 전투' : '⚔️ 전투'}</p>
              <p className="font-mono text-xs text-ink-500/60">ROUND {combat.round}</p>
            </div>
          </Card>

          <TurnOrderStrip party={party} />

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
                  onTarget={() => pickTarget(realIndex, undefined, m.name)}
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
                onTarget={() => pickTarget(undefined, p.id, p.nickname)}
              />
            ))}
          </div>

          {isMyTurn ? (
            pendingAction ? (
              <Card className="flex flex-col gap-2 border-seal-500">
                <p className="text-sm font-bold text-ink-900">
                  {pendingAction.spell.category === 'attack' ? '⚔️' : '✨'} {pendingAction.spell.name} → {pendingAction.targetLabel}
                </p>
                <div className="flex gap-2">
                  <Button className="flex-1" disabled={busy} onClick={confirmPending}>행동 확정</Button>
                  <Button variant="ghost" className="flex-1" onClick={cancelPending}>취소</Button>
                </div>
              </Card>
            ) : targetMode ? (
              <Card className="flex items-center justify-between">
                <p className="text-sm font-bold text-ink-900">{targetMode.spell.name} — 대상을 선택하세요</p>
                <button type="button" onClick={cancelTargeting} className="text-xs text-ink-500/60 underline">취소</button>
              </Card>
            ) : (
              <Card className="flex flex-col gap-2.5">
                <p className="font-gothic text-lg text-ink-black">내 턴 — 행동 선택</p>
                {CATEGORY_SECTION.map(({ category, label }) => {
                  const spells = SPELLS.filter((s) => s.category === category);
                  return (
                    <div key={category}>
                      <p className="mb-1 text-[10px] font-bold text-ink-500/60">{label}</p>
                      <div className="grid grid-cols-1 gap-1">
                        {spells.map((s) => {
                          const level = me.spellLevels[s.id] ?? 0;
                          const cost = spellMpCost(s, level);
                          const canAfford = me.mp >= cost;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              disabled={busy || !canAfford}
                              onClick={() => onSpellClick(s)}
                              className="flex items-center justify-between rounded-lg border border-ink-700/15 bg-paper-100/60 px-2.5 py-1.5 text-left hover:border-seal-500/40 disabled:opacity-40"
                            >
                              <span className="text-xs font-bold text-ink-900">{s.name} <span className="text-[10px] font-normal text-ink-500/60">Lv.{level}</span></span>
                              <span className="font-mono text-[10px] text-ink-500/60">
                                DC{spellDcAtLevel(s, level)} · 위력{spellPowerAtLevel(s, level)} · <span className={canAfford ? '' : 'text-seal-600'}>MP{cost}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => guard(() => submitCombatAction(roomId, game.playerId!, { kind: 'pass' }))}
                  className="self-center text-xs text-ink-500/50 underline-offset-2 hover:text-ink-700 hover:underline"
                >
                  ⏳ 대기 (턴 넘기기)
                </button>
              </Card>
            )
          ) : (
            <Card className="text-center text-sm text-ink-700/70">
              {actingId ? `${party.seats.find((p) => p?.id === actingId)?.nickname ?? ''}님의 턴을 기다리는 중...` : '전투가 진행되는 중...'}
            </Card>
          )}

          <SidePanel
            tab={sidebarTab}
            onTabChange={setSidebarTab}
            roomId={roomId}
            log={party.log.slice(-15)}
            myId={game.playerId ?? ''}
            myNickname={me.nickname}
            statusContent={statusContent}
          />
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
