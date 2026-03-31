import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, CameraOff, Volume2, VolumeX, Loader2, Plus, Trash2, Hand, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCamera } from '@/hooks/useCamera';
import { useHandDetection, type HandInfo } from '@/hooks/useHandDetection';
import { speak } from '@/lib/tts';
import {
  classifyPhrase,
  getPhraseSuggestions,
  saveCustomGesture,
  getCustomGestures,
  deleteCustomGesture,
} from '@/lib/phraseGesture';

const STABILITY_FRAMES = 7;
const COOLDOWN_MS = 2500;

export function PhraseDetection() {
  const { videoRef, isActive, error: camError, start, stop } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { hands, loading: modelLoading } = useHandDetection(videoRef, canvasRef, isActive, 2);

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [captureMode, setCaptureMode] = useState(false);
  const [captureLabel, setCaptureLabel] = useState('');
  const [customGestures, setCustomGestures] = useState(getCustomGestures());
  const [detectedPhrase, setDetectedPhrase] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);

  const bufferRef = useRef<string[]>([]);
  const lastPhraseRef = useRef<string>('');
  const lastTimeRef = useRef(0);

  // Phrase detection with stabilization
  useEffect(() => {
    if (!isActive || hands.length === 0) {
      setDetectedPhrase(null);
      setConfidence(0);
      setSuggestions([]);
      bufferRef.current = [];
      return;
    }

    const result = classifyPhrase(hands);
    const phrase = result.phrase || 'NONE';
    const buf = bufferRef.current;
    buf.push(phrase);
    if (buf.length > STABILITY_FRAMES) buf.shift();
    if (buf.length < STABILITY_FRAMES) return;

    const counts: Record<string, number> = {};
    for (const p of buf) counts[p] = (counts[p] || 0) + 1;
    let majority = 'NONE';
    let maxCount = 0;
    for (const [p, c] of Object.entries(counts)) {
      if (c > maxCount) { majority = p; maxCount = c; }
    }

    if (majority === 'NONE' || maxCount < Math.ceil(STABILITY_FRAMES * 0.6)) {
      setDetectedPhrase(null);
      setConfidence(0);
      setSuggestions([]);
      return;
    }

    const now = Date.now();
    if (majority === lastPhraseRef.current && now - lastTimeRef.current < COOLDOWN_MS) return;

    if (majority !== lastPhraseRef.current || now - lastTimeRef.current >= COOLDOWN_MS) {
      lastPhraseRef.current = majority;
      lastTimeRef.current = now;
      setDetectedPhrase(majority);
      setConfidence(result.confidence);
      setSuggestions(getPhraseSuggestions(majority));
      setHistory(prev => [majority, ...prev].slice(0, 20));
      if (voiceEnabled) speak(majority);
    }
  }, [hands, isActive, voiceEnabled]);

  const handleCapture = useCallback(() => {
    if (!captureLabel.trim() || hands.length === 0) return;
    saveCustomGesture(captureLabel.trim(), hands);
    setCustomGestures(getCustomGestures());
    setCaptureLabel('');
    setCaptureMode(false);
  }, [captureLabel, hands]);

  const handleDeleteGesture = useCallback((id: string) => {
    deleteCustomGesture(id);
    setCustomGestures(getCustomGestures());
  }, []);

  const leftHand = hands.find(h => h.handedness === 'Left');
  const rightHand = hands.find(h => h.handedness === 'Right');

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        {/* Camera */}
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
                      <Hand className="w-12 h-12 text-muted-foreground/40" />
                      <p className="text-muted-foreground text-sm">Use both hands for phrase detection</p>
                    </>
                  )}
                </div>
              )}

              {modelLoading && isActive && (
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium text-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading model...
                </div>
              )}

              {/* Hand count badge */}
              {isActive && (
                <div className="absolute top-3 right-3 flex gap-2">
                  {leftHand && (
                    <span className="bg-primary/80 backdrop-blur-sm text-primary-foreground rounded-lg px-2.5 py-1 text-xs font-semibold fade-in">
                      🫲 Left
                    </span>
                  )}
                  {rightHand && (
                    <span className="bg-accent/80 backdrop-blur-sm text-accent-foreground rounded-lg px-2.5 py-1 text-xs font-semibold fade-in">
                      🫱 Right
                    </span>
                  )}
                </div>
              )}

              {/* Detected phrase overlay */}
              {isActive && detectedPhrase && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 gesture-pulse bg-primary/90 backdrop-blur-sm text-primary-foreground rounded-2xl px-8 py-4 text-center fade-in">
                  <p className="text-3xl font-black" style={{ fontFamily: 'var(--font-display)' }}>{detectedPhrase}</p>
                  <p className="text-xs opacity-80 mt-1">Confidence: {confidence}%</p>
                </div>
              )}
            </div>

            <div className="p-4 flex items-center gap-2 flex-wrap">
              <Button onClick={isActive ? stop : start} variant={isActive ? 'destructive' : 'default'} className="rounded-xl h-11 px-5 font-semibold">
                {isActive ? <><CameraOff className="w-4 h-4 mr-2" /> Stop</> : <><Camera className="w-4 h-4 mr-2" /> Start Camera</>}
              </Button>
              <Button variant={voiceEnabled ? 'secondary' : 'outline'} className="rounded-xl h-11" onClick={() => setVoiceEnabled(v => !v)}>
                {voiceEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
                {voiceEnabled ? 'Voice On' : 'Voice Off'}
              </Button>
              <Button
                variant={captureMode ? 'default' : 'outline'}
                className="rounded-xl h-11 ml-auto"
                onClick={() => setCaptureMode(c => !c)}
                disabled={!isActive}
              >
                <Plus className="w-4 h-4 mr-2" /> {captureMode ? 'Cancel Capture' : 'Capture Gesture'}
              </Button>
            </div>
          </div>

          {/* Capture Mode */}
          {captureMode && (
            <div className="bg-card rounded-2xl border-2 border-primary/30 p-4 slide-up space-y-3">
              <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> Capture New Gesture
              </h3>
              <p className="text-xs text-muted-foreground">
                Perform the gesture in front of the camera, enter a label, and click Save.
                {hands.length === 0 && ' (No hands detected — show your hands!)'}
              </p>
              <div className="flex items-center gap-2">
                <input
                  value={captureLabel}
                  onChange={e => setCaptureLabel(e.target.value)}
                  placeholder="Enter gesture label (e.g., 'Thank You')"
                  className="flex-1 h-10 rounded-xl bg-muted px-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-ring"
                />
                <Button
                  onClick={handleCapture}
                  disabled={!captureLabel.trim() || hands.length === 0}
                  className="rounded-xl h-10"
                >
                  <Save className="w-4 h-4 mr-2" /> Save
                </Button>
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>Hands detected: <strong className="text-foreground">{hands.length}</strong></span>
                {leftHand && <span className="text-primary">🫲 Left</span>}
                {rightHand && <span className="text-accent">🫱 Right</span>}
              </div>
            </div>
          )}

          {/* Custom Gestures List */}
          {customGestures.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Custom Gestures</h3>
              <div className="flex flex-wrap gap-2">
                {customGestures.map(g => (
                  <div key={g.id} className="flex items-center gap-1.5 bg-muted/50 rounded-xl px-3 py-1.5">
                    <span className="text-xs font-semibold text-foreground">{g.label}</span>
                    <button onClick={() => handleDeleteGesture(g.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Detection Output */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Phrase Detection</h3>
            <div className="text-center mb-4">
              <div className={`inline-flex items-center justify-center w-full min-h-[80px] rounded-2xl text-2xl font-black transition-all duration-300 ${
                detectedPhrase
                  ? 'bg-primary/15 text-primary gesture-pulse'
                  : 'bg-muted/50 text-muted-foreground/30'
              }`} style={{ fontFamily: 'var(--font-display)' }}>
                {detectedPhrase || 'Show a phrase sign'}
              </div>
              {detectedPhrase && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-accent/15 text-accent text-[10px] font-bold rounded-full uppercase">
                  Gesture Locked
                </span>
              )}
            </div>

            {confidence > 0 && (
              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Confidence</span>
                  <span className="font-bold text-foreground">{confidence}%</span>
                </div>
                <Progress value={confidence} className="h-2" />
              </div>
            )}

            {/* Hand status */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className={`text-center rounded-xl py-3 transition-colors ${
                leftHand ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground'
              }`}>
                <div className="text-lg mb-1">🫲</div>
                <div className="text-[10px] font-bold uppercase">{leftHand ? 'Left Detected' : 'No Left Hand'}</div>
              </div>
              <div className={`text-center rounded-xl py-3 transition-colors ${
                rightHand ? 'bg-accent/10 text-accent' : 'bg-muted/50 text-muted-foreground'
              }`}>
                <div className="text-lg mb-1">🫱</div>
                <div className="text-[10px] font-bold uppercase">{rightHand ? 'Right Detected' : 'No Right Hand'}</div>
              </div>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Related Phrases</span>
                <div className="flex flex-col gap-1.5">
                  {suggestions.map(s => (
                    <button key={s} onClick={() => { speak(s); }}
                      className="text-left bg-primary/10 text-primary border border-primary/20 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-primary/20 transition-colors active:scale-[0.98]">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* History */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">History</h3>
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No phrases detected yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {history.map((h, i) => (
                  <div key={i} className="bg-primary/10 text-primary rounded-xl px-3 py-1.5 text-xs font-bold fade-in">
                    {h}
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
