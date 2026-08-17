import Card from '../components/Card';
import SceneBanner from '../components/SceneBanner';
import { useGame } from '../context/GameContext';
import { HOUSES } from '../data/school';

export default function MainPage() {
  const game = useGame();
  const house = HOUSES.find((h) => h.id === game.houseId);

  return (
    <div className="flex flex-col gap-5">
      <SceneBanner
        title="메인"
        subtitle={`${game.nickname}님, 어서 오세요`}
        from="#1b1836"
        to="#4a3d84"
        icon="🏰"
      />

      {!house && (
        <Card>
          <p className="font-serif-kr text-sm text-parchment-200/80">
            아직 소속된 기숙사가 없어요. 기숙사 탭에서 골라보세요.
          </p>
        </Card>
      )}

      <Card className="text-center text-sm text-parchment-200/50">
        곧 이곳에 오늘의 소식이 채워질 예정입니다.
      </Card>
    </div>
  );
}
