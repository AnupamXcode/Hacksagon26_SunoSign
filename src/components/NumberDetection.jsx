import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, CameraOff, Volume2, VolumeX, Hand, Loader2, Trash2, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCamera } from '@/hooks/useCamera';
import { useNumberDetection } from '@/hooks/useNumberDetection';
import { speak } from '@/lib/tts';
import { numberToWord } from '@/lib/numberGesture';
import { useHandDetectionWithLandmarks } from '@/hooks/useHandDetectionWithLandmarks';

const GESTURE_GUIDE = [
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
  const canvasRef = useRef(null);
  const { hands, loading: modelLoading, landmarks } = useHandDetectionWithLandmarks(videoRef, canvasRef, isActive);
  const { result, history, clearHistory } = useNumberDetection(landmarks, isActive);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const lastSpokenNumberRef = useRef(null);
  const lastSpokenTimeRef = useRef(0);

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
    <div className="space-y-4 lg:space-y-6">
      <div className="grid lg:grid-cols-[1fr_340px] gap-4 lg:gap-6">
        <div className="space-y-4 lg:space-y-6">
          {/* Camera Feed */}
          <div className="glass-card rounded-2xl lg:rounded-3xl border overflow-hidden group card-hover">
            <div className="relative aspect-video bg-gradient-to-br from-primary/8 via-background to-secondary/8 backdrop-blur-sm">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted style={{ transform: 'scaleX(-1)' }} />
              <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: 'scaleX(-1)' }} />
              {!isActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 sm:gap-4 backdrop-blur-sm">
                  {camError ? (
                    <div className="text-center px-4 sm:px-6 fade-in">
                      <CameraOff className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mx-auto mb-3 animate-pulse" />
                      <p className="text-destructive font-bold text-sm sm:text-base">{camError}</p>
                    </div>
                  ) : (
                    <>
                      <Hash className="w-12 h-12 sm:w-16 sm:h-16 text-primary/30 animate-float" />
                      <p className="text-muted-foreground font-medium text-sm sm:text-base">Start camera to detect numbers</p>
                    </>
                  )}
                </div>
              )}
              {modelLoading && isActive && (
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-2 sm:gap-3 glass-card px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl fade-in">
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-primary" />
                  <span className="text-xs sm:text-sm font-semibold text-foreground">Loading AI...</span>
                </div>
              )}
              {isActive && (
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex gap-2 sm:gap-3">
                  {hands && hands.length > 0 && (
                    <span className="animate-scale-in glass-card text-accent-foreground rounded-lg sm:rounded-xl px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold backdrop-blur-xl">
                      ✋ Detected
                    </span>
                  )}
                </div>
              )}
              {isActive && result.number !== null && result.isStable && (
                <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 animate-scale-in">
                  <div className="px-6 sm:px-8 py-4 sm:py-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary to-secondary text-white text-center shadow-glow-lg">
                    <p className="text-5xl sm:text-6xl font-black" style={{ fontFamily: 'var(--font-mono)' }}>{result.number}</p>
                    <p className="text-xs font-semibold mt-1 sm:mt-2 opacity-90">Number</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-3 sm:p-4 lg:p-5 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <Button onClick={isActive ? stop : start} className={`w-full sm:w-auto rounded-lg sm:rounded-xl h-10 sm:h-12 px-4 sm:px-6 font-bold text-sm sm:text-base transition-all duration-300 hover-scale ${
                isActive 
                  ? 'bg-gradient-to-r from-destructive to-red-600 text-white shadow-glow-lg' 
                  : 'bg-gradient-to-r from-primary to-secondary text-white shadow-glow-lg'
              }`}>
                {isActive ? <><CameraOff className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Stop</> : <><Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Start</>}
              </Button>
              <Button variant="outline" className="rounded-lg sm:rounded-xl h-10 sm:h-12 px-3 sm:px-4 gap-2 glass-card border-white/20 hover:border-primary/50 hidden sm:flex" onClick={speakCurrent} disabled={result.number === null}>
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button variant="ghost" className="rounded-lg sm:rounded-xl h-10 sm:h-12 ml-auto sm:ml-0 text-xs sm:text-sm glass-card hover:border-white/20" onClick={() => setShowGuide(g => !g)}>
                <Hand className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Guide</span>
              </Button>
            </div>
          </div>
          {showGuide && (
            <div className="glass-card rounded-2xl lg:rounded-3xl border p-4 sm:p-6 animate-slide-down">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 sm:mb-5">📚 Gesture Guide</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                {GESTURE_GUIDE.map(g => (
                  <button 
                    key={g.number} 
                    className="glass-card rounded-lg sm:rounded-2xl p-2 sm:p-4 text-center hover:border-primary/50 transition-all duration-300 hover-scale border"
                  >
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{g.fingers}</div>
                    <div className="text-base sm:text-xl font-bold text-primary" style={{ fontFamily: 'var(--font-mono)' }}>{g.number}</div>
                    <p className="text-xs text-muted-foreground mt-1 leading-tight hidden sm:block">{g.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block space-y-4 lg:space-y-6 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto">
          {/* Detection Output */}
          <div className="glass-card rounded-2xl lg:rounded-3xl border p-4 lg:p-6 sticky top-0">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">📊 Output</p>
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-24 h-24 lg:w-28 lg:h-28 rounded-2xl lg:rounded-3xl text-4xl lg:text-6xl font-black transition-all duration-300 ${
                result.number !== null && result.isStable
                  ? 'bg-gradient-to-br from-primary/30 to-secondary/30 text-primary soft-glow'
                  : 'bg-muted/20 text-muted-foreground/30'
              }`} style={{ fontFamily: 'var(--font-mono)' }}>
                {result.number !== null ? result.number : '?'}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-semibold">Accuracy</span>
                <span className="text-xs lg:text-sm font-bold text-primary">{result.confidence}%</span>
              </div>
              <Progress value={result.confidence} className="h-2 rounded-full" />
            </div>
          </div>

          {/* Finger States */}
          <div className="glass-card rounded-2xl lg:rounded-3xl border p-4 lg:p-6">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">🖐️ Fingers</p>
            <div className="grid grid-cols-5 gap-1.5 lg:gap-2">
              {fingerEntries.map(f => (
                <div key={f.name} className={`p-2 rounded-lg lg:rounded-xl text-center transition-all ${f.open ? 'bg-primary/30 border border-primary/50' : 'bg-muted/20 border border-muted/30'}`}>
                  <p className="text-xs font-bold text-foreground">{f.name[0]}</p>
                  <p className="text-lg font-black text-primary mt-1">{f.open ? '✓' : '-'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* History */}
          <div className="glass-card rounded-2xl lg:rounded-3xl border p-4 lg:p-6">
             <div className="flex items-center justify-between mb-4">
               <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">🕐 History</p>
               {history.length > 0 && (
                 <Button variant="ghost" size="sm" className="h-7 lg:h-8 text-xs rounded-lg hover:bg-destructive/20 hover:text-destructive" onClick={clearHistory}>
                   <Trash2 className="w-3 h-3 lg:w-3.5 lg:h-3.5 mr-1" /> Clear
                 </Button>
               )}
             </div>
             {history.length === 0 && (
               <p className="text-xs text-muted-foreground text-center py-4">No history...</p>
             )}
             <div className="flex flex-wrap gap-1.5 lg:gap-2">
               {history.map((h, i) => (
                 <div key={i} className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary rounded-lg lg:rounded-2xl px-3 lg:px-4 py-1.5 lg:py-2 text-lg lg:text-xl font-bold fade-in border border-primary/30 hover:border-primary/60 transition-all duration-300">
                   {h.number}
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
