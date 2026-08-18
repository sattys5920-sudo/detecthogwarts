import { useState } from 'react';
import Card from '../components/Card';
import ChatLog, { type ChatMessage } from '../components/ChatLog';
import Composer from '../components/Composer';
import Letterhead from '../components/Letterhead';
import { useGame, type PlayerStats } from '../context/GameContext';
import { HOUSES } from '../data/school';

interface Room {
  id: string;
  icon: string;
  name: string;
  desc: string;
  stat?: keyof PlayerStats;
  statLabel?: string;
  gain?: number;
  action?: string;
}

const ROOMS: Room[] = [
  { id: 'library', icon: '📚', name: '도서관', desc: '조용히 책을 읽으며 지식을 쌓습니다.', stat: 'intelligence', statLabel: '지능', gain: 5, action: '공부하기' },
  { id: 'forest', icon: '🌲', name: '숲', desc: '금지된 숲 근처에서 주문을 연습합니다.', stat: 'spellPower', statLabel: '주문 공격력', gain: 5, action: '주문 연습하기' },
  { id: 'pitch', icon: '🧹', name: '퀴디치 운동장', desc: '빗자루를 타고 체력을 단련합니다.', stat: 'stamina', statLabel: '스태미나', gain: 5, action: '훈련하기' },
  { id: 'herbarium', icon: '🌿', name: '약초 농장', desc: '온실에서 약초를 돌보며 몸을 회복합니다.', stat: 'hp', statLabel: 'HP', gain: 8, action: '휴식하기' },
  { id: 'dorm', icon: '🛏️', name: '기숙사', desc: '같은 기숙사 친구들과 이야기를 나눕니다.', action: '대화 참여하기' },
];

const DORM_MESSAGES: ChatMessage[] = [
  { id: 'd1', name: '유리', initial: '유', who: 'indigo', text: '오늘 수업 다들 어땠어?' },
  { id: 'd2', name: '서호', initial: '서', who: 'black', text: '숙제가 너무 많아...' },
  { id: 'd3', name: '불가', initial: '불', who: 'red', text: '주말에 같이 도서관 갈 사람?' },
];

export default function RecessPage() {
  const game = useGame();
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const room = ROOMS.find((r) => r.id === activeRoom);
  const house = HOUSES.find((h) => h.id === game.houseId);

  if (room) {
    return (
      <div className="flex flex-col gap-4">
        <Letterhead label={`${room.icon} ${room.name}`} context={room.desc} meta="휴게시간" />

        <button type="button" onClick={() => setActiveRoom(null)} className="self-start text-xs text-ink-500/60 underline-offset-2 hover:text-ink-700 hover:underline">
          ← 방 목록으로
        </button>

        {room.id === 'dorm' ? (
          <div className="rounded-sm border border-ink-700/15 bg-paper-50 p-3.5">
            <p className="mb-2.5 text-center font-mono text-[11px] text-ink-500/70">
              {house ? `◆ ${house.icon} ${house.name} 단체 대화` : '◆ 기숙사 배정 후 이용 가능합니다'}
            </p>
            {house ? (
              <>
                <ChatLog messages={DORM_MESSAGES} />
                <div className="mt-3">
                  <Composer />
                </div>
              </>
            ) : (
              <p className="py-6 text-center text-sm text-ink-500/60">아직 기숙사가 배정되지 않았어요.</p>
            )}
          </div>
        ) : (
          room.stat &&
          room.gain && (
            <Card className="flex items-center justify-between gap-3">
              <div>
                <p className="font-serif-kr font-semibold text-ink-900">
                  현재 {room.statLabel}: <span className="font-mono text-ink-red">{game.stats[room.stat]}</span>
                </p>
                <p className="mt-0.5 text-xs text-ink-700/70">{room.action} 시 {room.statLabel} +{room.gain}</p>
              </div>
              <button
                type="button"
                onClick={() => game.adjustStat(room.stat!, room.gain!)}
                disabled={game.stats[room.stat] >= 100}
                className="flex-none rounded-sm bg-ink-black px-3 py-1.5 text-xs font-bold text-paper-50 disabled:opacity-40"
              >
                {room.action}
              </button>
            </Card>
          )
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Letterhead label="휴게시간" context="갈 곳을 골라보세요" meta="쉬는 시간 · 10분 남음" />

      <div className="flex flex-col gap-3">
        {ROOMS.map((r) => (
          <button key={r.id} type="button" onClick={() => setActiveRoom(r.id)} className="text-left">
            <Card className="flex items-center gap-3 hover:border-ink-700/30">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-paper-200 text-lg">{r.icon}</span>
              <div>
                <p className="font-serif-kr font-semibold text-ink-900">{r.name}</p>
                <p className="text-xs text-ink-700/70">{r.desc}</p>
              </div>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
