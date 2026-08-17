import Card from '../components/Card';
import Letterhead from '../components/Letterhead';
import { SCHOOL_NAME } from '../data/school';

export default function ShopPage() {
  return (
    <div className="flex flex-col gap-4">
      <Letterhead label="HWCF" context={SCHOOL_NAME} meta="교내 상점" />
      <Card className="text-center text-sm text-ink-500/60">곧 상점에서 물품을 구매할 수 있어요.</Card>
    </div>
  );
}
