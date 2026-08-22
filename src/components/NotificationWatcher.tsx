import { useEffect, useRef } from 'react';
import { useActiveView } from '../context/ActiveViewContext';
import { useGame } from '../context/GameContext';
import { listenAnnouncement } from '../firebase/announcements';
import { listenDormMessages } from '../firebase/dormChat';
import { DEFAULT_PREFS, subscribePrefs, type NotificationPrefs } from '../firebase/notificationPrefs';
import { createNotificationIfAbsent } from '../firebase/notifications';
import { listenPosts } from '../firebase/posts';

interface Cursor {
  announcementSeenId: string | null;
  postsSince: number;
  dormSince: number;
}

function cursorKey(playerId: string) {
  return `arcanum-notif-cursor-${playerId}`;
}

/**
 * Loads this device's per-player watermark, seeding it to "now" on first-ever run so pre-existing
 * content doesn't flood the notification center the first time it's turned on. `isFresh` tells the
 * caller whether this cursor was just created (so a null `announcementSeenId` means "not checked
 * yet") versus loaded from a previous run (where a null `announcementSeenId` legitimately means
 * "there was nothing to see yet, but that has already been recorded").
 */
function loadOrInitCursor(playerId: string): { cursor: Cursor; isFresh: boolean } {
  try {
    const raw = localStorage.getItem(cursorKey(playerId));
    if (raw) return { cursor: JSON.parse(raw) as Cursor, isFresh: false };
  } catch {
    // fall through to a fresh cursor
  }
  const fresh: Cursor = { announcementSeenId: null, postsSince: Date.now(), dormSince: Date.now() };
  try {
    localStorage.setItem(cursorKey(playerId), JSON.stringify(fresh));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
  return { cursor: fresh, isFresh: true };
}

function saveCursor(playerId: string, cursor: Cursor) {
  try {
    localStorage.setItem(cursorKey(playerId), JSON.stringify(cursor));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

/**
 * Runs once for the whole app (mounted outside <Routes> so it survives navigation) and turns
 * shared content — announcements, feed posts, dorm chat — into per-player notification records,
 * while the web app is open. Does not send OS-level push; that's phase 2.
 */
export default function NotificationWatcher() {
  const game = useGame();
  const { activeView } = useActiveView();
  const prefsRef = useRef<NotificationPrefs>(DEFAULT_PREFS);
  const activeViewRef = useRef<string | null>(null);
  activeViewRef.current = activeView;

  useEffect(() => {
    if (!game.playerId) return;
    return subscribePrefs(game.playerId, (p) => {
      prefsRef.current = p;
    });
  }, [game.playerId]);

  useEffect(() => {
    if (!game.playerId) return;
    const playerId = game.playerId;
    const init = loadOrInitCursor(playerId);
    let cursor = init.cursor;
    let seeded = !init.isFresh;
    return listenAnnouncement((a) => {
      if (!a) {
        // no announcement exists yet — "nothing seen" is itself a valid baseline.
        seeded = true;
        return;
      }
      if (!seeded) {
        cursor = { ...cursor, announcementSeenId: a.id };
        saveCursor(playerId, cursor);
        seeded = true;
        return;
      }
      if (cursor.announcementSeenId === a.id) return;
      const prefs = prefsRef.current;
      if (prefs.master && prefs.event) {
        createNotificationIfAbsent({
          playerId,
          type: 'POPUP',
          title: '새로운 안내',
          body: a.text,
          targetUrl: '/hall',
          targetId: a.id,
        });
      }
      cursor = { ...cursor, announcementSeenId: a.id };
      saveCursor(playerId, cursor);
    });
  }, [game.playerId]);

  useEffect(() => {
    if (!game.playerId) return;
    const playerId = game.playerId;
    let cursor = loadOrInitCursor(playerId).cursor;
    return listenPosts((posts) => {
      const newer = posts.filter((p) => p.createdAt > cursor.postsSince && p.authorPlayerId !== playerId);
      if (newer.length === 0) return;
      const prefs = prefsRef.current;
      if (prefs.master && prefs.event) {
        for (const p of newer) {
          createNotificationIfAbsent({
            playerId,
            type: 'FEED',
            title: '새 피드 알림',
            body: `${p.authorNickname}: ${p.title || p.content.slice(0, 40)}`,
            targetUrl: '/hall',
            targetId: p.id,
          });
        }
      }
      cursor = { ...cursor, postsSince: Math.max(cursor.postsSince, ...newer.map((p) => p.createdAt)) };
      saveCursor(playerId, cursor);
    });
  }, [game.playerId]);

  useEffect(() => {
    if (!game.playerId || !game.houseId) return;
    const playerId = game.playerId;
    const houseId = game.houseId;
    const nickname = game.nickname;
    let cursor = loadOrInitCursor(playerId).cursor;
    return listenDormMessages(houseId, (messages) => {
      const newer = messages.filter((m) => m.createdAt > cursor.dormSince && m.authorPlayerId !== playerId);
      if (newer.length === 0) return;
      const prefs = prefsRef.current;
      const viewing = activeViewRef.current === `dorm:${houseId}`;
      for (const m of newer) {
        const mentioned = nickname && m.text.includes(`@${nickname}`);
        if (mentioned) {
          if (prefs.master && prefs.mention) {
            createNotificationIfAbsent({
              playerId,
              type: 'MENTION',
              title: '태그 알림',
              body: `${m.authorNickname}님이 회원님을 태그했습니다.`,
              targetUrl: '/recess?room=dorm',
              targetId: m.id,
            });
          }
        } else if (!viewing && prefs.master && prefs.chat) {
          createNotificationIfAbsent({
            playerId,
            type: 'CHAT',
            title: '새로운 메시지가 도착했습니다',
            body: `기숙사 공용 대화방 · ${m.authorNickname}: ${m.text.slice(0, 40)}`,
            targetUrl: '/recess?room=dorm',
            targetId: m.id,
          });
        }
      }
      cursor = { ...cursor, dormSince: Math.max(cursor.dormSince, ...newer.map((m) => m.createdAt)) };
      saveCursor(playerId, cursor);
    });
  }, [game.playerId, game.houseId, game.nickname]);

  return null;
}
