// SunoSign AI — Main Application Component
import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, CameraOff, User, Hand, Volume2, VolumeX, Loader2, Hash, MessageSquare, Sparkles, Delete, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCamera } from '@/hooks/useCamera';
import { useHandDetection } from '@/hooks/useHandDetection';
import { speak, speakEmergency, stopEmergency } from '@/lib/tts';
import { classifyGesture } from '@/lib/gestureEngine';
import { ProfileModal } from '@/components/ProfileModal';
import { ChatPanel } from '@/components/ChatPanel';
import { EmergencyOverlay } from '@/components/EmergencyOverlay';
import { ContextSelector } from '@/components/ContextSelector';
import { NumberDetection } from '@/components/NumberDetection';
import { PhraseDetection } from '@/components/PhraseDetection';
import { getDomainWords, getDomainPhrases, wordToSentence, isEmergencyWord } from '@/lib/domainData';
import { useProfile } from '@/hooks/useProfile';

const STABILITY_FRAMES = 7;
const COOLDOWN_MS = 2000;
const FINGER_NAMES = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];

const DOMAINS_MAP = {
  general: 'General',
  medical: 'Medical Store',
  grocery: 'Grocery Store',
  banking: 'Bank',
  transport: 'Transport',
};

export default function SunoSignApp() {
  const [mode, setMode] = useState('alphabet');
  const [context, setContext] = useState('user');
  const [domain, setDomain] = useState('general');
  const { videoRef, isActive, error: camError, start, stop } = useCamera();
  const canvasRef = useRef(null);
  const { gesture: rawGesture, loading: modelLoading, hands } = useHandDetection(videoRef, canvasRef, isActive, mode === 'phrases' ? 2 : 1);
  const { profile, save: saveProfile } = useProfile();
  const [profileOpen, setProfileOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [emergency, setEmergency] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Re-classify
  const [gesture, setGesture] = useState({ gesture: 'NONE', confidence: 0, label: 'No gesture', isAlphabet: false });

  useEffect(() => {
    if (mode === 'alphabet' && hands.length > 0 && hands[0].landmarks) {
      const result = classifyGesture(hands[0].landmarks);
      setGesture(result);
    } else if (mode === 'alphabet') {
      setGesture({ gesture: 'NONE', confidence: 0, label: 'No gesture', isAlphabet: false });
    }
  }, [hands, mode]);

  // Stability state
  const bufferRef = useRef([]);
  const lastConfirmedRef = useRef('NONE');
  const lastConfirmTimeRef = useRef(0);
  const [stableLetter, setStableLetter] = useState(null);
  const [stableConfidence, setStableConfidence] = useState(0);
  const [stableFingerStates, setStableFingerStates] = useState();

  // Word builder state
  const [currentWord, setCurrentWord] = useState('');
  const [completedWords, setCompletedWords] = useState([]);
  const [lastAddedLetter, setLastAddedLetter] = useState(null);

  const addMessage = useCallback((type, text) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), type, text, timestamp: new Date() }]);
  }, []);

  const handleSpeak = useCallback((text) => {
    if (voiceEnabled) speak(text);
    addMessage('system', text);
  }, [addMessage, voiceEnabled]);

  // Stability logic (Majority-voting)
  useEffect(() => {
    if (!isActive || mode !== 'alphabet') return;

    const buffer = bufferRef.current;
    buffer.push(gesture.gesture);
    if (buffer.length > STABILITY_FRAMES) buffer.shift();
    if (buffer.length < STABILITY_FRAMES) return;

    const counts = {};
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
    if (majorityGesture === lastConfirmedRef.current && (now - lastConfirmTimeRef.current < COOLDOWN_MS)) return;

    lastConfirmedRef.current = majorityGesture;
    lastConfirmTimeRef.current = now;

    if (gesture.isAlphabet) {
      setStableLetter(majorityGesture);
      setStableConfidence(gesture.confidence);
      setStableFingerStates(gesture.fingerStates);
      addMessage('user', `Letter: ${majorityGesture}`);
    } else if (majorityGesture === 'OPEN_PALM') {
      if (voiceEnabled) speak('Please stop');
      addMessage('user', 'Gesture: STOP');
      addMessage('system', 'Please stop');
      setStableLetter(null);
    } else if (majorityGesture === 'THUMBS_UP') {
      if (voiceEnabled) speak('Yes');
      addMessage('user', 'Gesture: YES');
      setStableLetter(null);
    } else if (majorityGesture === 'FIST') {
      if (voiceEnabled) speak('No');
      addMessage('user', 'Gesture: NO');
      setStableLetter(null);
    }
  }, [gesture, isActive, addMessage, voiceEnabled, mode]);

  useEffect(() => {
    if (!isActive) {
      bufferRef.current = [];
      lastConfirmedRef.current = 'NONE';
      setStableLetter(null);
    }
  }, [isActive]);

  useEffect(() => {
    bufferRef.current = [];
    lastConfirmedRef.current = 'NONE';
    setStableLetter(null);
    setCurrentWord('');
    setCompletedWords([]);
  }, [mode]);

  const handleEmergency = useCallback(() => {
    setEmergency(true);
    speakEmergency('I need help! Emergency!');
  }, []);

  const dismissEmergency = () => {
    setEmergency(false);
    stopEmergency();
  };

  const addLetterToWord = useCallback((letter) => {
    if (letter === lastAddedLetter) return;
    setCurrentWord(prev => prev + letter);
    setLastAddedLetter(letter);
  }, [lastAddedLetter]);

  useEffect(() => {
    if (stableLetter === null) setLastAddedLetter(null);
  }, [stableLetter]);

  const deleteLastLetter = () => { setCurrentWord(prev => prev.slice(0, -1)); setLastAddedLetter(null); };
  const addSpace = () => {
    if (currentWord) {
      setCompletedWords(prev => [...prev, currentWord]);
      if (isEmergencyWord(currentWord)) handleEmergency();
      setCurrentWord('');
      setLastAddedLetter(null);
    }
  };

  const speakAll = () => {
    const allWords = [...completedWords];
    if (currentWord) allWords.push(currentWord);
    if (allWords.length === 0) return;
    const fullText = allWords.map(w => wordToSentence(w)).join('. ');
    if (voiceEnabled) speak(fullText);
    addMessage('user', allWords.join(' '));
    addMessage('system', fullText);
  };

  const clearAll = () => {
    setCurrentWord('');
    setCompletedWords([]);
    setLastAddedLetter(null);
  };

  const domainWords = stableLetter ? getDomainWords(stableLetter, domain) : [];
  const domainPhrases = stableLetter ? getDomainPhrases(stableLetter, domain) : [];
  const fullSentence = [...completedWords, currentWord].filter(Boolean).map(w => wordToSentence(w)).join('. ');

  const modes = [
    { key: 'alphabet', label: 'A–Z', icon: <Hand className="w-3.5 h-3.5" /> },
    { key: 'numbers', label: '1–9', icon: <Hash className="w-3.5 h-3.5" /> },
    { key: 'phrases', label: 'Phrases', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {emergency && <EmergencyOverlay onDismiss={dismissEmergency} />}
      <ProfileModal profile={profile} onSave={saveProfile} open={profileOpen} onClose={() => setProfileOpen(false)} />

      <header className="px-4 sm:px-6 py-3 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Hand className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-foreground leading-tight" style={{ fontFamily: 'var(--font-display)' }}>SunoSign AI</h1>
            <p className="text-[10px] text-muted-foreground">
              {context === 'retailer' ? `${DOMAINS_MAP[domain]} Mode` : mode === 'alphabet' ? 'A–Z Detection' : mode === 'numbers' ? '1–9 Detection' : 'Phrase Detection'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-2xl p-1 gap-0.5">
            {modes.map(m => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all duration-200 ${
                  mode === m.key
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
              >
                {m.icon}
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))}
          </div>
          <ContextSelector context={context} domain={domain} onContextChange={setContext} onDomainChange={setDomain} />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${voiceEnabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button onClick={() => setProfileOpen(true)}
            className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <User className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {mode === 'numbers' ? (
          <NumberDetection />
        ) : mode === 'phrases' ? (
          <PhraseDetection />
        ) : (
          <div className="grid lg:grid-cols-[1fr_380px] gap-5">
            <div className="space-y-4">
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
                      <Loader2 className="w-3 h-3 animate-spin" /> Loading model...
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute top-3 right-3 flex gap-2">
                       {hands && hands.length > 0 && (
                        <span className="bg-accent/80 backdrop-blur-sm text-accent-foreground rounded-lg px-2.5 py-1 text-xs font-semibold fade-in">
                          ✋ {hands.length} hand{hands.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {gesture.gesture !== 'NONE' && (
                        <div className="bg-primary/90 backdrop-blur-sm text-primary-foreground rounded-lg px-3 py-1 fade-in">
                          <p className="text-sm font-bold">{gesture.label}</p>
                          <p className="text-[9px] opacity-80">{gesture.confidence}%</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-4 flex items-center justify-between">
                  <Button onClick={isActive ? stop : start} variant={isActive ? 'destructive' : 'default'} className="rounded-xl h-11 px-6 font-semibold">
                    {isActive ? <><CameraOff className="w-4 h-4 mr-2" /> Stop Camera</> : <><Camera className="w-4 h-4 mr-2" /> Start Camera</>}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {stableLetter && (
                  <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="px-4 py-3 bg-primary/10 border-b border-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-primary uppercase tracking-wider">Detected Letter</span>
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-bold text-primary">{stableLetter}</span>
                          <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={() => addLetterToWord(stableLetter)}>
                            + Add
                          </Button>
                        </div>
                      </div>
                      <Progress value={stableConfidence} className="h-1.5" />
                    </div>
                  </div>
                )}

                <div className="bg-card rounded-2xl border border-border overflow-hidden p-4 space-y-3">
                  <div className="flex items-center gap-2 min-h-[48px] bg-muted/50 rounded-xl px-4 py-2">
                    <span className="text-lg font-bold tracking-[0.2em] text-foreground">
                      {currentWord || <span className="text-muted-foreground text-sm font-normal tracking-normal">Sign letters to build words...</span>}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button size="sm" variant="outline" className="rounded-xl h-9 gap-1.5" onClick={deleteLastLetter} disabled={!currentWord}>
                      <Delete className="w-3.5 h-3.5" /> Delete
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl h-9 gap-1.5" onClick={addSpace} disabled={!currentWord}>
                      Space
                    </Button>
                    <Button size="sm" variant="default" className="rounded-xl h-9 gap-1.5 ml-auto" onClick={speakAll} disabled={!currentWord && completedWords.length === 0}>
                      <Volume2 className="w-3.5 h-3.5" /> Speak
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-xl h-9 gap-1.5" onClick={clearAll}>
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:h-[calc(100vh-120px)] lg:sticky lg:top-[72px] h-[400px]">
              <ChatPanel messages={messages} />
            </div>
          </div>
        )}
      </main>

      <footer className="px-4 py-3 border-t border-border text-center">
        <p className="text-[11px] text-muted-foreground">
          {mode === 'phrases' ? 'Phrase detection active' : 'Sign letters to build words'}
        </p>
      </footer>
    </div>
  );
}
