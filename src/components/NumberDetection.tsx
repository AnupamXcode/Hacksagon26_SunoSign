import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, CameraOff, Volume2, VolumeX, Hand, Loader2, Trash2, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCamera } from '@/hooks/useCamera';
import { useHandDetection } from '@/hooks/useHandDetection';
import { useNumberDetection } from '@/hooks/useNumberDetection';
import { speak } from '@/lib/tts';
import { numberToWord } from '@/lib/numberGesture';

const GESTURE_GUIDE: { number: number; fingers: string; description: string }[] = [
  { number: 1, fingers: '☝️', description: 'Only index finger up' },
  { number: 2, fingers: '✌️', description: 'Index + middle up' },
  { number: 3, fingers: '🤟', description: 'Index + middle + ring up' },
  { number: 4, fingers: '🖖', description: 'Four fingers up (no thumb)' },
  { number: 5, fingers: '🖐️', description: 'All fingers open' },
  { number: 6, fingers: '🤙', description: 'Thumb + pinky open' },
  { number: 7, fingers: '7️⃣', description: 'Thumb + ring open' },
  { number: 8, fingers: '8️⃣', description: 'Thumb + middle open' },
  { number: 9, fingers: '9️⃣', description: 'Only pinky open' },
  { number: 10, fingers: '👍', description: 'Only thumb open' },
];

export function NumberDetection() {
  const { videoRef, isActive, error: camError, start, stop } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { gesture, loading: modelLoading, landmarks } = useHandDetection(videoRef, canvasRef, isActive);
  const { result, history, clearHistory } = useNumberDetection(landmarks, isActive);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const lastSpokenNumberRef = useRef<number | null>(null);
  const lastSpokenTimeRef = useRef(0);

  // Auto-speak when stable number changes
  useEffect(() => {
    if (!voiceEnabled || !result.isStable || result.number === null) return;
    const now = Date.now();
    if (result.number !== lastSpokenNumberRef.current || now - lastSpokenTimeRef.current > 3000) {
      speak(numberToWord(result.number));
      lastSpokenNumberRef.current = result.number;
      lastSpokenTimeRef.current = now;
    }
  }, [result.isStable, result.number, voiceEnabled]);

  const speakCurrent = useCallback(() => {
    if (result.number !== null) speak(numberToWord(result.number));
  }, [result.number]);

  const fingerEntries = [
    { name: 'Thumb', open: result.fingerStates.thumb },
    { name: 'Index', open: result.fingerStates.index },
    { name: 'Middle', open: result.fingerStates.middle },
    { name: 'Ring', open: result.fingerStates.ring },
    { name: 'Pinky', open: result.fingerStates.pinky },
  ];

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-[1fr_340px] gap-4">
        {/* Camera panel */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="relative aspect-video bg-foreground/5">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted style={{ transform: 'scaleX(-1)' }} />
              <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: 'scaleX(-1)' }} />
              {!isActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  {camError ? (
                    <div className="text-center px-6">
                      <CameraOff className="w-12 h-12 text-destructive mx-auto mb-3" />
                      <p className="text-destructive font-medium text-sm">{camError}</p>
                    </div>
                  ) : (
                    <>
                      <Hash className="w-12 h-12 text-muted-foreground/40" />
                      <p className="text-muted-foreground text-sm">Start camera to detect number signs</p>
                    </>
                  )}
                </div>
              )}
              {modelLoading && isActive && (
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium text-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading model...
                </div>
              )}
              {/* Detection status badge */}
              {isActive && (
                <div className={`absolute top-3 right-3 rounded-lg px-3 py-1.5 text-xs font-semibold backdrop-blur-sm fade-in ${
                  gesture.gesture !== 'NONE' ? 'bg-accent/90 text-accent-foreground' : 'bg-muted/80 text-muted-foreground'
                }`}>
                  {gesture.gesture !== 'NONE' ? '✋ Hand Detected' : 'No Hand Found'}
                </div>
              )}
              {/* Big number display */}
              {isActive && result.number !== null && result.isStable && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 gesture-pulse bg-primary/90 backdrop-blur-sm text-primary-foreground rounded-2xl px-8 py-4 text-center fade-in">
                  <p className="text-5xl font-black" style={{ fontFamily: 'var(--font-mono)' }}>{result.number}</p>
                  <p className="text-sm font-semibold opacity-90 mt-1">{result.label}</p>
                </div>
              )}
            </div>
            {/* Controls */}
            <div className="p-4 flex items-center gap-2 flex-wrap">
              <Button onClick={isActive ? stop : start} variant={isActive ? 'destructive' : 'default'} className="rounded-xl h-11 px-5 font-semibold">
                {isActive ? <><CameraOff className="w-4 h-4 mr-2" /> Stop</> : <><Camera className="w-4 h-4 mr-2" /> Start Camera</>}
              </Button>
              <Button variant="outline" className="rounded-xl h-11" onClick={speakCurrent} disabled={result.number === null}>
                <Volume2 className="w-4 h-4 mr-2" /> Speak
              </Button>
              <Button variant={voiceEnabled ? 'secondary' : 'outline'} className="rounded-xl h-11" onClick={() => setVoiceEnabled(v => !v)}>
                {voiceEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
                {voiceEnabled ? 'Voice On' : 'Voice Off'}
              </Button>
              <Button variant="ghost" className="rounded-xl h-11 ml-auto" onClick={() => setShowGuide(g => !g)}>
                <Hand className="w-4 h-4 mr-2" /> Guide
              </Button>
            </div>
          </div>

          {/* Gesture Guide */}
          {showGuide && (
            <div className="bg-card rounded-2xl border border-border p-4 slide-up">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Hand className="w-4 h-4 text-primary" /> Number Gesture Guide
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {GESTURE_GUIDE.map(g => (
                  <div key={g.number} className="bg-muted/50 rounded-xl p-3 text-center">
                    <div className="text-2xl mb-1">{g.fingers}</div>
                    <div className="text-lg font-bold text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{g.number}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight mt-1">{g.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel: detection output */}
        <div className="space-y-4">
          {/* Detected number card */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Detection Output</h3>
            <div className="text-center mb-4">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-2xl text-5xl font-black transition-all duration-300 ${
                result.number !== null && result.isStable
                  ? 'bg-primary/15 text-primary gesture-pulse'
                  : 'bg-muted/50 text-muted-foreground/30'
              }`} style={{ fontFamily: 'var(--font-mono)' }}>
                {result.number !== null ? result.number : '?'}
              </div>
              <p className="text-sm font-semibold text-foreground mt-2">
                {result.number !== null ? result.label : 'Show a number sign'}
              </p>
              {result.isStable && result.number !== null && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-accent/15 text-accent text-[10px] font-bold rounded-full uppercase">
                  Gesture Locked
                </span>
              )}
            </div>

            {/* Confidence */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">Confidence</span>
                <span className="font-bold text-foreground">{result.confidence}%</span>
              </div>
              <Progress value={result.confidence} className="h-2" />
            </div>

            {/* Stability */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">Stability</span>
                <span className="font-bold text-foreground">{Math.min(result.stableFrames, 4)}/4 frames</span>
              </div>
              <Progress value={Math.min(result.stableFrames, 4) * 25} className="h-2" />
            </div>

            {/* Finger states */}
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground font-medium">Finger States</span>
              <div className="grid grid-cols-5 gap-1.5">
                {fingerEntries.map(f => (
                  <div key={f.name} className={`text-center rounded-lg py-2 text-[10px] font-bold uppercase transition-colors ${
                    f.open ? 'bg-accent/15 text-accent' : 'bg-muted/50 text-muted-foreground'
                  }`}>
                    <div className="text-base mb-0.5">{f.open ? '☝️' : '✊'}</div>
                    {f.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detection history */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">History</h3>
              {history.length > 0 && (
                <Button variant="ghost" size="sm" className="h-6 text-xs rounded-lg" onClick={clearHistory}>
                  <Trash2 className="w-3 h-3 mr-1" /> Clear
                </Button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No detections yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {history.map((h, i) => (
                  <div key={i} className="bg-primary/10 text-primary rounded-xl px-3 py-1.5 text-sm font-bold fade-in" style={{ fontFamily: 'var(--font-mono)' }}>
                    {h.number}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
