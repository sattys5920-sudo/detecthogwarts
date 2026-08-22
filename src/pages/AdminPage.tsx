import { useNavigate } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel';
import Button from '../components/Button';
import Card from '../components/Card';
import PaperTexture from '../components/PaperTexture';
import { useGame } from '../context/GameContext';

export default function AdminPage() {
  const game = useGame();
  const navigate = useNavigate();

  if (!game.isAdmin) {
    return (
      <div className="relative flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <PaperTexture />
        <Card className="w-full max-w-xs text-left">
          <p className="font-gothic text-2xl text-ink-black">관리자 페이지</p>
          <p className="mt-1 text-sm text-ink-700/70">
            관리자 권한이 없습니다. 처음 화면의 &lsquo;관리자이신가요?&rsquo;로 입장해 주세요.
          </p>
          <Button className="mt-4 w-full" onClick={() => navigate('/')}>
            처음 화면으로
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-svh px-4 py-8">
      <PaperTexture />
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <Card className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink-700/80">관리자 권한이 켜져 있습니다. 이야기 진행은 탐사 활동 탭에서 합니다.</p>
          <Button onClick={() => navigate('/exploration')} className="flex-none px-4 py-2 text-xs">
            탐사 활동으로 →
          </Button>
        </Card>

        <AdminPanel />
      </div>
    </div>
  );
}
