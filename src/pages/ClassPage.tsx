import Card from '../components/Card';
import Letterhead from '../components/Letterhead';
import { SCHOOL_NAME } from '../data/school';

export default function ClassPage() {
  return (
    <div className="flex flex-col gap-4">
      <Letterhead label="HWCF" context={SCHOOL_NAME} meta="수업 시간표" />
      <Card className="text-center text-sm text-ink-500/60">곧 수업 시간표와 과제가 열립니다.</Card>
    </div>
  );
}
