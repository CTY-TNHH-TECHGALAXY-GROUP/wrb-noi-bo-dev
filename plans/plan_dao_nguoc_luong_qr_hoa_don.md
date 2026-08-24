# Kế Hoạch: Đảo Ngược Luồng Hiển Thị Hóa Đơn & Mã QR

## 1. Mục Tiêu
Thay đổi luồng kết thúc quy trình đặt lịch:
- **Luồng hiện tại**: Hoàn tất -> Hiện màn hình Mã QR to ở giữa (khách quét) -> Có nút "Xem hóa đơn".
- **Luồng mới**: Hoàn tất -> Hiển thị trực tiếp **Hóa đơn**. Ở phần cuối của Hóa đơn sẽ nhúng sẵn **Mã QR Lộ trình (Journey)**.

## 2. Ưu Điểm & Lợi Ích
- **Tiện lợi cho in ấn**: Mã QR sẽ được in thẳng ra giấy biên lai. Khách hàng cầm hóa đơn giấy vẫn có thể dùng điện thoại quét mã QR để theo dõi lộ trình của mình mọi lúc.
- **Giảm số bước**: Lễ tân/khách hàng không cần phải bấm qua nhiều màn hình, vào thẳng hóa đơn để đối chiếu giá cả ngay lập tức.

## 3. Các Bước Triển Khai Kỹ Thuật

### Bước 1: Thêm Mã QR vào cuối Hóa Đơn (`PrintableInvoice.tsx`)
- Tích hợp thư viện `qrcode.react` vào component in hóa đơn.
- Lấy ID đơn hàng từ dữ liệu để tạo link Journey (Lộ trình).
- Đặt mã QR ở phần Footer của hóa đơn (ngay bên dưới tổng tiền hoặc chữ ký), kèm theo dòng hướng dẫn "Quét mã để theo dõi lộ trình".

### Bước 2: Thay đổi luồng chuyển màn hình (`OrderConfirmModal.tsx`)
- Khi gửi đơn thành công trên Tablet:
  - Loại bỏ việc hiển thị Modal thành công chứa QR khổng lồ.
  - Gọi lệnh tự động nhảy trang (`window.location.href`) sang thẳng trang hóa đơn.

### Bước 3: Đưa bộ đếm giờ (Auto-reset Tablet) sang trang Hóa Đơn
- Tính năng "Tự động reset Tablet về trang chủ sau 3 phút" hiện đang nằm ở màn hình Modal. Khi bỏ màn hình Modal đi, tính năng này sẽ mất.
- Sẽ cài đặt lại tính năng **Auto-reset** này trên trang `/invoice/[id]/page.tsx` (chỉ chạy nếu đang xem trên thiết bị Tablet) để Tablet không bị kẹt ở trang hóa đơn khi khách trước đã rời đi. Nút đếm ngược sẽ không hiển thị khi in ra giấy.

## 4. Các Câu Hỏi Cần Chốt (Open Questions)
> [!IMPORTANT]
> 1. Mã QR in trên hóa đơn giấy có kích thước khoảng 80-100px là vừa vặn, không tốn giấy mà vẫn đủ nét để điện thoại quét, bạn có đồng ý không?
> 2. Bộ đếm tự động quay về trang chủ trên trang hóa đơn mình cứ set mặc định 3 phút như cũ nhé?

Vui lòng bấm **Proceed** hoặc báo lại nếu bạn duyệt kế hoạch này để mình bắt tay vào code, và lưu kế hoạch này vào thư mục dự án!
