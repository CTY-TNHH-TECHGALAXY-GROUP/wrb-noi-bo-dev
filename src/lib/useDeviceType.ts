'use client';

import { useState, useEffect } from 'react';

// 🔧 BREAKPOINT CONFIGURATION
const TABLET_MIN = 768;
const DESKTOP_MIN = 1024;

/**
 * Hook to detect device type based on viewport width.
 * Uses window.innerWidth with resize listener.
 * 
 * Returns: { isMobile, isTablet, isDesktop, width }
 * - isMobile: < 768px
 * - isTablet: 768px - 1023px
 * - isDesktop: >= 1024px
 */
export const useDeviceType = () => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return {
    isMobile: width > 0 && width < TABLET_MIN,
    isTablet: width >= TABLET_MIN && width < DESKTOP_MIN,
    isDesktop: width >= DESKTOP_MIN,
    isTabletOrAbove: width >= TABLET_MIN,
    width,
  };
};
