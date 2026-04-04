// Retailer-Specific Gesture Classification Engine for SunoSign AI
// Optimized hand gesture definitions for retail service environment
// Alternative A-Z classifications tailored for retailers & shop staff

// ==================== GEOMETRY HELPERS ====================

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function dist3D(a, b) {
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + dz * dz);
}

function angleBetween(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.sqrt(ab.x ** 2 + ab.y ** 2) * Math.sqrt(cb.x ** 2 + cb.y ** 2);
  if (mag === 0) return 0;
  return Math.acos(Math.min(1, Math.max(-1, dot / mag))) * (180 / Math.PI);
}

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

// ==================== FINGER STATE DETECTION (RETAILER OPTIMIZED) ====================

function isFingerExtended(landmarks, tip, pip, mcp) {
  const yExtended = landmarks[tip].y < landmarks[pip].y && landmarks[pip].y < landmarks[mcp].y;
  const dip = pip + 1;
  const curl = fingerCurl(landmarks, mcp, pip, dip, tip);
  return yExtended || curl < 0.35;
}

function isThumbOpen(landmarks) {
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const thumbMcp = landmarks[2];
  const wrist = landmarks[0];
  const indexMcp = landmarks[5];
  const isRightHand = indexMcp.x < wrist.x;
  const xSpread = isRightHand ? thumbIp.x - thumbTip.x : thumbTip.x - thumbIp.x;
  const palmCenter = { x: (landmarks[5].x + landmarks[17].x) / 2, y: (landmarks[5].y + landmarks[17].y) / 2 };
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

// ==================== RETAILER-OPTIMIZED CLASSIFICATION ====================

export function classifyRetailerGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return {
      gesture: 'NONE',
      confidence: 0,
      label: 'No gesture',
      isAlphabet: false,
      context: 'retailer'
    };
  }

  const indexExt = isFingerExtended(landmarks, 8, 6, 5);
  const middleExt = isFingerExtended(landmarks, 12, 10, 9);
  const ringExt = isFingerExtended(landmarks, 16, 14, 13);
  const pinkyExt = isFingerExtended(landmarks, 20, 18, 17);
  const thumbExt = isThumbOpen(landmarks);

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

  const indexCurl = fingerCurl(landmarks, 5, 6, 7, 8);
  const middleCurl = fingerCurl(landmarks, 9, 10, 11, 12);
  const ringCurl = fingerCurl(landmarks, 13, 14, 15, 16);
  const pinkyCurl = fingerCurl(landmarks, 17, 18, 19, 20);

  const make = (gesture, confidence) => ({
    gesture,
    confidence,
    label: gesture,
    isAlphabet: gesture.length === 1,
    context: 'retailer'
  });

  // ===== RETAILER-OPTIMIZED A-Z CLASSIFICATIONS =====

  // --- Y (pinky + thumb extended, others closed) ---
  if (pinkyExt && thumbExt && !indexExt && !middleExt && !ringExt) {
    return make('Y', 92);
  }

  // --- I (pinky extended, rest closed) ---
  if (!indexExt && !middleExt && !ringExt && pinkyExt && !thumbExt) {
    return make('I', 90);
  }

  // --- L (thumb + index extended perpendicular) ---
  if (indexExt && !middleExt && !ringExt && !pinkyExt && thumbExt) {
    const angle = angleBetween(indexTip, landmarks[5], thumbTip);
    if (angle > 50 && angle < 120) {
      return make('L', 88);
    }
  }

  // --- B (4 fingers extended, thumb across palm) ---
  if (extCount === 4 && !thumbExt) {
    if (isThumbAcrossPalm(landmarks)) {
      return make('B', 88);
    }
    return make('B', 82);
  }

  // --- V (index + middle extended in V position) ---
  if (indexExt && middleExt && !ringExt && !pinkyExt && !thumbExt) {
    const indexMiddleAngle = angleBetween(indexTip, landmarks[5], middleTip);
    if (indexMiddleAngle > 20 && indexMiddleAngle < 80) {
      return make('V', 85);
    }
  }

  // --- W (index, middle, ring extended) ---
  if (indexExt && middleExt && ringExt && !pinkyExt && !thumbExt) {
    return make('W', 84);
  }

  // --- U (index + middle extended upward) ---
  if (indexExt && middleExt && !ringExt && !pinkyExt && !thumbExt) {
    if (indexTip.y < indexMcp.y && middleTip.y < middleMcp.y) {
      return make('U', 82);
    }
  }

  // --- R (index middle crossed) ---
  if (indexExt && middleExt && !ringExt && !pinkyExt && thumbExt) {
    const angle = angleBetween(indexTip, landmarks[5], middleTip);
    if (angle > 20 && angle < 50) {
      return make('R', 78);
    }
  }

  // --- K (thumb index middle extended in K shape) ---
  if (indexExt && middleExt && !ringExt && !pinkyExt && thumbExt) {
    const angle = angleBetween(indexTip, landmarks[5], middleTip);
    if (angle > 50 && angle < 120) {
      return make('K', 80);
    }
  }

  // --- Single index finger gestures ---
  if (indexExt && !middleExt && !ringExt && !pinkyExt) {
    // D (index up, thumb touches middle)
    if (thumbMiddleDist < palmSize * 0.25 && indexTip.y < indexMcp.y) {
      return make('D', 82);
    }

    // G (index pointing sideways)
    const idxDx = Math.abs(indexTip.x - indexMcp.x);
    const idxDy = Math.abs(indexTip.y - indexMcp.y);
    if (idxDx > idxDy * 1.3 && thumbExt) {
      return make('G', 78);
    }

    // Q (index pointing down)
    if (indexTip.y > wrist.y && thumbExt) {
      return make('Q', 74);
    }

    // Z (index up, no thumb)
    if (!thumbExt && indexTip.y < indexMcp.y) {
      return make('Z', 68);
    }
  }

  // --- O (fingertips close to thumb forming circle) ---
  if (!indexExt && !middleExt && !ringExt && !pinkyExt) {
    if (thumbIndexDist < palmSize * 0.18 && thumbMiddleDist < palmSize * 0.22) {
      const thumbRingDist = dist(thumbTip, ringTip);
      if (thumbRingDist < palmSize * 0.3) {
        return make('O', 82);
      }
    }
  }

  // --- C (fingers partially curled in C shape) ---
  if (!indexExt && !middleExt && !ringExt && !pinkyExt) {
    if (indexCurl > 0.2 && indexCurl < 0.7 && middleCurl > 0.2 && middleCurl < 0.7) {
      const curveAngle = angleBetween(indexTip, landmarks[5], thumbTip);
      if (curveAngle > 35 && curveAngle < 110 && thumbIndexDist > palmSize * 0.25) {
        return make('C', 76);
      }
    }
  }

  // --- X (index bent/hooked) ---
  if (!middleExt && !ringExt && !pinkyExt) {
    const indexDip = landmarks[7];
    const indexTip_check = landmarks[8];
    if (indexTip_check.y > indexDip.y) {
      return make('X', 75);
    }
  }

  // --- CLOSED HAND GESTURES ---
  if (extCount === 0) {
    // E (all curled except thumb across palm)
    if (!thumbExt && isThumbAcrossPalm(landmarks)) {
      const tipsNearThumb = dist(indexTip, thumbTip) < palmSize * 0.25;
      if (tipsNearThumb) {
        return make('E', 80);
      }
      return make('E', 72);
    }

    // T (thumb between index and middle)
    if (thumbTip.y < indexPip.y && thumbTip.y > indexTip.y) {
      if (thumbTip.x > Math.min(landmarks[6].x, landmarks[10].x) &&
          thumbTip.x < Math.max(landmarks[6].x, landmarks[10].x)) {
        return make('T', 74);
      }
    }

    // M (fingers folded, specific arrangement)
    if (!thumbExt && indexTip.y > thumbTip.y && middleTip.y > thumbTip.y && 
        ringTip.y > thumbTip.y && pinkyTip.y <= thumbTip.y) {
      return make('M', 70);
    }

    // N (similar to M but different arrangement)
    if (!thumbExt && indexTip.y > thumbTip.y && middleTip.y > thumbTip.y && 
        ringTip.y <= thumbTip.y) {
      return make('N', 70);
    }

    // P (index middle pointing down)
    if (indexTip.y > indexMcp.y && middleTip.y > middleMcp.y) {
      return make('P', 74);
    }

    // A (thumb to side, all fingers folded)
    if (thumbExt && !isThumbAcrossPalm(landmarks)) {
      return make('A', 84);
    }

    // S (standard fist, thumb closed)
    if (!thumbExt) {
      return make('S', 78);
    }

    // H (thumb extended in fist)
    if (thumbExt && thumbTip.y > landmarks[3].y) {
      return make('H', 76);
    }

    // THUMBS_UP (thumb pointing up)
    if (thumbExt && thumbTip.y < landmarks[3].y && landmarks[3].y < landmarks[2].y) {
      return make('THUMBS_UP', 86);
    }

    // FIST (default)
    return make('FIST', 85);
  }

  // --- Open palm gestures ---
  if (extCount >= 4 && thumbExt) {
    return make('OPEN_PALM', 90);
  }

  // --- F (thumb-index touch circle) ---
  if (indexExt && middleExt && ringExt && pinkyExt && thumbExt) {
    if (thumbIndexDist < palmSize * 0.15) {
      return make('F', 80);
    }
  }

  // --- J (pinky + thumb combo) ---
  if (!indexExt && !middleExt && !ringExt && pinkyExt && thumbExt) {
    return make('J', 72);
  }

  return {
    gesture: 'NONE',
    confidence: 0,
    label: 'No gesture',
    isAlphabet: false,
    context: 'retailer'
  };
}

export default { classifyRetailerGesture };
