import { GESTURE_GUIDE } from '@/lib/sunoGesture';

export function GestureGuide() {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/50">
        <h3 className="text-sm font-semibold text-card-foreground">Gesture Guide — 16 Signs</h3>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
        {GESTURE_GUIDE.map(g => (
          <div key={g.gesture} className="flex items-start gap-2 bg-muted/30 rounded-xl px-3 py-2.5 border border-border/50 hover:bg-muted/50 transition-colors">
            <span className="text-lg flex-shrink-0">{g.emoji}</span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground leading-tight truncate">
                {g.gesture.replace(/_/g, ' ')}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">{g.fingers}</p>
              <p className="text-[10px] text-primary leading-tight">{g.movement}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
