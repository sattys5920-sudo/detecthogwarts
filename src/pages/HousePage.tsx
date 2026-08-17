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
        from={house?.color ?? '#262047'}
        to={house?.accent ?? '#8b7bd8'}
        icon="🛡️"
      />

      <div className="grid grid-cols-2 gap-3">
        {HOUSES.map((h) => {
          const selected = game.houseId === h.id;
          return (
            <button key={h.id} type="button" onClick={() => game.setHouse(h.id)} className="text-left">
              <Card
                className={`transition-colors ${
                  selected ? 'ring-2 ring-gold-400/50' : 'hover:border-white/25'
                }`}
                style={selected ? { borderColor: h.color } : undefined}
              >
                <span className="block h-2 w-8 rounded-full" style={{ backgroundColor: h.color }} />
                <p className="mt-2 font-serif-kr font-semibold text-parchment-100">{h.name}</p>
                <p className="text-xs text-parchment-200/60">{h.element}</p>
              </Card>
            </button>
          );
        })}
      </div>

      {house && (
        <Card className="text-center">
          <p className="font-serif-kr text-sm text-parchment-200/70">
            현재 <span className="font-semibold" style={{ color: house.color }}>{house.name}</span> 소속입니다.
          </p>
        </Card>
      )}
    </div>
  );
}
