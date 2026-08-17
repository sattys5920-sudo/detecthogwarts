import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import InkBlot from '../components/InkBlot';
import PaperTexture from '../components/PaperTexture';
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
    navigate('/notices');
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-8 px-6 text-center">
      <PaperTexture />
      <InkBlot className="pointer-events-none absolute -top-4 -right-10 h-32 w-44 text-ink-black/90" />

      <div className="relative max-w-xs">
        <p className="font-mono text-xs tracking-[0.15em] text-seal-600">CASE FILES</p>
        <h1 className="font-gothic mt-1 text-5xl leading-none text-ink-black">HWCF</h1>
        <p className="mt-2 font-serif-kr text-lg font-bold text-ink-900">{SCHOOL_NAME}</p>
        <p className="mt-2 font-serif-kr text-sm text-ink-700/70">
          입학을 환영합니다. 이름을 알려주시면 문이 열립니다.
        </p>
      </div>

      {game.hasEntered ? (
        <Card className="relative w-full max-w-xs">
          <p className="font-serif-kr text-sm text-ink-700/80">
            다시 오셨군요, <span className="font-semibold text-seal-600">{game.nickname}</span>님.
          </p>
          <Button className="mt-4 w-full" onClick={() => navigate('/notices')}>
            계속하기
          </Button>
          <button
            type="button"
            className="mt-3 text-xs text-ink-500/50 underline-offset-2 hover:text-ink-700 hover:underline"
            onClick={game.resetPlayer}
          >
            다른 이름으로 시작하기
          </button>
        </Card>
      ) : (
        <Card className="relative w-full max-w-xs text-left">
          <label className="block font-serif-kr text-sm text-ink-700/80">
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
              className="mt-1.5 w-full rounded-lg border border-ink-700/20 bg-paper-100/60 px-3 py-2 text-ink-900 outline-none placeholder:text-ink-500/40 focus:border-seal-500"
            />
          </label>
          {error && <p className="mt-2 text-xs text-seal-600">{error}</p>}
          <Button className="mt-4 w-full" onClick={handleEnter}>
            입장하기
          </Button>
        </Card>
      )}
    </div>
  );
}
