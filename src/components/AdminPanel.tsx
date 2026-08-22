import { useEffect, useState } from 'react';
import Button from './Button';
import Card from './Card';
import InterrogationInbox from './InterrogationInbox';
import { HOUSES } from '../data/school';
import type { HouseId } from '../data/sortingTest';
import { sendAnnouncement } from '../firebase/announcements';
import { assignHouse, listenAllPlayers, type PlayerRecord } from '../firebase/players';

const ADMIN_NICKNAME = '관리자';

function houseOf(id: HouseId | null) {
  return HOUSES.find((h) => h.id === id) ?? null;
}

function formatTime(ms: number) {
  if (!ms) return '-';
  return new Date(ms).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function PlayerRow({ player }: { player: PlayerRecord }) {
  const [selected, setSelected] = useState<HouseId>(player.assignedHouse ?? player.computedHouse);
  const [sending, setSending] = useState(false);
  const computed = houseOf(player.computedHouse);
  const assigned = houseOf(player.assignedHouse);

  async function send() {
    setSending(true);
    try {
      await assignHouse(player.id, selected);
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-gothic text-xl text-ink-black">{player.nickname}</p>
        <p className="font-mono text-[10px] text-ink-500/60">{formatTime(player.createdAt)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-ink-700/80">
        <span>
          추천: <b>{computed ? computed.name : '-'}</b>
        </span>
        <span className="text-ink-500/40">·</span>
        <span>
          현재 배정:{' '}
          {assigned ? (
            <b className="text-seal-600">{assigned.name}</b>
          ) : (
            <b className="text-ink-500/60">미배정</b>
          )}
        </span>
        {player.assignedAt && <span className="text-ink-500/50">({formatTime(player.assignedAt)})</span>}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-ink-500/60">
        {HOUSES.map((h) => (
          <span key={h.id}>
            {h.name} {player.testScores?.[h.id as HouseId] ?? 0}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value as HouseId)}
          className="flex-1 rounded-lg border border-ink-700/20 bg-paper-100/60 px-2.5 py-1.5 text-sm text-ink-900 outline-none focus:border-seal-500"
        >
          {HOUSES.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
        <Button onClick={send} disabled={sending} className="flex-none px-4 py-1.5 text-xs">
          {sending ? '발송 중…' : assigned ? '재발송' : '배정 발송'}
        </Button>
      </div>
    </Card>
  );
}

function AnnouncementSender() {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sentAt, setSentAt] = useState<number | null>(null);

  async function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      await sendAnnouncement(trimmed);
      setSentAt(Date.now());
      setText('');
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="flex flex-col gap-2.5">
      <div>
        <p className="font-gothic text-xl text-ink-black">교내 안내 (전체 팝업)</p>
        <p className="mt-0.5 text-xs text-ink-700/70">보내면 접속 중인 모든 플레이어의 화면에 팝업으로 표시됩니다.</p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="예: 3교시 수업은 5분 뒤 대강당에서 시작합니다."
        className="w-full rounded-lg border border-ink-700/20 bg-paper-100/60 px-2.5 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-500/40 focus:border-seal-500"
      />
      <div className="flex items-center justify-between gap-2">
        {sentAt ? (
          <p className="text-[11px] text-seal-600">
            {new Date(sentAt).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })}에 발송됨
          </p>
        ) : (
          <span />
        )}
        <Button onClick={send} disabled={sending || !text.trim()} className="flex-none px-4 py-1.5 text-xs">
          {sending ? '발송 중…' : '전체 공지 보내기'}
        </Button>
      </div>
    </Card>
  );
}

export default function AdminPanel() {
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const members = players.filter((p) => p.nickname !== ADMIN_NICKNAME);

  useEffect(() => listenAllPlayers(setPlayers), []);

  return (
    <div className="flex flex-col gap-4">
      <AnnouncementSender />

      <InterrogationInbox />

      <div>
        <p className="font-gothic text-3xl text-ink-black">가입자 목록 · 기숙사 배정</p>
        <p className="mt-1 text-sm text-ink-700/70">응시자 {members.length}명 · 추천 기숙사를 확인하고 배정을 발송하세요.</p>
      </div>

      {members.length === 0 && <Card className="text-center text-sm text-ink-500/60">아직 응시한 사람이 없습니다.</Card>}

      <div className="flex flex-col gap-3">
        {members.map((p) => (
          <PlayerRow key={p.id} player={p} />
        ))}
      </div>
    </div>
  );
}
