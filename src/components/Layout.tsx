import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { CLUES, HOUSES, SCHOOL_NAME } from '../data/story';
import Starfield from './Starfield';

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const NAV_ITEMS = [
  { to: '/investigate', label: '조사하기' },
  { to: '/notebook', label: '수사 노트' },
  { to: '/accusation', label: '지목하기' },
  { to: '/leaderboard', label: '명예의 전당' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const game = useGame();
  const house = HOUSES.find((h) => h.id === game.houseId);

  return (
    <div className="relative min-h-svh">
      <Starfield />
      <header className="sticky top-0 z-20 border-b border-white/5 bg-arcane-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="font-display text-lg text-gold-300">
            ✦ {SCHOOL_NAME}
          </Link>

          {game.isStarted && (
            <nav className="flex flex-wrap items-center gap-1 text-sm">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative rounded-full px-3 py-1.5 font-serif-kr transition-colors ${
                    pathname.startsWith(item.to)
                      ? 'bg-gold-500/15 text-gold-300'
                      : 'text-parchment-200/80 hover:text-gold-300'
                  }`}
                >
                  {item.label}
                  {item.to === '/notebook' && game.discoveredClueIds.length > 0 && (
                    <span className="ml-1 rounded-full bg-gold-500 px-1.5 py-0.5 text-[10px] font-bold text-arcane-950">
                      {game.discoveredClueIds.length}/{CLUES.length}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          )}

          {game.isStarted && (
            <div className="flex items-center gap-3 text-xs text-parchment-200/70">
              <span style={{ color: house?.color }} className="font-serif-kr font-semibold">
                {house?.name} · {game.nickname}
              </span>
              <span className="rounded-full border border-white/10 px-2 py-1 font-mono tabular-nums">
                ⏱ {formatTime(game.elapsedSeconds)}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>

      <footer className="mx-auto max-w-5xl px-4 pb-8 pt-4 text-center text-xs text-parchment-200/40">
        아르카눔 마법학교 수사부 · 원작 사건과 무관한 창작 미스터리입니다.
      </footer>
    </div>
  );
}
