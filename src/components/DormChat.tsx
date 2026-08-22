import { useEffect, useRef, useState } from 'react';
import { useDeclareActiveView } from '../context/ActiveViewContext';
import { useGame } from '../context/GameContext';
import { type DormMessage, listenDormMessages, sendDormMessage } from '../firebase/dormChat';
import ChatLog, { type ChatMessage } from './ChatLog';
import Composer from './Composer';

const INK_CYCLE: ChatMessage['who'][] = ['black', 'red', 'indigo'];

function inkFor(id: string) {
  let sum = 0;
  for (const ch of id) sum += ch.charCodeAt(0);
  return INK_CYCLE[sum % INK_CYCLE.length];
}

export default function DormChat({ houseId }: { houseId: string }) {
  const game = useGame();
  const [messages, setMessages] = useState<DormMessage[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useDeclareActiveView(`dorm:${houseId}`);
  useEffect(() => listenDormMessages(houseId, setMessages), [houseId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  function handleSend(text: string) {
    sendDormMessage(houseId, {
      authorPlayerId: game.playerId ?? '',
      authorNickname: game.nickname,
      authorAvatar: game.avatarDataUrl,
      text,
    });
  }

  const chatMessages: ChatMessage[] = messages.map((m) => ({
    id: m.id,
    name: m.authorNickname,
    initial: m.authorNickname ? m.authorNickname[0] : '?',
    who: inkFor(m.authorPlayerId || m.authorNickname),
    text: m.text,
    me: m.authorPlayerId === game.playerId,
  }));

  return (
    <div className="flex flex-col gap-3">
      <div ref={listRef} className="flex max-h-96 flex-col gap-2.5 overflow-y-auto">
        {chatMessages.length === 0 && (
          <p className="py-6 text-center text-xs text-ink-500/50">아직 대화가 없습니다. 첫 메시지를 남겨보세요.</p>
        )}
        <ChatLog messages={chatMessages} />
      </div>
      <Composer onSubmit={handleSend} placeholder="메시지를 입력하세요" submitLabel="전송" />
    </div>
  );
}
