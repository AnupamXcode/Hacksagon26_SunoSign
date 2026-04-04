// Number gesture classification (1-10) from MediaPipe 21 hand landmarks

const NUMBER_NAMES = {
  1: 'One',
  2: 'Two',
  3: 'Three',
  4: 'Four',
  5: 'Five',
  6: 'Six',
  7: 'Seven',
  8: 'Eight',
  9: 'Nine',
  10: 'Ten'
};

// Finger state patterns: [thumb, index, middle, ring, pinky]
const NUMBER_PATTERNS = [[1, [false, true, false, false, false]], [2, [false, true, true, false, false]], [3, [false, true, true, true, false]], [4, [false, true, true, true, true]], [5, [true, true, true, true, true]], [6, [true, false, false, false, true]], [7, [true, false, false, true, false]], [8, [true, false, true, false, false]], [9, [false, false, false, false, true]], [10, [true, false, false, false, false]]];
function isFingerOpen(landmarks, tip, pip) {
  return landmarks[tip].y < landmarks[pip].y;
}
function isThumbOpen(landmarks) {
  // Use x-axis: thumb tip should be further from palm than thumb IP
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const wrist = landmarks[0];
  const indexMcp = landmarks[5];

  // Determine hand orientation by checking if index MCP is left or right of wrist
  const isRightHand = indexMcp.x < wrist.x; // mirrored camera

  if (isRightHand) {
    return thumbTip.x < thumbIp.x;
  } else {
    return thumbTip.x > thumbIp.x;
  }
}
export function classifyNumber(landmarks) {
  const none = {
    number: null,
    label: 'No number',
    confidence: 0,
    fingerStates: {
      thumb: false,
      index: false,
      middle: false,
      ring: false,
      pinky: false
    }
  };
  if (!landmarks || landmarks.length < 21) return none;
  const thumb = isThumbOpen(landmarks);
  const index = isFingerOpen(landmarks, 8, 6);
  const middle = isFingerOpen(landmarks, 12, 10);
  const ring = isFingerOpen(landmarks, 16, 14);
  const pinky = isFingerOpen(landmarks, 20, 18);
  const states = [thumb, index, middle, ring, pinky];
  const fingerStates = {
    thumb,
    index,
    middle,
    ring,
    pinky
  };

  // Find best matching pattern
  let bestMatch = null;
  let bestScore = -1;
  for (const [num, pattern] of NUMBER_PATTERNS) {
    let matches = 0;
    for (let i = 0; i < 5; i++) {
      if (states[i] === pattern[i]) matches++;
    }
    if (matches > bestScore) {
      bestScore = matches;
      bestMatch = num;
    }
  }
  if (bestScore >= 4 && bestMatch !== null) {
    const confidence = Math.round(bestScore / 5 * 100);
    return {
      number: bestMatch,
      label: NUMBER_NAMES[bestMatch] || String(bestMatch),
      confidence,
      fingerStates
    };
  }
  return {
    ...none,
    fingerStates
  };
}
export function numberToWord(n) {
  return NUMBER_NAMES[n] || String(n);
}