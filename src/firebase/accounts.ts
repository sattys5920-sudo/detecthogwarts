import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

const COLLECTION_NAME = 'accounts';
const DEMO_STORAGE_KEY = 'arcanum-accounts-demo';

interface AccountRecord {
  username: string;
  passwordHash: string;
  playerId: string;
  createdAt: number;
}

function normalize(username: string): string {
  return username.trim().toLowerCase();
}

async function hashPassword(username: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`${normalize(username)}::${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function readDemoAccounts(): Record<string, AccountRecord> {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, AccountRecord>) : {};
  } catch {
    return {};
  }
}

function writeDemoAccounts(accounts: Record<string, AccountRecord>) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // localStorage unavailable (private mode, etc.) — silently skip persistence.
  }
}

export type SignUpResult = { ok: true; playerId: string } | { ok: false; reason: 'taken' };

export async function createAccount(username: string, password: string, playerId: string): Promise<SignUpResult> {
  const key = normalize(username);
  const passwordHash = await hashPassword(username, password);

  if (isFirebaseConfigured && db) {
    const ref = doc(db, COLLECTION_NAME, key);
    const existing = await getDoc(ref);
    if (existing.exists()) return { ok: false, reason: 'taken' };
    try {
      await setDoc(ref, { username: username.trim(), passwordHash, playerId, createdAt: serverTimestamp() });
    } catch {
      // Firestore rules reject overwriting an existing account doc (a race with
      // another signup for the same username lands here as a permission error).
      return { ok: false, reason: 'taken' };
    }
    return { ok: true, playerId };
  }

  const accounts = readDemoAccounts();
  if (accounts[key]) return { ok: false, reason: 'taken' };
  accounts[key] = { username: username.trim(), passwordHash, playerId, createdAt: Date.now() };
  writeDemoAccounts(accounts);
  return { ok: true, playerId };
}

export type LogInResult = { ok: true; playerId: string } | { ok: false; reason: 'not-found' | 'wrong-password' };

export async function verifyAccount(username: string, password: string): Promise<LogInResult> {
  const key = normalize(username);
  const passwordHash = await hashPassword(username, password);

  if (isFirebaseConfigured && db) {
    const snap = await getDoc(doc(db, COLLECTION_NAME, key));
    if (!snap.exists()) return { ok: false, reason: 'not-found' };
    const data = snap.data() as AccountRecord;
    if (data.passwordHash !== passwordHash) return { ok: false, reason: 'wrong-password' };
    return { ok: true, playerId: data.playerId };
  }

  const accounts = readDemoAccounts();
  const account = accounts[key];
  if (!account) return { ok: false, reason: 'not-found' };
  if (account.passwordHash !== passwordHash) return { ok: false, reason: 'wrong-password' };
  return { ok: true, playerId: account.playerId };
}
