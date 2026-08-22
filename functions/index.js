const { setGlobalOptions } = require('firebase-functions/v2');
const { onDocumentWritten, onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onCall } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const webpush = require('web-push');

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

const VAPID_PUBLIC_KEY = defineSecret('VAPID_PUBLIC_KEY');
const VAPID_PRIVATE_KEY = defineSecret('VAPID_PRIVATE_KEY');
const secrets = [VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY];

function configureWebPush() {
  webpush.setVapidDetails('mailto:detecthogwarts@example.com', VAPID_PUBLIC_KEY.value(), VAPID_PRIVATE_KEY.value());
}

const DEFAULT_PREFS = { master: true, event: true, chat: true, mention: true };

async function getPrefs(playerId) {
  const snap = await db.collection('notificationPrefs').doc(playerId).get();
  return snap.exists ? { ...DEFAULT_PREFS, ...snap.data() } : DEFAULT_PREFS;
}

async function getAllPlayerIds() {
  const snap = await db.collection('players').get();
  return snap.docs.map((d) => d.id);
}

/** Mirrors src/firebase/notifications.ts's createNotificationIfAbsent so the in-app
 * notification center stays populated even for players who were offline when this fired. */
async function createNotificationIfAbsent(playerId, type, title, body, targetUrl, targetId) {
  const id = `${playerId}__${type}__${targetId}`;
  const ref = db.collection('notifications').doc(id);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) return;
    tx.set(ref, {
      playerId,
      type,
      title,
      body,
      targetUrl,
      targetId,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}

async function sendPushToPlayer(playerId, payload) {
  const subsSnap = await db.collection('pushSubscriptions').where('playerId', '==', playerId).where('active', '==', true).get();
  await Promise.all(
    subsSnap.docs.map(async (doc) => {
      const sub = doc.data();
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload));
        await doc.ref.update({ lastUsedAt: admin.firestore.FieldValue.serverTimestamp() });
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await doc.ref.update({ active: false });
        } else {
          console.error('push send failed', doc.id, err.statusCode, err.body);
        }
      }
    }),
  );
}

async function notifyAndPush(playerId, type, title, body, targetUrl, targetId) {
  await createNotificationIfAbsent(playerId, type, title, body, targetUrl, targetId);
  await sendPushToPlayer(playerId, { title, body, url: targetUrl, tag: `${type}-${targetId}` });
}

exports.onAnnouncementSent = onDocumentWritten({ document: 'announcements/latest', secrets }, async (event) => {
  const after = event.data && event.data.after ? event.data.after.data() : null;
  if (!after) return;
  configureWebPush();
  const playerIds = await getAllPlayerIds();
  await Promise.all(
    playerIds.map(async (playerId) => {
      const prefs = await getPrefs(playerId);
      if (!prefs.master || !prefs.event) return;
      await notifyAndPush(playerId, 'POPUP', '새로운 안내', after.text, '/hall', after.id);
    }),
  );
});

exports.onPostCreated = onDocumentCreated({ document: 'posts/{postId}', secrets }, async (event) => {
  const post = event.data.data();
  const postId = event.params.postId;
  configureWebPush();
  const playerIds = (await getAllPlayerIds()).filter((id) => id !== post.authorPlayerId);
  const body = `${post.authorNickname}: ${post.title || post.content.slice(0, 40)}`;
  await Promise.all(
    playerIds.map(async (playerId) => {
      const prefs = await getPrefs(playerId);
      if (!prefs.master || !prefs.event) return;
      await notifyAndPush(playerId, 'FEED', '새 피드 알림', body, '/hall', postId);
    }),
  );
});

exports.onDormMessageCreated = onDocumentCreated({ document: 'dormChats/{houseId}/messages/{messageId}', secrets }, async (event) => {
  const msg = event.data.data();
  const { houseId, messageId } = event.params;
  configureWebPush();
  const membersSnap = await db.collection('players').where('assignedHouse', '==', houseId).get();
  const members = membersSnap.docs.filter((d) => d.id !== msg.authorPlayerId);
  await Promise.all(
    members.map(async (doc) => {
      const playerId = doc.id;
      const prefs = await getPrefs(playerId);
      if (!prefs.master) return;
      const nickname = doc.data().nickname;
      const mentioned = nickname && msg.text.includes(`@${nickname}`);
      if (mentioned) {
        if (!prefs.mention) return;
        await notifyAndPush(playerId, 'MENTION', '태그 알림', `${msg.authorNickname}님이 회원님을 태그했습니다.`, '/recess?room=dorm', messageId);
      } else {
        if (!prefs.chat) return;
        const body = `기숙사 공용 대화방 · ${msg.authorNickname}: ${msg.text.slice(0, 40)}`;
        await notifyAndPush(playerId, 'CHAT', '새로운 메시지가 도착했습니다', body, '/recess?room=dorm', messageId);
      }
    }),
  );
});

exports.sendTestPush = onCall({ secrets }, async (request) => {
  const playerId = request.data && request.data.playerId;
  if (!playerId || typeof playerId !== 'string') {
    throw new Error('playerId is required');
  }
  configureWebPush();
  await sendPushToPlayer(playerId, {
    title: '알림 테스트',
    body: '이 알림이 보이면 푸시 설정이 정상적으로 완료된 거예요.',
    url: '/profile',
    tag: 'test-push',
  });
  return { ok: true };
});
