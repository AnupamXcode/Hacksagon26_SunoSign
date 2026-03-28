import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, CameraOff, User, Hand, Volume2, Loader2, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCamera } from '@/hooks/useCamera';
import { useHandDetection } from '@/hooks/useHandDetection';
import { useProfile } from '@/hooks/useProfile';
import { speak, speakEmergency, stopEmergency } from '@/lib/tts';
import { ProfileModal } from '@/components/ProfileModal';
import { ChatPanel, type ChatMessage } from '@/components/ChatPanel';
import { EmergencyOverlay } from '@/components/EmergencyOverlay';
import { QuickPhrases } from '@/components/QuickPhrases';
import { WordBuilder } from '@/components/WordBuilder';
import { NumberDetection } from '@/components/NumberDetection';

const STABILITY_FRAMES = 5;
const COOLDOWN_MS = 2000;

export default function SignVoiceApp() {
  const [mode, setMode] = useState<'alphabet' | 'numbers'>('alphabet');
  const { videoRef, isActive, error: camError, start, stop } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { gesture, loading: modelLoading } = useHandDetection(videoRef, canvasRef, isActive);
  const { profile, save: saveProfile } = useProfile();
  const [profileOpen, setProfileOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [emergency, setEmergency] = useState(false);

  // Stability state
  const gestureBufferRef = useRef<string[]>([]);
  const lastConfirmedRef = useRef<string>('NONE');
  const lastConfirmTimeRef = useRef(0);
  const [stableLetter, setStableLetter] = useState<string | null>(null);
  const [stableConfidence, setStableConfidence] = useState(0);
  const [stableFingerStates, setStableFingerStates] = useState<boolean[] | undefined>();

  const addMessage = useCallback((type: 'user' | 'system', text: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), type, text, timestamp: new Date() }]);
  }, []);

  const handleSpeak = useCallback((text: string) => {
    addMessage('system', text);
  }, [addMessage]);

  // Majority-voting gesture stabilization
  useEffect(() => {
    if (!isActive) return;

    const buffer = gestureBufferRef.current;
    buffer.push(gesture.gesture);
    if (buffer.length > STABILITY_FRAMES) buffer.shift();

    if (buffer.length < STABILITY_FRAMES) return;

    // Majority vote
    const counts: Record<string, number> = {};
    for (const g of buffer) counts[g] = (counts[g] || 0) + 1;
    let majorityGesture = 'NONE';
    let maxCount = 0;
    for (const [g, c] of Object.entries(counts)) {
      if (c > maxCount) { majorityGesture = g; maxCount = c; }
    }

    if (majorityGesture === 'NONE' || maxCount < Math.ceil(STABILITY_FRAMES * 0.6)) {
      setStableLetter(null);
      return;
    }

    const now = Date.now();
    if (majorityGesture === lastConfirmedRef.current && now - lastConfirmTimeRef.current < COOLDOWN_MS) {
      // Same gesture within cooldown — just keep showing it, don't re-trigger
      return;
    }

    if (majorityGesture !== lastConfirmedRef.current) {
      lastConfirmedRef.current = majorityGesture;
      lastConfirmTimeRef.current = now;

      if (gesture.isAlphabet) {
        setStableLetter(majorityGesture);
        setStableConfidence(gesture.confidence);
        setStableFingerStates(gesture.fingerStates);
        addMessage('user', `Letter: ${majorityGesture}`);
      } else if (majorityGesture === 'OPEN_PALM') {
        speak('Please stop');
        addMessage('user', 'Gesture: STOP');
        addMessage('system', 'Please stop');
        setStableLetter(null);
      } else if (majorityGesture === 'THUMBS_UP') {
        speak('Yes');
        addMessage('user', 'Gesture: YES');
        addMessage('system', 'Yes');
        setStableLetter(null);
      } else if (majorityGesture === 'FIST') {
        speak('No');
        addMessage('user', 'Gesture: NO');
        addMessage('system', 'No');
        setStableLetter(null);
      } else {
        setStableLetter(null);
      }
    }
  }, [gesture, isActive, addMessage]);

  // Reset on camera off
  useEffect(() => {
    if (!isActive) {
      gestureBufferRef.current = [];
      lastConfirmedRef.current = 'NONE';
      setStableLetter(null);
    }
  }, [isActive]);

  const handleWordComplete = useCallback((word: string, sentence: string) => {
    addMessage('user', word);
    addMessage('system', sentence);
  }, [addMessage]);

  const handleEmergency = useCallback(() => {
    setEmergency(true);
    speakEmergency('I need help! Emergency!');
  }, []);

  const dismissEmergency = () => {
    setEmergency(false);
    stopEmergency();
  };

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
            <h1 className="text-lg font-bold text-foreground leading-tight" style={{ fontFamily: 'var(--font-display)' }}>SignVoice AI</h1>
            <p className="text-xs text-muted-foreground">{mode === 'alphabet' ? 'A–Z Sign Language' : 'Number Signs 1–10'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-xl p-1 gap-1">
            <button onClick={() => setMode('alphabet')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mode === 'alphabet' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <Hand className="w-3.5 h-3.5 inline mr-1" />A–Z
            </button>
            <button onClick={() => setMode('numbers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mode === 'numbers' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <Hash className="w-3.5 h-3.5 inline mr-1" />1–10
            </button>
          </div>
          <button onClick={() => setProfileOpen(true)}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <User className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        {mode === 'numbers' ? (
          <NumberDetection />
        ) : (
          <div className="grid lg:grid-cols-[1fr_360px] gap-6">
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
                  {/* Gesture badge */}
                  {isActive && gesture.gesture !== 'NONE' && (
                    <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm text-primary-foreground rounded-lg px-3 py-1.5 fade-in">
                      <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-mono)' }}>{gesture.label}</p>
                      <p className="text-[10px] opacity-80">Confidence: {gesture.confidence}%</p>
                    </div>
                  )}
                </div>
                <div className="p-4 flex items-center justify-between">
                  <Button onClick={isActive ? stop : start} variant={isActive ? 'destructive' : 'default'} className="rounded-xl h-11 px-6 font-semibold">
                    {isActive ? <><CameraOff className="w-4 h-4 mr-2" /> Stop Camera</> : <><Camera className="w-4 h-4 mr-2" /> Start Camera</>}
                  </Button>
                  {isActive && gesture.gesture !== 'NONE' && (
                    <div className="flex items-center gap-3 fade-in">
                      <div className="gesture-pulse w-3 h-3 rounded-full bg-accent" />
                      <div>
                        <p className="text-base font-bold text-foreground">{gesture.label}</p>
                        <p className="text-xs text-muted-foreground">{gesture.isAlphabet ? 'Letter detected' : 'Gesture detected'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Word Builder with integrated detection panel */}
              <WordBuilder
                currentLetter={stableLetter}
                confidence={stableConfidence}
                fingerStates={stableFingerStates}
                onWordComplete={handleWordComplete}
                onEmergency={handleEmergency}
              />

              {/* Quick Phrases */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Quick Phrases</h3>
                <QuickPhrases onSpeak={handleSpeak} />
              </div>
            </div>

            {/* Right Column - Chat */}
            <div className="lg:h-[calc(100vh-120px)] lg:sticky lg:top-[80px] h-[400px]">
              <ChatPanel messages={messages} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
