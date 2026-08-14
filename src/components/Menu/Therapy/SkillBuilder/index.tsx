import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mockSkills, mockStaff } from '../mockData';

const TEXT_GOLD = 'text-[#C9A96E]';

interface SkillBuilderProps {
  lang: string;
  selectedStaffIds: string[];
  onConfirmSkills: (selectedSkillIds: string[], totalDuration: number) => void;
}

export default function SkillBuilder({ lang, selectedStaffIds, onConfirmSkills }: SkillBuilderProps) {
  const isVi = lang === 'vi';
  
  // Track selected skills per staff: Record<staffId, string[]>
  const [staffSkills, setStaffSkills] = useState<Record<string, string[]>>({});

  const staffList = mockStaff.filter(s => selectedStaffIds.includes(s.id));

  const handleToggleSkill = (staffId: string, skillId: string) => {
    setStaffSkills(prev => {
      const current = prev[staffId] || [];
      const updated = current.includes(skillId) 
        ? current.filter(id => id !== skillId) 
        : [...current, skillId];
      return { ...prev, [staffId]: updated };
    });
  };

  // Tính totalDuration = Max duration của tất cả KTV đã chọn
  // (Do làm song song)
  const totalDuration = useMemo(() => {
    let max = 0;
    selectedStaffIds.forEach(staffId => {
      const skills = staffSkills[staffId] || [];
      let sum = 0;
      skills.forEach(skId => {
        const skill = mockSkills.find(s => s.id === skId);
        if (skill) sum += skill.duration;
      });
      if (sum > max) max = sum;
    });
    return max;
  }, [staffSkills, selectedStaffIds]);

  const pricePer60Min = 200000;
  const totalPrice = (totalDuration / 60) * pricePer60Min;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full relative"
    >
      <div className="px-4 mb-4">
        <h2 className="text-2xl font-light text-white tracking-wide">
          {isVi ? 'Tổ hợp dịch vụ' : 'Design Treatment'}
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {isVi ? 'Bạn đã chọn chuyên gia, hãy giao việc cho họ' : 'Design bespoke services for your therapists'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-6">
        {staffList.map(staff => (
          <div key={staff.id} className="bg-[#1c1c1e] rounded-2xl p-4 border border-gray-800">
            <h3 className={`font-medium text-lg mb-3 ${TEXT_GOLD} flex items-center gap-2`}>
               <img src={staff.avatar} className="w-8 h-8 rounded-full border border-[#C9A96E]" alt=""/>
               {staff.name}
            </h3>
            
            <div className="space-y-2">
              {mockSkills.map(skill => {
                const isSelected = (staffSkills[staff.id] || []).includes(skill.id);
                return (
                  <div 
                    key={skill.id}
                    onClick={() => handleToggleSkill(staff.id, skill.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${isSelected ? 'border-[#C9A96E] bg-[#C9A96E]/5' : 'border-gray-700 hover:border-gray-600'}`}
                  >
                    <div>
                      <div className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                        {isVi ? skill.name.vi : skill.name.en}
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">{skill.duration} {isVi ? 'phút' : 'mins'}</div>
                    </div>
                    {/* Checkbox */}
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#C9A96E] border-[#C9A96E]' : 'border-gray-600'}`}>
                      {isSelected && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Bottom Bar with Spring Animation */}
      <AnimatePresence>
        {totalDuration > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d] to-transparent pt-12"
          >
            <div className="flex justify-between items-end mb-4 px-2">
              <div>
                <div className="text-gray-400 text-sm">{isVi ? 'Thời gian phục vụ' : 'Total Duration'}</div>
                <div className="text-2xl font-light text-white">{totalDuration} {isVi ? 'phút' : 'mins'}</div>
              </div>
              <div className="text-right">
                <div className="text-[#C9A96E] text-xs font-semibold tracking-wider uppercase mb-1">Bespoke Pricing</div>
                <div className="text-2xl font-medium text-[#C9A96E]">{totalPrice.toLocaleString('vi-VN')} đ</div>
              </div>
            </div>

            <button
              onClick={() => onConfirmSkills(Object.values(staffSkills).flat(), totalDuration)}
              className="w-full bg-[#C9A96E] text-black font-semibold rounded-2xl py-4 shadow-[0_4px_20px_rgba(201,169,110,0.3)] active:scale-95 transition-transform"
            >
              {isVi ? 'Chốt lộ trình' : 'Confirm Treatment'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
