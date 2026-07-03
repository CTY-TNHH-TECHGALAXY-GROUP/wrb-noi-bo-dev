# Kế hoạch điều chỉnh kích thước chữ (Lộ trình Khách hàng & Mã QR)

Qua rà soát toàn bộ luồng lộ trình của khách hàng và màn hình hiển thị mã QR, tôi nhận thấy có nhiều vùng nội dung sử dụng cỡ chữ nhỏ (như `text-[9px]`, `text-[10px]`, `text-xs`) rất khó đọc trên các thiết bị di động có màn hình bé. 

Dưới đây là kế hoạch chi tiết để tăng kích thước chữ đồng bộ trên toàn luồng:

## Proposed Changes

### 1. Stepper Lộ trình (Thanh tiến trình trên cùng)
Giao diện thanh điều hướng lộ trình (Ngâm chân, Dịch vụ, Kiểm tra đồ, Đánh giá).

#### [MODIFY] `src/app/[lang]/journey/[bookingId]/page.tsx`
- **Nhãn các bước (FOOT SOAK, SERVICE, CHECK ITEMS, RATING):** Tăng từ `text-[9px]` lên `text-xs` (12px) để hiển thị rõ ràng hơn nhưng vẫn đảm bảo nằm gọn trong khung màn hình.

---

### 2. Bước 1: Phòng chờ (Waiting Room)
Giao diện khách hàng nhìn thấy khi đang chờ KTV.

#### [MODIFY] `src/components/Journey/WaitingRoom.tsx`
- **Tiêu đề "Dịch vụ hôm nay":** Tăng từ `text-xs` lên `text-sm`.
- **Tên dịch vụ:** Tăng từ `text-sm` lên `text-base` (16px).
- **Tiêu đề "Lộ trình dịch vụ":** Tăng từ `text-xs` lên `text-sm`.
- **Tên các bước lộ trình bên dưới:** Tăng từ `text-sm` lên `text-base`.
- **Mô tả chi tiết các bước:** Tăng từ `text-xs` lên `text-sm`.

---

### 3. Bước 2: Đang thực hiện dịch vụ (Active Service)
Giao diện khách hàng theo dõi thời gian và gửi phản hồi nhanh.

#### [MODIFY] `src/components/Journey/ActiveService.tsx`
- **Tiêu đề "Quick feedback":** Tăng từ `text-base` lên `text-lg`.
- **Nhãn "(OPTIONAL)":** Tăng từ `text-[10px]` lên `text-xs` (12px).
- **Các câu hỏi khảo sát:** Tăng từ `text-sm` lên `text-base` (16px) để dễ đọc nội dung câu hỏi.
- **Nhãn "SENT" (đã gửi):** Tăng từ `text-[9px]` lên `text-[11px]`.
- **Nhãn "Therapist" (Kỹ thuật viên):** Tăng từ `text-xs` lên `text-sm`.

---

### 4. Bước 3: Nhắc nhở tư trang (Check Belongings)
Giao diện nhắc khách kiểm tra đồ đạc trước khi về.

#### [MODIFY] `src/components/Journey/CheckBelongings.tsx`
- **Nhãn dưới các icon (Điện thoại, Ví tiền, Đồ đạc):** Tăng từ `text-[10px]` lên `text-xs` (12px).

---

### 5. Bước 4: Đánh giá chi tiết (Feedback)
Giao diện chấm điểm và khảo sát cuối dịch vụ.

#### [MODIFY] `src/components/Journey/Feedback.tsx`
- **Câu mở đầu "Xin quý khách vui lòng đánh giá...":** Tăng từ `text-sm` lên `text-base` để dễ đọc đoạn văn bản dài.
- **Tiêu đề "Service feedback (if any)":** Tăng từ `text-base` lên `text-lg`.
- **Các tùy chọn vi phạm (nếu có):** Tăng từ `text-[13px]` lên `text-[15px]`.
- **Tiêu đề "Your experience?":** Tăng từ `text-lg` lên `text-xl`.
- **Nhãn cảm xúc (😡, 😐, 🙂, 🤩):** Tăng từ `text-sm` lên `text-base`.

---

### 6. Màn hình quét mã QR (Tablet Lễ tân)
Màn hình Tablet hiển thị QR Code sau khi thanh toán hoặc tạo đơn.

#### [MODIFY] `src/components/Checkout/OrderConfirmModal.tsx`
- **Chữ "Scan QR code to track your service...":** Tăng từ `text-sm` lên `text-base`.
- **Dòng nhắc nhở "Scan the QR code above...":** Tăng từ `text-xs` lên `text-sm`.
