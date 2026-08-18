import { useMemo, useState } from 'react';
import { type HouseId, type SortingAnswer, type SortingOption, SORTING_QUESTIONS, scoreSortingAnswers } from '../data/sortingTest';
import Card from './Card';

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface SortingTestProps {
  onComplete: (scores: Record<HouseId, number>) => void;
}

export default function SortingTest({ onComplete }: SortingTestProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<SortingAnswer[]>([]);

  const question = SORTING_QUESTIONS[index];
  const options = useMemo(() => shuffled(question.options), [question]);

  function choose(option: SortingOption) {
    const nextAnswers = [...answers, { question, option }];
    if (index + 1 < SORTING_QUESTIONS.length) {
      setAnswers(nextAnswers);
      setIndex(index + 1);
    } else {
      onComplete(scoreSortingAnswers(nextAnswers));
    }
  }

  return (
    <Card className="w-full text-left">
      <p className="font-mono text-[11px] tracking-wide text-seal-600">적성 검사 · {index + 1} / {SORTING_QUESTIONS.length}</p>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-paper-200">
        <div
          className="h-full bg-seal-500 transition-all duration-300"
          style={{ width: `${((index + 1) / SORTING_QUESTIONS.length) * 100}%` }}
        />
      </div>

      <p className="mt-4 font-serif-kr text-base font-semibold leading-snug text-ink-900">{question.prompt}</p>

      <div className="mt-4 flex flex-col gap-2">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => choose(option)}
            className="rounded-lg border border-ink-700/20 bg-paper-100/60 px-3.5 py-2.5 text-left text-sm text-ink-900 transition-colors hover:border-seal-500 hover:bg-paper-100"
          >
            {option.text}
          </button>
        ))}
      </div>
    </Card>
  );
}
