import { useRef, useState, useCallback, useEffect } from 'react';
import { classifyGesture, type GestureResult } from '@/lib/gesture';

// Load MediaPipe from CDN
declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export function useHandDetection(videoRef: React.RefObject<HTMLVideoElement>, canvasRef: React.RefObject<HTMLCanvasElement>, isActive: boolean) {
  const [gesture, setGesture] = useState<GestureResult>({ gesture: 'NONE', confidence: 0, label: 'No gesture', isAlphabet: false });
  const [loading, setLoading] = useState(false);
  const handsRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const lastDetectRef = useRef(0);

  const drawLandmarks = useCallback((canvas: HTMLCanvasElement, landmarks: any[], width: number, height: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw connections
    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [5,9],[9,10],[10,11],[11,12],
      [9,13],[13,14],[14,15],[15,16],
      [13,17],[17,18],[18,19],[19,20],
      [0,17]
    ];
    
    ctx.strokeStyle = 'hsl(200, 80%, 55%)';
    ctx.lineWidth = 2;
    for (const [i, j] of connections) {
      ctx.beginPath();
      ctx.moveTo(landmarks[i].x * width, landmarks[i].y * height);
      ctx.lineTo(landmarks[j].x * width, landmarks[j].y * height);
      ctx.stroke();
    }
    
    // Draw landmarks
    for (const lm of landmarks) {
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, 4, 0, 2 * Math.PI);
      ctx.fillStyle = 'hsl(160, 60%, 45%)';
      ctx.fill();
      ctx.strokeStyle = 'hsl(0, 0%, 100%)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, []);

  const initHands = useCallback(async () => {
    if (handsRef.current) return;
    setLoading(true);
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
      
      const hands = new window.Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });
      
      hands.onResults((results: any) => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const width = canvas.width;
        const height = canvas.height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, width, height);
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];
          drawLandmarks(canvas, landmarks, width, height);
          const result = classifyGesture(landmarks);
          setGesture(result);
        } else {
          setGesture({ gesture: 'NONE', confidence: 0, label: 'No hand detected', sentence: '' });
        }
      });
      
      handsRef.current = hands;
      setLoading(false);
    } catch (e) {
      console.error('Failed to init MediaPipe:', e);
      setLoading(false);
    }
  }, [canvasRef, drawLandmarks]);

  const detect = useCallback(async () => {
    if (!handsRef.current || !videoRef.current || !videoRef.current.readyState || videoRef.current.readyState < 2) {
      rafRef.current = requestAnimationFrame(detect);
      return;
    }
    
    const now = Date.now();
    if (now - lastDetectRef.current > 100) { // ~10fps detection
      lastDetectRef.current = now;
      try {
        await handsRef.current.send({ image: videoRef.current });
      } catch (e) {
        // ignore frame errors
      }
    }
    
    rafRef.current = requestAnimationFrame(detect);
  }, [videoRef]);

  useEffect(() => {
    if (isActive) {
      initHands().then(() => {
        rafRef.current = requestAnimationFrame(detect);
      });
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => { cancelAnimationFrame(rafRef.current); };
  }, [isActive, initHands, detect]);

  return { gesture, loading };
}
