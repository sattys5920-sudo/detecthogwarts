import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

export interface Post {
  id: string;
  authorPlayerId: string;
  authorNickname: string;
  authorAvatar: string | null;
  title: string;
  content: string;
  allowComments: boolean;
  pinned: boolean;
  createdAt: number;
  editedAt: number | null;
}

export interface Comment {
  id: string;
  authorPlayerId: string;
  authorNickname: string;
  authorAvatar: string | null;
  content: string;
  secret: boolean;
  createdAt: number;
  editedAt: number | null;
}

const POSTS = 'posts';
const DEMO_KEY = 'arcanum-posts-demo';
const DEMO_EVENT = 'arcanum-posts-demo-changed';

interface DemoStore {
  posts: Post[];
  comments: Record<string, Comment[]>;
}

function readDemo(): DemoStore {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    return raw ? (JSON.parse(raw) as DemoStore) : { posts: [], comments: {} };
  } catch {
    return { posts: [], comments: {} };
  }
}

function writeDemo(store: DemoStore) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(store));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

type NewPost = Omit<Post, 'id' | 'createdAt' | 'editedAt'>;
type NewComment = Omit<Comment, 'id' | 'createdAt' | 'editedAt'>;

export async function createPost(input: NewPost): Promise<string> {
  if (isFirebaseConfigured && db) {
    const ref = await addDoc(collection(db, POSTS), { ...input, createdAt: serverTimestamp(), editedAt: null });
    return ref.id;
  }
  const store = readDemo();
  const id = crypto.randomUUID();
  store.posts.unshift({ ...input, id, createdAt: Date.now(), editedAt: null });
  writeDemo(store);
  return id;
}

export async function updatePost(id: string, title: string, content: string, allowComments: boolean): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, POSTS, id), { title, content, allowComments, editedAt: serverTimestamp() });
    return;
  }
  const store = readDemo();
  const idx = store.posts.findIndex((p) => p.id === id);
  if (idx >= 0) {
    store.posts[idx] = { ...store.posts[idx], title, content, allowComments, editedAt: Date.now() };
    writeDemo(store);
  }
}

export async function setPostPinned(id: string, pinned: boolean): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, POSTS, id), { pinned });
    return;
  }
  const store = readDemo();
  const idx = store.posts.findIndex((p) => p.id === id);
  if (idx >= 0) {
    store.posts[idx] = { ...store.posts[idx], pinned };
    writeDemo(store);
  }
}

export async function deletePost(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, POSTS, id));
    return;
  }
  const store = readDemo();
  store.posts = store.posts.filter((p) => p.id !== id);
  delete store.comments[id];
  writeDemo(store);
}

/** Pinned posts first (most-recently-pinned-or-created within that group), then everyone else by recency. */
function sortPosts(posts: Post[]): Post[] {
  return posts.slice().sort((a, b) => (a.pinned === b.pinned ? b.createdAt - a.createdAt : a.pinned ? -1 : 1));
}

export function listenPosts(callback: (posts: Post[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, POSTS), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      callback(
        sortPosts(
          snap.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              authorPlayerId: data.authorPlayerId,
              authorNickname: data.authorNickname,
              authorAvatar: data.authorAvatar ?? null,
              title: data.title ?? '',
              content: data.content,
              allowComments: data.allowComments,
              pinned: data.pinned ?? false,
              createdAt: data.createdAt?.toMillis?.() ?? 0,
              editedAt: data.editedAt?.toMillis?.() ?? null,
            } satisfies Post;
          }),
        ),
      );
    });
  }
  const read = () => callback(sortPosts(readDemo().posts));
  read();
  window.addEventListener(DEMO_EVENT, read);
  window.addEventListener('storage', read);
  return () => {
    window.removeEventListener(DEMO_EVENT, read);
    window.removeEventListener('storage', read);
  };
}

export async function createComment(postId: string, input: NewComment): Promise<string> {
  if (isFirebaseConfigured && db) {
    const ref = await addDoc(collection(db, POSTS, postId, 'comments'), {
      ...input,
      createdAt: serverTimestamp(),
      editedAt: null,
    });
    return ref.id;
  }
  const store = readDemo();
  const id = crypto.randomUUID();
  const list = store.comments[postId] ?? [];
  list.push({ ...input, id, createdAt: Date.now(), editedAt: null });
  store.comments[postId] = list;
  writeDemo(store);
  return id;
}

export async function updateComment(postId: string, id: string, content: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, POSTS, postId, 'comments', id), { content, editedAt: serverTimestamp() });
    return;
  }
  const store = readDemo();
  const list = store.comments[postId] ?? [];
  const idx = list.findIndex((c) => c.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], content, editedAt: Date.now() };
    store.comments[postId] = list;
    writeDemo(store);
  }
}

export async function deleteComment(postId: string, id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, POSTS, postId, 'comments', id));
    return;
  }
  const store = readDemo();
  store.comments[postId] = (store.comments[postId] ?? []).filter((c) => c.id !== id);
  writeDemo(store);
}

export function listenComments(postId: string, callback: (comments: Comment[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, POSTS, postId, 'comments'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      callback(
        snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            authorPlayerId: data.authorPlayerId,
            authorNickname: data.authorNickname,
            authorAvatar: data.authorAvatar ?? null,
            content: data.content,
            secret: data.secret,
            createdAt: data.createdAt?.toMillis?.() ?? 0,
            editedAt: data.editedAt?.toMillis?.() ?? null,
          } satisfies Comment;
        }),
      );
    });
  }
  const read = () => callback((readDemo().comments[postId] ?? []).slice().sort((a, b) => a.createdAt - b.createdAt));
  read();
  window.addEventListener(DEMO_EVENT, read);
  return () => window.removeEventListener(DEMO_EVENT, read);
}
