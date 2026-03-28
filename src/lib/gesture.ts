// Gesture classification from MediaPipe hand landmarks — A-Z ASL Alphabet
// Enhanced with better finger-state detection, word suggestions, and phrase suggestions

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
  fingerStates?: boolean[];
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function isFingerExtended(landmarks: any[], tip: number, pip: number, mcp: number): boolean {
  return landmarks[tip].y < landmarks[pip].y && landmarks[pip].y < landmarks[mcp].y;
}

function isThumbOpen(landmarks: any[]): boolean {
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const thumbMcp = landmarks[2];
  const wrist = landmarks[0];
  const indexMcp = landmarks[5];
  // Determine handedness by wrist-to-index direction
  const isRightHand = indexMcp.x < wrist.x;
  if (isRightHand) {
    return thumbTip.x < thumbIp.x;
  }
  return thumbTip.x > thumbIp.x;
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

function isThumbAcrossPalm(landmarks: any[]): boolean {
  const thumbTip = landmarks[4];
  const indexMcp = landmarks[5];
  const pinkyMcp = landmarks[17];
  return thumbTip.x > Math.min(indexMcp.x, pinkyMcp.x) && thumbTip.x < Math.max(indexMcp.x, pinkyMcp.x);
}

export function classifyGesture(landmarks: any[]): GestureResult {
  if (!landmarks || landmarks.length < 21) {
    return { gesture: 'NONE', confidence: 0, label: 'No gesture', isAlphabet: false };
  }

  const indexExt = isFingerExtended(landmarks, 8, 6, 5);
  const middleExt = isFingerExtended(landmarks, 12, 10, 9);
  const ringExt = isFingerExtended(landmarks, 16, 14, 13);
  const pinkyExt = isFingerExtended(landmarks, 20, 18, 17);
  const thumbExt = isThumbOpen(landmarks);

  const fingerStates = [thumbExt, indexExt, middleExt, ringExt, pinkyExt];
  const extCount = [indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const pinkyTip = landmarks[20];
  const wrist = landmarks[0];
  const indexMcp = landmarks[5];
  const middleMcp = landmarks[9];

  const thumbIndexDist = distance(thumbTip, indexTip);
  const thumbMiddleDist = distance(thumbTip, middleTip);
  const indexMiddleDist = distance(indexTip, middleTip);
  const palmSize = distance(wrist, middleMcp);

  const make = (gesture: GestureType, confidence: number): GestureResult => ({
    gesture, confidence, label: gesture, isAlphabet: gesture.length === 1, fingerStates,
  });

  // --- Y: Thumb + pinky open, others closed (check early, very distinctive) ---
  if (pinkyExt && thumbExt && !indexExt && !middleExt && !ringExt) {
    return make('Y', 90);
  }

  // --- I: Only pinky extended, thumb closed ---
  if (!indexExt && !middleExt && !ringExt && pinkyExt && !thumbExt) {
    return make('I', 88);
  }

  // --- L: Thumb + index form L shape ---
  if (indexExt && !middleExt && !ringExt && !pinkyExt && thumbExt) {
    const angle = angleBetween(indexTip, landmarks[5], thumbTip);
    if (angle > 55) {
      return make('L', 86);
    }
  }

  // --- F: Thumb and index touch (circle), other three fingers open ---
  if (middleExt && ringExt && pinkyExt && thumbIndexDist < palmSize * 0.2) {
    return make('F', 86);
  }

  // --- W: Index, middle, ring extended, pinky closed ---
  if (indexExt && middleExt && ringExt && !pinkyExt) {
    return make('W', 84);
  }

  // --- R: Index and middle crossed/touching, extended up ---
  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    if (indexMiddleDist < palmSize * 0.08) {
      return make('R', 76);
    }
  }

  // --- U: Index and middle together parallel, extended up ---
  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    if (indexMiddleDist < palmSize * 0.18) {
      return make('U', 80);
    }
  }

  // --- K: Index + middle spread, thumb between ---
  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    if (indexMiddleDist > palmSize * 0.22 && thumbTip.y < landmarks[6].y) {
      return make('K', 78);
    }
  }

  // --- V: Index + middle spread apart ---
  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    if (indexMiddleDist > palmSize * 0.2) {
      return make('V', 83);
    }
  }

  // --- H: Index + middle extended sideways ---
  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    const avgDx = Math.abs((indexTip.x + middleTip.x) / 2 - (indexMcp.x + middleMcp.x) / 2);
    const avgDy = Math.abs((indexTip.y + middleTip.y) / 2 - (landmarks[6].y + landmarks[10].y) / 2);
    if (avgDx > avgDy) {
      return make('H', 76);
    }
  }

  // --- P: Like K but pointing down ---
  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    if (indexTip.y > indexMcp.y) {
      return make('P', 72);
    }
  }

  // --- D: Index up, others curled, thumb touches middle ---
  if (indexExt && !middleExt && !ringExt && !pinkyExt) {
    if (thumbMiddleDist < palmSize * 0.3) {
      return make('D', 80);
    }
  }

  // --- G: Index pointing sideways ---
  if (indexExt && !middleExt && !ringExt && !pinkyExt) {
    const dx = Math.abs(indexTip.x - indexMcp.x);
    const dy = Math.abs(indexTip.y - indexMcp.y);
    if (dx > dy) {
      return make('G', 76);
    }
  }

  // --- Q: Like G but pointing down ---
  if (indexExt && !middleExt && !ringExt && !pinkyExt) {
    if (indexTip.y > wrist.y) {
      return make('Q', 72);
    }
  }

  // --- Z: Index pointing (static approximation) ---
  if (indexExt && !middleExt && !ringExt && !pinkyExt && !thumbExt) {
    return make('Z', 65);
  }

  // --- B: Four fingers extended, thumb curled ---
  if (extCount === 4 && !thumbExt) {
    return make('B', 86);
  }

  // --- OPEN_PALM / 5: All fingers open ---
  if (extCount >= 4 && thumbExt) {
    return make('OPEN_PALM', 90);
  }

  // --- O: All fingertips close to thumb tip ---
  if (thumbIndexDist < palmSize * 0.15 && thumbMiddleDist < palmSize * 0.2) {
    return make('O', 80);
  }

  // --- C: Curved hand forming C ---
  if (extCount >= 2 && extCount <= 3) {
    const curveAngle = angleBetween(indexTip, landmarks[5], thumbTip);
    if (curveAngle > 40 && curveAngle < 100 && thumbIndexDist > palmSize * 0.3) {
      const fingerSpread = distance(indexTip, pinkyTip);
      if (fingerSpread < palmSize * 0.8) {
        return make('C', 72);
      }
    }
  }

  // --- X: Index hooked ---
  if (!indexExt && !middleExt && !ringExt && !pinkyExt) {
    if (landmarks[8].y > landmarks[6].y && landmarks[7].y < landmarks[6].y) {
      return make('X', 72);
    }
  }

  // --- E: All fingers curled, thumb across ---
  if (extCount === 0 && !thumbExt && isThumbAcrossPalm(landmarks)) {
    return make('E', 78);
  }

  // --- A: Fist with thumb to the side ---
  if (extCount === 0 && thumbExt && !isThumbAcrossPalm(landmarks)) {
    return make('A', 82);
  }

  // --- T: Thumb between index and middle in fist ---
  if (extCount === 0) {
    if (thumbTip.y < landmarks[6].y && thumbTip.y > landmarks[8].y) {
      return make('T', 72);
    }
  }

  // --- M: Three fingers over thumb ---
  if (extCount === 0 && !thumbExt) {
    if (landmarks[8].y > landmarks[4].y && landmarks[12].y > landmarks[4].y && landmarks[16].y > landmarks[4].y) {
      return make('M', 68);
    }
  }

  // --- N: Two fingers over thumb ---
  if (extCount === 0 && !thumbExt) {
    if (landmarks[8].y > landmarks[4].y && landmarks[12].y > landmarks[4].y && landmarks[16].y <= landmarks[4].y) {
      return make('N', 68);
    }
  }

  // --- S: Fist with thumb across ---
  if (extCount === 0 && !thumbExt) {
    return make('S', 75);
  }

  // --- THUMBS_UP ---
  if (thumbExt && extCount === 0) {
    return make('THUMBS_UP', 85);
  }

  // --- FIST ---
  if (extCount === 0 && !thumbExt) {
    return make('FIST', 85);
  }

  // --- J: Like I but with thumb (static approximation) ---
  if (!indexExt && !middleExt && !ringExt && pinkyExt && thumbExt) {
    return make('J', 70);
  }

  return { gesture: 'NONE', confidence: 0, label: 'No gesture', isAlphabet: false, fingerStates };
}

// ==================== WORD SUGGESTIONS ====================

const LETTER_WORDS: Record<string, string[]> = {
  A: ['Apple', 'Ask', 'Amazing', 'Alive', 'Always', 'About'],
  B: ['Book', 'Bring', 'Best', 'Better', 'Back', 'Buy'],
  C: ['Cat', 'Call', 'Create', 'Cool', 'Come', 'Can'],
  D: ['Dog', 'Do', 'Drive', 'Dream', 'Done', 'Day'],
  E: ['Eat', 'Enjoy', 'Energy', 'Easy', 'Every', 'End'],
  F: ['Food', 'Find', 'Fast', 'Fun', 'Family', 'Feel'],
  G: ['Go', 'Good', 'Great', 'Give', 'Get', 'Green'],
  H: ['Help', 'House', 'How', 'Happy', 'Hello', 'Home'],
  I: ['I', 'Idea', 'Important', 'Improve', 'In', 'Is'],
  J: ['Just', 'Join', 'Jump', 'Job', 'Joy', 'Juice'],
  K: ['Keep', 'Kind', 'Know', 'Key', 'Kid', 'King'],
  L: ['Love', 'Learn', 'Look', 'Live', 'Let', 'Light'],
  M: ['Make', 'More', 'Move', 'Money', 'My', 'Many'],
  N: ['New', 'Need', 'Nice', 'Now', 'Name', 'Next'],
  O: ['Open', 'Only', 'Order', 'Other', 'Out', 'Okay'],
  P: ['Play', 'Please', 'Put', 'Power', 'People', 'Place'],
  Q: ['Quick', 'Question', 'Quiet', 'Quite', 'Quality'],
  R: ['Run', 'Read', 'Right', 'Real', 'Rest', 'Room'],
  S: ['See', 'Say', 'Stop', 'Start', 'Stay', 'Safe'],
  T: ['Take', 'Tell', 'Try', 'Think', 'Thank', 'Time'],
  U: ['Use', 'Under', 'Up', 'Understand', 'Until', 'Us'],
  V: ['Very', 'View', 'Voice', 'Visit', 'Value'],
  W: ['Want', 'Work', 'Where', 'Why', 'Water', 'Wait'],
  X: ['X-ray', 'Xenon'],
  Y: ['You', 'Yes', 'Your', 'Young', 'Year'],
  Z: ['Zero', 'Zoom', 'Zone', 'Zen'],
};

const LETTER_PHRASES: Record<string, string[]> = {
  A: ['Are you okay?', 'All good', 'Almost done'],
  B: ['Be right back', 'Be careful', 'Bye for now'],
  C: ['Can you help?', 'Come here please', 'Call me later'],
  D: ["Don't worry", 'Do you understand?', 'Done with that'],
  E: ['Excuse me', 'Everything is fine', 'Eat something'],
  F: ['Feel better', 'Follow me', 'Find it please'],
  G: ['Good morning', 'Go ahead', 'Great job'],
  H: ['Help me', 'How are you?', 'Hello there', 'Hold on'],
  I: ['I need help', "I'm fine", "I don't understand", "I'm hungry"],
  J: ['Just a moment', 'Just kidding', 'Join us'],
  K: ['Keep going', 'Keep it up', 'Kind regards'],
  L: ['Let me know', 'Look at this', 'Love you'],
  M: ['More please', 'My name is…', 'Move over'],
  N: ['Not now', 'Need water', 'Nice to meet you', 'No problem'],
  O: ['On my way', 'Open the door', 'One moment'],
  P: ['Please wait', 'Please help', 'Put it here'],
  Q: ['Quick question', 'Quiet please'],
  R: ['Right away', 'Repeat please', 'Rest now'],
  S: ['Stop please', 'Start now', 'See you later', 'Stay safe'],
  T: ['Thank you', 'Take care', 'Tell me more', 'Try again'],
  U: ['Understood', 'Use this', 'Up ahead'],
  V: ['Very good', 'Visit soon'],
  W: ['Wait for me', 'Where is it?', 'Want this', 'Why not?'],
  X: ['X marks the spot'],
  Y: ['Yes please', 'You are welcome', 'Your turn'],
  Z: ['Zoom in', 'Zero issues'],
};

export function getWordSuggestions(prefix: string): string[] {
  if (!prefix || prefix.length < 1) return [];
  const upper = prefix.toUpperCase();
  // First try letter-based suggestions
  if (upper.length === 1 && LETTER_WORDS[upper]) {
    return LETTER_WORDS[upper].slice(0, 6);
  }
  // Then try prefix matching from word-sentence dictionary
  const allWords = Object.keys(WORD_SENTENCES);
  return allWords.filter(w => w.startsWith(upper) && w !== upper).slice(0, 5);
}

export function getLetterWords(letter: string): string[] {
  return LETTER_WORDS[letter.toUpperCase()] || [];
}

export function getLetterPhrases(letter: string): string[] {
  return LETTER_PHRASES[letter.toUpperCase()] || [];
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

export function wordToSentence(word: string): string {
  return WORD_SENTENCES[word.toUpperCase()] || word;
}

export function isEmergencyWord(word: string): boolean {
  const w = word.toUpperCase();
  return w === 'HELP' || w === 'SOS' || w === 'EMERGENCY';
}
