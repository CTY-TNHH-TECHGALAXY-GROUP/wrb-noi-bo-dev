# Kế hoạch sửa lỗi hiển thị Tags dịch vụ (Mang thai / Dị ứng)

## Vấn đề hiện tại
- Trên giao diện khách hàng chọn tuỳ chọn của dịch vụ Foot (ví dụ: `Chỉ làm foot`, `Lực nhấn lòng bàn chân`), UI hiển thị đúng vì đọc tag động từ database.
- **TUY NHIÊN**, khi đưa vào Giỏ hàng (Cart) và gửi xuống Server, hệ thống đang **hardcode gán cứng** `tag0` = "Mang thai" và `tag1` = "Dị ứng" ở cả Frontend lẫn Backend.
- Hệ quả là khi quản trị viên nhận đơn, nội dung ghi chú dịch vụ bị biến thành "Mang thai", gây hiểu nhầm nghiêm trọng.

## Các file cần sửa (Dự án: `wrb-noi-bo-dev`)

### 1. `src/components/Menu/Standard/Sheets/CartDrawer.tsx`
- **Thay đổi:** Thay vì in cứng `dict.tags?.pregnant` / `dict.tags?.allergy`, sẽ đọc giá trị đa ngôn ngữ động từ thuộc tính `item.TAGS[0]` / `item.TAGS[1]`.
- **Fallback:** Vẫn giữ hiển thị "Mang thai" / "Dị ứng" làm giá trị dự phòng nếu `item.TAGS` bị trống (để tương thích ngược với các dịch vụ cũ).

### 2. `src/components/Checkout/Invoice.tsx`
- **Thay đổi:** Tương tự như `CartDrawer`, thay chữ "Pregnant" và "Allergy" ở bill thanh toán thành text dịch động lấy từ `item.TAGS`.

### 3. `src/components/Checkout/OrderConfirmModal.tsx`
- **Thay đổi:** Ở modal xác nhận đơn hàng cuối cùng, logic tổng hợp tags đang push cứng chữ `'Pregnant'` và render icon. Ta sẽ sửa lại để push đúng tên tag (theo ngôn ngữ) mà khách đã chọn.

### 4. `src/app/api/orders/handleStandardItems.ts`
- **Thay đổi:** Trong logic backend để xử lý tạo đơn, thay vì luôn ép kiểu `opts.notes?.tag0` thành `toVietnamese('pregnant')`, ta sẽ ưu tiên lấy tên gốc tiếng Việt từ mảng `item.TAGS` mà frontend đã gửi lên. 

## Xác nhận
Kế hoạch này đảm bảo tính tương thích ngược và tái sử dụng chuẩn logic hiển thị văn bản động từ DB. Vui lòng phản hồi "Duyệt" để tôi tiến hành sửa code.
