import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/Card';
import DaVinciCodeGame from '../components/DaVinciCodeGame';
import DormChat from '../components/DormChat';
import Letterhead from '../components/Letterhead';
import { usePageBack } from '../context/BackContext';
import { useGame, type PlayerStats } from '../context/GameContext';
import { HOUSES } from '../data/school';
import { listenRoomLock, setRoomLock } from '../firebase/locks';

interface Room {
  id: string;
  name: string;
  desc: string;
  stat?: keyof PlayerStats;
  statLabel?: string;
  gain?: number;
  action?: string;
  lockable?: boolean;
  linkTo?: string;
}

const ROOMS: Room[] = [
  { id: 'library', name: '도서관', desc: '도서관에 상주하는, 게임을 좋아하는 귀신 크리스토 백작과 게임을 해서 이겨 보세요.' },
  { id: 'forest', name: '숲', desc: '금지된 숲 근처에서 주문을 연습합니다.', stat: 'spellPower', statLabel: '주문 공격력', gain: 5, action: '주문 연습하기', lockable: true },
  {
    id: 'forestExpedition',
    name: '금지된 숲 탐사',
    desc: '2~4인 협동 TRPG 탐사. 10단계를 넘어 보스를 처치하면 클리어입니다.',
    linkTo: '/forest',
  },
  { id: 'pitch', name: '퀴디치 운동장', desc: '빗자루를 타고 체력을 단련합니다.', stat: 'stamina', statLabel: '스태미나', gain: 5, action: '훈련하기', lockable: true },
  {
    id: 'quidditchArena',
    name: '퀴디치 경기장',
    desc: '체스판 위에서 펼쳐지는 실시간 1대1 퀴디치 대결. 2명이 입장하면 바로 시작됩니다.',
    linkTo: '/quidditch',
  },
  {
    id: 'herbarium',
    name: '약초 농장',
    desc: '씨앗을 심고 시간이 지나면 돌아와 수확하세요. 50종의 약초를 도감에 모아보세요.',
    linkTo: '/herbfarm',
  },
  { id: 'dorm', name: '기숙사', desc: '같은 기숙사 친구들과 이야기를 나눕니다.', action: '대화 참여하기', lockable: true },
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
    if (result === 'win') game.adjustStat('spellPower', 5);
  }

  function exitDavinci() {
    setDavinciPlaying(false);
    setDavinciResult(null);
  }

  if (room) {
    const locked = room.lockable ? Boolean(roomLocks[room.id]) : false;

    return (
      <div className="flex flex-col gap-4">
        <Letterhead label={room.name} context={room.desc} meta="휴게시간" />

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
                다빈치 코드 게임으로 크리스토 백작과 승부를 겨룹니다. 승리 시 <b className="text-seal-600">주문력 +5</b>.
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
        {ROOMS.map((r) => {
          const locked = r.lockable && roomLocks[r.id] && !game.isAdmin;
          return (
            <button key={r.id} type="button" onClick={() => enterRoom(r)} disabled={locked} className="text-left disabled:opacity-50">
              <Card className="flex items-center gap-3 hover:border-ink-700/30">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-ink-black text-sm font-bold text-paper-50">
                  {r.name[0]}
                </span>
                <div>
                  <p className="font-serif-kr font-semibold text-ink-900">
                    {r.name}
                    {locked && <span className="ml-1.5 font-mono text-[10px] font-bold text-ink-500/60">(잠김)</span>}
                  </p>
                  <p className="text-xs text-ink-700/70">{r.desc}</p>
                </div>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
