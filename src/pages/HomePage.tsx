import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Letterhead from '../components/Letterhead';
import TabIcon, { type TabIconName } from '../components/TabIcon';
import { useGame } from '../context/GameContext';
import { subscribeMyThreads } from '../firebase/interrogation';

const CATEGORIES: { to: string; label: string; icon: TabIconName }[] = [
  { to: '/hall', label: '연회장', icon: 'hall' },
  { to: '/exploration', label: '탐사 활동', icon: 'exploration' },
  { to: '/interrogation', label: '탐문', icon: 'interrogation' },
  { to: '/recess', label: '휴게시간', icon: 'recess' },
  { to: '/notebook', label: '탐사 수첩', icon: 'notebook' },
  { to: '/profile', label: '내 정보', icon: 'profile' },
];

export default function HomePage() {
  const game = useGame();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!game.playerId) return;
    return subscribeMyThreads(game.playerId, (threads) => {
      setUnreadCount(threads.filter((t) => t.playerUnread).length);
    });
  }, [game.playerId]);

  return (
    <div className="flex flex-col gap-6">
      <Letterhead label="바탕화면" context={`${game.nickname}님의 책상`} />

      <div className="grid grid-cols-3 gap-x-2 gap-y-7">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.to}
            type="button"
            onClick={() => navigate(cat.to)}
            className="flex flex-col items-center gap-2"
          >
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold-500/60 bg-paper-50 shadow-sm">
              <TabIcon name={cat.icon} className="h-7 w-7 text-seal-600" />
              {cat.icon === 'interrogation' && unreadCount > 0 && (
                <span className="gold-badge absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none">
                  {unreadCount}
                </span>
              )}
            </span>
            <span className="text-center text-xs font-bold text-ink-900">{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
