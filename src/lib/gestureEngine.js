// Enhanced Gesture Classification Engine for SunoSign AI
// Improved accuracy with better landmark analysis, angles, distances, and motion tracking

// ==================== GEOMETRY HELPERS ====================

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
function dist3D(a, b) {
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + dz * dz);
}
function angleBetween(a, b, c) {
  const ab = {
    x: a.x - b.x,
    y: a.y - b.y
  };
  const cb = {
    x: c.x - b.x,
    y: c.y - b.y
  };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.sqrt(ab.x ** 2 + ab.y ** 2) * Math.sqrt(cb.x ** 2 + cb.y ** 2);
  if (mag === 0) return 0;
  return Math.acos(Math.min(1, Math.max(-1, dot / mag))) * (180 / Math.PI);
}

// Finger curl ratio: 0 = fully extended, 1 = fully curled
function fingerCurl(landmarks, mcp, pip, dip, tip) {
  const mcpPip = dist(landmarks[mcp], landmarks[pip]);
  const pipDip = dist(landmarks[pip], landmarks[dip]);
  const dipTip = dist(landmarks[dip], landmarks[tip]);
  const mcpTip = dist(landmarks[mcp], landmarks[tip]);
  const totalLength = mcpPip + pipDip + dipTip;
  if (totalLength === 0) return 0;
  const straightness = mcpTip / totalLength;
  return 1 - straightness;
}

// ==================== FINGER STATE DETECTION ====================

function isFingerExtended(landmarks, tip, pip, mcp) {
  // Use both y-position comparison AND curl ratio for better accuracy
  const yExtended = landmarks[tip].y < landmarks[pip].y && landmarks[pip].y < landmarks[mcp].y;
  const dip = pip + 1; // DIP is always PIP + 1
  const curl = fingerCurl(landmarks, mcp, pip, dip, tip);
  return yExtended || curl < 0.35;
}
function isThumbOpen(landmarks) {
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const thumbMcp = landmarks[2];
  const wrist = landmarks[0];
  const indexMcp = landmarks[5];

  // Determine handedness
  const isRightHand = indexMcp.x < wrist.x;

  // Primary check: x-axis spread
  const xSpread = isRightHand ? thumbIp.x - thumbTip.x : thumbTip.x - thumbIp.x;

  // Secondary check: distance from palm center
  const palmCenter = {
    x: (landmarks[5].x + landmarks[17].x) / 2,
    y: (landmarks[5].y + landmarks[17].y) / 2
  };
  const tipDist = dist(thumbTip, palmCenter);
  const mcpDist = dist(thumbMcp, palmCenter);
  return xSpread > 0.01 || tipDist > mcpDist * 1.2;
}
function isThumbAcrossPalm(landmarks) {
  const thumbTip = landmarks[4];
  const indexMcp = landmarks[5];
  const pinkyMcp = landmarks[17];
  const minX = Math.min(indexMcp.x, pinkyMcp.x);
  const maxX = Math.max(indexMcp.x, pinkyMcp.x);
  return thumbTip.x > minX && thumbTip.x < maxX;
}
function isFingerBent(landmarks, tip, dip, pip) {
  // Finger DIP is bent (hooked shape)
  return landmarks[tip].y > landmarks[dip].y && landmarks[dip].y < landmarks[pip].y;
}

// ==================== MAIN CLASSIFICATION ====================

export function classifyGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return {
      gesture: 'NONE',
      confidence: 0,
      label: 'No gesture',
      isAlphabet: false
    };
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
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  const wrist = landmarks[0];
  const indexMcp = landmarks[5];
  const middleMcp = landmarks[9];
  const indexPip = landmarks[6];
  const middlePip = landmarks[10];
  const thumbIndexDist = dist(thumbTip, indexTip);
  const thumbMiddleDist = dist(thumbTip, middleTip);
  const indexMiddleDist = dist(indexTip, middleTip);
  const palmSize = dist(wrist, middleMcp);

  // Curl ratios for better differentiation
  const indexCurl = fingerCurl(landmarks, 5, 6, 7, 8);
  const middleCurl = fingerCurl(landmarks, 9, 10, 11, 12);
  const ringCurl = fingerCurl(landmarks, 13, 14, 15, 16);
  const pinkyCurl = fingerCurl(landmarks, 17, 18, 19, 20);
  const make = (gesture, confidence) => ({
    gesture,
    confidence,
    label: gesture,
    isAlphabet: gesture.length === 1,
    fingerStates
  });

  // ===== HIGH-CONFIDENCE DISTINCTIVE GESTURES (check first) =====

  // --- Y + pinky open, others closed ---
  if (pinkyExt && thumbExt && !indexExt && !middleExt && !ringExt) {
    return make('Y', 92);
  }

  // --- I pinky extended, thumb closed ---
  if (!indexExt && !middleExt && !ringExt && pinkyExt && !thumbExt) {
    return make('I', 90);
  }

  // --- L + index form L shape (perpendicular) ---
  if (indexExt && !middleExt && !ringExt && !pinkyExt && thumbExt) {
    const angle = angleBetween(indexTip, landmarks[5], thumbTip);
    if (angle > 50 && angle < 120) {
      return make('L', 88);
    }
  }

  // --- F and index touch (circle), other three fingers open ---
  if (middleExt && ringExt && pinkyExt && thumbIndexDist < palmSize * 0.22 && !indexExt) {
    return make('F', 88);
  }
  // Relaxed F: thumb touching index with 3 fingers up
  if (middleExt && ringExt && pinkyExt && thumbIndexDist < palmSize * 0.25) {
    return make('F', 82);
  }

  // --- W middle, ring extended, pinky closed, thumb closed ---
  if (indexExt && middleExt && ringExt && !pinkyExt && !thumbExt) {
    return make('W', 86);
  }

  // --- TWO-FINGER GESTURES (index + middle) ---
  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    // R and middle crossed/very close together
    if (indexMiddleDist < palmSize * 0.06) {
      return make('R', 80);
    }

    // U and middle together parallel (close but not crossed)
    if (indexMiddleDist < palmSize * 0.15 && indexMiddleDist >= palmSize * 0.06) {
      // Check they're pointing up
      if (indexTip.y < indexPip.y && middleTip.y < middlePip.y) {
        return make('U', 82);
      }
    }

    // K + middle spread, thumb between/touching middle
    if (indexMiddleDist > palmSize * 0.2 && thumbExt && thumbTip.y < indexPip.y) {
      return make('K', 80);
    }

    // V + middle spread apart (V shape)
    if (indexMiddleDist > palmSize * 0.18) {
      // Check they're pointing up
      if (indexTip.y < indexMcp.y && middleTip.y < middleMcp.y) {
        return make('V', 85);
      }
    }

    // H + middle extended sideways (horizontal)
    const avgTipX = (indexTip.x + middleTip.x) / 2;
    const avgMcpX = (indexMcp.x + middleMcp.x) / 2;
    const avgTipY = (indexTip.y + middleTip.y) / 2;
    const avgMcpY = (indexPip.y + middlePip.y) / 2;
    const dx = Math.abs(avgTipX - avgMcpX);
    const dy = Math.abs(avgTipY - avgMcpY);
    if (dx > dy * 1.2) {
      return make('H', 78);
    }

    // P K but pointing down
    if (indexTip.y > indexMcp.y && middleTip.y > middleMcp.y) {
      return make('P', 74);
    }
  }

  // --- SINGLE INDEX FINGER GESTURES ---
  if (indexExt && !middleExt && !ringExt && !pinkyExt) {
    // D up, thumb touches middle finger
    if (thumbMiddleDist < palmSize * 0.25 && indexTip.y < indexMcp.y) {
      return make('D', 82);
    }

    // G pointing sideways (horizontal)
    const idxDx = Math.abs(indexTip.x - indexMcp.x);
    const idxDy = Math.abs(indexTip.y - indexMcp.y);
    if (idxDx > idxDy * 1.3 && thumbExt) {
      return make('G', 78);
    }

    // Q G but pointing down
    if (indexTip.y > wrist.y && thumbExt) {
      return make('Q', 74);
    }

    // Z pointing up (static approximation; ideally motion-tracked)
    if (!thumbExt && indexTip.y < indexMcp.y) {
      return make('Z', 68);
    }
  }

  // --- B fingers extended, thumb curled across palm ---
  if (extCount === 4 && !thumbExt) {
    if (isThumbAcrossPalm(landmarks)) {
      return make('B', 88);
    }
    return make('B', 82);
  }

  // --- OPEN_PALM (5) fingers open ---
  if (extCount >= 4 && thumbExt) {
    return make('OPEN_PALM', 90);
  }

  // --- O fingertips close to thumb tip forming circle ---
  if (!indexExt && !middleExt && !ringExt && !pinkyExt) {
    if (thumbIndexDist < palmSize * 0.18 && thumbMiddleDist < palmSize * 0.22) {
      const thumbRingDist = dist(thumbTip, ringTip);
      if (thumbRingDist < palmSize * 0.3) {
        return make('O', 82);
      }
    }
  }

  // --- C hand forming C shape ---
  if (!indexExt && !middleExt && !ringExt && !pinkyExt) {
    // All fingers partially curled (not fully closed)
    if (indexCurl > 0.2 && indexCurl < 0.7 && middleCurl > 0.2 && middleCurl < 0.7) {
      const curveAngle = angleBetween(indexTip, landmarks[5], thumbTip);
      if (curveAngle > 35 && curveAngle < 110 && thumbIndexDist > palmSize * 0.25) {
        return make('C', 76);
      }
    }
  }

  // --- X bent/hooked ---
  if (!middleExt && !ringExt && !pinkyExt) {
    if (isFingerBent(landmarks, 8, 7, 6)) {
      return make('X', 75);
    }
  }

  // --- CLOSED HAND GESTURES ---
  if (extCount === 0) {
    // E fingers curled, thumb across palm
    if (!thumbExt && isThumbAcrossPalm(landmarks)) {
      // Verify fingertips are touching or near thumb
      const tipsNearThumb = dist(indexTip, thumbTip) < palmSize * 0.25;
      if (tipsNearThumb) {
        return make('E', 80);
      }
      return make('E', 72);
    }

    // T between index and middle in fist
    if (thumbTip.y < indexPip.y && thumbTip.y > indexTip.y && thumbTip.x > Math.min(landmarks[6].x, landmarks[10].x) && thumbTip.x < Math.max(landmarks[6].x, landmarks[10].x)) {
      return make('T', 74);
    }

    // M fingers folded over thumb (index, middle, ring tips below thumb tip)
    if (!thumbExt && indexTip.y > thumbTip.y && middleTip.y > thumbTip.y && ringTip.y > thumbTip.y && pinkyTip.y <= thumbTip.y) {
      return make('M', 70);
    }

    // N fingers folded over thumb
    if (!thumbExt && indexTip.y > thumbTip.y && middleTip.y > thumbTip.y && ringTip.y <= thumbTip.y) {
      return make('N', 70);
    }

    // A with thumb to the side (outside)
    if (thumbExt && !isThumbAcrossPalm(landmarks)) {
      return make('A', 84);
    }

    // S with thumb across (default fist)
    if (!thumbExt) {
      return make('S', 78);
    }

    // THUMBS_UP: thumb up, all others down
    if (thumbExt) {
      // Check thumb is pointing up
      if (thumbTip.y < landmarks[3].y && landmarks[3].y < landmarks[2].y) {
        return make('THUMBS_UP', 86);
      }
      return make('A', 78);
    }

    // FIST
    return make('FIST', 85);
  }

  // --- J + thumb open with curve (static approximation) ---
  if (!indexExt && !middleExt && !ringExt && pinkyExt && thumbExt) {
    return make('J', 72);
  }
  return {
    gesture: 'NONE',
    confidence: 0,
    label: 'No gesture',
    isAlphabet: false,
    fingerStates
  };
}