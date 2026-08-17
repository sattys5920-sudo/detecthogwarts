import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Crest from '../components/Crest';
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
      <SceneBanner title="프로필" subtitle="나의 신분증" accent="#4a1420" icon="🎫" />

      <Card className="relative overflow-hidden rotate-[-0.6deg]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-serif-kr text-xs uppercase tracking-wide text-ink-500/60">
              아르카눔 마법학교 학생증
            </p>
            <p className="font-display mt-1 text-2xl text-ink-900">{game.nickname || '이름 없음'}</p>
          </div>
          <Crest size={40} />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-dashed border-ink-700/20 pt-3 text-sm">
          <span className="font-serif-kr font-semibold" style={{ color: house?.color ?? '#6e5638' }}>
            {house ? house.name : '기숙사 미배정'}
          </span>
          <span className="text-xs text-ink-500/60">입학일 {formatDate(game.joinedAt)}</span>
        </div>
      </Card>

      <Card className="text-center text-sm text-ink-500/60">더 많은 정보가 곧 채워질 예정입니다.</Card>

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
