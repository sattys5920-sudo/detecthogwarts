import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import RequireGame from '../components/RequireGame';
import { useGame } from '../context/GameContext';
import { submitResult } from '../firebase/leaderboard';
import { CLUES, HOUSES, SOLUTION, SUSPECTS } from '../data/story';

const REQUIRED_COUNT = SOLUTION.requiredClueIds.length;

export default function AccusationPage() {
  const game = useGame();
  const navigate = useNavigate();
  const [culpritId, setCulpritId] = useState<string | null>(null);
  const [selectedClueIds, setSelectedClueIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const discoveredClues = CLUES.filter((c) => game.discoveredClueIds.includes(c.id));

  function toggleClue(id: string) {
    setFeedback(null);
    setSelectedClueIds((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= REQUIRED_COUNT) return prev;
      return [...prev, id];
    });
  }

  async function finalizeResult(solved: boolean) {
    setSubmitting(true);
    game.finishGame();
    const house = HOUSES.find((h) => h.id === game.houseId);
    try {
      await submitResult({
        nickname: game.nickname,
        house: house?.name ?? game.houseId,
        elapsedSeconds: game.elapsedSeconds,
        solved,
      });
    } catch (err) {
      console.error('리더보드 기록 저장에 실패했습니다.', err);
    } finally {
      setSubmitting(false);
      navigate('/result', { state: { solved } });
    }
  }

  function handleSubmit() {
    if (!culpritId || selectedClueIds.length !== REQUIRED_COUNT) return;

    const isCorrectCulprit = culpritId === SOLUTION.culpritId;
    const isCorrectClues =
      selectedClueIds.length === SOLUTION.requiredClueIds.length &&
      SOLUTION.requiredClueIds.every((id) => selectedClueIds.includes(id));

    if (isCorrectCulprit && isCorrectClues) {
      finalizeResult(true);
      return;
    }

    setFeedback('아직 확신할 수 없습니다. 단서를 다시 살펴보고 추리해 보세요.');
  }

  return (
    <RequireGame>
      <h1 className="font-display text-2xl text-gold-300">범인 지목</h1>
      <p className="mt-1 font-serif-kr text-sm text-parchment-200/70">{SOLUTION.briefing}</p>

      <section className="mt-6">
        <h2 className="font-serif-kr text-sm font-semibold text-parchment-200/80">
          1. 범인이라고 생각하는 사람을 고르세요
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SUSPECTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setCulpritId(s.id);
                setFeedback(null);
              }}
              className="text-left"
            >
              <Card
                className={`transition-colors ${
                  culpritId === s.id
                    ? 'border-gold-400 bg-gold-500/15 ring-2 ring-gold-400/40'
                    : 'hover:border-white/25'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{s.emblem}</span>
                  <div>
                    <p className="font-serif-kr font-semibold text-parchment-100">{s.name}</p>
                    <p className="text-xs text-parchment-200/60">{s.role}</p>
                  </div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-serif-kr text-sm font-semibold text-parchment-200/80">
          2. 근거가 되는 핵심 단서 {REQUIRED_COUNT}개를 고르세요 ({selectedClueIds.length}/
          {REQUIRED_COUNT})
        </h2>
        {discoveredClues.length === 0 ? (
          <p className="mt-3 text-sm text-parchment-200/50">
            아직 확보한 단서가 없습니다. 먼저 조사를 진행해 주세요.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {discoveredClues.map((clue) => {
              const selected = selectedClueIds.includes(clue.id);
              return (
                <button key={clue.id} type="button" onClick={() => toggleClue(clue.id)} className="text-left">
                  <Card
                    className={`transition-colors ${
                      selected
                        ? 'border-gold-400 bg-gold-500/15 ring-2 ring-gold-400/40'
                        : 'hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{clue.icon}</span>
                      <p className="font-serif-kr text-sm font-semibold text-parchment-100">
                        {clue.name}
                      </p>
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {feedback && (
        <p className="mt-6 rounded-lg border border-ember-500/40 bg-ember-500/10 px-4 py-3 text-center text-sm text-ember-500">
          {feedback}
        </p>
      )}

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button
          onClick={handleSubmit}
          disabled={!culpritId || selectedClueIds.length !== REQUIRED_COUNT || submitting}
        >
          최종 지목하기
        </Button>
        <Button variant="ghost" onClick={() => finalizeResult(false)} disabled={submitting}>
          포기하고 결과 보기
        </Button>
      </div>
    </RequireGame>
  );
}
