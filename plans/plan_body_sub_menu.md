# Kế hoạch Triển khai: Tích hợp 3 Nhánh cho danh mục Body

Đã hiểu hoàn toàn ý đồ chiến thuật của bạn! Hóa ra "Qua cuốn sách khác" chính là việc định tuyến (Routing) trực tiếp sang các Menu VIP và Menu SPA đã có sẵn của hệ thống. Đây là một giải pháp cực kỳ thông minh để luân chuyển traffic (upsell/cross-sell) giữa các cấp độ dịch vụ mà không làm rối UI.

Dưới đây là kế hoạch kỹ thuật chi tiết để thực hiện.

## 1. Phân tích Hiện trạng & Mục tiêu
- **Hiện tại:** Khi ở Menu Standard, mục `Body` sẽ liệt kê trực tiếp toàn bộ các dịch vụ (Mix 4, Hot stone...).
- **Mục tiêu:** Biến `Body` thành một "Trạm trung chuyển". Tại đây sẽ hiển thị 3 nhãn (nút bấm/thẻ bài):
  1. **Relaxing**: Giữ nguyên khách ở lại trang hiện tại (Standard Menu) và hiển thị danh sách các món truyền thống.
  2. **Design your journey**: Chuyển hướng khách sang URL `/[lang]/new-user/vip/menu`.
  3. **Therapy**: Chuyển hướng khách sang URL `/[lang]/new-user/spa/menu`.

## 2. Kế hoạch Code (Proposed Changes)

Chúng ta sẽ chỉnh sửa file `ServiceList.tsx` của Standard Menu. Cụ thể, khi đang render danh mục `Body`, hệ thống sẽ chèn thêm một khối Giao diện (Sub-navigation) lên trên cùng trước khi render danh sách dịch vụ.

### [MODIFY] [ServiceList.tsx](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/components/Menu/Standard/ServiceList.tsx)
- **Thêm Hook điều hướng:** Sử dụng `useRouter` từ `next/navigation` và lấy `lang` để chuẩn bị cho việc chuyển trang.
- **Thêm UI 3 Nhãn (Sub-menu) vào mục Body:**
  - Nếu `cat.id === 'Body'`, chúng ta sẽ render một khối UI (dạng 3 nút bấm Pills hoặc 3 thẻ bài ngang) bao gồm:
    - `Relaxing` (Đang được Active, màu vàng Gold)
    - `Design your journey` (Màu tối, có icon sách hoặc sao chổi) -> Bấm vào gọi `router.push(/' + lang + '/new-user/vip/menu')`
    - `Therapy` (Màu tối, có icon y tế/trị liệu) -> Bấm vào gọi `router.push(/' + lang + '/new-user/spa/menu')`
- **Render Danh sách món:** Bên dưới khối 3 nhãn này, danh sách `Mix 4, Hot stone...` vẫn sẽ được render bình thường (thuộc nhóm Relaxing).

---

## 3. Câu hỏi chờ User chốt (Review Required)
1. Bạn có muốn lưu lại trạng thái (Ví dụ: khách bấm sang VIP nhưng đổi ý bấm Back lại Standard thì vẫn ở đúng tab Body) không? (Theo tôi là Next.js và logic `sessionStorage` chúng ta vừa làm ở bước trước đã tự động lo liệu phần này rồi).
2. Về mặt UI, bạn muốn 3 nhãn này là **3 nút chữ nhật** (Pills) đặt cạnh nhau, hay là **3 thẻ ảnh nhỏ** (Cards có icon minh họa)? 

Bạn kiểm tra xem hướng đi này đã đúng "bài" của bạn chưa, rồi duyệt để tôi bắt tay vào code nhé!
