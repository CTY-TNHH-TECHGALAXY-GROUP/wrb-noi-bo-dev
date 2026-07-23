# Kế hoạch sửa luồng History & Booking VIP cho Khách cũ

Dựa trên phản hồi của bạn về việc "chỗ chỉnh sửa và tạo đơn mới chưa có lựa chọn luồng booking hay ở tiệm" và khảo sát code trước đó, mình đã tổng hợp lại các lỗi cần xử lý và phương án giải quyết:

## 1. Lỗi thiếu lựa chọn Booking/Walk-in khi "Chỉnh sửa" & "Tạo đơn mới"
- **Hiện tại:** Nút **Tạo đơn mới** và **Chỉnh sửa** (Modify) trong `history/page.tsx` luôn đẩy trực tiếp sang `/${lang}/old-user/select-menu` (Luồng Walk-in/Tại tiệm).
- **Giải pháp:** 
  - Mở rộng popup chọn "Tại tiệm / Đặt trước" đang dùng cho tính năng Rebook để dùng chung cho cả 3 hành động: **Rebook**, **Modify**, **Create New**.
  - Nếu khách chọn "Walk-in": Điều hướng sang `/${lang}/old-user/select-menu`.
  - Nếu khách chọn "Booking": Điều hướng sang `/${lang}/new-user/booking/select-menu`.

## 2. Lỗi định tuyến sai luồng khi "Rebook" đơn VIP (Lỗi đã phân tích trước đó)
- **Hiện tại:** Khi bấm "Đặt lại" (Rebook) và chọn "Booking" hoặc "Walk-in", hệ thống code cứng đẩy về trang `standard/checkout` dù đơn hàng đó là đơn VIP.
- **Giải pháp:**
  - Kiểm tra xem giỏ hàng vừa được khôi phục (restore) có chứa dịch vụ VIP hay không.
  - Nếu có VIP: đẩy về `vip/checkout` tương ứng.
  - Nếu không có: đẩy về `standard/checkout` tương ứng.

## 3. Lỗi "Quên Ngày/Giờ" khi Booking VIP (Lỗi phụ - Tùy chọn)
- **Hiện tại:** Trong luồng VIP Booking, khách phải chọn Ngày/Giờ ở màn hình `BookingConfig` (để lọc KTV rảnh). Nhưng khi chuyển sang trang Checkout, hệ thống không truyền sang nên bắt khách chọn Ngày/Giờ lại một lần nữa.
- **Giải pháp:**
  - Sửa hàm `handleBookingConfirm` để lưu trữ lại `appointmentDate` và `timeSlot` đã chọn.
  - Khôi phục thông tin Ngày/Giờ này ở trang Checkout thay vì bắt khách chọn lại.

---

## 🛠 Kế hoạch chỉnh sửa File

### [MODIFY] `src/app/[lang]/old-user/history/page.tsx`
- Sửa state `rebookOrder` thành `actionContext: { action: 'rebook' | 'modify' | 'new', order?: any } | null`.
- Hàm `handleCreateNew` và `handleModify` sẽ gán `actionContext` để bật Modal.
- Hàm `handleConfirmAction(source: 'walk-in' | 'booking')` sẽ xử lý dựa trên `action`:
  - `rebook`: Khôi phục giỏ hàng -> Tính toán `targetMenuType` (vip hay standard) -> push sang checkout page tương ứng.
  - `modify`: Khôi phục giỏ hàng -> push sang `/select-menu` (của Walk-in hoặc Booking tuỳ theo `source`).
  - `new`: Xoá giỏ hàng -> push sang `/select-menu` (của Walk-in hoặc Booking tuỳ theo `source`).

### [MODIFY] `src/components/Menu/Premium/index.tsx` (Nếu bạn đồng ý xử lý lỗi 3)
- Truyền `appointmentDate` vào hàm giỏ hàng hoặc Local Storage để trang Checkout nhận dạng được.

---
**Bạn xác nhận kế hoạch trên để mình tiến hành viết code nhé? Và bạn có muốn mình xử lý luôn mục số 3 (Lỗi Quên Ngày/Giờ) không?**
