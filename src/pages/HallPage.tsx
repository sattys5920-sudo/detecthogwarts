import { useCallback, useEffect, useState } from 'react';
import Composer from '../components/Composer';
import CornerFlourish from '../components/CornerFlourish';
import Letterhead from '../components/Letterhead';
import VintageIcon from '../components/VintageIcon';
import { usePageBack } from '../context/BackContext';
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
  setPostAllowComments,
  setPostPinned,
  updateComment,
  updatePost,
} from '../firebase/posts';
import { usePlayerAvatars } from '../hooks/usePlayerAvatars';
import { useStickyScroll } from '../hooks/useStickyScroll';

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

function CommentRow({ comment, postAuthorId, avatars, onEdit, onDelete }: {
  comment: Comment;
  postAuthorId: string;
  avatars: Record<string, string | null>;
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
      <Avatar src={avatars[comment.authorPlayerId] ?? comment.authorAvatar} name={comment.authorNickname} />
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
              className="min-w-0 flex-1 rounded-md border border-ink-700/20 bg-paper-50 px-2 py-1 text-sm text-ink-900 outline-none focus:border-seal-500"
              autoFocus
            />
            <button type="button" onClick={() => { if (draft.trim()) { onEdit(draft.trim()); setEditing(false); } }} className="text-xs font-bold text-seal-600">저장</button>
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-ink-500/60">취소</button>
          </div>
        ) : (
          <p className="mt-0.5 text-xs text-ink-900">
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

function PostDetail({ post, avatars, onBack, onEdit, onDelete }: {
  post: Post;
  avatars: Record<string, string | null>;
  onBack: () => void;
  onEdit: (title: string, content: string) => void;
  onDelete: () => void;
}) {
  const game = useGame();
  const [comments, setComments] = useState<Comment[]>([]);
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(post.title);
  const [draft, setDraft] = useState(post.content);
  const [secretDraft, setSecretDraft] = useState(false);
  const listRef = useStickyScroll<HTMLDivElement>(comments.length);
  const isMine = post.authorPlayerId === game.playerId;

  useEffect(() => listenComments(post.id, setComments), [post.id]);

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
          <Avatar src={avatars[post.authorPlayerId] ?? post.authorAvatar} name={post.authorNickname} size={9} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-bold text-ink-900">{post.authorNickname}</p>
              {post.pinned && (
                <span className="rounded-sm border border-seal-600/40 bg-seal-600/10 px-1.5 py-0.5 text-[10px] font-bold text-seal-600">📌 공지</span>
              )}
            </div>
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
        {!editing && (isMine || game.isAdmin) && (
          <div className="mt-2 flex gap-2 text-[11px] text-ink-500/50">
            {isMine && <button type="button" onClick={() => setEditing(true)} className="hover:text-ink-700 hover:underline">수정</button>}
            {isMine && <button type="button" onClick={onDelete} className="hover:text-seal-600 hover:underline">삭제</button>}
            {game.isAdmin && (
              <button type="button" onClick={() => setPostPinned(post.id, !post.pinned)} className="hover:text-seal-600 hover:underline">
                {post.pinned ? '공지 고정 해제' : '공지로 고정'}
              </button>
            )}
            {game.isAdmin && (
              <button type="button" onClick={() => setPostAllowComments(post.id, !post.allowComments)} className="hover:text-seal-600 hover:underline">
                {post.allowComments ? '댓글 닫기' : '댓글 열기'}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold text-ink-700/70">댓글 {comments.length} 개</p>
        <div ref={listRef} className="flex max-h-80 flex-col gap-3 overflow-x-hidden overflow-y-auto">
          {comments.length === 0 && <p className="py-4 text-center text-xs text-ink-500/50">아직 댓글이 없어요.</p>}
          {comments.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              postAuthorId={post.authorPlayerId}
              avatars={avatars}
              onEdit={(text) => updateComment(post.id, c.id, text)}
              onDelete={() => deleteComment(post.id, c.id)}
            />
          ))}
        </div>

        {post.allowComments ? (
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 pl-1 text-xs text-ink-700/70">
              <input type="checkbox" checked={secretDraft} onChange={(e) => setSecretDraft(e.target.checked)} />
              비밀댓글로 작성
            </label>
            <Composer onSubmit={handleSubmitComment} placeholder="댓글을 입력하세요" submitLabel="댓글 등록" />
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
  const { byId: avatars } = usePlayerAvatars();
  const [posts, setPosts] = useState<Post[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [draft, setDraft] = useState('');
  const [allowComments, setAllowComments] = useState(true);

  useEffect(() => listenPosts(setPosts), []);

  const openPost = posts.find((p) => p.id === openId);

  const closePost = useCallback(() => setOpenId(null), []);
  usePageBack(openPost ? closePost : null);

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
      pinned: false,
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
          avatars={avatars}
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
            {game.isAdmin ? '아직 게시된 피드가 없어요. + 버튼으로 첫 피드를 남겨 보세요.' : '아직 게시된 공지가 없어요.'}
          </p>
        )}

        {posts.length > 0 && (
          <button type="button" onClick={() => setOpenId(posts[0].id)} className="text-left">
            <div className="paper-frame relative overflow-visible bg-paper-50 shadow-[0_1px_4px_rgba(42,28,18,0.12)] transition hover:border-seal-500/40">
              <CornerFlourish corner="tl" className="pointer-events-none absolute -top-1.5 -left-1.5 h-5 w-5 text-gold-600/70" />
              <CornerFlourish corner="tr" className="pointer-events-none absolute -top-1.5 -right-1.5 h-5 w-5 text-gold-600/70" />
              <CornerFlourish corner="bl" className="pointer-events-none absolute -bottom-1.5 -left-1.5 h-5 w-5 text-gold-600/70" />
              <CornerFlourish corner="br" className="pointer-events-none absolute -bottom-1.5 -right-1.5 h-5 w-5 text-gold-600/70" />
              <div className="h-1.5 bg-seal-600" />
              <div className="p-4">
                <div className="flex items-center gap-2.5">
                  <Avatar src={avatars[posts[0].authorPlayerId] ?? posts[0].authorAvatar} name={posts[0].authorNickname} size={10} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-bold text-ink-900">{posts[0].authorNickname}</p>
                      <span className="rounded-sm border border-seal-600/40 bg-seal-600/10 px-2 py-0.5 text-[10px] font-bold text-seal-600">
                        {posts[0].pinned ? '📌 공지' : '최신 소식'}
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-ink-500/60">
                      {formatTime(posts[0].createdAt)} {posts[0].editedAt && '(수정됨)'}
                    </p>
                  </div>
                  <VintageIcon name="feather" className="h-5 w-5 flex-none self-start text-gold-600/80" />
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
                <div className="paper-frame bg-paper-50 p-3.5 transition hover:border-seal-500/40">
                  <div className="flex items-center gap-2">
                    <Avatar src={avatars[p.authorPlayerId] ?? p.authorAvatar} name={p.authorNickname} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-xs font-bold text-ink-900">{p.authorNickname}</p>
                        {p.pinned && <span className="text-[10px] font-bold text-seal-600">📌 공지</span>}
                      </div>
                      <p className="font-mono text-[10px] text-ink-500/60">
                        {formatTime(p.createdAt)} {p.editedAt && '(수정됨)'}
                      </p>
                    </div>
                    <VintageIcon name="feather" className="h-3.5 w-3.5 flex-none text-gold-600/60" />
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
          className="tablet-btn tablet-btn-dark fixed right-4 z-20 flex h-12 w-12 items-center justify-center text-2xl font-bold"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}
          aria-label="피드 작성"
        >
          +
        </button>
      )}
    </div>
  );
}
