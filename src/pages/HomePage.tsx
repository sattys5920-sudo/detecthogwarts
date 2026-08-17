import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Starfield from '../components/Starfield';
import { useGame } from '../context/GameContext';
import { CASE_TITLE, HOUSES, SCHOOL_NAME } from '../data/story';

export default function HomePage() {
  const game = useGame();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [houseId, setHouseId] = useState(HOUSES[0].id);
  const [error, setError] = useState('');

  function handleStart() {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError('탐정 이름을 입력해 주세요.');
      return;
    }
    if (trimmed.length > 12) {
      setError('이름은 12자 이내로 입력해 주세요.');
      return;
    }
    game.startGame(trimmed, houseId);
    navigate('/prologue');
  }

  function handleContinue() {
    navigate('/investigate');
  }

  return (
    <div className="relative flex min-h-[calc(100svh-8rem)] flex-col items-center justify-center gap-8 text-center">
      <Starfield count={90} />

      <div>
        <p className="font-serif-kr text-sm tracking-[0.05em] text-gold-400/80">{SCHOOL_NAME}</p>
        <h1 className="font-display mt-3 text-4xl leading-tight text-parchment-100 sm:text-5xl">
          {CASE_TITLE}
        </h1>
        <p className="mx-auto mt-4 max-w-md font-serif-kr text-parchment-200/80">
          별빛 축제 전날 밤, 학교의 보물이 사라졌습니다.
          <br />
          당신은 수사부의 탐정으로서 진실을 밝혀야 합니다.
        </p>
      </div>

      {game.isStarted ? (
        <Card className="w-full max-w-sm text-left">
          <p className="font-serif-kr text-sm text-parchment-200/70">
            돌아오신 걸 환영합니다,{' '}
            <span className="font-semibold text-gold-300">{game.nickname}</span> 탐정님.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button onClick={handleContinue}>수사 이어하기</Button>
            <Button variant="ghost" onClick={game.resetGame}>
              처음부터 새로 시작
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="w-full max-w-sm text-left">
          <label className="block font-serif-kr text-sm text-parchment-200/80">
            탐정 이름
            <input
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError('');
              }}
              placeholder="예: 셜록"
              maxLength={12}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-arcane-950/60 px-3 py-2 text-parchment-100 outline-none focus:border-gold-400"
            />
          </label>

          <fieldset className="mt-4">
            <legend className="font-serif-kr text-sm text-parchment-200/80">소속 탑 선택</legend>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {HOUSES.map((house) => (
                <button
                  key={house.id}
                  type="button"
                  onClick={() => setHouseId(house.id)}
                  className={`rounded-lg border px-3 py-2 text-left font-serif-kr text-xs transition-colors ${
                    houseId === house.id
                      ? 'border-gold-400 bg-gold-500/15 ring-2 ring-gold-400/40'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <span className="block font-semibold" style={{ color: house.color }}>
                    {house.name}
                  </span>
                  <span className="text-parchment-200/60">{house.element}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {error && <p className="mt-3 text-xs text-ember-500">{error}</p>}

          <Button className="mt-5 w-full" onClick={handleStart}>
            수사 시작하기
          </Button>
        </Card>
      )}
    </div>
  );
}
