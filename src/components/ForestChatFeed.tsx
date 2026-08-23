import { useEffect, useRef, useState } from 'react';
import Composer from './Composer';
import { listenForestChat, sendForestChatMessage, type ForestChatMessage } from '../firebase/forestChat';
import type { LogEntry } from '../game/forest/types';

interface FeedItem {
  key: string;
  at: number;
  kind: 'narration' | 'chat';
  text: string;
  authorId?: string;
  authorNickname?: string;
}

function formatTime(ms: number) {
  if (!ms) return '';
  return new Date(ms).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
}

interface ForestChatFeedProps {
  roomId: string;
  log: LogEntry[];
  myId: string;
  myNickname: string;
  maxHeightClass?: string;
}

/** Merges the party's system narration log with real-time player chat into one scrolling feed, with a composer to send messages. */
export default function ForestChatFeed({ roomId, log, myId, myNickname, maxHeightClass = 'max-h-56' }: ForestChatFeedProps) {
  const [messages, setMessages] = useState<ForestChatMessage[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => listenForestChat(roomId, setMessages), [roomId]);

  const items: FeedItem[] = [
    ...log.map((l, i) => ({ key: `log-${i}-${l.at}`, at: l.at, kind: 'narration' as const, text: l.text })),
    ...messages.map((m) => ({
      key: m.id,
      at: m.createdAt,
      kind: 'chat' as const,
      text: m.text,
      authorId: m.authorPlayerId,
      authorNickname: m.authorNickname,
    })),
  ].sort((a, b) => a.at - b.at);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [items.length]);

  function handleSend(text: string) {
    sendForestChatMessage(roomId, myId, myNickname, text);
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={listRef}
        className={`flex ${maxHeightClass} flex-col gap-2 overflow-x-hidden overflow-y-auto rounded-sm border border-ink-700/15 bg-paper-50 p-3`}
      >
        {items.length === 0 && <p className="py-4 text-center text-xs text-ink-500/50">아직 아무 일도 일어나지 않았습니다.</p>}
        {items.map((item) => {
          if (item.kind === 'narration') {
            return (
              <p key={item.key} className="text-center font-serif-kr text-xs italic leading-relaxed text-ink-700/80">
                {item.text}
              </p>
            );
          }
          const isMe = item.authorId === myId;
          return (
            <div key={item.key} className={`flex max-w-[85%] flex-col ${isMe ? 'ml-auto items-end' : 'items-start'}`}>
              <span className="mb-0.5 text-[10px] font-bold text-ink-700/60">{item.authorNickname}</span>
              <div className={`flex items-end gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                <p
                  className={`rounded-lg border px-3 py-1.5 text-sm text-ink-900 ${
                    isMe ? 'border-ink-700/25 bg-paper-200/60' : 'border-ink-700/15 bg-paper-100/60'
                  }`}
                >
                  {item.text}
                </p>
                <span className="flex-none font-mono text-[10px] text-ink-500/50">{formatTime(item.at)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <Composer onSubmit={handleSend} placeholder="파티에게 메시지를 보내세요" submitLabel="전송" />
    </div>
  );
}
