import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import InkBlot from '../components/InkBlot';
import OwlIntro from '../components/OwlIntro';
import PaperTexture from '../components/PaperTexture';
import PatronusTest from '../components/PatronusTest';
import SortingTest from '../components/SortingTest';
import { useGame } from '../context/GameContext';
import type { PatronusId } from '../game/forest/types';
import { type HouseId, topHouse } from '../data/sortingTest';

const ADMIN_PASSCODE = '316316316';
const GRADES = [10, 11, 12];

const inputClass =
  'mt-1.5 w-full rounded-lg border border-ink-700/20 bg-paper-100/60 px-3 py-2 text-ink-900 outline-none placeholder:text-ink-500/40 focus:border-seal-500';

function AccountStep() {
  const game = useGame();
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function switchMode(next: 'signup' | 'login') {
    setMode(next);
    setError('');
    setPassword('');
    setPasswordConfirm('');
  }

  async function handleSignUp() {
    const uname = username.trim();
    if (!/^[A-Za-z0-9_]{3,20}$/.test(uname)) {
      setError('아이디는 영문 · 숫자 · 밑줄(_)로 3~20자 입력해 주세요.');
      return;
    }
    if (password.length < 4) {
      setError('비밀번호는 4자 이상 입력해 주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await game.signUp(uname, password);
      if (result === 'taken') {
        setError('이미 사용 중인 아이디입니다.');
        return;
      }
      if (result === 'full') {
        setError('가입 정원(12명)이 모두 찼습니다.');
        return;
      }
    } catch {
      setError('가입 처리에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogIn() {
    if (!username.trim() || !password) {
      setError('아이디와 비밀번호를 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await game.logIn(username.trim(), password);
      if (result === 'not-found') setError('존재하지 않는 아이디입니다.');
      else if (result === 'wrong-password') setError('비밀번호가 올바르지 않습니다.');
    } catch {
      setError('로그인에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="relative w-full max-w-xs text-left">
      <p className="font-mono text-[11px] tracking-wide text-seal-600">입학 지원서 · 계정 등록</p>
      <p className="mt-1 font-serif-kr text-sm text-ink-700/80">
        {mode === 'signup' ? 'HWCF 입학 지원을 위해 계정을 먼저 등록해 주세요.' : '등록해 둔 아이디와 비밀번호로 로그인하세요.'}
      </p>

      <div className="mt-4 flex gap-1 rounded-lg bg-paper-200 p-1">
        <button
          type="button"
          onClick={() => switchMode('signup')}
          className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-colors ${
            mode === 'signup' ? 'bg-paper-50 text-seal-600 shadow-sm' : 'text-ink-500/60'
          }`}
        >
          가입
        </button>
        <button
          type="button"
          onClick={() => switchMode('login')}
          className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-colors ${
            mode === 'login' ? 'bg-paper-50 text-seal-600 shadow-sm' : 'text-ink-500/60'
          }`}
        >
          로그인
        </button>
      </div>

      <label className="mt-4 block font-serif-kr text-sm text-ink-700/80">
        아이디
        <input
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError('');
          }}
          placeholder="영문 · 숫자 · 밑줄, 3~20자"
          className={inputClass}
        />
      </label>

      <label className="mt-3 block font-serif-kr text-sm text-ink-700/80">
        비밀번호
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && (mode === 'signup' ? handleSignUp() : handleLogIn())}
          className={inputClass}
        />
      </label>

      {mode === 'signup' && (
        <label className="mt-3 block font-serif-kr text-sm text-ink-700/80">
          비밀번호 확인
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => {
              setPasswordConfirm(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
            className={inputClass}
          />
        </label>
      )}

      {error && <p className="mt-2 text-xs text-seal-600">{error}</p>}

      <Button className="mt-4 w-full" onClick={mode === 'signup' ? handleSignUp : handleLogIn} disabled={submitting}>
        {submitting ? '처리 중…' : mode === 'signup' ? '지원서 제출하고 가입하기' : '로그인'}
      </Button>
    </Card>
  );
}

function TestStep() {
  const game = useGame();

  async function handleTestComplete(scores: Record<HouseId, number>) {
    await game.submitTest(scores, topHouse(scores));
  }

  return (
    <OwlIntro>
      <SortingTest onComplete={handleTestComplete} />
    </OwlIntro>
  );
}

function PatronusTestStep() {
  const game = useGame();

  async function handleTestComplete(scores: Record<PatronusId, number>) {
    await game.submitPatronusTest(scores);
  }

  return (
    <OwlIntro>
      <PatronusTest onComplete={handleTestComplete} />
    </OwlIntro>
  );
}

function ProfileStep() {
  const game = useGame();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nickname, setNickname] = useState('');
  const [grade, setGrade] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handlePickPhoto() {
    fileRef.current?.click();
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const size = 96;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      game.setAvatar(canvas.toDataURL('image/jpeg', 0.75));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
    e.target.value = '';
  }

  async function handleSubmit() {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError('이름을 입력해 주세요.');
      return;
    }
    if (trimmed.length > 12) {
      setError('이름은 12자 이내로 입력해 주세요.');
      return;
    }
    if (!grade) {
      setError('학년을 선택해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      await game.completeProfile(trimmed, grade);
      navigate('/hall');
    } catch {
      setError('제출에 실패했습니다. 다시 시도해 주세요.');
      setSubmitting(false);
    }
  }

  return (
    <Card className="relative w-full max-w-xs text-left">
      <p className="font-mono text-[11px] tracking-wide text-seal-600">입학 서류 · 신상 기록</p>
      <p className="mt-1 font-serif-kr text-sm text-ink-700/80">모든 적성 검사가 끝났습니다. 마지막으로 서류에 인적사항을 기입해 주세요.</p>

      <div className="mt-4 flex justify-center">
        <div className="relative h-16 w-16">
          <button
            type="button"
            onClick={handlePickPhoto}
            className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-ink-black text-xl font-bold text-paper-50"
            style={{ boxShadow: '0 0 0 3px var(--color-paper-50), 0 0 0 4px var(--color-ink-700)' }}
            aria-label="프로필 사진 선택"
          >
            {game.avatarDataUrl ? <img src={game.avatarDataUrl} alt="" className="h-full w-full object-cover" /> : '사진'}
          </button>
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-paper-50 px-1.5 py-0.5 text-[9px] font-bold text-ink-700 shadow">
            선택
          </span>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

      <label className="mt-5 block font-serif-kr text-sm text-ink-700/80">
        이름
        <input
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value);
            setError('');
          }}
          placeholder="이름을 입력하세요"
          maxLength={12}
          className={inputClass}
        />
      </label>

      <div className="mt-3">
        <p className="font-serif-kr text-sm text-ink-700/80">학년</p>
        <div className="mt-1.5 flex gap-2">
          {GRADES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => {
                setGrade(g);
                setError('');
              }}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
                grade === g ? 'border-seal-600 bg-seal-600 text-paper-50' : 'border-ink-700/20 bg-paper-100/60 text-ink-700'
              }`}
            >
              {g}학년
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-seal-600">{error}</p>}

      <Button className="mt-4 w-full" onClick={handleSubmit} disabled={submitting}>
        {submitting ? '제출 중…' : '서류 제출하고 입학 완료하기'}
      </Button>
    </Card>
  );
}

export default function LoadingPage() {
  const game = useGame();
  const navigate = useNavigate();

  const [adminGateOpen, setAdminGateOpen] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  function closeAdminGate() {
    setAdminGateOpen(false);
    setAdminPasscode('');
    setAdminError('');
  }

  async function handleAdminEnter() {
    if (adminPasscode !== ADMIN_PASSCODE) {
      setAdminError('암호가 올바르지 않습니다.');
      return;
    }
    setAdminSubmitting(true);
    try {
      if (!game.hasEntered) {
        await game.adminEnter();
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
            암호만 입력하면 가입 절차 없이 바로 입장합니다. 화면은 플레이어와 동일하되, 진행을 조작할 수 있는 권한이 함께 켜집니다.
          </p>
          <label className="mt-4 block font-serif-kr text-sm text-ink-700/80">
            관리자 암호
            <input
              type="password"
              value={adminPasscode}
              onChange={(e) => {
                setAdminPasscode(e.target.value);
                setAdminError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminEnter()}
              className={inputClass}
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
            다른 계정으로 시작하기
          </button>
        </Card>
      ) : game.stage === 'account' ? (
        <AccountStep />
      ) : game.stage === 'test' ? (
        <TestStep />
      ) : game.stage === 'patronusTest' ? (
        <PatronusTestStep />
      ) : (
        <ProfileStep />
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
