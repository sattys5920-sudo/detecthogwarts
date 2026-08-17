import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import SceneBanner from '../components/SceneBanner';
import { useGame } from '../context/GameContext';
import { HOUSES } from '../data/school';

function formatDate(ts: number | null) {
  if (!ts) return '-';
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function ProfilePage() {
  const game = useGame();
  const navigate = useNavigate();
  const house = HOUSES.find((h) => h.id === game.houseId);

  return (
    <div className="flex flex-col gap-5">
      <SceneBanner title="프로필" subtitle="나의 신분증" from="#2b0f14" to="#7a2f2f" icon="🎫" />

      <Card className="relative overflow-hidden border-gold-500/40 bg-gradient-to-br from-[#2b0f14] to-[#4a1a1f]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-serif-kr text-xs uppercase tracking-wide text-gold-300/70">
              아르카눔 마법학교 학생증
            </p>
            <p className="font-display mt-1 text-xl text-parchment-100">{game.nickname || '이름 없음'}</p>
          </div>
          <span className="text-3xl">🎫</span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-gold-500/20 pt-3 text-sm">
          <span className="font-serif-kr" style={{ color: house?.color ?? '#f2d38a' }}>
            {house ? house.name : '기숙사 미배정'}
          </span>
          <span className="text-xs text-parchment-200/50">입학일 {formatDate(game.joinedAt)}</span>
        </div>
      </Card>

      <Card className="text-center text-sm text-parchment-200/50">더 많은 정보가 곧 채워질 예정입니다.</Card>

      <Button
        variant="ghost"
        onClick={() => {
          game.resetPlayer();
          navigate('/');
        }}
      >
        로그아웃
      </Button>
    </div>
  );
}
