export type Team = 'A' | 'B';
export type PieceType = 'keeper' | 'seeker' | 'chaser' | 'beater';
export type GameStatus = 'waiting' | 'playing' | 'finished';

export interface Piece {
  id: string;
  team: Team;
  type: PieceType;
  row: number;
  col: number;
  hasQuaffle: boolean;
}

export interface SnitchState {
  row: number;
  col: number;
  dirRow: 1 | -1;
  dirCol: 1 | -1;
}

export interface SeatInfo {
  playerId: string;
  nickname: string;
}

export interface LogEntry {
  turn: number;
  team: Team | null;
  text: string;
  at: number;
}

export interface QuidditchGame {
  status: GameStatus;
  seats: { A: SeatInfo | null; B: SeatInfo | null };
  pieces: Piece[];
  quafflePos: { row: number; col: number } | null;
  quaffleHolderId: string | null;
  snitch: SnitchState | null;
  /** Team that most recently had a seeker land on the snitch's square without capturing it yet — landing there a second time in a row captures it. */
  snitchSpottedBy: Team | null;
  /** Pieces that have already acted this turn — a turn is up to ACTIONS_PER_TURN actions, no piece may act twice. */
  actedPieceIds: string[];
  turnCount: number;
  currentTeam: Team;
  turnStartedAt: number;
  turnDeadline: number;
  gameStartedAt: number;
  scores: { A: number; B: number };
  winner: Team | 'draw' | null;
  winReason: 'snitch' | 'turns' | null;
  log: LogEntry[];
  updatedAt: number;
}

export const BOARD_SIZE = 8;
export const TURN_MS = 120_000;
export const MAX_TURNS = 30;
export const SNITCH_SPAWN_TURN = 5;
export const ACTIONS_PER_TURN = 2;
export const CENTER = { row: 3, col: 3 };
const MAX_LOG = 30;

const SCORES = {
  goal: 10,
  save: 3,
  strike: 2,
  captureChaser: 3,
  captureBeater: 3,
  captureKeeper: 5,
  captureSeeker: 20,
  snitchCatch: 30,
} as const;

const ORTHO: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
const DIAG: [number, number][] = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];
const ALL8: [number, number][] = [...ORTHO, ...DIAG];

const LAYOUT: (PieceType | null)[] = ['beater', 'chaser', 'keeper', 'seeker', 'chaser', 'chaser', 'beater', null];

function inBounds(row: number, col: number) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function otherTeam(team: Team): Team {
  return team === 'A' ? 'B' : 'A';
}

function goalRowOf(team: Team): number {
  return team === 'A' ? 0 : BOARD_SIZE - 1;
}

function chebyshev(a: { row: number; col: number }, b: { row: number; col: number }) {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col));
}

function pieceAt(pieces: Piece[], row: number, col: number): Piece | null {
  return pieces.find((p) => p.row === row && p.col === col) ?? null;
}

function captureScore(type: PieceType): number {
  switch (type) {
    case 'chaser':
      return SCORES.captureChaser;
    case 'beater':
      return SCORES.captureBeater;
    case 'keeper':
      return SCORES.captureKeeper;
    case 'seeker':
      return SCORES.captureSeeker;
  }
}

export interface MoveDest {
  row: number;
  col: number;
  capture: boolean;
}

function rayDestinations(
  pieces: Piece[],
  piece: Piece,
  dirs: [number, number][],
  maxRange: number,
  opts: { noCaptureLanding?: boolean; canCapture?: (type: PieceType) => boolean } = {},
): MoveDest[] {
  const out: MoveDest[] = [];
  for (const [dr, dc] of dirs) {
    for (let step = 1; step <= maxRange; step++) {
      const row = piece.row + dr * step;
      const col = piece.col + dc * step;
      if (!inBounds(row, col)) break;
      const occ = pieceAt(pieces, row, col);
      if (!occ) {
        out.push({ row, col, capture: false });
        continue;
      }
      if (occ.team === piece.team) break;
      if (opts.noCaptureLanding) break;
      if (opts.canCapture && !opts.canCapture(occ.type)) break;
      out.push({ row, col, capture: true });
      break;
    }
  }
  return out;
}

/** True once a piece has already used its one action this turn. */
function hasActed(game: QuidditchGame, pieceId: string): boolean {
  return game.actedPieceIds.includes(pieceId);
}

export function legalMoves(game: QuidditchGame, pieceId: string): MoveDest[] {
  const piece = game.pieces.find((p) => p.id === pieceId);
  if (!piece || piece.team !== game.currentTeam || game.status !== 'playing' || hasActed(game, pieceId)) return [];
  switch (piece.type) {
    case 'keeper': {
      // A goalkeeper only fights near its own goal — far from home, it can move but not capture.
      const nearHomeGoal = Math.abs(piece.row - goalRowOf(piece.team)) <= 2;
      return rayDestinations(game.pieces, piece, ORTHO, 2, nearHomeGoal ? {} : { canCapture: () => false });
    }
    case 'chaser':
      return rayDestinations(game.pieces, piece, ORTHO, 2, { canCapture: (t) => t === 'chaser' || t === 'keeper' });
    case 'beater':
      return rayDestinations(game.pieces, piece, DIAG, 3, { noCaptureLanding: true });
    case 'seeker':
      return rayDestinations(game.pieces, piece, ALL8, 2, { canCapture: (t) => t === 'seeker' || t === 'chaser' });
  }
}

/** Which direction (if any, one of the 8) piece `b` lies from piece `a`, for straight-line quaffle passing. */
function lineDirection(a: { row: number; col: number }, b: { row: number; col: number }): [number, number] | null {
  const dr = b.row - a.row;
  const dc = b.col - a.col;
  if (dr === 0 && dc === 0) return null;
  if (dr === 0) return [0, dc > 0 ? 1 : -1];
  if (dc === 0) return [dr > 0 ? 1 : -1, 0];
  if (Math.abs(dr) === Math.abs(dc)) return [dr > 0 ? 1 : -1, dc > 0 ? 1 : -1];
  return null;
}

/** A pass travels any straight line (rank, file, or diagonal) and is blocked only by an enemy piece standing between the two. */
function hasClearPassLane(pieces: Piece[], from: Piece, to: Piece): boolean {
  const dir = lineDirection(from, to);
  if (!dir) return false;
  const [dr, dc] = dir;
  let row = from.row + dr;
  let col = from.col + dc;
  while (row !== to.row || col !== to.col) {
    const occ = pieceAt(pieces, row, col);
    if (occ && occ.team !== from.team) return false;
    row += dr;
    col += dc;
  }
  return true;
}

/** Friendly chasers reachable by a straight-line pass — no movement, ends the acting piece's action like a normal move. */
export function legalPassTargets(game: QuidditchGame, pieceId: string): string[] {
  const piece = game.pieces.find((p) => p.id === pieceId);
  if (!piece || piece.team !== game.currentTeam || game.status !== 'playing' || hasActed(game, pieceId)) return [];
  if (piece.type !== 'chaser' || !piece.hasQuaffle) return [];
  return game.pieces
    .filter((p) => p.team === piece.team && p.type === 'chaser' && p.id !== piece.id)
    .filter((p) => hasClearPassLane(game.pieces, piece, p))
    .map((p) => p.id);
}

/** Instantly hands the quaffle to a friendly chaser in a clear straight line — counts as this piece's action for the turn. */
export function applyPass(game: QuidditchGame, pieceId: string, targetId: string): QuidditchGame {
  if (game.status !== 'playing') throw new Error('게임이 진행 중이 아닙니다.');
  if (!legalPassTargets(game, pieceId).includes(targetId)) throw new Error('패스할 수 없는 대상입니다.');

  const pieces = game.pieces.map((p) => ({ ...p }));
  const mover = pieces.find((p) => p.id === pieceId)!;
  const target = pieces.find((p) => p.id === targetId)!;
  const team = mover.team;

  mover.hasQuaffle = false;
  target.hasQuaffle = true;

  const log = pushLog(game.log, mkLog(game.turnCount, team, `${team}팀 추격자가 동료에게 퀘이플을 패스했습니다.`));

  return completeAction(
    {
      ...game,
      pieces,
      quaffleHolderId: target.id,
      log,
      updatedAt: Date.now(),
    },
    pieceId,
  );
}

const STRIKE_DIR_PRIORITY: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

function findStrikeTarget(pieces: Piece[], mover: Piece): { victim: Piece; pushTo: { row: number; col: number } } | null {
  for (const [dr, dc] of STRIKE_DIR_PRIORITY) {
    const row = mover.row + dr;
    const col = mover.col + dc;
    const victim = pieceAt(pieces, row, col);
    if (!victim || victim.team === mover.team) continue;
    const pr = row + dr;
    const pc = col + dc;
    if (!inBounds(pr, pc) || pieceAt(pieces, pr, pc)) continue;
    return { victim, pushTo: { row: pr, col: pc } };
  }
  return null;
}

function moveSnitch(s: SnitchState): SnitchState {
  let { dirRow, dirCol } = s;
  let nr = s.row + dirRow;
  let nc = s.col + dirCol;
  if (nr < 0 || nr >= BOARD_SIZE) {
    dirRow = (dirRow * -1) as 1 | -1;
    nr = s.row + dirRow;
  }
  if (nc < 0 || nc >= BOARD_SIZE) {
    dirCol = (dirCol * -1) as 1 | -1;
    nc = s.col + dirCol;
  }
  return { row: nr, col: nc, dirRow, dirCol };
}

function mkLog(turn: number, team: Team | null, text: string): LogEntry {
  return { turn, team, text, at: Date.now() };
}

function pushLog(log: LogEntry[], entry: LogEntry): LogEntry[] {
  return [...log, entry].slice(-MAX_LOG);
}

function buildTeamPieces(team: Team, row: number): Piece[] {
  const pieces: Piece[] = [];
  LAYOUT.forEach((type, col) => {
    if (!type) return;
    pieces.push({ id: `${team}-${type}-${col}`, team, type, row, col, hasQuaffle: false });
  });
  return pieces;
}

export function createInitialGame(seatA: SeatInfo, seatB: SeatInfo): QuidditchGame {
  const now = Date.now();
  return {
    status: 'playing',
    seats: { A: seatA, B: seatB },
    pieces: [...buildTeamPieces('A', 0), ...buildTeamPieces('B', BOARD_SIZE - 1)],
    quafflePos: { ...CENTER },
    quaffleHolderId: null,
    snitch: null,
    snitchSpottedBy: null,
    actedPieceIds: [],
    turnCount: 0,
    currentTeam: 'A',
    turnStartedAt: now,
    turnDeadline: now + TURN_MS,
    gameStartedAt: now,
    scores: { A: 0, B: 0 },
    winner: null,
    winReason: null,
    log: [mkLog(0, null, '경기가 시작되었습니다. 한 턴에 서로 다른 기물 2 개까지 행동할 수 있습니다.')],
    updatedAt: now,
  };
}

export function emptyRoom(): QuidditchGame {
  const now = Date.now();
  return {
    status: 'waiting',
    seats: { A: null, B: null },
    pieces: [],
    quafflePos: null,
    quaffleHolderId: null,
    snitch: null,
    snitchSpottedBy: null,
    actedPieceIds: [],
    turnCount: 0,
    currentTeam: 'A',
    turnStartedAt: now,
    turnDeadline: now,
    gameStartedAt: now,
    scores: { A: 0, B: 0 },
    winner: null,
    winReason: null,
    log: [],
    updatedAt: now,
  };
}

/** Score → quaffle-holder → closer-seeker-to-opponent-goal, in that order. */
function decideWinnerByScore(pieces: Piece[], scores: { A: number; B: number }): Team | 'draw' {
  if (scores.A > scores.B) return 'A';
  if (scores.B > scores.A) return 'B';
  const holder = pieces.find((p) => p.hasQuaffle);
  if (holder) return holder.team;
  const seekerA = pieces.find((p) => p.team === 'A' && p.type === 'seeker');
  const seekerB = pieces.find((p) => p.team === 'B' && p.type === 'seeker');
  const distA = seekerA ? Math.abs(seekerA.row - goalRowOf('B')) : Infinity;
  const distB = seekerB ? Math.abs(seekerB.row - goalRowOf('A')) : Infinity;
  if (distA < distB) return 'A';
  if (distB < distA) return 'B';
  return 'draw';
}

/** Completes the whole turn: spawns/moves the snitch, checks turn/game-end conditions, hands play to the other team. */
function advanceTurn(game: QuidditchGame): QuidditchGame {
  let { snitch, snitchSpottedBy } = game;
  let { status, winner, winReason, scores } = game;
  const turnCount = game.turnCount + 1;
  let log = game.log;

  if (status === 'playing' && turnCount === SNITCH_SPAWN_TURN) {
    snitch = { row: CENTER.row, col: CENTER.col, dirRow: 1, dirCol: 1 };
    log = pushLog(log, mkLog(turnCount, null, '황금 스니치가 경기장 중앙에 나타났습니다!'));
  } else if (status === 'playing' && snitch) {
    snitch = moveSnitch(snitch);
    const occupant = game.pieces.find((p) => p.row === snitch!.row && p.col === snitch!.col && p.type === 'seeker');
    if (occupant && snitchSpottedBy === occupant.team) {
      scores = { ...scores, [occupant.team]: scores[occupant.team] + SCORES.snitchCatch };
      status = 'finished';
      winner = occupant.team;
      winReason = 'snitch';
      log = pushLog(log, mkLog(turnCount, occupant.team, `스니치가 다시 ${occupant.team}팀 수색꾼의 자리로 날아들어 포획되었습니다! 승리!`));
    } else if (occupant) {
      snitchSpottedBy = occupant.team;
      log = pushLog(log, mkLog(turnCount, occupant.team, `스니치가 ${occupant.team}팀 수색꾼 옆으로 이동했습니다 — 발견 상태!`));
    }
  }

  if (status === 'playing' && turnCount >= MAX_TURNS) {
    status = 'finished';
    winner = decideWinnerByScore(game.pieces, scores);
    winReason = 'turns';
    log = pushLog(log, mkLog(turnCount, null, `${MAX_TURNS} 턴이 모두 끝나 경기가 종료되었습니다.`));
  }

  const now = Date.now();
  return {
    ...game,
    snitch,
    snitchSpottedBy,
    status,
    winner,
    winReason,
    scores,
    turnCount,
    log,
    actedPieceIds: [],
    currentTeam: status === 'finished' ? game.currentTeam : otherTeam(game.currentTeam),
    turnStartedAt: now,
    turnDeadline: now + TURN_MS,
    updatedAt: now,
  };
}

/** Records that `pieceId` used its action this turn; once ACTIONS_PER_TURN pieces have acted, the full turn ends. */
function completeAction(game: QuidditchGame, pieceId: string): QuidditchGame {
  const actedPieceIds = [...game.actedPieceIds, pieceId];
  if (game.status === 'finished' || actedPieceIds.length >= ACTIONS_PER_TURN) {
    return advanceTurn({ ...game, actedPieceIds });
  }
  return { ...game, actedPieceIds, updatedAt: Date.now() };
}

/** Lets the active team end their turn early after using fewer than ACTIONS_PER_TURN actions. */
export function endTurnManually(game: QuidditchGame): QuidditchGame {
  if (game.status !== 'playing') throw new Error('게임이 진행 중이 아닙니다.');
  const log = pushLog(game.log, mkLog(game.turnCount, game.currentTeam, `${game.currentTeam}팀이 턴을 마쳤습니다.`));
  return advanceTurn({ ...game, log });
}

export function applyMove(game: QuidditchGame, pieceId: string, dest: { row: number; col: number }): QuidditchGame {
  if (game.status !== 'playing') throw new Error('게임이 진행 중이 아닙니다.');
  const dests = legalMoves(game, pieceId);
  const match = dests.find((d) => d.row === dest.row && d.col === dest.col);
  if (!match) throw new Error('이동할 수 없는 칸입니다.');

  const pieces = game.pieces.map((p) => ({ ...p }));
  const mover = pieces.find((p) => p.id === pieceId)!;
  const team = mover.team;
  const opp = otherTeam(team);
  const turnCount = game.turnCount;
  let quafflePos = game.quafflePos ? { ...game.quafflePos } : null;
  let quaffleHolderId = game.quaffleHolderId;
  let snitchSpottedBy = game.snitchSpottedBy;
  const scores = { ...game.scores };
  let log = game.log;
  let survivingPieces = pieces;
  let snitchCaught = false;

  function dropQuaffleToCenter() {
    quafflePos = { ...CENTER };
    quaffleHolderId = null;
    mover.hasQuaffle = false;
  }

  if (mover.type === 'chaser' && mover.hasQuaffle && dest.row === goalRowOf(opp) && !match.capture) {
    const enemyKeeperAdjacent = pieces.some((p) => p.team === opp && p.type === 'keeper' && chebyshev(p, dest) === 1);
    if (enemyKeeperAdjacent) {
      scores[opp] += SCORES.save;
      dropQuaffleToCenter();
      log = pushLog(log, mkLog(turnCount, opp, `${opp}팀 골키퍼가 골을 막아냈습니다! (세이브 +3)`));
    } else {
      mover.row = dest.row;
      mover.col = dest.col;
      scores[team] += SCORES.goal;
      dropQuaffleToCenter();
      log = pushLog(log, mkLog(turnCount, team, `${team}팀 추격자가 골을 넣었습니다! (+10)`));
    }
  } else if (match.capture) {
    const victim = pieces.find((p) => p.row === dest.row && p.col === dest.col && p.team === opp)!;
    const hadQuaffle = victim.hasQuaffle;
    const gained = captureScore(victim.type);
    scores[team] += gained;
    survivingPieces = pieces.filter((p) => p.id !== victim.id);
    mover.row = dest.row;
    mover.col = dest.col;
    if (hadQuaffle) {
      quafflePos = { ...CENTER };
      quaffleHolderId = null;
      mover.hasQuaffle = false;
    }
    log = pushLog(log, mkLog(turnCount, team, `${team}팀 ${withI(pieceLabel(mover.type))} ${opp}팀 ${withEul(pieceLabel(victim.type))} 제거했습니다! (+${gained})`));
  } else if (mover.type === 'beater') {
    mover.row = dest.row;
    mover.col = dest.col;
    const target = findStrikeTarget(survivingPieces, mover);
    if (target) {
      const idx = survivingPieces.findIndex((p) => p.id === target.victim.id);
      const victimHadQuaffle = target.victim.hasQuaffle;
      const droppedAt = { row: target.victim.row, col: target.victim.col };
      survivingPieces = survivingPieces.map((p, i) =>
        i === idx ? { ...p, row: target.pushTo.row, col: target.pushTo.col, hasQuaffle: false } : p,
      );
      scores[team] += SCORES.strike;
      if (victimHadQuaffle) {
        quafflePos = droppedAt;
        quaffleHolderId = null;
        log = pushLog(
          log,
          mkLog(turnCount, team, `${team}팀 몰이꾼이 퀘이플을 든 ${opp}팀 ${withEul(pieceLabel(target.victim.type))} 밀쳐 퀘이플을 떨어뜨렸습니다! (+2)`),
        );
      } else {
        log = pushLog(log, mkLog(turnCount, team, `${team}팀 몰이꾼이 ${opp}팀 ${withEul(pieceLabel(target.victim.type))} 밀쳐냈습니다! (+2)`));
      }
    } else {
      log = pushLog(log, mkLog(turnCount, team, `${team}팀 몰이꾼이 이동했습니다.`));
    }
  } else if (mover.type === 'seeker' && game.snitch && dest.row === game.snitch.row && dest.col === game.snitch.col) {
    mover.row = dest.row;
    mover.col = dest.col;
    if (game.snitchSpottedBy === team) {
      scores[team] += SCORES.snitchCatch;
      snitchCaught = true;
      log = pushLog(log, mkLog(turnCount, team, `${team}팀 수색꾼이 다시 한번 황금 스니치를 붙잡아 포획했습니다! 승리!`));
    } else {
      snitchSpottedBy = team;
      log = pushLog(log, mkLog(turnCount, team, `${team}팀 수색꾼이 황금 스니치를 발견했습니다! 한 번 더 붙잡으면 포획할 수 있습니다.`));
    }
  } else if (quafflePos && dest.row === quafflePos.row && dest.col === quafflePos.col && mover.type === 'chaser') {
    mover.row = dest.row;
    mover.col = dest.col;
    mover.hasQuaffle = true;
    quaffleHolderId = mover.id;
    quafflePos = null;
    log = pushLog(log, mkLog(turnCount, team, `${team}팀 추격자가 퀘이플을 잡았습니다.`));
  } else {
    mover.row = dest.row;
    mover.col = dest.col;
    log = pushLog(log, mkLog(turnCount, team, `${team}팀 ${withI(pieceLabel(mover.type))} 이동했습니다.`));
  }

  survivingPieces = survivingPieces.map((p) => (p.id === mover.id ? mover : p));

  const draft: QuidditchGame = {
    ...game,
    pieces: survivingPieces,
    quafflePos,
    quaffleHolderId,
    snitchSpottedBy,
    scores,
    log,
    updatedAt: Date.now(),
  };

  if (snitchCaught) {
    return {
      ...draft,
      status: 'finished',
      winner: team,
      winReason: 'snitch',
    };
  }

  return completeAction(draft, pieceId);
}

function pieceLabel(type: PieceType) {
  switch (type) {
    case 'keeper':
      return '골키퍼';
    case 'seeker':
      return '수색꾼';
    case 'chaser':
      return '추격자';
    case 'beater':
      return '몰이꾼';
  }
}

/** True if a Korean word's last syllable has a trailing consonant (받침), for 이/가 · 을/를 particle choice. */
function hasBatchim(word: string): boolean {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return false;
  return code % 28 !== 0;
}

function withI(word: string): string {
  return `${word}${hasBatchim(word) ? '이' : '가'}`;
}

function withEul(word: string): string {
  return `${word}${hasBatchim(word) ? '을' : '를'}`;
}

export function passTurnIfExpired(game: QuidditchGame): QuidditchGame | null {
  if (game.status !== 'playing') return null;
  if (Date.now() < game.turnDeadline) return null;
  const team = game.currentTeam;
  const log = pushLog(game.log, mkLog(game.turnCount, team, `${team}팀이 시간 안에 행동하지 않아 턴이 자동으로 넘어갔습니다.`));
  return advanceTurn({ ...game, log });
}
