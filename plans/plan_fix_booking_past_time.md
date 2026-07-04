# Kế hoạch khắc phục lỗi đặt lịch trong quá khứ (Fix Booking Past Time)

## Vấn đề
- Khách hàng có thể đặt lịch hẹn vào một giờ trong quá khứ (ví dụ: gửi đơn lúc 17:37 nhưng chọn giờ hẹn 09:00 sáng cùng ngày).
- Nguyên nhân do:
  1. Frontend dựa vào giờ thiết bị (Client Time), nếu thiết bị sai giờ thì bỏ qua validation.
  2. Backend hoàn toàn thiếu bước kiểm tra (validate) giờ hẹn có hợp lệ không trước khi lưu vào DB.

## Kế hoạch triển khai
### 1. Sửa file `src/app/api/bookings/route.ts`
- Đọc `appointmentDate` và `timeSlot` từ request.
- Lấy ngày và giờ hiện tại theo múi giờ `Asia/Ho_Chi_Minh`.
- Kiểm tra:
  - Nếu `appointmentDate` là ngày hôm nay.
  - Thì so sánh `timeSlot` (ví dụ: "09:00") với giờ hiện tại (VD: "17:37").
  - Nếu `timeSlot < currentTime`, trả về HTTP Status `400 Bad Request` kèm thông báo lỗi "Khung giờ này đã trôi qua, vui lòng chọn giờ khác".

### 2. Sửa file `src/app/api/booking/vip-appointment/route.ts`
- Áp dụng logic kiểm tra tương tự với `timeSlot` và `appointmentDate` đối với luồng đặt hẹn VIP (nếu cần thiết và nếu có nhận vào 2 tham số này từ Frontend).

## Tiêu chí hoàn thành
- Không ai có thể dùng Postman, script, hoặc thay đổi giờ trên máy tính để đặt một lịch hẹn trong quá khứ so với giờ máy chủ.
