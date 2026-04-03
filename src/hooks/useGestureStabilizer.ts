// Gesture stabilization hook with majority voting, cooldown, and sequence building
import { useState, useRef, useCallback } from 'react';

interface StabilizerConfig {
  bufferSize: number;
  cooldownMs: number;
  majorityThreshold: number; // 0-1 ratio
}

const DEFAULT_CONFIG: StabilizerConfig = {
  bufferSize: 7,
  cooldownMs: 2000,
  majorityThreshold: 0.6,
};

export interface StableResult {
  value: string | null;
  confidence: number;
  isLocked: boolean;
}

export function useGestureStabilizer(config: Partial<StabilizerConfig> = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const bufferRef = useRef<string[]>([]);
  const lastConfirmedRef = useRef<string>('NONE');
  const lastConfirmTimeRef = useRef(0);
  const [stableResult, setStableResult] = useState<StableResult>({
    value: null, confidence: 0, isLocked: false,
  });

  const push = useCallback((value: string, confidence: number): StableResult | null => {
    const buf = bufferRef.current;
    buf.push(value);
    if (buf.length > cfg.bufferSize) buf.shift();
    if (buf.length < cfg.bufferSize) return null;

    // Majority voting
    const counts: Record<string, number> = {};
    for (const v of buf) counts[v] = (counts[v] || 0) + 1;
    let majority = 'NONE';
    let maxCount = 0;
    for (const [v, c] of Object.entries(counts)) {
      if (c > maxCount) { majority = v; maxCount = c; }
    }

    if (majority === 'NONE' || maxCount < Math.ceil(cfg.bufferSize * cfg.majorityThreshold)) {
      const result = { value: null, confidence: 0, isLocked: false };
      setStableResult(result);
      return null;
    }

    const now = Date.now();
    if (majority === lastConfirmedRef.current && now - lastConfirmTimeRef.current < cfg.cooldownMs) {
      return null; // Still in cooldown
    }

    if (majority !== lastConfirmedRef.current || now - lastConfirmTimeRef.current >= cfg.cooldownMs) {
      lastConfirmedRef.current = majority;
      lastConfirmTimeRef.current = now;
      const result = { value: majority, confidence, isLocked: true };
      setStableResult(result);
      return result;
    }

    return null;
  }, [cfg.bufferSize, cfg.cooldownMs, cfg.majorityThreshold]);

  const reset = useCallback(() => {
    bufferRef.current = [];
    lastConfirmedRef.current = 'NONE';
    setStableResult({ value: null, confidence: 0, isLocked: false });
  }, []);

  return { stableResult, push, reset };
}

// Sentence builder from gesture sequence
export function useSentenceBuilder() {
  const [words, setWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState('');

  const addLetter = useCallback((letter: string) => {
    setCurrentWord(prev => prev + letter);
  }, []);

  const addSpace = useCallback(() => {
    setCurrentWord(prev => {
      if (prev) {
        setWords(w => [...w, prev]);
      }
      return '';
    });
  }, []);

  const deleteLetter = useCallback(() => {
    setCurrentWord(prev => prev.slice(0, -1));
  }, []);

  const addWord = useCallback((word: string) => {
    setWords(prev => [...prev, word]);
    setCurrentWord('');
  }, []);

  const getSentence = useCallback(() => {
    const all = [...words];
    if (currentWord) all.push(currentWord);
    return all.join(' ');
  }, [words, currentWord]);

  const clear = useCallback(() => {
    setWords([]);
    setCurrentWord('');
  }, []);

  return { words, currentWord, addLetter, addSpace, deleteLetter, addWord, getSentence, clear };
}
