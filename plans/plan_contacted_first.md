# Kế Hoạch Triển Khai Tính Năng "Contacted First" (Khách Đã Liên Hệ Trước)

Dựa trên file HTML `oria_contacted_first_clean_flags.html` và luồng nghiệp vụ, đây là bản phân tích và kế hoạch triển khai để hoàn thiện tính năng "Contacted First".

> [!NOTE]
> Khách hàng thuộc nhóm "Contacted First" là những người đã gọi điện hoặc nhắn tin cho Lễ tân trước để báo giờ đến và số lượng người, nhưng **chưa chọn dịch vụ cụ thể**. Khi đến tiệm, họ sẽ bấm nút "Contacted First", tìm tên mình, và sau đó được chuyển đến trang Chọn Sách Menu để bắt đầu chọn dịch vụ.

## 1. Trả Lời Câu Hỏi Của Anh (Giải Pháp Nhập Liệu & Auto-fill)
- **Nơi Nhập Liệu:** Lễ tân sẽ nhập thông tin khách hàng ở **Web Quản Trị (Admin)** trong màn hình Lễ Tân. Còn ở App iPad này (Web Booking), hệ thống **chỉ hiển thị (Read-only)** để khách hàng tự bấm chọn tên mình. 
- **Auto-fill Checkout:** Chính xác ạ. Sau khi khách bấm đúng Tên mình ở màn hình Contacted First, dữ liệu sẽ được truyền âm thầm theo suốt luồng chọn Menu. Cuối cùng ở màn hình Checkout, các ô Tên, SĐT, Số khách sẽ **tự động điền (auto-fill)**, khách không cần gõ lại một chữ nào.

---

## 2. Thiết Kế Cơ Sở Dữ Liệu (Database)

Tạo một bảng mới để lưu thông tin khách hẹn trước nhưng chưa lên món.

**Tên bảng:** `PreBookings`

**Các trường (Columns):**
- `id` (UUID - PK): Mã định danh duy nhất.
- `customer_name` (Text): Tên khách hàng (VD: "Nguyễn Thị Anh").
- `customer_phone` (Text): Số điện thoại khách (VD: "0901123567"). Frontend sẽ che thành "0901 *** 567" trên màn hình.
- `booking_date` (Date): Ngày khách hẹn đến (VD: 2025-05-12).
- `booking_time` (Time): Giờ khách hẹn đến (VD: 10:00:00).
- `guest_count` (Integer): Số lượng khách đi cùng (VD: 1, 2, 3...).
- `notes` (Text): Ghi chú nội bộ của lễ tân (VD: Khách yêu cầu phòng yên tĩnh).
- `status` (Text): Trạng thái của phiên liên hệ này.
  - `PENDING`: Đang chờ khách đến. (Chỉ hiển thị các đơn PENDING của ngày hôm nay lên iPad).
  - `CONVERTED`: Khách đã đến, chọn menu và thanh toán xong (đã tạo thành 1 Booking thực thụ).
  - `CANCELLED`: Khách báo hủy hoặc không đến.
- `created_at` (Timestamptz): Thời gian tạo.
- `updated_at` (Timestamptz): Thời gian cập nhật.

---

## 3. Luồng Xử Lý (User Flow) Trên App Web Booking

### Bước 1: Màn hình Customer Type (Chọn loại khách)
- Khách hàng nhấn vào nút **Contacted First**.
- Ứng dụng chuyển hướng sang trang: `/[lang]/contacted-first/page.tsx`.

### Bước 2: Trang Contacted First (Giao diện HTML mới)
- Trang này gọi API lấy danh sách `PreBookings` thỏa điều kiện: `booking_date = TODAY()` và `status = 'PENDING'`.
- Render danh sách các Card khách hàng giống 100% HTML tham khảo.
- Khi Khách hàng bấm chọn Tên của mình -> Hiện Màn hình xác nhận "Select Services".
- Khách nhấn nút tiếp tục.

### Bước 3: Lưu State & Chuyển Sang Trang CHỌN SÁCH MENU (Select Menu)
- Lưu object `contactedInfo` (gồm: `preBookingId`, `customerName`, `customerPhone`, `guestCount`) vào **Global Store (Zustand)** của giỏ hàng.
- Chuyển hướng sang trang **Chọn Sách Menu** (`/[lang]/new-user/select-menu` hoặc `booking/select-menu` tương tự luồng cũ).
- Tại đây khách sẽ thấy 2 cuốn sách (Standard Menu và Premium Menu) để bấm vào và chọn món như bình thường.

### Bước 4: Tự Động Điền Tại Thanh Toán (Checkout)
- Tại trang Checkout (`CustomerInfo.tsx`), useEffect sẽ kiểm tra nếu Store có chứa `contactedInfo`.
- Nếu có, **tự động set value (Auto-fill)** cho Form (Tên, SĐT, Số lượng khách).
- Khách bấm Đặt Đơn (Checkout).
- Gọi API tạo Booking mới. **Đồng thời** API này sẽ update dòng `PreBookings` tương ứng (theo `preBookingId`) chuyển trạng thái từ `PENDING` sang `CONVERTED`.

---

## 4. Các File Sẽ Chỉnh Sửa / Tạo Mới Trong Lần Này

1. **`supabase/migrations/..._create_prebookings.sql`**: Script tạo DB.
2. **`Quan_Tri_Va_KTV/TableInSupabase.md`**: Cập nhật chuẩn tài liệu Database.
3. **`src/app/[lang]/contacted-first/page.tsx`**: Khởi tạo trang giao diện từ HTML.
4. **`src/components/Menu/types.ts` & Logic Giỏ Hàng**: Bổ sung interface lưu thông tin `contactedInfo`.
5. **`src/components/Checkout/CustomerInfo.tsx`**: Viết script lấy `contactedInfo` nhét vào Input form.
