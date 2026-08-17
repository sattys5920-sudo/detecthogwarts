import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Letterhead from '../components/Letterhead';
import { useGame } from '../context/GameContext';
import { HOUSES, SCHOOL_NAME } from '../data/school';

const STATS = [
  { label: '마력', value: 72 },
  { label: '담력', value: 45 },
  { label: '지식', value: 88 },
];

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
            {house ? house.name : '기숙사 미배정'}
          </span>
          <span className="rounded-full border border-ink-700/20 bg-paper-100 px-2.5 py-1 text-[11px] font-bold text-ink-700">
            탐구자
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2 text-left">
          {STATS.map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-xs">
              <span className="w-8 flex-none text-ink-500/70">{s.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full border border-ink-700/15 bg-paper-200">
                <div className="h-full bg-ink-black" style={{ width: `${s.value}%` }} />
              </div>
              <span className="w-6 flex-none text-right font-mono text-ink-red">{s.value}</span>
            </div>
          ))}
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
