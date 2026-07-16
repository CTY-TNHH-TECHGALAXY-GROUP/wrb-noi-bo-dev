/*
 * File: CustomerType.i18n.ts
 * Chức năng: Định nghĩa các text đa ngôn ngữ cho trang chọn loại khách hàng
 * Chứa bản dịch cho 5 ngôn ngữ: en, vn, jp, kr, cn
 * Cung cấp type TranslationKey để type safety
 */

/**
 * Type định nghĩa các key có thể dịch
 */
export type TranslationKey = 'wc_title' | 'btn_walkin_title' | 'btn_walkin_desc' | 'btn_booking_title' | 'btn_booking_desc' | 'btn_old_title' | 'btn_back' | 'find_history' | 'desc_enter_email' | 'input_placeholder' | 'search' | 'cancel' | 'error_not_found' | 'error_desc' | 'btn_retry' | 'btn_register_new' | 'btn_logout' | 'or_manual';

/**
 * Object chứa tất cả bản dịch theo ngôn ngữ
 * Mỗi ngôn ngữ có record với các key tương ứng
 */
export const translations: Record<string, Record<TranslationKey, string>> = {
  en: {
    wc_title: 'Welcome',

    btn_walkin_title: 'Walk-in',
    btn_walkin_desc: 'Order at the Spa',
    btn_booking_title: 'Advance Booking',
    btn_booking_desc: 'Book for a future date',
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

    btn_walkin_title: 'Đặt Tại Tiệm',
    btn_walkin_desc: 'Làm dịch vụ ngay bây giờ',
    btn_booking_title: 'Đặt Lịch Trước',
    btn_booking_desc: 'Hẹn lịch cho ngày/giờ khác',
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

    btn_walkin_title: 'ご来店注文',
    btn_walkin_desc: '今すぐサービスを受ける',
    btn_booking_title: '事前予約',
    btn_booking_desc: '別の日時で予約する',
    btn_old_title: '注文履歴を見る',
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

    btn_walkin_title: '현장 주문',
    btn_walkin_desc: '지금 바로 서비스 이용',
    btn_booking_title: '사전 예약',
    btn_booking_desc: '다른 날짜/시간으로 예약',
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

    btn_walkin_title: '到店下单',
    btn_walkin_desc: '立即体验服务',
    btn_booking_title: '提前预约',
    btn_booking_desc: '预约其他日期/时间',
    btn_old_title: '查看订单记录',
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