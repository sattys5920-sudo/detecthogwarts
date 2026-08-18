import { useState } from 'react';
import { NPCS } from '../data/investigation/npcs';

const CULPRIT_ID = 'paul';

export default function FinalDeduction({ onSolved }: { onSolved: () => void }) {
  const [selected, setSelected] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);

  function submit() {
    if (!selected) return;
    if (selected === CULPRIT_ID) {
      setResult('correct');
      onSolved();
    } else {
      setResult('wrong');
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-ink-700/15 bg-paper-50 p-4">
      <p className="font-serif-kr text-sm font-semibold text-ink-900">이 사건의 범인은 누구인가?</p>
      <div className="flex flex-col gap-1.5">
        {NPCS.map((n) => (
          <label key={n.id} className="flex items-center gap-2 text-sm text-ink-900">
            <input type="radio" name="culprit" value={n.id} checked={selected === n.id} onChange={() => setSelected(n.id)} />
            {n.icon} {n.name}
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

      {result === 'correct' && (
        <div className="rounded-sm border border-seal-500/40 bg-paper-100 p-3 text-sm leading-relaxed text-ink-900">
          <p className="font-bold text-seal-600">정답입니다.</p>
          <p className="mt-1">
            범인은 학교 관리인 파울 슈미트였다. 타치바나에게 밀쳐져 쓰러진 에드먼드는 그때까지 살아있었지만, 진상 보고서가 이미
            사라진 것을 확인한 파울이 그를 직접 살해했다. 그는 시신 옆에 제5 기숙사의 문장과 &quot;ARCADIA&quot;라는 이름을 남겨,
            60년 전 사건이 다시는 묻히지 않도록 했다.
          </p>
        </div>
      )}
      {result === 'wrong' && (
        <div className="rounded-sm border border-ink-700/20 bg-paper-100 p-3 text-sm text-ink-700">
          아직 확신하기엔 이르다. 단서를 다시 살펴보자.
        </div>
      )}
    </div>
  );
}
