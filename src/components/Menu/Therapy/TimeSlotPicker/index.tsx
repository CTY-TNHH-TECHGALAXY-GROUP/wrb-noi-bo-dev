import React, { useState } from 'react';
import { motion } from 'framer-motion';

const TEXT_GOLD = 'text-[#C9A96E]';

interface TimeSlotPickerProps {
  lang: string;
  totalDuration: number;
  onConfirm: () => void;
}

export default function TimeSlotPicker({ lang, totalDuration, onConfirm }: TimeSlotPickerProps) {
  const isVi = lang === 'vi';
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Mock available slots based on team availability
  const mockSlots = [
    { time: '14:00', available: false },
    { time: '14:30', available: false },
    { time: '15:00', available: true }, // The first time all KTVs are free
    { time: '15:30', available: true },
    { time: '16:00', available: true },
    { time: '16:30', available: true }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full relative px-4"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-light text-white tracking-wide">
          {isVi ? 'Xác nhận thời gian' : 'Confirm Time'}
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {isVi ? 'Slot khả dụng chung cho nhóm KTV của bạn' : 'Available slots for your team'}
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3 uppercase tracking-wider">
            {isVi ? 'Lịch đặt cụ thể' : 'Specific Time'}
          </h3>
          <div className="flex flex-wrap gap-3">
            {mockSlots.map(slot => (
              <button
                key={slot.time}
                disabled={!slot.available}
                onClick={() => setSelectedSlot(slot.time)}
                className={`py-3 px-5 rounded-xl font-medium transition-all ${
                  !slot.available 
                    ? 'bg-[#1c1c1e]/50 text-gray-600 border border-transparent cursor-not-allowed' 
                    : selectedSlot === slot.time
                      ? 'bg-[#C9A96E] text-black shadow-[0_0_15px_rgba(201,169,110,0.4)]'
                      : 'bg-[#1c1c1e] text-gray-200 border border-gray-700 hover:border-gray-500'
                }`}
              >
                {slot.time}
              </button>
            ))}
          </div>
          {selectedSlot && (
            <p className={`mt-3 text-sm ${TEXT_GOLD} flex items-center gap-1`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {isVi ? `Bạn đã chọn ${selectedSlot}` : `Selected ${selectedSlot}`}
            </p>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-2 bg-[#0d0d0d] text-sm text-gray-500 uppercase tracking-widest">
              {isVi ? 'Hoặc' : 'Or'}
            </span>
          </div>
        </div>

        <button
           onClick={() => setSelectedSlot('BRANCH_DECIDE')}
           className={`w-full py-4 px-6 rounded-xl font-medium transition-all border ${
            selectedSlot === 'BRANCH_DECIDE'
              ? 'bg-[#C9A96E]/10 border-[#C9A96E] text-[#C9A96E]'
              : 'bg-[#1c1c1e] border-gray-700 text-gray-300 hover:border-gray-500'
           }`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span>{isVi ? 'Đến lấy vé tại Chi Nhánh (Push Live)' : 'Walk-in (Live Update)'}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1 font-normal opacity-80">
            {isVi ? 'Chúng tôi sẽ thông báo trực tuyến để KTV chuẩn bị đón bạn' : 'We will notify your therapists to prepare'}
          </p>
        </button>
      </div>

       {/* Floating Bottom Bar */}
       {selectedSlot && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4"
          >
            <button
              onClick={onConfirm}
              className="w-full bg-[#C9A96E] text-black font-semibold rounded-2xl py-4 shadow-[0_4px_20px_rgba(201,169,110,0.3)] active:scale-95 transition-transform"
            >
              {isVi ? 'Chốt Cấu Hình Xong!' : 'Finalize Booking'}
            </button>
          </motion.div>
        )}
    </motion.div>
  );
}
