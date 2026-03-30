import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, CameraOff, User, Hand, Volume2, VolumeX, Loader2, Hash, Trash2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCamera } from '@/hooks/useCamera';
import { useHandDetection } from '@/hooks/useHandDetection';
import { useProfile } from '@/hooks/useProfile';
import { speak, speakEmergency, stopEmergency } from '@/lib/tts';
import { classifySunoGesture, type SunoGestureResult, type SunoGestureType } from '@/lib/sunoGesture';
import { ProfileModal } from '@/components/ProfileModal';
import { EmergencyOverlay } from '@/components/EmergencyOverlay';
import { SunoDetectionPanel } from '@/components/SunoDetectionPanel';
import { GestureGuide } from '@/components/GestureGuide';
import { DetectionHistory, type HistoryEntry } from '@/components/DetectionHistory';
import { NumberDetection } from '@/components/NumberDetection';

const STABILITY_FRAMES = 5;
const COOLDOWN_MS = 2000;

export default function SignVoiceApp() {
  const [mode, setMode] = useState<'gestures' | 'numbers'>('gestures');
  const { videoRef, isActive, error: camError, start, stop } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { gesture: rawGesture, loading: modelLoading, landmarks } = useHandDetection(videoRef, canvasRef, isActive);
  const { profile, save: saveProfile } = useProfile();
  const [profileOpen, setProfileOpen] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Suno gesture result from landmarks
  const [sunoResult, setSunoResult] = useState<SunoGestureResult>({
    gesture: 'NONE', confidence: 0, label: 'No Gesture', sentence: '',
    fingerStates: [false, false, false, false, false],
    movement: 'static', orientation: 'neutral',
  });

  // Stability state
  const gestureBufferRef = useRef<SunoGestureType[]>([]);
  const lastConfirmedRef = useRef<SunoGestureType>('NONE');
  const lastConfirmTimeRef = useRef(0);

  // Process landmarks through SunoSign gesture engine
  useEffect(() => {
    if (!isActive || !landmarks) return;
    const result = classifySunoGesture(landmarks);
    setSunoResult(result);
  }, [isActive, landmarks]);

  // Majority-voting stabilization
  useEffect(() => {
    if (!isActive) return;

    const buffer = gestureBufferRef.current;
    buffer.push(sunoResult.gesture);
    if (buffer.length > STABILITY_FRAMES) buffer.shift();
    if (buffer.length < STABILITY_FRAMES) return;

    const counts: Record<string, number> = {};
    for (const g of buffer) counts[g] = (counts[g] || 0) + 1;
    let majorityGesture: SunoGestureType = 'NONE';
    let maxCount = 0;
    for (const [g, c] of Object.entries(counts)) {
      if (c > maxCount) { majorityGesture = g as SunoGestureType; maxCount = c; }
    }

    if (majorityGesture === 'NONE' || maxCount < Math.ceil(STABILITY_FRAMES * 0.6)) return;

    const now = Date.now();
    if (majorityGesture === lastConfirmedRef.current && now - lastConfirmTimeRef.current < COOLDOWN_MS) return;

    if (majorityGesture !== lastConfirmedRef.current) {
      lastConfirmedRef.current = majorityGesture;
      lastConfirmTimeRef.current = now;

      const entry: HistoryEntry = {
        id: Date.now().toString(),
        gesture: majorityGesture,
        label: sunoResult.label,
        sentence: sunoResult.sentence,
        timestamp: new Date(),
      };
      setHistory(prev => [entry, ...prev].slice(0, 20));

      if (voiceEnabled && sunoResult.sentence) {
        speak(sunoResult.sentence);
      }
    }
  }, [sunoResult, isActive, voiceEnabled]);

  // Reset on camera off
  useEffect(() => {
    if (!isActive) {
      gestureBufferRef.current = [];
      lastConfirmedRef.current = 'NONE';
    }
  }, [isActive]);

  const handleEmergency = useCallback(() => {
    setEmergency(true);
    speakEmergency('I need help! Emergency!');
  }, []);

  const dismissEmergency = () => {
    setEmergency(false);
    stopEmergency();
  };

  const clearHistory = () => setHistory([]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {emergency && <EmergencyOverlay onDismiss={dismissEmergency} />}
      <ProfileModal profile={profile} onSave={saveProfile} open={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* Header */}
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Hand className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight" style={{ fontFamily: 'var(--font-display)' }}>SunoSign</h1>
            <p className="text-xs text-muted-foreground">
              {mode === 'gestures' ? 'Real-time Hand Sign → Text & Voice' : 'Number Signs 1–10'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-xl p-1 gap-1">
            <button onClick={() => setMode('gestures')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mode === 'gestures' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <Hand className="w-3.5 h-3.5 inline mr-1" />Signs
            </button>
            <button onClick={() => setMode('numbers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mode === 'numbers' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <Hash className="w-3.5 h-3.5 inline mr-1" />1–10
            </button>
          </div>
          <button onClick={() => setShowGuide(!showGuide)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${showGuide ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            <BookOpen className="w-5 h-5" />
          </button>
          <button onClick={() => setProfileOpen(true)}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <User className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {mode === 'numbers' ? (
          <NumberDetection />
        ) : (
          <div className="grid lg:grid-cols-[1fr_340px] gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Camera */}
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="relative aspect-video bg-foreground/5">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted style={{ transform: 'scaleX(-1)' }} />
                  <canvas ref={canvasRef} width={640} height={480}
                    className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: 'scaleX(-1)' }} />
                  {!isActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      {camError ? (
                        <div className="text-center px-6">
                          <CameraOff className="w-12 h-12 text-destructive mx-auto mb-3" />
                          <p className="text-destructive font-medium text-sm">{camError}</p>
                        </div>
                      ) : (
                        <>
                          <Camera className="w-12 h-12 text-muted-foreground/40" />
                          <p className="text-muted-foreground text-sm">Camera is off</p>
                        </>
                      )}
                    </div>
                  )}
                  {modelLoading && isActive && (
                    <div className="absolute top-3 left-3 flex items-center gap-2 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium text-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" /> Loading hand model...
                    </div>
                  )}
                  {/* Live gesture badge */}
                  {isActive && sunoResult.gesture !== 'NONE' && (
                    <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm text-primary-foreground rounded-lg px-4 py-2 fade-in">
                      <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>{sunoResult.label}</p>
                      <p className="text-[10px] opacity-80">{sunoResult.sentence}</p>
                    </div>
                  )}
                </div>
                <div className="p-4 flex items-center justify-between flex-wrap gap-2">
                  <Button onClick={isActive ? stop : start} variant={isActive ? 'destructive' : 'default'} className="rounded-xl h-11 px-6 font-semibold">
                    {isActive ? <><CameraOff className="w-4 h-4 mr-2" /> Stop</> : <><Camera className="w-4 h-4 mr-2" /> Start Camera</>}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="rounded-xl h-9 gap-1.5"
                      onClick={() => setVoiceEnabled(!voiceEnabled)}>
                      {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                      {voiceEnabled ? 'Voice On' : 'Voice Off'}
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-xl h-9 gap-1.5" onClick={clearHistory}>
                      <Trash2 className="w-3.5 h-3.5" /> Clear
                    </Button>
                  </div>
                </div>
              </div>

              {/* Detection Panel */}
              <SunoDetectionPanel result={sunoResult} isActive={isActive} />

              {/* Gesture Guide (togglable) */}
              {showGuide && <GestureGuide />}
            </div>

            {/* Right Column — History */}
            <div className="lg:h-[calc(100vh-120px)] lg:sticky lg:top-[80px] h-[400px]">
              <DetectionHistory history={history} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-4 py-4 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">Built for accessibility and smart communication</p>
      </footer>
    </div>
  );
}
