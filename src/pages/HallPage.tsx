import Card from '../components/Card';
import SceneBanner from '../components/SceneBanner';

export default function HallPage() {
  return (
    <div className="flex flex-col gap-5">
      <SceneBanner title="강당" subtitle="학교 소식과 랭킹" from="#3a1f1f" to="#c9603a" icon="🕯️" />

      <Card className="text-center text-sm text-parchment-200/50">
        곧 이곳에서 공지사항과 랭킹을 확인할 수 있어요.
      </Card>
    </div>
  );
}
