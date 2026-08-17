import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import RequireGame from '../components/RequireGame';
import { useGame } from '../context/GameContext';
import { CASE_TITLE, SOLUTION, SUSPECTS } from '../data/story';

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}분 ${s.toString().padStart(2, '0')}초`;
}

export default function ResultPage() {
  const game = useGame();
  const navigate = useNavigate();
  const location = useLocation();
  const solved = Boolean((location.state as { solved?: boolean } | null)?.solved);
  const culprit = SUSPECTS.find((s) => s.id === SOLUTION.culpritId)!;

  return (
    <RequireGame>
      <div className="mx-auto max-w-xl text-center">
        <p className="font-serif-kr text-xs tracking-[0.05em] text-gold-400/70">{CASE_TITLE}</p>
        <h1 className="font-display mt-2 text-3xl text-parchment-100">
          {solved ? '사건을 해결했습니다' : '사건은 미궁으로'}
        </h1>

        <Card className="mt-6 text-left">
          <p className="font-serif-kr text-sm font-semibold text-gold-300">
            진범: {culprit.emblem} {culprit.name}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-parchment-200/80">{SOLUTION.motive}</p>
        </Card>

        <div className="mt-6 flex flex-col items-center gap-1 text-sm text-parchment-200/70">
          <p>
            탐정 <span className="text-gold-300">{game.nickname}</span> 님의 기록
          </p>
          <p className="font-mono text-lg tabular-nums text-parchment-100">
            {formatTime(game.elapsedSeconds)}
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => navigate('/leaderboard')}>명예의 전당 보기</Button>
          <Button
            variant="secondary"
            onClick={() => {
              game.resetGame();
              navigate('/');
            }}
          >
            다시 플레이하기
          </Button>
        </div>
      </div>
    </RequireGame>
  );
}
