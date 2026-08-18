import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Letterhead from '../components/Letterhead';
import { useGame } from '../context/GameContext';
import { HOUSES, SCHOOL_NAME } from '../data/school';

const ITEMS = [
  { name: '나침반', count: 1 },
  { name: '부적', count: 2 },
  { name: '마법약', count: 2 },
  { name: '촛불', count: 1 },
];

export default function ProfilePage() {
  const game = useGame();
  const navigate = useNavigate();
  const house = HOUSES.find((h) => h.id === game.houseId);
  const initial = game.nickname ? game.nickname[0] : '?';

  return (
    <div className="flex flex-col gap-4">
      <Letterhead label="HWCF" context={SCHOOL_NAME} meta="2026.08.18 · 초승달 · 수업 3교시" />

      {game.justAssigned && house && (
        <div className="deckle-edge flex items-center justify-between gap-3 border border-seal-500/40 bg-paper-100 p-3.5">
          <p className="font-serif-kr text-sm text-ink-900">
            {house.icon} <b className="text-seal-600">{house.name}</b>에 배정되었습니다!
          </p>
          <button
            type="button"
            onClick={game.clearJustAssigned}
            className="flex-none text-xs text-ink-500/60 underline-offset-2 hover:text-ink-700 hover:underline"
          >
            확인
          </button>
        </div>
      )}

      <Card className="text-center">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink-black text-xl font-bold text-paper-50"
          style={{ boxShadow: '0 0 0 3px var(--color-paper-50), 0 0 0 4px var(--color-ink-700)' }}
        >
          {initial}
        </div>
        <p className="font-gothic mt-2 text-2xl text-ink-black">{game.nickname || '이름 없음'}</p>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          <span className="rounded-full border border-ink-700/20 bg-paper-100 px-2.5 py-1 text-[11px] font-bold text-ink-700">
            {house ? `${house.icon} ${house.name}` : '기숙사 미배정'}
          </span>
          <span className="rounded-full border border-ink-700/20 bg-paper-100 px-2.5 py-1 text-[11px] font-bold text-ink-700">
            탐구자
          </span>
        </div>

        <div className="my-4 h-px bg-ink-700/10" />

        <div className="grid grid-cols-2 gap-2 text-left text-sm">
          {ITEMS.map((it) => (
            <div key={it.name} className="rounded-sm border border-ink-700/15 bg-paper-100 px-2.5 py-1.5">
              {it.name} <b className="font-mono text-ink-red">x{it.count}</b>
            </div>
          ))}
        </div>
      </Card>

      {game.assignedHouse ? (
        <div>
          <p className="mb-2 text-xs font-bold text-ink-700/70">소속 기숙사</p>
          <Card>
            <span className="block h-2 w-8 rounded-full" style={{ backgroundColor: house?.color }} />
            <p className="mt-2 font-serif-kr font-semibold text-ink-900">
              {house?.icon} {house?.name}
            </p>
            <p className="text-xs text-ink-500/70">적성 검사를 통해 정식 배정되었습니다.</p>
          </Card>
        </div>
      ) : (
        <div>
          <p className="mb-2 text-xs font-bold text-ink-700/70">소속 기숙사 · 임시 선택</p>
          <p className="mb-2 text-[11px] text-ink-500/60">정식 배정 전까지 임시로 골라둘 수 있어요.</p>
          <div className="grid grid-cols-2 gap-3">
            {HOUSES.map((h) => {
              const selected = game.houseId === h.id;
              return (
                <button key={h.id} type="button" onClick={() => game.setHouse(h.id)} className="text-left">
                  <Card
                    className={`transition-colors ${selected ? 'ring-2 ring-seal-500/50' : 'hover:border-ink-700/30'}`}
                    style={selected ? { borderColor: h.color } : undefined}
                  >
                    <span className="block h-2 w-8 rounded-full" style={{ backgroundColor: h.color }} />
                    <p className="mt-2 font-serif-kr font-semibold text-ink-900">
                      {h.icon} {h.name}
                    </p>
                    <p className="text-xs text-ink-500/70">{h.element}</p>
                  </Card>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Button
        variant="ghost"
        onClick={() => {
          game.resetPlayer();
          navigate('/');
        }}
      >
        로그아웃
      </Button>
    </div>
  );
}
