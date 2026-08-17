import Card from '../components/Card';
import ChatLog, { type ChatMessage } from '../components/ChatLog';
import Composer from '../components/Composer';
import Letterhead from '../components/Letterhead';
import { useGame } from '../context/GameContext';
import { HOUSES } from '../data/school';

const ROOMMATES: { name: string; who: ChatMessage['who'] }[] = [
  { name: '다인', who: 'black' },
  { name: '서호', who: 'indigo' },
  { name: '유리', who: 'red' },
];

const MESSAGES: ChatMessage[] = [
  { id: 'r1', name: '서호', initial: '서', who: 'indigo', text: '오늘 밤 너무 조용하지 않아?' },
  { id: 'r2', name: '다인', initial: '다', who: 'black', text: '그러게... 옆방에서 무슨 소리 들리지 않았어?', me: true },
  { id: 'r3', name: '유리', initial: '유', who: 'red', text: '나만 그런 거 아니었구나.' },
];

export default function HousePage() {
  const game = useGame();
  const house = HOUSES.find((h) => h.id === game.houseId);

  return (
    <div className="flex flex-col gap-4">
      <Letterhead
        label="Room 3B"
        context={house ? `${house.name} 3인실` : '기숙사를 선택하세요'}
        meta="취침 점호 전 · 22:40"
        tag="기숙사"
      />

      <div>
        <p className="mb-2 text-xs font-bold text-ink-700/70">소속 기숙사</p>
        <div className="grid grid-cols-2 gap-3">
          {HOUSES.map((h) => {
            const selected = game.houseId === h.id;
            return (
              <button key={h.id} type="button" onClick={() => game.setHouse(h.id)} className="text-left">
                <Card
                  className={`transition-colors ${selected ? 'ring-2 ring-seal-500/50' : 'hover:border-ink-700/30'}`}
                  style={selected ? { borderColor: h.color } : undefined}
                >
                  <span className="block h-2 w-8 rounded-full" style={{ backgroundColor: h.color }} />
                  <p className="mt-2 font-serif-kr font-semibold text-ink-900">{h.name}</p>
                  <p className="text-xs text-ink-500/70">{h.element}</p>
                </Card>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-sm border border-ink-700/15 bg-paper-50 p-3.5">
        <div className="mb-3 flex items-center gap-2">
          {ROOMMATES.map((r) => (
            <span
              key={r.name}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-paper-50 ${
                r.who === 'black' ? 'bg-ink-black' : r.who === 'red' ? 'bg-ink-red' : 'bg-ink-indigo'
              }`}
            >
              {r.name[0]}
            </span>
          ))}
          <span className="ml-auto rounded-full bg-ink-black px-2.5 py-1 text-[10px] font-bold text-paper-50">
            3인실
          </span>
        </div>
        <p className="mb-2 text-center font-mono text-[11px] text-ink-500/50">
          실제 채팅 기능은 준비 중이에요 — 아래는 미리보기입니다
        </p>
        <ChatLog messages={MESSAGES} />
        <div className="mt-3">
          <Composer />
        </div>
      </div>
    </div>
  );
}
