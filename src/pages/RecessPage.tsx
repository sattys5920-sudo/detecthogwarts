import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import DaVinciCodeGame from '../components/DaVinciCodeGame';
import DormChat from '../components/DormChat';
import Letterhead from '../components/Letterhead';
import LogicPuzzlePanel from '../components/LogicPuzzlePanel';
import SurpriseMissionAdmin from '../components/SurpriseMissionAdmin';
import SurpriseMissionCard from '../components/SurpriseMissionCard';
import { usePageBack } from '../context/BackContext';
import { useGame } from '../context/GameContext';
import { HOUSES } from '../data/school';
import { subscribeParty } from '../firebase/forest';
import { listenRecessLock, listenRoomLock, setRecessLock, setRoomLock } from '../firebase/locks';
import { subscribeRoom } from '../firebase/quidditch';
import { listenSurpriseMission, type SurpriseMissionState } from '../firebase/surpriseMission';
import { MAX_SEATS as FOREST_MAX_SEATS } from '../game/forest/engine';
import dormIcon from '../assets/rooms/dorm.png';
import forestAIcon from '../assets/rooms/forestA.png';
import forestBIcon from '../assets/rooms/forestB.png';
import forestCIcon from '../assets/rooms/forestC.png';
import herbIcon from '../assets/rooms/herb.png';
import libraryIcon from '../assets/rooms/library.png';
import quidditchIcon from '../assets/rooms/quidditch.png';

const ROOM_ICONS: Record<string, string> = {
  library: libraryIcon,
  forestExpeditionA: forestAIcon,
  forestExpeditionB: forestBIcon,
  forestExpeditionC: forestCIcon,
  quidditchArenaA: quidditchIcon,
  quidditchArenaB: quidditchIcon,
  quidditchArenaC: quidditchIcon,
  quidditchArenaD: quidditchIcon,
  quidditchArenaE: quidditchIcon,
  herbarium: herbIcon,
  dorm: dormIcon,
};

interface Room {
  id: string;
  name: string;
  desc: string;
  lockable?: boolean;
  linkTo?: string;
  costsStamina?: boolean;
}

const ROOMS: Room[] = [
  { id: 'library', name: '도서관', desc: '도서관에 상주하는, 게임을 좋아하는 귀신 크리스토 백작과 게임을 해서 이겨 보세요.', costsStamina: true },
  {
    id: 'forestExpeditionA',
    name: '금지된 숲 탐사 A',
    desc: '2~4 인 협동 TRPG 탐사. 10 단계를 넘어 보스를 처치하면 클리어입니다.',
    linkTo: '/forest/a',
    costsStamina: true,
  },
  {
    id: 'forestExpeditionB',
    name: '금지된 숲 탐사 B',
    desc: '2~4 인 협동 TRPG 탐사. 10 단계를 넘어 보스를 처치하면 클리어입니다.',
    linkTo: '/forest/b',
    costsStamina: true,
  },
  {
    id: 'forestExpeditionC',
    name: '금지된 숲 탐사 C',
    desc: '2~4 인 협동 TRPG 탐사. 10 단계를 넘어 보스를 처치하면 클리어입니다.',
    linkTo: '/forest/c',
    costsStamina: true,
  },
  {
    id: 'quidditchArenaA',
    name: '퀴디치 경기장 A',
    desc: '체스판 위에서 펼쳐지는 실시간 1 대 1 퀴디치 대결. 2 명이 입장하면 바로 시작됩니다.',
    linkTo: '/quidditch/a',
    costsStamina: true,
  },
  {
    id: 'quidditchArenaB',
    name: '퀴디치 경기장 B',
    desc: '체스판 위에서 펼쳐지는 실시간 1 대 1 퀴디치 대결. 2 명이 입장하면 바로 시작됩니다.',
    linkTo: '/quidditch/b',
    costsStamina: true,
  },
  {
    id: 'quidditchArenaC',
    name: '퀴디치 경기장 C',
    desc: '체스판 위에서 펼쳐지는 실시간 1 대 1 퀴디치 대결. 2 명이 입장하면 바로 시작됩니다.',
    linkTo: '/quidditch/c',
    costsStamina: true,
  },
  {
    id: 'quidditchArenaD',
    name: '퀴디치 경기장 D',
    desc: '체스판 위에서 펼쳐지는 실시간 1 대 1 퀴디치 대결. 2 명이 입장하면 바로 시작됩니다.',
    linkTo: '/quidditch/d',
    costsStamina: true,
  },
  {
    id: 'quidditchArenaE',
    name: '퀴디치 경기장 E',
    desc: '체스판 위에서 펼쳐지는 실시간 1 대 1 퀴디치 대결. 2 명이 입장하면 바로 시작됩니다.',
    linkTo: '/quidditch/e',
    costsStamina: true,
  },
  {
    id: 'herbarium',
    name: '약초 농장',
    desc: '씨앗을 심고 시간이 지나면 돌아와 수확하세요. 50 종의 약초를 도감에 모아 보세요.',
    linkTo: '/herbfarm',
  },
  { id: 'dorm', name: '기숙사', desc: '같은 기숙사 친구들과 이야기를 나눕니다.', lockable: true },
];

const DAVINCI_MAX_PLAYS = 10;
const FOREST_ROOM_LETTERS = ['a', 'b', 'c'];
const QUIDDITCH_ROOM_LETTERS = ['a', 'b', 'c', 'd', 'e'];
const QUIDDITCH_MAX_SEATS = 2;

/** Local (not UTC) YYYY-MM-DD — so the daily count actually rolls over at local midnight. */
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function davinciPlaysKey(dateKey: string) {
  return `arcanum-davinci-plays-${dateKey}`;
}

/** The room letter a linkTo path ends in, e.g. '/forest/c' -> 'c'. */
function roomLetter(linkTo: string) {
  return linkTo.split('/').pop() ?? '';
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
  const [davinciDateKey, setDavinciDateKey] = useState(todayKey);
  const [davinciPlays, setDavinciPlays] = useState(() => Number(localStorage.getItem(davinciPlaysKey(todayKey())) ?? 0));
  const [roomLocks, setRoomLocks] = useState<Record<string, boolean>>({});
  const [recessLocked, setRecessLocked] = useState(false);
  const [forestStatus, setForestStatus] = useState<Record<string, { count: number; inProgress: boolean; mine: boolean }>>({});
  const [quidditchStatus, setQuidditchStatus] = useState<Record<string, { count: number; inProgress: boolean; mine: boolean }>>({});
  const [busyModal, setBusyModal] = useState(false);
  const [staminaModal, setStaminaModal] = useState(false);
  const [surpriseMission, setSurpriseMission] = useState<SurpriseMissionState | null>(null);
  const [adminDormHouseId, setAdminDormHouseId] = useState<string | null>(null);
  const room = ROOMS.find((r) => r.id === activeRoom);
  const house = HOUSES.find((h) => h.id === game.houseId);

  const myActiveForestLetter = FOREST_ROOM_LETTERS.find((l) => forestStatus[l]?.mine) ?? null;
  const myActiveQuidditchLetter = QUIDDITCH_ROOM_LETTERS.find((l) => quidditchStatus[l]?.mine) ?? null;

  useEffect(() => {
    const unsubs = ROOMS.filter((r) => r.lockable).map((r) =>
      listenRoomLock(r.id, (locked) => setRoomLocks((prev) => ({ ...prev, [r.id]: locked }))),
    );
    return () => unsubs.forEach((u) => u());
  }, []);

  useEffect(() => {
    const unsubs = FOREST_ROOM_LETTERS.map((letter) =>
      subscribeParty(letter, (party) => {
        setForestStatus((prev) => ({
          ...prev,
          [letter]: {
            count: party.seats.filter((s) => s !== null).length,
            inProgress: party.status !== 'lobby',
            mine: party.seats.some((s) => s?.id === game.playerId),
          },
        }));
      }),
    );
    return () => unsubs.forEach((u) => u());
  }, [game.playerId]);

  useEffect(() => {
    const unsubs = QUIDDITCH_ROOM_LETTERS.map((letter) =>
      subscribeRoom(letter, (g) => {
        const count = (g.seats.A ? 1 : 0) + (g.seats.B ? 1 : 0);
        const mine = g.seats.A?.playerId === game.playerId || g.seats.B?.playerId === game.playerId;
        setQuidditchStatus((prev) => ({ ...prev, [letter]: { count, inProgress: g.status === 'playing', mine } }));
      }),
    );
    return () => unsubs.forEach((u) => u());
  }, [game.playerId]);

  useEffect(() => listenRecessLock(setRecessLocked), []);
  useEffect(() => listenSurpriseMission(setSurpriseMission), []);

  // Rolls the daily play count over at local midnight even if the tab is left open across the boundary.
  useEffect(() => {
    const id = setInterval(() => {
      const key = todayKey();
      if (key === davinciDateKey) return;
      setDavinciDateKey(key);
      setDavinciPlays(Number(localStorage.getItem(davinciPlaysKey(key)) ?? 0));
    }, 30000);
    return () => clearInterval(id);
  }, [davinciDateKey]);

  const exitRoom = useCallback(() => {
    if (davinciPlaying) exitDavinci();
    setActiveRoom(null);
  }, [davinciPlaying]);

  usePageBack(room ? exitRoom : null);

  function enterRoom(r: Room) {
    if (recessLocked && !game.isAdmin) return;
    if (r.lockable && roomLocks[r.id] && !game.isAdmin) return;

    if (r.costsStamina && game.stats.stamina <= 0 && !game.isAdmin) {
      setStaminaModal(true);
      return;
    }

    // A seat held in a forest/quidditch room (waiting or already underway) blocks entering
    // ANY other room — including 도서관/기숙사 — until that seat is properly left or the
    // expedition/match ends. Re-entering the exact room you're already seated in is exempt.
    const letter = r.linkTo ? roomLetter(r.linkTo) : null;
    const enteringForest = r.linkTo?.startsWith('/forest/') ?? false;
    const enteringQuidditch = r.linkTo?.startsWith('/quidditch/') ?? false;
    const enteringMyOwnRoom = (enteringForest && myActiveForestLetter === letter) || (enteringQuidditch && myActiveQuidditchLetter === letter);
    const busyElsewhere = !enteringMyOwnRoom && (myActiveForestLetter !== null || myActiveQuidditchLetter !== null);
    if (busyElsewhere) {
      setBusyModal(true);
      return;
    }

    if (r.linkTo) {
      navigate(r.linkTo);
      return;
    }
    setActiveRoom(r.id);
  }

  function startDavinci() {
    const next = davinciPlays + 1;
    setDavinciPlays(next);
    localStorage.setItem(davinciPlaysKey(davinciDateKey), String(next));
    setDavinciResult(null);
    setDavinciSession((s) => s + 1);
    setDavinciPlaying(true);
  }

  function handleDavinciFinished(result: 'win' | 'lose') {
    setDavinciResult(result);
    game.adjustStat('stamina', -10);
    if (result === 'win') {
      game.adjustStat('intelligence', 25);
      game.adjustStat('spellPower', 25);
    }
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
                다빈치 코드 게임으로 크리스토 백작과 승부를 겨룹니다. 승리 시 <b className="text-seal-600">지능 +25, 주문 공격력 +25</b>.
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
          <div className="flex flex-col gap-3">
            <LogicPuzzlePanel houseId={house?.id ?? null} playerId={game.playerId} isAdmin={game.isAdmin} />
            {game.isAdmin && <SurpriseMissionAdmin />}
            {!game.isAdmin && surpriseMission?.id && house && (
              <SurpriseMissionCard mission={surpriseMission} houseId={house.id} />
            )}
            {game.isAdmin && (
              <div className="flex flex-col gap-2 rounded-sm border border-ink-700/15 bg-paper-50 p-3">
                <p className="text-center font-mono text-[11px] text-ink-500/70">관전할 기숙사를 선택하세요</p>
                <div className="flex justify-center gap-2">
                  {HOUSES.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setAdminDormHouseId(h.id)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold text-paper-50 ${
                        adminDormHouseId === h.id ? 'ring-2 ring-seal-500 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: h.color, borderColor: h.accent }}
                    >
                      {h.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-sm border border-ink-700/15 bg-paper-50 p-3.5">
              {game.isAdmin ? (
                adminDormHouseId ? (
                  <>
                    <p className="mb-2.5 text-center font-mono text-[11px] text-ink-500/70">
                      {HOUSES.find((h) => h.id === adminDormHouseId)?.name} 단체 대화 (관전 중 — 메시지는 보낼 수 없어요)
                    </p>
                    <DormChat houseId={adminDormHouseId} readOnly />
                  </>
                ) : (
                  <p className="py-6 text-center text-sm text-ink-500/60">위에서 기숙사를 선택하면 대화를 볼 수 있어요.</p>
                )
              ) : (
                <>
                  <p className="mb-2.5 text-center font-mono text-[11px] text-ink-500/70">
                    {house ? `${house.name} 단체 대화` : '기숙사 배정 후 이용 가능합니다'}
                  </p>
                  {house ? <DormChat houseId={house.id} /> : <p className="py-6 text-center text-sm text-ink-500/60">아직 기숙사가 배정되지 않았어요.</p>}
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Letterhead label="휴게시간" meta="쉬는 시간 · 10 분 남음" />

      {game.isAdmin && (
        <div className="flex items-center justify-between gap-2 rounded-sm bg-ink-black px-2.5 py-1.5">
          <p className="font-mono text-[11px] font-bold text-paper-50">관리자 모드 · 휴게시간 전체</p>
          <button
            type="button"
            onClick={() => setRecessLock(!recessLocked)}
            className={`rounded-sm px-2.5 py-1 font-mono text-[11px] font-bold ${
              recessLocked ? 'bg-seal-600 text-paper-50' : 'bg-paper-100 text-ink-900'
            }`}
          >
            {recessLocked ? '잠김 — 열기' : '열림 — 잠그기'}
          </button>
        </div>
      )}

      {recessLocked && !game.isAdmin ? (
        <div className="rounded-sm border border-ink-700/15 bg-paper-100/60 py-10 text-center">
          <p className="text-sm font-bold text-ink-700/70">아직 휴게시간이 아닙니다.</p>
          <p className="mt-1 text-xs text-ink-500/60">관리자가 열어야 이용할 수 있어요.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {ROOMS.map((r) => {
              const locked = r.lockable && roomLocks[r.id] && !game.isAdmin;
              const staminaBlocked = Boolean(r.costsStamina) && game.stats.stamina <= 0 && !game.isAdmin;
              const isForest = r.linkTo?.startsWith('/forest/');
              const isQuidditch = r.linkTo?.startsWith('/quidditch/');
              const live = isForest
                ? forestStatus[roomLetter(r.linkTo!)]
                : isQuidditch
                  ? quidditchStatus[roomLetter(r.linkTo!)]
                  : undefined;
              const maxSeats = isForest ? FOREST_MAX_SEATS : isQuidditch ? QUIDDITCH_MAX_SEATS : 0;
              const inProgressLabel = isForest ? '탐사 중' : isQuidditch ? '경기 중' : '';
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => enterRoom(r)}
                  disabled={locked}
                  className={`text-left disabled:opacity-50 ${staminaBlocked ? 'opacity-50' : ''}`}
                >
                  <Card className="flex items-center gap-3 hover:border-ink-700/30">
                    <img src={ROOM_ICONS[r.id]} alt="" className="h-12 w-12 flex-none rounded-lg border border-ink-700/20 object-cover" />
                    <div className="flex-1">
                      <p className="font-serif-kr font-semibold text-ink-900">
                        {r.name}
                        {locked && <span className="ml-1.5 font-mono text-[10px] font-bold text-ink-500/60">(잠김)</span>}
                        {!locked && staminaBlocked && (
                          <span className="ml-1.5 font-mono text-[10px] font-bold text-ink-500/60">(스태미나 부족)</span>
                        )}
                      </p>
                      {live && (
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-ink-500/60">
                            정원 {live.count}/{maxSeats} 명
                          </span>
                          {live.inProgress && (
                            <span className="rounded-sm border border-seal-500/40 bg-seal-600/10 px-1.5 py-0.5 text-[10px] font-bold text-seal-600">
                              {inProgressLabel}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>
        </>
      )}

      {busyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black/50 px-6" role="alertdialog" aria-modal="true">
          <Card className="w-full max-w-xs text-center">
            <p className="text-sm font-semibold leading-relaxed text-ink-900">지금 하고 있던 활동을 끝내고 시도해 주세요.</p>
            <Button className="mt-4 w-full" onClick={() => setBusyModal(false)}>
              확인
            </Button>
          </Card>
        </div>
      )}

      {staminaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black/50 px-6" role="alertdialog" aria-modal="true">
          <Card className="w-full max-w-xs text-center">
            <p className="text-sm font-semibold leading-relaxed text-ink-900">스태미나가 부족합니다.</p>
            <p className="mt-1 text-xs text-ink-700/60">약초 농장에서 스태미나를 회복하고 다시 시도해 주세요.</p>
            <Button className="mt-4 w-full" onClick={() => setStaminaModal(false)}>
              확인
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
