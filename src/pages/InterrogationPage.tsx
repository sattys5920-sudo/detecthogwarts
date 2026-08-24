import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Letterhead from '../components/Letterhead';
import { useGame } from '../context/GameContext';
import { subscribeMyThreads, type InterrogationThread } from '../firebase/interrogation';
import { listenInterrogationLock, setInterrogationLock } from '../firebase/locks';
import { NPCS } from '../game/interrogation/npcs';

export default function InterrogationPage() {
  const game = useGame();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<InterrogationThread[]>([]);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!game.playerId) return;
    return subscribeMyThreads(game.playerId, setThreads);
  }, [game.playerId]);

  useEffect(() => listenInterrogationLock(setLocked), []);

  const unreadByNpc = new Set(threads.filter((t) => t.playerUnread).map((t) => t.npcId));

  return (
    <div className="flex flex-col gap-4">
      <Letterhead label="탐문" />

      {game.isAdmin && (
        <div className="flex items-center justify-between gap-2 rounded-sm bg-ink-black px-2.5 py-1.5">
          <p className="font-mono text-[11px] font-bold text-paper-50">관리자 모드</p>
          <button
            type="button"
            onClick={() => setInterrogationLock(!locked)}
            className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-bold ${
              locked ? 'bg-seal-600 text-paper-50' : 'bg-paper-100 text-ink-900'
            }`}
          >
            {locked ? '잠김 — 열기' : '열림 — 잠그기'}
          </button>
        </div>
      )}

      {locked && !game.isAdmin ? (
        <div className="rounded-sm border border-ink-700/15 bg-paper-100/60 py-10 text-center">
          <p className="text-sm font-bold text-ink-700/70">아직 탐문이 열리지 않았습니다.</p>
          <p className="mt-1 text-xs text-ink-500/60">관리자가 열어야 이용할 수 있어요.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {NPCS.map((npc) => (
            <button key={npc.id} type="button" onClick={() => navigate(`/interrogation/${npc.id}`)} className="text-left">
              <Card className="flex items-center gap-3 hover:border-ink-700/30">
                <img src={npc.avatar} alt="" className="h-10 w-10 flex-none rounded-full border border-ink-700/20 object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-serif-kr font-semibold text-ink-900">{npc.name}</p>
                  <p className="text-xs text-ink-700/70">{npc.role}</p>
                </div>
                {unreadByNpc.has(npc.id) && <span className="h-2.5 w-2.5 flex-none rounded-full bg-seal-600" aria-label="읽지 않은 답변" />}
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
