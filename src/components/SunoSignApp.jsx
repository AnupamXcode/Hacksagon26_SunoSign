// SunoSign AI — Main Application Component
import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CameraOff, User, Hand, Volume2, VolumeX, Loader2, Hash, MessageSquare, Sparkles, Delete, RotateCcw, Moon, Sun, AlertCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useCamera } from '@/hooks/useCamera';
import { useHandDetection } from '@/hooks/useHandDetection';
import { speak, speakEmergency, stopEmergency } from '@/lib/tts';
import ProfileModal from '@/components/ProfileModal';
import { ChatPanel } from '@/components/ChatPanel';
import { EmergencyOverlay } from '@/components/EmergencyOverlay';
import { ContextSelector } from '@/components/ContextSelector';
import { NumberDetection } from '@/components/NumberDetection';
import { PhraseDetection } from '@/components/PhraseDetection';
import { getDomainWords, getDomainPhrases, wordToSentence, isEmergencyWord } from '@/lib/domainData';
import { useProfile } from '@/hooks/useProfile';
import {
  createDualDetectionState,
  detectFast,
  detectStable,
  decideHybrid,
  confirmGesture,
  shouldOutputWithAdaptiveDebounce,
  fallbackToStable,
  resolveConflict
} from '@/lib/dualDetectionEngine';
import {
  detectDeviceType,
  detectOrientation,
  getDeviceCapabilities,
  getTouchFriendlyDimensions
} from '@/lib/deviceDetection';
import { classifyGestureByContext } from '@/lib/contextAwareGesture';

const STABILITY_FRAMES = 5;
const COOLDOWN_MS = 1000;
const FINGER_NAMES = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];

// ========== DUAL DETECTION CONFIG ==========
const MAX_LANDMARK_FRAMES = 5;        // 5-frame smoothing
const CONFIDENCE_THRESHOLD = 5;       // Only update if >5% confidence change
const FAST_CONFIDENCE_MIN = 80;       // Allow 80% for fast path
const STABLE_CONFIDENCE_MIN = 85;     // Require 85% for stable path
const ADAPTIVE_DEBOUNCE_MIN = 300;    // 300ms minimum debounce
const ADAPTIVE_DEBOUNCE_MAX = 400;    // 400ms maximum debounce

const DOMAINS_MAP = {
  general: 'General',
  medical: 'Medical Store',
  grocery: 'Grocery Store',
  banking: 'Bank',
  transport: 'Transport',
};

export default function SunoSignApp() {
  const navigate = useNavigate();
  const { logout } = useAuth();
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
  const { videoRef, isActive, error: camError, start, stop, retry, device: cameraDevice, orientation: cameraOrientation, capabilities } = useCamera();
  const canvasRef = useRef(null);
  const { gesture: rawGesture, loading: modelLoading, hands, fps, latency, isMotionDetected, adaptiveFPS, device: detectionDevice, skippedFrames } = useHandDetection(videoRef, canvasRef, isActive, mode === 'phrases' ? 2 : 1, context);
  const { profile, save: saveProfile } = useProfile();
  const [profileOpen, setProfileOpen] = useState(false);

  // ========== DEVICE INFO & RESPONSIVE STATE ==========
  const [deviceType, setDeviceType] = useState(detectDeviceType());
  const [orientation, setOrientation] = useState(detectOrientation());
  const touchFriendlyDims = getTouchFriendlyDimensions();
  
  // Update device info on resize/orientation change
  useEffect(() => {
    const handleChange = () => {
      setDeviceType(detectDeviceType());
      setOrientation(detectOrientation());
    };
    
    window.addEventListener('resize', handleChange);
    window.addEventListener('orientationchange', handleChange);
    
    return () => {
      window.removeEventListener('resize', handleChange);
      window.removeEventListener('orientationchange', handleChange);
    };
  }, []);

  // ========== DUAL DETECTION STATE ==========
  const dualDetectionStateRef = useRef(createDualDetectionState());
  
  // ========== ADAPTIVE DEBOUNCE & OUTPUT CONTROL ==========
  const lastOutputGestureRef = useRef('NONE');
  const lastOutputTimeRef = useRef(0);
  const outputModeRef = useRef('stable');

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  // ========== DUAL DETECTION PROCESSING W/ DEVICE INFO ==========
  const processDualDetection = useCallback((gestureResult, contextValue, domainValue) => {
    if (!gestureResult || gestureResult.gesture === 'NONE') {
      return null;
    }
    
    const state = dualDetectionStateRef.current;
    
    // Run both detection paths in parallel
    const fastResult = detectFast(gestureResult, state);
    const stableResult = detectStable(gestureResult, state);
    
    // Hybrid decision: combine both paths
    const hybridResult = decideHybrid(fastResult, stableResult, state);
    
    if (!hybridResult) {
      return null;
    }
    
    // Check adaptive debounce: new gesture = immediate, same = 300-400ms
    const shouldOutput = shouldOutputWithAdaptiveDebounce(
      hybridResult,
      lastOutputGestureRef.current,
      lastOutputTimeRef.current,
      state
    );
    
    if (!shouldOutput) {
      return null;
    }
    
    // Update output tracking
    lastOutputGestureRef.current = hybridResult.gesture;
    lastOutputTimeRef.current = Date.now();
    outputModeRef.current = hybridResult.mode;
    
    // Format standardized output with device info
    return {
      // Device and orientation
      device: deviceType,
      orientation: orientation,
      
      // Gesture data
      gesture_detected: hybridResult.gesture,
      confidence: hybridResult.confidence,
      mode: hybridResult.mode,
      context: contextValue || null,
      domain: domainValue || null,
      output_phrase: hybridResult.label,
      
      // Performance metrics
      latency_ms: Math.round(latency || 0),
      fps: Math.round(fps || 0),
      isMotionDetected: isMotionDetected,
      adaptiveFPS: adaptiveFPS?.min + '-' + adaptiveFPS?.max,
      
      // Mobile metrics
      skippedFrames: skippedFrames || 0
    };
  }, [latency, fps, isMotionDetected, adaptiveFPS, skippedFrames, deviceType, orientation]);

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
      // Classify gesture using context-aware engine (user or retailer mode)
      const result = classifyGestureByContext(hands[0].landmarks, context);
      
      // Process through dual detection pipeline
      const output = processDualDetection(result, context, domain);
      
      setGesture(result);
    } else if (mode === 'alphabet') {
      setGesture({ gesture: 'NONE', confidence: 0, label: 'No gesture', isAlphabet: false });
    }
  }, [hands, mode, processDualDetection, context, domain]);

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
      dualDetectionStateRef.current = createDualDetectionState();
      setStableLetter(null);
    }
  }, [isActive]);

  useEffect(() => {
    bufferRef.current = [];
    lastConfirmedRef.current = 'NONE';
    dualDetectionStateRef.current = createDualDetectionState();
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
      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} onLogout={handleLogout} />

      <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between glass-card sticky top-0 z-50 border-b backdrop-blur-xl smooth-transition">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center hover-scale">
              <Hand className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
          </div>
          <div className="hidden sm:block truncate">
            <h1 className="text-lg sm:text-xl font-bold gradient-text leading-tight" style={{ fontFamily: 'var(--font-display)' }}>SunoSign AI</h1>
            <p className="text-xs text-muted-foreground font-medium truncate">
              {context === 'retailer' ? `🏪 ${DOMAINS_MAP[domain]}` : mode === 'alphabet' ? '🔤 A–Z Detection' : mode === 'numbers' ? '🔢 1–9 Detection' : '💬 Phrase Detection'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          {/* Mode Buttons */}
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={() => setMode('alphabet')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-1.5 hover-scale ${
                mode === 'alphabet'
                  ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-glow-lg'
                  : 'glass-card border border-white/10 text-muted-foreground hover:text-foreground hover:border-primary/50'
              }`}
              title="A-Z Gesture Detection"
            >
              <Hand className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">A–Z</span>
            </button>

            <button
              onClick={() => setMode('numbers')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-1.5 hover-scale ${
                mode === 'numbers'
                  ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-glow-lg'
                  : 'glass-card border border-white/10 text-muted-foreground hover:text-foreground hover:border-primary/50'
              }`}
              title="Number Detection (1-9)"
            >
              <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">1–9</span>
            </button>

            <button
              onClick={() => setMode('phrases')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-1.5 hover-scale ${
                mode === 'phrases'
                  ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-glow-lg'
                  : 'glass-card border border-white/10 text-muted-foreground hover:text-foreground hover:border-primary/50'
              }`}
              title="Two-Hand Phrase Detection"
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Phrases</span>
            </button>
          </div>

          <div className="hidden lg:block h-6 w-px bg-border/30" />
          <ContextSelector context={context} domain={domain} onContextChange={setContext} onDomainChange={setDomain} />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover-scale ${voiceEnabled ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-glow' : 'bg-muted/40 text-muted-foreground border border-white/10 hover:border-primary/50'}`}
            title={voiceEnabled ? 'Mute' : 'Unmute'}>
            {voiceEnabled ? <Volume2 className="w-4.5 h-4.5 sm:w-5 sm:h-5" /> : <VolumeX className="w-4.5 h-4.5 sm:w-5 sm:h-5" />}
          </button>
          <button onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover-scale ${isDarkMode ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-glow' : 'bg-gradient-to-br from-yellow-400 to-orange-400 text-black shadow-glow'}`}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            {isDarkMode ? <Moon className="w-4.5 h-4.5 sm:w-5 sm:h-5" /> : <Sun className="w-4.5 h-4.5 sm:w-5 sm:h-5" />}
          </button>
          <button onClick={() => setProfileOpen(true)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-muted/40 flex items-center justify-center hover:bg-muted/60 transition-all duration-200 border border-white/10 hover-scale hover:border-primary/50">
            <User className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 w-full">
        {mode === 'numbers' ? (
          <NumberDetection />
        ) : mode === 'phrases' ? (
          <PhraseDetection />
        ) : (
          <div className="flex gap-4 lg:gap-6 max-w-full">
            {/* Main Content - Left Side */}
            <div className="flex-1 min-w-0 space-y-4 lg:space-y-6">
              {/* Camera Feed Card - Fixed Height */}
              <div className="glass-card rounded-2xl lg:rounded-3xl border overflow-hidden group card-hover h-fit">
                <div 
                  className="relative bg-gradient-to-br from-primary/8 via-background to-secondary/8 backdrop-blur-sm overflow-hidden w-full"
                  style={{
                    aspectRatio: orientation === 'portrait' ? '9/16' : '16/9',
                    minHeight: deviceType === 'mobile' ? '300px' : '400px',
                    maxHeight: deviceType === 'mobile' ? '500px' : '600px',
                    position: 'relative'
                  }}
                >
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover" 
                    playsInline 
                    muted 
                    style={{ 
                      transform: 'scaleX(-1)',
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      display: isActive ? 'block' : 'none'
                    }} 
                  />
                  <canvas 
                    ref={canvasRef} 
                    width={640} 
                    height={480}
                    className="absolute inset-0 w-full h-full pointer-events-none" 
                    style={{ 
                      transform: 'scaleX(-1)',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      zIndex: 5
                    }} 
                  />
                  {!isActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 sm:gap-4 backdrop-blur-sm p-4">
                      {camError ? (
                        <div className="text-center fade-in max-w-sm">
                          <div className="flex justify-center mb-3">
                            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive" />
                          </div>
                          <p className="text-destructive font-bold text-sm sm:text-base mb-3">{camError}</p>
                          <Button 
                            onClick={retry}
                            className="bg-gradient-to-r from-primary to-secondary text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-2 mx-auto hover-scale"
                          >
                            <RotateCw className="w-4 h-4" />
                            Retry
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Camera className="w-12 h-12 sm:w-16 sm:h-16 text-primary/30 animate-fade-in" />
                          <p className="text-muted-foreground font-medium text-sm sm:text-base">Start camera to begin detection</p>
                        </>
                      )}
                    </div>
                  )}
                  {modelLoading && isActive && (
                    <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-2 sm:gap-3 glass-card px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl fade-in">
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-primary" />
                      <span className="text-xs sm:text-sm font-semibold text-foreground">Loading AI Model...</span>
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex gap-2 sm:gap-3 flex-wrap justify-end max-w-xs" style={{ position: 'absolute', zIndex: 10 }}>
                       {hands && hands.length > 0 && (
                        <span className="animate-scale-in glass-card text-accent-foreground rounded-lg sm:rounded-xl px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold backdrop-blur-xl">
                          ✋ {hands.length}
                        </span>
                      )}
                      {gesture.gesture !== 'NONE' && (
                        <div className="animate-scale-in glass-card text-primary-foreground rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 fade-in backdrop-blur-xl border border-primary/30 text-right">
                          <p className="text-xs sm:text-sm font-bold">{gesture.label}</p>
                          <p className="text-xs opacity-80">{gesture.confidence}%</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-3 sm:p-5 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                  <Button 
                    onClick={isActive ? stop : start} 
                    style={{
                      minHeight: `${touchFriendlyDims.buttonHeight}px`,
                      minWidth: `${touchFriendlyDims.buttonHeight}px`
                    }}
                    className={`rounded-lg sm:rounded-xl px-4 sm:px-6 font-bold text-sm sm:text-base transition-all duration-300 hover-scale ${
                      isActive 
                        ? 'bg-gradient-to-r from-destructive to-red-600 text-white shadow-glow-lg' 
                        : 'bg-gradient-to-r from-primary to-secondary text-white shadow-glow-lg'
                    }`}
                  >
                    {isActive ? <><CameraOff className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Stop</> : <><Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Start</>}
                  </Button>
                  <div className="text-xs text-muted-foreground font-medium">
                    {isActive ? '🟢 Live' : '⚪ Ready'}
                  </div>
                  {deviceType === 'mobile' && (
                    <div className="text-xs text-muted-foreground font-medium ml-auto">
                      📱 {orientation}
                    </div>
                  )}
                </div>
              </div>

              {/* Suggestions - Below Camera (prevents sliding) */}
              <div className="glass-card rounded-2xl lg:rounded-3xl p-4 sm:p-6 border space-y-4 min-h-[160px]">
                {stableLetter && (context === 'retailer' ? domainPhrases.length > 0 : domainWords.length > 0) ? (
                  <div className="animate-slide-down">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 sm:mb-4">💡 Suggestions</p>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {(context === 'retailer' ? domainPhrases : domainWords).slice(0, 4).map((word, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentWord(word);
                            addMessage('user', `Selected: ${word}`);
                          }}
                          className="group glass-card rounded-lg sm:rounded-2xl p-2.5 sm:p-3 border border-primary/20 hover:border-primary/50 text-center transition-all duration-300 hover-scale hover:shadow-glow"
                        >
                          <p className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">{word}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <p className="text-muted-foreground text-xs font-medium">Detect a letter to see suggestions</p>
                  </div>
                )}
              </div>
              <div className="glass-card rounded-2xl lg:rounded-3xl p-4 sm:p-6 border space-y-4 sm:space-y-5 group card-hover min-h-[160px] sm:min-h-[180px]">
                {stableLetter ? (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-scale-in">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Detected</p>
                        <p className="text-5xl sm:text-6xl font-black gradient-text leading-tight">{stableLetter}</p>
                      </div>
                      <Button size="lg" onClick={() => addLetterToWord(stableLetter)} className="w-full sm:w-auto rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-secondary text-white hover-scale shadow-glow-lg whitespace-nowrap">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Add
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground font-semibold">Accuracy</span>
                        <span className="text-xs sm:text-sm font-bold text-primary">{stableConfidence}%</span>
                      </div>
                      <Progress value={stableConfidence} className="h-2 rounded-full" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-muted-foreground text-sm font-medium">Make a gesture to detect a letter</p>
                  </div>
                )}
              </div>

              {/* Word Builder */}
              <div className="glass-card rounded-2xl lg:rounded-3xl p-4 sm:p-6 border space-y-4 group card-hover">
                <div className="space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Built Word</p>
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg sm:rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition duration-300" />
                    <div className="relative flex items-center min-h-[50px] sm:min-h-[56px] bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg sm:rounded-2xl px-3 sm:px-4 py-3 border border-primary/20 group-hover:border-primary/40 transition-colors">
                      <span className="text-2xl sm:text-4xl font-bold tracking-wider text-foreground">
                        {currentWord || <span className="text-xs sm:text-sm font-normal text-muted-foreground tracking-normal">Make gestures...</span>}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" onClick={deleteLastLetter} disabled={!currentWord} className="rounded-lg sm:rounded-xl h-9 sm:h-10 gap-1 text-xs sm:text-sm glass-card border hover:border-destructive/50 hover:text-destructive">
                    <Delete className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Delete</span>
                  </Button>
                  <Button size="sm" onClick={addSpace} disabled={!currentWord} className="rounded-lg sm:rounded-xl h-9 sm:h-10 gap-1 text-xs sm:text-sm glass-card border hover:border-primary/50">
                    <span className="text-lg">⎵</span>
                  </Button>
                  <Button size="sm" onClick={speakAll} disabled={!currentWord && completedWords.length === 0} className="rounded-lg sm:rounded-xl h-9 sm:h-10 gap-1 ml-auto text-xs sm:text-sm bg-gradient-to-r from-primary to-secondary text-white hover-scale shadow-glow">
                    <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Speak</span>
                  </Button>
                  <Button size="sm" onClick={clearAll} className="rounded-lg sm:rounded-xl h-9 sm:h-10 text-xs sm:text-sm glass-card border hover:border-primary/50">
                    <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>

              {/* Completed Words History - Bottom */}
              {completedWords.length > 0 && (
                <div className="glass-card rounded-2xl lg:rounded-3xl p-4 sm:p-6 border space-y-3 animate-scale-in group card-hover">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Message History</p>
                  <div className="flex flex-wrap gap-2">
                    {completedWords.map((word, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 text-xs sm:text-sm font-semibold text-foreground hover:border-primary/60 transition-all duration-300 group/tag hover:bg-primary/30">
                        {word}
                        <button onClick={() => setCompletedWords(completedWords.filter((_, i) => i !== idx))} className="hover:text-destructive opacity-70 group-tag/hover:opacity-100">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar - Chat Only */}
            <div className="hidden lg:flex flex-col w-[360px] flex-shrink-0">
              {/* Chat Panel */}
              <div className="flex-1 min-h-0 sticky top-[100px] max-h-[calc(100vh-200px)]">
                <ChatPanel messages={messages} />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border/50 text-center glass-card mt-auto backdrop-blur-sm">
        <p className="text-xs text-muted-foreground font-semibold tracking-wide">
          {mode === 'phrases' ? '📹 Phrase Detection • Real-time Gesture Recognition' : '🔤 Sign Letters • Build Words & Communicate'}
        </p>
      </footer>
    </div>
  );
}
