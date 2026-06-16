# Phân Tích & Quyết Định: Định Dạng Thời Gian (12h vs 24h)

**Ngày ghi nhận**: 2026-06-16
**Phạm vi**: Ứng dụng Web Nội Bộ / Ứng dụng Khách hàng

## 1. Bối cảnh & Vấn đề
Ngân Hà Spa tiếp đón một lượng lớn khách hàng quốc tế đến từ nhiều quốc gia có thói quen sử dụng định dạng thời gian khác nhau. Việc hiển thị thời gian Booking (giờ hẹn) cần đảm bảo yếu tố:
- Dễ hiểu, không gây nhầm lẫn.
- Tối ưu hóa không gian hiển thị trên thiết bị di động.
- Trải nghiệm người dùng (UX) tinh tế theo từng vùng văn hóa.

## 2. Phân tích văn hóa sử dụng giờ
- **Hệ 12h (AM/PM)**: Cực kỳ phổ biến tại Mỹ, Canada, Úc, Anh, New Zealand.
- **Hệ 24h**: Phổ biến tại Châu Âu, Châu Á (Hàn Quốc, Nhật Bản, Việt Nam) và là chuẩn chung của ngành Du lịch/Khách sạn quốc tế (Military Time) nhằm tránh nhầm lẫn giữa 12:00 AM và 12:00 PM.

## 3. Quyết định (Được chốt bởi User)

Nhằm tối ưu hóa trải nghiệm khách hàng theo từng ngôn ngữ nhưng vẫn giữ được sự tiện dụng trong thao tác giao diện, luồng Đặt lịch (Booking) sẽ áp dụng quy tắc sau:

1. **Giao diện Tiếng Anh (EN)**:
   - Áp dụng hệ **12h (có chữ AM/PM)** ở tất cả các khu vực hiển thị chữ (Ví dụ: Invoice Summary, Lịch sử đặt hẹn, Email/Zalo Confirmation).
   - Lý do: Tệp khách chọn Tiếng Anh phần lớn là khách Mỹ/Úc/Châu Âu có thói quen sử dụng AM/PM.

2. **Giao diện Tiếng Việt (VI) và các ngôn ngữ Châu Á (Hàn, Nhật...)**:
   - Áp dụng hệ **24h**.
   - Lý do: Thói quen sử dụng phổ thông tại các quốc gia này.

3. **Bộ chọn giờ (Flip Time Picker)**:
   - **Bắt buộc dùng hệ 24h** cho tất cả các ngôn ngữ (kể cả Tiếng Anh).
   - Lý do: Giao diện bánh xe cuộn (Scroll wheel) 2 cột (Giờ - Phút) hiện tại rất thanh thoát, tiết kiệm không gian. Nếu chuyển sang hệ 12h sẽ phải chèn thêm cột AM/PM thứ 3, làm chật chội màn hình thiết bị di động và tăng số lần vuốt chọn của khách. Khách phương Tây khi du lịch vẫn hoàn toàn dễ dàng sử dụng vòng quay 24h (Military Time).

## 4. Kế hoạch triển khai (Khi áp dụng vào Codebase)
- Tạo một hàm tiện ích `formatTimeI18n(time24h: string, lang: string): string` trong `utils.ts` hoặc logic tương đương.
- Truyền chuỗi thời gian hiển thị qua hàm này ở các component như `Invoice.tsx`, `BookingConfirmModal.tsx`, `BookingTimePicker.tsx` (phần text hiển thị bên dưới picker).
