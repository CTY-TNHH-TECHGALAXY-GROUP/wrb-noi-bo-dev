'use client';

import { useState, useEffect } from 'react';

// 🔧 BREAKPOINT CONFIGURATION
const TABLET_MIN = 600;
const DESKTOP_MIN = 1024;

/**
 * Hook to detect device type based on viewport width.
 * Uses window.innerWidth with resize listener.
 */
export const useDeviceType = () => {
  const [width, setWidth] = useState(0);
  const [deviceCategory, setDeviceCategory] = useState<'mobile' | 'tablet' | 'desktop' | 'unknown'>('unknown');

  useEffect(() => {
    // 1. Nhận diện thiết bị vật lý qua User Agent & Touch Points
    const ua = navigator.userAgent.toLowerCase();
    const isMacWithTouch = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1; // iPadOS 13+
    const isIpad = /ipad/.test(ua) || isMacWithTouch;
    const isAndroidTablet = /android/.test(ua) && !/mobile/.test(ua);
    
    if (isIpad || isAndroidTablet) {
      setDeviceCategory('tablet');
    } else if (/mobile|iphone|ipod|android/.test(ua)) {
      setDeviceCategory('mobile');
    } else {
      setDeviceCategory('desktop');
    }

    // 2. Nhận diện kích thước cửa sổ (để không bị vỡ layout khi chia đôi màn hình)
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Kết hợp: Nếu thiết bị là tablet thì ưu tiên coi là tablet, trừ khi cửa sổ bị bóp quá nhỏ (< 450px)
  const isTabletPhysical = deviceCategory === 'tablet' || deviceCategory === 'desktop';
  const isTabletOrAbove = (isTabletPhysical && width >= 450) || width >= TABLET_MIN;

  return {
    isMobile: width > 0 && !isTabletOrAbove,
    isTablet: isTabletOrAbove && width < DESKTOP_MIN,
    isDesktop: width >= DESKTOP_MIN,
    isTabletOrAbove,
    width,
    deviceCategory
  };
};
