# Kế hoạch sửa lỗi hiển thị thứ tự KTV theo đúng Sổ Tua (Turns Completed)

Tài liệu này mô tả kế hoạch sửa đổi thuật toán sắp xếp KTV trên VIP Menu để đồng bộ chính xác với Sổ tua của trang quản lý (Admin).

## Nguyên nhân gốc rễ (Root Cause)
*   Sổ tua của Spa ưu tiên những KTV rảnh làm **ít tua hơn trong ngày** lên trước để nhận khách (chia đều cơ hội làm việc).
*   Trong database, số tua đã hoàn thành trong ngày được lưu ở cột `turns_completed` của bảng `TurnQueue`.
*   Thuật toán sort hiện tại ở VIP Menu chỉ mới sắp xếp theo trạng thái rảnh/bận và cột `queue_position` (vị trí xếp hàng/check-in), mà **bỏ qua cột `turns_completed`**.
*   Điều này dẫn đến lỗi: KTV PHÁT (NH001) đã làm 2 tua nhưng có `queue_position = 1` được hiển thị đầu tiên, trong khi Sunny (NH027) mới làm 1 tua nhưng có `queue_position = 4` lại bị xếp sau. Đúng ra Sunny phải đứng đầu hàng đợi.

## Giải pháp đề xuất (Fix Logic)
Chúng ta sẽ bổ sung trường `turns_completed` (số tua đã làm) vào API và đồng bộ logic sắp xếp tại cả Backend và Frontend theo quy tắc:
1.  **Theo trạng thái hoạt động (Availability):** AVAILABLE (0) > BUSY (1) > NOT_YET (2) > OFF_DUTY (3) > ON_LEAVE (4).
2.  **Theo số tua đã làm trong ngày (turnsCompleted):** KTV nào có số tua ít hơn sẽ được xếp lên trước (tăng dần).
3.  **Theo vị trí xếp hàng (queuePosition):** Nếu cùng số tua đã làm, ai check-in trước / xếp hàng trước sẽ được lên trước (tăng dần).
4.  **Theo mã KTV:** Sắp xếp theo mã KTV để ổn định vị trí nếu tất cả các chỉ số trên trùng nhau.

## Chi tiết các file cần sửa đổi

### 1. [MODIFY] [vipStaffUtils.ts](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/lib/vipStaffUtils.ts)
*   Bổ sung `turnsCompleted?: number;` vào interface `VipStaffInfo`.

### 2. [MODIFY] [vip-available/route.ts](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/app/api/staff/vip-available/route.ts)
*   Thêm `turns_completed` vào select của bảng `TurnQueue` (dòng 73).
*   Đọc và map `turns_completed` vào `turnQueueMap` và đối tượng trả về `VipStaffInfo` (dòng 107-117, dòng 181).
*   Cập nhật hàm sort ở Step 6 so sánh `turnsCompleted` trước, sau đó đến `queuePosition`.

### 3. [MODIFY] [StaffSelector/index.tsx](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/components/Menu/Premium/StaffSelector/index.tsx)
*   Cập nhật logic `sortedStaff` `useMemo` của Frontend để sắp xếp đồng bộ theo thứ tự: Trạng thái $\rightarrow$ `turnsCompleted` $\rightarrow$ `queuePosition` $\rightarrow$ mã KTV.

## Kế hoạch kiểm thử (Verification Plan)
1. **Biên dịch:** Chạy `npm run build` để kiểm tra lỗi TypeScript.
2. **Kiểm tra UI hiển thị:**
   *   Mở VIP Menu, kiểm tra danh sách KTV.
   *   Xác nhận thứ tự KTV rảnh hiện tại: Sunny (NH027) phải đứng trước PHÁT (NH001), đúng như trên trang quản lý sổ tua.
