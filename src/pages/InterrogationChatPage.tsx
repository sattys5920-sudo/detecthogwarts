import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../components/Card';
import ChatLog, { type ChatMessage } from '../components/ChatLog';
import ClueRegisterModal from '../components/ClueRegisterModal';
import Composer from '../components/Composer';
import Letterhead from '../components/Letterhead';
import { usePageBack } from '../context/BackContext';
import { useGame } from '../context/GameContext';
import { markThreadRead, sendQuestion, subscribeThreadMessages, type InterrogationMessage } from '../firebase/interrogation';
import { npcById } from '../game/interrogation/npcs';
import { useNotebook } from '../hooks/useNotebook';
import { useStickyScroll } from '../hooks/useStickyScroll';

export default function InterrogationChatPage() {
  const { npcId } = useParams<{ npcId: string }>();
  const navigate = useNavigate();
  const game = useGame();
  const npc = npcId ? npcById(npcId) : null;
  const [messages, setMessages] = useState<InterrogationMessage[]>([]);
  const listRef = useStickyScroll<HTMLDivElement>(messages.length);
  const { entries: notebookEntries, register } = useNotebook();
  const [registerTarget, setRegisterTarget] = useState<ChatMessage | null>(null);

  usePageBack(useCallback(() => navigate('/interrogation'), [navigate]));

  useEffect(() => {
    if (!game.playerId || !npcId) return;
    return subscribeThreadMessages(game.playerId, npcId, setMessages);
  }, [game.playerId, npcId]);

  useEffect(() => {
    if (!game.playerId || !npcId || messages.length === 0) return;
    markThreadRead(game.playerId, npcId);
  }, [game.playerId, npcId, messages.length]);

  if (!npc || !npcId) {
    return (
      <div className="flex flex-col gap-4">
        <Letterhead label="탐문" context="존재하지 않는 대상입니다" meta="" />
        <Card className="text-center text-sm text-ink-500/60">목록으로 돌아가 다시 시도해 주세요.</Card>
      </div>
    );
  }

  function handleSend(text: string) {
    if (!game.playerId || !npcId) return;
    sendQuestion(game.playerId, game.nickname, npcId, text);
  }

  const registeredIds = new Set(notebookEntries.map((e) => e.sourceId).filter((id): id is string => Boolean(id)));

  function confirmRegister(title: string) {
    if (!registerTarget) return;
    register({ title, desc: registerTarget.text, ink: 'black', status: '확인됨', sourceId: registerTarget.id });
    setRegisterTarget(null);
  }

  const chatMessages: ChatMessage[] = messages.map((m) => ({
    id: m.id,
    name: m.sender === 'player' ? game.nickname || '나' : npc.name,
    initial: m.sender === 'player' ? (game.nickname ? game.nickname[0] : '나') : npc.name[0],
    avatar: m.sender === 'player' ? (game.avatarDataUrl ?? undefined) : npc.avatar,
    who: m.sender === 'player' ? 'indigo' : 'red',
    text: m.text,
    me: m.sender === 'player',
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <img src={npc.avatar} alt="" className="h-16 w-16 rounded-full border border-ink-700/20 object-cover" />
      </div>
      <Letterhead label={npc.name} context={npc.role} meta="탐문" />

      <div
        ref={listRef}
        className="flex max-h-[55vh] min-h-[35vh] flex-col gap-2.5 overflow-x-hidden overflow-y-auto rounded-sm border border-ink-700/15 bg-paper-50 p-3"
      >
        {chatMessages.length === 0 && (
          <p className="py-8 text-center text-xs text-ink-500/50">아직 대화가 없습니다. 궁금한 것을 물어보세요.</p>
        )}
        <ChatLog messages={chatMessages} onRegister={setRegisterTarget} registeredIds={registeredIds} />
      </div>

      <Composer onSubmit={handleSend} placeholder="질문을 입력하세요..." submitLabel="전송" />

      {registerTarget && (
        <ClueRegisterModal
          sourceText={registerTarget.text}
          alreadyRegistered={registeredIds.has(registerTarget.id)}
          onConfirm={confirmRegister}
          onClose={() => setRegisterTarget(null)}
        />
      )}
    </div>
  );
}
