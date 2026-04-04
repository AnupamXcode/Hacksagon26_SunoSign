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
    <div className="space-y-4 lg:space-y-6">
      <div className="grid lg:grid-cols-[1fr_360px] gap-4 lg:gap-6">
        <div className="space-y-4 lg:space-y-6">
          <div className="glass-card rounded-2xl lg:rounded-3xl border overflow-hidden group card-hover">
            <div className="relative aspect-video bg-gradient-to-br from-primary/8 via-background to-secondary/8 backdrop-blur-sm">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted style={{ transform: 'scaleX(-1)' }} />
              <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: 'scaleX(-1)' }} />
              {!isActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 sm:gap-4 backdrop-blur-sm">
                  {camError ? (
                    <div className="text-center px-4 sm:px-6">
                      <CameraOff className="w-12 h-12 sm:w-14 sm:h-14 text-destructive mx-auto mb-3" />
                      <p className="text-destructive font-bold text-sm sm:text-base">{camError}</p>
                    </div>
                  ) : (
                    <>
                      <Hand className="w-12 h-12 sm:w-14 sm:h-14 text-muted-foreground/40 animate-float" />
                      <p className="text-muted-foreground font-medium text-sm sm:text-base">Use both hands for phrases</p>
                    </>
                  )}
                </div>
              )}
              {modelLoading && isActive && (
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-2 glass-card backdrop-blur-sm rounded-lg sm:rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-foreground fade-in">
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> Loading...
                </div>
              )}
              {isActive && detectedPhrase && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-card text-foreground rounded-lg sm:rounded-2xl px-4 sm:px-8 py-3 sm:py-4 text-center fade-in border border-primary/30 shadow-glow-lg">
                  <p className="text-2xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{detectedPhrase}</p>
                  <p className="text-xs sm:text-sm opacity-80 mt-1 text-muted-foreground font-medium">Accuracy: {confidence}%</p>
                </div>
              )}
            </div>
            <div className="p-3 sm:p-4 lg:p-5 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 flex-wrap">
              <Button onClick={isActive ? stop : start} className={`w-full sm:w-auto rounded-lg sm:rounded-xl h-10 sm:h-12 px-4 sm:px-6 font-bold text-sm sm:text-base transition-all duration-300 hover-scale ${
                isActive 
                  ? 'bg-gradient-to-r from-destructive to-red-600 text-white shadow-glow-lg' 
                  : 'bg-gradient-to-r from-primary to-secondary text-white shadow-glow-lg'
              }`}>
                {isActive ? <><CameraOff className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Stop</> : <><Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Start</>}
              </Button>
              <Button
                variant={captureMode ? 'default' : 'outline'}
                className="rounded-lg sm:rounded-xl h-10 sm:h-12 px-3 sm:px-5 text-xs sm:text-sm glass-card border-white/20 hover:border-primary/50 ml-auto sm:ml-0"
                onClick={() => setCaptureMode(c => !c)}
                disabled={!isActive}
              >
                <Plus className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Capture</span>
              </Button>
            </div>
          </div>
          {captureMode && (
            <div className="glass-card rounded-2xl lg:rounded-3xl border-2 border-primary/30 p-4 sm:p-6 slide-up space-y-3 animate-scale-in">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                <input
                  value={captureLabel}
                  onChange={e => setCaptureLabel(e.target.value)}
                  placeholder="Enter gesture name"
                  className="flex-1 h-10 sm:h-11 rounded-lg sm:rounded-xl bg-muted/50 px-3 sm:px-4 text-xs sm:text-sm text-foreground outline-none border border-white/10 focus:border-primary/50 transition-colors"
                />
                <Button onClick={handleCapture} disabled={!captureLabel.trim() || hands.length === 0} className="w-full sm:w-auto rounded-lg sm:rounded-xl h-10 sm:h-11 px-4 sm:px-5 bg-gradient-to-r from-primary to-secondary text-white hover-scale">
                  <Save className="w-4 h-4 mr-1 sm:mr-2" /> Save
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block space-y-4 lg:space-y-6 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto">
          {/* Detected Phrase */}
          <div className="glass-card rounded-2xl lg:rounded-3xl border p-4 lg:p-6 sticky top-0 group card-hover">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Detected</h3>
            <div className="text-center mb-4">
              <div className={`inline-flex items-center justify-center w-full min-h-[80px] lg:min-h-[100px] rounded-2xl lg:rounded-3xl text-2xl lg:text-4xl font-black transition-all duration-300 ${
                detectedPhrase ? 'bg-gradient-to-br from-primary/30 to-secondary/30 text-primary shadow-glow' : 'bg-muted/30 text-muted-foreground/30'
              }`}>
                {detectedPhrase || '—'}
              </div>
            </div>
            {confidence > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-semibold">Accuracy</span>
                  <span className="text-primary font-bold">{confidence}%</span>
                </div>
                <Progress value={confidence} className="h-2 rounded-full" />
              </div>
            )}
          </div>

          {/* History */}
          <div className="glass-card rounded-2xl lg:rounded-3xl border p-4 lg:p-6">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Detection History</h3>
            <div className="flex flex-wrap gap-2">
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center w-full py-4">No detections yet...</p>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="bg-gradient-to-r from-primary/20 to-secondary/20 text-primary rounded-lg lg:rounded-xl px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-bold fade-in border border-primary/30 hover:border-primary/60 transition-all duration-300">
                    {h}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Custom Gestures */}
          {customGestures.length > 0 && (
            <div className="glass-card rounded-2xl lg:rounded-3xl border p-4 lg:p-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Custom Gestures</h3>
              <div className="space-y-2">
                {customGestures.map(gesture => (
                  <div key={gesture.id} className="flex items-center justify-between bg-muted/30 border border-muted/50 rounded-lg p-2 hover:border-primary/50 transition-colors">
                    <p className="text-xs font-medium text-foreground truncate">{gesture.label}</p>
                    <button
                      onClick={() => handleDeleteGesture(gesture.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
