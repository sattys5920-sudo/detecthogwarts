import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/Card';
import DaVinciCodeGame from '../components/DaVinciCodeGame';
import DormChat from '../components/DormChat';
import Letterhead from '../components/Letterhead';
import { usePageBack } from '../context/BackContext';
import { useGame } from '../context/GameContext';
import { HOUSES } from '../data/school';
import { listenRoomLock, setRoomLock } from '../firebase/locks';
import dormIcon from '../assets/rooms/dorm.png';
import forestAIcon from '../assets/rooms/forestA.png';
import forestBIcon from '../assets/rooms/forestB.png';
import herbIcon from '../assets/rooms/herb.png';
import libraryIcon from '../assets/rooms/library.png';
import quidditchIcon from '../assets/rooms/quidditch.png';

const ROOM_ICONS: Record<string, string> = {
  library: libraryIcon,
  forestExpeditionA: forestAIcon,
  forestExpeditionB: forestBIcon,
  quidditchArenaA: quidditchIcon,
  quidditchArenaB: quidditchIcon,
  quidditchArenaC: quidditchIcon,
  herbarium: herbIcon,
  dorm: dormIcon,
};

interface Room {
  id: string;
  name: string;
  desc: string;
  lockable?: boolean;
  linkTo?: string;
}

const ROOMS: Room[] = [
  { id: 'library', name: '도서관', desc: '도서관에 상주하는, 게임을 좋아하는 귀신 크리스토 백작과 게임을 해서 이겨 보세요.' },
  {
    id: 'forestExpeditionA',
    name: '금지된 숲 탐사 A',
    desc: '2~4인 협동 TRPG 탐사. 10단계를 넘어 보스를 처치하면 클리어입니다.',
    linkTo: '/forest/a',
  },
  {
    id: 'forestExpeditionB',
    name: '금지된 숲 탐사 B',
    desc: '2~4인 협동 TRPG 탐사. 10단계를 넘어 보스를 처치하면 클리어입니다.',
    linkTo: '/forest/b',
  },
  {
    id: 'quidditchArenaA',
    name: '퀴디치 경기장 A',
    desc: '체스판 위에서 펼쳐지는 실시간 1대1 퀴디치 대결. 2명이 입장하면 바로 시작됩니다.',
    linkTo: '/quidditch/a',
  },
  {
    id: 'quidditchArenaB',
    name: '퀴디치 경기장 B',
    desc: '체스판 위에서 펼쳐지는 실시간 1대1 퀴디치 대결. 2명이 입장하면 바로 시작됩니다.',
    linkTo: '/quidditch/b',
  },
  {
    id: 'quidditchArenaC',
    name: '퀴디치 경기장 C',
    desc: '체스판 위에서 펼쳐지는 실시간 1대1 퀴디치 대결. 2명이 입장하면 바로 시작됩니다.',
    linkTo: '/quidditch/c',
  },
  {
    id: 'herbarium',
    name: '약초 농장',
    desc: '씨앗을 심고 시간이 지나면 돌아와 수확하세요. 50종의 약초를 도감에 모아보세요.',
    linkTo: '/herbfarm',
  },
  { id: 'dorm', name: '기숙사', desc: '같은 기숙사 친구들과 이야기를 나눕니다.', lockable: true },
];

const DAVINCI_MAX_PLAYS = 10;

function davinciPlaysKey(day: number) {
  return `arcanum-davinci-plays-day${day}`;
}

export default function RecessPage() {
  const game = useGame();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeRoom, setActiveRoom] = useState<string | null>(() => {
    const room = searchParams.get('room');
    return room && ROOMS.some((r) => r.id === room && !r.linkTo) ? room : null;
  });
  const [davinciSession, setDavinciSession] = useState(0);
  const [davinciPlaying, setDavinciPlaying] = useState(false);
  const [davinciResult, setDavinciResult] = useState<'win' | 'lose' | null>(null);
  const [davinciPlays, setDavinciPlays] = useState(() => Number(localStorage.getItem(davinciPlaysKey(game.currentDay)) ?? 0));
  const [roomLocks, setRoomLocks] = useState<Record<string, boolean>>({});
  const room = ROOMS.find((r) => r.id === activeRoom);
  const house = HOUSES.find((h) => h.id === game.houseId);

  useEffect(() => {
    const unsubs = ROOMS.filter((r) => r.lockable).map((r) =>
      listenRoomLock(r.id, (locked) => setRoomLocks((prev) => ({ ...prev, [r.id]: locked }))),
    );
    return () => unsubs.forEach((u) => u());
  }, []);

  const exitRoom = useCallback(() => {
    if (davinciPlaying) exitDavinci();
    setActiveRoom(null);
  }, [davinciPlaying]);

  usePageBack(room ? exitRoom : null);

  function enterRoom(r: Room) {
    if (r.linkTo) {
      navigate(r.linkTo);
      return;
    }
    if (r.lockable && roomLocks[r.id] && !game.isAdmin) return;
    setActiveRoom(r.id);
  }

  function startDavinci() {
    const next = davinciPlays + 1;
    setDavinciPlays(next);
    localStorage.setItem(davinciPlaysKey(game.currentDay), String(next));
    setDavinciResult(null);
    setDavinciSession((s) => s + 1);
    setDavinciPlaying(true);
  }

  function handleDavinciFinished(result: 'win' | 'lose') {
    setDavinciResult(result);
    if (result === 'win') game.adjustStat('intelligence', 3);
  }

  function exitDavinci() {
    setDavinciPlaying(false);
    setDavinciResult(null);
  }

  if (room) {
    const locked = room.lockable ? Boolean(roomLocks[room.id]) : false;

    return (
      <div className="flex flex-col gap-4">
        <Letterhead label={room.name} meta="휴게시간" />

        <button type="button" onClick={exitRoom} className="self-start text-xs text-ink-500/60 underline-offset-2 hover:text-ink-700 hover:underline">
          ← 방 목록으로
        </button>

        {game.isAdmin && room.lockable && (
          <div className="flex items-center justify-between gap-2 rounded-sm bg-ink-black px-2.5 py-1.5">
            <p className="font-mono text-[11px] font-bold text-paper-50">관리자 모드</p>
            <button
              type="button"
              onClick={() => setRoomLock(room.id, !locked)}
              className={`rounded-sm px-2.5 py-1 font-mono text-[11px] font-bold ${
                locked ? 'bg-seal-600 text-paper-50' : 'bg-paper-100 text-ink-900'
              }`}
            >
              {locked ? '잠김 — 열기' : '열림 — 잠그기'}
            </button>
          </div>
        )}

        {locked && !game.isAdmin ? (
          <div className="rounded-sm border border-ink-700/15 bg-paper-100/60 py-10 text-center">
            <p className="text-sm font-bold text-ink-700/70">아직 잠긴 공간입니다.</p>
            <p className="mt-1 text-xs text-ink-500/60">관리자가 열어야 이용할 수 있어요.</p>
          </div>
        ) : room.id === 'library' ? (
          davinciPlaying ? (
            <DaVinciCodeGame key={davinciSession} onFinished={handleDavinciFinished} onExit={exitDavinci} />
          ) : (
            <Card className="flex flex-col gap-2.5">
              <p className="text-sm leading-relaxed text-ink-700/80">
                다빈치 코드 게임으로 크리스토 백작과 승부를 겨룹니다. 승리 시 <b className="text-seal-600">지능 +3</b>.
              </p>
              <p className="font-mono text-[11px] text-ink-500/70">오늘 남은 도전 횟수: {Math.max(0, DAVINCI_MAX_PLAYS - davinciPlays)} / {DAVINCI_MAX_PLAYS}</p>
              {davinciResult && (
                <p className={`text-sm font-bold ${davinciResult === 'win' ? 'text-seal-600' : 'text-ink-700'}`}>
                  {davinciResult === 'win' ? '지난 대결에서 승리했습니다.' : '지난 대결에서 패배했습니다.'}
                </p>
              )}
              <button
                type="button"
                onClick={startDavinci}
                disabled={davinciPlays >= DAVINCI_MAX_PLAYS}
                className="tablet-btn tablet-btn-dark self-start px-4 py-2 text-xs font-bold disabled:opacity-40"
              >
                {davinciPlays >= DAVINCI_MAX_PLAYS ? '오늘의 도전 횟수 소진' : '게임 시작'}
              </button>
            </Card>
          )
        ) : room.id === 'dorm' ? (
          <div className="rounded-sm border border-ink-700/15 bg-paper-50 p-3.5">
            <p className="mb-2.5 text-center font-mono text-[11px] text-ink-500/70">
              {house ? `${house.name} 단체 대화` : '기숙사 배정 후 이용 가능합니다'}
            </p>
            {house ? <DormChat houseId={house.id} /> : <p className="py-6 text-center text-sm text-ink-500/60">아직 기숙사가 배정되지 않았어요.</p>}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Letterhead label="휴게시간" meta="쉬는 시간 · 10분 남음" />

      <div className="flex flex-col gap-3">
        {ROOMS.map((r) => {
          const locked = r.lockable && roomLocks[r.id] && !game.isAdmin;
          return (
            <button key={r.id} type="button" onClick={() => enterRoom(r)} disabled={locked} className="text-left disabled:opacity-50">
              <Card className="flex items-center gap-3 hover:border-ink-700/30">
                <img src={ROOM_ICONS[r.id]} alt="" className="h-12 w-12 flex-none rounded-lg border border-ink-700/20 object-cover" />
                <p className="font-serif-kr font-semibold text-ink-900">
                  {r.name}
                  {locked && <span className="ml-1.5 font-mono text-[10px] font-bold text-ink-500/60">(잠김)</span>}
                </p>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
