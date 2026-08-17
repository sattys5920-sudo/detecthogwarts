import { useEffect, useState } from 'react';
import Card from '../components/Card';
import RequireGame from '../components/RequireGame';
import { isFirebaseConfigured } from '../firebase/config';
import { fetchLeaderboard, type LeaderboardEntry } from '../firebase/leaderboard';

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchLeaderboard(20)
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <RequireGame>
      <h1 className="font-display text-2xl text-gold-300">명예의 전당</h1>
      <p className="mt-1 font-serif-kr text-sm text-parchment-200/70">
        가장 빠르게 사건을 해결한 탐정들입니다.
      </p>

      {!isFirebaseConfigured && (
        <p className="mt-3 rounded-lg border border-gold-500/30 bg-gold-500/5 px-4 py-2 text-xs text-gold-300/90">
          Firebase 설정이 아직 연결되지 않아, 이 브라우저에만 저장되는 데모 기록입니다.
        </p>
      )}

      <div className="mt-6">
        {error && (
          <p className="text-sm text-ember-500">기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        )}
        {!error && entries === null && (
          <p className="text-sm text-parchment-200/50">불러오는 중...</p>
        )}
        {entries && entries.length === 0 && (
          <p className="text-sm text-parchment-200/50">아직 사건을 해결한 탐정이 없습니다.</p>
        )}
        {entries && entries.length > 0 && (
          <Card>
            <ol className="divide-y divide-white/5">
              {entries.map((entry, i) => (
                <li key={entry.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-serif-kr text-sm text-gold-400/80">
                      {i + 1}
                    </span>
                    <span className="font-serif-kr text-sm font-semibold text-parchment-100">
                      {entry.nickname}
                    </span>
                    <span className="text-xs text-parchment-200/50">{entry.house}</span>
                  </div>
                  <span className="font-mono text-sm tabular-nums text-parchment-200/80">
                    {formatTime(entry.elapsedSeconds)}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        )}
      </div>
    </RequireGame>
  );
}
