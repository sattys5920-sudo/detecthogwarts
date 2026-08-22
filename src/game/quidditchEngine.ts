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
  turnCount: number;
  currentTeam: Team;
  turnStartedAt: number;
  turnDeadline: number;
  gameStartedAt: number;
  gameDeadline: number;
  scores: { A: number; B: number };
  winner: Team | 'draw' | null;
  winReason: 'snitch' | 'time' | null;
  log: LogEntry[];
  updatedAt: number;
}

export const BOARD_SIZE = 8;
export const TURN_MS = 30_000;
export const GAME_MS = 20 * 60_000;
export const SNITCH_SPAWN_TURN = 5;
export const CENTER = { row: 3, col: 3 };
const MAX_LOG = 30;

const SCORES = {
  goal: 10,
  steal: 3,
  save: 3,
  strike: 2,
  captureChaser: 2,
  captureBeater: 2,
  captureSeeker: 5,
  captureKeeper: 5,
  snitchCatch: 50,
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
    case 'seeker':
      return SCORES.captureSeeker;
    case 'keeper':
      return SCORES.captureKeeper;
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
  opts: { noCaptureLanding?: boolean; cannotCaptureType?: PieceType } = {},
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
      if (opts.cannotCaptureType && occ.type === opts.cannotCaptureType) break;
      out.push({ row, col, capture: true });
      break;
    }
  }
  return out;
}

export function legalMoves(game: QuidditchGame, pieceId: string): MoveDest[] {
  const piece = game.pieces.find((p) => p.id === pieceId);
  if (!piece || piece.team !== game.currentTeam || game.status !== 'playing') return [];
  switch (piece.type) {
    case 'keeper':
      return rayDestinations(game.pieces, piece, ALL8, 1, { cannotCaptureType: 'keeper' });
    case 'chaser':
      return rayDestinations(game.pieces, piece, ORTHO, 3);
    case 'beater':
      return rayDestinations(game.pieces, piece, ORTHO, 3, { noCaptureLanding: true });
    case 'seeker':
      return rayDestinations(game.pieces, piece, ALL8, 3);
  }
}

/** Adjacent (8-direction) friendly chasers a quaffle-carrying chaser may pass to instead of moving. */
export function legalPassTargets(game: QuidditchGame, pieceId: string): string[] {
  const piece = game.pieces.find((p) => p.id === pieceId);
  if (!piece || piece.team !== game.currentTeam || game.status !== 'playing') return [];
  if (piece.type !== 'chaser' || !piece.hasQuaffle) return [];
  return game.pieces
    .filter((p) => p.team === piece.team && p.type === 'chaser' && p.id !== piece.id && chebyshev(p, piece) === 1)
    .map((p) => p.id);
}

/** Instantly hands the quaffle to an adjacent friendly chaser — no movement, ends the turn like a normal move. */
export function applyPass(game: QuidditchGame, pieceId: string, targetId: string): QuidditchGame {
  if (game.status !== 'playing') throw new Error('게임이 진행 중이 아닙니다.');
  if (!legalPassTargets(game, pieceId).includes(targetId)) throw new Error('패스할 수 없는 대상입니다.');

  const pieces = game.pieces.map((p) => ({ ...p }));
  const mover = pieces.find((p) => p.id === pieceId)!;
  const target = pieces.find((p) => p.id === targetId)!;
  const team = mover.team;

  mover.hasQuaffle = false;
  target.hasQuaffle = true;

  const log = pushLog(game.log, mkLog(game.turnCount, team, `${team}팀 추격꾼이 동료에게 퀘이플을 패스했습니다.`));

  return endTurn({
    ...game,
    pieces,
    quaffleHolderId: target.id,
    log,
    updatedAt: Date.now(),
  });
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
    if (!victim || victim.team === mover.team || victim.type === 'keeper') continue;
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
    turnCount: 0,
    currentTeam: 'A',
    turnStartedAt: now,
    turnDeadline: now + TURN_MS,
    gameStartedAt: now,
    gameDeadline: now + GAME_MS,
    scores: { A: 0, B: 0 },
    winner: null,
    winReason: null,
    log: [mkLog(0, null, '경기가 시작되었습니다.')],
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
    turnCount: 0,
    currentTeam: 'A',
    turnStartedAt: now,
    turnDeadline: now,
    gameStartedAt: now,
    gameDeadline: now,
    scores: { A: 0, B: 0 },
    winner: null,
    winReason: null,
    log: [],
    updatedAt: now,
  };
}

function endTurn(game: QuidditchGame): QuidditchGame {
  let { snitch } = game;
  let { status, winner, scores } = game;
  const turnCount = game.turnCount + 1;
  let log = game.log;

  if (status === 'playing' && turnCount === SNITCH_SPAWN_TURN) {
    snitch = { row: CENTER.row, col: CENTER.col, dirRow: 1, dirCol: 1 };
    log = pushLog(log, mkLog(turnCount, null, '황금 스니치가 경기장 중앙에 나타났습니다!'));
  } else if (status === 'playing' && snitch) {
    snitch = moveSnitch(snitch);
    const occupant = game.pieces.find((p) => p.row === snitch!.row && p.col === snitch!.col && p.type === 'seeker');
    if (occupant) {
      scores = { ...scores, [occupant.team]: scores[occupant.team] + SCORES.snitchCatch };
      status = 'finished';
      winner = occupant.team;
      log = pushLog(log, mkLog(turnCount, occupant.team, `스니치가 ${occupant.team}팀 수색꾼에게 날아들어 포획되었습니다! 승리!`));
    }
  }

  const now = Date.now();
  const finished = status === 'finished';
  return {
    ...game,
    snitch,
    status,
    winner,
    winReason: finished && !game.winReason ? 'snitch' : game.winReason,
    scores,
    turnCount,
    log,
    currentTeam: finished ? game.currentTeam : otherTeam(game.currentTeam),
    turnStartedAt: now,
    turnDeadline: now + TURN_MS,
    updatedAt: now,
  };
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
      log = pushLog(log, mkLog(turnCount, opp, `${opp}팀 파수꾼이 골을 막아냈습니다! (세이브 +3)`));
    } else {
      mover.row = dest.row;
      mover.col = dest.col;
      scores[team] += SCORES.goal;
      dropQuaffleToCenter();
      log = pushLog(log, mkLog(turnCount, team, `${team}팀 추격꾼이 골을 넣었습니다! (+10)`));
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
          mkLog(turnCount, team, `${team}팀 타격수가 퀘이플을 든 ${opp}팀 ${withEul(pieceLabel(target.victim.type))} 타격해 퀘이플을 떨어뜨렸습니다! (+2)`),
        );
      } else {
        log = pushLog(log, mkLog(turnCount, team, `${team}팀 타격수가 ${opp}팀 ${withEul(pieceLabel(target.victim.type))} 밀쳐냈습니다! (+2)`));
      }
    } else {
      log = pushLog(log, mkLog(turnCount, team, `${team}팀 타격수가 이동했습니다.`));
    }
  } else if (mover.type === 'seeker' && game.snitch && dest.row === game.snitch.row && dest.col === game.snitch.col) {
    mover.row = dest.row;
    mover.col = dest.col;
    scores[team] += SCORES.snitchCatch;
    snitchCaught = true;
    log = pushLog(log, mkLog(turnCount, team, `${team}팀 수색꾼이 황금 스니치를 잡았습니다! 승리!`));
  } else if (quafflePos && dest.row === quafflePos.row && dest.col === quafflePos.col && mover.type === 'chaser') {
    mover.row = dest.row;
    mover.col = dest.col;
    mover.hasQuaffle = true;
    quaffleHolderId = mover.id;
    quafflePos = null;
    log = pushLog(log, mkLog(turnCount, team, `${team}팀 추격꾼이 퀘이플을 잡았습니다.`));
  } else {
    mover.row = dest.row;
    mover.col = dest.col;
    if (mover.type === 'chaser') {
      const victimHolder = survivingPieces.find((p) => p.team === opp && p.hasQuaffle && chebyshev(p, mover) === 1);
      if (victimHolder) {
        const idx = survivingPieces.findIndex((p) => p.id === victimHolder.id);
        survivingPieces = survivingPieces.map((p, i) => (i === idx ? { ...p, hasQuaffle: false } : p));
        mover.hasQuaffle = true;
        quaffleHolderId = mover.id;
        scores[team] += SCORES.steal;
        log = pushLog(log, mkLog(turnCount, team, `${team}팀 추격꾼이 퀘이플을 빼앗았습니다! (+3)`));
      } else {
        log = pushLog(log, mkLog(turnCount, team, `${team}팀 추격꾼이 이동했습니다.`));
      }
    } else {
      log = pushLog(log, mkLog(turnCount, team, `${team}팀 ${withI(pieceLabel(mover.type))} 이동했습니다.`));
    }
  }

  survivingPieces = survivingPieces.map((p) => (p.id === mover.id ? mover : p));

  const draft: QuidditchGame = {
    ...game,
    pieces: survivingPieces,
    quafflePos,
    quaffleHolderId,
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

  return endTurn(draft);
}

function pieceLabel(type: PieceType) {
  switch (type) {
    case 'keeper':
      return '파수꾼';
    case 'seeker':
      return '수색꾼';
    case 'chaser':
      return '추격꾼';
    case 'beater':
      return '타격수';
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
  return endTurn({ ...game, log });
}

export function finalizeByTimeout(game: QuidditchGame): QuidditchGame | null {
  if (game.status !== 'playing') return null;
  if (Date.now() < game.gameDeadline) return null;
  let winner: Team | 'draw';
  if (game.scores.A > game.scores.B) winner = 'A';
  else if (game.scores.B > game.scores.A) winner = 'B';
  else {
    const holder = game.pieces.find((p) => p.hasQuaffle);
    if (holder) {
      winner = holder.team;
    } else {
      // still tied and nobody's carrying the quaffle — whoever's seeker is closer to the opponent's goal wins.
      const seekerA = game.pieces.find((p) => p.team === 'A' && p.type === 'seeker');
      const seekerB = game.pieces.find((p) => p.team === 'B' && p.type === 'seeker');
      const distA = seekerA ? Math.abs(seekerA.row - goalRowOf('B')) : Infinity;
      const distB = seekerB ? Math.abs(seekerB.row - goalRowOf('A')) : Infinity;
      if (distA < distB) winner = 'A';
      else if (distB < distA) winner = 'B';
      else winner = 'draw';
    }
  }
  const log = pushLog(game.log, mkLog(game.turnCount, null, '제한 시간이 종료되었습니다.'));
  return { ...game, status: 'finished', winner, winReason: 'time', log, updatedAt: Date.now() };
}
