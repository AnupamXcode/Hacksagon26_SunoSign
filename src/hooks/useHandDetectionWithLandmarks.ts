// Re-exports useHandDetection with explicit landmarks typing
import { useHandDetection } from './useHandDetection';

export function useHandDetectionWithLandmarks(
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  isActive: boolean
) {
  const result = useHandDetection(videoRef, canvasRef, isActive, 1);
  return {
    gesture: result.gesture,
    loading: result.loading,
    landmarks: result.landmarks,
  };
}
