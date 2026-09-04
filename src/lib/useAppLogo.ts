'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// 🔧 CONFIGURATION
const DEFAULT_LOGO_URL = '/Image/oria-spa-logo.png';
const CACHE_KEY = 'app_logo_url';
const CACHE_TTL_MS = 5 * 60 * 1000; // Cache 5 minutes

/**
 * Hook to fetch app logo URL from SystemConfigs.
 * Falls back to default local logo if not configured.
 * Caches result in sessionStorage to avoid repeated DB calls.
 */
export const useAppLogo = (): string => {
  const [logoUrl, setLogoUrl] = useState<string>(DEFAULT_LOGO_URL);

  useEffect(() => {
    // Check sessionStorage cache first
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { url, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL_MS) {
          setLogoUrl(url);
          return;
        }
      }
    } catch { /* ignore parse errors */ }

    // Fetch from SystemConfigs
    const fetchLogo = async () => {
      try {
        const { data, error } = await supabase
          .from('SystemConfigs')
          .select('value')
          .eq('key', 'app_logo_url')
          .maybeSingle();

        if (!error && data?.value) {
          const url = typeof data.value === 'string' ? data.value : String(data.value);
          setLogoUrl(url);
          // Cache result
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ url, ts: Date.now() }));
          } catch { /* ignore storage errors */ }
        }
      } catch {
        // Silently fall back to default
      }
    };

    fetchLogo();
  }, []);

  return logoUrl;
};

/** Default logo path for server components (cannot use hooks) */
export const DEFAULT_APP_LOGO = DEFAULT_LOGO_URL;
