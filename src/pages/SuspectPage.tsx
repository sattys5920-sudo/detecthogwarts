import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import RequireGame from '../components/RequireGame';
import { useGame } from '../context/GameContext';
import { CLUES, SUSPECTS } from '../data/story';

export default function SuspectPage() {
  const { suspectId } = useParams();
  const game = useGame();
  const [openDialogueId, setOpenDialogueId] = useState<string | null>(null);

  const suspect = SUSPECTS.find((s) => s.id === suspectId);
  if (!suspect) return <Navigate to="/investigate" replace />;

  return (
    <RequireGame>
      <Link to="/investigate" className="font-serif-kr text-sm text-gold-400/80 hover:text-gold-300">
        ← 용의자 목록으로 돌아가기
      </Link>

      <div className="mt-4 flex items-start gap-4">
        <span className="text-5xl">{suspect.emblem}</span>
        <div>
          <h1 className="font-display text-2xl text-parchment-100">{suspect.name}</h1>
          <p className="font-serif-kr text-sm text-parchment-200/70">
            {suspect.role} · {suspect.house}
          </p>
        </div>
      </div>

      <Card className="mt-5">
        <p className="text-sm text-parchment-200/80">{suspect.summary}</p>
        <p className="mt-3 border-t border-white/10 pt-3 text-sm italic text-parchment-200/60">
          알리바이: {suspect.alibi}
        </p>
      </Card>

      <div className="mt-6 flex flex-col gap-3">
        {suspect.dialogues.map((d) => {
          const asked = game.askedDialogueIds.includes(d.id);
          const isOpen = openDialogueId === d.id;
          return (
            <Card key={d.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 text-left"
                onClick={() => {
                  setOpenDialogueId(isOpen ? null : d.id);
                  game.markDialogueAsked(d.id);
                  if (d.unlocksClueId) game.discoverClue(d.unlocksClueId);
                }}
              >
                <span className="font-serif-kr text-sm font-medium text-parchment-100">
                  {asked ? '✓ ' : '💬 '}
                  {d.question}
                </span>
                <span className="text-xs text-parchment-200/50">{isOpen ? '접기' : '묻기'}</span>
              </button>
              {isOpen && (
                <p className="mt-3 border-t border-white/10 pt-3 text-sm text-parchment-200/80">
                  {d.answer}
                </p>
              )}
              {isOpen && d.unlocksClueId && (
                <p className="mt-2 text-xs text-gold-400">
                  ✦ 새 단서 확보: {CLUES.find((c) => c.id === d.unlocksClueId)?.name}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <Link to="/investigate">
          <Button variant="secondary">다른 용의자 만나기</Button>
        </Link>
      </div>
    </RequireGame>
  );
}
