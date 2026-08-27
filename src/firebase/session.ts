import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { ClueDef } from '../data/investigation/types';
import { db, isFirebaseConfigured } from './config';

export interface AdlibMessage {
  id: string;
  kind: 'narration' | 'evidence' | 'chat' | 'options';
  speaker: string;
  text: string;
  clue?: ClueDef;
  options?: string[];
  /** For kind 'options': each player's chosen option index, keyed by playerId. Everyone sees live counts instead of picking to post a chat reply. */
  votes?: Record<string, number>;
  /** For kind 'options': once the admin closes voting, players can no longer change/cast a pick. */
  closed?: boolean;
  authorAvatar?: string | null;
  at: number;
}

const DEMO_ADLIB_PREFIX = 'arcanum-session-adlib-demo-';
const DEMO_ADLIB_EVENT = 'arcanum-session-adlib-demo-changed';

function adlibDemoKey(day: number) {
  return `${DEMO_ADLIB_PREFIX}${day}`;
}

function readAdlibDemo(day: number): AdlibMessage[] {
  try {
    const raw = localStorage.getItem(adlibDemoKey(day));
    return raw ? (JSON.parse(raw) as AdlibMessage[]) : [];
  } catch {
    return [];
  }
}

function writeAdlibDemo(day: number, messages: AdlibMessage[]) {
  try {
    localStorage.setItem(adlibDemoKey(day), JSON.stringify(messages));
    window.dispatchEvent(new Event(DEMO_ADLIB_EVENT));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

function adlibCollectionRef(day: number) {
  return collection(db!, 'sessions', `day${day}`, 'adlibs');
}

export function listenAdlibs(day: number, callback: (messages: AdlibMessage[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(adlibCollectionRef(day), orderBy('at', 'asc'));
    return onSnapshot(q, (snap) => {
      callback(
        snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            kind: data.kind === 'evidence' || data.kind === 'chat' || data.kind === 'options' ? data.kind : 'narration',
            speaker: data.speaker,
            text: data.text,
            clue: data.clue,
            options: data.options,
            votes: data.votes ?? {},
            closed: data.closed ?? false,
            authorAvatar: data.authorAvatar ?? null,
            at: data.at?.toMillis?.() ?? 0,
          } satisfies AdlibMessage;
        }),
      );
    });
  }
  const read = () => callback(readAdlibDemo(day));
  read();
  window.addEventListener(DEMO_ADLIB_EVENT, read);
  return () => window.removeEventListener(DEMO_ADLIB_EVENT, read);
}

export async function sendAdlib(day: number, speaker: string, text: string): Promise<void> {
  const payload = { kind: 'narration' as const, speaker, text };
  if (isFirebaseConfigured && db) {
    await addDoc(adlibCollectionRef(day), { ...payload, at: serverTimestamp() });
    return;
  }
  const messages = readAdlibDemo(day);
  messages.push({ ...payload, id: crypto.randomUUID(), at: Date.now() });
  writeAdlibDemo(day, messages);
}

export async function sendOptionsMessage(day: number, speaker: string, prompt: string, options: string[]): Promise<void> {
  const payload = { kind: 'options' as const, speaker, text: prompt, options, votes: {}, closed: false };
  if (isFirebaseConfigured && db) {
    await addDoc(adlibCollectionRef(day), { ...payload, at: serverTimestamp() });
    return;
  }
  const messages = readAdlibDemo(day);
  messages.push({ ...payload, id: crypto.randomUUID(), at: Date.now() });
  writeAdlibDemo(day, messages);
}

/** Admin-only: closes voting on an options message so players can no longer cast/change a pick. */
export async function closeOptionsVoting(day: number, messageId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, 'sessions', `day${day}`, 'adlibs', messageId), { closed: true });
    return;
  }
  const messages = readAdlibDemo(day);
  const idx = messages.findIndex((m) => m.id === messageId);
  if (idx >= 0) {
    messages[idx] = { ...messages[idx], closed: true };
    writeAdlibDemo(day, messages);
  }
}

/** Records (or changes) one player's pick on an options message — everyone sees a live per-option tally instead of the pick posting a chat reply. */
export async function voteOptions(day: number, messageId: string, playerId: string, optionIndex: number): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, 'sessions', `day${day}`, 'adlibs', messageId), { [`votes.${playerId}`]: optionIndex });
    return;
  }
  const messages = readAdlibDemo(day);
  const idx = messages.findIndex((m) => m.id === messageId);
  if (idx >= 0) {
    messages[idx] = { ...messages[idx], votes: { ...messages[idx].votes, [playerId]: optionIndex } };
    writeAdlibDemo(day, messages);
  }
}

export async function sendChatMessage(day: number, nickname: string, text: string, authorAvatar: string | null): Promise<void> {
  const payload = { kind: 'chat' as const, speaker: nickname, text, authorAvatar };
  if (isFirebaseConfigured && db) {
    await addDoc(adlibCollectionRef(day), { ...payload, at: serverTimestamp() });
    return;
  }
  const messages = readAdlibDemo(day);
  messages.push({ ...payload, id: crypto.randomUUID(), at: Date.now() });
  writeAdlibDemo(day, messages);
}

/** Admin-only: removes one message — every listener (every player's chat window) drops it live via the onSnapshot in listenAdlibs. */
export async function deleteAdlib(day: number, messageId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, 'sessions', `day${day}`, 'adlibs', messageId));
    return;
  }
  const messages = readAdlibDemo(day).filter((m) => m.id !== messageId);
  writeAdlibDemo(day, messages);
}

export async function presentEvidence(day: number, presenterNickname: string, clue: { title: string; ink: ClueDef['ink'] }): Promise<void> {
  const payload = {
    kind: 'evidence' as const,
    speaker: presenterNickname,
    text: `『${clue.title}』을(를) 제시했다.`,
  };
  if (isFirebaseConfigured && db) {
    await addDoc(adlibCollectionRef(day), { ...payload, at: serverTimestamp() });
    return;
  }
  const messages = readAdlibDemo(day);
  messages.push({ ...payload, id: crypto.randomUUID(), at: Date.now() });
  writeAdlibDemo(day, messages);
}
