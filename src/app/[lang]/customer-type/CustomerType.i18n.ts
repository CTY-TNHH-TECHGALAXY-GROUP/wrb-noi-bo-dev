/*
 * File: CustomerType.i18n.ts
 * Chức năng: Định nghĩa các text đa ngôn ngữ cho trang chọn loại khách hàng
 * Chứa bản dịch cho 5 ngôn ngữ: en, vn, jp, kr, cn
 * Cung cấp type TranslationKey để type safety
 */

/**
 * Type định nghĩa các key có thể dịch
 */
export type TranslationKey = 'wc_title' | 'subtitle_journey' | 'badge_recommended' | 'desc_old_title' | 'btn_continue_journey' | 'label_new_visit' | 'btn_walkin_title' | 'btn_walkin_desc' | 'btn_booking_title' | 'btn_booking_desc' | 'btn_advance_title' | 'btn_advance_desc' | 'btn_history_title' | 'btn_history_desc' | 'btn_old_title' | 'btn_back' | 'find_history' | 'desc_enter_email' | 'input_placeholder' | 'search' | 'cancel' | 'error_not_found' | 'error_desc' | 'btn_retry' | 'btn_register_new' | 'btn_logout' | 'or_manual';

/**
 * Object chứa tất cả bản dịch theo ngôn ngữ
 * Mỗi ngôn ngữ có record với các key tương ứng
 */
export const translations: Record<string, Record<TranslationKey, string>> = {
  en: {
    wc_title: 'Welcome',
    subtitle_journey: 'Continue your spa journey',
    badge_recommended: 'RECOMMENDED',
    desc_old_title: 'Review active bookings, previous treatments and order status.',
    btn_continue_journey: 'Continue Journey →',
    label_new_visit: 'NEW VISIT',

    btn_walkin_title: 'Walk-in',
    btn_walkin_desc: 'Order at the Spa • Ready in about 15 mins',
    btn_booking_title: 'Contacted First',
    btn_booking_desc: 'Called or contacted in advance, service not selected yet',
    btn_advance_title: 'Advance Booking',
    btn_advance_desc: 'Book a specific date & time',
    btn_history_title: 'Order History',
    btn_history_desc: 'Review your active bookings',
    btn_old_title: 'View Order History',
    btn_back: 'Back',
    find_history: 'Find History',
    desc_enter_email: 'Enter your phone number or email to retrieve past visits.',
    input_placeholder: 'Phone number or Email',
    search: 'SEARCH',
    cancel: 'Cancel',
    error_not_found: 'Not Found',
    error_desc: 'This phone number or email has not been used before.',
    btn_retry: 'Try Another Phone/Email',
    btn_register_new: 'Register New Customer',
    btn_logout: 'Switch Account / Logout',
    or_manual: 'or enter manually'
  },
  vi: {
    wc_title: 'Chào mừng',
    subtitle_journey: 'Tiếp tục hành trình của bạn',
    badge_recommended: 'KHUYÊN DÙNG',
    desc_old_title: 'Xem lại các lịch đặt, liệu trình đã làm và trạng thái đơn hàng.',
    btn_continue_journey: 'Tiếp Tục →',
    label_new_visit: 'KHÁCH MỚI',

    btn_walkin_title: 'Đặt Tại Tiệm',
    btn_walkin_desc: 'Đặt tại tiệm • Sẵn sàng trong khoảng 15 phút',
    btn_booking_title: 'Đã Liên Hệ Trước',
    btn_booking_desc: 'Đã gọi hoặc liên hệ trước, chưa chọn dịch vụ',
    btn_advance_title: 'Đặt lịch trước',
    btn_advance_desc: 'Đặt trước ngày giờ cụ thể',
    btn_history_title: 'Lịch sử đơn hàng',
    btn_history_desc: 'Xem lại các lịch đặt',
    btn_old_title: 'Xem lịch sử đơn hàng',
    btn_back: 'Quay lại',
    find_history: 'Tìm Lịch Sử',
    desc_enter_email: 'Nhập số điện thoại hoặc email để tìm lại lịch sử ghé thăm.',
    input_placeholder: 'Số điện thoại hoặc Email',
    search: 'TÌM KIẾM',
    cancel: 'Hủy',
    error_not_found: 'Không Tìm Thấy',
    error_desc: 'Số điện thoại hoặc email này chưa từng sử dụng dịch vụ.',
    btn_retry: 'Thử Số Điện Thoại / Email Khác',
    btn_register_new: 'Đăng Ký Khách Mới',
    btn_logout: 'Đổi Tài Khoản / Đăng Xuất',
    or_manual: 'hoặc nhập số điện thoại/email'
  },
  jp: {
    wc_title: 'ようこそ',
    subtitle_journey: 'スパの旅を続ける',
    badge_recommended: 'おすすめ',
    desc_old_title: '予約、過去の施術、注文状況を確認します。',
    btn_continue_journey: '次へ →',
    label_new_visit: '初めての方',

    btn_walkin_title: '来店予約',
    btn_walkin_desc: '店頭でのご注文 • 約15分でご案内可能です',
    btn_booking_title: '事前連絡済み',
    btn_booking_desc: '事前に電話や連絡済みですが、サービスは未定です',
    btn_advance_title: '事前予約',
    btn_advance_desc: '特定の日時を予約する',
    btn_history_title: '注文履歴',
    btn_history_desc: '予約を確認する',
    btn_old_title: '注文履歴を表示',
    btn_back: '戻る',
    find_history: '履歴検索',
    desc_enter_email: '過去の履歴を検索するには電話番号またはメールを入力してください。',
    input_placeholder: '電話番号またはメール',
    search: '検索',
    cancel: 'キャンセル',
    error_not_found: '見つかりません',
    error_desc: 'この電話番号またはメールアドレスは登録されていません。',
    btn_retry: '別の電話番号/メールを試す',
    btn_register_new: '新規登録',
    btn_logout: 'アカウント切り替え / ログアウト',
    or_manual: 'または電話番号/メール入力'
  },
  kr: {
    wc_title: '환영합니다',
    subtitle_journey: '스파 여정을 계속하세요',
    badge_recommended: '추천',
    desc_old_title: '예약, 이전 시술 및 주문 상태를 확인하세요.',
    btn_continue_journey: '계속하기 →',
    label_new_visit: '처음 방문',

    btn_walkin_title: '매장 예약',
    btn_walkin_desc: '매장 예약 • 약 15분 후 서비스 가능',
    btn_booking_title: '사전 연락 완료',
    btn_booking_desc: '사전 연락을 했으나 서비스는 미정',
    btn_advance_title: '사전 예약',
    btn_advance_desc: '특정 날짜 및 시간 예약',
    btn_history_title: '주문 내역',
    btn_history_desc: '활성 예약 검토',
    btn_old_title: '주문 내역 보기',
    btn_back: '돌아가기',
    find_history: '기록 찾기',
    desc_enter_email: '이전 방문 기록을 확인하려면 전화번호 또는 이메일을 입력하세요.',
    input_placeholder: '전화번호 또는 이메일',
    search: '검색',
    cancel: '취소',
    error_not_found: '찾을 수 없음',
    error_desc: '이 전화번호 또는 이메일은 사용된 적이 없습니다.',
    btn_retry: '다른 전화번호/이메일 시도',
    btn_register_new: '신규 고객 등록',
    btn_logout: '계정 전환 / 로그아웃',
    or_manual: '또는 전화번호/이메일 입력'
  },
  cn: {
    wc_title: '欢迎',
    subtitle_journey: '继续您的水疗之旅',
    badge_recommended: '推荐',
    desc_old_title: '查看预约、过往疗程和订单状态。',
    btn_continue_journey: '继续 →',
    label_new_visit: '新访客',

    btn_walkin_title: '到店预约',
    btn_walkin_desc: '到店下单 • 约15分钟后可服务',
    btn_booking_title: '已提前联系',
    btn_booking_desc: '已提前沟通，尚未选择服务',
    btn_advance_title: '提前预订',
    btn_advance_desc: '预订特定日期和时间',
    btn_history_title: '订单历史',
    btn_history_desc: '查看您的有效预订',
    btn_old_title: '查看订单历史',
    btn_back: '返回',
    find_history: '查找记录',
    desc_enter_email: '请输入您的电话号码或电子邮件以检索过往记录。',
    input_placeholder: '电话号码或邮箱',
    search: '搜索',
    cancel: '取消',
    error_not_found: '未找到',
    error_desc: '此电话号码或电子邮件尚未使用过。',
    btn_retry: '尝试其他电话/邮箱',
    btn_register_new: '注册新客户',
    btn_logout: '切换账号 / 退出',
    or_manual: '或输入电话/邮箱'
  }
};