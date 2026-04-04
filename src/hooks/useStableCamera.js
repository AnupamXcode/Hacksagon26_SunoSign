// useStableCamera - Prevents camera feed from shifting, sliding, or re-rendering
// Implements all 10 camera stability rules

import { useRef, useCallback, useEffect } from 'react';

export const useStableCamera = (videoRef, isActive) => {
  // Track camera state without triggering re-render
  const cameraStateRef = useRef({
    isActive: false,
    streamInitialized: false,
    lastDetectionTime: 0,
  });

  // Store previous dimensions to prevent resize
  const dimensionsRef = useRef({
    width: 640,
    height: 480,
    aspectRatio: 16 / 9,
  });

  // Landmark smoothing buffer (moving average over 5 frames)
  const landmarkBufferRef = useRef([]);
  const MAX_FRAMES = 5;

  /**
   * RULE 1: Keep video stream persistent
   * - Initialize ONCE
   * - Never restart on gesture detection
   * - Prevent remounting
   */
  const maintainStreamPersistence = useCallback(() => {
    if (!videoRef.current) return;

    // Lock video element properties
    const video = videoRef.current;
    if (!cameraStateRef.current.streamInitialized && isActive) {
      // Mark as initialized only once
      video.style.position = 'relative';
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      video.style.display = 'block';
      video.style.margin = '0';
      video.style.padding = '0';
      video.style.margin = '0 !important';
      video.style.padding = '0 !important';
      video.style.border = 'none';
      
      cameraStateRef.current.streamInitialized = true;
    }
  }, [videoRef, isActive]);

  /**
   * RULE 2: Maintain fixed dimensions
   * - Lock width/height
   * - Prevent responsive resizing during detection
   */
  const maintainFixedDimensions = useCallback(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const container = video.parentElement;

    if (container) {
      // Force fixed aspect ratio on container
      container.style.aspectRatio = '16 / 9';
      container.style.minHeight = '300px';
      container.style.width = '100%';
      container.style.overflow = 'hidden';
      container.style.position = 'relative';
      
      // Prevent container from changing size
      dimensionsRef.current = {
        width: container.clientWidth,
        height: container.clientHeight,
        aspectRatio: 16 / 9,
      };
    }
  }, [videoRef]);

  /**
   * RULE 3: Smooth landmark positions with moving average
   * - Reduce jitter
   * - Apply smoothing over 5 frames
   * - Ignore minor changes (<threshold)
   */
  const smoothLandmarks = useCallback((landmarks) => {
    if (!landmarks || landmarks.length === 0) return null;

    // Add to buffer
    landmarkBufferRef.current.push(landmarks);
    if (landmarkBufferRef.current.length > MAX_FRAMES) {
      landmarkBufferRef.current.shift();
    }

    // Need at least 2 frames for smoothing
    if (landmarkBufferRef.current.length < 2) return landmarks;

    // Calculate moving average
    const smoothed = landmarks.map((_, idx) => {
      const avgX =
        landmarkBufferRef.current.reduce(
          (sum, frame) => sum + frame[idx].x,
          0
        ) / landmarkBufferRef.current.length;
      const avgY =
        landmarkBufferRef.current.reduce(
          (sum, frame) => sum + frame[idx].y,
          0
        ) / landmarkBufferRef.current.length;
      const avgZ =
        landmarkBufferRef.current.reduce(
          (sum, frame) => sum + frame[idx].z,
          0
        ) / landmarkBufferRef.current.length;

      return { x: avgX, y: avgY, z: avgZ };
    });

    return smoothed;
  }, []);

  /**
   * RULE 4: Prevent detection-triggered re-renders
   * - Store gesture state in ref instead of state
   * - Update without component re-render
   */
  const updateDetectionWithoutRender = useCallback((detection) => {
    // Store in ref - doesn't trigger re-render
    cameraStateRef.current.lastDetectionTime = Date.now();
    // Return detection result without updating component state
    return detection;
  }, []);

  /**
   * RULE 5: Debounce gesture recognition
   * - Ignore updates within 100ms of last detection
   * - Prevents rapid state changes
   */
  const shouldUpdateDetection = useCallback(() => {
    const now = Date.now();
    const lastTime = cameraStateRef.current.lastDetectionTime;
    // Only update if 100ms has passed
    return now - lastTime > 100;
  }, []);

  /**
   * RULE 6: Prevent layout shift on gesture output
   * - All outputs use position: absolute
   * - Never used as DOM children of main layout
   * - Rendered as overlay layers only
   */
  const getOverlayStyle = useCallback(() => ({
    position: 'absolute',
    pointerEvents: 'none',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  }), []);

  /**
   * RULE 7: Lock container to prevent flex/grid reflow
   * - Main camera container uses fixed layout
   * - No flex-grow or dynamic sizing
   */
  const getCameraContainerStyle = useCallback(() => ({
    aspectRatio: '16 / 9',
    minHeight: '300px',
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    display: 'block',
  }), []);

  /**
   * RULE 8: Memoize gesture state
   * - Use ref for detection state
   * - Only update component state on significant changes (>5% confidence delta)
   */
  const shouldUpdateGestureState = useCallback((oldConfidence, newConfidence) => {
    // Only update if confidence changed by more than 5%
    return Math.abs(newConfidence - oldConfidence) > 5;
  }, []);

  /**
   * RULE 9: Initialize with optimization
   */
  useEffect(() => {
    maintainStreamPersistence();
    maintainFixedDimensions();
  }, [isActive, maintainStreamPersistence, maintainFixedDimensions]);

  /**
   * RULE 10: Cleanup handler
   */
  const cleanup = useCallback(() => {
    landmarkBufferRef.current = [];
    cameraStateRef.current = {
      isActive: false,
      streamInitialized: false,
      lastDetectionTime: 0,
    };
  }, []);

  return {
    // Smoothing
    smoothLandmarks,
    // Detection control
    shouldUpdateDetection,
    shouldUpdateGestureState,
    updateDetectionWithoutRender,
    // Styling
    getOverlayStyle,
    getCameraContainerStyle,
    // State access
    cameraState: cameraStateRef.current,
    // Cleanup
    cleanup,
  };
};

export default useStableCamera;
