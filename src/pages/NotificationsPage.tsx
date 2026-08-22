import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Letterhead from '../components/Letterhead';
import { usePageBack } from '../context/BackContext';
import { useGame } from '../context/GameContext';
import { markAllRead, markRead, subscribeNotifications, type AppNotification } from '../firebase/notifications';

const TYPE_LABEL: Record<AppNotification['type'], string> = {
  POPUP: '안내',
  FEED: '피드',
  CHAT: '대화',
  MENTION: '태그',
};

function formatTime(ms: number) {
  if (!ms) return '방금 전';
  return new Date(ms).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function NotificationsPage() {
  const game = useGame();
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[]>([]);

  usePageBack(useCallback(() => navigate(-1), [navigate]));

  useEffect(() => {
    if (!game.playerId) return;
    return subscribeNotifications(game.playerId, setItems);
  }, [game.playerId]);

  const unread = items.filter((n) => !n.isRead);

  function handleOpen(n: AppNotification) {
    if (!n.isRead && game.playerId) markRead(game.playerId, n.id);
    navigate(n.targetUrl);
  }

  function handleMarkAllRead() {
    if (!game.playerId || unread.length === 0) return;
    markAllRead(game.playerId, unread.map((n) => n.id));
  }

  return (
    <div className="flex flex-col gap-4">
      <Letterhead label="알림" context="놓친 소식을 한눈에 확인하세요" meta={`안 읽은 알림 ${unread.length}개`} />

      {items.length > 0 && (
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={unread.length === 0}
          className="self-end text-xs text-ink-500/60 underline-offset-2 hover:text-ink-700 hover:underline disabled:opacity-40"
        >
          모두 읽음
        </button>
      )}

      {items.length === 0 && <Card className="text-center text-sm text-ink-500/60">아직 알림이 없습니다.</Card>}

      <div className="flex flex-col gap-2.5">
        {items.map((n) => (
          <button key={n.id} type="button" onClick={() => handleOpen(n)} className="text-left">
            <Card className={`flex flex-col gap-1 hover:border-ink-700/30 ${n.isRead ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-1.5">
                {!n.isRead && <span className="h-1.5 w-1.5 flex-none rounded-full bg-seal-600" aria-hidden="true" />}
                <span className="font-mono text-[10px] font-bold text-ink-500/60">{TYPE_LABEL[n.type]}</span>
                <span className="ml-auto font-mono text-[10px] text-ink-500/50">{formatTime(n.createdAt)}</span>
              </div>
              <p className="font-serif-kr text-sm font-semibold text-ink-900">{n.title}</p>
              <p className="text-xs text-ink-700/70">{n.body}</p>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
