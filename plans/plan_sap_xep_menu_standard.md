# Thay đổi thứ tự hiển thị Menu Standard (Nhóm Body)

Yêu cầu: Đưa dịch vụ "Mix 4 liệu trình" lên đầu danh sách Body và dịch vụ "Tinh dầu" xuống cuối danh sách Body trong màn hình Menu Standard (luồng đặt lịch thường).

## Chi tiết kế hoạch

Do dữ liệu Menu Standard được lấy từ database (Supabase) dựa trên thứ tự fetch mặc định, nên việc thay đổi thứ tự trực tiếp trên giao diện (Frontend) là giải pháp an toàn và linh hoạt nhất mà không làm ảnh hưởng đến cấu trúc database hiện tại.

### Các thay đổi dự kiến:

#### [MODIFY] [ServiceList.tsx](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/components/Menu/Standard/ServiceList.tsx)
- **Vị trí sửa:** Hàm render danh sách dịch vụ theo từng danh mục (`categories.map`).
- **Logic thêm vào:**
  1. Lọc ra các dịch vụ thuộc danh mục `Body`.
  2. Áp dụng hàm `sort()` tùy chỉnh cho nhóm này:
     - Kiểm tra nếu tên dịch vụ (tiếng Anh hoặc tiếng Việt) có chứa chữ `mix of four`, `mix 4`, hoặc `kết hợp 4` -> Đưa lên vị trí đầu tiên (return `-1`).
     - Kiểm tra nếu tên dịch vụ có chứa chữ `aroma oil` hoặc `tinh dầu` -> Đưa xuống vị trí cuối cùng (return `1`).
     - Các dịch vụ còn lại (Thai, Shiatsu, Hot stone, Four hand, v.v.) sẽ giữ nguyên thứ tự mặc định ban đầu.

## User Review Required
> [!IMPORTANT]
> Phương pháp này ưu tiên tính toán ngay trên frontend (`ServiceList.tsx`), đảm bảo UI sẽ tự động sắp xếp chính xác cho danh mục Body mà không cần can thiệp vào backend. Bạn có đồng ý với cách tiếp cận này không? Vui lòng bấm **Proceed / Duyệt** để tôi tiến hành viết code.
