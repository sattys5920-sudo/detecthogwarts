import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import InkBlot from '../components/InkBlot';
import OwlIntro from '../components/OwlIntro';
import PaperTexture from '../components/PaperTexture';
import SortingTest from '../components/SortingTest';
import { useGame } from '../context/GameContext';
import { type HouseId, topHouse } from '../data/sortingTest';

const ADMIN_PASSCODE = '316316316';
const ZERO_SCORES: Record<HouseId, number> = { flame: 0, moonlight: 0, earth: 0, wind: 0 };

export default function LoadingPage() {
  const game = useGame();
  const navigate = useNavigate();
  const [stage, setStage] = useState<'test' | 'form'>('test');
  const [testScores, setTestScores] = useState<Record<HouseId, number> | null>(null);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [adminGateOpen, setAdminGateOpen] = useState(false);
  const [adminNickname, setAdminNickname] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  function handleTestComplete(scores: Record<HouseId, number>) {
    setTestScores(scores);
    setStage('form');
  }

  async function handleEnter() {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError('이름을 입력해 주세요.');
      return;
    }
    if (trimmed.length > 12) {
      setError('이름은 12자 이내로 입력해 주세요.');
      return;
    }
    if (!testScores) return;
    setSubmitting(true);
    try {
      await game.completeSignup(trimmed, testScores, topHouse(testScores));
      navigate('/hall');
    } catch {
      setError('입장 처리에 실패했습니다. 다시 시도해 주세요.');
      setSubmitting(false);
    }
  }

  function closeAdminGate() {
    setAdminGateOpen(false);
    setAdminNickname('');
    setAdminPasscode('');
    setAdminError('');
  }

  async function handleAdminEnter() {
    if (adminPasscode !== ADMIN_PASSCODE) {
      setAdminError('암호가 올바르지 않습니다.');
      return;
    }
    let trimmed = '';
    if (!game.hasEntered) {
      trimmed = adminNickname.trim();
      if (!trimmed) {
        setAdminError('이름을 입력해 주세요.');
        return;
      }
      if (trimmed.length > 12) {
        setAdminError('이름은 12자 이내로 입력해 주세요.');
        return;
      }
    }
    setAdminSubmitting(true);
    try {
      if (!game.hasEntered) {
        await game.completeSignup(trimmed, ZERO_SCORES, 'moonlight');
      }
      game.unlockAdmin();
      navigate('/hall');
    } catch {
      setAdminError('입장 처리에 실패했습니다. 다시 시도해 주세요.');
      setAdminSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center">
      <PaperTexture />
      <InkBlot className="pointer-events-none absolute -top-4 -right-10 h-32 w-44 text-ink-black/90" />

      <div className="relative max-w-xs">
        <p className="font-mono text-xs tracking-[0.15em] text-seal-600">CASE FILES</p>
        <h1 className="font-gothic mt-1 text-5xl leading-none text-ink-black">HWCF</h1>
      </div>

      {adminGateOpen ? (
        <Card className="relative w-full max-w-xs text-left">
          <p className="font-mono text-[11px] tracking-wide text-seal-600">관리자 입장</p>
          <p className="mt-1 font-serif-kr text-sm text-ink-700/80">
            암호를 입력하면 적성 검사 없이 바로 입장합니다. 화면은 플레이어와 동일하되, 진행을 조작할 수 있는 권한이 함께 켜집니다.
          </p>
          {!game.hasEntered && (
            <label className="mt-4 block font-serif-kr text-sm text-ink-700/80">
              이름
              <input
                value={adminNickname}
                onChange={(e) => {
                  setAdminNickname(e.target.value);
                  setAdminError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminEnter()}
                placeholder="이름을 입력하세요"
                maxLength={12}
                className="mt-1.5 w-full rounded-lg border border-ink-700/20 bg-paper-100/60 px-3 py-2 text-ink-900 outline-none placeholder:text-ink-500/40 focus:border-seal-500"
              />
            </label>
          )}
          <label className="mt-3 block font-serif-kr text-sm text-ink-700/80">
            관리자 암호
            <input
              type="password"
              value={adminPasscode}
              onChange={(e) => {
                setAdminPasscode(e.target.value);
                setAdminError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminEnter()}
              className="mt-1.5 w-full rounded-lg border border-ink-700/20 bg-paper-100/60 px-3 py-2 text-ink-900 outline-none focus:border-seal-500"
            />
          </label>
          {adminError && <p className="mt-2 text-xs text-seal-600">{adminError}</p>}
          <div className="mt-4 flex gap-2">
            <Button className="flex-1" onClick={handleAdminEnter} disabled={adminSubmitting}>
              {adminSubmitting ? '입장 처리 중…' : '입장하기'}
            </Button>
            <button type="button" onClick={closeAdminGate} className="px-2 text-xs text-ink-500/50 hover:text-ink-700">
              취소
            </button>
          </div>
        </Card>
      ) : game.hasEntered ? (
        <Card className="relative w-full max-w-xs">
          <p className="font-serif-kr text-sm text-ink-700/80">
            다시 오셨군요, <span className="font-semibold text-seal-600">{game.nickname}</span>님.
          </p>
          <Button className="mt-4 w-full" onClick={() => navigate('/hall')}>
            계속하기
          </Button>
          <button
            type="button"
            className="mt-3 text-xs text-ink-500/50 underline-offset-2 hover:text-ink-700 hover:underline"
            onClick={game.resetPlayer}
          >
            다른 이름으로 시작하기
          </button>
        </Card>
      ) : (
        <OwlIntro>
          {stage === 'test' ? (
            <SortingTest onComplete={handleTestComplete} />
          ) : (
            <Card className="relative w-full text-left">
              <p className="font-mono text-[11px] tracking-wide text-seal-600">입학 초대장</p>
              <p className="mt-1 font-serif-kr text-sm text-ink-700/80">
                적성 검사가 끝났습니다. 이름을 적으면 입학이 확정됩니다.
              </p>
              <label className="mt-4 block font-serif-kr text-sm text-ink-700/80">
                이름
                <input
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
                  placeholder="이름을 입력하세요"
                  maxLength={12}
                  className="mt-1.5 w-full rounded-lg border border-ink-700/20 bg-paper-100/60 px-3 py-2 text-ink-900 outline-none placeholder:text-ink-500/40 focus:border-seal-500"
                />
              </label>
              {error && <p className="mt-2 text-xs text-seal-600">{error}</p>}
              <Button className="mt-4 w-full" onClick={handleEnter} disabled={submitting}>
                {submitting ? '입장 처리 중…' : '초대장 수락하고 입장하기'}
              </Button>
            </Card>
          )}
        </OwlIntro>
      )}

      {!adminGateOpen && !game.isAdmin && (
        <button
          type="button"
          onClick={() => setAdminGateOpen(true)}
          className="text-xs text-ink-500/30 underline-offset-2 hover:text-ink-700 hover:underline"
        >
          관리자이신가요?
        </button>
      )}
    </div>
  );
}
