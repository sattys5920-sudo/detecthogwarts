import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Letterhead from '../components/Letterhead';
import { useGame } from '../context/GameContext';
import { subscribeMyThreads, type InterrogationThread } from '../firebase/interrogation';
import { NPCS } from '../game/interrogation/npcs';

export default function InterrogationPage() {
  const game = useGame();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<InterrogationThread[]>([]);

  useEffect(() => {
    if (!game.playerId) return;
    return subscribeMyThreads(game.playerId, setThreads);
  }, [game.playerId]);

  const unreadByNpc = new Set(threads.filter((t) => t.playerUnread).map((t) => t.npcId));

  return (
    <div className="flex flex-col gap-4">
      <Letterhead label="탐문" context="궁금한 NPC를 골라 질문해 보세요" meta="답변은 관리자가 직접 작성합니다" />

      <div className="flex flex-col gap-3">
        {NPCS.map((npc) => (
          <button key={npc.id} type="button" onClick={() => navigate(`/interrogation/${npc.id}`)} className="text-left">
            <Card className="flex items-center gap-3 hover:border-ink-700/30">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-ink-black text-sm font-bold text-paper-50">
                {npc.name[0]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-serif-kr font-semibold text-ink-900">{npc.name}</p>
                <p className="text-xs text-ink-700/70">{npc.role}</p>
              </div>
              {unreadByNpc.has(npc.id) && <span className="h-2.5 w-2.5 flex-none rounded-full bg-seal-600" aria-label="읽지 않은 답변" />}
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
