import { useRef, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';

export function ChatPanel({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="glass-card rounded-3xl border flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Live Conversation</h3>
            <p className="text-xs text-muted-foreground">Real-time gesture to speech</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center py-8">
            <div className="p-4 rounded-2xl bg-muted/30 mb-3">
              <MessageCircle className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-xs text-center font-medium">
              Gestures appear here<br/>as they're detected
            </p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-scale-in`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
              msg.type === 'user'
                ? 'bg-gradient-to-br from-primary to-secondary text-white rounded-br-none shadow-glow hover:shadow-glow-lg'
                : 'glass-card text-foreground border border-white/20 rounded-bl-none'
            }`}>
              <p className="break-words">{msg.text}</p>
              <span className={`text-xs opacity-70 mt-1.5 block font-normal ${
                msg.type === 'user' ? 'text-white/70' : 'text-muted-foreground'
              }`}>
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
