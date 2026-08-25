import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { deactivatePushSubscription, savePushSubscription, sendTestPush } from '../firebase/pushSubscriptions';
import { getPushPermissionState, isIOS, isPushSupported, isStandaloneDisplay, registerServiceWorker, subscribeToPush, unsubscribeFromPush, type PushPermissionState } from '../lib/webPush';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

const STATE_LABEL: Record<PushPermissionState, string> = {
  unsupported: '🔕 이 브라우저는 푸시 알림을 지원하지 않습니다.',
  'not-requested': '🔔 아직 알림을 켜지 않았습니다.',
  granted: '🔔 알림 허용됨',
  denied: '🔕 알림이 차단되어 있습니다.',
};

export default function PushSetup() {
  const game = useGame();
  const [state, setState] = useState<PushPermissionState>('unsupported');
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    setState(getPushPermissionState());
    if (isPushSupported() && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration('/sw.js').then(async (reg) => {
        const sub = await reg?.pushManager.getSubscription();
        setSubscribed(Boolean(sub));
      });
    }
  }, []);

  async function handleEnable() {
    if (!VAPID_PUBLIC_KEY) {
      setError('푸시 서버 설정(VAPID 키)이 아직 준비되지 않았어요.');
      return;
    }
    if (!game.playerId) return;
    setBusy(true);
    setError(null);
    try {
      await registerServiceWorker();
      const permission = await Notification.requestPermission();
      setState(getPushPermissionState());
      if (permission !== 'granted') return;
      const subscription = await subscribeToPush(VAPID_PUBLIC_KEY);
      await savePushSubscription(game.playerId, subscription);
      setSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알림 설정 중 문제가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    if (!game.playerId || !VAPID_PUBLIC_KEY) return;
    setBusy(true);
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration('/sw.js');
        const sub = await reg?.pushManager.getSubscription();
        if (sub) await deactivatePushSubscription(sub);
      }
      await unsubscribeFromPush();
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleTest() {
    if (!game.playerId) return;
    setBusy(true);
    setTestSent(false);
    try {
      await sendTestPush(game.playerId);
      setTestSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '테스트 알림 발송에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  const showIOSHint = isIOS() && !isStandaloneDisplay() && state !== 'unsupported';

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-bold text-ink-700/70">{STATE_LABEL[state]}</p>

      {showIOSHint && (
        <p className="text-[11px] leading-relaxed text-ink-500/70">
          iPhone에서는 Safari 공유 버튼 → <b>홈 화면에 추가</b>로 설치한 뒤, 설치된 앱에서 알림을 켜야 앱을 꺼도 알림이 옵니다.
        </p>
      )}

      {state === 'denied' && <p className="text-[11px] text-ink-500/70">휴대폰 설정에서 이 앱의 알림을 허용해 주세요.</p>}

      {state !== 'unsupported' && state !== 'denied' && (
        <button
          type="button"
          onClick={subscribed ? handleDisable : handleEnable}
          disabled={busy}
          className="tablet-btn tablet-btn-dark self-start px-4 py-1.5 text-xs font-bold disabled:opacity-40"
        >
          {busy ? '처리 중…' : subscribed ? '알림 끄기' : '알림 받기'}
        </button>
      )}

      {subscribed && (
        <button
          type="button"
          onClick={handleTest}
          disabled={busy}
          className="tablet-btn self-start px-4 py-1.5 text-xs font-bold disabled:opacity-40"
        >
          테스트 알림 보내기
        </button>
      )}

      {testSent && <p className="text-[11px] text-seal-600">테스트 알림을 보냈어요. 잠시 후 도착합니다.</p>}
      {error && <p className="text-[11px] text-seal-600">{error}</p>}
    </div>
  );
}
