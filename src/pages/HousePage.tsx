import Card from '../components/Card';
import SceneBanner from '../components/SceneBanner';
import { useGame } from '../context/GameContext';
import { HOUSES } from '../data/school';

export default function HousePage() {
  const game = useGame();
  const house = HOUSES.find((h) => h.id === game.houseId);

  return (
    <div className="flex flex-col gap-5">
      <SceneBanner
        title="기숙사"
        subtitle={house ? `소속: ${house.name}` : '기숙사를 선택하세요'}
        accent={house?.color ?? '#6b1d2a'}
        icon="🛡️"
      />

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
                <p className="mt-2 font-serif-kr font-semibold text-ink-900">{h.name}</p>
                <p className="text-xs text-ink-500/70">{h.element}</p>
              </Card>
            </button>
          );
        })}
      </div>

      {house && (
        <Card className="text-center">
          <p className="font-serif-kr text-sm text-ink-700/80">
            현재 <span className="font-semibold" style={{ color: house.color }}>{house.name}</span> 소속입니다.
          </p>
        </Card>
      )}
    </div>
  );
}
