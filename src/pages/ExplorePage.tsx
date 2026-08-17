import Card from '../components/Card';
import SceneBanner from '../components/SceneBanner';

export default function ExplorePage() {
  return (
    <div className="flex flex-col gap-5">
      <SceneBanner title="탐험" subtitle="학교 곳곳을 둘러보세요" from="#1f2e26" to="#3f9c74" icon="🧭" />

      <Card className="text-center text-sm text-parchment-200/50">
        곧 탐험할 수 있는 장소가 열립니다.
      </Card>
    </div>
  );
}
