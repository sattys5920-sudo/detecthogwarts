import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import TabIcon, { type TabIconName } from './TabIcon';
import { useGame } from '../context/GameContext';
import { subscribeMyThreads } from '../firebase/interrogation';

const TABS: { to: string; label: string; icon: TabIconName }[] = [
  { to: '/hall', label: '연회장', icon: 'hall' },
  { to: '/exploration', label: '탐사 활동', icon: 'exploration' },
  { to: '/interrogation', label: '탐문', icon: 'interrogation' },
  { to: '/recess', label: '휴게시간', icon: 'recess' },
  { to: '/notebook', label: '탐사 수첩', icon: 'notebook' },
  { to: '/profile', label: '내 정보', icon: 'profile' },
];

export default function BottomTabBar() {
  const game = useGame();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!game.playerId) return;
    return subscribeMyThreads(game.playerId, (threads) => {
      setUnreadCount(threads.filter((t) => t.playerUnread).length);
    });
  }, [game.playerId]);

  return (
    <nav
      className="tab-bar-shell relative z-30 flex-none px-2 pt-2.5"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.6rem)' }}
    >
      <div className="mx-auto flex max-w-md items-start justify-between gap-1">
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className="flex flex-1 flex-col items-center gap-1.5 py-1.5">
            {({ isActive }) => (
              <>
                <span className="relative">
                  <TabIcon name={tab.icon} className={`h-6 w-6 ${isActive ? 'text-seal-600' : 'text-ink-700/45'}`} />
                  {tab.icon === 'interrogation' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full border border-paper-50 bg-seal-600 px-0.5 text-[8px] font-bold leading-none text-paper-50">
                      {unreadCount}
                    </span>
                  )}
                </span>
                <span className={`text-center text-[10px] leading-tight font-bold ${isActive ? 'text-seal-600' : 'text-ink-700/45'}`}>
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
