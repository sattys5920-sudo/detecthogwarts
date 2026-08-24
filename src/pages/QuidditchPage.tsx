import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import PaperTexture from '../components/PaperTexture';
import QuidditchBoard from '../components/quidditch/QuidditchBoard';
import { PieceGlyph, QuaffleGlyph, SnitchGlyph } from '../components/quidditch/QuidditchGlyphs';
import { useGame } from '../context/GameContext';
import { QUIDDITCH_RULES } from '../data/quidditchRules';
import {
  checkTurnTimeout,
  joinRoom,
  leaveFinishedRoom,
  leaveWaitingRoom,
  RoomFullError,
  seatedTeamOf,
  submitEndTurn,
  submitMove,
  submitPass,
  subscribeRoom,
} from '../firebase/quidditch';
import { ACTIONS_PER_TURN, MAX_TURNS, type PieceType, type QuidditchGame, type Team } from '../game/quidditchEngine';

const VALID_ROOMS = ['a', 'b', 'c', 'd', 'e'];
const ROOM_LABEL: Record<string, string> = { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' };

const TEAM_LABEL: Record<Team, string> = { A: 'A팀', B: 'B팀' };
const TEAM_CHIP: Record<Team, string> = { A: 'bg-seal-600', B: 'bg-ink-indigo' };
const PIECE_LEGEND: { type: PieceType; label: string }[] = [
  { type: 'keeper', label: '골키퍼' },
  { type: 'seeker', label: '수색꾼' },
  { type: 'chaser', label: '추격자' },
  { type: 'beater', label: '몰이꾼' },
];

function ScoreChip({ team, room }: { team: Team; room: QuidditchGame }) {
  const seat = room.seats[team];
  const active = room.status === 'playing' && room.currentTeam === team;
  return (
    <div className={`flex flex-1 items-center gap-2 rounded-lg border-2 px-2.5 py-2 ${active ? 'border-gold-400 bg-paper-50' : 'border-ink-700/15 bg-paper-100/60'}`}>
      <span className={`h-3 w-3 flex-none rounded-full ${TEAM_CHIP[team]}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-bold text-ink-900">{seat?.nickname ?? TEAM_LABEL[team]}</p>
        <p className="font-mono text-[10px] text-ink-500/60">{TEAM_LABEL[team]}</p>
      </div>
      <p className="font-mono text-lg font-bold text-seal-600">{room.scores[team]}</p>
    </div>
  );
}

function LoadingScreen({ text }: { text: string }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-3 px-6 text-center">
      <PaperTexture />
      <p className="text-sm text-ink-700/70">{text}</p>
    </div>
  );
}

function QuidditchRulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black/60 px-4" role="dialog" aria-modal="true">
      <div className="deckle-edge flex max-h-[85vh] w-full max-w-sm flex-col border border-seal-500/40 bg-paper-50 p-5">
        <div className="flex flex-none items-center justify-between">
          <p className="font-gothic text-xl text-ink-black">🧙‍♂️ 퀴디치 룰</p>
          <button type="button" onClick={onClose} className="text-xs text-ink-500/70 underline-offset-2 hover:underline">
            닫기
          </button>
        </div>
        <p className="mt-2 flex-none rounded-sm border border-seal-500/30 bg-paper-100/70 px-2.5 py-1.5 text-[11px] leading-relaxed text-ink-700/80">
          지금 진행 중인 경기의 실제 규칙입니다. 아래 내용 그대로 적용됩니다.
        </p>

        <div className="mt-3 flex-1 overflow-y-auto pr-0.5">
          {QUIDDITCH_RULES.map((section, i) => (
            <div key={section.heading} className={i > 0 ? 'mt-4' : ''}>
              <p className="font-serif-kr text-sm font-bold text-seal-600">{section.heading}</p>
              {section.paragraphs?.map((p, pi) => (
                <p key={pi} className="mt-1.5 text-xs leading-relaxed text-ink-900">
                  {p}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-1.5 flex flex-col gap-1">
                  {section.bullets.map((b, bi) => (
                    <li key={bi} className="text-xs leading-relaxed text-ink-900">
                      · {b}
                    </li>
                  ))}
                </ul>
              )}
              {section.table && (
                <div className="mt-1.5 overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr>
                        {section.table.headers.map((h) => (
                          <th key={h} className="border-b border-ink-700/20 px-1.5 py-1 text-left font-bold text-ink-700/80">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row, ri) => (
                        <tr key={ri}>
                          {row.map((cell, ci) => (
                            <td key={ci} className="border-b border-ink-700/10 px-1.5 py-1 text-ink-900">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function rewardKey(roomId: string, gameStartedAt: number) {
  return `arcanum-quidditch-reward-${roomId}-${gameStartedAt}`;
}

function staminaKey(roomId: string, gameStartedAt: number) {
  return `arcanum-quidditch-stamina-${roomId}-${gameStartedAt}`;
}

function QuidditchResultScreen({
  room,
  roomId,
  roomLabel,
  iWon,
  isDraw,
}: {
  room: QuidditchGame;
  roomId: string;
  roomLabel: string;
  iWon: boolean;
  isDraw: boolean;
}) {
  const game = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    const key = staminaKey(roomId, room.gameStartedAt);
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, 'true');
    game.adjustStat('stamina', -10);
  }, [roomId, room.gameStartedAt, game]);

  useEffect(() => {
    if (!iWon) return;
    const key = rewardKey(roomId, room.gameStartedAt);
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, 'true');
    game.adjustStat('agility', 5);
    game.growMaxStat('maxStamina', 5);
    game.growMaxStat('maxHp', 5);
  }, [iWon, roomId, room.gameStartedAt, game]);

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <PaperTexture />
      <Card className="w-full max-w-xs">
        <p className="font-gothic text-2xl text-ink-black">경기 종료</p>
        <p className={`mt-2 font-gothic text-3xl ${isDraw ? 'text-ink-700' : iWon ? 'text-seal-600' : 'text-ink-700/60'}`}>
          {isDraw ? '무승부' : iWon ? '승리!' : '패배'}
        </p>
        <p className="mt-1 text-xs text-ink-500/70">
          {room.winReason === 'snitch' ? '황금 스니치 포획으로 경기가 종료되었습니다.' : `${MAX_TURNS}턴이 모두 끝나 경기가 종료되었습니다.`}
        </p>
        {iWon && <p className="mt-1 text-xs font-bold text-seal-600">보상: 민첩 +5, 최대 스태미나 +5, 최대 체력 +5</p>}
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="text-center">
            <p className="font-mono text-2xl font-bold text-ink-900">{room.scores.A}</p>
            <p className="text-[10px] text-ink-500/60">{room.seats.A?.nickname ?? 'A팀'}</p>
          </div>
          <p className="text-ink-500/40">:</p>
          <div className="text-center">
            <p className="font-mono text-2xl font-bold text-ink-900">{room.scores.B}</p>
            <p className="text-[10px] text-ink-500/60">{room.seats.B?.nickname ?? 'B팀'}</p>
          </div>
        </div>
        <Button
          className="mt-5 w-full"
          onClick={async () => {
            await leaveFinishedRoom(roomId);
            navigate('/recess');
          }}
        >
          확인하고 나가기
        </Button>
      </Card>
      <p className="font-mono text-[10px] text-ink-500/40">퀴디치 경기장 {roomLabel}</p>
    </div>
  );
}

export default function QuidditchPage() {
  const game = useGame();
  const navigate = useNavigate();
  const { roomId = '' } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<QuidditchGame | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [showRules, setShowRules] = useState(false);
  const roomLabel = ROOM_LABEL[roomId] ?? '';

  useEffect(() => {
    if (!VALID_ROOMS.includes(roomId)) return;
    return subscribeRoom(roomId, setRoom);
  }, [roomId]);

  useEffect(() => {
    if (!game.playerId || !VALID_ROOMS.includes(roomId)) return;
    joinRoom(roomId, game.playerId, game.nickname).catch((e) => {
      setJoinError(e instanceof RoomFullError ? e.message : '입장에 실패했습니다. 다시 시도해 주세요.');
    });
  }, [roomId, game.playerId, game.nickname]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const roomStatus = room?.status;
  useEffect(() => {
    if (roomStatus !== 'playing') return;
    const id = setInterval(() => {
      checkTurnTimeout(roomId);
    }, 1000);
    return () => clearInterval(id);
  }, [roomId, roomStatus]);

  if (!game.hasEntered) return <Navigate to="/" replace />;
  if (!VALID_ROOMS.includes(roomId)) return <Navigate to="/recess" replace />;
  if (joinError) {
    return (
      <div className="relative flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <PaperTexture />
        <Card className="w-full max-w-xs">
          <p className="font-gothic text-2xl text-ink-black">퀴디치 경기장 {roomLabel}</p>
          <p className="mt-2 text-sm text-ink-700/70">{joinError}</p>
          <Button className="mt-4 w-full" onClick={() => navigate('/recess')}>
            휴게시간으로 돌아가기
          </Button>
        </Card>
      </div>
    );
  }
  if (!room) return <LoadingScreen text="경기장을 확인하는 중..." />;

  const mySeat = game.playerId ? seatedTeamOf(room, game.playerId) : null;

  if (room.status === 'waiting') {
    if (!mySeat) return <LoadingScreen text="입장하는 중..." />;
    return (
      <div className="relative flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <PaperTexture />
        <button
          type="button"
          onClick={() => setShowRules(true)}
          className="tablet-btn absolute right-4 px-2.5 py-1 text-[11px] font-bold"
          style={{ top: 'calc(env(safe-area-inset-top) + 1rem)' }}
        >
          룰
        </button>
        {showRules && <QuidditchRulesModal onClose={() => setShowRules(false)} />}
        <Card className="w-full max-w-xs">
          <p className="font-gothic text-2xl text-ink-black">퀴디치 경기장 {roomLabel}</p>
          <p className="mt-2 text-sm text-ink-700/70">상대 선수를 기다리는 중입니다…</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className={`h-3 w-3 rounded-full ${TEAM_CHIP[mySeat]}`} />
            <p className="font-serif-kr font-semibold text-ink-900">{game.nickname}</p>
            <span className="font-mono text-[10px] text-ink-500/60">({TEAM_LABEL[mySeat]})</span>
          </div>
          <Button
            variant="ghost"
            className="mt-5 w-full"
            onClick={async () => {
              if (game.playerId) await leaveWaitingRoom(roomId, game.playerId);
              navigate('/recess');
            }}
          >
            나가기
          </Button>
        </Card>
      </div>
    );
  }

  if (room.status === 'finished') {
    if (!mySeat) return <LoadingScreen text="결과를 확인하는 중..." />;
    const iWon = room.winner === mySeat;
    const isDraw = room.winner === 'draw';
    return (
      <QuidditchResultScreen key={`${roomId}-${room.gameStartedAt}`} room={room} roomId={roomId} roomLabel={roomLabel} iWon={iWon} isDraw={isDraw} />
    );
  }

  // status === 'playing'
  if (!mySeat) return <LoadingScreen text="입장을 확인하는 중..." />;

  async function handleMove(pieceId: string, dest: { row: number; col: number }) {
    if (!game.playerId) return;
    try {
      await submitMove(roomId, game.playerId, pieceId, dest);
    } catch {
      // stale/illegal move (e.g. turn passed while deciding) — board will resync from the next snapshot.
    }
  }

  async function handlePass(pieceId: string, targetId: string) {
    if (!game.playerId) return;
    try {
      await submitPass(roomId, game.playerId, pieceId, targetId);
    } catch {
      // stale/illegal pass — board will resync from the next snapshot.
    }
  }

  async function handleEndTurn() {
    if (!game.playerId) return;
    try {
      await submitEndTurn(roomId, game.playerId);
    } catch {
      // stale — board will resync from the next snapshot.
    }
  }

  const myTurn = room.currentTeam === mySeat;
  const turnMs = room.turnDeadline - now;

  return (
    <div className="relative flex min-h-svh flex-col">
      <PaperTexture />
      <div className="flex items-center justify-between px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-1">
        <span className="w-12 flex-none" aria-hidden="true" />
        <p className="flex-1 text-center font-gothic text-lg text-ink-black">HWCF · 퀴디치 경기장 {roomLabel}</p>
        <button
          type="button"
          onClick={() => setShowRules(true)}
          className="tablet-btn flex-none px-2.5 py-1 text-[11px] font-bold"
        >
          룰
        </button>
      </div>

      {showRules && <QuidditchRulesModal onClose={() => setShowRules(false)} />}

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-2.5 overflow-y-auto px-3 pb-6">
        <div className="flex gap-2">
          <ScoreChip team="A" room={room} />
          <ScoreChip team="B" room={room} />
        </div>

        <div className="flex items-center justify-between rounded-sm bg-ink-black px-3 py-1.5 text-paper-50">
          <p className="font-mono text-[10px] tracking-wide">{room.turnCount} / {MAX_TURNS}턴</p>
          <p className="font-mono text-[10px] tracking-wide">{room.snitch ? '스니치 등장' : `스니치 등장까지 ${Math.max(0, 5 - room.turnCount)}턴`}</p>
        </div>

        <div className={`flex items-center justify-between rounded-lg border-2 px-3 py-2 ${myTurn ? 'border-seal-600 bg-seal-600/10' : 'border-ink-700/15 bg-paper-100/60'}`}>
          <div>
            <p className="text-sm font-bold text-ink-900">{myTurn ? '내 턴입니다 — 기물을 선택하세요' : `${room.seats[room.currentTeam]?.nickname ?? TEAM_LABEL[room.currentTeam]}님의 턴`}</p>
            <p className="font-mono text-[10px] text-ink-700/60">행동 {room.actedPieceIds.length} / {ACTIONS_PER_TURN}</p>
          </div>
          <p className={`font-mono text-xl font-bold ${turnMs < 8000 ? 'text-seal-600' : 'text-ink-900'}`}>{Math.max(0, Math.ceil(turnMs / 1000))}s</p>
        </div>

        {myTurn && (
          <button
            type="button"
            onClick={handleEndTurn}
            disabled={room.actedPieceIds.length === 0}
            className="tablet-btn self-end px-3 py-1.5 text-[11px] font-bold disabled:opacity-40"
          >
            턴 종료
          </button>
        )}

        <QuidditchBoard game={room} mySeat={mySeat} onMove={handleMove} onPass={handlePass} />

        <p className="flex items-center justify-center gap-1.5 text-[10px] text-ink-700/60">
          <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-dashed border-gold-400" aria-hidden="true" />
          점선 테두리 = 퀘이플을 든 추격자가 그 동료에게 패스할 수 있음 (이동 대신 즉시 전달)
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-lg border border-ink-700/15 bg-paper-100/50 px-2.5 py-1.5">
          {PIECE_LEGEND.map((p) => (
            <span key={p.type} className="flex items-center gap-1 text-[10px] text-ink-700/70">
              <span className="h-4 w-4 text-ink-700/80">
                <PieceGlyph type={p.type} />
              </span>
              {p.label}
            </span>
          ))}
          <span className="flex items-center gap-1 text-[10px] text-ink-700/70">
            <QuaffleGlyph className="h-4 w-4" />
            퀘이플
          </span>
          <span className="flex items-center gap-1 text-[10px] text-ink-700/70">
            <SnitchGlyph className="h-4 w-4" />
            스니치
          </span>
        </div>

        <div className="rounded-lg border border-ink-700/15 bg-paper-50 px-3 py-2">
          <p className="mb-1 font-mono text-[10px] font-bold text-ink-500/60">경기 기록</p>
          <div className="flex max-h-24 flex-col-reverse gap-0.5 overflow-y-auto text-[11px] text-ink-700/80">
            {room.log
              .slice(-8)
              .reverse()
              .map((entry, i) => (
                <p key={i}>{entry.text}</p>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
