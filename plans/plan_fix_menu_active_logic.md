# Kế hoạch sửa lỗi hiển thị dịch vụ ngừng bán (Luồng Khách Mới)

## 1. Vấn đề hiện tại
- Trong luồng Khách Mới (`showHiddenServices = true`), đối với các danh mục kiểm soát khắt khe (Body, Foot...), code chỉ kiểm tra xem `id` của dịch vụ có nằm trong `NEW_USER_ALLOWED_IDS` hay không. 
- Nếu có, code bỏ qua phần kiểm tra `ACTIVE`, dẫn đến việc các dịch vụ dù đã bị gán `isActive = false` trong DB vẫn hiển thị lên Menu.

## 2. Giải pháp kỹ thuật
Chỉnh sửa lại logic tại `src/components/Menu/Standard/ServiceList.tsx`:
- Đưa điều kiện kiểm tra `svc.ACTIVE === false` lên dòng đầu tiên của vòng lặp duyệt dịch vụ.
- Nếu dịch vụ ngừng bán -> Loại bỏ ngay lập tức (áp dụng cho mọi luồng kể cả Khách Cũ lẫn Khách Mới).
- Sau khi qua chốt chặn `ACTIVE`, mới tiếp tục lọc các dịch vụ bằng `NEW_USER_ALLOWED_IDS` cho riêng luồng Khách Mới.

## 3. Các file thay đổi
- `src/components/Menu/Standard/ServiceList.tsx`

## 4. Kết quả mong đợi
- Toàn bộ Menu (luồng chính và luồng Khách Mới) đều đồng bộ 100% với trạng thái `isActive` trong Supabase.
- Không còn hiển thị các dịch vụ ngừng bán.
