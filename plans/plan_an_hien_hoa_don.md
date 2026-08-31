# Kế hoạch: Bổ sung nút "Hiển thị hoá đơn" (Màn hình Booking Success)

## 📌 Phân tích hiện trạng
Dựa vào hình ảnh bạn cung cấp, UI hiện tại ở màn hình "Đặt lịch thành công" (trong `BookingConfirmModal.tsx`) đang **hiển thị mặc định toàn bộ chi tiết hoá đơn** (trong một thẻ màu đen có thanh cuộn). 
Điều này làm màn hình xác nhận trở nên quá dài và thanh cuộn xuất hiện trông không được gọn gàng.

## 💡 Đề xuất giải pháp (AI Sparring Partner)
Thay vì show toàn bộ bill ra một cách "lộ liễu" và chiếm nhiều diện tích, tôi đề xuất chúng ta sẽ áp dụng cơ chế **Accordion (Đóng/Mở)**:
1. **Trạng thái mặc định:** Ẩn thẻ đen chứa chi tiết hoá đơn.
2. **Thêm nút:** Bổ sung một nút "Xem chi tiết hoá đơn" (Show Invoice) ở ngay dưới dòng cảm ơn. Nút này thiết kế dạng text link hoặc button nhỏ viền vàng, tinh tế.
3. **Hiệu ứng:** Khi khách hàng bấm vào nút này, hoá đơn mới "xổ" xuống mượt mà để khách kiểm tra lại nếu cần.
4. **i18n (Đa ngôn ngữ):** Cập nhật file `BookingCheckout.i18n.ts` để bổ sung từ khoá cho nút này ở tất cả ngôn ngữ.

## 📝 Chi tiết thay đổi

### 1. `src/components/Booking/BookingCheckout.i18n.ts`
- Thêm key `btn_view_invoice` và `btn_hide_invoice` vào các ngôn ngữ.

### 2. `src/components/Booking/BookingConfirmModal.tsx`
- Thêm state `[showInvoice, setShowInvoice] = useState(false);`
- Thêm UI Nút "Xem chi tiết hoá đơn".
- Bao bọc thẻ `div` chứa bill bằng điều kiện hiển thị theo state `showInvoice`.
