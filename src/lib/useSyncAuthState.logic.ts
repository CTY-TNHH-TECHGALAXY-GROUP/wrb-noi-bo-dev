'use client';

import { useEffect } from 'react';
import { useAuthStore } from './authStore.logic';
import { getSupabaseClient, hasSupabaseEnv } from '@/components/Auth/GoogleLoginBtn.logic';

export const useSyncAuthState = () => {
    const { setUser, logout } = useAuthStore();
    const supabase = hasSupabaseEnv() ? getSupabaseClient() : null;

    useEffect(() => {
        if (!supabase) return;

        // Hàm đọc Hash từ URL do Supabase Implicit Flow trả về sau khi Login Google
        const checkSession = async () => {
            // Ngay khi có hash URL trả về, tự động supabase sẽ nhét vô storage.
            // Nếu có hash, ta set timeout nhẹ 300ms đợi nó ghi hoàn thành rồi reload
            if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (session) {
                    setUser(session.user);
                    // Xóa cái cục hash xấu xí dính trên URL cho đẹp
                    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
                }
                return; // Không chạy tiếp logic bên dưới nữa
            }

            const { data: { session }, error } = await supabase.auth.getSession();

            if (session) {
                setUser(session.user);
            } else {
                // We do not logout(), to preserve isGuest state if they clicked "Guest"
            }
        };
        checkSession();

        // Listen to Auth State Changes (login, logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (session) {
                    setUser(session.user);
                } else {
                    logout();
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [setUser, logout, supabase]);
};
