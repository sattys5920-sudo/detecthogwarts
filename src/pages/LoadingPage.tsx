import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Starfield from '../components/Starfield';
import { useGame } from '../context/GameContext';
import { SCHOOL_NAME } from '../data/school';

export default function LoadingPage() {
  const game = useGame();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  function handleEnter() {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError('이름을 입력해 주세요.');
      return;
    }
    if (trimmed.length > 12) {
      setError('이름은 12자 이내로 입력해 주세요.');
      return;
    }
    game.enterApp(trimmed);
    navigate('/main');
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-8 px-6 text-center">
      <Starfield count={70} />

      <div>
        <span className="text-4xl">✦</span>
        <h1 className="font-display mt-3 text-3xl text-parchment-100">{SCHOOL_NAME}</h1>
        <p className="mt-2 font-serif-kr text-sm text-parchment-200/70">
          입학을 환영합니다. 이름을 알려주시면 문이 열립니다.
        </p>
      </div>

      {game.hasEntered ? (
        <Card className="w-full max-w-xs">
          <p className="font-serif-kr text-sm text-parchment-200/70">
            다시 오셨군요, <span className="font-semibold text-gold-300">{game.nickname}</span>님.
          </p>
          <Button className="mt-4 w-full" onClick={() => navigate('/main')}>
            계속하기
          </Button>
          <button
            type="button"
            className="mt-3 text-xs text-parchment-200/40 underline-offset-2 hover:text-parchment-200/70 hover:underline"
            onClick={game.resetPlayer}
          >
            다른 이름으로 시작하기
          </button>
        </Card>
      ) : (
        <Card className="w-full max-w-xs text-left">
          <label className="block font-serif-kr text-sm text-parchment-200/80">
            이름
            <input
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
              placeholder="이름을 입력하세요"
              maxLength={12}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-arcane-950/60 px-3 py-2 text-parchment-100 outline-none focus:border-gold-400"
            />
          </label>
          {error && <p className="mt-2 text-xs text-ember-500">{error}</p>}
          <Button className="mt-4 w-full" onClick={handleEnter}>
            입장하기
          </Button>
        </Card>
      )}
    </div>
  );
}
