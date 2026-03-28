import { useState, useRef, useEffect, useCallback } from 'react';
import { classifyNumber, type NumberGestureResult } from '@/lib/numberGesture';

interface StableNumberResult extends NumberGestureResult {
  isStable: boolean;
  stableFrames: number;
}

export function useNumberDetection(
  landmarks: any[] | null,
  isActive: boolean,
  stabilityThreshold = 4
) {
  const [result, setResult] = useState<StableNumberResult>({
    number: null, label: 'No number', confidence: 0, isStable: false, stableFrames: 0,
    fingerStates: { thumb: false, index: false, middle: false, ring: false, pinky: false },
  });
  const [history, setHistory] = useState<{ number: number; timestamp: Date }[]>([]);
  const lastNumberRef = useRef<number | null>(null);
  const stableCountRef = useRef(0);
  const lastSpokenRef = useRef<number | null>(null);
  const lastSpokenTimeRef = useRef(0);

  const addToHistory = useCallback((num: number) => {
    setHistory(prev => [{ number: num, timestamp: new Date() }, ...prev].slice(0, 10));
  }, []);

  useEffect(() => {
    if (!isActive || !landmarks) {
      setResult({
        number: null, label: 'No number', confidence: 0, isStable: false, stableFrames: 0,
        fingerStates: { thumb: false, index: false, middle: false, ring: false, pinky: false },
      });
      lastNumberRef.current = null;
      stableCountRef.current = 0;
      return;
    }

    const classified = classifyNumber(landmarks);
    
    if (classified.number === lastNumberRef.current && classified.number !== null) {
      stableCountRef.current++;
    } else {
      lastNumberRef.current = classified.number;
      stableCountRef.current = classified.number !== null ? 1 : 0;
    }

    const isStable = stableCountRef.current >= stabilityThreshold;

    if (isStable && classified.number !== null) {
      const now = Date.now();
      if (classified.number !== lastSpokenRef.current || now - lastSpokenTimeRef.current > 3000) {
        lastSpokenRef.current = classified.number;
        lastSpokenTimeRef.current = now;
        addToHistory(classified.number);
      }
    }

    setResult({
      ...classified,
      isStable,
      stableFrames: stableCountRef.current,
    });
  }, [landmarks, isActive, stabilityThreshold, addToHistory]);

  return { result, history, clearHistory: () => setHistory([]) };
}
