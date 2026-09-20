'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getDeepBodyT } from './DeepBody.i18n';
import { type VipStaffInfo } from '@/lib/vipStaffUtils';

interface CertificateModalProps {
  isOpen: boolean;
  staff: VipStaffInfo | null;
  lang: string;
  onClose: () => void;
}

export default function CertificateModal({
  isOpen,
  staff,
  lang,
  onClose,
}: CertificateModalProps) {
  const t = getDeepBodyT(lang);

  if (!isOpen || !staff) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg max-h-[calc(100dvh_-_3rem)] bg-[#141416] border border-[#e6c487]/40 rounded-[2rem] p-4 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-y-auto overscroll-contain z-10"
        >
          {/* Top Gold Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#e6c487] to-transparent opacity-80" />

          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#e6c487]/15 border border-[#e6c487]/40 flex items-center justify-center text-[#e6c487] shadow-[0_0_15px_rgba(230,196,135,0.2)]">
                <Award size={26} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#e6c487]/80 block">
                  {staff.id} • {staff.fullName}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  {t.certificate_modal_title}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body / Certificate Image Container */}
          <div className="py-5 flex-1 flex flex-col items-center">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#e6c487]/30 bg-[#1a1a1d] shadow-inner flex items-center justify-center group">
              {staff.certificateUrl ? (
                <img
                  src={staff.certificateUrl}
                  alt={`Certificate of ${staff.fullName}`}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                /* Elegant Fallback Certificate Mockup */
                <div className="w-full h-full p-6 flex flex-col items-center justify-between text-center bg-gradient-to-b from-[#1c1c1f] to-[#121214]">
                  <div className="flex items-center gap-1.5 text-[#e6c487] text-xs font-bold uppercase tracking-[0.2em]">
                    <ShieldCheck size={18} />
                    <span>ORIA SPA CLINICAL BODYWORK</span>
                  </div>

                  <div className="space-y-1.5 my-auto">
                    <p className="text-[11px] text-gray-400 uppercase tracking-widest">
                      {t.certificate_fallback_title}
                    </p>
                    <h4 className="text-xl font-serif text-[#e6c487] font-bold">
                      {staff.fullName} ({staff.id})
                    </h4>
                    <p className="text-xs text-gray-300 max-w-[280px] leading-relaxed mx-auto">
                      {t.certificate_fallback_desc}
                    </p>
                  </div>

                  <div className="flex items-center justify-center w-full pt-3 border-t border-white/10 text-[10px] text-gray-500">
                    <span>ID: CERT-OR-{staff.id}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Verification Badge */}
            <div className="w-full mt-4 p-3 rounded-xl bg-[#e6c487]/10 border border-[#e6c487]/20 flex items-center justify-center gap-2 text-[#e6c487] text-xs font-semibold">
              <CheckCircle2 size={16} />
              <span>{t.certificate_verified}</span>
            </div>
          </div>

          {/* Footer */}
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
          >
            {t.close}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
