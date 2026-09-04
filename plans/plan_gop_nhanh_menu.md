# Kế Hoạch Gộp Nhánh Menu (Khách Cũ -> Khách Mới)

## Mục tiêu
Loại bỏ sự phân mảnh giữa giao diện `old-user` và `new-user`. Gộp chung tất cả vào luồng `new-user/standard/menu` và `new-user/booking/standard/menu` để quản lý UI thống nhất. Trang History chỉ làm nhiệm vụ lấy dữ liệu và đẩy ngược về nhánh chung.

## Chi tiết thay đổi
- File: `src/app/[lang]/old-user/history/page.tsx`
- Nội dung thay đổi: 
  - Đổi đích đến của `router.push` khi "Tạo Walk-in" (từ `old-user/select-menu` thành `new-user/standard/menu`).
  - Đổi đích đến của `router.push` khi "Tạo Booking" (từ `old-user/booking/select-menu` thành `new-user/booking/standard/menu`).
  - Đổi đích đến của Modify (Sửa đơn) và Rebook (Tạo lại) sang URL của nhánh `new-user`.
- Dữ liệu `MenuContext` và `localStorage` sẽ tự động được bảo toàn và nạp vào giỏ hàng bên nhánh `new-user`.
