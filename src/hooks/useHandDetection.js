import { useRef, useState, useCallback, useEffect } from 'react';
import { classifyGestureByContext } from '@/lib/contextAwareGesture';
import { 
  updateMotionState, 
  getAdaptiveFPS 
} from '@/lib/dualDetectionEngine';
import {
  detectDeviceType,
  getPerformanceParameters
} from '@/lib/deviceDetection';
import {
  createFrameSkipper,
  createAdaptiveProcessor
} from '@/lib/mobileOptimization';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export function useHandDetection(videoRef, canvasRef, isActive, maxHands = 2, context = 'user') {
  const [gesture, setGesture] = useState({
    gesture: 'NONE',
    confidence: 0,
    label: 'No gesture',
    isAlphabet: false
  });
  const [currentLandmarks, setCurrentLandmarks] = useState(null);
  const [hands, setHands] = useState([]);
  const [loading, setLoading] = useState(false);
  const handsRef = useRef(null);
  const rafRef = useRef(0);
  const lastDetectRef = useRef(0);

  // ========== MOTION DETECTION & ADAPTIVE FPS ==========
  const lastLandmarksRef = useRef(null);
  const motionMagnitudeRef = useRef(0);
  const isMotionDetectedRef = useRef(false);
  const currentFPSConfigRef = useRef({ min: 15, max: 20, throttle: 60 });
  
  // ========== MOBILE OPTIMIZATION ==========
  const deviceTypeRef = useRef(detectDeviceType());
  const frameSkipperRef = useRef(null);
  const adaptiveProcessorRef = useRef(null);
  const skipFrameCountRef = useRef(0);
  
  // Initialize mobile optimization
  useEffect(() => {
    const deviceType = detectDeviceType();
    deviceTypeRef.current = deviceType;
    
    const params = getPerformanceParameters(deviceType);
    
    // Setup frame skipper for mobile
    frameSkipperRef.current = createFrameSkipper(params.skipFrames);
    
    // Setup adaptive processor for mobile
    if (deviceType !== 'desktop') {
      adaptiveProcessorRef.current = createAdaptiveProcessor(params.fps);
    }
  }, []);

  const drawLandmarks = useCallback((canvas, allHands, width, height) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const connections = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]];
    const colors = ['hsl(38, 55%, 65%)', 'hsl(160, 45%, 50%)'];
    allHands.forEach((hand, handIdx) => {
      const color = colors[handIdx % 2];
      const landmarks = hand.landmarks;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      for (const [i, j] of connections) {
        ctx.beginPath();
        ctx.moveTo(landmarks[i].x * width, landmarks[i].y * height);
        ctx.lineTo(landmarks[j].x * width, landmarks[j].y * height);
        ctx.stroke();
      }
      for (const lm of landmarks) {
        ctx.beginPath();
        ctx.arc(lm.x * width, lm.y * height, 4, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'hsl(0, 0%, 100%)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
  }, []);

  // ========== LATENCY & FPS TRACKING ==========
  const frameTimestampsRef = useRef([]);
  const lastProcessTimeRef = useRef(0);

  const initHands = useCallback(async () => {
    if (handsRef.current) return;
    setLoading(true);
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
      const handsInstance = new window.Hands({
        locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });
      handsInstance.setOptions({
        maxNumHands: maxHands,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
      });
      handsInstance.onResults(results => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const width = canvas.width;
        const height = canvas.height;
        const detectedHands = [];
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i];
            const rawLabel = results.multiHandedness?.[i]?.label || 'Right';
            const handedness = rawLabel === 'Right' ? 'Left' : 'Right';
            detectedHands.push({
              landmarks,
              handedness
            });
          }
          drawLandmarks(canvas, detectedHands, width, height);
          const primaryLandmarks = detectedHands[0].landmarks;
          
          // ========== MOTION DETECTION & ADAPTIVE FPS ==========
          const state = { 
            lastLandmarks: lastLandmarksRef.current,
            isMotionDetected: isMotionDetectedRef.current
          };
          const motionDetected = updateMotionState(primaryLandmarks, state);
          lastLandmarksRef.current = primaryLandmarks;
          isMotionDetectedRef.current = motionDetected;
          
          // Update FPS config based on motion
          currentFPSConfigRef.current = getAdaptiveFPS(motionDetected);
          
          const result = classifyGestureByContext(primaryLandmarks, context);
          setGesture(result);
          setCurrentLandmarks(primaryLandmarks);
        } else {
          setGesture({
            gesture: 'NONE',
            confidence: 0,
            label: 'No hand detected',
            isAlphabet: false
          });
          setCurrentLandmarks(null);
          lastLandmarksRef.current = null;
          isMotionDetectedRef.current = false;
        }
        setHands(detectedHands);
      });
      handsRef.current = handsInstance;
      setLoading(false);
    } catch (e) {
      console.error('Failed to init MediaPipe:', e);
      setLoading(false);
    }
  }, [canvasRef, drawLandmarks, maxHands]);

  const detect = useCallback(async () => {
    if (!handsRef.current || !videoRef.current || !videoRef.current.readyState || videoRef.current.readyState < 2) {
      rafRef.current = requestAnimationFrame(detect);
      return;
    }
    
    const now = Date.now();
    
    // ========== MOBILE FRAME SKIPPING ==========
    if (frameSkipperRef.current && !frameSkipperRef.current.shouldProcess()) {
      skipFrameCountRef.current++;
      rafRef.current = requestAnimationFrame(detect);
      return;
    }
    
    // ========== ADAPTIVE FPS PROCESSING ==========
    // Base: 15-20 FPS (60ms throttle)
    // Motion detected: 25-30 FPS (33ms throttle)
    // Mobile: 12-18 FPS (83ms throttle) before motion boost
    const throttleMs = currentFPSConfigRef.current.throttle || 60;
    
    if (now - lastDetectRef.current > throttleMs) {
      lastDetectRef.current = now;
      const processStartTime = performance.now();
      
      try {
        await handsRef.current.send({
          image: videoRef.current
        });
        
        // ========== LATENCY TRACKING ==========
        const latency = Math.round(performance.now() - processStartTime);
        lastProcessTimeRef.current = latency;
        
        // ========== MOBILE ADAPTIVE PROCESSING ==========
        if (adaptiveProcessorRef.current) {
          adaptiveProcessorRef.current.recordFrameTime();
          
          // Reduce load if struggling
          if (adaptiveProcessorRef.current.shouldReduceLoad()) {
            adaptiveProcessorRef.current.adaptFPS();
          }
        }
        
        // Track FPS (rolling average of last 30 frames)
        frameTimestampsRef.current.push(now);
        if (frameTimestampsRef.current.length > 30) {
          frameTimestampsRef.current.shift();
        }
      } catch (e) {}
    }
    rafRef.current = requestAnimationFrame(detect);
  }, [videoRef, context]);

  useEffect(() => {
    if (isActive) {
      initHands().then(() => {
        rafRef.current = requestAnimationFrame(detect);
      });
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, initHands, detect]);

  // ========== FPS & LATENCY CALCULATOR ==========
  const calculateFPS = useCallback(() => {
    if (frameTimestampsRef.current.length < 2) return 0;
    const timestamps = frameTimestampsRef.current;
    const timeSpan = timestamps[timestamps.length - 1] - timestamps[0];
    if (timeSpan === 0) return 0;
    return Math.round((timestamps.length - 1) / (timeSpan / 1000));
  }, []);

  return {
    gesture,
    loading,
    hands,
    landmarks: currentLandmarks,
    fps: calculateFPS(),
    latency: lastProcessTimeRef.current,
    isMotionDetected: isMotionDetectedRef.current,
    adaptiveFPS: currentFPSConfigRef.current,
    device: deviceTypeRef.current,
    skippedFrames: skipFrameCountRef.current,
    adaptiveMetrics: adaptiveProcessorRef.current?.getFrameTimeRatio?.()
  };
}
