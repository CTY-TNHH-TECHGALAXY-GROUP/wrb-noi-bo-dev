'use client';

import React from 'react';
import { useGoogleLogin } from './GoogleLoginBtn.logic';
import { useAuthStore } from '@/lib/authStore.logic';
import { t } from './GoogleLoginBtn.i18n';
import AlertModal from '@/components/Shared/AlertModal';

// 🔧 UI CONFIGURATION
const BTN_BORDER_RADIUS = '8px';
const BTN_HEIGHT = '44px';
const ICON_SIZE = 20;

const GoogleIcon = () => (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export const GoogleLoginBtn = ({ lang = 'vi', nextPath }: { lang?: string; nextPath?: string }) => {
    const [alertState, setAlertState] = React.useState<{ isOpen: boolean; message: string; type?: 'error' | 'success' | 'info' }>({ isOpen: false, message: '' });

    const { handleLogin, handleLogout } = useGoogleLogin(
        lang,
        (msg) => setAlertState({ isOpen: true, message: msg, type: 'error' }),
        nextPath
    );
    const { isAuthUser } = useAuthStore();
    // Default to 'en' texts if the language string is unrecognized.
    const localeText = t[lang as keyof typeof t] || t['en'];

    return (
        <>
        <button
            onClick={isAuthUser ? handleLogout : handleLogin}
            className="flex items-center justify-center gap-3 w-full bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
            style={{
                borderRadius: BTN_BORDER_RADIUS,
                height: BTN_HEIGHT
            }}
        >
            {!isAuthUser && <GoogleIcon />}
            <span>{isAuthUser ? localeText.logout : localeText.loginWithGoogle}</span>
        </button>
        
        <AlertModal
            isOpen={alertState.isOpen}
            message={alertState.message}
            type={alertState.type}
            onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
            lang={lang}
        />
        </>
    );
};
