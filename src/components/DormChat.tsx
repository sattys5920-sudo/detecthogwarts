import { useEffect, useState } from 'react';
import { useDeclareActiveView } from '../context/ActiveViewContext';
import { useGame } from '../context/GameContext';
import { deleteDormMessage, type DormMessage, listenDormMessages, sendDormMessage } from '../firebase/dormChat';
import { usePlayerAvatars } from '../hooks/usePlayerAvatars';
import { useStickyScroll } from '../hooks/useStickyScroll';
import ChatLog, { type ChatMessage } from './ChatLog';
import Composer from './Composer';

const INK_CYCLE: ChatMessage['who'][] = ['black', 'red', 'indigo'];

function inkFor(id: string) {
  let sum = 0;
  for (const ch of id) sum += ch.charCodeAt(0);
  return INK_CYCLE[sum % INK_CYCLE.length];
}

export default function DormChat({ houseId, readOnly }: { houseId: string; readOnly?: boolean }) {
  const game = useGame();
  const [messages, setMessages] = useState<DormMessage[]>([]);
  const { byId: avatars } = usePlayerAvatars();
  const listRef = useStickyScroll<HTMLDivElement>(messages.length);

  useDeclareActiveView(`dorm:${houseId}`);
  useEffect(() => listenDormMessages(houseId, setMessages), [houseId]);

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
    avatar: avatars[m.authorPlayerId] ?? m.authorAvatar ?? undefined,
    who: inkFor(m.authorPlayerId || m.authorNickname),
    text: m.text,
    me: m.authorPlayerId === game.playerId,
  }));

  return (
    <div className="flex flex-col gap-3">
      <div ref={listRef} className="flex max-h-96 flex-col gap-2.5 overflow-x-hidden overflow-y-auto">
        {chatMessages.length === 0 && (
          <p className="py-6 text-center text-xs text-ink-500/50">아직 대화가 없습니다. 첫 메시지를 남겨 보세요.</p>
        )}
        <ChatLog
          messages={chatMessages}
          onDelete={game.isAdmin ? (m) => deleteDormMessage(houseId, m.id) : undefined}
        />
      </div>
      {!readOnly && <Composer onSubmit={handleSend} placeholder="메시지를 입력하세요" submitLabel="전송" />}
    </div>
  );
}
