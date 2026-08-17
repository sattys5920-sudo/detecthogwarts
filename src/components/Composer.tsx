import NibIcon from './NibIcon';

export default function Composer() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full border border-ink-700/20 bg-paper-50 px-3.5 py-2 text-sm text-ink-500/60">
        메시지를 입력하세요
      </div>
      <button
        type="button"
        disabled
        className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-ink-black text-paper-50 disabled:opacity-60"
        aria-label="보내기"
      >
        <NibIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
