import { useState } from 'react';
import { NPCS } from '../data/investigation/npcs';

interface Option {
  id: string;
  label: string;
}

interface Question {
  id: string;
  prompt: string;
  options: Option[];
  correctId: string;
}

const npcOptions: Option[] = NPCS.map((n) => ({ id: n.id, label: `${n.icon} ${n.name}` }));

const QUESTIONS: Question[] = [
  {
    id: 'culprit',
    prompt: '1. 이 사건의 범인은 누구인가?',
    options: npcOptions,
    correctId: 'paul',
  },
  {
    id: 'time-of-death',
    prompt: '2. 에드먼드가 실제로 사망한 시점은 언제인가?',
    options: [
      { id: 'before', label: '타치바나와의 몸싸움 도중' },
      { id: 'after-paul', label: '타치바나가 떠난 뒤, 파울이 현장에 왔을 때' },
      { id: 'unknown', label: '알 수 없다' },
    ],
    correctId: 'after-paul',
  },
  {
    id: 'last-seen',
    prompt: '3. 에드먼드를 마지막으로 만난 사람은 누구인가?',
    options: npcOptions,
    correctId: 'paul',
  },
  {
    id: 'report',
    prompt: '4. 진상 보고서는 현재 누구의 손에 있(었)는가?',
    options: [
      { id: 'tachibana', label: '타치바나 고가 가져갔다' },
      { id: 'paul', label: '파울 슈미트가 가지고 있다' },
      { id: 'lost', label: '완전히 사라졌다' },
    ],
    correctId: 'tachibana',
  },
  {
    id: 'arcadia-link',
    prompt: '5. 이번 살인은 60년 전 제5 기숙사 사건과 관련이 있는가?',
    options: [
      { id: 'yes', label: '관련이 있다' },
      { id: 'no', label: '관련이 없다, 우연이다' },
    ],
    correctId: 'yes',
  },
];

export default function FinalDeduction({ onSolved }: { onSolved: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = QUESTIONS.every((q) => answers[q.id]);
  const correctCount = QUESTIONS.filter((q) => answers[q.id] === q.correctId).length;
  const allCorrect = correctCount === QUESTIONS.length;

  function submit() {
    if (!allAnswered) return;
    setSubmitted(true);
    if (allCorrect) onSolved();
  }

  return (
    <div className="flex flex-col gap-4 rounded-sm border border-ink-700/15 bg-paper-50 p-4">
      <p className="font-serif-kr text-sm font-semibold text-ink-900">지금까지의 단서를 바탕으로 추리를 정리하자.</p>

      {QUESTIONS.map((q) => {
        const isCorrect = submitted && answers[q.id] === q.correctId;
        const isWrong = submitted && answers[q.id] && answers[q.id] !== q.correctId;
        return (
          <div key={q.id} className="flex flex-col gap-1.5">
            <p className="text-sm text-ink-900">
              {q.prompt} {isCorrect && <span className="text-seal-600">✓</span>} {isWrong && <span className="text-ink-500/60">✗</span>}
            </p>
            <div className="flex flex-col gap-1">
              {q.options.map((o) => (
                <label key={o.id} className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="radio"
                    name={q.id}
                    value={o.id}
                    checked={answers[q.id] === o.id}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={submit}
        disabled={!allAnswered}
        className="tablet-btn tablet-btn-dark self-start rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-40"
      >
        추리 제출
      </button>

      {submitted && allCorrect && (
        <div className="rounded-sm border border-seal-500/40 bg-paper-100 p-3 text-sm leading-relaxed text-ink-900">
          <p className="font-bold text-seal-600">완벽한 추리입니다 (5/5).</p>
          <p className="mt-1">
            범인은 학교 관리인 파울 슈미트였다. 타치바나에게 밀쳐져 쓰러진 에드먼드는 그때까지 살아있었지만, 진상 보고서가 이미
            사라진 것을 확인한 파울이 그를 직접 살해했다. 그는 시신 옆에 제5 기숙사의 문장과 &quot;ARCADIA&quot;라는 이름을 남겨,
            60년 전 사건이 다시는 묻히지 않도록 했다.
          </p>
        </div>
      )}
      {submitted && !allCorrect && (
        <div className="rounded-sm border border-ink-700/20 bg-paper-100 p-3 text-sm text-ink-700">
          {correctCount} / {QUESTIONS.length}개 일치. 아직 확신하기엔 이르다 — 틀린 부분(✗)의 단서를 다시 살펴보자.
        </div>
      )}
    </div>
  );
}
