import { type SunoGestureType } from '@/lib/sunoGesture';
import { Volume2 } from 'lucide-react';
import { speak } from '@/lib/tts';

export interface HistoryEntry {
  id: string;
  gesture: SunoGestureType;
  label: string;
  sentence: string;
  timestamp: Date;
}

interface DetectionHistoryProps {
  history: HistoryEntry[];
}

export function DetectionHistory({ history }: DetectionHistoryProps) {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border bg-muted/50">
        <h3 className="text-sm font-semibold text-card-foreground">Detection History</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {history.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">Detected gestures will appear here...</p>
        )}
        {history.map(entry => (
          <div key={entry.id} className="flex items-center gap-3 bg-muted/30 rounded-xl px-3 py-2.5 border border-border/50 slide-up">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{entry.label}</p>
              <p className="text-xs text-primary truncate">"{entry.sentence}"</p>
              <span className="text-[10px] text-muted-foreground">
                {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <button
              onClick={() => speak(entry.sentence)}
              className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors flex-shrink-0"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
