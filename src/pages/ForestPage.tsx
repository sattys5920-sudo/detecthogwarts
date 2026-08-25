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
  upgradeSkill,
} from '../firebase/forest';
import { allSeatsReady, CATEGORY_LABEL, currentActingPlayerId, EVENT_TONE, MAX_SEATS, TOTAL_STAGES, VOTE_DURATION_MS } from '../game/forest/engine';
import { eventById } from '../game/forest/events';
import { patronusById } from '../game/forest/patronus';
import { maxMpFor, skillMpCostAtLevel, skillTag, skillValueAtLevel, SKILLS } from '../game/forest/skills';
import type { EventEffect, ForestParty, LogEntry, PatronusDef, Player, SkillDef } from '../game/forest/types';

const VALID_ROOMS = ['a', 'b', 'c'];
const ROOM_LABEL: Record<string, string> = { a: 'A', b: 'B', c: 'C' };
const VOTE_DURATION_SEC = VOTE_DURATION_MS / 1000;

function fmtSec(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const STATUS_LABEL_TEXT: Record<ForestParty['status'], string> = {
  lobby: '대기 중', exploring: '탐사 중', event: '이벤트', combat: '전투', cleared: '클리어', failed: '실패',
};

const STATUS_LABEL: Record<string, string> = {
  burn: '🔥 화상', bleed: '🩸 출혈', stun: '💫 제압', weaken: '⬇️ 약화', vulnerable: '⚠️ 취약', slow: '🐌 둔화',
  poison: '☠️ 중독', daze: '💫 동요', intBoost: '🧠 지능 강화', agiBoost: '🐆 민첩 강화', agiDown: '🐌 민첩 저하',
  critBoost: '✨ 크리티컬 강화', followAttack: '🐦 추가 공격', regenHp: '💚 지속 회복', regenMp: '🔷 MP 회복', charm: '💫 매혹',
};

const TONE_LABEL: Record<'good' | 'bad' | 'risk' | 'neutral', string> = {
  good: '버프', bad: '디버프', risk: '위험한 선택', neutral: '중립',
};

const TONE_STYLE: Record<'good' | 'bad' | 'risk' | 'neutral', string> = {
  good: 'border-seal-500/40 bg-seal-600/10 text-seal-600',
  bad: 'border-ink-700/30 bg-ink-700/10 text-ink-700',
  risk: 'border-gold-500/50 bg-gold-400/15 text-gold-600',
  neutral: 'border-ink-700/15 bg-paper-100 text-ink-700/60',
};

type CombatTab = 'attack' | 'defense' | 'heal' | 'special';

const SKILL_TAB: Record<SkillDef['id'], Exclude<CombatTab, 'special'>> = {
  personalAttack: 'attack', aoeAttack: 'attack',
  personalDefense: 'defense', aoeDefense: 'defense',
  personalHeal: 'heal', aoeHeal: 'heal', personalMpHeal: 'heal', aoeMpHeal: 'heal',
};

const COMBAT_TABS: { key: CombatTab; label: string }[] = [
  { key: 'attack', label: '공격' },
  { key: 'defense', label: '방어' },
  { key: 'heal', label: '회복' },
  { key: 'special', label: '특수' },
];

function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

/** Plain-language breakdown of what an event's effect actually does, for the reveal card. */
function eventEffectLines(effect: EventEffect): string[] {
  const lines: string[] = [];
  if (effect.hp) lines.push(`${effect.targetLowestHp ? '체력이 가장 낮은 동료의 ' : '파티 전원의 '}HP ${signed(effect.hp)}`);
  if (effect.maxHp) lines.push(`파티 전원 최대 HP ${signed(effect.maxHp)}`);
  if (effect.spellPower) lines.push(`파티 전원 주문력 ${signed(effect.spellPower)}`);
  if (effect.agility) lines.push(`파티 전원 민첩 ${signed(effect.agility)}`);
  if (effect.intelligence) lines.push(`파티 전원 지능 ${signed(effect.intelligence)} (MP 최대치도 함께 증가)`);
  if (effect.skillPoints) lines.push(`파티 전원 스킬 포인트 ${signed(effect.skillPoints)}`);
  if (effect.status) lines.push(`${STATUS_LABEL[effect.status.type] ?? effect.status.type} ${effect.status.turns}턴 부여`);
  if (effect.hint) lines.push('다음 갈림길의 정보가 미리 공개됨');
  if (effect.triggersMonster) lines.push('몬스터와 마주칠 수 있음');
  if (effect.triggersEliteMonster) lines.push('강력한 몬스터와 마주침');
  if (effect.triggersTrap) {
    const t = effect.triggersTrap;
    lines.push(`함정 판정 (DC ${t.dc}) — 실패 시 HP ${signed(-t.failHp)}${t.failStatus ? ` + ${STATUS_LABEL[t.failStatus] ?? t.failStatus}` : ''}`);
  }
  if (effect.riskyCheck) {
    const r = effect.riskyCheck;
    lines.push(`위험한 판정 (DC ${r.dc})`);
    const succ = eventEffectLines(r.successBonus).join(', ');
    const fail = eventEffectLines(r.failPenalty).join(', ');
    if (succ) lines.push(`· 성공 시: ${succ}`);
    if (fail) lines.push(`· 실패 시: ${fail}`);
  }
  return lines;
}

type TargetMode = { kind: 'skill'; skill: SkillDef } | { kind: 'patronus'; patronus: PatronusDef };
type PendingAction = TargetMode & { targetMonsterIndex?: number; targetPlayerId?: string; targetLabel: string };

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
      <p className="font-mono text-[10px] text-ink-500/50">지능 {player.intelligence} · 주문력 {player.spellPower} · 민첩 {player.agility}</p>
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

function SkillPanel({ player, onUpgrade }: { player: Player; onUpgrade: (skillId: SkillDef['id']) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="flex flex-col gap-2">
      <button type="button" className="flex items-center justify-between" onClick={() => setOpen((v) => !v)}>
        <p className="font-gothic text-lg text-ink-black">내 스킬 강화</p>
        <span className="font-mono text-xs text-seal-600">보유 포인트 {player.skillPoints}{open ? ' ▲' : ' ▼'}</span>
      </button>
      {open && (
        <div className="grid grid-cols-1 gap-1.5">
          {SKILLS.map((s) => {
            const level = player.skillLevels[s.id] ?? 0;
            return (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-ink-700/10 bg-paper-100/50 px-2.5 py-1.5">
                <div>
                  <p className="text-xs font-bold text-ink-900">{s.name} <span className="font-mono text-[10px] text-ink-500/60">Lv.{level} · ({skillTag(s)})</span></p>
                  <p className="text-[10px] text-ink-500/60">위력 {skillValueAtLevel(s, level)} · MP {skillMpCostAtLevel(s, level)}</p>
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
  const [targetMode, setTargetMode] = useState<TargetMode | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'party'>('chat');
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [voteReveal, setVoteReveal] = useState(false);
  const [combatIntro, setCombatIntro] = useState(false);
  const [combatTab, setCombatTab] = useState<CombatTab>('attack');
  const lastSeenVoteResultRef = useRef<string | null>(null);
  const combatBannerShownRef = useRef(false);
  const roomLabel = ROOM_LABEL[roomId] ?? '';

  useEffect(() => {
    if (!VALID_ROOMS.includes(roomId)) return;
    return subscribeParty(roomId, setParty);
  }, [roomId]);

  useEffect(() => {
    if (!game.playerId || !VALID_ROOMS.includes(roomId)) return;
    joinParty(roomId, game.playerId, game.nickname, game.patronus).catch((e) => {
      setJoinError(e instanceof ForestFullError ? e.message : '입장에 실패했습니다. 다시 시도해 주세요.');
    });
  }, [roomId, game.playerId, game.nickname, game.patronus]);

  useEffect(() => {
    if (!party || party.status !== 'cleared' || !party.seats.some((p) => p?.id === game.playerId)) return;
    const key = `arcanum-forest-reward-${roomId}-${party.updatedAt}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, 'true');
    game.adjustStat('intelligence', 5);
    game.adjustStat('spellPower', 5);
    game.adjustStat('agility', 5);
    game.growMaxStat('maxStamina', 5);
    game.growMaxStat('maxHp', 5);
    game.growMaxStat('maxMp', 5);
  }, [party, roomId, game]);

  useEffect(() => {
    if (!party || (party.status !== 'cleared' && party.status !== 'failed') || !party.seats.some((p) => p?.id === game.playerId)) return;
    const key = `arcanum-forest-stamina-${roomId}-${party.updatedAt}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, 'true');
    game.adjustStat('stamina', -10);
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
  // The trigger and its auto-hide timer are kept in separate effects: if they were combined, a
  // `voteReveal` flip landing in the same commit as the combat-intro trigger (which happens when a
  // monster event resolves straight out of a vote) would cancel the just-armed hide timer via this
  // effect's own cleanup, and the guard below would then block it from ever being rescheduled —
  // leaving the banner stuck on screen forever.
  useEffect(() => {
    if (!party) return;
    if (party.status !== 'combat') {
      combatBannerShownRef.current = false;
      return;
    }
    if (combatBannerShownRef.current || voteReveal) return;
    combatBannerShownRef.current = true;
    setCombatIntro(true);
  }, [party?.status, voteReveal]);

  useEffect(() => {
    if (!combatIntro) return;
    const t = setTimeout(() => setCombatIntro(false), 1100);
    return () => clearTimeout(t);
  }, [combatIntro]);

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
            {cleared && (
              <p className="mt-3 text-xs text-seal-600">
                파티 전원 지능 +5 · 주문 공격력 +5 · 민첩 +5 · 최대 스태미나 +5 · 최대 체력 +5 · 최대 MP +5, 스킬 포인트 3개 획득 (바로 사용 가능)
              </p>
            )}
          </Card>
          {me && <SkillPanel player={me} onUpgrade={(skillId) => guard(() => upgradeSkill(roomId, game.playerId!, skillId))} />}
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
                <p className="font-mono text-[10px] text-ink-500/60">{votedCount}/{seatedIds.length}명 · {fmtSec(secondsLeft ?? 0)}</p>
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

          {me && <SkillPanel player={me} onUpgrade={(skillId) => guard(() => upgradeSkill(roomId, game.playerId!, skillId))} />}

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
    const tone = EVENT_TONE[event.category];
    const lines = eventEffectLines(event.effect);
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
            <div className="mt-2.5 flex items-center justify-center gap-1.5">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${TONE_STYLE[tone]}`}>{TONE_LABEL[tone]}</span>
              <span className="rounded-full border border-ink-700/15 bg-paper-100 px-2 py-0.5 text-[10px] text-ink-700/70">{CATEGORY_LABEL[event.category]}</span>
            </div>
            {lines.length > 0 && (
              <div className="mt-2 flex flex-col gap-1 rounded-lg border border-ink-700/10 bg-paper-100/60 px-3 py-2 text-left">
                {lines.map((line, i) => (
                  <p key={i} className="text-xs text-ink-700/80">· {line}</p>
                ))}
              </div>
            )}
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
    const targetKind = targetMode?.kind === 'skill' ? targetMode.skill.targetType : targetMode?.kind === 'patronus' ? targetMode.patronus.targetType : null;
    const myPatronus = me.patronus ? patronusById(me.patronus) : null;

    function cancelTargeting() {
      setTargetMode(null);
    }

    function cancelPending() {
      setPendingAction(null);
    }

    function pickTarget(targetMonsterIndex: number | undefined, targetPlayerId: string | undefined, targetLabel: string) {
      if (!targetMode) return;
      setPendingAction({ ...targetMode, targetMonsterIndex, targetPlayerId, targetLabel });
      setTargetMode(null);
    }

    function confirmPending() {
      if (!pendingAction) return;
      const { targetMonsterIndex, targetPlayerId } = pendingAction;
      setPendingAction(null);
      if (pendingAction.kind === 'skill') {
        guard(() => submitCombatAction(roomId, game.playerId!, { kind: 'skill', skillId: pendingAction.skill.id, targetMonsterIndex, targetPlayerId }));
      } else {
        guard(() => submitCombatAction(roomId, game.playerId!, { kind: 'patronus', targetMonsterIndex, targetPlayerId }));
      }
    }

    function onSkillClick(skill: SkillDef) {
      if (skill.targetType === 'enemy' || skill.targetType === 'ally') {
        setTargetMode({ kind: 'skill', skill });
        return;
      }
      guard(() => submitCombatAction(roomId, game.playerId!, { kind: 'skill', skillId: skill.id }));
    }

    function onPatronusClick() {
      if (!myPatronus) return;
      if (myPatronus.targetType === 'enemy' || myPatronus.targetType === 'ally') {
        setTargetMode({ kind: 'patronus', patronus: myPatronus });
        return;
      }
      guard(() => submitCombatAction(roomId, game.playerId!, { kind: 'patronus' }));
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
                  targetable={isMyTurn && targetKind === 'enemy'}
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
                targetable={isMyTurn && targetKind === 'ally'}
                onTarget={() => pickTarget(undefined, p.id, p.nickname)}
              />
            ))}
          </div>

          {isMyTurn ? (
            pendingAction ? (
              <Card className="flex flex-col gap-2 border-seal-500">
                <p className="text-sm font-bold text-ink-900">
                  {pendingAction.kind === 'skill' ? pendingAction.skill.name : `익스펙토 패트로눔 (${pendingAction.patronus.name})`} → {pendingAction.targetLabel}
                </p>
                <div className="flex gap-2">
                  <Button className="flex-1" disabled={busy} onClick={confirmPending}>행동 확정</Button>
                  <Button variant="ghost" className="flex-1" onClick={cancelPending}>취소</Button>
                </div>
              </Card>
            ) : targetMode ? (
              <Card className="flex items-center justify-between">
                <p className="text-sm font-bold text-ink-900">
                  {targetMode.kind === 'skill' ? targetMode.skill.name : `익스펙토 패트로눔 (${targetMode.patronus.name})`} — 대상을 선택하세요
                </p>
                <button type="button" onClick={cancelTargeting} className="text-xs text-ink-500/60 underline">취소</button>
              </Card>
            ) : (
              <Card className="flex flex-col gap-2.5">
                <p className="font-gothic text-lg text-ink-black">내 턴 — 행동 선택</p>
                <div className="grid grid-cols-4 gap-1">
                  {COMBAT_TABS.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setCombatTab(t.key)}
                      className={`rounded-lg border px-2 py-1.5 text-xs font-bold ${
                        combatTab === t.key ? 'border-seal-600 bg-seal-600/10 text-seal-600' : 'border-ink-700/15 text-ink-700/60'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {combatTab === 'special' ? (
                  myPatronus ? (
                    <button
                      type="button"
                      disabled={busy || me.mp < myPatronus.baseMpCost}
                      onClick={onPatronusClick}
                      className="flex w-full items-center justify-between rounded-lg border border-seal-500/40 bg-seal-600/10 px-2.5 py-1.5 text-left hover:border-seal-500 disabled:opacity-40"
                    >
                      <span className="text-xs font-bold text-seal-600">익스펙토 패트로눔 <span className="text-[10px] font-normal text-ink-500/60">({myPatronus.name} · {myPatronus.effectLabel})</span></span>
                      <span className={`font-mono text-[10px] ${me.mp >= myPatronus.baseMpCost ? 'text-ink-500/60' : 'text-seal-600'}`}>MP{myPatronus.baseMpCost}</span>
                    </button>
                  ) : (
                    <p className="py-3 text-center text-xs text-ink-500/50">아직 배정된 패트로누스가 없어 특수 주문을 쓸 수 없습니다.</p>
                  )
                ) : (
                  <div className="grid grid-cols-1 gap-1">
                    {SKILLS.filter((s) => SKILL_TAB[s.id] === combatTab).map((s) => {
                      const level = me.skillLevels[s.id] ?? 0;
                      const cost = skillMpCostAtLevel(s, level);
                      const canAfford = me.mp >= cost;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={busy || !canAfford}
                          onClick={() => onSkillClick(s)}
                          className="flex items-center justify-between rounded-lg border border-ink-700/15 bg-paper-100/60 px-2.5 py-1.5 text-left hover:border-seal-500/40 disabled:opacity-40"
                        >
                          <span className="text-xs font-bold text-ink-900">
                            {s.name} <span className="text-[10px] font-normal text-ink-500/60">Lv.{level} · ({skillTag(s)})</span>
                          </span>
                          <span className="font-mono text-[10px] text-ink-500/60">
                            위력{skillValueAtLevel(s, level)} · <span className={canAfford ? '' : 'text-seal-600'}>MP{cost}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
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
