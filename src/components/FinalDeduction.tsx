import { useState } from 'react';

const OPTIONS = [
  {
    id: 'A',
    text: '파울 슈미트 — 타치바나의 공격 이후 살아 있던 에드먼드를 살해하고, 아르카디아의 문장과 안토니우 아르카디아의 이름을 남겨 60년 전 사건을 공론화하려 했다.',
    result: 'TRUE ENDING 조건 충족.',
    trueEnding: true,
  },
  {
    id: 'B',
    text: '타치바나 고 — 에드먼드를 밀쳐 죽였다.',
    result: '부분 정답. 실제 사망 시각과 생존 흔적 때문에 오답.',
    trueEnding: false,
  },
  {
    id: 'C',
    text: '셀레나 미고 — 보고서를 빼앗고 살해했다.',
    result: '부분 정답. 보고서 탈취는 사실이나 최종 살인은 아님.',
    trueEnding: false,
  },
  {
    id: 'D',
    text: '용의자 5 — 아르카디아의 잔재이므로 살해했다.',
    result: '동기와 현장 증거가 맞지 않아 오답.',
    trueEnding: false,
  },
];

export default function FinalDeduction({ onSolved }: { onSolved: () => void }) {
  const [selected, setSelected] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const picked = OPTIONS.find((o) => o.id === selected);

  function submit() {
    if (!selected) return;
    setSubmitted(true);
    if (picked?.trueEnding) onSolved();
  }

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-ink-700/15 bg-paper-50 p-4">
      <p className="font-serif-kr text-sm font-semibold text-ink-900">마지막 주문은 누구를 향했나 — 범인과 범행 과정을 제출하라.</p>
      <div className="flex flex-col gap-2">
        {OPTIONS.map((o) => (
          <label key={o.id} className="flex items-start gap-2 text-sm text-ink-900">
            <input
              type="radio"
              name="ending"
              value={o.id}
              checked={selected === o.id}
              onChange={() => setSelected(o.id)}
              className="mt-1 flex-none"
            />
            <span>
              <b>{o.id}.</b> {o.text}
            </span>
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={!selected}
        className="tablet-btn tablet-btn-dark self-start rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-40"
      >
        추리 제출
      </button>

      {submitted && picked?.trueEnding && (
        <div className="flex flex-col gap-3 rounded-sm border border-seal-500/40 bg-paper-100 p-3.5 text-sm leading-relaxed text-ink-900">
          <p className="font-bold text-seal-600">TRUE ENDING — 마지막 주문은 누구를 향했나</p>
          <p>사건의 마지막 기록이 화면에 나타난다.</p>
          <p className="italic">에드먼드의 메모: &quot;진실은 반드시 밝혀져야 한다. 하지만 누군가가 다치면서까지 밝혀져야 하는 것은 아니다.&quot;</p>
          <p>이어 파울이 남긴 마지막 기록이 공개된다.</p>
          <p className="italic">파울의 기록: &quot;그들은 60년 동안 죽은 자의 이름을 지웠다. 나는 이번에는 이름을 지우지 못하게 할 것이다.&quot;</p>
          <p>화면에는 아르카디아의 문장이 다시 나타난다. 그리고 마지막 문구가 뜬다.</p>
          <p className="text-center font-display text-lg text-seal-600">「아르카디아는 사라진 것이 아니다. 우리는 단지 그것을 기억하지 않았을 뿐이다.」</p>
        </div>
      )}
      {submitted && picked && !picked.trueEnding && (
        <div className="rounded-sm border border-ink-700/20 bg-paper-100 p-3 text-sm text-ink-700">{picked.result}</div>
      )}
    </div>
  );
}
