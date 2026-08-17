import { Link } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import RequireGame from '../components/RequireGame';
import { useGame } from '../context/GameContext';
import { CLUES } from '../data/story';

export default function NotebookPage() {
  const game = useGame();
  const discovered = CLUES.filter((c) => game.discoveredClueIds.includes(c.id));
  const remaining = CLUES.length - discovered.length;

  return (
    <RequireGame>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl text-gold-300">수사 노트</h1>
          <p className="mt-1 font-serif-kr text-sm text-parchment-200/70">
            지금까지 확보한 단서 {discovered.length} / {CLUES.length}
          </p>
        </div>
        {game.discoveredClueIds.length > 0 && (
          <Link to="/accusation">
            <Button variant="secondary">범인 지목하기</Button>
          </Link>
        )}
      </div>

      {discovered.length === 0 ? (
        <Card className="mt-6 text-center text-sm text-parchment-200/60">
          아직 확보한 단서가 없습니다. 장소를 조사하거나 용의자와 대화해 보세요.
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {discovered.map((clue) => (
            <Card key={clue.id} className={clue.isKeyEvidence ? 'border-gold-400/50' : ''}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{clue.icon}</span>
                <h3 className="font-serif-kr font-semibold text-parchment-100">{clue.name}</h3>
                {clue.isKeyEvidence && (
                  <span className="ml-auto rounded-full bg-gold-500/20 px-2 py-0.5 text-[10px] text-gold-300">
                    핵심 단서
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-parchment-200/80">{clue.description}</p>
              <p className="mt-2 text-xs text-parchment-200/40">출처: {clue.sourceLabel}</p>
            </Card>
          ))}
        </div>
      )}

      {remaining > 0 && (
        <p className="mt-6 text-center text-xs text-parchment-200/40">
          아직 발견하지 못한 단서가 {remaining}개 더 있습니다.
        </p>
      )}
    </RequireGame>
  );
}
