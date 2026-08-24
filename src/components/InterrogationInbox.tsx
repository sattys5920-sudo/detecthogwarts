import { useEffect, useState } from 'react';
import Card from './Card';
import ChatLog, { type ChatMessage } from './ChatLog';
import Composer from './Composer';
import { npcById } from '../game/interrogation/npcs';
import {
  type InterrogationMessage,
  type InterrogationThread,
  sendAnswer,
  subscribeAllThreads,
  subscribeThreadMessages,
} from '../firebase/interrogation';
import { usePlayerAvatars } from '../hooks/usePlayerAvatars';

function formatTime(ms: number) {
  if (!ms) return '-';
  return new Date(ms).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ThreadDetail({ thread, onClose }: { thread: InterrogationThread; onClose: () => void }) {
  const [messages, setMessages] = useState<InterrogationMessage[]>([]);
  const npc = npcById(thread.npcId);
  const { byNickname: avatarsByNickname } = usePlayerAvatars();

  useEffect(() => subscribeThreadMessages(thread.playerId, thread.npcId, setMessages), [thread.playerId, thread.npcId]);

  function handleAnswer(text: string) {
    sendAnswer(thread, text);
  }

  const chatMessages: ChatMessage[] = messages.map((m) => ({
    id: m.id,
    name: m.sender === 'player' ? thread.playerNickname : (npc?.name ?? thread.npcId),
    initial: m.sender === 'player' ? thread.playerNickname[0] || '?' : npc?.name[0] || '?',
    avatar: m.sender === 'player' ? (avatarsByNickname[thread.playerNickname] ?? undefined) : npc?.avatar,
    who: m.sender === 'player' ? 'indigo' : 'red',
    text: m.text,
    me: m.sender === 'admin',
  }));

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-gothic text-xl text-ink-black">
            {thread.playerNickname} → {npc?.name ?? thread.npcId}
          </p>
          <p className="text-[11px] text-ink-500/60">최근 메시지 {formatTime(thread.lastMessageAt)}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-ink-500/60 underline-offset-2 hover:text-ink-700 hover:underline"
        >
          닫기
        </button>
      </div>

      <div className="flex max-h-72 flex-col gap-2.5 overflow-x-hidden overflow-y-auto rounded-sm border border-ink-700/15 bg-paper-50 p-2.5">
        <ChatLog messages={chatMessages} />
      </div>

      <Composer onSubmit={handleAnswer} placeholder="답변을 입력하세요" submitLabel="답변 전송" />
    </Card>
  );
}

function ThreadRow({ thread, onSelect }: { thread: InterrogationThread; onSelect: () => void }) {
  const npc = npcById(thread.npcId);
  return (
    <button type="button" onClick={onSelect} className="text-left">
      <Card className="flex flex-col gap-1.5 hover:border-ink-700/30">
        <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-ink-700/70">
          <span>
            플레이어: <b className="text-ink-900">{thread.playerNickname}</b>
          </span>
          <span>
            NPC: <b className="text-ink-900">{npc?.name ?? thread.npcId}</b>
          </span>
        </div>
        <p className="text-sm text-ink-900">"{thread.lastMessageText}"</p>
        <p className="self-end text-[10px] text-ink-500/50">{formatTime(thread.lastMessageAt)}</p>
      </Card>
    </button>
  );
}

export default function InterrogationInbox() {
  const [threads, setThreads] = useState<InterrogationThread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => subscribeAllThreads(setThreads), []);

  const waiting = threads.filter((t) => t.status === 'WAITING');
  const answered = threads.filter((t) => t.status === 'ANSWERED');
  const selected = threads.find((t) => t.id === selectedId) ?? null;

  if (selected) {
    return <ThreadDetail thread={selected} onClose={() => setSelectedId(null)} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-gothic text-3xl text-ink-black">탐문 관리</p>
        <p className="mt-1 text-sm text-ink-700/70">
          답변 대기 {waiting.length}건 · 답변 완료 {answered.length}건
        </p>
      </div>

      {threads.length === 0 && <Card className="text-center text-sm text-ink-500/60">아직 들어온 질문이 없습니다.</Card>}

      {waiting.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] font-bold text-seal-600">답변 대기</p>
          {waiting.map((t) => (
            <ThreadRow key={t.id} thread={t} onSelect={() => setSelectedId(t.id)} />
          ))}
        </div>
      )}

      {answered.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] font-bold text-ink-500/60">답변 완료</p>
          {answered.map((t) => (
            <ThreadRow key={t.id} thread={t} onSelect={() => setSelectedId(t.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
