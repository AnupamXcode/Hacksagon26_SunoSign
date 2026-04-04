import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, CameraOff, Volume2, VolumeX, Loader2, Plus, Trash2, Hand, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCamera } from '@/hooks/useCamera';
import { useHandDetection } from '@/hooks/useHandDetection';
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
  const canvasRef = useRef(null);
  const { hands, loading: modelLoading } = useHandDetection(videoRef, canvasRef, isActive, 2);

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [captureMode, setCaptureMode] = useState(false);
  const [captureLabel, setCaptureLabel] = useState('');
  const [customGestures, setCustomGestures] = useState(getCustomGestures());
  const [detectedPhrase, setDetectedPhrase] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]);

  const bufferRef = useRef([]);
  const lastPhraseRef = useRef('');
  const lastTimeRef = useRef(0);

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

    const counts = {};
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

    lastPhraseRef.current = majority;
    lastTimeRef.current = now;
    setDetectedPhrase(majority);
    setConfidence(result.confidence);
    setSuggestions(getPhraseSuggestions(majority));
    setHistory(prev => [majority, ...prev].slice(0, 20));
    if (voiceEnabled) speak(majority);
  }, [hands, isActive, voiceEnabled]);

  const handleCapture = useCallback(() => {
    if (!captureLabel.trim() || hands.length === 0) return;
    saveCustomGesture(captureLabel.trim(), hands);
    setCustomGestures(getCustomGestures());
    setCaptureLabel('');
    setCaptureMode(false);
  }, [captureLabel, hands]);

  const handleDeleteGesture = useCallback((id) => {
    deleteCustomGesture(id);
    setCustomGestures(getCustomGestures());
  }, []);

  const leftHand = hands.find(h => h.handedness === 'Left');
  const rightHand = hands.find(h => h.handedness === 'Right');

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
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
              {isActive && detectedPhrase && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 gesture-pulse bg-primary/90 backdrop-blur-sm text-primary-foreground rounded-2xl px-8 py-4 text-center fade-in">
                  <p className="text-3xl font-black">{detectedPhrase}</p>
                  <p className="text-xs opacity-80 mt-1">Confidence: {confidence}%</p>
                </div>
              )}
            </div>
            <div className="p-4 flex items-center gap-2 flex-wrap">
              <Button onClick={isActive ? stop : start} variant={isActive ? 'destructive' : 'default'} className="rounded-xl h-11 px-5 font-semibold">
                {isActive ? <><CameraOff className="w-4 h-4 mr-2" /> Stop</> : <><Camera className="w-4 h-4 mr-2" /> Start Camera</>}
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
          {captureMode && (
            <div className="bg-card rounded-2xl border-2 border-primary/30 p-4 slide-up space-y-3">
              <div className="flex items-center gap-2">
                <input
                  value={captureLabel}
                  onChange={e => setCaptureLabel(e.target.value)}
                  placeholder="Enter gesture label"
                  className="flex-1 h-10 rounded-xl bg-muted px-4 text-sm text-foreground outline-none"
                />
                <Button onClick={handleCapture} disabled={!captureLabel.trim() || hands.length === 0} className="rounded-xl h-10">
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Detected Phrase</h3>
            <div className="text-center mb-4">
              <div className={`inline-flex items-center justify-center w-full min-h-[80px] rounded-2xl text-2xl font-black transition-all duration-300 ${
                detectedPhrase ? 'bg-primary/15 text-primary gesture-pulse' : 'bg-muted/50 text-muted-foreground/30'
              }`}>
                {detectedPhrase || 'Show a phrase sign'}
              </div>
            </div>
            {confidence > 0 && <Progress value={confidence} className="h-2" />}
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">History</h3>
            <div className="flex flex-wrap gap-2">
              {history.map((h, i) => (
                <div key={i} className="bg-primary/10 text-primary rounded-xl px-3 py-1.5 text-xs font-bold fade-in">
                  {h}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
