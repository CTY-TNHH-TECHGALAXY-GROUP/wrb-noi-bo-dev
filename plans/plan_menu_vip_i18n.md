# Kế hoạch tổng hợp File Ngôn Ngữ (i18n) cho Luồng Menu VIP

## 1. Phân tích hiện trạng
Hiện tại, ngôn ngữ trong luồng **Menu VIP** đang nằm rải rác ở nhiều nơi:
1. File từ điển chính: `src/components/Menu/Premium/Premium.i18n.ts`
2. Dictionary nội bộ (inline): `src/components/Menu/Premium/ConfirmationScreen/index.tsx`
3. Text hardcode (isVi ? '...' : '...'): Trong các file `IntentSelector`, `CategorySelector`, `SkillBuilder`, `TimeSlotPicker`, và `BookingConfig/index.tsx`.

## 2. Mục tiêu
Gộp tất cả các từ khóa trên vào **1 file duy nhất** là `Premium.i18n.ts` để tiện quản lý đa ngôn ngữ (vi, en, kr, cn, jp). Dưới đây là bản nháp tổng hợp toàn bộ các text bằng Tiếng Việt và Tiếng Anh để bạn có thể rà soát, điều chỉnh hoặc bổ sung trước khi mình tiến hành code.

---

## 3. Nội dung file ngôn ngữ tổng hợp cần Review

Dưới đây là nội dung JSON/Object chứa toàn bộ các text. Vui lòng **đọc và điều chỉnh lại câu chữ** nếu bạn muốn thay đổi.

```typescript
export const premiumI18n: Record<string, Record<string, string>> = {
  // ==========================================
  // 🇻🇳 VIETNAMESE (TIẾNG VIỆT)
  // ==========================================
  vi: {
    // 1. Parent Steps (Tiêu đề các bước)
    step_staff: 'CHỌN CHUYÊN GIA',
    step_config: 'TÙY CHỌN DỊCH VỤ',
    step_confirm: 'XÁC NHẬN',

    // 2. StaffSelector (Chọn KTV)
    ss_title: 'DANH SÁCH CHUYÊN GIA',
    ss_subtitle: 'Những đôi tay tài hoa sẵn sàng chăm sóc bạn',
    ss_searchPlaceholder: 'Tìm theo tên hoặc mã (NH001)',
    ss_noResult: 'Không tìm thấy nhân viên',
    ss_maxHint: 'Tối đa {max} chuyên viên',
    ss_bookNow: 'ĐẶT NGAY',
    ss_unavailable: 'KHÔNG KHẢ DỤNG',
    ss_continueWith: 'Tiếp tục với {count} chuyên viên',
    ss_quote: '"Nghệ thuật của sự thư giãn bắt đầu từ những tâm hồn tinh tế nhất."',

    // 3. Status Badges (Trạng thái KTV)
    status_available: 'SẴN SÀNG',
    status_busy: 'ĐANG PHỤC VỤ',
    status_freeAfter: 'RẢNH SAU {time}',
    status_notYet: 'CHƯA VÔ CA',
    status_offDuty: 'ĐÃ TAN CA',
    status_startsAt: 'VÀO CA LÚC {time}',
    status_onLeave: 'NGÀY NGHỈ',

    // 4. BookingConfig (Tùy chọn dịch vụ chung)
    bc_servicesByKtv: 'CHỌN DỊCH VỤ CHO TỪNG KTV',
    bc_skills: 'kỹ năng',
    bc_expertTherapist: 'Chuyên viên Thượng hạng',
    bc_specialties: 'KỸ NĂNG CHUYÊN BIỆT',
    bc_minDurationHint: '{le} lẻ + {chinh} chính → Tối thiểu {min} phút',
    bc_mainServices: 'Dịch vụ Chính',
    bc_addons: 'Dịch vụ Lẻ',
    bc_noSkills: 'Không có kỹ năng phù hợp',
    bc_selectDuration: 'CHỌN THỜI LƯỢNG DỊCH VỤ',
    bc_vatIncluded: 'Giá đã bao gồm VAT',
    bc_mins: 'phút',
    bc_servicePreference: 'HÌNH THỨC SỬ DỤNG',
    bc_walkIn: 'Đang Tại Chi Nhánh',
    bc_bookAdvance: 'Đặt Lịch Trước',
    bc_selectDate: 'CHỌN NGÀY',
    bc_availableTimes: 'THỜI GIAN TRỐNG',
    bc_timeNote: '* Tiệm sẽ xác nhận lịch chính xác khi liên hệ',
    bc_selected: 'Đã chọn',
    bc_confirmSelection: 'XÁC NHẬN LỰA CHỌN',
    bc_terms_agree: 'Tôi đã đọc và đồng ý với',
    bc_terms_title: 'Điều khoản & Chính sách',
    
    // --> Text Popup Điều khoản (mới lấy từ hardcode)
    bc_terms_desc_1: 'Đối với đặt lịch tự do (chưa chọn thời gian cụ thể), hệ thống sẽ ghi nhận và bộ phận CSKH của Spa sẽ trực tiếp xác nhận, liên hệ chốt giờ với Quý khách.',
    bc_terms_desc_2: 'Quý khách vui lòng đến đúng giờ hẹn. Trong trường hợp đến sớm hoặc trễ hơn dự kiến, Quý khách có thể sẽ phải chờ để nhân viên sắp xếp chỗ.',
    bc_terms_btn_agree: 'ĐỒNG Ý',

    // 5. Calendar & Days (Lịch)
    day_sun: 'CN', day_mon: 'Thứ 2', day_tue: 'Thứ 3', day_wed: 'Thứ 4', day_thu: 'Thứ 5', day_fri: 'Thứ 6', day_sat: 'Thứ 7',
    cal_t2: 'T2', cal_t3: 'T3', cal_t4: 'T4', cal_t5: 'T5', cal_t6: 'T6', cal_t7: 'T7', cal_cn: 'CN',
    bc_calendar: 'Lịch 📅',
    bc_moreDate: 'Ngày khác',
    bc_noTimeSlots: 'Không còn khung giờ trống',
    bc_month: 'Tháng ',
    bc_close: 'Đóng',

    // 6. IntentSelector & CategorySelector (Các màn hình mở đầu - từ hardcode)
    is_title: 'LỜI CHÀO TIÊN QUYẾT',
    is_question: 'Hôm nay quý khách muốn tập trung vào điều gì?',
    is_explore: 'Khám phá ngay',
    is_preferred_title: 'CHỌN NHÂN VIÊN TRỰC TIẾP',
    is_preferred_desc: 'Kết nối cá nhân hóa',
    cats_match_desc: 'Hệ thống sẽ tìm chuyên gia phù hợp nhất',

    // 7. SkillBuilder (Trang chọn skill chi tiết - từ hardcode)
    sb_title: 'Bạn đã chọn chuyên gia, hay giao việc cho họ?',
    sb_confirm_btn: 'Chốt lộ trình',

    // 8. TimeSlotPicker (Chọn giờ cho nhóm - từ hardcode)
    ts_title: 'Xác nhận thời gian',
    ts_desc: 'Slot khả dụng chung cho nhóm KTV của bạn',
    ts_selected: 'Bạn đã chọn {time}',
    ts_walk_in: 'Đến lấy vé tại Chi Nhánh (Push Live)',
    ts_walk_in_desc: 'Chúng tôi sẽ thông báo trực tuyến để KTV chuẩn bị đón bạn',
    ts_finalize_btn: 'Chốt Cấu Hình Xong!',

    // 9. ConfirmationScreen (Màn hình xác nhận liên hệ cuối cùng - từ inline file)
    cs_heroSub: 'Trải nghiệm đẳng cấp',
    cs_heroTitle: 'Hành Trình Chữa Lành',
    cs_bookingDetails: 'THÔNG TIN ĐẶT LỊCH',
    cs_therapists: 'Chuyên viên',
    cs_schedule: 'Thời gian',
    cs_walkIn: 'Đến chi nhánh lấy vé trực tiếp',
    cs_services: 'Dịch vụ đã chọn',
    cs_totalDuration: 'Tổng thời gian',
    cs_pricing: 'Giá dịch vụ',
    cs_customerInfo: 'THÔNG TIN LIÊN HỆ',
    cs_customerInfoDesc: 'Spa sẽ liên hệ xác nhận lịch hẹn qua thông tin bên dưới',
    cs_name: 'Họ và tên *',
    cs_namePlaceholder: 'Nhập họ và tên...',
    cs_phone: 'Số điện thoại *',
    cs_phonePlaceholder: 'VD: 0901234567',
    cs_email: 'Email (tùy chọn)',
    cs_emailPlaceholder: 'email@example.com',
    cs_note: 'Ghi chú',
    cs_notePlaceholder: 'Yêu cầu đặc biệt (nếu có)...',
    cs_submitBtn: 'XÁC NHẬN ĐẶT LỊCH',
    cs_submitting: 'ĐANG GỬI...',
    cs_errorName: 'Vui lòng nhập họ và tên',
    cs_errorPhone: 'Vui lòng nhập số điện thoại',
    cs_successTitle: 'Đặt lịch thành công!',
    cs_successMsg: 'Cảm ơn bạn! Spa sẽ liên hệ xác nhận trong thời gian sớm nhất.',
    cs_successBtn: 'VỀ TRANG CHỦ',
    cs_badgeConfirmed: '✅ Đặt lịch thành công',
    cs_badgeNeedsConfirm: '⚠️ Tiệm sẽ liên hệ xác nhận',
    cs_badgeRisky: '🔴 Cần xác nhận khẩn',
    cs_bookingCodeLabel: 'Mã đặt lịch',
  },

  // ==========================================
  // 🇬🇧 ENGLISH (TIẾNG ANH)
  // ==========================================
  en: {
    // 1. Parent Steps
    step_staff: 'SELECT EXPERT',
    step_config: 'CUSTOMIZE',
    step_confirm: 'CONFIRM',

    // 2. StaffSelector
    ss_title: 'OUR EXPERTS',
    ss_subtitle: 'Talented hands ready to care for you',
    ss_searchPlaceholder: 'Search by name or code',
    ss_noResult: 'No staff found',
    ss_maxHint: 'Maximum {max} therapists',
    ss_bookNow: 'BOOK NOW',
    ss_unavailable: 'UNAVAILABLE',
    ss_continueWith: 'Continue with {count} therapists',
    ss_quote: '"The art of relaxation begins with the most refined souls."',

    // 3. Status Badges
    status_available: 'AVAILABLE',
    status_busy: 'IN SERVICE',
    status_freeAfter: 'FREE AFTER {time}',
    status_notYet: 'NOT CHECKED IN',
    status_offDuty: 'OFF DUTY',
    status_startsAt: 'STARTS AT {time}',
    status_onLeave: 'ON LEAVE',

    // 4. BookingConfig
    bc_servicesByKtv: 'SERVICES BY THERAPIST',
    bc_skills: 'skills',
    bc_expertTherapist: 'Expert Therapist',
    bc_specialties: 'SPECIALTIES',
    bc_minDurationHint: '{le} extras + {chinh} main → Min {min} mins',
    bc_mainServices: 'Main Services',
    bc_addons: 'Add-ons',
    bc_noSkills: 'No matching skills',
    bc_selectDuration: 'SELECT DURATION',
    bc_vatIncluded: 'Price includes VAT',
    bc_mins: 'mins',
    bc_servicePreference: 'SERVICE PREFERENCE',
    bc_walkIn: 'Walk-in Box',
    bc_bookAdvance: 'Book in Advance',
    bc_selectDate: 'SELECT DATE',
    bc_availableTimes: 'AVAILABLE TIMES',
    bc_timeNote: '* Exact slot confirmed when staff contact you',
    bc_selected: 'Selected',
    bc_confirmSelection: 'CONFIRM SELECTION',
    bc_terms_agree: 'I have read and agree to the',
    bc_terms_title: 'Terms & Policies',
    bc_terms_desc_1: 'For open bookings (without specific time), the system will record your request and our Customer Service team will contact you directly to confirm the exact time.',
    bc_terms_desc_2: 'Please arrive on time. In case of early or late arrival, you may need to wait for our staff to arrange a spot.',
    bc_terms_btn_agree: 'I AGREE',

    // 5. Calendar & Days
    day_sun: 'Sun', day_mon: 'Mon', day_tue: 'Tue', day_wed: 'Wed', day_thu: 'Thu', day_fri: 'Fri', day_sat: 'Sat',
    cal_t2: 'Mo', cal_t3: 'Tu', cal_t4: 'We', cal_t5: 'Th', cal_t6: 'Fr', cal_t7: 'Sa', cal_cn: 'Su',
    bc_calendar: 'Cal 📅',
    bc_moreDate: 'More...',
    bc_noTimeSlots: 'No available time slots',
    bc_month: 'Month ',
    bc_close: 'Close',

    // 6. IntentSelector & CategorySelector
    is_title: 'YOUR SANCTUARY',
    is_question: 'What brings you joy today?',
    is_explore: 'Explore',
    is_preferred_title: 'PREFERRED THERAPIST',
    is_preferred_desc: 'Personalized connection',
    cats_match_desc: 'We will match the best specialist for you',

    // 7. SkillBuilder
    sb_title: 'Design bespoke services for your therapists',
    sb_confirm_btn: 'Confirm Treatment',

    // 8. TimeSlotPicker
    ts_title: 'Confirm Time',
    ts_desc: 'Available slots for your team',
    ts_selected: 'Selected {time}',
    ts_walk_in: 'Walk-in (Live Update)',
    ts_walk_in_desc: 'We will notify your therapists to prepare',
    ts_finalize_btn: 'Finalize Booking',

    // 9. ConfirmationScreen
    cs_heroSub: 'Premium Experience',
    cs_heroTitle: 'Healing Journey',
    cs_bookingDetails: 'BOOKING DETAILS',
    cs_therapists: 'Therapists',
    cs_schedule: 'Schedule',
    cs_walkIn: 'Walk-in at branch',
    cs_services: 'Selected Services',
    cs_totalDuration: 'Total Duration',
    cs_pricing: 'Service Price',
    cs_customerInfo: 'CONTACT INFORMATION',
    cs_customerInfoDesc: 'We will contact you to confirm the appointment',
    cs_name: 'Full Name *',
    cs_namePlaceholder: 'Enter your name...',
    cs_phone: 'Phone Number *',
    cs_phonePlaceholder: 'e.g. +84901234567',
    cs_email: 'Email (optional)',
    cs_emailPlaceholder: 'email@example.com',
    cs_note: 'Note',
    cs_notePlaceholder: 'Special requests (if any)...',
    cs_submitBtn: 'CONFIRM BOOKING',
    cs_submitting: 'SUBMITTING...',
    cs_errorName: 'Please enter your name',
    cs_errorPhone: 'Please enter your phone number',
    cs_successTitle: 'Booking Confirmed!',
    cs_successMsg: 'Thank you! Our spa will contact you shortly to confirm.',
    cs_successBtn: 'BACK TO HOME',
    cs_badgeConfirmed: '✅ Booking Confirmed',
    cs_badgeNeedsConfirm: '⚠️ We will contact you to confirm',
    cs_badgeRisky: '🔴 Urgent confirmation needed',
    cs_bookingCodeLabel: 'Booking Code',
  }
};
```

---

> [!IMPORTANT]
> **Yêu cầu dành cho bạn:**
> 1. Đọc lướt qua file tổng hợp ở trên.
> 2. Hãy cho mình biết bạn muốn **sửa/bổ sung** câu chữ nào không (có thể copy và sửa trực tiếp).
> 3. Nếu bạn đồng ý với nội dung này, báo `OK` để mình tiến hành sửa file code `Premium.i18n.ts`, gỡ bỏ toàn bộ text hardcode và áp dụng file dictionary chung này cho tất cả màn hình VIP Menu.

Vui lòng cho mình xin ý kiến của bạn nhé! Mọi thứ đã sẵn sàng để tích hợp nếu bạn thấy ổn.
