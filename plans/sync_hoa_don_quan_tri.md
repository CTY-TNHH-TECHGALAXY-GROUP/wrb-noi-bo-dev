# TỔNG HỢP CÁC THAY ĐỔI CẦN ĐỒNG BỘ SANG WEB QUẢN LÝ (Quan_Tri_Va_KTV)

Dưới đây là danh sách toàn bộ các lỗi đã được fix và tính năng đã được bổ sung/tùy chỉnh trên **Web Nội Bộ** (wrb-noi-bo-dev) so với bản gốc của Web Quản Lý. Bạn có thể dựa vào danh sách này để cập nhật ngược lại cho dự án Quản Trị.

---

### 1. Fix lỗi sập API khi gộp Đơn Con (Split Bookings)
- **File:** src/app/api/finance/invoice/[id]/route.ts
- **Lỗi cũ:** Query tìm đơn con gọi cột discountAmount (làm sập API do CSDL không có cột này).
- **Cách fix:** 
  - Đổi .select('id, totalAmount, discountAmount') thành .select('id, totalAmount').
  - Thêm export const fetchCache = 'force-no-store'; ở đầu file để tắt cache của Next.js (tránh việc API bị kẹt dữ liệu cũ lúc đơn chưa bị tách).

### 2. Fix lỗi sai Múi Giờ (Bị lùi 7 tiếng)
- **File:** src/components/invoice/PrintableInvoice.tsx
- **Lỗi cũ:** Supabase trả về string ngày tháng không có múi giờ, trình duyệt tự hiểu đó là giờ Việt Nam, rồi lùi 7 tiếng thành UTC nên bị sai giờ trên hóa đơn.
- **Cách fix:** Cộng thêm chữ 'Z' vào chuỗi thời gian trước khi đưa vào new Date().

### 3. Cho phép tra cứu bằng accessToken
- **File:** src/app/api/finance/invoice/[id]/route.ts
- **Cách fix:** Sửa câu query tìm booking gốc thành .or('id.eq...,accessToken.eq...') để API có thể linh hoạt tìm bằng mã ID hoặc mã bảo mật.

### 4. Tắt chế độ Tự Động In (Auto-Print)
- **File:** src/app/invoice/[id]/page.tsx
- **Cách fix:** Xóa đoạn useEffect gọi lệnh window.print() ở lần render đầu tiên. Trang sẽ chỉ mở chế độ hiển thị xem trước.

### 5. Thêm cột "Thời gian" (T.Gian) vào Bảng Dịch Vụ
- **File:** src/components/invoice/PrintableInvoice.tsx & PrintableInvoice.module.css
- **Cách fix:** 
  - Cập nhật API để query thêm trường duration từ bảng Services.
  - Thêm 1 cột hiển thị Thời Gian vào component React.
  - Sửa file CSS (cập nhật lại các bộ chọn nth-child) để chia lại tỷ lệ chiều rộng, đồng thời ẩn cột Giá trên giao diện Mobile để tránh vỡ bố cục.

### 6. Đa ngôn ngữ cho Phương Thức Thanh Toán (Payment Method)
- **File:** src/components/invoice/PrintableInvoice.tsx
- **Cách fix:** Cập nhật lại từ điển DICT để ánh xạ các mã này (CASH_VND, CASH_USD...) ra giao diện tùy theo ngôn ngữ.

### 7. Đa ngôn ngữ cho "Câu Cảm Ơn" ở footer hóa đơn
- **File:** src/components/invoice/PrintableInvoice.tsx
- **Cách fix:** Chuyển nội dung note1, note2 vào từ điển DICT để tự động đổi ngôn ngữ theo lựa chọn của khách thay vì fix cứng tiếng Việt.

### 8. Đa ngôn ngữ cho nút Xem Hóa Đơn trên các giao diện
- **Cách fix:**
  - File OrderConfirmModal.tsx (Tablet Tiệm): Đã dịch tự động.
  - File journey/[bookingId]/page.tsx (Điện thoại khách): Đã dùng INVOICE_I18N.
