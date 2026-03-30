// SunoSign Gesture Engine — 16 strict gesture mappings with movement & orientation detection

export type SunoGestureType =
  | 'MY_NAME_IS' | 'FATHER' | 'MOTHER' | 'SEE_YOU_LATER'
  | 'CAT' | 'HELP' | 'REPEAT' | 'PAIN'
  | 'MORE' | 'WHERE' | 'RESTROOM' | 'I_LOVE_YOU'
  | 'HOW_ARE_YOU' | 'HOW_MUCH' | 'CHOCOLATE' | 'COFFEE'
  | 'NONE';

export interface SunoGestureResult {
  gesture: SunoGestureType;
  confidence: number;
  label: string;
  sentence: string;
  fingerStates: boolean[];
  movement: 'static' | 'wave' | 'forward' | 'circular' | 'shake' | 'pinch' | 'tilt' | 'inward' | 'tap';
  orientation: 'vertical' | 'horizontal' | 'down' | 'up' | 'forward' | 'neutral';
}

const GESTURE_SENTENCES: Record<SunoGestureType, string> = {
  MY_NAME_IS: 'My name is...',
  FATHER: 'Father',
  MOTHER: 'Mother',
  SEE_YOU_LATER: 'See you later!',
  CAT: 'Cat',
  HELP: 'I need help',
  REPEAT: 'Please repeat',
  PAIN: 'I am in pain',
  MORE: 'I want more',
  WHERE: 'Where is it?',
  RESTROOM: 'Where is the restroom?',
  I_LOVE_YOU: 'I love you',
  HOW_ARE_YOU: 'How are you?',
  HOW_MUCH: 'How much does it cost?',
  CHOCOLATE: 'I want chocolate',
  COFFEE: 'I want coffee',
  NONE: '',
};

const GESTURE_LABELS: Record<SunoGestureType, string> = {
  MY_NAME_IS: '👉 My Name Is',
  FATHER: '👋 Father',
  MOTHER: '🤲 Mother',
  SEE_YOU_LATER: '👋 See You Later',
  CAT: '🐱 Cat',
  HELP: '☝️ Help',
  REPEAT: '🔄 Repeat',
  PAIN: '✊ Pain',
  MORE: '🤏 More',
  WHERE: '👈 Where',
  RESTROOM: '🚻 Restroom',
  I_LOVE_YOU: '🤟 I Love You',
  HOW_ARE_YOU: '🖐️ How Are You',
  HOW_MUCH: '🤏 How Much',
  CHOCOLATE: '🍫 Chocolate',
  COFFEE: '☕ Coffee',
  NONE: 'No Gesture',
};

// Movement history tracker
interface FrameData {
  wrist: { x: number; y: number; z: number };
  indexTip: { x: number; y: number };
  palmCenter: { x: number; y: number };
  fingerStates: boolean[];
  timestamp: number;
}

const frameHistory: FrameData[] = [];
const MAX_HISTORY = 20;

function distance2D(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function getFingerStates(landmarks: any[]): boolean[] {
  const thumbOpen = (() => {
    const tip = landmarks[4];
    const ip = landmarks[3];
    const wrist = landmarks[0];
    const indexMcp = landmarks[5];
    const isRightHand = indexMcp.x < wrist.x;
    return isRightHand ? tip.x < ip.x : tip.x > ip.x;
  })();
  const indexOpen = landmarks[8].y < landmarks[6].y;
  const middleOpen = landmarks[12].y < landmarks[10].y;
  const ringOpen = landmarks[16].y < landmarks[14].y;
  const pinkyOpen = landmarks[20].y < landmarks[18].y;
  return [thumbOpen, indexOpen, middleOpen, ringOpen, pinkyOpen];
}

function getPalmOrientation(landmarks: any[]): 'vertical' | 'horizontal' | 'down' | 'up' | 'forward' | 'neutral' {
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  const dx = Math.abs(middleMcp.x - wrist.x);
  const dy = middleMcp.y - wrist.y;

  // Palm pointing down (fingers below wrist)
  if (dy > 0.08 && dy > dx) return 'down';
  // Palm vertical (fingers above wrist)
  if (dy < -0.08 && Math.abs(dy) > dx) return 'vertical';
  // Palm horizontal
  if (dx > Math.abs(dy) && dx > 0.06) return 'horizontal';

  // Check z-depth for forward orientation
  const avgZ = (landmarks[5].z + landmarks[9].z + landmarks[13].z + landmarks[17].z) / 4;
  if (avgZ < wrist.z - 0.02) return 'forward';

  return 'neutral';
}

type MovementType = 'static' | 'wave' | 'forward' | 'circular' | 'shake' | 'pinch' | 'tilt' | 'inward' | 'tap';

function detectMovement(): MovementType {
  if (frameHistory.length < 6) return 'static';

  const recent = frameHistory.slice(-10);
  const wristPositions = recent.map(f => f.wrist);

  // Horizontal oscillation → wave
  if (wristPositions.length >= 6) {
    let dirChangesX = 0;
    for (let i = 2; i < wristPositions.length; i++) {
      const prev = wristPositions[i - 1].x - wristPositions[i - 2].x;
      const curr = wristPositions[i].x - wristPositions[i - 1].x;
      if (prev * curr < 0 && Math.abs(curr) > 0.005) dirChangesX++;
    }
    if (dirChangesX >= 3) return 'wave';
  }

  // Horizontal side-to-side (index finger) → WHERE movement
  if (recent.length >= 6) {
    const indexPositions = recent.map(f => f.indexTip);
    let dirChanges = 0;
    for (let i = 2; i < indexPositions.length; i++) {
      const prev = indexPositions[i - 1].x - indexPositions[i - 2].x;
      const curr = indexPositions[i].x - indexPositions[i - 1].x;
      if (prev * curr < 0 && Math.abs(curr) > 0.004) dirChanges++;
    }
    if (dirChanges >= 2) return 'wave'; // reuse wave for side-to-side
  }

  // Shake (small rapid movement in any direction)
  if (wristPositions.length >= 4) {
    const totalMovement = wristPositions.slice(1).reduce((sum, p, i) =>
      sum + distance2D(p, wristPositions[i]), 0);
    const netMovement = distance2D(wristPositions[0], wristPositions[wristPositions.length - 1]);
    if (totalMovement > 0.06 && netMovement < totalMovement * 0.3) return 'shake';
  }

  // Forward movement (z decreasing or y moving toward camera = upward in screen)
  if (wristPositions.length >= 4) {
    const first = recent[0].wrist;
    const last = recent[recent.length - 1].wrist;
    if (first.z - last.z > 0.03) return 'forward';
  }

  // Inward movement (wrist moving toward center/body)
  if (wristPositions.length >= 4) {
    const first = recent[0].wrist;
    const last = recent[recent.length - 1].wrist;
    const inwardDist = Math.abs(last.x - 0.5) - Math.abs(first.x - 0.5);
    if (inwardDist < -0.04) return 'inward';
  }

  // Circular motion
  if (wristPositions.length >= 8) {
    let totalAngle = 0;
    const cx = wristPositions.reduce((s, p) => s + p.x, 0) / wristPositions.length;
    const cy = wristPositions.reduce((s, p) => s + p.y, 0) / wristPositions.length;
    for (let i = 1; i < wristPositions.length; i++) {
      const a1 = Math.atan2(wristPositions[i - 1].y - cy, wristPositions[i - 1].x - cx);
      const a2 = Math.atan2(wristPositions[i].y - cy, wristPositions[i].x - cx);
      let da = a2 - a1;
      if (da > Math.PI) da -= 2 * Math.PI;
      if (da < -Math.PI) da += 2 * Math.PI;
      totalAngle += da;
    }
    if (Math.abs(totalAngle) > Math.PI * 1.2) return 'circular';
  }

  // Tilt (wrist rotating)
  if (recent.length >= 4) {
    const first = recent[0].wrist;
    const last = recent[recent.length - 1].wrist;
    if (Math.abs(last.y - first.y) > 0.04 && Math.abs(last.x - first.x) < 0.02) return 'tilt';
  }

  // Tap / pinch detection (fingers closing repeatedly)
  if (recent.length >= 6) {
    const states = recent.map(f => f.fingerStates);
    let openCloseChanges = 0;
    for (let i = 1; i < states.length; i++) {
      const prevOpen = states[i - 1].filter(Boolean).length;
      const currOpen = states[i].filter(Boolean).length;
      if (Math.abs(prevOpen - currOpen) >= 2) openCloseChanges++;
    }
    if (openCloseChanges >= 3) return 'tap';
    // Pinch: thumb+index distance oscillating
    if (openCloseChanges >= 1) return 'pinch';
  }

  return 'static';
}

function matchesFingerPattern(states: boolean[], pattern: number[]): boolean {
  for (let i = 0; i < 5; i++) {
    if (pattern[i] !== -1 && (states[i] ? 1 : 0) !== pattern[i]) return false;
  }
  return true;
}

export function classifySunoGesture(landmarks: any[]): SunoGestureResult {
  const none: SunoGestureResult = {
    gesture: 'NONE', confidence: 0, label: 'No Gesture', sentence: '',
    fingerStates: [false, false, false, false, false],
    movement: 'static', orientation: 'neutral',
  };

  if (!landmarks || landmarks.length < 21) return none;

  const fingerStates = getFingerStates(landmarks);
  const orientation = getPalmOrientation(landmarks);

  // Record frame
  const palmCenter = {
    x: (landmarks[0].x + landmarks[9].x) / 2,
    y: (landmarks[0].y + landmarks[9].y) / 2,
  };
  frameHistory.push({
    wrist: { x: landmarks[0].x, y: landmarks[0].y, z: landmarks[0].z || 0 },
    indexTip: { x: landmarks[8].x, y: landmarks[8].y },
    palmCenter,
    fingerStates: [...fingerStates],
    timestamp: Date.now(),
  });
  if (frameHistory.length > MAX_HISTORY) frameHistory.shift();

  const movement = detectMovement();
  const [thumb, index, middle, ring, pinky] = fingerStates;

  const make = (gesture: SunoGestureType, confidence: number): SunoGestureResult => ({
    gesture, confidence,
    label: GESTURE_LABELS[gesture],
    sentence: GESTURE_SENTENCES[gesture],
    fingerStates, movement, orientation,
  });

  // ===== 12. I_LOVE_YOU: [1,1,0,0,1] — very distinctive =====
  if (matchesFingerPattern(fingerStates, [1, 1, 0, 0, 1])) {
    return make('I_LOVE_YOU', 92);
  }

  // ===== 16. COFFEE: [1,0,0,0,1] + tilt =====
  if (matchesFingerPattern(fingerStates, [1, 0, 0, 0, 1])) {
    if (movement === 'tilt' || movement === 'static') {
      return make('COFFEE', 80);
    }
  }

  // ===== 14. HOW_MUCH: [1,1,0,0,0] + pinch =====
  if (matchesFingerPattern(fingerStates, [1, 1, 0, 0, 0])) {
    const thumbIndexDist = distance2D(landmarks[4], landmarks[8]);
    const palmSize = distance2D(landmarks[0], landmarks[9]);
    if (thumbIndexDist < palmSize * 0.2 || movement === 'pinch') {
      return make('HOW_MUCH', 82);
    }
  }

  // ===== 11. RESTROOM: [0,1,1,1,0] — three fingers up =====
  if (matchesFingerPattern(fingerStates, [0, 1, 1, 1, 0]) && (orientation === 'vertical' || orientation === 'up')) {
    return make('RESTROOM', 85);
  }

  // ===== 5. CAT: [0,1,1,0,0] + possible twitch =====
  if (matchesFingerPattern(fingerStates, [0, 1, 1, 0, 0])) {
    // 7. REPEAT: same fingers but circular motion
    if (movement === 'circular') {
      return make('REPEAT', 80);
    }
    return make('CAT', 82);
  }

  // ===== Check all-open gestures [1,1,1,1,1] — multiple meanings by movement/orientation =====
  if (matchesFingerPattern(fingerStates, [1, 1, 1, 1, 1])) {
    // 4. SEE_YOU_LATER: wave
    if (movement === 'wave') {
      return make('SEE_YOU_LATER', 88);
    }
    // 13. HOW_ARE_YOU: forward push
    if (movement === 'forward') {
      return make('HOW_ARE_YOU', 82);
    }
    // 15. CHOCOLATE: inward movement (toward mouth)
    if (movement === 'inward') {
      return make('CHOCOLATE', 78);
    }
    // 3. MOTHER: downward/relaxed palm
    if (orientation === 'down' || orientation === 'horizontal') {
      return make('MOTHER', 80);
    }
    // 2. FATHER: vertical/upright palm
    if (orientation === 'vertical' || orientation === 'neutral' || orientation === 'forward') {
      return make('FATHER', 80);
    }
    return make('FATHER', 72);
  }

  // ===== Single index finger gestures [0,1,0,0,0] — multiple meanings by movement =====
  if (matchesFingerPattern(fingerStates, [0, 1, 0, 0, 0])) {
    // 10. WHERE: side-to-side
    if (movement === 'wave' || movement === 'shake') {
      return make('WHERE', 82);
    }
    // 1. MY_NAME_IS: inward motion
    if (movement === 'inward') {
      return make('MY_NAME_IS', 80);
    }
    // 6. HELP: static, upward
    return make('HELP', 85);
  }

  // ===== 8. PAIN: fist [0,0,0,0,0] + shake =====
  if (matchesFingerPattern(fingerStates, [0, 0, 0, 0, 0])) {
    return make('PAIN', movement === 'shake' ? 85 : 78);
  }

  // ===== 9. MORE: dynamic open→close (tap movement) =====
  if (movement === 'tap' || movement === 'pinch') {
    const openCount = fingerStates.filter(Boolean).length;
    if (openCount >= 2 && openCount <= 4) {
      return make('MORE', 75);
    }
  }

  return { ...none, fingerStates, movement, orientation };
}

export function getSentence(gesture: SunoGestureType): string {
  return GESTURE_SENTENCES[gesture];
}

export function getGestureLabel(gesture: SunoGestureType): string {
  return GESTURE_LABELS[gesture];
}

// Gesture guide data for reference
export const GESTURE_GUIDE: { gesture: SunoGestureType; fingers: string; movement: string; emoji: string }[] = [
  { gesture: 'MY_NAME_IS', fingers: '☝️ Index only', movement: 'Point to chest', emoji: '👉' },
  { gesture: 'FATHER', fingers: '🖐️ All open', movement: 'Palm upright', emoji: '👋' },
  { gesture: 'MOTHER', fingers: '🖐️ All open', movement: 'Palm relaxed/down', emoji: '🤲' },
  { gesture: 'SEE_YOU_LATER', fingers: '🖐️ All open', movement: 'Wave side-to-side', emoji: '👋' },
  { gesture: 'CAT', fingers: '✌️ Index + Middle', movement: 'Slight twitch', emoji: '🐱' },
  { gesture: 'HELP', fingers: '☝️ Index only', movement: 'Static, upward', emoji: '🆘' },
  { gesture: 'REPEAT', fingers: '✌️ Index + Middle', movement: 'Circular motion', emoji: '🔄' },
  { gesture: 'PAIN', fingers: '✊ All closed', movement: 'Slight shake', emoji: '😣' },
  { gesture: 'MORE', fingers: '🤏 Dynamic', movement: 'Open → Close repeatedly', emoji: '➕' },
  { gesture: 'WHERE', fingers: '☝️ Index only', movement: 'Side-to-side', emoji: '❓' },
  { gesture: 'RESTROOM', fingers: '🤟 Index+Mid+Ring', movement: 'Three fingers up', emoji: '🚻' },
  { gesture: 'I_LOVE_YOU', fingers: '🤟 Thumb+Index+Pinky', movement: 'Static', emoji: '❤️' },
  { gesture: 'HOW_ARE_YOU', fingers: '🖐️ All open', movement: 'Push forward', emoji: '🙋' },
  { gesture: 'HOW_MUCH', fingers: '🤏 Thumb + Index', movement: 'Pinch motion', emoji: '💰' },
  { gesture: 'CHOCOLATE', fingers: '🖐️ All open', movement: 'Toward mouth', emoji: '🍫' },
  { gesture: 'COFFEE', fingers: '🤙 Thumb + Pinky', movement: 'Tilt like drinking', emoji: '☕' },
];
