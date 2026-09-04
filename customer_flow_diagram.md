# Sơ đồ khối Hành trình Khách Hàng (Customer Flow) - BẢN THỰC TẾ (Cập nhật)

Dựa trên luồng gộp mới nhất, loại bỏ hoàn toàn sự phân tách `old-user`/`new-user`. Tất cả quy về một Menu Standard chung, có hỗ trợ thanh toán nhanh và xử lý thông minh khi tìm khách không thấy.

```mermaid
graph TD
    %% MỞ APP LÀ VÀO THẲNG MENU WALK-IN
    Start((Mở App / Tablet)) -. Tự động chuyển .-> MenuWalkIn[MÀN HÌNH CHÍNH <br> Walk-in <br> /en/standard/menu]

    %% LUỒNG CHỌN MÓN & THANH TOÁN (CÓ NÚT THANH TOÁN TRỰC TIẾP)
    MenuWalkIn -->|Bấm 'Giỏ Hàng'| Cart[Xem Giỏ hàng]
    Cart --> Checkout[Màn hình Thanh toán & Xuất Bill]
    
    MenuWalkIn -->|Bấm 'Thanh Toán' trực tiếp| Checkout
    Checkout --> Journey[Màn hình KTV <br> Lộ trình Timer]

    %% NHÁNH TÌM KHÁCH CŨ / BOOKING
    MenuWalkIn -.->|Lễ tân bấm góc phải| NutHistory[Nút 'History']
    NutHistory --> PopupAuth{Nhập SĐT / Email}
    
    %% TÌM THẤY -> LỊCH SỬ
    PopupAuth -->|Tìm thấy| HistoryScreen[Màn hình Lịch Sử <br> /en/history]

    %% KHÔNG TÌM THẤY -> TẠO MỚI
    PopupAuth -->|Không tìm thấy| PopupNotFound{Hỏi: Dùng thông tin này <br> tạo đơn mới?}
    PopupNotFound -->|Đồng ý| DataNew(Lưu Data Khách Mới)
    DataNew ==>|Quay về| MenuWalkIn
    
    %% TỪ LỊCH SỬ CHỌN HÌNH THỨC
    HistoryScreen -->|Lên đơn Walk-in| DataOldWalkIn(Mang theo Data Khách Cũ)
    HistoryScreen -->|Lên đơn Booking| DataOldBooking(Mang theo Data Khách Cũ)
    
    %% ĐƯA DATA VỀ MÀN HÌNH MENU
    DataOldWalkIn ==>|Quay về| MenuWalkIn
    DataOldBooking ==>|Chuyển sang| MenuBooking[MÀN HÌNH CHÍNH <br> Booking <br> /en/booking/standard/menu]
    
    %% TỪ MÀN HÌNH BOOKING CŨNG CÓ THỂ THANH TOÁN TRỰC TIẾP
    MenuBooking -->|Bấm 'Thanh Toán' trực tiếp| Checkout
    MenuBooking -->|Bấm 'Giỏ Hàng'| Cart
```
