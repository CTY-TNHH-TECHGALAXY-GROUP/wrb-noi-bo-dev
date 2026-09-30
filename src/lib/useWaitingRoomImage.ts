'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// 🔧 CONFIGURATION
export const DEFAULT_WAITING_ROOM_HERO_IMAGE = 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1000&auto=format&fit=crop';
const CACHE_KEY = 'waiting_room_hero_image';
const CACHE_TTL_MS = 5 * 60 * 1000; // Cache 5 minutes

/**
 * Hook to fetch the hero image URL for customer Waiting Room from SystemConfigs.
 * Key: 'waiting_room_hero_image' (or fallback 'waiting_room_image_url')
 * Falls back to DEFAULT_WAITING_ROOM_HERO_IMAGE if not configured.
 * Caches result in sessionStorage to avoid repeated DB calls.
 */
export const useWaitingRoomImage = (): string => {
  const [imageUrl, setImageUrl] = useState<string>(DEFAULT_WAITING_ROOM_HERO_IMAGE);

  useEffect(() => {
    // Check sessionStorage cache first
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { url, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL_MS && typeof url === 'string' && url.trim()) {
          setImageUrl(url.trim());
          return;
        }
      }
    } catch { /* ignore parse errors */ }

    // Fetch from SystemConfigs
    const fetchImage = async () => {
      try {
        const { data, error } = await supabase
          .from('SystemConfigs')
          .select('key, value')
          .in('key', ['waiting_room_hero_image', 'waiting_room_image_url']);

        if (!error && data && data.length > 0) {
          // Priority: waiting_room_hero_image > waiting_room_image_url
          const heroConfig = data.find((c: { key: string }) => c.key === 'waiting_room_hero_image')
            || data.find((c: { key: string }) => c.key === 'waiting_room_image_url');

          if (heroConfig?.value) {
            const rawUrl = typeof heroConfig.value === 'string' ? heroConfig.value : String(heroConfig.value);
            const cleanUrl = rawUrl.trim();
            if (cleanUrl) {
              setImageUrl(cleanUrl);
              // Cache result
              try {
                sessionStorage.setItem(CACHE_KEY, JSON.stringify({ url: cleanUrl, ts: Date.now() }));
              } catch { /* ignore storage errors */ }
            }
          }
        }
      } catch {
        // Silently fall back to default
      }
    };

    fetchImage();
  }, []);

  return imageUrl;
};
