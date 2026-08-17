import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Flourish from '../components/Flourish';
import Footprints from '../components/Footprints';
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
    navigate('/main');
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-8 px-6 text-center">
      <PaperTexture />
      <Footprints />

      <div>
        <div className="relative mx-auto flex h-44 w-full max-w-[300px] items-center justify-center">
          <InkBlot className="absolute inset-0 h-full w-full" />
          <h1 className="relative font-stamp text-6xl text-paper-50">HWCF</h1>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2 text-ink-500/50">
          <Flourish className="h-5 w-12" />
          <h2 className="font-display text-xl text-ink-900">{SCHOOL_NAME}</h2>
          <Flourish className="h-5 w-12" flip />
        </div>
        <p className="mt-2 font-serif-kr text-sm text-ink-700/70">
          입학을 환영합니다. 이름을 알려주시면 문이 열립니다.
        </p>
      </div>

      {game.hasEntered ? (
        <Card className="w-full max-w-xs rotate-[-0.6deg]">
          <p className="font-serif-kr text-sm text-ink-700/80">
            다시 오셨군요, <span className="font-semibold text-seal-600">{game.nickname}</span>님.
          </p>
          <Button className="mt-4 w-full" onClick={() => navigate('/main')}>
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
        <Card className="w-full max-w-xs rotate-[-0.6deg] text-left">
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
