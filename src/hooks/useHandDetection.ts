import { useRef, useState, useCallback, useEffect } from 'react';
import { classifyGesture, type GestureResult } from '@/lib/gesture';

declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

export interface HandInfo {
  landmarks: any[];
  handedness: 'Left' | 'Right';
}

export interface DualHandResult {
  gesture: GestureResult;
  loading: boolean;
  hands: HandInfo[];
  landmarks: any[] | null;
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

export function useHandDetection(
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  isActive: boolean,
  maxHands: number = 2
): DualHandResult {
  const [gesture, setGesture] = useState<GestureResult>({ gesture: 'NONE', confidence: 0, label: 'No gesture', isAlphabet: false });
  const [currentLandmarks, setCurrentLandmarks] = useState<any[] | null>(null);
  const [hands, setHands] = useState<HandInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const handsRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const lastDetectRef = useRef(0);

  const drawLandmarks = useCallback((canvas: HTMLCanvasElement, allHands: HandInfo[], width: number, height: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [5,9],[9,10],[10,11],[11,12],
      [9,13],[13,14],[14,15],[15,16],
      [13,17],[17,18],[18,19],[19,20],
      [0,17]
    ];

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

      // Draw hand label
      const wrist = landmarks[0];
      ctx.fillStyle = color;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(hand.handedness, wrist.x * width - 15, wrist.y * height + 20);
    });
  }, []);

  const initHands = useCallback(async () => {
    if (handsRef.current) return;
    setLoading(true);
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');

      const handsInstance = new window.Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      handsInstance.setOptions({
        maxNumHands: maxHands,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });

      handsInstance.onResults((results: any) => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const width = canvas.width;
        const height = canvas.height;

        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, width, height);

        const detectedHands: HandInfo[] = [];

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i];
            // MediaPipe returns handedness from camera perspective (mirrored)
            const rawLabel = results.multiHandedness?.[i]?.label || 'Right';
            // Mirror it for user perspective
            const handedness = rawLabel === 'Right' ? 'Left' : 'Right';
            detectedHands.push({ landmarks, handedness: handedness as 'Left' | 'Right' });
          }

          drawLandmarks(canvas, detectedHands, width, height);

          // Use first hand for gesture classification
          const primaryLandmarks = detectedHands[0].landmarks;
          const result = classifyGesture(primaryLandmarks);
          setGesture(result);
          setCurrentLandmarks(primaryLandmarks);
        } else {
          setGesture({ gesture: 'NONE', confidence: 0, label: 'No hand detected', isAlphabet: false });
          setCurrentLandmarks(null);
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
    if (now - lastDetectRef.current > 100) {
      lastDetectRef.current = now;
      try {
        await handsRef.current.send({ image: videoRef.current });
      } catch (e) { /* ignore frame errors */ }
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

  return { gesture, loading, hands, landmarks: currentLandmarks };
}
