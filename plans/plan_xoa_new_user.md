# Kế Hoạch Đơn Giản Hóa Cấu Trúc URL (Xóa `new-user`)

## Mục tiêu
Loại bỏ hoàn toàn khái niệm và thư mục `new-user` khỏi ứng dụng. Giao diện Menu sẽ trở thành các đường dẫn gốc siêu ngắn gọn. Điều này phản ánh đúng bản chất luồng hiện tại: Mọi khách hàng đều dùng chung một bộ giao diện Menu.

## Chi tiết thay đổi

### 1. Thay đổi cấu trúc thư mục (Next.js App Router)
Di chuyển toàn bộ các thư mục con của `new-user` ra thẳng thư mục `[lang]`:
- `src/app/[lang]/new-user/[menuType]` ➡️ `src/app/[lang]/[menuType]`
- `src/app/[lang]/new-user/booking` ➡️ `src/app/[lang]/booking`
- `src/app/[lang]/new-user/select-menu` ➡️ `src/app/[lang]/select-menu`
- `src/app/[lang]/new-user/therapy` ➡️ `src/app/[lang]/therapy`

*(Sau đó xóa bỏ hoàn toàn thư mục `new-user`)*

### 2. Sự thay đổi về URL hiển thị cho người dùng
- Walk-in Menu: `/en/new-user/standard/menu` ➡️ **`/en/standard/menu`**
- Booking Menu: `/en/new-user/booking/standard/menu` ➡️ **`/en/booking/standard/menu`**

### 3. Cập nhật mã nguồn (Routing)
Sẽ quét toàn bộ Source Code để cập nhật các đường link điều hướng:
- Trang gốc `(intro)`: Redirect thẳng về `/en/standard/menu`
- Trang Lịch sử (`old-user/history`): Sửa các nút push sang đường link rút gọn.
- Các nút Quay lại (Back), hoặc nút bấm bên trong Menu Component (nếu có hardcode).

## Đánh giá rủi ro
- **An toàn (Safe)**: Next.js hỗ trợ Dynamic Routes (như `[menuType]`) ở cấp độ `[lang]` rất tốt. Nó sẽ tự động nhường quyền cho các trang tĩnh (như `journey`, `auth`) trước, nên không lo bị lỗi truy cập nhầm trang.
- Đảm bảo logic Giỏ hàng và Context không bị ảnh hưởng (chỉ đổi URL hiển thị).
