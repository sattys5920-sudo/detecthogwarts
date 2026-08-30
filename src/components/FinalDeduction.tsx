import { useEffect, useState } from 'react';
import { DEFAULT_KILLER_NAME, listenKillerName } from '../firebase/finalDeduction';
import { sendAdlib } from '../firebase/session';

const ENDING_A_TEXT = [
  'ENDING A — 진실을 밝힌다',
  '아르카디아는 사라진 것이 아니었다. 이름만 사라졌을 뿐이었다.',
  '60 년 전 은폐된 사건과 현재의 살인이 하나의 선으로 이어진다.',
  '교장: "이제 학교는 더 이상 침묵하지 않겠습니다."',
  '진실이 밝혀지는 순간, 아름다움이라는 이름으로 포장된 희생은 그 본래의 잔혹함을 드러낸다.',
].join('\n');

const ENDING_B_TEXT = [
  'ENDING B — 증거 부족',
  '범인은 특정했지만 모든 연결고리를 설명하지 못했다.',
  '사건은 끝나지 않았다. 아르카디아의 잔재가 아직 남아 있기 때문이다.',
].join('\n');

/**
 * Admin-only — the previous version rendered this "{name}을 범인으로 지목한다" button and its
 * ending text directly to every player, spoiling the mystery's answer outright. Now it's a GM
 * control: the admin sends the accusation, and then whichever ending fits how the round went,
 * into the shared investigation chat (see sendAdlib) — nothing here is visible to players except
 * what the admin explicitly sends.
 */
export default function FinalDeduction({ day }: { day: number }) {
  const [killerName, setKillerName] = useState(DEFAULT_KILLER_NAME);
  const [accused, setAccused] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => listenKillerName(setKillerName), []);

  async function sendAccusation() {
    setSending(true);
    try {
      await sendAdlib(day, '', `${killerName}을(를) 범인으로 지목했다.`);
      setAccused(true);
    } finally {
      setSending(false);
    }
  }

  async function sendEnding(text: string) {
    setSending(true);
    try {
      await sendAdlib(day, '', text);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-seal-500/40 bg-paper-100 p-3.5">
      <p className="font-mono text-[11px] font-bold tracking-wide text-seal-600">최종 지목 — 관리자 전용</p>
      <p className="text-xs text-ink-700/70">
        아래 버튼을 누르면 조사실 채팅에 즉시 보내져 모든 플레이어에게 표시됩니다. 이 카드 자체는 관리자에게만 보입니다.
      </p>

      {!accused ? (
        <button
          type="button"
          onClick={sendAccusation}
          disabled={sending}
          className="tablet-btn tablet-btn-dark self-start px-4 py-2 text-sm font-bold disabled:opacity-40"
        >
          {sending ? '전송 중…' : `${killerName}을(를) 범인으로 지목한다`}
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-ink-700/70">지목을 보냈습니다. 이제 결말을 골라 보내세요.</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => sendEnding(ENDING_A_TEXT)}
              disabled={sending}
              className="tablet-btn tablet-btn-dark px-3 py-1.5 text-xs font-bold disabled:opacity-40"
            >
              ENDING A 보내기 (진실을 밝힌다)
            </button>
            <button
              type="button"
              onClick={() => sendEnding(ENDING_B_TEXT)}
              disabled={sending}
              className="tablet-btn tablet-btn-ghost px-3 py-1.5 text-xs font-bold disabled:opacity-40"
            >
              ENDING B 보내기 (증거 부족)
            </button>
            <button
              type="button"
              onClick={() => setAccused(false)}
              className="text-xs font-bold text-ink-500/60 hover:text-seal-600"
            >
              다시 지목하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
