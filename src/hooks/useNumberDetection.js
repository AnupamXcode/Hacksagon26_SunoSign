import { useState, useCallback, useEffect, useRef } from 'react';
import { classifyNumber } from '@/lib/numberGesture';

// Helper function to classify finger states from landmarks
function classifyFingerStates(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return { thumb: false, index: false, middle: false, ring: false, pinky: false };
  }

  // Finger landmarks indices in MediaPipe Hand model:
  // Thumb: 1-4, Index: 5-8, Middle: 9-12, Ring: 13-16, Pinky: 17-20, Wrist: 0
  
  const isFingerOpen = (tipIdx, pipIdx) => {
    if (landmarks[tipIdx] && landmarks[pipIdx]) {
      return landmarks[tipIdx].y < landmarks[pipIdx].y; // Tip above PIP joint
    }
    return false;
  };

  return {
    thumb: isFingerOpen(4, 3),
    index: isFingerOpen(8, 6),
    middle: isFingerOpen(12, 10),
    ring: isFingerOpen(16, 14),
    pinky: isFingerOpen(20, 18),
  };
}

export function useNumberDetection(landmarks, isActive) {
  const [number, setNumber] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [isStable, setIsStable] = useState(false);
  const [fingerStates, setFingerStates] = useState({ thumb: false, index: false, middle: false, ring: false, pinky: false });
  const [history, setHistory] = useState([]);
  const stableRef = useRef({ count: 0, val: null });

  const detect = useCallback(() => {
    if (!landmarks || !isActive) {
      setNumber(null);
      setConfidence(0);
      setIsStable(false);
      return;
    }

    const fingerStates = classifyFingerStates(landmarks);
    setFingerStates(fingerStates);

    const result = classifyNumber(landmarks);
    if (result) {
      setNumber(result.number);
      setConfidence(result.confidence);

      if (stableRef.current.val === result.number) {
        stableRef.current.count++;
        if (stableRef.current.count > 10) {
          setIsStable(true);
          // Add to history if not already the last entry
          setHistory(prev => {
            if (prev.length === 0 || prev[prev.length - 1].number !== result.number) {
              return [...prev, { number: result.number, confidence: result.confidence }];
            }
            return prev;
          });
        }
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

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const result = {
    number,
    confidence,
    isStable,
    fingerStates,
  };

  return { result, history, clearHistory };
}
