import { useState } from 'react';
import type { NotebookEntry } from '../hooks/useNotebook';

const REQUIRED_FLAGS = [
  '엘리오의 사망 시각과 흔적',
  '문서 탈취',
  '타치바나의 기절 진술',
  '파울의 현장 도착 진술',
  '파울의 가족사',
  '현장 혈서 — 아르카디아',
];

export default function FinalDeduction({ notebookEntries, onSolved }: { notebookEntries: NotebookEntry[]; onSolved: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const collected = REQUIRED_FLAGS.filter((f) => notebookEntries.some((e) => e.title === f));
  const solvedEnough = collected.length >= REQUIRED_FLAGS.length;

  function accuse() {
    setSubmitted(true);
    if (solvedEnough) onSolved();
  }

  if (reviewing) {
    return (
      <div className="flex flex-col gap-3 rounded-sm border border-ink-700/15 bg-paper-50 p-4">
        <p className="font-serif-kr text-sm font-semibold text-ink-900">확보한 핵심 단서</p>
        <ul className="flex flex-col gap-1.5 text-sm">
          {REQUIRED_FLAGS.map((f) => {
            const got = collected.includes(f);
            return (
              <li key={f} className="flex items-center gap-2">
                <span className={`h-2 w-2 flex-none rounded-full ${got ? 'bg-seal-600' : 'bg-ink-500/20'}`} />
                <span className={got ? 'text-ink-900' : 'text-ink-500/50'}>{f}</span>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-ink-700/70">
          {collected.length} / {REQUIRED_FLAGS.length}개 확보. 탐사 활동으로 돌아가 부족한 단서를 더 조사해 수첩에 등록하세요.
        </p>
        <button
          type="button"
          onClick={() => setReviewing(false)}
          className="tablet-btn tablet-btn-ghost self-start rounded-lg px-4 py-2 text-sm font-bold"
        >
          되돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-ink-700/15 bg-paper-50 p-4">
      <p className="font-serif-kr text-sm font-semibold text-ink-900">마지막 기록을 맞추면 시간 순서가 선명해진다. 이제, 범인을 지목하라.</p>

      {!submitted && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={accuse}
            className="tablet-btn tablet-btn-dark rounded-lg px-4 py-2 text-sm font-bold"
          >
            파울을 범인으로 지목한다
          </button>
          <button
            type="button"
            onClick={() => setReviewing(true)}
            className="tablet-btn tablet-btn-ghost rounded-lg px-4 py-2 text-sm font-bold"
          >
            모든 증거를 다시 확인한다
          </button>
        </div>
      )}

      {submitted && solvedEnough && (
        <div className="flex flex-col gap-3 rounded-sm border border-seal-500/40 bg-paper-100 p-3.5 text-sm leading-relaxed text-ink-900">
          <p className="font-bold text-seal-600">ENDING A — 진실을 밝힌다</p>
          <p>아르카디아는 사라진 것이 아니었다. 이름만 사라졌을 뿐이었다.</p>
          <p>60년 전 은폐된 사건과 현재의 살인이 하나의 선으로 이어진다.</p>
          <p className="italic">교장: &quot;이제 학교는 더 이상 침묵하지 않겠습니다.&quot;</p>
          <p>진실이 밝혀지는 순간, 아름다움이라는 이름으로 포장된 희생은 그 본래의 잔혹함을 드러낸다.</p>
        </div>
      )}

      {submitted && !solvedEnough && (
        <div className="flex flex-col gap-3 rounded-sm border border-ink-700/20 bg-paper-100 p-3.5 text-sm leading-relaxed text-ink-900">
          <p className="font-bold text-ink-700">ENDING B — 증거 부족</p>
          <p>범인은 특정했지만 모든 연결고리를 설명하지 못했다.</p>
          <p>사건은 끝나지 않았다. 아르카디아의 잔재가 아직 남아 있기 때문이다.</p>
          <p className="text-xs text-ink-500/60">
            (핵심 단서 {collected.length} / {REQUIRED_FLAGS.length}개만 확보됨. 조사 활동으로 돌아가 부족한 단서를 더 모으면 다시 지목할 수 있습니다.)
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="tablet-btn tablet-btn-ghost self-start rounded-lg px-4 py-1.5 text-xs font-bold"
          >
            다시 지목하기
          </button>
        </div>
      )}
    </div>
  );
}
