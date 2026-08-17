import Card from '../components/Card';
import SceneBanner from '../components/SceneBanner';

export default function ExplorePage() {
  return (
    <div className="flex flex-col gap-5">
      <SceneBanner title="탐험" subtitle="학교 곳곳을 둘러보세요" accent="#2f7a56" icon="🧭" />

      <Card className="text-center text-sm text-ink-500/60">
        곧 탐험할 수 있는 장소가 열립니다.
      </Card>
    </div>
  );
}
