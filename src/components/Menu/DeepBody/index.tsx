'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DeepStaffSelector from './StaffSelector';
import DeepBookingConfig from './BookingConfig';
import VipCartStep from '../Premium/VipCartStep';
import { type VipStaffInfo } from '@/lib/vipStaffUtils';
import { type VipPricingTable } from '@/lib/vipPricingEngine';
import { type DeepBodyTechnique, type DeepBodyBaseTechniqueId } from '@/lib/deepBody.constants';
import { useMenuData } from '@/components/Menu/MenuContext';
import { getDeepBodyT } from './DeepBody.i18n';
import { type VipEditSaveData } from '@/components/Checkout/VipEditModal';

interface DeepBodyMenuProps {
  lang: string;
  isBookingFlow?: boolean;
  initialStaff?: VipStaffInfo[] | null;
  initialStep?: MenuStep;
  initialTechniqueIds?: DeepBodyBaseTechniqueId[];
  onBack: () => void;
  onCheckout: () => void;
  onSwitchToStandard?: () => void;
}

type MenuStep = 'STAFF' | 'BOOKING_CONFIG';

export default function DeepBodyMenu({
  lang,
  isBookingFlow,
  initialStaff,
  initialStep,
  initialTechniqueIds,
  onBack,
  onCheckout,
  onSwitchToStandard,
}: DeepBodyMenuProps) {
  const t = getDeepBodyT(lang);
  const { cart, addVipToCart, updateVipCartItem, removeVipGroup } = useMenuData();

  const isLangSwitching = typeof window !== 'undefined' && sessionStorage.getItem('is_vip_lang_switching') === 'true';

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
      scrollContainerRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  };

  // Persisted state ONLY across language switch; otherwise always start at 'STAFF' (màn hình chung tất cả KTV)
  const [step, setStep] = useState<MenuStep>(() => {
    if (initialStep) return initialStep;
    if (initialStaff && initialStaff.length > 0) return 'BOOKING_CONFIG';
    if (typeof window !== 'undefined' && isLangSwitching) {
      const saved = sessionStorage.getItem('deep_body_current_step') as MenuStep | null;
      if (saved === 'BOOKING_CONFIG' || saved === 'STAFF') return saved;
    }
    return 'STAFF';
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [vipPricingTable, setVipPricingTable] = useState<VipPricingTable | undefined>(undefined);
  const [dynamicMethods, setDynamicMethods] = useState<DeepBodyTechnique[] | undefined>(undefined);

  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(() => {
    if (initialStaff && initialStaff.length > 0) return initialStaff.map((s) => s.id);
    if (typeof window !== 'undefined' && isLangSwitching) {
      try {
        const saved = sessionStorage.getItem('deep_body_selected_staff_ids');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });
  const [selectedStaffInfoList, setSelectedStaffInfoList] = useState<VipStaffInfo[]>(() => {
    if (initialStaff && initialStaff.length > 0) return initialStaff;
    if (typeof window !== 'undefined' && isLangSwitching) {
      try {
        const saved = sessionStorage.getItem('deep_body_selected_staff_info');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });
  const [staffGroupingMode, setStaffGroupingMode] = useState<'FOUR_HAND' | 'SEPARATE' | null>(() => {
    if (typeof window !== 'undefined' && isLangSwitching) {
      const saved = sessionStorage.getItem('deep_body_grouping_mode') as 'FOUR_HAND' | 'SEPARATE' | null;
      if (saved === 'FOUR_HAND' || saved === 'SEPARATE') return saved;
    }
    return null;
  });
  const [selectedTechniqueIds, setSelectedTechniqueIds] = useState<DeepBodyBaseTechniqueId[]>(() => {
    if (initialTechniqueIds && initialTechniqueIds.length > 0) return initialTechniqueIds;
    if (typeof window !== 'undefined' && isLangSwitching) {
      try {
        const saved = sessionStorage.getItem('deep_body_selected_technique_ids');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Consume language switch flag or clear stale session on regular visit
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('is_vip_lang_switching') === 'true') {
        sessionStorage.removeItem('is_vip_lang_switching');
      } else if (!initialStaff || initialStaff.length === 0) {
        sessionStorage.removeItem('deep_body_current_step');
        sessionStorage.removeItem('deep_body_selected_staff_ids');
        sessionStorage.removeItem('deep_body_selected_staff_info');
        sessionStorage.removeItem('deep_body_grouping_mode');
        sessionStorage.removeItem('deep_body_selected_technique_ids');
      }
    }
  }, [initialStaff]);

  // Auto scroll to top whenever step changes (ensures entering section 1 from the top on all cards)
  useEffect(() => {
    scrollToTop();
    const t1 = setTimeout(scrollToTop, 50);
    const t2 = setTimeout(scrollToTop, 150);
    const t3 = setTimeout(scrollToTop, 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [step]);

  // Fetch VIP pricing table & Deep Body methods from SystemConfigs
  useEffect(() => {
    fetch('/api/config/menu-vip')
      .then((res) => res.json())
      .then((data) => {
        if (data.pricing && typeof data.pricing === 'object' && !Array.isArray(data.pricing)) {
          setVipPricingTable(data.pricing as VipPricingTable);
        }
        if (data.deepBodyMethods && Array.isArray(data.deepBodyMethods) && data.deepBodyMethods.length > 0) {
          setDynamicMethods(data.deepBodyMethods as DeepBodyTechnique[]);
        }
      })
      .catch((err) => console.error('[DeepBody] Pricing error:', err));
  }, []);

  const handleBack = () => {
    scrollToTop();
    if (step === 'BOOKING_CONFIG') {
      setStep('STAFF');
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('deep_body_current_step');
        sessionStorage.removeItem('deep_body_selected_staff_ids');
        sessionStorage.removeItem('deep_body_selected_staff_info');
        sessionStorage.removeItem('deep_body_selected_technique_ids');
      }
    } else {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('deep_body_current_step');
        sessionStorage.removeItem('deep_body_selected_staff_ids');
        sessionStorage.removeItem('deep_body_selected_staff_info');
        sessionStorage.removeItem('deep_body_grouping_mode');
        sessionStorage.removeItem('deep_body_selected_technique_ids');
      }
      onBack();
    }
  };

  const handleBookingConfirm = (
    data: {
      techniqueIds: string[];
      techniqueNames: string[];
      totalDuration: number;
      totalPrice: number;
      totalPriceUSD?: number;
      serviceId: string;
      customerNotes?: string;
      focus?: string[];
      avoid?: string[];
      note?: string;
      bodyParts?: {
        focus: string[];
        avoid: string[];
      };
    },
    action: 'SELECT_MORE' | 'CHECKOUT' = 'SELECT_MORE'
  ) => {
    const isAllFour =
      data.techniqueIds.some(
        (id) =>
          id.toLowerCase().includes('mix') ||
          id.toLowerCase().includes('four') ||
          id === 'mixofourtherapies'
      ) ||
      data.techniqueIds.length >= 4 ||
      data.techniqueNames.length >= 4;

    const displayName = isAllFour
      ? '4 liệu trình (Ấn huyệt, Thái, Dầu & Đá Nóng)'
      : data.techniqueNames.length > 0
      ? `${t.tab_deep_body}: ${data.techniqueNames.join(' + ')}`
      : t.tab_deep_body;

    const isSeparate = staffGroupingMode === 'SEPARATE';
    const separateTag = '(Mỗi khách 1 KTV)';
    const fourHandsTag = '(Tứ thủ - 2 KTV)';

    if (isSeparate && selectedStaffIds.length > 1) {
      selectedStaffIds.forEach((staffId) => {
        const staffInfo = selectedStaffInfoList.find((s) => s.id === staffId);
        addVipToCart({
          serviceId: data.serviceId,
          staffIds: [staffId],
          staffInfoList: staffInfo ? [staffInfo] : [],
          skillIds: data.techniqueIds,
          displayName: `${displayName} - ${t.staff_label} ${staffId}`,
          duration: data.totalDuration,
          totalPrice: data.totalPrice,
          totalPriceUSD: data.totalPriceUSD,
          customerNotes: data.customerNotes ? `${data.customerNotes} ${separateTag}` : separateTag,
          focus: data.focus,
          avoid: data.avoid,
          note: data.note,
        });
      });
    } else {
      addVipToCart({
        serviceId: data.serviceId,
        staffIds: selectedStaffIds,
        staffInfoList: selectedStaffInfoList,
        skillIds: data.techniqueIds,
        displayName,
        duration: data.totalDuration,
        totalPrice: data.totalPrice,
        totalPriceUSD: data.totalPriceUSD,
        customerNotes:
          staffGroupingMode === 'FOUR_HAND' && selectedStaffIds.length > 1
            ? `${data.customerNotes ? `${data.customerNotes} ` : ''}${fourHandsTag}`.trim()
            : data.customerNotes,
        focus: data.focus,
        avoid: data.avoid,
        note: data.note,
      });
    }

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('deep_body_current_step');
      sessionStorage.removeItem('deep_body_selected_staff_ids');
      sessionStorage.removeItem('deep_body_selected_staff_info');
      sessionStorage.removeItem('deep_body_grouping_mode');
      sessionStorage.removeItem('deep_body_selected_technique_ids');
    }

    if (action === 'CHECKOUT') {
      onCheckout();
    } else {
      setSelectedStaffIds([]);
      setSelectedStaffInfoList([]);
      setStaffGroupingMode(null);
      setSelectedTechniqueIds([]);
      setStep('STAFF');
    }
  };

  const handleAddAnother = () => {
    setSelectedStaffIds([]);
    setSelectedStaffInfoList([]);
    setStaffGroupingMode(null);
    setSelectedTechniqueIds([]);
    setStep('STAFF');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('deep_body_current_step');
      sessionStorage.removeItem('deep_body_selected_staff_ids');
      sessionStorage.removeItem('deep_body_selected_staff_info');
      sessionStorage.removeItem('deep_body_grouping_mode');
      sessionStorage.removeItem('deep_body_selected_technique_ids');
    }
  };

  const handleCartUpdateItem = (cartId: string, saveData: VipEditSaveData) => {
    updateVipCartItem(cartId, {
      vipSkillIds: saveData.vipSkillIds,
      vipDuration: saveData.vipDuration,
      vipDisplayName: saveData.vipDisplayName,
      vipCustomerNotes: saveData.vipCustomerNotes,
      priceVND: saveData.priceVND,
    });
  };

  return (
    <div className="w-full h-full min-h-0 min-w-0 flex flex-col relative overflow-hidden">
      {/* Step Subheader with Back Button if in BOOKING_CONFIG */}
      {step === 'BOOKING_CONFIG' && (
        <div className="px-6 py-2.5 border-b border-white/5 bg-[#121214]/60 backdrop-blur-sm flex items-center justify-between">
          <button
            onClick={() => setStep('STAFF')}
            className="flex items-center gap-2 text-sm sm:text-base font-bold text-[#e6c487] hover:underline cursor-pointer"
          >
            ← {t.btn_change_staff}
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div ref={scrollContainerRef} className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden w-full">
        <AnimatePresence mode="wait">
          {step === 'STAFF' && (
            <motion.div
              key="deep-staff"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <DeepStaffSelector
                lang={lang}
                cartHasItems={cart.some((i) => i.itemType === 'vip')}
                onConfirmSelection={(ids, staffInfoList, mode, techniqueIds) => {
                  setSelectedStaffIds(ids);
                  setSelectedStaffInfoList(staffInfoList);
                  setStaffGroupingMode(mode || null);
                  setSelectedTechniqueIds(techniqueIds);
                  setStep('BOOKING_CONFIG');
                  scrollToTop();
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('deep_body_current_step', 'BOOKING_CONFIG');
                    sessionStorage.setItem('deep_body_selected_staff_ids', JSON.stringify(ids));
                    sessionStorage.setItem('deep_body_selected_staff_info', JSON.stringify(staffInfoList));
                    sessionStorage.setItem('deep_body_selected_technique_ids', JSON.stringify(techniqueIds));
                    if (mode) sessionStorage.setItem('deep_body_grouping_mode', mode);
                    else sessionStorage.removeItem('deep_body_grouping_mode');
                  }
                }}
              />
            </motion.div>
          )}

          {step === 'BOOKING_CONFIG' && (
            <motion.div
              key="deep-config"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <DeepBookingConfig
                lang={lang}
                isBookingFlow={isBookingFlow}
                selectedStaffIds={selectedStaffIds}
                selectedStaffInfoList={selectedStaffInfoList}
                staffGroupingMode={staffGroupingMode}
                vipPricingTable={vipPricingTable}
                dynamicMethods={dynamicMethods}
                initialTechniqueIds={selectedTechniqueIds}
                onConfirm={handleBookingConfirm}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* VIP Cart Bottom Sheet */}
      <VipCartStep
        cart={cart}
        lang={lang}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={onCheckout}
        onAddAnother={handleAddAnother}
        onUpdateItem={handleCartUpdateItem}
        onRemoveGroup={removeVipGroup}
      />
    </div>
  );
}
