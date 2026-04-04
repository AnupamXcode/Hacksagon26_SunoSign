import { useState, useEffect, useCallback } from 'react';
import { Delete, Space, Volume2, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { speak } from '@/lib/tts';
import { getWordSuggestions, getLetterWords, getLetterPhrases, wordToSentence, isEmergencyWord } from '@/lib/gesture';
import { Progress } from '@/components/ui/progress';



const FINGER_NAMES = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];

export function WordBuilder({ currentLetter, confidence, fingerStates, onWordComplete, onEmergency }) {
  const [currentWord, setCurrentWord] = useState('');
  const [completedWords, setCompletedWords] = useState([]);
  const [lastAddedLetter, setLastAddedLetter] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [phrases, setPhrases] = useState([]);
  const [letterWords, setLetterWords] = useState([]);

  // Update suggestions when word changes
  useEffect(() => {
    setSuggestions(getWordSuggestions(currentWord));
  }, [currentWord]);

  // Update letter-based words/phrases when letter changes
  useEffect(() => {
    if (currentLetter) {
      setLetterWords(getLetterWords(currentLetter));
      setPhrases(getLetterPhrases(currentLetter));
    } else {
      setLetterWords([]);
      setPhrases([]);
    }
  }, [currentLetter]);

  const addLetter = useCallback((letter) => {
    if (letter === lastAddedLetter) return;
    setCurrentWord(prev => prev + letter);
    setLastAddedLetter(letter);
  }, [lastAddedLetter]);

  useEffect(() => {
    if (currentLetter === null) {
      setLastAddedLetter(null);
    }
  }, [currentLetter]);

  const deleteLetter = () => {
    setCurrentWord(prev => prev.slice(0, -1));
    setLastAddedLetter(null);
  };

  const addSpace = () => {
    if (currentWord) {
      setCompletedWords(prev => [...prev, currentWord]);
      if (isEmergencyWord(currentWord)) onEmergency();
      setCurrentWord('');
      setLastAddedLetter(null);
    }
  };

  const useSuggestion = (word) => {
    setCompletedWords(prev => [...prev, word]);
    if (isEmergencyWord(word)) onEmergency();
    setCurrentWord('');
    setLastAddedLetter(null);
    setSuggestions([]);
  };

  const speakPhrase = (phrase) => {
    speak(phrase);
    onWordComplete(phrase, phrase);
  };

  const speakAll = () => {
    const allWords = [...completedWords];
    if (currentWord) allWords.push(currentWord);
    if (allWords.length === 0) return;
    const fullText = allWords.map(w => wordToSentence(w)).join('. ');
    speak(fullText);
    onWordComplete(allWords.join(' '), fullText);
  };

  const clearAll = () => {
    setCurrentWord('');
    setCompletedWords([]);
    setLastAddedLetter(null);
    setSuggestions([]);
  };

  const fullSentence = [...completedWords, currentWord].filter(Boolean).map(w => wordToSentence(w)).join('. ');

  return (
    <div className="space-y-4 slide-up">
      {/* Detection Output Panel */}
      {currentLetter && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 bg-primary/10 border-b border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Detected Letter</span>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-primary" style={{ fontFamily: 'var(--font-mono)' }}>{currentLetter}</span>
                <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={() => addLetter(currentLetter)}>
                  + Add
                </Button>
              </div>
            </div>
            {/* Confidence Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Confidence</span>
                <span>{confidence}%</span>
              </div>
              <Progress value={confidence} className="h-1.5" />
            </div>
          </div>
          {/* Finger States */}
          {fingerStates && (
            <div className="px-4 py-2 flex items-center gap-2 border-b border-border">
              {FINGER_NAMES.map((name, i) => (
                <div key={name} className="flex flex-col items-center gap-0.5">
                  <div className={`w-5 h-5 rounded-full text-[9px] flex items-center justify-center font-bold transition-colors ${
                    fingerStates[i] ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {fingerStates[i] ? '↑' : '↓'}
                  </div>
                  <span className="text-[8px] text-muted-foreground">{name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Word Building Area */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden p-4 space-y-3">
        {/* Completed words */}
        {completedWords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {completedWords.map((w, i) => (
              <span key={i} className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-sm font-semibold">{w}</span>
            ))}
          </div>
        )}

        {/* Current word */}
        <div className="flex items-center gap-2 min-h-[48px] bg-muted/50 rounded-xl px-4 py-2">
          <span className="text-lg font-bold tracking-[0.2em] text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
            {currentWord || <span className="text-muted-foreground text-sm font-normal tracking-normal">Sign letters to build words...</span>}
          </span>
          {currentWord && <span className="ml-1 w-0.5 h-6 bg-primary animate-pulse" />}
        </div>

        {/* Sentence preview */}
        {fullSentence && (
          <div className="text-sm text-muted-foreground italic px-1">→ {fullSentence}</div>
        )}

        {/* Word Suggestions from current prefix */}
        {suggestions.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Word Suggestions</span>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map(s => (
                <button key={s} onClick={() => useSuggestion(s)}
                  className="bg-accent/10 text-accent border border-accent/20 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-accent/20 transition-colors active:scale-95">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Smart Letter Words */}
        {letterWords.length > 0 && !currentWord && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Words for "{currentLetter}"
            </span>
            <div className="flex flex-wrap gap-1.5">
              {letterWords.map(w => (
                <button key={w} onClick={() => { speak(w); onWordComplete(w, w); }}
                  className="bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-secondary/80 transition-colors active:scale-95">
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Phrase Suggestions */}
        {phrases.length > 0 && !currentWord && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Volume2 className="w-3 h-3" /> Quick Phrases
            </span>
            <div className="flex flex-wrap gap-1.5">
              {phrases.map(p => (
                <button key={p} onClick={() => speakPhrase(p)}
                  className="bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors active:scale-95">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" variant="outline" className="rounded-xl h-9 gap-1.5" onClick={deleteLetter} disabled={!currentWord}>
            <Delete className="w-3.5 h-3.5" /> Delete
          </Button>
          <Button size="sm" variant="outline" className="rounded-xl h-9 gap-1.5" onClick={addSpace} disabled={!currentWord}>
            <Space className="w-3.5 h-3.5" /> Space
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
  );
}
