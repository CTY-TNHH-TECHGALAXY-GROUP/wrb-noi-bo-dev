'use client';

// 🔧 UI CONFIGURATION
const INPUT_BORDER_RADIUS = '12px';
const BTN_HEIGHT = '48px';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLoginBtn } from './GoogleLoginBtn';
import { Phone, Mail, ArrowRight, AlertCircle, Loader2, UserCheck } from 'lucide-react';
import { rememberCustomerVisit } from '@/lib/customerVisit';

// i18n
const t: Record<string, Record<string, string>> = {
  vi: {
    title: 'Xác nhận danh tính',
    subtitle: 'Đăng nhập để xem lịch sử đơn hàng',
    orDivider: 'hoặc nhập thủ công',
    inputPlaceholder: 'Số điện thoại hoặc Email',
    confirmBtn: 'Xác nhận',
    notFound: 'Chưa có lịch sử tại Ngân Hà. Hãy trải nghiệm dịch vụ đầu tiên!',
    lookupError: 'Chưa thể tra cứu lúc này. Bạn vẫn có thể tạo đơn với thông tin này.',
    checking: 'Đang kiểm tra...',
  },
  en: {
    title: 'Verify Identity',
    subtitle: 'Sign in to view your booking history',
    orDivider: 'or enter manually',
    inputPlaceholder: 'Phone number or Email',
    confirmBtn: 'Confirm',
    notFound: 'No history found at Ngân Hà. Try our services for the first time!',
    lookupError: 'Unable to check right now. You can still place an order with this information.',
    checking: 'Checking...',
  },
  jp: {
    title: '本人確認',
    subtitle: '予約履歴を確認するにはログインしてください',
    orDivider: 'または手動入力',
    inputPlaceholder: '電話番号またはメール',
    confirmBtn: '確認',
    notFound: 'Ngân Hàでの履歴がありません。初めてのサービスをお試しください！',
    lookupError: '現在履歴を確認できません。この情報で注文は可能です。',
    checking: '確認中...',
  },
  kr: {
    title: '본인 확인',
    subtitle: '예약 기록을 보려면 로그인하세요',
    orDivider: '또는 수동 입력',
    inputPlaceholder: '전화번호 또는 이메일',
    confirmBtn: '확인',
    notFound: 'Ngân Hà에서 이용 기록이 없습니다. 첫 서비스를 경험해 보세요!',
    lookupError: '지금은 내역을 조회할 수 없습니다. 이 정보로 주문은 가능합니다.',
    checking: '확인 중...',
  },
  cn: {
    title: '身份验证',
    subtitle: '登录以查看您的预约历史',
    orDivider: '或手动输入',
    inputPlaceholder: '电话号码或邮箱',
    confirmBtn: '确认',
    notFound: '在Ngân Hà暂无记录。来体验我们的首次服务吧！',
    lookupError: '暂时无法查询历史记录。您仍可使用此信息下单。',
    checking: '检查中...',
  },
};

interface LoginGateProps {
  lang: string;
  onSuccess: (info: { email?: string; phone?: string; fullName?: string }) => void;
}

export const LoginGate = ({ lang, onSuccess }: LoginGateProps) => {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const texts = t[lang] || t['en'];

  // Detect if input is email or phone
  const isEmail = (val: string) => val.includes('@');

  
  const handleCreateNewUser = () => {
    const trimmed = input.trim();
    rememberCustomerVisit(trimmed);
    
    // Redirect to standard menu
    router.push(`/${lang}/standard/menu`);
  };

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');

    try {
      const paramKey = isEmail(trimmed) ? 'email' : 'phone';
      const res = await fetch(`/api/auth/lookup?${paramKey}=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (data.success && data.customer) {
        rememberCustomerVisit(trimmed, data.customer.fullName);

        onSuccess({
          email: paramKey === 'email' ? trimmed : '',
          phone: paramKey === 'phone' ? trimmed : '',
          fullName: data.customer.fullName,
        });
      } else {
        setError(res.ok ? texts.notFound : texts.lookupError);
      }
    } catch (err) {
      console.error('LoginGate error:', err);
      setError(texts.lookupError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto text-center">
      {/* Icon */}
      <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-amber-200/40">
        <UserCheck size={36} className="text-white" />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
        {texts.title}
      </h2>
      <p className="text-gray-400 text-sm mb-8">{texts.subtitle}</p>

      {/* Google Login */}
      <div className="w-full shadow-lg mb-4" style={{ borderRadius: INPUT_BORDER_RADIUS }}>
        <GoogleLoginBtn lang={lang} />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 w-full my-4">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{texts.orDivider}</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Manual Input */}
      <div className="w-full relative mb-4">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
          {isEmail(input) ? <Mail size={18} /> : <Phone size={18} />}
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={texts.inputPlaceholder}
          className="w-full pl-12 pr-4 py-3.5 bg-[#1a1f2e] border border-white/10 text-white placeholder-gray-500 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
          style={{ borderRadius: INPUT_BORDER_RADIUS }}
        />
      </div>

      {/* Confirm Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || !input.trim()}
        className="w-full bg-gradient-to-r from-[#D4AF37] via-[#F4E2B3] to-[#B8860B] text-black font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_12px_30px_rgba(212,175,55,0.28)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 disabled:grayscale-[0.15]"
        style={{ borderRadius: INPUT_BORDER_RADIUS, height: BTN_HEIGHT }}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {texts.checking}
          </>
        ) : (
          <>
            <ArrowRight size={18} />
            {texts.confirmBtn}
          </>
        )}
      </button>

      
      {/* Error Message & Prompt to Create New */}
      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col gap-3 text-left animate-in slide-in-from-bottom-2">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
          <button 
             onClick={handleCreateNewUser} 
             className="w-full bg-[#C9A96E] hover:bg-[#b89a64] text-black font-bold py-3 rounded-lg text-sm mt-2 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
          >
             {lang === 'vi' ? 'Dùng thông tin này tạo đơn mới' : 'Use this info for new order'}
             <ArrowRight size={16} />
          </button>
        </div>
      )}

    </div>
  );
};
