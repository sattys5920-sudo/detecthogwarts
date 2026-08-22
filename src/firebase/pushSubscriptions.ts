import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db, isFirebaseConfigured } from './config';
import { deviceLabel } from '../lib/webPush';

async function endpointId(endpoint: string): Promise<string> {
  const bytes = new TextEncoder().encode(endpoint);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

export async function savePushSubscription(playerId: string, subscription: PushSubscription): Promise<void> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase가 설정되지 않아 푸시 구독을 저장할 수 없습니다.');
  const json = subscription.toJSON();
  if (!json.keys?.p256dh || !json.keys?.auth) throw new Error('구독 키 생성에 실패했습니다.');
  const id = await endpointId(subscription.endpoint);
  await setDoc(
    doc(db, 'pushSubscriptions', id),
    {
      playerId,
      endpoint: subscription.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      device: deviceLabel(),
      createdAt: serverTimestamp(),
      lastUsedAt: serverTimestamp(),
      active: true,
    },
    { merge: true },
  );
}

export async function deactivatePushSubscription(subscription: PushSubscription): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  const id = await endpointId(subscription.endpoint);
  await updateDoc(doc(db, 'pushSubscriptions', id), { active: false });
}

export async function sendTestPush(playerId: string): Promise<void> {
  if (!isFirebaseConfigured || !app) throw new Error('Firebase가 설정되지 않아 테스트 알림을 보낼 수 없습니다.');
  const fn = httpsCallable(getFunctions(app), 'sendTestPush');
  await fn({ playerId });
}
