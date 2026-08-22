import { useEffect, useRef, useState } from 'react';

type TileColor = 'white' | 'black';
type TileValue = number | 'joker';
type Turn = 'player' | 'computer';
type Phase = 'awaitingDraw' | 'awaitingJokerPlacement' | 'awaitingGuess' | 'computerTurn' | 'gameover';

interface Tile {
  id: string;
  color: TileColor;
  value: TileValue;
}

interface HandTile extends Tile {
  revealed: boolean;
}

interface GameState {
  player: HandTile[];
  computer: HandTile[];
  pool: Tile[];
  turn: Turn;
  phase: Phase;
  pendingId: string | null;
  drawnJoker: Tile | null;
  winner: Turn | null;
  log: string[];
}

function buildDeck(): Tile[] {
  const deck: Tile[] = [];
  (['white', 'black'] as TileColor[]).forEach((color) => {
    for (let v = 0; v <= 11; v++) deck.push({ id: `${color}-${v}`, color, value: v });
    deck.push({ id: `${color}-joker`, color, value: 'joker' });
  });
  return deck;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function compareNumberTiles(a: Tile, b: Tile) {
  const av = a.value as number;
  const bv = b.value as number;
  if (av !== bv) return av - bv;
  if (a.color === b.color) return 0;
  return a.color === 'black' ? -1 : 1;
}

function insertNumberTile(hand: HandTile[], tile: HandTile): HandTile[] {
  const idx = hand.findIndex((t) => t.value !== 'joker' && compareNumberTiles(tile, t) < 0);
  const at = idx === -1 ? hand.length : idx;
  const next = [...hand];
  next.splice(at, 0, tile);
  return next;
}

function insertJokerAt(hand: HandTile[], tile: HandTile, gap: number): HandTile[] {
  const next = [...hand];
  next.splice(gap, 0, tile);
  return next;
}

function tileLabel(v: TileValue) {
  return v === 'joker' ? '조커' : String(v);
}

function tileKey(t: Tile) {
  return `${t.color}-${t.value}`;
}

function isAllRevealed(hand: HandTile[]) {
  return hand.every((t) => t.revealed);
}

function rollDie() {
  return 1 + Math.floor(Math.random() * 6);
}

function boundsFor(hand: HandTile[], index: number): [number, number] {
  let lower = -1;
  for (let i = index - 1; i >= 0; i--) {
    const t = hand[i];
    if (t.revealed && t.value !== 'joker') {
      lower = t.value as number;
      break;
    }
  }
  let upper = 12;
  for (let i = index + 1; i < hand.length; i++) {
    const t = hand[i];
    if (t.revealed && t.value !== 'joker') {
      upper = t.value as number;
      break;
    }
  }
  return [lower, upper];
}

function computerChooseGuess(state: GameState): { index: number; value: TileValue } {
  const hiddenIdx = state.player.map((t, i) => (t.revealed ? -1 : i)).filter((i) => i >= 0);
  const index = hiddenIdx[Math.floor(Math.random() * hiddenIdx.length)];
  const seen = new Set<string>();
  state.computer.forEach((t) => seen.add(tileKey(t)));
  state.player.forEach((t) => {
    if (t.revealed) seen.add(tileKey(t));
  });
  const [lower, upper] = boundsFor(state.player, index);
  const candidates: TileValue[] = [];
  buildDeck().forEach((t) => {
    if (seen.has(tileKey(t))) return;
    if (t.value === 'joker') {
      candidates.push('joker');
      return;
    }
    if ((t.value as number) >= lower && (t.value as number) <= upper) candidates.push(t.value);
  });
  const value = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : Math.floor(Math.random() * 12);
  return { index, value };
}

function initGame(): GameState {
  const deck = shuffle(buildDeck());
  const numbers = deck.filter((t) => t.value !== 'joker');
  const jokers = deck.filter((t) => t.value === 'joker');
  const playerTiles = numbers.slice(0, 4).map((t) => ({ ...t, revealed: false }));
  const computerTiles = numbers.slice(4, 8).map((t) => ({ ...t, revealed: false }));
  const pool = shuffle([...numbers.slice(8), ...jokers]);

  let pDie = rollDie();
  let cDie = rollDie();
  while (pDie === cDie) {
    pDie = rollDie();
    cDie = rollDie();
  }
  const firstTurn: Turn = pDie > cDie ? 'player' : 'computer';

  return {
    player: [...playerTiles].sort(compareNumberTiles),
    computer: [...computerTiles].sort(compareNumberTiles),
    pool,
    turn: firstTurn,
    phase: firstTurn === 'player' ? 'awaitingDraw' : 'computerTurn',
    pendingId: null,
    drawnJoker: null,
    winner: null,
    log: [
      `주사위 결과 — 당신: ${pDie}, 크리스토 백작: ${cDie}`,
      firstTurn === 'player' ? '당신이 먼저 시작합니다.' : '크리스토 백작이 먼저 시작합니다.',
    ],
  };
}

function pushLog(state: GameState, line: string): GameState {
  return { ...state, log: [...state.log.slice(-40), line] };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface TileFaceProps {
  tile: HandTile;
  hidden: boolean;
  selected?: boolean;
  revealedMarker?: boolean;
  onClick?: () => void;
}

function TileFace({ tile, hidden, selected, revealedMarker, onClick }: TileFaceProps) {
  const light = tile.color === 'white';
  const clickable = !!onClick;
  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={onClick}
      className={`relative flex h-14 min-w-[22px] max-w-10 flex-1 flex-col items-center justify-center rounded-sm border-2 text-sm font-bold transition ${
        light ? 'border-ink-700/40 bg-paper-50 text-ink-900' : 'border-ink-black bg-ink-black text-paper-50'
      } ${selected ? 'ring-2 ring-seal-600 ring-offset-1' : ''} ${clickable ? 'cursor-pointer hover:opacity-80' : ''}`}
    >
      {revealedMarker && (
        <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full border border-paper-50 bg-ink-red" aria-label="상대에게 공개됨" />
      )}
      {hidden ? <span className="text-[10px] opacity-50">?</span> : <span>{tileLabel(tile.value)}</span>}
    </button>
  );
}

const GUESS_VALUES: TileValue[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 'joker'];

interface DaVinciCodeGameProps {
  onFinished: (result: 'win' | 'lose') => void;
  onExit: () => void;
}

export default function DaVinciCodeGame({ onFinished, onExit }: DaVinciCodeGameProps) {
  const [state, setState] = useState<GameState>(initGame);
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const runningRef = useRef(false);
  const finishedRef = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [state.log.length]);

  useEffect(() => {
    if (state.winner && !finishedRef.current) {
      finishedRef.current = true;
      onFinished(state.winner === 'player' ? 'win' : 'lose');
    }
  }, [state.winner, onFinished]);

  useEffect(() => {
    if (state.phase !== 'computerTurn' || runningRef.current) return;
    runningRef.current = true;

    async function run() {
      let s = state;
      await wait(700);

      if (s.pool.length > 0) {
        const [drawn, ...rest] = s.pool;
        s = pushLog({ ...s, pool: rest }, `크리스토 백작이 새 카드를 뽑았습니다.`);
        if (drawn.value === 'joker') {
          const gap = Math.floor(Math.random() * (s.computer.length + 1));
          const tile: HandTile = { ...drawn, revealed: false };
          s = { ...s, computer: insertJokerAt(s.computer, tile, gap), pendingId: tile.id };
          s = pushLog(s, '크리스토 백작이 조커를 손패에 끼워 넣습니다.');
        } else {
          const tile: HandTile = { ...drawn, revealed: false };
          s = { ...s, computer: insertNumberTile(s.computer, tile), pendingId: tile.id };
        }
        setState(s);
        await wait(500);
      } else {
        s = { ...s, pendingId: null };
      }

      let keepGuessing = true;
      while (keepGuessing) {
        await wait(900);
        const hiddenLeft = s.player.some((t) => !t.revealed);
        if (!hiddenLeft) break;

        const { index, value } = computerChooseGuess(s);
        const target = s.player[index];
        const correct = target.value === value;
        s = pushLog(
          s,
          `크리스토 백작: "${index + 1}번째 카드는 ${tileLabel(value)}이지?"`,
        );
        await wait(600);

        if (correct) {
          const nextPlayer = s.player.map((t, i) => (i === index ? { ...t, revealed: true } : t));
          s = pushLog({ ...s, player: nextPlayer }, `정답! 당신의 카드가 공개되었습니다: ${tileLabel(target.value)}`);
          setState(s);
          if (isAllRevealed(s.player)) {
            s = { ...s, winner: 'computer', phase: 'gameover' };
            s = pushLog(s, '크리스토 백작이 당신의 카드를 모두 맞혔습니다. 당신의 패배입니다.');
            setState(s);
            keepGuessing = false;
            break;
          }
          keepGuessing = Math.random() < 0.55;
          if (!keepGuessing) s = pushLog(s, '크리스토 백작이 차례를 넘깁니다.');
        } else {
          let nextComputer = s.computer;
          if (s.pendingId) {
            nextComputer = s.computer.map((t) => (t.id === s.pendingId ? { ...t, revealed: true } : t));
          }
          const revealedTile = s.pendingId ? nextComputer.find((t) => t.id === s.pendingId) : null;
          s = pushLog(
            { ...s, computer: nextComputer, pendingId: null },
            revealedTile
              ? `오답입니다. 크리스토 백작이 방금 뽑은 카드가 공개됩니다: ${tileLabel(revealedTile.value)}`
              : '오답입니다.',
          );
          setState(s);
          if (isAllRevealed(s.computer)) {
            s = { ...s, winner: 'player', phase: 'gameover' };
            s = pushLog(s, '크리스토 백작의 카드가 모두 공개되었습니다! 당신의 승리입니다.');
            setState(s);
          }
          keepGuessing = false;
        }
      }

      if (!s.winner) {
        s = { ...s, turn: 'player', phase: 'awaitingDraw', pendingId: null };
        setState(s);
      }
      runningRef.current = false;
    }

    run();
  }, [state.phase]);

  function handleDraw() {
    setState((prev) => {
      if (prev.pool.length === 0) {
        return pushLog({ ...prev, phase: 'awaitingGuess', pendingId: null }, '남은 카드가 없어 그대로 추론합니다.');
      }
      const [drawn, ...rest] = prev.pool;
      let next = { ...prev, pool: rest };
      if (drawn.value === 'joker') {
        next = { ...next, drawnJoker: drawn, phase: 'awaitingJokerPlacement' };
        return pushLog(next, '조커를 뽑았습니다! 손패의 원하는 위치에 끼워 넣으세요.');
      }
      const tile: HandTile = { ...drawn, revealed: false };
      next = { ...next, player: insertNumberTile(prev.player, tile), pendingId: tile.id, phase: 'awaitingGuess' };
      return pushLog(next, `${tileLabel(tile.value)}(${tile.color === 'white' ? '흰색' : '검은색'}) 카드를 뽑았습니다.`);
    });
  }

  function handlePlaceJoker(gap: number) {
    setState((prev) => {
      if (!prev.drawnJoker) return prev;
      const tile: HandTile = { ...prev.drawnJoker, revealed: false };
      const next = {
        ...prev,
        player: insertJokerAt(prev.player, tile, gap),
        pendingId: tile.id,
        drawnJoker: null,
        phase: 'awaitingGuess' as Phase,
      };
      return pushLog(next, '조커를 손패에 끼워 넣었습니다.');
    });
    setGuessIndex(null);
  }

  function submitGuess(value: TileValue) {
    if (guessIndex === null) return;
    setState((prev) => {
      const target = prev.computer[guessIndex];
      if (!target || target.revealed) return prev;
      const correct = target.value === value;
      if (correct) {
        const nextComputer = prev.computer.map((t, i) => (i === guessIndex ? { ...t, revealed: true } : t));
        let next = pushLog({ ...prev, computer: nextComputer }, `정답입니다! 크리스토 백작의 카드: ${tileLabel(target.value)}`);
        if (isAllRevealed(nextComputer)) {
          next = { ...next, winner: 'player', phase: 'gameover' };
          next = pushLog(next, '크리스토 백작의 카드를 모두 맞혔습니다! 당신의 승리입니다.');
        }
        return next;
      }
      let nextPlayer = prev.player;
      if (prev.pendingId) {
        nextPlayer = prev.player.map((t) => (t.id === prev.pendingId ? { ...t, revealed: true } : t));
      }
      const revealedTile = prev.pendingId ? nextPlayer.find((t) => t.id === prev.pendingId) : null;
      let next = pushLog(
        { ...prev, player: nextPlayer, pendingId: null },
        revealedTile ? `오답입니다. 방금 뽑은 카드가 공개됩니다: ${tileLabel(revealedTile.value)}` : '오답입니다.',
      );
      if (isAllRevealed(nextPlayer)) {
        next = { ...next, winner: 'computer', phase: 'gameover' };
        next = pushLog(next, '당신의 카드가 모두 공개되었습니다. 패배입니다.');
      } else {
        next = { ...next, turn: 'computer', phase: 'computerTurn' };
      }
      return next;
    });
    setGuessIndex(null);
  }

  function passTurn() {
    setState((prev) => pushLog({ ...prev, turn: 'computer', phase: 'computerTurn', pendingId: null }, '차례를 넘깁니다.'));
    setGuessIndex(null);
  }

  const isPlayerTurn = state.turn === 'player' && state.phase !== 'gameover';
  const justGuessedCorrectly = state.phase === 'awaitingGuess' && guessIndex === null && state.turn === 'player';

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-sm border border-ink-700/15 bg-paper-100/50 p-3">
        <p className="mb-1.5 text-center text-[11px] font-bold text-ink-700/70">크리스토 백작의 패 (남은 카드: {state.pool.length}장)</p>
        <div className="flex w-full justify-center gap-1">
          {state.computer.map((t, i) => (
            <TileFace
              key={t.id}
              tile={t}
              hidden={!t.revealed}
              selected={guessIndex === i}
              onClick={
                isPlayerTurn && state.phase === 'awaitingGuess' && !t.revealed
                  ? () => setGuessIndex(guessIndex === i ? null : i)
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      <div ref={logRef} className="flex max-h-32 flex-col gap-1 overflow-y-auto rounded-sm border border-ink-700/15 bg-paper-50 p-2.5">
        {state.log.map((line, i) => (
          <p key={i} className="text-[11px] leading-relaxed text-ink-700/80">
            {line}
          </p>
        ))}
      </div>

      {state.turn === 'player' && state.phase === 'awaitingGuess' && guessIndex !== null && (
        <div className="flex flex-col gap-1.5 rounded-sm border border-seal-500/30 bg-paper-100/60 p-2.5">
          <p className="text-center text-xs font-bold text-seal-600">몇 번일까요?</p>
          <div className="flex flex-wrap justify-center gap-1">
            {GUESS_VALUES.map((v) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => submitGuess(v)}
                className="tablet-btn rounded-sm px-2.5 py-1 text-xs font-bold"
              >
                {tileLabel(v)}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setGuessIndex(null)} className="self-center text-[11px] text-ink-500/60 underline-offset-2 hover:underline">
            취소
          </button>
        </div>
      )}

      {justGuessedCorrectly && state.pendingId === null && (
        <button type="button" onClick={passTurn} className="tablet-btn tablet-btn-ghost self-center px-4 py-1.5 text-xs font-bold">
          차례 넘기기
        </button>
      )}

      <div className="rounded-sm border border-ink-700/15 bg-paper-100/50 p-3">
        <div className="mb-1.5 flex items-center justify-center gap-2">
          <p className="text-center text-[11px] font-bold text-ink-700/70">내 패</p>
          <span className="flex items-center gap-1 font-mono text-[10px] text-ink-500/60">
            <span className="h-2 w-2 rounded-full border border-paper-50 bg-ink-red" /> 상대에게 공개됨
          </span>
        </div>
        <div className="flex w-full justify-center gap-1">
          {state.player.map((t) => (
            <TileFace key={t.id} tile={t} hidden={false} revealedMarker={t.revealed} />
          ))}
        </div>
      </div>

      {state.turn === 'player' && state.phase === 'awaitingJokerPlacement' && (
        <div className="rounded-sm border border-seal-500/30 bg-paper-100/60 p-2.5">
          <p className="mb-1.5 text-center text-xs font-bold text-seal-600">조커를 어디에 놓을까요?</p>
          <div className="flex flex-wrap justify-center gap-1">
            {Array.from({ length: state.player.length + 1 }).map((_, gap) => (
              <button key={gap} type="button" onClick={() => handlePlaceJoker(gap)} className="tablet-btn rounded-sm px-2.5 py-1 text-xs font-bold">
                {gap + 1}번째 자리
              </button>
            ))}
          </div>
        </div>
      )}

      {state.turn === 'player' && state.phase === 'awaitingDraw' && (
        <button type="button" onClick={handleDraw} className="tablet-btn tablet-btn-dark self-center px-5 py-2.5 text-sm font-bold">
          카드 가져오기
        </button>
      )}

      {state.phase === 'gameover' && (
        <div className="flex flex-col items-center gap-2 rounded-sm border border-seal-500/30 bg-paper-100/60 p-3.5">
          <p className="font-serif-kr text-base font-bold text-ink-900">
            {state.winner === 'player' ? '승리했습니다! 주문력 +5' : '크리스토 백작에게 패배했습니다.'}
          </p>
          <button type="button" onClick={onExit} className="tablet-btn tablet-btn-dark px-5 py-2 text-sm font-bold">
            도서관 나가기
          </button>
        </div>
      )}

      {state.phase !== 'gameover' && (
        <button type="button" onClick={onExit} className="self-center text-[11px] text-ink-500/50 underline-offset-2 hover:underline">
          게임 그만두기
        </button>
      )}
    </div>
  );
}
