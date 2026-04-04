/**
 * DUAL DETECTION ENGINE
 * 
 * Implements two parallel gesture detection paths:
 * 1. FAST PATH: 1-2 frames, 80-85% confidence → immediate output
 * 2. STABLE PATH: 5-frame sliding window, majority voting (≥3 frames) → stable output
 * 
 * Uses hybrid confidence scoring and motion detection for adaptive processing
 */

const FAST_PATH_CONFIG = {
  MIN_FRAMES: 1,              // Detect in single frame
  MAX_FRAMES: 2,              // Or up to 2 frames for very fast gestures
  MIN_CONFIDENCE: 80,         // Allow as low as 80% for fast path
  MODE: 'fast'
};

const STABLE_PATH_CONFIG = {
  WINDOW_SIZE: 5,             // 5-frame sliding window
  MIN_CONSISTENT_FRAMES: 3,   // Need ≥3 consistent frames (60% of window)
  MIN_CONFIDENCE: 85,         // Require 85% for stable path
  MODE: 'stable'
};

/**
 * Initialize dual detection state
 */
export function createDualDetectionState() {
  return {
    // Fast path state
    fastFrameBuffer: [],        // 1-2 frames for quick detection
    fastLastGesture: null,
    fastLastTime: 0,
    
    // Stable path state
    stableFrameBuffer: [],      // 5-frame sliding window
    stableLastGesture: null,
    stableLastTime: 0,
    
    // Motion tracking
    lastLandmarks: null,
    motionMagnitude: 0,
    isMotionDetected: false,
    
    // Confirmation tracking (2-frame confirmation)
    confirmationBuffer: [],
    confirmedGesture: null,
    
    // Hybrid scoring
    lastConfidenceScore: 0,
    lastTemporalStability: 0
  };
}

/**
 * Calculate motion magnitude between two landmark sets
 * Returns a value 0-1 representing motion intensity
 */
function calculateMotionMagnitude(prevLandmarks, currentLandmarks) {
  if (!prevLandmarks || !currentLandmarks) return 0;
  
  let totalDistance = 0;
  const numLandmarks = Math.min(prevLandmarks.length, currentLandmarks.length);
  
  for (let i = 0; i < numLandmarks; i++) {
    const dx = currentLandmarks[i].x - prevLandmarks[i].x;
    const dy = currentLandmarks[i].y - prevLandmarks[i].y;
    const dz = (currentLandmarks[i].z || 0) - (prevLandmarks[i].z || 0);
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    totalDistance += distance;
  }
  
  const avgDistance = totalDistance / numLandmarks;
  // Normalize to 0-1: assume max normal motion is 0.3 (30% of hand size)
  return Math.min(avgDistance / 0.3, 1);
}

/**
 * Hybrid Confidence Scoring
 * Combines gesture confidence with temporal stability
 * Formula: (0.7 × Gesture Confidence) + (0.3 × Temporal Stability)
 */
export function calculateHybridConfidence(gestureConfidence, temporalStability) {
  return Math.round(0.7 * gestureConfidence + 0.3 * temporalStability);
}

/**
 * Calculate temporal stability (0-100)
 * How consistent has the same gesture been across frames?
 */
function calculateTemporalStability(frameBuffer) {
  if (frameBuffer.length === 0) return 0;
  
  // Count occurrences of most common gesture
  const counts = {};
  let maxCount = 0;
  let maxGesture = null;
  
  for (const frame of frameBuffer) {
    counts[frame.gesture] = (counts[frame.gesture] || 0) + 1;
    if (counts[frame.gesture] > maxCount) {
      maxCount = counts[frame.gesture];
      maxGesture = frame.gesture;
    }
  }
  
  // Stability = (max_count / buffer_length) * 100
  return Math.round((maxCount / frameBuffer.length) * 100);
}

/**
 * FAST PATH DETECTION
 * Detects strong gestures appearing in 1-2 frames
 * Returns result immediately without delay
 */
export function detectFast(gestureResult, state) {
  if (!gestureResult || gestureResult.gesture === 'NONE') {
    state.fastFrameBuffer = [];
    return null;
  }
  
  // Add frame to fast buffer
  state.fastFrameBuffer.push({
    gesture: gestureResult.gesture,
    confidence: gestureResult.confidence,
    label: gestureResult.label,
    timestamp: Date.now()
  });
  
  // Keep only last 2 frames
  if (state.fastFrameBuffer.length > FAST_PATH_CONFIG.MAX_FRAMES) {
    state.fastFrameBuffer.shift();
  }
  
  // Check if we have a strong gesture meeting fast path criteria
  const recentFrame = state.fastFrameBuffer[state.fastFrameBuffer.length - 1];
  
  if (recentFrame.confidence >= FAST_PATH_CONFIG.MIN_CONFIDENCE) {
    // Strong gesture detected - can output immediately
    return {
      gesture: recentFrame.gesture,
      confidence: recentFrame.confidence,
      label: recentFrame.label,
      mode: 'fast',  // Mark as fast path
      isNewGesture: recentFrame.gesture !== state.fastLastGesture
    };
  }
  
  return null;
}

/**
 * STABLE PATH DETECTION
 * Uses 5-frame sliding window with majority voting
 * Requires ≥3 consistent frames (60%)
 * Returns stable result with temporal stability score
 */
export function detectStable(gestureResult, state) {
  if (!gestureResult || gestureResult.gesture === 'NONE') {
    state.stableFrameBuffer = [];
    return null;
  }
  
  // Add frame to stable buffer
  state.stableFrameBuffer.push({
    gesture: gestureResult.gesture,
    confidence: gestureResult.confidence,
    label: gestureResult.label,
    timestamp: Date.now()
  });
  
  // Keep only last 5 frames (sliding window)
  if (state.stableFrameBuffer.length > STABLE_PATH_CONFIG.WINDOW_SIZE) {
    state.stableFrameBuffer.shift();
  }
  
  // Need minimum frames to perform voting
  if (state.stableFrameBuffer.length < 2) {
    return null;
  }
  
  // Perform majority voting
  const counts = {};
  for (const frame of state.stableFrameBuffer) {
    counts[frame.gesture] = (counts[frame.gesture] || 0) + 1;
  }
  
  // Find winning gesture
  let winningGesture = null;
  let maxCount = 0;
  for (const [gesture, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      winningGesture = gesture;
    }
  }
  
  // Check if we have enough consistent frames (≥3 out of 5)
  if (maxCount >= STABLE_PATH_CONFIG.MIN_CONSISTENT_FRAMES) {
    // Get average confidence of consistent frames
    const consistentFrames = state.stableFrameBuffer.filter(f => f.gesture === winningGesture);
    const avgConfidence = Math.round(
      consistentFrames.reduce((sum, f) => sum + f.confidence, 0) / consistentFrames.length
    );
    
    // If average confidence meets threshold
    if (avgConfidence >= STABLE_PATH_CONFIG.MIN_CONFIDENCE) {
      // Calculate temporal stability
      const temporalStability = calculateTemporalStability(state.stableFrameBuffer);
      
      // Calculate hybrid confidence
      const hybridConfidence = calculateHybridConfidence(avgConfidence, temporalStability);
      
      return {
        gesture: winningGesture,
        confidence: hybridConfidence,
        rawConfidence: avgConfidence,
        temporalStability: temporalStability,
        label: consistentFrames[0].label,
        mode: 'stable',
        consistentFrameCount: maxCount,
        isNewGesture: winningGesture !== state.stableLastGesture
      };
    }
  }
  
  return null;
}

/**
 * HYBRID DECISION LOGIC
 * Combines results from both paths:
 * - Use FAST path for sudden changes (new gesture, high confidence)
 * - Use STABLE path for persistent gestures (continuity, stability)
 */
export function decideHybrid(fastResult, stableResult, state) {
  // If fast path detected a new strong gesture → prioritize it
  if (fastResult && fastResult.isNewGesture) {
    return fastResult;
  }
  
  // If we have a stable result, prefer it for consistency
  if (stableResult && !stableResult.isNewGesture) {
    return stableResult;
  }
  
  // If only fast result available and gesture changed → use fast
  if (fastResult && fastResult.isNewGesture) {
    return fastResult;
  }
  
  // Otherwise use stable if available, then fast
  return stableResult || fastResult;
}

/**
 * 2-FRAME CONFIRMATION
 * Instead of fixed hold time, verify consistency over just 2 frames
 */
export function confirmGesture(gestureResult, state) {
  if (!gestureResult || gestureResult.gesture === 'NONE') {
    state.confirmationBuffer = [];
    return null;
  }
  
  // Add to confirmation buffer (2-frame window)
  state.confirmationBuffer.push({
    gesture: gestureResult.gesture,
    confidence: gestureResult.confidence
  });
  
  // Keep only last 2 frames
  if (state.confirmationBuffer.length > 2) {
    state.confirmationBuffer.shift();
  }
  
  // If we have 2 frames with same gesture → confirmed
  if (state.confirmationBuffer.length === 2) {
    const [first, second] = state.confirmationBuffer;
    if (first.gesture === second.gesture) {
      return {
        gesture: first.gesture,
        confidence: Math.round((first.confidence + second.confidence) / 2),
        isConfirmed: true
      };
    }
  }
  
  // Single frame but high confidence → provisional confirmation
  if (state.confirmationBuffer.length === 1) {
    const frame = state.confirmationBuffer[0];
    if (frame.confidence >= 85) {
      return {
        gesture: frame.gesture,
        confidence: frame.confidence,
        isConfirmed: false, // Provisional
        isProbable: true
      };
    }
  }
  
  return null;
}

/**
 * UPDATE MOTION STATE
 * Track hand motion for adaptive FPS processing
 */
export function updateMotionState(landmarks, state) {
  if (landmarks) {
    const motion = calculateMotionMagnitude(state.lastLandmarks, landmarks);
    state.motionMagnitude = motion;
    state.isMotionDetected = motion > 0.15; // Threshold: >15% motion = rapid movement
    state.lastLandmarks = landmarks;
  }
  return state.isMotionDetected;
}

/**
 * GET ADAPTIVE FPS SETTINGS
 * Returns FPS range based on motion detection
 */
export function getAdaptiveFPS(isMotionDetected) {
  if (isMotionDetected) {
    // Rapid motion: 25-30 FPS (40-33ms throttle)
    return { min: 25, max: 30, throttle: 33 };
  } else {
    // Normal/slow motion: 15-20 FPS (66-50ms throttle)
    return { min: 15, max: 20, throttle: 50 };
  }
}

/**
 * ADAPTIVE DEBOUNCE
 * If new gesture: output immediately (no delay)
 * If same gesture continues: apply debounce (300-400ms)
 */
export function shouldOutputWithAdaptiveDebounce(
  gestureResult,
  lastOutputGesture,
  lastOutputTime,
  state
) {
  if (!gestureResult || gestureResult.gesture === 'NONE') {
    return false;
  }
  
  const now = Date.now();
  const isNewGesture = gestureResult.gesture !== lastOutputGesture;
  
  if (isNewGesture) {
    // New gesture: output immediately
    return true;
  }
  
  // Same gesture: apply 300-400ms debounce
  const debounceWindow = 350; // Middle of 300-400ms range
  if ((now - lastOutputTime) >= debounceWindow) {
    return true;
  }
  
  return false;
}

/**
 * ERROR PREVENTION: FALLBACK TO STABLE GESTURE
 * If current gesture confidence fluctuates badly → use last stable
 */
export function fallbackToStable(currentGesture, stableGesture, confidenceThreshold = 60) {
  if (!currentGesture || currentGesture.confidence < confidenceThreshold) {
    return stableGesture;
  }
  return currentGesture;
}

/**
 * RESOLVE GESTURE CONFLICTS
 * If two gestures are detected: choose higher confidence or reject
 */
export function resolveConflict(gesture1, gesture2, conflictThreshold = 10) {
  if (!gesture1 || !gesture2) {
    return gesture1 || gesture2;
  }
  
  const confidenceDiff = Math.abs(gesture1.confidence - gesture2.confidence);
  
  // If confidences are too close (within 10%) → reject (ambiguous)
  if (confidenceDiff < conflictThreshold) {
    return null;
  }
  
  // Return higher confidence gesture
  return gesture1.confidence > gesture2.confidence ? gesture1 : gesture2;
}
