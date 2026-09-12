'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DeepStaffSelector from './StaffSelector';
import DeepBookingConfig from './BookingConfig';
import VipCartStep from '../Premium/VipCartStep';
import { type VipStaffInfo } from '@/lib/vipStaffUtils';
import { type VipPricingTable } from '@/lib/vipPricingEngine';
import { useMenuData } from '@/components/Menu/MenuContext';
import { getDeepBodyT } from './DeepBody.i18n';
import { type VipEditSaveData } from '@/components/Checkout/VipEditModal';

interface DeepBodyMenuProps {
  lang: string;
  isBookingFlow?: boolean;
  onBack: () => void;
  onCheckout: () => void;
  onSwitchToStandard?: () => void;
}

type MenuStep = 'STAFF' | 'BOOKING_CONFIG';

export default function DeepBodyMenu({
  lang,
  isBookingFlow,
  onBack,
  onCheckout,
  onSwitchToStandard,
}: DeepBodyMenuProps) {
  const t = getDeepBodyT(lang);
  const { cart, addVipToCart, updateVipCartItem, removeVipGroup } = useMenuData();

  // Persisted state across language switch
  const [step, setStep] = useState<MenuStep>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('deep_body_current_step') as MenuStep | null;
      if (saved === 'BOOKING_CONFIG' || saved === 'STAFF') return saved;
    }
    return 'STAFF';
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [vipPricingTable, setVipPricingTable] = useState<VipPricingTable | undefined>(undefined);

  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('deep_body_selected_staff_ids');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });
  const [selectedStaffInfoList, setSelectedStaffInfoList] = useState<VipStaffInfo[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('deep_body_selected_staff_info');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });
  const [staffGroupingMode, setStaffGroupingMode] = useState<'FOUR_HAND' | 'SEPARATE' | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('deep_body_grouping_mode') as 'FOUR_HAND' | 'SEPARATE' | null;
      if (saved === 'FOUR_HAND' || saved === 'SEPARATE') return saved;
    }
    return null;
  });

  // Fetch VIP pricing table
  useEffect(() => {
    fetch('/api/config/menu-vip')
      .then((res) => res.json())
      .then((data) => {
        if (data.pricing && typeof data.pricing === 'object' && !Array.isArray(data.pricing)) {
          setVipPricingTable(data.pricing as VipPricingTable);
        }
      })
      .catch((err) => console.error('[DeepBody] Pricing error:', err));
  }, []);

  const handleBack = () => {
    if (step === 'BOOKING_CONFIG') {
      setStep('STAFF');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('deep_body_current_step', 'STAFF');
      }
    } else {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('deep_body_current_step');
        sessionStorage.removeItem('deep_body_selected_staff_ids');
        sessionStorage.removeItem('deep_body_selected_staff_info');
        sessionStorage.removeItem('deep_body_grouping_mode');
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
      customerNotes?: string;
    },
    action: 'SELECT_MORE' | 'CHECKOUT' = 'SELECT_MORE'
  ) => {
    const displayName =
      data.techniqueNames.length > 0
        ? `${t.tab_deep_body}: ${data.techniqueNames.join(' + ')}`
        : t.tab_deep_body;

    const isSeparate = staffGroupingMode === 'SEPARATE';

    if (isSeparate && selectedStaffIds.length > 1) {
      selectedStaffIds.forEach((staffId) => {
        const staffInfo = selectedStaffInfoList.find((s) => s.id === staffId);
        addVipToCart({
          staffIds: [staffId],
          staffInfoList: staffInfo ? [staffInfo] : [],
          skillIds: data.techniqueIds,
          displayName: `${displayName} - ${t.staff_label} ${staffId}`,
          duration: data.totalDuration,
          totalPrice: data.totalPrice,
          customerNotes: data.customerNotes ? `${data.customerNotes} (${t.prefix_separate})` : `(${t.prefix_separate})`,
        });
      });
    } else {
      addVipToCart({
        staffIds: selectedStaffIds,
        staffInfoList: selectedStaffInfoList,
        skillIds: data.techniqueIds,
        displayName,
        duration: data.totalDuration,
        totalPrice: data.totalPrice,
        customerNotes:
          staffGroupingMode === 'FOUR_HAND' && selectedStaffIds.length > 1
            ? `${data.customerNotes ? `${data.customerNotes} ` : ''}(${t.prefix_four_hands})`.trim()
            : data.customerNotes,
      });
    }

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('deep_body_current_step');
      sessionStorage.removeItem('deep_body_selected_staff_ids');
      sessionStorage.removeItem('deep_body_selected_staff_info');
      sessionStorage.removeItem('deep_body_grouping_mode');
    }

    if (action === 'CHECKOUT') {
      onCheckout();
    } else {
      setSelectedStaffIds([]);
      setSelectedStaffInfoList([]);
      setStaffGroupingMode(null);
      setStep('STAFF');
    }
  };

  const handleAddAnother = () => {
    setSelectedStaffIds([]);
    setSelectedStaffInfoList([]);
    setStaffGroupingMode(null);
    setStep('STAFF');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('deep_body_current_step');
      sessionStorage.removeItem('deep_body_selected_staff_ids');
      sessionStorage.removeItem('deep_body_selected_staff_info');
      sessionStorage.removeItem('deep_body_grouping_mode');
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
    <div className="w-full h-full flex flex-col relative overflow-hidden">
      {/* Step Subheader with Back Button if in BOOKING_CONFIG */}
      {step === 'BOOKING_CONFIG' && (
        <div className="px-6 py-2.5 border-b border-white/5 bg-[#121214]/60 backdrop-blur-sm flex items-center justify-between">
          <button
            onClick={() => setStep('STAFF')}
            className="flex items-center gap-2 text-sm sm:text-base font-bold text-[#e6c487] hover:underline"
          >
            ← {t.btn_change_staff}
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
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
                onConfirmSelection={(ids, staffInfoList, mode) => {
                  setSelectedStaffIds(ids);
                  setSelectedStaffInfoList(staffInfoList);
                  setStaffGroupingMode(mode || null);
                  setStep('BOOKING_CONFIG');
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('deep_body_current_step', 'BOOKING_CONFIG');
                    sessionStorage.setItem('deep_body_selected_staff_ids', JSON.stringify(ids));
                    sessionStorage.setItem('deep_body_selected_staff_info', JSON.stringify(staffInfoList));
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
                vipPricingTable={vipPricingTable}
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
