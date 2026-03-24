// Gesture classification from MediaPipe hand landmarks

export type GestureType = 'THUMBS_UP' | 'FIST' | 'TWO_FINGERS' | 'OPEN_PALM' | 'POINT' | 'NONE';

export interface GestureResult {
  gesture: GestureType;
  confidence: number;
  label: string;
  sentence: string;
}

const GESTURE_MAP: Record<GestureType, { label: string; sentence: string }> = {
  THUMBS_UP: { label: 'YES', sentence: 'Yes' },
  FIST: { label: 'NO', sentence: 'No' },
  TWO_FINGERS: { label: 'HELP', sentence: 'I need help' },
  OPEN_PALM: { label: 'STOP', sentence: 'Please stop' },
  POINT: { label: 'POINT', sentence: 'I want to point something out' },
  NONE: { label: 'No gesture', sentence: '' },
};

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function isFingerExtended(landmarks: any[], tip: number, pip: number, mcp: number): boolean {
  return landmarks[tip].y < landmarks[pip].y && landmarks[pip].y < landmarks[mcp].y;
}

export function classifyGesture(landmarks: any[]): GestureResult {
  if (!landmarks || landmarks.length < 21) {
    return { gesture: 'NONE', confidence: 0, ...GESTURE_MAP.NONE };
  }

  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const thumbMcp = landmarks[2];
  const indexTip = landmarks[8];
  const indexPip = landmarks[6];
  const indexMcp = landmarks[5];
  const middleTip = landmarks[12];
  const middlePip = landmarks[10];
  const middleMcp = landmarks[9];
  const ringTip = landmarks[16];
  const ringPip = landmarks[14];
  const ringMcp = landmarks[13];
  const pinkyTip = landmarks[20];
  const pinkyPip = landmarks[18];
  const pinkyMcp = landmarks[17];
  const wrist = landmarks[0];

  const indexExtended = isFingerExtended(landmarks, 8, 6, 5);
  const middleExtended = isFingerExtended(landmarks, 12, 10, 9);
  const ringExtended = isFingerExtended(landmarks, 16, 14, 13);
  const pinkyExtended = isFingerExtended(landmarks, 20, 18, 17);
  const thumbExtended = thumbTip.y < thumbMcp.y && distance(thumbTip, wrist) > distance(thumbMcp, wrist);

  const extendedCount = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;

  // OPEN_PALM: all fingers extended
  if (extendedCount >= 4 && thumbExtended) {
    return { gesture: 'OPEN_PALM', confidence: 92, ...GESTURE_MAP.OPEN_PALM };
  }

  // FIST: no fingers extended
  if (extendedCount === 0 && !thumbExtended) {
    return { gesture: 'FIST', confidence: 90, ...GESTURE_MAP.FIST };
  }

  // THUMBS_UP: only thumb extended, fingers curled
  if (thumbExtended && extendedCount === 0) {
    return { gesture: 'THUMBS_UP', confidence: 88, ...GESTURE_MAP.THUMBS_UP };
  }

  // POINT: only index extended
  if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    return { gesture: 'POINT', confidence: 85, ...GESTURE_MAP.POINT };
  }

  // TWO_FINGERS: index + middle extended (peace/victory)
  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
    return { gesture: 'TWO_FINGERS', confidence: 87, ...GESTURE_MAP.TWO_FINGERS };
  }

  return { gesture: 'NONE', confidence: 0, ...GESTURE_MAP.NONE };
}

export function getGestureInfo(gesture: GestureType) {
  return GESTURE_MAP[gesture];
}
