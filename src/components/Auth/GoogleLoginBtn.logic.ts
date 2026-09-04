'use client';

import { createClient } from '@/lib/supabase';
import { useAuthStore } from '@/lib/authStore.logic';

export const hasSupabaseEnv = () => Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Helper function to get standard supabase client on client sides
export function getSupabaseClient() {
    return createClient();
}

export const useGoogleLogin = (lang: string = 'en', onError?: (msg: string) => void, nextPath?: string) => {
    const { setUser, logout } = useAuthStore();
    const supabase = getSupabaseClient();

    const handleLogin = async () => {
        if (!supabase) {
            if (onError) onError('Thiếu cấu hình Supabase cho Google Login.');
            return;
        }

        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    // Update: Trỏ về Next.js Route Handler để xử lý cấp Session bằng Cokies (SSR)
                    // URL gốc sẽ lưu params `next` để server biết phải quay lại màn hình nào
                    redirectTo: `${window.location.origin}/auth/callback?next=${nextPath || `/${lang}/standard/menu`}`
                }
            });
            if (error) throw error;
            // Note: Data will be empty due to redirect, state will be set upon reload/callback.
        } catch (err: any) {
            console.error('Error logging in with Google:', err.message);
            if (onError) onError('Đăng nhập thất bại. Vui lòng thử lại!');
        }
    };

    const handleLogout = async () => {
        if (!supabase) {
            logout();
            return;
        }

        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            logout();
        } catch (err: any) {
            console.error('Error logging out:', err.message);
        }
    };

    return { handleLogin, handleLogout };
};
