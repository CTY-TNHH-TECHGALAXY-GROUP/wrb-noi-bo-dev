// File: src/services/user/checkUserEmail.ts

export interface CheckUserResult {
    exists: boolean;
    customer: {
        name: string;
        phone: string;
        email: string;
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
                customer: {
                    name: data.customer.fullName || "",
                    phone: data.customer.phone || "",
                    email: data.customer.email || (isEmail ? trimmed : "")
                }
            };
        }

        return { exists: false, customer: null };
    } catch (error) {
        console.error("❌ [API] Lỗi check user:", error);
        return { exists: false, customer: null };
    }
};