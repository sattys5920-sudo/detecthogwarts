import { useEffect, useRef, useState } from 'react';
import Letterhead from '../components/Letterhead';
import NibIcon from '../components/NibIcon';
import { useGame } from '../context/GameContext';
import { SCHOOL_NAME } from '../data/school';
import {
  type Comment,
  createComment,
  createPost,
  deleteComment,
  deletePost,
  listenComments,
  listenPosts,
  type Post,
  updateComment,
  updatePost,
} from '../firebase/posts';

function formatTime(ms: number) {
  if (!ms) return '방금 전';
  return new Date(ms).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Avatar({ src, name, size = 8 }: { src: string | null; name: string; size?: number }) {
  const px = size * 4;
  return src ? (
    <img src={src} alt="" className="flex-none rounded-full object-cover" style={{ width: px, height: px }} />
  ) : (
    <span
      className="flex flex-none items-center justify-center rounded-full bg-ink-black text-[11px] font-bold text-paper-50"
      style={{ width: px, height: px }}
    >
      {name ? name[0] : '?'}
    </span>
  );
}

function Composer({ onSubmit, placeholder, submitLabel }: { onSubmit: (text: string) => void; placeholder: string; submitLabel: string }) {
  const [text, setText] = useState('');
  return (
    <div className="flex items-center gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && text.trim()) {
            onSubmit(text.trim());
            setText('');
          }
        }}
        placeholder={placeholder}
        className="flex-1 rounded-full border border-ink-700/20 bg-paper-50 px-3.5 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-500/40 focus:border-seal-500"
      />
      <button
        type="button"
        onClick={() => {
          if (!text.trim()) return;
          onSubmit(text.trim());
          setText('');
        }}
        disabled={!text.trim()}
        className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-ink-black text-paper-50 disabled:opacity-40"
        aria-label={submitLabel}
      >
        <NibIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function CommentRow({ comment, postAuthorId, onEdit, onDelete }: {
  comment: Comment;
  postAuthorId: string;
  onEdit: (text: string) => void;
  onDelete: () => void;
}) {
  const game = useGame();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const isMine = comment.authorPlayerId === game.playerId;
  const canSeeSecret = !comment.secret || isMine || game.playerId === postAuthorId;

  return (
    <div className="flex items-start gap-2">
      <Avatar src={comment.authorAvatar} name={comment.authorNickname} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-ink-900">{comment.authorNickname}</span>
          {comment.secret && <span className="text-[10px] text-ink-500/60">비밀</span>}
          <span className="font-mono text-[10px] text-ink-500/50">{formatTime(comment.createdAt)}</span>
          {comment.editedAt && <span className="text-[10px] text-ink-500/40">(수정됨)</span>}
        </div>
        {editing ? (
          <div className="mt-1 flex items-center gap-1.5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && draft.trim() && (onEdit(draft.trim()), setEditing(false))}
              className="flex-1 rounded-md border border-ink-700/20 bg-paper-50 px-2 py-1 text-sm text-ink-900 outline-none focus:border-seal-500"
              autoFocus
            />
            <button type="button" onClick={() => { if (draft.trim()) { onEdit(draft.trim()); setEditing(false); } }} className="text-xs font-bold text-seal-600">저장</button>
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-ink-500/60">취소</button>
          </div>
        ) : (
          <p className="mt-0.5 text-sm text-ink-900">
            {canSeeSecret ? comment.content : <span className="text-ink-500/50">비밀 댓글입니다.</span>}
          </p>
        )}
        {isMine && !editing && (
          <div className="mt-1 flex gap-2 text-[11px] text-ink-500/50">
            <button type="button" onClick={() => setEditing(true)} className="hover:text-ink-700 hover:underline">수정</button>
            <button type="button" onClick={onDelete} className="hover:text-seal-600 hover:underline">삭제</button>
          </div>
        )}
      </div>
    </div>
  );
}

function PostDetail({ post, onBack, onEdit, onDelete }: { post: Post; onBack: () => void; onEdit: (title: string, content: string) => void; onDelete: () => void }) {
  const game = useGame();
  const [comments, setComments] = useState<Comment[]>([]);
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(post.title);
  const [draft, setDraft] = useState(post.content);
  const [secretDraft, setSecretDraft] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const isMine = post.authorPlayerId === game.playerId;

  useEffect(() => listenComments(post.id, setComments), [post.id]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [comments.length]);

  function handleSubmitComment(text: string) {
    createComment(post.id, {
      authorPlayerId: game.playerId ?? '',
      authorNickname: game.nickname,
      authorAvatar: game.avatarDataUrl,
      content: text,
      secret: secretDraft,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start text-xs text-ink-500/60 underline-offset-2 hover:text-ink-700 hover:underline">
        ← 목록으로
      </button>

      <div className="rounded-sm border border-ink-700/15 bg-paper-50 p-3.5">
        <div className="flex items-center gap-2">
          <Avatar src={post.authorAvatar} name={post.authorNickname} size={9} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink-900">{post.authorNickname}</p>
            <p className="font-mono text-[10px] text-ink-500/60">
              {formatTime(post.createdAt)} {post.editedAt && '(수정됨)'}
            </p>
          </div>
        </div>
        {editing ? (
          <div className="mt-2.5 flex flex-col gap-2">
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              maxLength={60}
              placeholder="제목"
              className="w-full rounded-lg border border-ink-700/20 bg-paper-100/60 px-2.5 py-2 text-sm font-bold text-ink-900 outline-none focus:border-seal-500"
            />
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-ink-700/20 bg-paper-100/60 px-2.5 py-2 text-sm text-ink-900 outline-none focus:border-seal-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (draft.trim()) {
                    onEdit(titleDraft.trim(), draft.trim());
                    setEditing(false);
                  }
                }}
                className="text-xs font-bold text-seal-600"
              >
                저장
              </button>
              <button type="button" onClick={() => setEditing(false)} className="text-xs text-ink-500/60">취소</button>
            </div>
          </div>
        ) : (
          <>
            {post.title && <p className="mt-2.5 text-base font-bold text-ink-900">{post.title}</p>}
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-900">{post.content}</p>
          </>
        )}
        {isMine && !editing && (
          <div className="mt-2 flex gap-2 text-[11px] text-ink-500/50">
            <button type="button" onClick={() => setEditing(true)} className="hover:text-ink-700 hover:underline">수정</button>
            <button type="button" onClick={onDelete} className="hover:text-seal-600 hover:underline">삭제</button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold text-ink-700/70">댓글 {comments.length}개</p>
        <div ref={listRef} className="flex max-h-80 flex-col gap-3 overflow-y-auto">
          {comments.length === 0 && <p className="py-4 text-center text-xs text-ink-500/50">아직 댓글이 없어요.</p>}
          {comments.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              postAuthorId={post.authorPlayerId}
              onEdit={(text) => updateComment(post.id, c.id, text)}
              onDelete={() => deleteComment(post.id, c.id)}
            />
          ))}
        </div>

        {post.allowComments ? (
          <div className="flex flex-col gap-1.5">
            <Composer onSubmit={handleSubmitComment} placeholder="댓글을 입력하세요" submitLabel="댓글 등록" />
            <label className="flex items-center gap-1.5 pl-1 text-xs text-ink-700/70">
              <input type="checkbox" checked={secretDraft} onChange={(e) => setSecretDraft(e.target.checked)} />
              비밀댓글로 작성
            </label>
          </div>
        ) : (
          <p className="text-center text-xs text-ink-500/50">댓글이 허용되지 않은 게시글입니다.</p>
        )}
      </div>
    </div>
  );
}

export default function HallPage() {
  const game = useGame();
  const [posts, setPosts] = useState<Post[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [draft, setDraft] = useState('');
  const [allowComments, setAllowComments] = useState(true);

  useEffect(() => listenPosts(setPosts), []);

  const openPost = posts.find((p) => p.id === openId);

  function handleCreatePost() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    createPost({
      authorPlayerId: game.playerId ?? '',
      authorNickname: game.nickname,
      authorAvatar: game.avatarDataUrl,
      title: titleDraft.trim(),
      content: trimmed,
      allowComments,
    });
    setTitleDraft('');
    setDraft('');
    setAllowComments(true);
    setComposerOpen(false);
  }

  if (openPost) {
    return (
      <div className="flex flex-col gap-4">
        <Letterhead label="연회장" context={SCHOOL_NAME} meta="2026.08.18 · 초승달 · 저녁 식사 시간" />
        <PostDetail
          post={openPost}
          onBack={() => setOpenId(null)}
          onEdit={(title, content) => updatePost(openPost.id, title, content, openPost.allowComments)}
          onDelete={() => {
            deletePost(openPost.id);
            setOpenId(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-4">
      <Letterhead label="연회장" context={SCHOOL_NAME} meta="2026.08.18 · 초승달 · 저녁 식사 시간" />

      {composerOpen && game.isAdmin && (
        <div className="flex flex-col gap-2.5 rounded-sm border border-ink-700/15 bg-paper-50 p-3.5">
          <input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            maxLength={60}
            autoFocus
            placeholder="제목"
            className="w-full rounded-lg border border-ink-700/20 bg-paper-100/60 px-2.5 py-2 text-sm font-bold text-ink-900 outline-none placeholder:text-ink-500/40 focus:border-seal-500"
          />
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="오늘 있었던 일을 나눠보세요"
            className="w-full rounded-lg border border-ink-700/20 bg-paper-100/60 px-2.5 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-500/40 focus:border-seal-500"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs text-ink-700/70">
              <input type="checkbox" checked={allowComments} onChange={(e) => setAllowComments(e.target.checked)} />
              댓글 허용
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setComposerOpen(false)} className="text-xs text-ink-500/60">취소</button>
              <button type="button" onClick={handleCreatePost} disabled={!draft.trim()} className="rounded-sm bg-ink-black px-3 py-1.5 text-xs font-bold text-paper-50 disabled:opacity-40">
                게시하기
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {posts.length === 0 && !composerOpen && (
          <p className="py-10 text-center text-sm text-ink-500/60">
            {game.isAdmin ? '아직 게시된 피드가 없어요. + 버튼으로 첫 피드를 남겨보세요.' : '아직 게시된 공지가 없어요.'}
          </p>
        )}

        {posts.length > 0 && (
          <button type="button" onClick={() => setOpenId(posts[0].id)} className="text-left">
            <div className="overflow-hidden rounded-2xl border border-ink-700/12 bg-paper-50 shadow-[0_4px_18px_rgba(42,28,18,0.1)] transition hover:shadow-[0_6px_22px_rgba(42,28,18,0.16)]">
              <div className="h-1.5 bg-gradient-to-r from-seal-600 to-seal-400" />
              <div className="p-4">
                <div className="flex items-center gap-2.5">
                  <Avatar src={posts[0].authorAvatar} name={posts[0].authorNickname} size={10} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-bold text-ink-900">{posts[0].authorNickname}</p>
                      <span className="rounded-full bg-seal-600/10 px-2 py-0.5 text-[10px] font-bold text-seal-600">최신 소식</span>
                    </div>
                    <p className="font-mono text-[10px] text-ink-500/60">
                      {formatTime(posts[0].createdAt)} {posts[0].editedAt && '(수정됨)'}
                    </p>
                  </div>
                </div>
                {posts[0].title && <p className="mt-3 text-base font-bold text-ink-900">{posts[0].title}</p>}
                <p className="mt-1.5 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-900">{posts[0].content}</p>
                <p className="mt-3 text-xs text-ink-500/50">댓글 보기 →</p>
              </div>
            </div>
          </button>
        )}

        {posts.length > 1 && (
          <div className="flex flex-col gap-2.5">
            {posts.slice(1).map((p) => (
              <button key={p.id} type="button" onClick={() => setOpenId(p.id)} className="text-left">
                <div className="rounded-xl border border-ink-700/12 bg-paper-50 p-3.5 shadow-[0_2px_8px_rgba(42,28,18,0.06)] transition hover:border-ink-700/25">
                  <div className="flex items-center gap-2">
                    <Avatar src={p.authorAvatar} name={p.authorNickname} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-ink-900">{p.authorNickname}</p>
                      <p className="font-mono text-[10px] text-ink-500/60">
                        {formatTime(p.createdAt)} {p.editedAt && '(수정됨)'}
                      </p>
                    </div>
                  </div>
                  {p.title && <p className="mt-2 text-sm font-bold text-ink-900">{p.title}</p>}
                  <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-ink-900">{p.content}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {!composerOpen && game.isAdmin && (
        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          className="fixed bottom-24 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-seal-600 text-2xl font-bold text-paper-50 shadow-lg"
          aria-label="피드 작성"
        >
          +
        </button>
      )}
    </div>
  );
}
