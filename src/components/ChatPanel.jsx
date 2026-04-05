import { MessageCircle } from 'lucide-react';

export function ChatPanel({ messages }) {
  // Auto-scroll disabled to prevent screen jumping during letter detection
  // Users can manually scroll the chat if needed
  
  return (
    <div className="glass-card rounded-2xl lg:rounded-3xl border flex flex-col h-full overflow-hidden group card-hover">
      {/* Header */}
      <div className="px-4 sm:px-5 lg:px-6 py-3 sm:py-4 border-b border-white/10 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg sm:rounded-xl bg-primary/20 group-hover:bg-primary/30 transition-colors">
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-foreground truncate">Live Chat</h3>
            <p className="text-xs text-muted-foreground truncate">Gesture recognition</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 min-h-0 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center py-6 sm:py-8">
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-muted/30 mb-3">
              <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-xs text-center font-medium px-2">
              Gestures appear here<br/>as they're detected
            </p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-scale-in`}>
            <div className={`max-w-[85%] px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-2xl text-xs sm:text-sm font-medium transition-all duration-300 ${
              msg.type === 'user'
                ? 'bg-gradient-to-br from-primary to-secondary text-white rounded-br-none shadow-glow hover:shadow-glow-lg'
                : 'glass-card text-foreground border border-white/20 rounded-bl-none'
            }`}>
              <p className="break-words">{msg.text}</p>
              <span className={`text-xs opacity-70 mt-1 block font-normal ${
                msg.type === 'user' ? 'text-white/70' : 'text-muted-foreground'
              }`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
