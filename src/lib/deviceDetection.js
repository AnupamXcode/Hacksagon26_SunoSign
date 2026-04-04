/**
 * DEVICE DETECTION & CLASSIFICATION SYSTEM
 * 
 * Detects device type (mobile/tablet/desktop) and capabilities
 * Enables adaptive behavior based on device characteristics
 */

// Device type constants
export const DEVICE_TYPES = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop'
};

// Orientation constants
export const ORIENTATIONS = {
  PORTRAIT: 'portrait',
  LANDSCAPE: 'landscape'
};

/**
 * Detect device type based on screen size and user agent
 */
export function detectDeviceType() {
  const width = window.innerWidth;
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Check user agent for mobile indicators
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTabletUA = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
  
  // Screen size breakpoints
  const isMobileSize = width < 768;
  const isTabletSize = width >= 768 && width < 1024;
  const isDesktopSize = width >= 1024;
  
  // Decision logic
  if (isDesktopSize || (!isMobileUA && !isTabletUA)) {
    return DEVICE_TYPES.DESKTOP;
  }
  
  if (isTabletSize || isTabletUA) {
    return DEVICE_TYPES.TABLET;
  }
  
  return DEVICE_TYPES.MOBILE;
}

/**
 * Detect current screen orientation
 */
export function detectOrientation() {
  if (typeof window === 'undefined') return ORIENTATIONS.PORTRAIT;
  
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  return width > height ? ORIENTATIONS.LANDSCAPE : ORIENTATIONS.PORTRAIT;
}

/**
 * Get device capabilities and performance parameters
 */
export function getDeviceCapabilities() {
  const deviceType = detectDeviceType();
  const orientation = detectOrientation();
  
  const capabilities = {
    deviceType,
    orientation,
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: deviceType === DEVICE_TYPES.MOBILE,
    isTablet: deviceType === DEVICE_TYPES.TABLET,
    isDesktop: deviceType === DEVICE_TYPES.DESKTOP,
    isPortrait: orientation === ORIENTATIONS.PORTRAIT,
    isLandscape: orientation === ORIENTATIONS.LANDSCAPE,
    
    // Hardware capabilities
    hasWebGL: !!document.createElement('canvas').getContext('webgl'),
    hasWebGL2: !!document.createElement('canvas').getContext('webgl2'),
    maxTouchPoints: navigator.maxTouchPoints || 0,
    devicePixelRatio: window.devicePixelRatio || 1,
    
    // Performance parameters
    ...getPerformanceParameters(deviceType)
  };
  
  return capabilities;
}

/**
 * Get performance parameters based on device type
 */
export function getPerformanceParameters(deviceType) {
  const baseParams = {
    // FPS (frames per second)
    fps: 15,                      // Default FPS
    fpsMotion: 20,               // FPS when motion detected
    
    // Camera resolution
    targetWidth: 640,
    targetHeight: 480,
    
    // Processing parameters
    skipFrames: 0,               // Don't skip frames by default
    useWorker: false,            // Don't use workers
    
    // UI parameters
    touchButtonHeight: 44,       // Minimum touch target
    detectionInterval: 66,       // ~15 FPS in milliseconds
  };
  
  switch (deviceType) {
    case DEVICE_TYPES.MOBILE:
      return {
        ...baseParams,
        fps: 12,                 // Lower FPS for mobile
        fpsMotion: 18,
        targetWidth: 480,        // Lower resolution
        targetHeight: 360,
        skipFrames: 1,           // Skip every other frame for performance
        detectionInterval: 83,   // ~12 FPS
        useWorker: false,        // WebWorkers may not help on mobile
      };
      
    case DEVICE_TYPES.TABLET:
      return {
        ...baseParams,
        fps: 15,                 // Medium FPS for tablet
        fpsMotion: 22,
        targetWidth: 640,
        targetHeight: 480,
        skipFrames: 0,
        detectionInterval: 66,   // ~15 FPS
        useWorker: false,
      };
      
    case DEVICE_TYPES.DESKTOP:
      return {
        ...baseParams,
        fps: 20,                 // Higher FPS for desktop
        fpsMotion: 30,
        targetWidth: 1280,       // Higher resolution
        targetHeight: 720,
        skipFrames: 0,
        detectionInterval: 50,   // ~20 FPS
        useWorker: true,         // Use workers on desktop
      };
      
    default:
      return baseParams;
  }
}

/**
 * Get camera resolution based on device capabilities
 */
export function getCameraResolution(deviceType, orientation) {
  const params = getPerformanceParameters(deviceType);
  
  // Adjust for orientation
  if (orientation === ORIENTATIONS.PORTRAIT) {
    return {
      width: { ideal: params.targetHeight },  // Swap for portrait
      height: { ideal: params.targetWidth }
    };
  }
  
  return {
    width: { ideal: params.targetWidth },
    height: { ideal: params.targetHeight }
  };
}

/**
 * Get recommended MediaConstraints based on device
 */
export function getMediaConstraints(deviceType, orientation) {
  const resolution = getCameraResolution(deviceType, orientation);
  
  return {
    audio: false,
    video: {
      facingMode: 'user',      // Front camera for selfies
      ...resolution,
      resizeMode: 'cpu-and-gpu' // Allow GPU resizing
    }
  };
}

/**
 * Detect if device supports required browser APIs
 */
export function checkBrowserSupport() {
  return {
    mediaDevices: !!navigator.mediaDevices,
    getUserMedia: !!navigator.mediaDevices?.getUserMedia,
    permissions: !!navigator.permissions,
    orientationEvent: 'orientationchange' in window,
    webGL: !!document.createElement('canvas').getContext('webgl'),
    canvas: !!document.createElement('canvas').getContext('2d'),
    requestAnimationFrame: !!window.requestAnimationFrame
  };
}

/**
 * Format device capabilities into readable string
 */
export function formatDeviceInfo(capabilities) {
  return `${capabilities.deviceType} ${capabilities.orientation} (${capabilities.width}x${capabilities.height})`;
}

/**
 * Check if device is low-end (limited performance)
 */
export function isLowEndDevice() {
  const deviceType = detectDeviceType();
  
  // Consider low-end if:
  // - Mobile device
  // - Low device pixel ratio
  // - Limited touch points
  // - No WebGL support
  
  if (deviceType !== DEVICE_TYPES.MOBILE) return false;
  
  const capabilities = getDeviceCapabilities();
  return (
    capabilities.devicePixelRatio <= 1 ||
    capabilities.maxTouchPoints <= 2 ||
    !capabilities.hasWebGL
  );
}

/**
 * Get optimal gesture detection settings based on device
 */
export function getOptimalGestureSettings(deviceType, isMotionDetected = false) {
  const params = getPerformanceParameters(deviceType);
  
  // Select appropriate FPS based on motion
  const fps = isMotionDetected ? params.fpsMotion : params.fps;
  const throttle = Math.round(1000 / fps);
  
  return {
    fps,
    throttle,
    targetResolution: {
      width: params.targetWidth,
      height: params.targetHeight
    },
    processInWorker: params.useWorker,
    confidenceThreshold: deviceType === DEVICE_TYPES.MOBILE ? 0.75 : 0.70,  // Stricter on mobile
    minFramesForStability: deviceType === DEVICE_TYPES.MOBILE ? 3 : 5       // Fewer frames on mobile
  };
}

/**
 * Create a resize observer for responsive updates
 */
export function createResponsiveObserver(callback) {
  if (!window.ResizeObserver) {
    // Fallback to window resize
    const handler = debounce(() => callback(getDeviceCapabilities()), 300);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }
  
  // Use ResizeObserver for more accurate detection
  let observer = null;
  if (typeof document !== 'undefined' && document.body) {
    observer = new ResizeObserver(() => {
      callback(getDeviceCapabilities());
    });
    observer.observe(document.body);
  }
  
  return () => observer?.disconnect();
}

/**
 * Create an orientation observer
 */
export function createOrientationObserver(callback) {
  const handler = () => {
    callback({
      orientation: detectOrientation(),
      capabilities: getDeviceCapabilities()
    });
  };
  
  window.addEventListener('orientationchange', handler);
  window.addEventListener('resize', debounce(handler, 200));
  
  return () => {
    window.removeEventListener('orientationchange', handler);
    window.removeEventListener('resize', handler);
  };
}

/**
 * Utility: Debounce function
 */
function debounce(fn, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Get touch-friendly dimensions
 */
export function getTouchFriendlyDimensions() {
  const capabilities = getDeviceCapabilities();
  const isMobile = capabilities.deviceType === DEVICE_TYPES.MOBILE;
  
  return {
    buttonHeight: isMobile ? 48 : 44,          // Touch buttons minimum
    buttonWidth: isMobile ? 48 : 44,
    spacing: isMobile ? 12 : 8,                // Between buttons
    padding: isMobile ? 16 : 12,               // Padding around content
    touchPadding: isMobile ? 8 : 4             // Extra touch area
  };
}
