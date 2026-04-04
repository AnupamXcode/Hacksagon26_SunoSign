import { SunoGestureResult } from '@/lib/sunoGesture';
import { Progress } from '@/components/ui/progress';
import { Activity, Hand } from 'lucide-react';



const FINGER_NAMES = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];

export function SunoDetectionPanel({ result, isActive }) {
  if (!isActive) return null;

  const isDetected = result.gesture !== 'NONE';

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden slide-up">
      {/* Detected Gesture */}
      <div className={`px-5 py-4 border-b transition-colors ${isDetected ? 'bg-primary/10 border-primary/20' : 'bg-muted/30 border-border'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isDetected && <div className="gesture-pulse w-3 h-3 rounded-full bg-accent" />}
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isDetected ? 'Gesture Detected' : 'Waiting for gesture...'}
            </span>
          </div>
          {isDetected && (
            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">
              {result.confidence}%
            </span>
          )}
        </div>

        {isDetected ? (
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
              {result.label}
            </h2>
            <p className="text-sm text-primary font-medium italic">"{result.sentence}"</p>
            <Progress value={result.confidence} className="h-1.5" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Show a hand sign to the camera</p>
        )}
      </div>

      {/* Finger States */}
      <div className="px-5 py-3 border-b border-border">
        <div className="flex items-center gap-1.5 mb-2">
          <Hand className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Finger States</span>
        </div>
        <div className="flex items-center gap-3">
          {FINGER_NAMES.map((name, i) => (
            <div key={name} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center font-bold transition-all duration-200 ${
                result.fingerStates[i]
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {result.fingerStates[i] ? '↑' : '↓'}
              </div>
              <span className="text-[9px] text-muted-foreground font-medium">{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Movement & Orientation */}
      <div className="px-5 py-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Move:</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            result.movement !== 'static'
              ? 'bg-accent/15 text-accent'
              : 'bg-muted text-muted-foreground'
          }`}>
            {result.movement}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Orient:</span>
          <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {result.orientation}
          </span>
        </div>
      </div>
    </div>
  );
}
