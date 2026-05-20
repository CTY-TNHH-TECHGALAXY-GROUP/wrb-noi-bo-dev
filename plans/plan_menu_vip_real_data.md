# 📋 Kế hoạch: Nâng Cấp Cuốn Lịch Chọn Ngày, Ẩn Thanh Cuộn & Đồng Bộ ID Đơn Hàng VIP Menu

> **Ngày cập nhật**: 20/05/2026  
> **Trạng thái**: ✅ Đã duyệt & hoàn thành  
> **Mục tiêu**: 
> 1. Thêm cột `source` vào bảng `Bookings` để phân loại nguồn đơn (đồng bộ 3 nguồn).
> 2. Đồng bộ định dạng ID đơn hàng của VIP Menu giống hệt menu thường (`11NDK-SỐ_ĐƠN-DDMMYYYY`), không sử dụng hậu tố ngẫu nhiên.
> 3. Ẩn thanh cuộn của bộ chọn giờ (FlipTimePicker) trên Desktop.
> 4. Thay thế/bổ sung bộ chọn ngày dạng Cuốn lịch (Calendar Popover) sang trọng cho VIP Menu.

---

## 1. 📊 BỔ SUNG CỘT PHÂN LOẠI NGUỒN ĐƠN (DATABASE & API)

Để phục vụ cho cả 3 nguồn đơn hàng (Walk-in, VIP Menu, Web Booking sau này) cùng chung sống trong một bảng `Bookings` duy nhất:

### ⚙️ SQL Migration (Chạy trên Supabase)
Thêm cột `source` (kiểu dữ liệu `text`) vào bảng `Bookings` với giá trị mặc định là `'STANDARD_MENU'` để tương thích ngược với các đơn hàng cũ:
```sql
ALTER TABLE "Bookings" ADD COLUMN "source" text DEFAULT 'STANDARD_MENU';
```

### 🏷️ Quy định giá trị cột `source` (Tiếng Anh):
1. **`STANDARD_MENU`**: Đơn hàng tạo trực tiếp tại quầy lễ tân từ menu thường của spa.
2. **`VIP_MENU`**: Đơn hàng do khách tự đặt thông qua VIP Menu tại phòng.
3. **`WEB_BOOKING`**: Đơn hàng đặt trước qua Website đặt lịch bên ngoài (tích hợp sau này).

### 📄 Cập nhật Tài liệu DB
Cập nhật cột `source` vào tài liệu [TableInSupabase.md](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/Quan_Tri_Va_KTV/TableInSupabase.md).

---

## 2. 📋 ĐỒNG BỘ ĐỊNH DẠNG ID ĐƠN HÀNG VIP MENU

Đơn hàng VIP Menu sẽ được cấp mã theo đúng quy chuẩn sạch sẽ của menu thường:
* **Quy tắc đếm**: Server sẽ đếm số đơn hàng đã tạo trong ngày hôm nay thông qua `.ilike('billCode', `%-${dateCode}`)` và tăng lên 1 (`nextNum`).
* **Mã hóa đơn (`billCode`)**: `SỐ_ĐƠN (3 chữ số)-DDMMYYYY` (Ví dụ: `002-20052026`).
* **Mã đơn hàng (`id`)**: `11NDK-billCode` (Ví dụ: `11NDK-002-20052026`).
* **Không dùng hậu tố ngẫu nhiên**: KHÔNG thêm `-XXXX` ở cuối mã đơn.

---

## 3. 🏗️ THAY ĐỔI GIAO DIỆN (UI/UX)

### 3.1. Ẩn thanh cuộn đồng hồ (FlipTimePicker) trên Desktop
* **Tệp ảnh hưởng**: [FlipTimePicker.tsx](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/components/Menu/Premium/BookingConfig/FlipTimePicker.tsx)
* **Giải pháp**: Thêm class Tailwind và CSS inline để ẩn scrollbar của browser trên Desktop:
  `[&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`.

### 3.2. Chọn ngày bằng "Cuốn lịch" (Calendar Picker) sang trọng
* **Tệp ảnh hưởng**: [BookingConfig/index.tsx](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/components/Menu/Premium/BookingConfig/index.tsx)
* **Giải pháp giao diện**: 
  * Giữ dải chọn nhanh 5 ngày tiếp theo trên màn hình BookingConfig để tối ưu hóa trải nghiệm 1-chạm.
  * Bổ sung nút **"Ngày khác 📅"** ở cuối dải chọn nhanh.
  * Bấm vào nút này sẽ hiển thị một **Calendar Popover** sang trọng (dark theme, gold `#e6c487` accent).
  * Lưới lịch dạng grid tháng hiển thị 30 ngày tiếp theo. Vô hiệu hóa (disabled) các ngày trong quá khứ.
  * Cập nhật logic tính toán `selectedDay` và khung giờ trống tương ứng khi người dùng chọn ngày từ cuốn lịch.

---

## 4. 📅 CHI TIẾT CÁC TỆP SẼ THAY ĐỔI (PROPOSED CHANGES)

### 💾 Database:
* Run SQL Migration: `ALTER TABLE "Bookings" ADD COLUMN "source" text DEFAULT 'STANDARD_MENU';`
* Cập nhật tài liệu: [TableInSupabase.md](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/Quan_Tri_Va_KTV/TableInSupabase.md)

### 📄 [MODIFY] [booking.ts](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/services/booking.ts)
* Ghi nhận `source: 'STANDARD_MENU'` khi tạo đơn hàng thường.

### 📄 [MODIFY] [route.ts (VIP API)](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/app/api/booking/vip-appointment/route.ts)
* Đồng bộ logic sinh `id` and `billCode` theo công thức menu thường (`11NDK-SỐ_ĐƠN-DDMMYYYY`).
* Ghi nhận `source: 'VIP_MENU'` khi lưu vào bảng `Bookings`.
* Thêm logic tự động tạo các bản ghi `BookingItems` tương ứng với từng dịch vụ lẻ/chính đã chọn để liên kết KTV và hiển thị đầy đủ trên màn hình Admin.

### 📄 [MODIFY] [FlipTimePicker.tsx](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/components/Menu/Premium/BookingConfig/FlipTimePicker.tsx)
* Ẩn thanh cuộn dọc trên Desktop.

### 📄 [MODIFY] [BookingConfig/index.tsx](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/components/Menu/Premium/BookingConfig/index.tsx)
* Xây dựng giao diện Calendar Popover.
* Thêm nút "Ngày khác 📅" và cập nhật logic chọn ngày.

---

## 5. 🧪 KẾ HOẠCH XÁC MINH (VERIFICATION PLAN)

### 🤖 Chạy kiểm tra mô phỏng (Simulation Test)
* Viết script Node.js chạy thử lệnh tạo đơn hàng VIP, xác nhận:
  * ID sinh ra đúng định dạng `11NDK-SỐ_ĐƠN-DDMMYYYY` tăng dần trong ngày.
  * Cột `source` lưu đúng giá trị `'VIP_MENU'`.
  * Các bản ghi dịch vụ được tạo chính xác trong bảng `BookingItems`.

### 🖥️ Kiểm tra giao diện thủ công (Manual Verification)
* Xác nhận trên màn hình Desktop: thanh cuộn của FlipTimePicker biến mất nhưng cuộn chuột vẫn hoạt động.
* Bấm nút "Ngày khác 📅" và chọn ngày ngẫu nhiên trong cuốn lịch, kiểm tra xem lịch cập nhật chính xác ngày hẹn.
