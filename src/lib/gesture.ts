// Gesture classification from MediaPipe hand landmarks — A-Z ASL Alphabet

export type GestureType =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J'
  | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T'
  | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'
  | 'THUMBS_UP' | 'FIST' | 'OPEN_PALM' | 'NONE';

export interface GestureResult {
  gesture: GestureType;
  confidence: number;
  label: string;
  isAlphabet: boolean;
}

function distance(a: { x: number; y: number; z?: number }, b: { x: number; y: number; z?: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function dist3d(a: any, b: any) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + ((a.z || 0) - (b.z || 0)) ** 2);
}

function isFingerExtended(landmarks: any[], tip: number, pip: number, mcp: number): boolean {
  return landmarks[tip].y < landmarks[pip].y && landmarks[pip].y < landmarks[mcp].y;
}

function isFingerCurled(landmarks: any[], tip: number, pip: number, mcp: number): boolean {
  return landmarks[tip].y > landmarks[pip].y;
}

function fingerTipToPalm(landmarks: any[], tip: number): number {
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  const palmCenter = { x: (wrist.x + middleMcp.x) / 2, y: (wrist.y + middleMcp.y) / 2 };
  return distance(landmarks[tip], palmCenter);
}

function isThumbExtended(landmarks: any[]): boolean {
  const thumbTip = landmarks[4];
  const thumbMcp = landmarks[2];
  const wrist = landmarks[0];
  return distance(thumbTip, wrist) > distance(thumbMcp, wrist);
}

function isThumbAcrossPalm(landmarks: any[]): boolean {
  const thumbTip = landmarks[4];
  const indexMcp = landmarks[5];
  const pinkyMcp = landmarks[17];
  // Thumb tip is between index and pinky MCPs horizontally
  return thumbTip.x > Math.min(indexMcp.x, pinkyMcp.x) && thumbTip.x < Math.max(indexMcp.x, pinkyMcp.x);
}

function angleBetween(a: any, b: any, c: any): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.sqrt(ab.x ** 2 + ab.y ** 2);
  const magCB = Math.sqrt(cb.x ** 2 + cb.y ** 2);
  if (magAB * magCB === 0) return 0;
  return Math.acos(Math.min(1, Math.max(-1, dot / (magAB * magCB)))) * (180 / Math.PI);
}

export function classifyGesture(landmarks: any[]): GestureResult {
  if (!landmarks || landmarks.length < 21) {
    return { gesture: 'NONE', confidence: 0, label: 'No gesture', isAlphabet: false };
  }

  const indexExtended = isFingerExtended(landmarks, 8, 6, 5);
  const middleExtended = isFingerExtended(landmarks, 12, 10, 9);
  const ringExtended = isFingerExtended(landmarks, 16, 14, 13);
  const pinkyExtended = isFingerExtended(landmarks, 20, 18, 17);
  const thumbExtended = isThumbExtended(landmarks);

  const indexCurled = isFingerCurled(landmarks, 8, 6, 5);
  const middleCurled = isFingerCurled(landmarks, 12, 10, 9);
  const ringCurled = isFingerCurled(landmarks, 16, 14, 13);
  const pinkyCurled = isFingerCurled(landmarks, 20, 18, 17);

  const extendedCount = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  const wrist = landmarks[0];
  const indexMcp = landmarks[5];
  const middleMcp = landmarks[9];
  const indexPip = landmarks[6];

  const thumbIndexDist = distance(thumbTip, indexTip);
  const thumbMiddleDist = distance(thumbTip, middleTip);
  const indexMiddleDist = distance(indexTip, middleTip);
  const palmSize = distance(wrist, middleMcp);

  const make = (gesture: GestureType, confidence: number): GestureResult => ({
    gesture, confidence, label: gesture, isAlphabet: gesture.length === 1,
  });

  // ---- A: Fist with thumb to the side (not across fingers) ----
  if (extendedCount === 0 && thumbExtended && !isThumbAcrossPalm(landmarks)) {
    return make('A', 82);
  }

  // ---- B: Four fingers extended, thumb curled across palm ----
  if (extendedCount === 4 && !thumbExtended) {
    return make('B', 85);
  }

  // ---- C: Curved hand, fingers together forming C shape ----
  if (extendedCount >= 2 && extendedCount <= 3) {
    const curveAngle = angleBetween(indexTip, landmarks[5], thumbTip);
    if (curveAngle > 40 && curveAngle < 100 && thumbIndexDist > palmSize * 0.3) {
      const fingerSpread = distance(indexTip, pinkyTip);
      if (fingerSpread < palmSize * 0.8) {
        return make('C', 70);
      }
    }
  }

  // ---- D: Index up, others curled, thumb touches middle finger ----
  if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    if (thumbMiddleDist < palmSize * 0.3) {
      return make('D', 80);
    }
  }

  // ---- E: All fingers curled, thumb across front ----
  if (extendedCount === 0 && !thumbExtended && isThumbAcrossPalm(landmarks)) {
    return make('E', 78);
  }

  // ---- F: Thumb and index touch, other three fingers extended ----
  if (middleExtended && ringExtended && pinkyExtended && thumbIndexDist < palmSize * 0.2) {
    return make('F', 85);
  }

  // ---- G: Index pointing sideways, thumb parallel ----
  if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    const indexAngle = Math.abs(indexTip.x - indexMcp.x);
    if (indexAngle > Math.abs(indexTip.y - indexMcp.y)) {
      return make('G', 75);
    }
  }

  // ---- H: Index and middle extended sideways ----
  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
    const avgDx = Math.abs((indexTip.x + middleTip.x) / 2 - (indexMcp.x + middleMcp.x) / 2);
    const avgDy = Math.abs((indexTip.y + middleTip.y) / 2 - (landmarks[6].y + landmarks[10].y) / 2);
    if (avgDx > avgDy) {
      return make('H', 75);
    }
  }

  // ---- I: Only pinky extended ----
  if (!indexExtended && !middleExtended && !ringExtended && pinkyExtended) {
    return make('I', 88);
  }

  // ---- J: Pinky extended (like I but with motion — static classification same as I) ----
  // J requires motion, we approximate as I with thumb out
  if (!indexExtended && !middleExtended && !ringExtended && pinkyExtended && thumbExtended) {
    return make('J', 70);
  }

  // ---- K: Index and middle up, spread apart, thumb between them ----
  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
    if (indexMiddleDist > palmSize * 0.25 && thumbTip.y < indexPip.y) {
      return make('K', 78);
    }
  }

  // ---- L: Index and thumb extended forming L shape ----
  if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended && thumbExtended) {
    const angle = angleBetween(indexTip, landmarks[5], thumbTip);
    if (angle > 60) {
      return make('L', 85);
    }
  }

  // ---- M: Three fingers (index, middle, ring) over thumb ----
  if (extendedCount === 0 && !thumbExtended) {
    const overThumb = landmarks[8].y > landmarks[4].y && landmarks[12].y > landmarks[4].y && landmarks[16].y > landmarks[4].y;
    if (overThumb) {
      return make('M', 68);
    }
  }

  // ---- N: Two fingers (index, middle) over thumb ----
  if (extendedCount === 0 && !thumbExtended) {
    const overThumb = landmarks[8].y > landmarks[4].y && landmarks[12].y > landmarks[4].y && landmarks[16].y <= landmarks[4].y;
    if (overThumb) {
      return make('N', 68);
    }
  }

  // ---- O: All fingertips touching thumb forming O ----
  if (thumbIndexDist < palmSize * 0.15 && thumbMiddleDist < palmSize * 0.2) {
    return make('O', 80);
  }

  // ---- P: Like K but pointing down ----
  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
    if (indexTip.y > indexMcp.y) {
      return make('P', 72);
    }
  }

  // ---- Q: Like G but pointing down (index + thumb down) ----
  if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    if (indexTip.y > wrist.y) {
      return make('Q', 72);
    }
  }

  // ---- R: Index and middle crossed/together, extended up ----
  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
    if (indexMiddleDist < palmSize * 0.1) {
      return make('R', 75);
    }
  }

  // ---- S: Fist with thumb across fingers ----
  if (extendedCount === 0 && !thumbExtended) {
    return make('S', 75);
  }

  // ---- T: Thumb between index and middle, fist ----
  if (extendedCount === 0) {
    if (thumbTip.y < landmarks[6].y && thumbTip.y > landmarks[8].y) {
      return make('T', 72);
    }
  }

  // ---- U: Index and middle together, extended up ----
  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
    if (indexMiddleDist < palmSize * 0.15) {
      return make('U', 80);
    }
    // ---- V: Index and middle spread apart ----
    if (indexMiddleDist > palmSize * 0.2) {
      return make('V', 82);
    }
  }

  // ---- W: Index, middle, ring extended and spread ----
  if (indexExtended && middleExtended && ringExtended && !pinkyExtended) {
    return make('W', 82);
  }

  // ---- X: Index finger hooked (bent at PIP) ----
  if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    if (landmarks[8].y > landmarks[6].y && landmarks[7].y < landmarks[6].y) {
      return make('X', 70);
    }
  }

  // ---- Y: Thumb and pinky extended, others curled ----
  if (pinkyExtended && thumbExtended && !indexExtended && !middleExtended && !ringExtended) {
    return make('Y', 88);
  }

  // ---- Z: Index traces Z shape — static approximation: index pointing ----
  if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended && !thumbExtended) {
    return make('Z', 65);
  }

  // ---- Fallback special gestures ----
  // OPEN_PALM
  if (extendedCount >= 4 && thumbExtended) {
    return make('OPEN_PALM', 90);
  }

  // FIST
  if (extendedCount === 0 && !thumbExtended) {
    return make('FIST', 85);
  }

  // THUMBS_UP
  if (thumbExtended && extendedCount === 0) {
    return make('THUMBS_UP', 85);
  }

  return { gesture: 'NONE', confidence: 0, label: 'No gesture', isAlphabet: false };
}

// Word-to-sentence dictionary
const WORD_SENTENCES: Record<string, string> = {
  HELP: 'I need help',
  HELLO: 'Hello, how are you?',
  YES: 'Yes',
  NO: 'No',
  WATER: 'I need water',
  FOOD: 'I need food',
  DOCTOR: 'Please call a doctor',
  STOP: 'Please stop',
  THANK: 'Thank you very much',
  THANKS: 'Thank you very much',
  PLEASE: 'Please',
  SORRY: 'I am sorry',
  OK: 'Okay',
  GOOD: 'Good',
  BAD: 'Bad',
  PAIN: 'I am in pain',
  CALL: 'Please call someone',
  HOME: 'I want to go home',
  COME: 'Please come here',
  GO: 'I want to go',
  WAIT: 'Please wait',
  BYE: 'Goodbye',
  NAME: 'What is your name?',
  WHERE: 'Where is it?',
  WHEN: 'When?',
  HOW: 'How?',
  WHAT: 'What?',
  WHO: 'Who?',
  LOVE: 'I love you',
  NEED: 'I need something',
  WANT: 'I want something',
  MORE: 'I want more',
  DONE: 'I am done',
  HUNGRY: 'I am hungry',
  THIRSTY: 'I am thirsty',
  TIRED: 'I am tired',
  SICK: 'I feel sick',
  HAPPY: 'I am happy',
  SAD: 'I am sad',
  COLD: 'I am cold',
  HOT: 'I am hot',
  SLEEP: 'I want to sleep',
  REST: 'I need to rest',
  TOILET: 'I need to use the toilet',
  PHONE: 'Please give me my phone',
  FAMILY: 'Call my family',
  FRIEND: 'Call my friend',
};

// Word suggestion dictionary (prefix -> suggestions)
const WORD_LIST = Object.keys(WORD_SENTENCES);

export function getWordSuggestions(prefix: string): string[] {
  if (!prefix || prefix.length < 1) return [];
  const upper = prefix.toUpperCase();
  return WORD_LIST.filter(w => w.startsWith(upper) && w !== upper).slice(0, 5);
}

export function wordToSentence(word: string): string {
  return WORD_SENTENCES[word.toUpperCase()] || word;
}

export function isEmergencyWord(word: string): boolean {
  const w = word.toUpperCase();
  return w === 'HELP' || w === 'SOS' || w === 'EMERGENCY';
}
