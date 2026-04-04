import { useRef, useState, useCallback, useEffect } from 'react';
import { 
  detectDeviceType, 
  detectOrientation, 
  getMediaConstraints,
  getDeviceCapabilities 
} from '@/lib/deviceDetection';

export function useCamera() {
  const videoRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [device, setDevice] = useState(null);
  const [orientation, setOrientation] = useState(null);
  const streamRef = useRef(null);

  // Initialize device info
  useEffect(() => {
    setDevice(detectDeviceType());
    setOrientation(detectOrientation());
    
    const handleOrientationChange = () => {
      setOrientation(detectOrientation());
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const deviceType = detectDeviceType();
      const currentOrientation = detectOrientation();
      
      // Get device-specific constraints
      const constraints = getMediaConstraints(deviceType, currentOrientation);
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Ensure video is ready before marking as active
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => {
            console.warn('Video play failed:', err);
          });
          setIsActive(true);
        };
        
        // Fallback: mark as active after 500ms if event doesn't fire
        setTimeout(() => {
          if (videoRef.current?.srcObject) {
            setIsActive(true);
          }
        }, 500);
      }
    } catch (err) {
      console.error('Camera error:', err);
      
      // Provide specific error messages
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please enable camera access in settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is in use by another application.');
      } else {
        setError('Could not access camera. Please check permissions and try again.');
      }
      
      setIsActive(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsActive(false);
  }, []);

  // Retry function for failed camera access
  const retry = useCallback(() => {
    stop();
    setTimeout(() => {
      start();
    }, 500);
  }, [start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isActive) stop();
    };
  }, [isActive, stop]);

  const capabilities = getDeviceCapabilities();

  return { 
    videoRef, 
    isActive, 
    error, 
    start, 
    stop,
    retry,
    device,
    orientation,
    capabilities
  };
}
