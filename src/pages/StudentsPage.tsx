import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Letterhead from '../components/Letterhead';
import { usePageBack } from '../context/BackContext';
import { HOUSES, SCHOOL_NAME } from '../data/school';
import { listenAllPlayers, type PlayerRecord } from '../firebase/players';

const ADMIN_USERNAME = 'admin';

function houseName(id: string | null) {
  return HOUSES.find((h) => h.id === id)?.name ?? null;
}

function StudentRow({ player }: { player: PlayerRecord }) {
  const house = houseName(player.assignedHouse);
  const initial = player.nickname ? player.nickname[0] : '?';

  return (
    <Card className="flex items-center gap-3">
      <div
        className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-full bg-ink-black text-base font-bold text-paper-50"
        style={{ boxShadow: '0 0 0 2px var(--color-paper-50), 0 0 0 3px var(--color-ink-700)' }}
      >
        {player.avatarDataUrl ? <img src={player.avatarDataUrl} alt="" className="h-full w-full object-cover" /> : initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-gothic truncate text-lg text-ink-black">{player.nickname}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {house && (
            <span className="rounded-sm border border-ink-700/25 bg-paper-100 px-2 py-0.5 text-[10px] font-bold text-ink-700">{house} 기숙사</span>
          )}
          {player.grade && (
            <span className="rounded-sm border border-ink-700/25 bg-paper-100 px-2 py-0.5 text-[10px] font-bold text-ink-700">{player.grade} 학년</span>
          )}
          {player.pet && (
            <span className="rounded-sm border border-ink-700/25 bg-paper-100 px-2 py-0.5 text-[10px] font-bold text-ink-700">🐾 {player.pet}</span>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function StudentsPage() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<PlayerRecord[]>([]);

  usePageBack(useCallback(() => navigate(-1), [navigate]));

  useEffect(() => listenAllPlayers(setPlayers), []);

  const students = players
    .filter((p) => p.username !== ADMIN_USERNAME && p.nickname)
    .sort((a, b) => a.nickname.localeCompare(b.nickname, 'ko'));

  return (
    <div className="flex flex-col gap-4">
      <Letterhead label="학생 목록" context={SCHOOL_NAME} meta={`가입자 ${students.length} 명`} />

      {students.length === 0 ? (
        <Card className="text-center text-sm text-ink-500/60">아직 입학을 완료한 학생이 없습니다.</Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {students.map((p) => (
            <StudentRow key={p.id} player={p} />
          ))}
        </div>
      )}
    </div>
  );
}
