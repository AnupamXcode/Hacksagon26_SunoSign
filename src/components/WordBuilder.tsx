import { useState, useEffect, useCallback } from 'react';
import { Delete, Space, Volume2, RotateCcw, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { speak } from '@/lib/tts';
import { getWordSuggestions, wordToSentence, isEmergencyWord } from '@/lib/gesture';

interface WordBuilderProps {
  currentLetter: string | null;
  onWordComplete: (word: string, sentence: string) => void;
  onEmergency: () => void;
}

export function WordBuilder({ currentLetter, onWordComplete, onEmergency }: WordBuilderProps) {
  const [currentWord, setCurrentWord] = useState('');
  const [completedWords, setCompletedWords] = useState<string[]>([]);
  const [lastAddedLetter, setLastAddedLetter] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Update suggestions when word changes
  useEffect(() => {
    setSuggestions(getWordSuggestions(currentWord));
  }, [currentWord]);

  // Add detected letter (with debounce - don't add same letter twice in a row rapidly)
  const addLetter = useCallback((letter: string) => {
    if (letter === lastAddedLetter) return;
    setCurrentWord(prev => prev + letter);
    setLastAddedLetter(letter);
  }, [lastAddedLetter]);

  // Reset last letter when gesture changes to allow same letter again
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
      
      if (isEmergencyWord(currentWord)) {
        onEmergency();
      }
      
      setCurrentWord('');
      setLastAddedLetter(null);
    }
  };

  const useSuggestion = (word: string) => {
    setCompletedWords(prev => [...prev, word]);
    
    if (isEmergencyWord(word)) {
      onEmergency();
    }
    
    setCurrentWord('');
    setLastAddedLetter(null);
    setSuggestions([]);
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
    <div className="bg-card rounded-2xl border border-border overflow-hidden slide-up">
      {/* Current detected letter */}
      {currentLetter && (
        <div className="px-4 py-2 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Detected Letter</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary" style={{ fontFamily: 'var(--font-mono)' }}>{currentLetter}</span>
            <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={() => addLetter(currentLetter)}>
              + Add
            </Button>
          </div>
        </div>
      )}

      {/* Word building area */}
      <div className="p-4 space-y-3">
        {/* Completed words */}
        {completedWords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {completedWords.map((w, i) => (
              <span key={i} className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-sm font-semibold">
                {w}
              </span>
            ))}
          </div>
        )}

        {/* Current word being built */}
        <div className="flex items-center gap-2 min-h-[48px] bg-muted/50 rounded-xl px-4 py-2">
          <span className="text-lg font-bold tracking-[0.2em] text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
            {currentWord || <span className="text-muted-foreground text-sm font-normal tracking-normal">Sign letters to build words...</span>}
          </span>
          {currentWord && (
            <span className="ml-1 w-0.5 h-6 bg-primary animate-pulse" />
          )}
        </div>

        {/* Sentence preview */}
        {fullSentence && (
          <div className="text-sm text-muted-foreground italic px-1">
            → {fullSentence}
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Suggestions</span>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => useSuggestion(s)}
                  className="bg-accent/10 text-accent border border-accent/20 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-accent/20 transition-colors active:scale-95"
                >
                  {s}
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
