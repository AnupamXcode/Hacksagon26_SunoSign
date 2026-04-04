import { useRef, useEffect } from 'react';


export function ChatPanel({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border bg-muted/50">
        <h3 className="text-sm font-semibold text-card-foreground">Conversation</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">Gestures will appear here as messages...</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} slide-up`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
              msg.type === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-md'
                : 'bg-muted text-foreground rounded-bl-md'
            }`}>
              <p>{msg.text}</p>
              <span className="text-[10px] opacity-60 mt-1 block">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
