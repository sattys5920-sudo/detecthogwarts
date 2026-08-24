import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

export type AnswerGrade = 'correct' | 'incorrect' | null;

export interface FinalSurveyAnswer {
  id: string;
  playerId: string;
  nickname: string;
  questionId: string;
  text: string;
  grade: AnswerGrade;
  createdAt: number;
}

const COLLECTION = 'finalSurveyAnswers';
const DEMO_STORAGE_KEY = 'arcanum-final-survey-answers-demo';
const DEMO_EVENT = 'arcanum-final-survey-answers-demo-changed';

function answerId(playerId: string, questionId: string) {
  return `${playerId}__${questionId}`;
}

function readDemo(): FinalSurveyAnswer[] {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FinalSurveyAnswer[]) : [];
  } catch {
    return [];
  }
}

function writeDemo(answers: FinalSurveyAnswer[]) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(answers));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable (private mode, etc.) — silently skip persistence.
  }
}

/**
 * Creates a new answer, or edits the text of an existing one — without ever touching `grade`
 * on an edit, so re-submitting after the admin has already graded an answer can't silently
 * reset that grade (the security rules only allow `text`-only or `grade`-only updates).
 */
export async function submitAnswer(playerId: string, nickname: string, questionId: string, text: string, isEdit: boolean): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  const id = answerId(playerId, questionId);
  if (isFirebaseConfigured && db) {
    if (isEdit) {
      await updateDoc(doc(db, COLLECTION, id), { text: trimmed });
    } else {
      await setDoc(doc(db, COLLECTION, id), { playerId, nickname, questionId, text: trimmed, grade: null, createdAt: serverTimestamp() });
    }
    return;
  }
  const answers = readDemo();
  const idx = answers.findIndex((a) => a.id === id);
  if (isEdit && idx >= 0) {
    answers[idx] = { ...answers[idx], text: trimmed };
  } else {
    const next: FinalSurveyAnswer = { id, playerId, nickname, questionId, text: trimmed, grade: null, createdAt: Date.now() };
    if (idx >= 0) answers[idx] = next;
    else answers.push(next);
  }
  writeDemo(answers);
}

export async function gradeAnswer(id: string, grade: AnswerGrade): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COLLECTION, id), { grade });
    return;
  }
  const answers = readDemo();
  const idx = answers.findIndex((a) => a.id === id);
  if (idx >= 0) {
    answers[idx] = { ...answers[idx], grade };
    writeDemo(answers);
  }
}

export function listenAnswersForPlayer(playerId: string, callback: (answers: FinalSurveyAnswer[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, COLLECTION), where('playerId', '==', playerId));
    return onSnapshot(q, (snap) => {
      callback(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            playerId: data.playerId,
            nickname: data.nickname,
            questionId: data.questionId,
            text: data.text,
            grade: data.grade ?? null,
            createdAt: data.createdAt?.toMillis?.() ?? 0,
          } satisfies FinalSurveyAnswer;
        }),
      );
    });
  }
  const read = () => callback(readDemo().filter((a) => a.playerId === playerId));
  read();
  window.addEventListener(DEMO_EVENT, read);
  window.addEventListener('storage', read);
  return () => {
    window.removeEventListener(DEMO_EVENT, read);
    window.removeEventListener('storage', read);
  };
}

export function listenAllAnswers(callback: (answers: FinalSurveyAnswer[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(collection(db, COLLECTION), (snap) => {
      callback(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            playerId: data.playerId,
            nickname: data.nickname,
            questionId: data.questionId,
            text: data.text,
            grade: data.grade ?? null,
            createdAt: data.createdAt?.toMillis?.() ?? 0,
          } satisfies FinalSurveyAnswer;
        }),
      );
    });
  }
  const read = () => callback(readDemo());
  read();
  window.addEventListener(DEMO_EVENT, read);
  window.addEventListener('storage', read);
  return () => {
    window.removeEventListener(DEMO_EVENT, read);
    window.removeEventListener('storage', read);
  };
}
