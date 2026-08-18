import Card from '../components/Card';
import ChatLog, { type ChatMessage } from '../components/ChatLog';
import Composer from '../components/Composer';
import Letterhead from '../components/Letterhead';

const MESSAGES: ChatMessage[] = [
  { id: 'q1', name: '불가', initial: '불', who: 'red', text: '회랑 끝에서 차가운 바람이 느껴진다.' },
  { id: 'q2', name: '서호', initial: '서', who: 'black', text: '조심스럽게 다가가 본다.' },
  { id: 'q3', name: '유리', initial: '유', who: 'indigo', text: '나침반을 꺼내 방향을 확인한다.' },
  { id: 'q4', name: '불가', initial: '불', who: 'red', text: '바늘이 미친 듯이 돌아간다……' },
  { id: 'q5', name: '다인', initial: '다', who: 'black', text: '다들 뒤로 물러나자.', me: true },
];

export default function ExplorationPage() {
  return (
    <div className="flex flex-col gap-4">
      <Letterhead label="탐사 기록 01" context="아직 배정된 탐사가 없습니다" meta="남은 시간 · --:--" tag="준비 중" />

      <Card className="text-center text-sm text-ink-500/60">
        아래는 탐사 진행 화면 미리보기예요. 실제 진행 기능은 곧 연결됩니다.
      </Card>

      <div className="rounded-sm border border-ink-700/15 bg-paper-50 p-3.5">
        <p className="mb-2.5 text-center font-mono text-[11px] text-ink-500/70">
          ◆ 탐사 시작 · 제한시간 10분
        </p>
        <ChatLog messages={MESSAGES} />
        <div className="mt-3">
          <Composer />
        </div>
      </div>
    </div>
  );
}
