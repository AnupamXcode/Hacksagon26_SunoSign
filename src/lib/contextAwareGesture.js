// Context-Aware Gesture Classification
// Routes to user or retailer gesture engine based on context

import { classifyGesture } from './gestureEngine';
import { classifyRetailerGesture } from './retailerGestureEngine';

/**
 * Classify gesture based on context
 * @param {Array} landmarks - MediaPipe hand landmarks
 * @param {string} context - 'user' or 'retailer'
 * @returns {Object} Gesture classification result with context
 */
export function classifyGestureByContext(landmarks, context = 'user') {
  if (!landmarks || landmarks.length < 21) {
    return {
      gesture: 'NONE',
      confidence: 0,
      label: 'No gesture',
      isAlphabet: false,
      context: context
    };
  }

  // Route to appropriate gesture engine
  if (context === 'retailer') {
    return classifyRetailerGesture(landmarks);
  }

  // Default to user mode
  const result = classifyGesture(landmarks);
  return {
    ...result,
    context: 'user'
  };
}

/**
 * Get gesture engine info for current context
 * @param {string} context - 'user' or 'retailer'
 * @returns {Object} Engine configuration
 */
export function getGestureEngineInfo(context = 'user') {
  return {
    context,
    engine: context === 'retailer' ? 'retailerGestureEngine' : 'gestureEngine',
    optimizedFor: context === 'retailer' 
      ? 'Retail/Service environment staff gestures' 
      : 'General public/user gestures',
    alphabetSupport: true,
    numberSupport: true,
    phraseSupport: true
  };
}

/**
 * Validate and describe gesture classification differences by context
 * @param {Array} landmarks - Hand landmarks
 * @returns {Object} Comparison of classifications
 */
export function compareGestureAcrossContexts(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return { user: 'NONE', retailer: 'NONE' };
  }

  const userResult = classifyGesture(landmarks);
  const retailerResult = classifyRetailerGesture(landmarks);

  return {
    user: {
      gesture: userResult.gesture,
      confidence: userResult.confidence,
      context: 'user'
    },
    retailer: {
      gesture: retailerResult.gesture,
      confidence: retailerResult.confidence,
      context: 'retailer'
    },
    different: userResult.gesture !== retailerResult.gesture,
    highestConfidence: Math.max(userResult.confidence, retailerResult.confidence)
  };
}

export default { classifyGestureByContext, getGestureEngineInfo, compareGestureAcrossContexts };
