# Kế hoạch triển khai: Therapy Menu

**Mục tiêu**: Xây dựng luồng đặt lịch nhánh Điều trị (Therapy) tương tự giao diện VIP, nhưng tích hợp sơ đồ cá nhân hoá (Custom for you) và hiển thị bằng cấp của KTV. KTV hiển thị được điều khiển bằng 1 cờ riêng từ phía Admin.

## 1. Cập nhật Database (Supabase)
Tạo script SQL / migration để thay đổi bảng `Staff`:
- Thêm cột `certificate_url` (text) để lưu link ảnh bằng cấp của nhân viên.
- Thêm cột `is_active_therapy_menu` (boolean, default: false) đóng vai trò là "key hiển thị ở menu điều trị của app quản trị".

## 2. Cấu trúc Route & Component Mới
### Route
- Chuyển logic từ `new-user/spa/menu` sang `therapy/menu`.
- File: `src/app/[lang]/therapy/menu/page.tsx`

### Cấu trúc Component (`src/components/Menu/Therapy`)
Xây dựng nhánh `TherapyMenu` gồm các bước:
1. **Bước 1: Chọn KTV (`StaffSelector`)**
   - Chỉ hiển thị các KTV có `is_active_therapy_menu = true`.
   - Giao diện thẻ nhân viên sang trọng (kế thừa từ VIP).
   - Thêm nút **"Bằng cấp"** trên thẻ. Khi bấm sẽ hiện Popup (`CertificateModal`) hiển thị ảnh từ `certificate_url`.
2. **Bước 2: Chọn Thời gian & Custom For You (`TherapyConfig`)**
   - Không chọn dịch vụ cụ thể. Khách sẽ chọn Thời lượng (VD: 60, 90, 120 phút) và Giờ đến.
   - Tích hợp component `CustomForYou/BodyMap` để khách chỉ định vùng tập trung / vùng cần né.
3. **Bước 3: Giỏ hàng (`TherapyCartStep`)**
   - Xác nhận thông tin và chuyển qua trang thanh toán.

## 3. Cập nhật Context & Data Layer
- Cập nhật hàm fetch KTV API (vd: `api/staff/therapy`) để trả về danh sách dựa theo cờ `is_active_therapy_menu`.
- Cập nhật MenuContext (nếu cần) để hỗ trợ giỏ hàng kiểu Therapy (lưu duration, KTV, và thông tin Custom For You).

## 4. Các bước triển khai
- [x] Chốt kế hoạch và lưu file.
- [ ] Mở rộng bảng `Staff` trong Database (Migration).
- [ ] Tạo API route lấy KTV cho Therapy Menu.
- [ ] Xây dựng thư mục `Therapy` components (StaffSelector, TherapyConfig, Cart).
- [ ] Ghép nối vào route `/[lang]/therapy/menu`.
- [ ] Test toàn bộ luồng.
