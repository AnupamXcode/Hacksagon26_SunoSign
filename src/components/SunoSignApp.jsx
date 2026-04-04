// SunoSign AI — Main Application Component
import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, CameraOff, User, Hand, Volume2, VolumeX, Loader2, Hash, MessageSquare, Sparkles, Delete, RotateCcw, Moon, Sun } from 'lucide-react';
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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check system preference or localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });
  const { videoRef, isActive, error: camError, start, stop } = useCamera();
  const canvasRef = useRef(null);
  const { gesture: rawGesture, loading: modelLoading, hands } = useHandDetection(videoRef, canvasRef, isActive, mode === 'phrases' ? 2 : 1);
  const { profile, save: saveProfile } = useProfile();
  const [profileOpen, setProfileOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [emergency, setEmergency] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Theme toggle
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

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

      <header className="px-4 sm:px-6 py-4 flex items-center justify-between glass-card sticky top-0 z-50 border-b">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center hover-scale soft-glow">
            <Hand className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold gradient-text leading-tight" style={{ fontFamily: 'var(--font-display)' }}>SunoSign AI</h1>
            <p className="text-xs text-muted-foreground font-medium">
              {context === 'retailer' ? `🏪 ${DOMAINS_MAP[domain]}` : mode === 'alphabet' ? '🔤 A–Z Detection' : mode === 'numbers' ? '🔢 1–9 Detection' : '💬 Phrase Detection'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Separate Toggle Buttons for Each Mode */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('alphabet')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 smooth-transition flex items-center gap-2 ${
                mode === 'alphabet'
                  ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-glow-lg scale-105'
                  : 'glass-card border border-white/10 text-muted-foreground hover:text-foreground hover:border-primary/50'
              }`}
              title="A-Z Gesture Detection"
            >
              <Hand className="w-4 h-4" />
              <span className="hidden sm:inline">A–Z</span>
            </button>

            <button
              onClick={() => setMode('numbers')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 smooth-transition flex items-center gap-2 ${
                mode === 'numbers'
                  ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-glow-lg scale-105'
                  : 'glass-card border border-white/10 text-muted-foreground hover:text-foreground hover:border-primary/50'
              }`}
              title="Number Detection (1-9)"
            >
              <Hash className="w-4 h-4" />
              <span className="hidden sm:inline">1–9</span>
            </button>

            <button
              onClick={() => setMode('phrases')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 smooth-transition flex items-center gap-2 ${
                mode === 'phrases'
                  ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-glow-lg scale-105'
                  : 'glass-card border border-white/10 text-muted-foreground hover:text-foreground hover:border-primary/50'
              }`}
              title="Two-Hand Phrase Detection"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Phrases</span>
            </button>
          </div>

          <div className="hidden md:block h-6 w-px bg-border/30" />
          <ContextSelector context={context} domain={domain} onContextChange={setContext} onDomainChange={setDomain} />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 smooth-transition hover-scale ${voiceEnabled ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-glow' : 'bg-muted/40 text-muted-foreground border border-white/10'}`}
            title={voiceEnabled ? 'Mute' : 'Unmute'}>
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 smooth-transition hover-scale ${isDarkMode ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-glow' : 'bg-gradient-to-br from-yellow-400 to-orange-400 text-black shadow-glow'}`}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <button onClick={() => setProfileOpen(true)}
            className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center hover:bg-muted/60 transition-all duration-300 smooth-transition hover-scale border border-white/10">
            <User className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {mode === 'numbers' ? (
          <NumberDetection />
        ) : mode === 'phrases' ? (
          <PhraseDetection />
        ) : (
          <div className="grid lg:grid-cols-[1fr_380px] gap-6">
            <div className="space-y-6">
              {/* Camera Feed Card */}
              <div className="glass-card rounded-3xl border overflow-hidden">
                <div className="relative aspect-video bg-gradient-to-br from-primary/5 via-background to-secondary/5 backdrop-blur-sm">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted style={{ transform: 'scaleX(-1)' }} />
                  <canvas ref={canvasRef} width={640} height={480}
                    className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: 'scaleX(-1)' }} />
                  {!isActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                      {camError ? (
                        <div className="text-center px-6 fade-in">
                          <CameraOff className="w-16 h-16 text-destructive mx-auto mb-4 animate-pulse" />
                          <p className="text-destructive font-bold text-base">{camError}</p>
                        </div>
                      ) : (
                        <>
                          <Camera className="w-16 h-16 text-primary/30 animate-fade-in" />
                          <p className="text-muted-foreground font-medium">Start camera to begin detection</p>
                        </>
                      )}
                    </div>
                  )}
                  {modelLoading && isActive && (
                    <div className="absolute top-4 left-4 flex items-center gap-3 glass-card px-4 py-2.5 rounded-xl fade-in">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-xs font-semibold text-foreground">Loading AI Model...</span>
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute top-4 right-4 flex gap-3">
                       {hands && hands.length > 0 && (
                        <span className="animate-scale-in glass-card text-accent-foreground rounded-xl px-3.5 py-2 text-xs font-bold backdrop-blur-xl">
                          ✋ {hands.length} Hand{hands.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {gesture.gesture !== 'NONE' && (
                        <div className="animate-scale-in glass-card text-primary-foreground rounded-xl px-4 py-2.5 fade-in backdrop-blur-xl border border-primary/30">
                          <p className="text-sm font-bold">{gesture.label}</p>
                          <p className="text-xs opacity-80">Confidence: {gesture.confidence}%</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-5 flex items-center gap-3">
                  <Button onClick={isActive ? stop : start} className={`rounded-xl h-12 px-6 font-bold text-base transition-all duration-300 hover-scale ${
                    isActive 
                      ? 'bg-gradient-to-r from-destructive to-red-600 text-white shadow-glow-lg' 
                      : 'bg-gradient-to-r from-primary to-secondary text-white shadow-glow-lg'
                  }`}>
                    {isActive ? <><CameraOff className="w-5 h-5 mr-2" /> Stop Camera</> : <><Camera className="w-5 h-5 mr-2" /> Start Camera</>}
                  </Button>
                  <div className="text-xs text-muted-foreground ml-auto font-medium">
                    {isActive ? '🟢 Live' : '⚪ Ready'}
                  </div>
                </div>
              </div>
              {/* Detected Letter & Suggestions */}
              {stableLetter && (
                <div className="glass-card rounded-3xl p-6 border space-y-5 animate-scale-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Detected Letter</p>
                      <p className="text-6xl font-black gradient-text">{stableLetter}</p>
                    </div>
                    <Button size="lg" onClick={() => addLetterToWord(stableLetter)} className="rounded-2xl bg-gradient-to-r from-primary to-secondary text-white hover-scale shadow-glow-lg">
                      <Sparkles className="w-5 h-5 mr-2" /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground font-semibold">Confidence</span>
                      <span className="text-sm font-bold text-primary">{stableConfidence}%</span>
                    </div>
                    <Progress value={stableConfidence} className="h-2 rounded-full" />
                  </div>
                </div>
              )}

              {/* Suggestions based on context and domain */}
              {stableLetter && (context === 'retailer' ? domainPhrases.length > 0 : domainWords.length > 0) && (
                <div className="glass-card rounded-3xl p-6 border space-y-4 animate-slide-down">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">💡 Smart Suggestions</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(context === 'retailer' ? domainPhrases : domainWords).slice(0, 4).map((word, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentWord(word);
                            addMessage('user', `Selected: ${word}`);
                          }}
                          className="group glass-card rounded-2xl p-3 border border-primary/20 hover:border-primary/50 text-center transition-all duration-300 hover-scale hover:shadow-glow"
                        >
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{word}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Word Builder */}
              <div className="glass-card rounded-3xl p-6 border space-y-4">
                <div className="space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Built Word</p>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition duration-300" />
                    <div className="relative flex items-center min-h-[56px] bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl px-4 py-3 border border-primary/20">
                      <span className="text-2xl font-bold tracking-wider text-foreground">
                        {currentWord || <span className="text-sm font-normal text-muted-foreground tracking-normal">Make hand gestures...</span>}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" onClick={deleteLastLetter} disabled={!currentWord} className="rounded-xl h-10 gap-1.5 glass-card border hover:border-destructive/50 hover:text-destructive">
                    <Delete className="w-4 h-4" /> Delete
                  </Button>
                  <Button size="sm" onClick={addSpace} disabled={!currentWord} className="rounded-xl h-10 glass-card border hover:border-primary/50">
                    ⎵ Space
                  </Button>
                  <Button size="sm" onClick={speakAll} disabled={!currentWord && completedWords.length === 0} className="rounded-xl h-10 gap-1.5 ml-auto bg-gradient-to-r from-primary to-secondary text-white hover-scale shadow-glow">
                    <Volume2 className="w-4 h-4" /> Speak
                  </Button>
                  <Button size="sm" onClick={clearAll} className="rounded-xl h-10 glass-card border hover:border-primary/50">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Completed Words History */}
              {completedWords.length > 0 && (
                <div className="glass-card rounded-3xl p-6 border space-y-3 animate-scale-in">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Message</p>
                  <div className="flex flex-wrap gap-2">
                    {completedWords.map((word, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 text-sm font-semibold text-foreground hover:border-primary/60 transition-all duration-300">
                        {word}
                        <button onClick={() => setCompletedWords(completedWords.filter((_, i) => i !== idx))} className="hover:text-destructive">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar - Chat */}
            <div className="lg:h-[calc(100vh-120px)] lg:sticky lg:top-[80px] h-[400px]">
              <ChatPanel messages={messages} />
            </div>
          </div>
        )}
      </main>

      <footer className="px-6 py-4 border-t border-border/50 text-center glass-card mt-auto">
        <p className="text-xs text-muted-foreground font-semibold tracking-wide">
          {mode === 'phrases' ? '📹 Phrase Detection • Real-time Gesture Recognition' : '🔤 Sign Letters • Build Words & Communicate'}
        </p>
      </footer>
    </div>
  );
}
