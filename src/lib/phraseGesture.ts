// Phrase gesture detection for dual-hand signs
import type { HandInfo } from '@/hooks/useHandDetection';

export interface PhraseGestureResult {
  phrase: string | null;
  confidence: number;
  label: string;
}

interface StoredGesture {
  id: string;
  label: string;
  leftLandmarks: number[][] | null;
  rightLandmarks: number[][] | null;
  fingerStatesLeft: boolean[];
  fingerStatesRight: boolean[];
  timestamp: number;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function isFingerExtended(landmarks: any[], tip: number, pip: number): boolean {
  return landmarks[tip].y < landmarks[pip].y;
}

function isThumbOpen(landmarks: any[]): boolean {
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const wrist = landmarks[0];
  const indexMcp = landmarks[5];
  const isRightHand = indexMcp.x < wrist.x;
  return isRightHand ? thumbTip.x < thumbIp.x : thumbTip.x > thumbIp.x;
}

function getFingerStates(landmarks: any[]): boolean[] {
  return [
    isThumbOpen(landmarks),
    isFingerExtended(landmarks, 8, 6),
    isFingerExtended(landmarks, 12, 10),
    isFingerExtended(landmarks, 16, 14),
    isFingerExtended(landmarks, 20, 18),
  ];
}

// Built-in dual-hand phrase gestures
const BUILTIN_PHRASES: {
  label: string;
  check: (left: any[] | null, right: any[] | null) => number;
}[] = [
  {
    label: 'Hello',
    check: (left, right) => {
      // Both hands open palm waving
      if (!left || !right) return 0;
      const lFingers = getFingerStates(left);
      const rFingers = getFingerStates(right);
      const lOpen = lFingers.filter(Boolean).length >= 4;
      const rOpen = rFingers.filter(Boolean).length >= 4;
      if (lOpen && rOpen) return 85;
      return 0;
    },
  },
  {
    label: 'Thank You',
    check: (left, right) => {
      // One hand flat touching chin then moving forward (simplified: one hand open, one closed)
      if (!right) return 0;
      const rFingers = getFingerStates(right);
      const allOpen = rFingers.filter(Boolean).length >= 4;
      if (allOpen && right[8].y < right[0].y) {
        if (!left) return 75;
      }
      return 0;
    },
  },
  {
    label: 'Help',
    check: (left, right) => {
      // One fist on open palm
      if (!left || !right) return 0;
      const lFingers = getFingerStates(left);
      const rFingers = getFingerStates(right);
      const lFist = lFingers.filter(Boolean).length <= 1;
      const rOpen = rFingers.filter(Boolean).length >= 4;
      if (lFist && rOpen) {
        const dist = distance(left[0], right[0]);
        if (dist < 0.15) return 82;
      }
      return 0;
    },
  },
  {
    label: 'Stop',
    check: (left, right) => {
      // Both open palms facing forward
      if (!left || !right) return 0;
      const lFingers = getFingerStates(left);
      const rFingers = getFingerStates(right);
      const lOpen = lFingers.filter(Boolean).length >= 4;
      const rOpen = rFingers.filter(Boolean).length >= 4;
      if (lOpen && rOpen) {
        const wristDist = distance(left[0], right[0]);
        if (wristDist > 0.3) return 80;
      }
      return 0;
    },
  },
  {
    label: 'Yes',
    check: (_left, right) => {
      if (!right) return 0;
      const rFingers = getFingerStates(right);
      // Fist nodding (simplified: fist shape)
      if (rFingers.filter(Boolean).length <= 1 && rFingers[0]) return 72;
      return 0;
    },
  },
  {
    label: 'No',
    check: (_left, right) => {
      if (!right) return 0;
      const rFingers = getFingerStates(right);
      // Index + middle extended snapping (simplified)
      if (rFingers[1] && rFingers[2] && !rFingers[3] && !rFingers[4] && rFingers[0]) return 70;
      return 0;
    },
  },
  {
    label: 'I Need Water',
    check: (left, right) => {
      // W shape with one hand near mouth
      if (!right) return 0;
      const rFingers = getFingerStates(right);
      if (rFingers[1] && rFingers[2] && rFingers[3] && !rFingers[4]) {
        if (right[8].y < right[0].y * 0.8) return 72;
      }
      return 0;
    },
  },
  {
    label: 'Good Morning',
    check: (left, right) => {
      if (!left || !right) return 0;
      const lFingers = getFingerStates(left);
      const rFingers = getFingerStates(right);
      // Both thumbs up
      if (lFingers[0] && !lFingers[1] && !lFingers[2] && rFingers[0] && !rFingers[1] && !rFingers[2]) return 78;
      return 0;
    },
  },
  {
    label: 'Come Here',
    check: (_left, right) => {
      if (!right) return 0;
      const rFingers = getFingerStates(right);
      // Index finger beckoning
      if (rFingers[1] && !rFingers[2] && !rFingers[3] && !rFingers[4]) {
        if (right[8].x < right[5].x) return 68;
      }
      return 0;
    },
  },
  {
    label: 'Call Me',
    check: (_left, right) => {
      if (!right) return 0;
      const rFingers = getFingerStates(right);
      // Thumb + pinky (phone gesture)
      if (rFingers[0] && !rFingers[1] && !rFingers[2] && !rFingers[3] && rFingers[4]) return 80;
      return 0;
    },
  },
];

const PHRASE_SUGGESTIONS: Record<string, string[]> = {
  'Hello': ['Hello there!', 'Hi, how are you?', 'Good to see you'],
  'Thank You': ['Thank you so much', 'Thanks a lot', 'I appreciate it'],
  'Help': ['I need help', 'Can you help me?', 'Please help me'],
  'Stop': ['Please stop', 'Stop right now', 'Hold on'],
  'Yes': ['Yes, please', 'Yes, I agree', 'Absolutely'],
  'No': ['No, thank you', 'Not now', 'I disagree'],
  'I Need Water': ['I need water please', 'Can I have water?', 'I am thirsty'],
  'Good Morning': ['Good morning!', 'Morning, how are you?', 'Have a great day'],
  'Come Here': ['Come here please', 'Can you come over?', 'Walk this way'],
  'Call Me': ['Please call me', 'Give me a call', 'Call me back'],
};

export function classifyPhrase(hands: HandInfo[]): PhraseGestureResult {
  const leftHand = hands.find(h => h.handedness === 'Left')?.landmarks || null;
  const rightHand = hands.find(h => h.handedness === 'Right')?.landmarks || null;

  // Check custom gestures first
  const customs = getCustomGestures();
  for (const custom of customs) {
    const score = matchCustomGesture(custom, leftHand, rightHand);
    if (score > 70) {
      return { phrase: custom.label, confidence: score, label: custom.label };
    }
  }

  // Check built-in phrases
  let bestPhrase: string | null = null;
  let bestConf = 0;

  for (const p of BUILTIN_PHRASES) {
    const conf = p.check(leftHand, rightHand);
    if (conf > bestConf) {
      bestConf = conf;
      bestPhrase = p.label;
    }
  }

  if (bestPhrase && bestConf > 65) {
    return { phrase: bestPhrase, confidence: bestConf, label: bestPhrase };
  }

  return { phrase: null, confidence: 0, label: 'No phrase detected' };
}

export function getPhraseSuggestions(phrase: string): string[] {
  return PHRASE_SUGGESTIONS[phrase] || [];
}

// ========== Custom Gesture Storage ==========

const STORAGE_KEY = 'signvoice_custom_gestures';

export function getCustomGestures(): StoredGesture[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomGesture(label: string, hands: HandInfo[]): StoredGesture {
  const leftHand = hands.find(h => h.handedness === 'Left');
  const rightHand = hands.find(h => h.handedness === 'Right');

  const gesture: StoredGesture = {
    id: Date.now().toString(),
    label,
    leftLandmarks: leftHand ? leftHand.landmarks.map((l: any) => [l.x, l.y, l.z]) : null,
    rightLandmarks: rightHand ? rightHand.landmarks.map((l: any) => [l.x, l.y, l.z]) : null,
    fingerStatesLeft: leftHand ? getFingerStates(leftHand.landmarks) : [],
    fingerStatesRight: rightHand ? getFingerStates(rightHand.landmarks) : [],
    timestamp: Date.now(),
  };

  const existing = getCustomGestures();
  existing.push(gesture);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  return gesture;
}

export function deleteCustomGesture(id: string) {
  const existing = getCustomGestures().filter(g => g.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

function matchCustomGesture(stored: StoredGesture, left: any[] | null, right: any[] | null): number {
  let score = 0;
  let checks = 0;

  if (stored.fingerStatesRight.length > 0 && right) {
    const current = getFingerStates(right);
    let matches = 0;
    for (let i = 0; i < 5; i++) {
      if (current[i] === stored.fingerStatesRight[i]) matches++;
    }
    score += (matches / 5) * 100;
    checks++;
  }

  if (stored.fingerStatesLeft.length > 0 && left) {
    const current = getFingerStates(left);
    let matches = 0;
    for (let i = 0; i < 5; i++) {
      if (current[i] === stored.fingerStatesLeft[i]) matches++;
    }
    score += (matches / 5) * 100;
    checks++;
  }

  if (checks === 0) return 0;
  return Math.round(score / checks);
}
