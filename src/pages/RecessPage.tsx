import { useState } from 'react';
import Card from '../components/Card';
import Letterhead from '../components/Letterhead';

interface StatKey {
  key: '마력' | '담력' | '지식';
}

const ACTIVITIES: { label: string; stat: StatKey['key']; desc: string }[] = [
  { label: '마법 연습', stat: '마력', desc: '연습실에서 주문을 반복 연습합니다.' },
  { label: '담력 훈련', stat: '담력', desc: '어두운 회랑을 혼자 걸어봅니다.' },
  { label: '서고에서 독서', stat: '지식', desc: '서고에 틀어박혀 고서를 읽습니다.' },
];

export default function RecessPage() {
  const [stats, setStats] = useState<Record<StatKey['key'], number>>({ 마력: 72, 담력: 45, 지식: 88 });

  function train(stat: StatKey['key']) {
    setStats((prev) => ({ ...prev, [stat]: Math.min(100, prev[stat] + 4) }));
  }

  return (
    <div className="flex flex-col gap-4">
      <Letterhead label="휴게시간" context="능력치를 키워보세요" meta="쉬는 시간 · 10분 남음" />

      <div className="flex flex-col gap-2 rounded-sm border border-ink-700/15 bg-paper-50 p-3.5">
        {(Object.keys(stats) as StatKey['key'][]).map((s) => (
          <div key={s} className="flex items-center gap-2 text-xs">
            <span className="w-8 flex-none text-ink-500/70">{s}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full border border-ink-700/15 bg-paper-200">
              <div className="h-full bg-ink-black transition-all duration-300" style={{ width: `${stats[s]}%` }} />
            </div>
            <span className="w-6 flex-none text-right font-mono text-ink-red">{stats[s]}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {ACTIVITIES.map((a) => (
          <Card key={a.label} className="flex items-center justify-between gap-3">
            <div>
              <p className="font-serif-kr font-semibold text-ink-900">{a.label}</p>
              <p className="mt-0.5 text-xs text-ink-700/70">{a.desc}</p>
            </div>
            <button
              type="button"
              onClick={() => train(a.stat)}
              disabled={stats[a.stat] >= 100}
              className="flex-none rounded-sm bg-ink-black px-3 py-1.5 text-xs font-bold text-paper-50 disabled:opacity-40"
            >
              훈련하기
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
