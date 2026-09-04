# Phân tích nguyên nhân & Kế hoạch xử lý lỗi Menu VIP không lấy được trạng thái KTV

## 🔍 Nguyên nhân gốc rễ (Root Causes)

Quá trình kiểm tra code và database hiện tại cho thấy 3 nguyên nhân chính gây ra lỗi "không hiển thị đúng trạng thái nhân viên đang làm" trên Menu VIP:

1. **Thiếu cập nhật Real-time / Polling trên UI (Lỗi Stale Data):** 
   - Component `StaffSelector` hiện tại chỉ fetch API `/api/staff/vip-available` **đúng 1 lần duy nhất** khi vừa mở menu.
   - Nếu màn hình iPad/Menu được mở liên tục trong 10-30 phút, khi KTV nhận khách và chuyển sang trạng thái "Đang làm" (BUSY), Menu VIP sẽ không tự cập nhật mà vẫn hiển thị "SẴN SÀNG".
   - Thiếu cấu hình chống cache (`{ cache: 'no-store' }`) khiến trình duyệt có thể trả về kết quả cũ.

2. **Lỗi Timezone (UTC) khi lấy ngày hiện tại ở Backend:**
   - Trong API `vip-available/route.ts`, code sử dụng `new Date().toISOString().slice(0, 10)`. Ở múi giờ Việt Nam (UTC+7), khoảng thời gian từ **00:00 đến 07:00 sáng**, hàm này sẽ trả về **ngày hôm qua**.
   - Nếu KTV làm ca đêm hoặc khách xem menu vào rạng sáng, hệ thống sẽ query sai ngày của `TurnQueue`, dẫn đến mất trạng thái "Đang làm" và chuyển thành "Chưa vô ca" (NOT_YET).

3. **Lỗi Business Date (Thiếu Cut-off hour):**
   - Đơn hàng tính ngày kinh doanh (Business Date) vắt qua rạng sáng (thường cắt ca lúc 6h sáng). Code lấy trạng thái KTV chưa áp dụng logic lùi ngày nếu thời gian hiện tại nhỏ hơn `DAY_CUTOFF_HOUR`.

## 🛠 User Review Required
- Việc thêm Polling (tự động fetch lại mỗi 15-30 giây) vào Menu VIP là phương án an toàn nhất và nhẹ nhàng nhất cho Client thay vì gắn Supabase Realtime (vốn dễ gây quá tải connection nếu có nhiều thiết bị mở menu). User có đồng ý với thời gian polling là **15 giây** không?

## 📝 Proposed Changes

### 1. API: Xử lý triệt để lỗi Timezone và Business Date
Sẽ sửa đổi cả 2 file API để đồng bộ logic lấy ngày với `bookings`:
#### [MODIFY] `src/app/api/staff/vip-available/route.ts`
- Bỏ `new Date().toISOString()`.
- Thêm logic tính `businessDate` chuẩn theo múi giờ `Asia/Ho_Chi_Minh` và lùi ngày nếu trước 6h sáng.
- Đảm bảo header chống cache `Cache-Control: no-store` được gửi về client.

#### [MODIFY] `src/app/api/staff/therapy-available/route.ts`
- Cập nhật logic `businessDate` tương tự như VIP.

### 2. Frontend: Thêm Auto-Refresh (Polling) & Chống Cache
#### [MODIFY] `src/components/Menu/Premium/StaffSelector/index.tsx`
- Sửa hàm fetch: `fetch('/api/staff/vip-available', { cache: 'no-store' })`.
- Đưa logic fetch vào một hàm `fetchStaff()`.
- Thêm `setInterval` gọi lại `fetchStaff()` mỗi **15 giây** (ẩn UI loading trong các lần fetch nền để khách không bị chớp giật màn hình).

#### [MODIFY] `src/components/Menu/Therapy/StaffSelector/index.tsx`
- Sửa tương tự cho Menu Therapy để tránh lỗi tương tự lặp lại.

## ✅ Verification Plan
1. Xác nhận KTV `NH027` (Sunny) đang có đơn và hiển thị đúng trạng thái "ĐANG PHỤC VỤ (RẢNH SAU 16:34)".
2. Kiểm tra log API đảm bảo ngày được lấy đúng theo múi giờ Việt Nam.
3. Treo màn hình VIP Menu, dùng hệ thống Admin hoặc Mock để chuyển trạng thái KTV, xác nhận VIP Menu tự cập nhật sau 15 giây mà không cần F5.
