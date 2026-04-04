// Phrase gesture detection for dual-hand signs

function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
function isFingerExtended(landmarks, tip, pip) {
  return landmarks[tip].y < landmarks[pip].y;
}
function isThumbOpen(landmarks) {
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const wrist = landmarks[0];
  const indexMcp = landmarks[5];
  const isRightHand = indexMcp.x < wrist.x;
  return isRightHand ? thumbTip.x < thumbIp.x : thumbTip.x > thumbIp.x;
}
function getFingerStates(landmarks) {
  return [isThumbOpen(landmarks), isFingerExtended(landmarks, 8, 6), isFingerExtended(landmarks, 12, 10), isFingerExtended(landmarks, 16, 14), isFingerExtended(landmarks, 20, 18)];
}

// ========== Helper Functions for New Gestures ==========

function isFist(landmarks) {
  // All fingers folded close to palm
  const fingerTips = [8, 12, 16, 20]; // index, middle, ring, pinky tips
  const palmCenter = landmarks[0];
  for (const tipIdx of fingerTips) {
    if (distance(landmarks[tipIdx], palmCenter) > 0.1) return false;
  }
  return true;
}

function isAllFingersExtended(landmarks) {
  // All 5 fingers extended (thumb + 4 fingers)
  const states = getFingerStates(landmarks);
  return states.filter(Boolean).length >= 4; // at least 4 of 5 extended
}

function isHandFlat(landmarks) {
  // All fingers extended and roughly aligned horizontally
  const tips = [8, 12, 16, 20]; // index, middle, ring, pinky tips
  const tipYs = tips.map(i => landmarks[i].y);
  const maxY = Math.max(...tipYs);
  const minY = Math.min(...tipYs);
  return (maxY - minY) < 0.08 && tips.every(i => landmarks[i].y < landmarks[0].y);
}

function isCShape(landmarks) {
  // Fingers curved in C shape - thumb and index close, forming curve
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const dist_thumb_index = distance(thumbTip, indexTip);
  const dist_index_middle = distance(indexTip, middleTip);
  // C shape: thumb-index close, middle-ring-pinky curved
  return dist_thumb_index < 0.08 && dist_index_middle > 0.06;
}

function isThumbAndIndexPinch(landmarks) {
  // Thumb and index touching - HOW MUCH gesture
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const dist = distance(thumbTip, indexTip);
  const otherFingers = [12, 16, 20].map(i => landmarks[i]).every(tip => distance(tip, landmarks[0]) < 0.12);
  return dist < 0.05 && otherFingers;
}

function isILYSign(landmarks) {
  // I-L-Y: thumb extended, index extended, middle folded, ring folded, pinky extended
  const states = getFingerStates(landmarks);
  // states: [thumb, index, middle, ring, pinky]
  return states[0] && states[1] && !states[2] && !states[3] && states[4];
}

function isSingleIndexPointingUp(landmarks) {
  // Single index finger pointing upward, others folded
  const states = getFingerStates(landmarks);
  const indexTip = landmarks[8];
  const wrist = landmarks[0];
  // Index extended upward and highest
  return states[1] && !states[2] && !states[3] && !states[4] && indexTip.y < wrist.y * 0.7;
}

function isSingleIndexPointingForward(landmarks) {
  // Index pointing forward/outward
  const states = getFingerStates(landmarks);
  const indexTip = landmarks[8];
  const indexMcp = landmarks[5];
  const wrist = landmarks[0];
  const isRightHand = indexMcp.x < wrist.x;
  // Index extended and pointing outward
  const pointingOut = isRightHand ? indexTip.x > indexMcp.x : indexTip.x < indexMcp.x;
  return states[1] && !states[2] && !states[3] && !states[4] && pointingOut;
}

function areHandsVerticallyAligned(left, right) {
  // Check if hands are stacked vertically (like for COFFEE gesture)
  const leftWrist = left[0];
  const rightWrist = right[0];
  const horizontalDist = Math.abs(leftWrist.x - rightWrist.x);
  const verticalDist = Math.abs(leftWrist.y - rightWrist.y);
  // Hands close horizontally, one above the other
  return horizontalDist < 0.12 && verticalDist > 0.08;
}

function areHandsCrossing(left, right) {
  // Check if hands are crossing/overlapping
  const leftCenter = {
    x: (left[0].x + left[9].x) / 2,
    y: (left[0].y + left[9].y) / 2
  };
  const rightCenter = {
    x: (right[0].x + right[9].x) / 2,
    y: (right[0].y + right[9].y) / 2
  };
  return distance(leftCenter, rightCenter) < 0.15;
}

function areHandsClose(left, right) {
  // Check if hands are close to each other
  return distance(left[0], right[0]) < 0.12;
}

// Built-in dual-hand phrase gestures
const BUILTIN_PHRASES = [{
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
  }
}, {
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
  }
}, {
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
  }
}, {
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
  }
}, {
  label: 'Yes',
  check: (_left, right) => {
    if (!right) return 0;
    const rFingers = getFingerStates(right);
    // Fist nodding (simplified: fist shape)
    if (rFingers.filter(Boolean).length <= 1 && rFingers[0]) return 72;
    return 0;
  }
}, {
  label: 'No',
  check: (_left, right) => {
    if (!right) return 0;
    const rFingers = getFingerStates(right);
    // Index + middle extended snapping (simplified)
    if (rFingers[1] && rFingers[2] && !rFingers[3] && !rFingers[4] && rFingers[0]) return 70;
    return 0;
  }
}, {
  label: 'I Need Water',
  check: (left, right) => {
    // W shape with one hand near mouth
    if (!right) return 0;
    const rFingers = getFingerStates(right);
    if (rFingers[1] && rFingers[2] && rFingers[3] && !rFingers[4]) {
      if (right[8].y < right[0].y * 0.8) return 72;
    }
    return 0;
  }
}, {
  label: 'Good Morning',
  check: (left, right) => {
    if (!left || !right) return 0;
    const lFingers = getFingerStates(left);
    const rFingers = getFingerStates(right);
    // Both thumbs up
    if (lFingers[0] && !lFingers[1] && !lFingers[2] && rFingers[0] && !rFingers[1] && !rFingers[2]) return 78;
    return 0;
  }
}, {
  label: 'Come Here',
  check: (_left, right) => {
    if (!right) return 0;
    const rFingers = getFingerStates(right);
    // Index finger beckoning
    if (rFingers[1] && !rFingers[2] && !rFingers[3] && !rFingers[4]) {
      if (right[8].x < right[5].x) return 68;
    }
    return 0;
  }
}, {
  label: 'Call Me',
  check: (_left, right) => {
    if (!right) return 0;
    const rFingers = getFingerStates(right);
    // Thumb + pinky (phone gesture)
    if (rFingers[0] && !rFingers[1] && !rFingers[2] && !rFingers[3] && rFingers[4]) return 80;
    return 0;
  }
},
// ========== 10 NEW PHRASE GESTURES FOR HACKATHON ==========
{
  label: 'MY NAME IS',
  check: (left, right) => {
    // Right hand: index & middle extended horizontally
    // Left hand: index & middle extended vertically
    // Hands crossing/touching
    if (!left || !right) return 0;
    const lFingers = getFingerStates(left);
    const rFingers = getFingerStates(right);
    
    // Right: index and middle extended, others folded
    const rValid = rFingers[1] && rFingers[2] && !rFingers[3] && !rFingers[4];
    // Left: index and middle extended, others folded
    const lValid = lFingers[1] && lFingers[2] && !lFingers[3] && !lFingers[4];
    
    if (rValid && lValid) {
      // Check if hands are crossing
      if (areHandsCrossing(left, right)) {
        return 88;
      }
    }
    return 0;
  }
},
{
  label: 'ARE',
  check: (left, right) => {
    // Both thumbs extended upward, other fingers folded
    if (!left || !right) return 0;
    const lFingers = getFingerStates(left);
    const rFingers = getFingerStates(right);
    
    // Both thumbs only extended
    const lThumbOnly = lFingers[0] && !lFingers[1] && !lFingers[2] && !lFingers[3] && !lFingers[4];
    const rThumbOnly = rFingers[0] && !rFingers[1] && !rFingers[2] && !rFingers[3] && !rFingers[4];
    
    if (lThumbOnly && rThumbOnly) {
      // Check thumbs are pointing upward
      const lThumbUp = left[4].y < left[3].y;
      const rThumbUp = right[4].y < right[3].y;
      if (lThumbUp && rThumbUp && areHandsClose(left, right)) {
        return 85;
      }
    }
    return 0;
  }
},
{
  label: 'YOU',
  check: (_left, right) => {
    // Single hand pointing forward - index extended
    if (!right) return 0;
    if (isSingleIndexPointingForward(right)) {
      return 82;
    }
    return 0;
  }
},
{
  label: 'CHOCOLATE',
  check: (left, right) => {
    // Left hand: all fingers extended flat
    // Right hand: C-shape above left hand
    if (!left || !right) return 0;
    
    const lFlat = isHandFlat(left);
    const rCShape = isCShape(right);
    
    if (lFlat && rCShape) {
      // Check vertical separation
      const verticalDist = left[0].y - right[0].y;
      if (verticalDist > 0.05) {
        return 86;
      }
    }
    return 0;
  }
},
{
  label: 'COFFEE',
  check: (left, right) => {
    // Both hands: fists stacked vertically
    if (!left || !right) return 0;
    
    const lFist = isFist(left);
    const rFist = isFist(right);
    
    if (lFist && rFist) {
      if (areHandsVerticallyAligned(left, right)) {
        return 84;
      }
    }
    return 0;
  }
},
{
  label: 'HOW MUCH',
  check: (_left, right) => {
    // Single hand: thumb and index pinching, others folded
    if (!right) return 0;
    
    if (isThumbAndIndexPinch(right)) {
      return 83;
    }
    return 0;
  }
},
{
  label: 'I LOVE YOU',
  check: (_left, right) => {
    // Single hand: ILY sign (thumb, index, pinky extended; middle, ring folded)
    if (!right) return 0;
    
    if (isILYSign(right)) {
      return 87;
    }
    return 0;
  }
},
{
  label: 'WASHROOM',
  check: (_left, right) => {
    // Single hand: fist (all fingers folded)
    if (!right) return 0;
    
    if (isFist(right)) {
      return 81;
    }
    return 0;
  }
},
{
  label: 'PAIN',
  check: (left, right) => {
    // Both hands: index fingers touching, thumbs extended
    if (!left || !right) return 0;
    
    const lFingers = getFingerStates(left);
    const rFingers = getFingerStates(right);
    
    // Both: index extended, thumb extended, others folded
    const lValid = lFingers[0] && lFingers[1] && !lFingers[2] && !lFingers[3] && !lFingers[4];
    const rValid = rFingers[0] && rFingers[1] && !rFingers[2] && !rFingers[3] && !rFingers[4];
    
    if (lValid && rValid) {
      // Check if index fingers are touching
      const dist = distance(left[8], right[8]);
      if (dist < 0.06) {
        return 85;
      }
    }
    return 0;
  }
},
{
  label: 'WHERE',
  check: (_left, right) => {
    // Single hand: index pointing upward only
    if (!right) return 0;
    
    if (isSingleIndexPointingUp(right)) {
      return 80;
    }
    return 0;
  }
}
];
const PHRASE_SUGGESTIONS = {
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
  // ========== NEW GESTURE SUGGESTIONS ==========
  'MY NAME IS': ['My name is...', 'I am called...', 'You can call me...'],
  'ARE': ['Are you ready?', 'Are you sure?', 'Are you there?'],
  'YOU': ['You are great!', 'You did well', 'I see you'],
  'CHOCOLATE': ['I like chocolate', 'Do you have chocolate?', 'Chocolate is delicious'],
  'COFFEE': ['I need coffee', 'Coffee time', 'Let\'s have coffee'],
  'HOW MUCH': ['How much is it?', 'How much does it cost?', 'What\'s the price?'],
  'I LOVE YOU': ['I love you', 'You are special', 'I care about you'],
  'WASHROOM': ['Where is the washroom?', 'I need the washroom', 'Bathroom please'],
  'PAIN': ['I have pain', 'It hurts here', 'I am in pain'],
  'WHERE': ['Where are you?', 'Where is it?', 'Where did you go?']
};
export function classifyPhrase(hands) {
  const leftHand = hands.find(h => h.handedness === 'Left')?.landmarks || null;
  const rightHand = hands.find(h => h.handedness === 'Right')?.landmarks || null;

  // Check custom gestures first
  const customs = getCustomGestures();
  for (const custom of customs) {
    const score = matchCustomGesture(custom, leftHand, rightHand);
    if (score > 70) {
      return {
        phrase: custom.label,
        confidence: score,
        label: custom.label
      };
    }
  }

  // Check built-in phrases
  let bestPhrase = null;
  let bestConf = 0;
  for (const p of BUILTIN_PHRASES) {
    const conf = p.check(leftHand, rightHand);
    if (conf > bestConf) {
      bestConf = conf;
      bestPhrase = p.label;
    }
  }
  if (bestPhrase && bestConf > 65) {
    return {
      phrase: bestPhrase,
      confidence: bestConf,
      label: bestPhrase
    };
  }
  return {
    phrase: null,
    confidence: 0,
    label: 'No phrase detected'
  };
}
export function getPhraseSuggestions(phrase) {
  return PHRASE_SUGGESTIONS[phrase] || [];
}

// ========== Custom Gesture Storage ==========

const STORAGE_KEY = 'signvoice_custom_gestures';
export function getCustomGestures() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
export function saveCustomGesture(label, hands) {
  const leftHand = hands.find(h => h.handedness === 'Left');
  const rightHand = hands.find(h => h.handedness === 'Right');
  const gesture = {
    id: Date.now().toString(),
    label,
    leftLandmarks: leftHand ? leftHand.landmarks.map(l => [l.x, l.y, l.z]) : null,
    rightLandmarks: rightHand ? rightHand.landmarks.map(l => [l.x, l.y, l.z]) : null,
    fingerStatesLeft: leftHand ? getFingerStates(leftHand.landmarks) : [],
    fingerStatesRight: rightHand ? getFingerStates(rightHand.landmarks) : [],
    timestamp: Date.now()
  };
  const existing = getCustomGestures();
  existing.push(gesture);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  return gesture;
}
export function deleteCustomGesture(id) {
  const existing = getCustomGestures().filter(g => g.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}
function matchCustomGesture(stored, left, right) {
  let score = 0;
  let checks = 0;
  if (stored.fingerStatesRight.length > 0 && right) {
    const current = getFingerStates(right);
    let matches = 0;
    for (let i = 0; i < 5; i++) {
      if (current[i] === stored.fingerStatesRight[i]) matches++;
    }
    score += matches / 5 * 100;
    checks++;
  }
  if (stored.fingerStatesLeft.length > 0 && left) {
    const current = getFingerStates(left);
    let matches = 0;
    for (let i = 0; i < 5; i++) {
      if (current[i] === stored.fingerStatesLeft[i]) matches++;
    }
    score += matches / 5 * 100;
    checks++;
  }
  if (checks === 0) return 0;
  return Math.round(score / checks);
}