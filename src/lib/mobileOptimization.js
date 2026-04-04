/**
 * MOBILE OPTIMIZATION UTILITIES
 * 
 * Performance optimizations specifically for mobile devices
 * - Reduced processing load
 * - Efficient frame handling
 * - Memory management
 */

/**
 * Create a frame skipper for mobile (process every Nth frame)
 */
export function createFrameSkipper(skipRate = 1) {
  let frameCount = 0;
  
  return {
    shouldProcess: () => {
      frameCount++;
      return frameCount % (skipRate + 1) === 0;
    },
    reset: () => {
      frameCount = 0;
    },
    getCount: () => frameCount
  };
}

/**
 * Optimize canvas size for mobile processing
 */
export function optimizeCanvasSize(originalWidth, originalHeight, maxWidth, maxHeight) {
  const ratio = Math.min(
    maxWidth / originalWidth,
    maxHeight / originalHeight
  );
  
  return {
    width: Math.floor(originalWidth * ratio),
    height: Math.floor(originalHeight * ratio),
    scale: ratio
  };
}

/**
 * Compress image data for processing
 */
export function compressImageData(imageData, quality = 0.7) {
  const data = imageData.data;
  
  // Simple compression: reduce color depth
  for (let i = 0; i < data.length; i += 4) {
    // Reduce to fewer colors
    data[i] = Math.floor(data[i] * quality);      // R
    data[i + 1] = Math.floor(data[i + 1] * quality); // G
    data[i + 2] = Math.floor(data[i + 2] * quality); // B
    // Keep alpha as is
  }
  
  return imageData;
}

/**
 * Cache gesture results to avoid reprocessing
 */
export function createGestureCache(ttl = 100) {
  let cache = {};
  let timestamps = {};
  
  return {
    get: (key) => {
      const now = Date.now();
      if (timestamps[key] && (now - timestamps[key]) < ttl) {
        return cache[key];
      }
      delete cache[key];
      delete timestamps[key];
      return null;
    },
    
    set: (key, value) => {
      cache[key] = value;
      timestamps[key] = Date.now();
    },
    
    clear: () => {
      cache = {};
      timestamps = {};
    },
    
    cleanup: () => {
      const now = Date.now();
      Object.keys(timestamps).forEach(key => {
        if ((now - timestamps[key]) >= ttl) {
          delete cache[key];
          delete timestamps[key];
        }
      });
    }
  };
}

/**
 * Throttle gesture outputs to prevent spam
 */
export function createOutputThrottler(minInterval = 100) {
  let lastOutput = {};
  
  return {
    canOutput: (gestureKey) => {
      const now = Date.now();
      if (!lastOutput[gestureKey]) {
        lastOutput[gestureKey] = now;
        return true;
      }
      
      if ((now - lastOutput[gestureKey]) >= minInterval) {
        lastOutput[gestureKey] = now;
        return true;
      }
      
      return false;
    },
    
    reset: (gestureKey) => {
      if (gestureKey) {
        delete lastOutput[gestureKey];
      } else {
        lastOutput = {};
      }
    }
  };
}

/**
 * Memory-efficient landmark storage
 */
export function createLandmarkBuffer(maxFrames = 3) {
  const buffer = [];
  
  return {
    add: (landmarks) => {
      buffer.push({
        data: landmarks,
        timestamp: Date.now()
      });
      
      // Keep only recent frames
      while (buffer.length > maxFrames) {
        buffer.shift();
      }
    },
    
    getLast: () => buffer[buffer.length - 1]?.data || null,
    
    getAll: () => buffer.map(f => f.data),
    
    clear: () => {
      buffer.length = 0;
    },
    
    size: () => buffer.length
  };
}

/**
 * Adaptive processing based on device heat/CPU usage
 */
export function createAdaptiveProcessor(initialFPS = 15) {
  let currentFPS = initialFPS;
  let frameTime = 0;
  let lastFrameTime = Date.now();
  let dropFrameCount = 0;
  
  return {
    recordFrameTime: () => {
      const now = Date.now();
      frameTime = now - lastFrameTime;
      lastFrameTime = now;
    },
    
    // Calculate actual vs target FPS
    getFrameTimeRatio: () => {
      const targetFrameTime = 1000 / currentFPS;
      return frameTime / targetFrameTime;
    },
    
    // Should reduce processing if frame time is too high
    shouldReduceLoad: () => {
      return frameTime > (1000 / currentFPS) * 1.5; // 50% slower than target
    },
    
    // Reduce FPS if struggling
    adaptFPS: () => {
      if (currentFPS > 8) { // Don't go below 8 FPS
        currentFPS = Math.max(8, currentFPS - 2);
        dropFrameCount++;
        return true;
      }
      return false;
    },
    
    // Increase FPS if performing well
    increaseFPS: (maxFPS = 30) => {
      if (currentFPS < maxFPS && frameTime < (1000 / currentFPS) * 0.8) {
        currentFPS = Math.min(maxFPS, currentFPS + 2);
        return true;
      }
      return false;
    },
    
    getCurrentFPS: () => currentFPS,
    getDropCount: () => dropFrameCount,
    
    reset: () => {
      frameTime = 0;
      dropFrameCount = 0;
    }
  };
}

/**
 * Battery-aware gesture detection
 * Reduce processing when device battery is low
 */
export function createBatteryAwareProcessor() {
  let batteryLevel = 100;
  let isBatteryLow = false;
  
  // Request Battery Status if available
  if ('getBattery' in navigator) {
    navigator.getBattery().then(battery => {
      batteryLevel = Math.round(battery.level * 100);
      isBatteryLow = battery.level <= 0.2;
      
      // Update on battery change
      battery.addEventListener('levelchange', () => {
        batteryLevel = Math.round(battery.level * 100);
      });
      battery.addEventListener('chargingchange', () => {
        isBatteryLow = battery.level <= 0.2 && !battery.charging;
      });
    });
  }
  
  return {
    getBatteryLevel: () => batteryLevel,
    isBatteryLow: () => isBatteryLow,
    
    // Recommendations based on battery
    getRecommendedFPS: (baseFPS = 15) => {
      if (isBatteryLow) {
        return Math.max(8, baseFPS - 5);  // Reduce FPS when battery low
      }
      return baseFPS;
    },
    
    shouldSkipProcessing: () => {
      return isBatteryLow && batteryLevel < 10;  // Skip unnecessary processing
    },
    
    shouldReduceQuality: () => {
      return batteryLevel < 30;  // Reduce quality when battery <30%
    }
  };
}

/**
 * Network-aware adaptation (for cloud processing scenarios)
 */
export function createNetworkAwareProcessor() {
  let connectionType = '4g';
  let effectiveType = '4g';
  
  // Check Network Info if available
  if ('connection' in navigator) {
    const connection = navigator.connection;
    connectionType = connection.type;
    effectiveType = connection.effectiveType;
    
    connection.addEventListener('change', () => {
      connectionType = connection.type;
      effectiveType = connection.effectiveType;
    });
  }
  
  return {
    getConnectionType: () => connectionType,
    getEffectiveType: () => effectiveType,
    
    // Recommendations based on network
    shouldUseRemoteProcessing: () => {
      return effectiveType === '4g' || effectiveType === 'wifi';
    },
    
    shouldUseLocalProcessing: () => {
      return effectiveType === '3g' || effectiveType === '2g' || effectiveType === 'slow-2g';
    },
    
    getRecommendedResolution: () => {
      switch (effectiveType) {
        case '4g':
          return { width: 720, height: 480 };
        case '3g':
          return { width: 480, height: 360 };
        case '2g':
        case 'slow-2g':
          return { width: 320, height: 240 };
        default:
          return { width: 640, height: 480 };
      }
    }
  };
}

/**
 * Memory pool for efficient frame buffer management
 */
export function createFramePool(poolSize = 5) {
  const pool = [];
  
  // Initialize pool
  for (let i = 0; i < poolSize; i++) {
    pool.push({
      timestamp: 0,
      data: new Float32Array(21 * 3) // 21 landmarks, 3 coords each (x,y,z)
    });
  }
  
  let poolIndex = 0;
  
  return {
    acquire: () => {
      const frame = pool[poolIndex];
      poolIndex = (poolIndex + 1) % pool.length;
      return frame;
    },
    
    setData: (frame, landmarks) => {
      frame.timestamp = Date.now();
      if (landmarks && landmarks.length > 0) {
        for (let i = 0; i < Math.min(landmarks.length, 21); i++) {
          const idx = i * 3;
          frame.data[idx] = landmarks[i]?.x || 0;
          frame.data[idx + 1] = landmarks[i]?.y || 0;
          frame.data[idx + 2] = landmarks[i]?.z || 0;
        }
      }
      return frame;
    },
    
    getSize: () => poolSize
  };
}

/**
 * Debug monitoring for performance
 */
export function createPerformanceMonitor() {
  const metrics = {
    frameCount: 0,
    fps: 0,
    avgMemory: 0,
    avgCPU: 0,
    droppedFrames: 0
  };
  
  let frameStartTime = Date.now();
  let frameCount = 0;
  
  return {
    recordFrame: () => {
      frameCount++;
      metrics.frameCount++;
    },
    
    calculateFPS: () => {
      const now = Date.now();
      const elapsed = now - frameStartTime;
      
      if (elapsed >= 1000) {
        metrics.fps = Math.round((frameCount * 1000) / elapsed);
        frameStartTime = now;
        frameCount = 0;
      }
      
      return metrics.fps;
    },
    
    recordMemory: () => {
      if (performance.memory) {
        metrics.avgMemory = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
      }
    },
    
    recordDroppedFrame: () => {
      metrics.droppedFrames++;
    },
    
    getMetrics: () => ({ ...metrics }),
    
    reset: () => {
      metrics.frameCount = 0;
      metrics.fps = 0;
      metrics.droppedFrames = 0;
      frameStartTime = Date.now();
      frameCount = 0;
    }
  };
}
