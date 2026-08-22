export interface ChatMessage {
  id: string;
  name: string;
  initial: string;
  avatar?: string;
  who: 'black' | 'red' | 'indigo';
  text: string;
  me?: boolean;
}

const WHO_BG: Record<ChatMessage['who'], string> = {
  black: 'bg-ink-black',
  red: 'bg-ink-red',
  indigo: 'bg-ink-indigo',
};

const WHO_TEXT: Record<ChatMessage['who'], string> = {
  black: 'text-ink-black',
  red: 'text-ink-red',
  indigo: 'text-ink-indigo',
};

const WHO_BORDER_L: Record<ChatMessage['who'], string> = {
  black: 'border-l-ink-black',
  red: 'border-l-ink-red',
  indigo: 'border-l-ink-indigo',
};

const WHO_BORDER_R: Record<ChatMessage['who'], string> = {
  black: 'border-r-ink-black',
  red: 'border-r-ink-red',
  indigo: 'border-r-ink-indigo',
};

export default function ChatLog({ sysline, messages }: { sysline?: string; messages: ChatMessage[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {sysline && (
        <p className="my-1 text-center font-mono text-[11px] text-ink-500/70">{sysline}</p>
      )}
      {messages.map((m) => (
        <div key={m.id} className={`flex max-w-[85%] items-start gap-2 ${m.me ? 'ml-auto flex-row-reverse' : ''}`}>
          {m.avatar ? (
            <img src={m.avatar} alt="" className="h-6 w-6 flex-none rounded-full border border-ink-700/20 object-cover" />
          ) : (
            <span
              className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-[10px] font-bold text-paper-50 ${WHO_BG[m.who]}`}
            >
              {m.initial}
            </span>
          )}
          <div className={`flex min-w-0 flex-1 flex-col ${m.me ? 'items-end' : 'items-start'}`}>
            <p className={`mb-0.5 text-[11px] font-bold ${WHO_TEXT[m.who]}`}>{m.name}</p>
            <p
              className={`rounded-sm border border-ink-700/15 px-2.5 py-1.5 text-sm text-ink-900 ${
                m.me
                  ? `border-r-2 bg-paper-200/60 ${WHO_BORDER_R[m.who]}`
                  : `border-l-2 bg-paper-50 ${WHO_BORDER_L[m.who]}`
              }`}
            >
              {m.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
