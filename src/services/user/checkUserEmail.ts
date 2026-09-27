// File: src/services/user/checkUserEmail.ts

export interface CheckUserResult {
    exists: boolean;
    status: 'found' | 'not_found' | 'error';
    customer: {
        name: string;
        fullName?: string;
        phone: string;
        email: string;
        gender?: string | null;
        lang?: string | null;
    } | null;
}

export const checkUserEmail = async (inputValue: string): Promise<CheckUserResult> => {
    try {
        const trimmed = inputValue.trim();
        const isEmail = trimmed.includes('@');
        const paramKey = isEmail ? 'email' : 'phone';

        const res = await fetch(`/api/auth/lookup?${paramKey}=${encodeURIComponent(trimmed)}`);
        const data = await res.json();

        if (data.success && data.customer) {
            return {
                exists: true,
                status: 'found',
                customer: {
                    name: data.customer.fullName || "",
                    fullName: data.customer.fullName || "",
                    phone: data.customer.phone || (isEmail ? "" : trimmed),
                    email: data.customer.email || (isEmail ? trimmed : ""),
                    gender: data.customer.gender || null,
                    lang: data.customer.lang || null
                }
            };
        }

        return { exists: false, status: res.ok ? 'not_found' : 'error', customer: null };
    } catch (error) {
        console.error("❌ [API] Lỗi check user:", error);
        return { exists: false, status: 'error', customer: null };
    }
};
