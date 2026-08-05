# Kế Hoạch Xóa Bỏ Điều Khoản Thừa Tại Menu VIP

**Mục tiêu:** Xóa bỏ bước chấp nhận điều khoản ở màn hình cấu hình Menu VIP (Bespoke/Premium), chỉ giữ lại ở bước thanh toán cuối cùng (Checkout) để luồng đi mượt mà và đồng nhất với các dịch vụ thường.

## Phân Tích Nguyên Nhân
Hiện tại trong luồng Booking, khách hàng chọn Menu VIP đang bị yêu cầu chấp nhận điều khoản 2 lần:
1. Tại màn hình cấu hình Menu VIP (chọn thời gian) ở file `src/components/Menu/Premium/BookingConfig/index.tsx`.
2. Tại màn hình Thanh toán/Checkout cuối cùng ở file `src/components/Checkout/PaymentModal.tsx`.

Điều này xảy ra do cờ `isBookingFlow` được truyền vào cả 2 component trên và kích hoạt UI hiển thị checkbox điều khoản ở cả hai nơi. Việc yêu cầu xác nhận 2 lần là dư thừa và làm luồng booking bị khựng lại.

## Các Bước Triển Khai
1. **Sửa file:** `src/components/Menu/Premium/BookingConfig/index.tsx`
   - Xóa bỏ toàn bộ block code render Checkbox "Điều khoản & Chính sách".
   - Cập nhật lại nút **"XÁC NHẬN CHỌN"** để không còn bị disable bởi điều kiện `isAgreedTerms` nữa.

## Trạng Thái
- [x] Đã được người dùng duyệt
- [x] Đã hoàn thành sửa code trong file `src/components/Menu/Premium/BookingConfig/index.tsx`.
