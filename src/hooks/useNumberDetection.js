import { useState, useCallback, useEffect, useRef } from 'react';
import { classifyNumber } from '@/lib/numberGesture';

export function useNumberDetection(landmarks, isActive) {
  const [number, setNumber] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [isStable, setIsStable] = useState(false);
  const stableRef = useRef({ count: 0, val: null });

  const detect = useCallback(() => {
    if (!landmarks || !isActive) {
      setNumber(null);
      setConfidence(0);
      setIsStable(false);
      return;
    }

    const result = classifyNumber(landmarks);
    if (result) {
      setNumber(result.number);
      setConfidence(result.confidence);

      if (stableRef.current.val === result.number) {
        stableRef.current.count++;
        if (stableRef.current.count > 10) setIsStable(true);
      } else {
        stableRef.current.val = result.number;
        stableRef.current.count = 0;
        setIsStable(false);
      }
    }
  }, [landmarks, isActive]);

  useEffect(() => {
    detect();
  }, [detect]);

  return { number, confidence, isStable };
}
