import { Link } from 'react-router-dom';
import Card from '../components/Card';
import RequireGame from '../components/RequireGame';
import { useGame } from '../context/GameContext';
import { LOCATIONS, SUSPECTS } from '../data/story';

export default function InvestigatePage() {
  const game = useGame();

  return (
    <RequireGame>
      <div className="flex flex-col gap-10">
        <div>
          <h1 className="font-display text-2xl text-gold-300">조사 장소</h1>
          <p className="mt-1 font-serif-kr text-sm text-parchment-200/70">
            장소를 둘러보며 사건의 흔적을 찾아보세요.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {LOCATIONS.map((loc) => {
              const found = loc.clueIds.filter((id) => game.discoveredClueIds.includes(id)).length;
              return (
                <Link key={loc.id} to={`/investigate/${loc.id}`}>
                  <Card className="h-full transition-transform hover:-translate-y-0.5 hover:border-gold-400/50">
                    <div className="flex items-start justify-between">
                      <span className="text-3xl">{loc.icon}</span>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-parchment-200/60">
                        {found}/{loc.clueIds.length} 단서
                      </span>
                    </div>
                    <h2 className="mt-3 font-serif-kr text-lg font-semibold text-parchment-100">
                      {loc.name}
                    </h2>
                    <p className="mt-1 text-sm text-parchment-200/70">{loc.description}</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <h1 className="font-display text-2xl text-gold-300">용의자</h1>
          <p className="mt-1 font-serif-kr text-sm text-parchment-200/70">
            대화를 통해 알리바이와 진술을 확인하세요.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {SUSPECTS.map((s) => {
              const asked = s.dialogues.filter((d) => game.askedDialogueIds.includes(d.id)).length;
              return (
                <Link key={s.id} to={`/suspects/${s.id}`}>
                  <Card className="h-full transition-transform hover:-translate-y-0.5 hover:border-gold-400/50">
                    <div className="flex items-start justify-between">
                      <span className="text-3xl">{s.emblem}</span>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-parchment-200/60">
                        {asked}/{s.dialogues.length} 질문
                      </span>
                    </div>
                    <h2 className="mt-3 font-serif-kr text-lg font-semibold text-parchment-100">
                      {s.name}
                    </h2>
                    <p className="mt-1 text-sm text-parchment-200/70">{s.role}</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </RequireGame>
  );
}
