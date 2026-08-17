import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import RequireGame from '../components/RequireGame';
import { useGame } from '../context/GameContext';
import { CLUES, LOCATIONS } from '../data/story';

export default function LocationPage() {
  const { locationId } = useParams();
  const game = useGame();
  const [revealed, setRevealed] = useState<string[]>([]);

  const location = LOCATIONS.find((l) => l.id === locationId);
  if (!location) return <Navigate to="/investigate" replace />;

  const clues = location.clueIds.map((id) => CLUES.find((c) => c.id === id)!).filter(Boolean);

  return (
    <RequireGame>
      <Link to="/investigate" className="font-serif-kr text-sm text-gold-400/80 hover:text-gold-300">
        ← 조사 장소로 돌아가기
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-4xl">{location.icon}</span>
        <div>
          <h1 className="font-display text-2xl text-parchment-100">{location.name}</h1>
          <p className="font-serif-kr text-sm text-parchment-200/70">{location.description}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {clues.map((clue) => {
          const isRevealed = revealed.includes(clue.id) || game.discoveredClueIds.includes(clue.id);
          return (
            <Card key={clue.id} className={isRevealed ? 'border-gold-400/40' : ''}>
              {isRevealed ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{clue.icon}</span>
                    <h3 className="font-serif-kr font-semibold text-gold-300">{clue.name}</h3>
                  </div>
                  <p className="mt-2 text-sm text-parchment-200/80">{clue.description}</p>
                </>
              ) : (
                <button
                  type="button"
                  className="flex w-full flex-col items-center gap-2 py-4 text-center"
                  onClick={() => {
                    setRevealed((r) => [...r, clue.id]);
                    game.discoverClue(clue.id);
                  }}
                >
                  <span className="text-2xl opacity-60">🔎</span>
                  <span className="font-serif-kr text-sm text-parchment-200/70">
                    자세히 살펴보기
                  </span>
                </button>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <Link to="/investigate">
          <Button variant="secondary">다른 장소 조사하기</Button>
        </Link>
      </div>
    </RequireGame>
  );
}
