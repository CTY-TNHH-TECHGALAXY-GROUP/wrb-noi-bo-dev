# Kế hoạch Cập Nhật Nút Chọn Ngôn Ngữ (Dropup) ở Footer

## 1. Yêu cầu & Phân tích
- **Mục tiêu:** Chỉ hiển thị 1 lá cờ của ngôn ngữ hiện hành tại Footer. Khi nhấn vào, một danh sách (dropup) sẽ trượt lên từ dưới, cho phép khách hàng chọn ngôn ngữ khác. Sau khi chọn, ngôn ngữ thay đổi và danh sách đóng lại.
- **Giải pháp:** Sử dụng React local state (`isLangOpen`) để quản lý việc bật/tắt dropup menu. Áp dụng `framer-motion` (đã có sẵn trong dự án) để tạo hiệu ứng trượt lên (slide-up) mượt mà cho menu chọn cờ.

## 2. Chi tiết thay đổi trong `Footer.tsx`

- **Thêm Imports:** `useState`, `useRef`, `useEffect` từ React; `motion`, `AnimatePresence` từ `framer-motion`.
- **Thêm State:** `const [isLangOpen, setIsLangOpen] = useState(false);`
- **Logic Đóng Menu:** Thêm một hook lắng nghe sự kiện click bên ngoài (`mousedown`) để đóng menu nếu khách hàng ấn ra ngoài vùng chọn cờ.
- **Cập nhật Giao diện (UI):**
  - **Nút Chính (Trigger):** Hiển thị duy nhất một nút dạng tròn, có hình lá cờ của ngôn ngữ hiện tại.
  - **Menu Dropup:** Khi `isLangOpen` là `true`, render một `<motion.div>` nổi lên trên (position `absolute`, `bottom-[calc(100%+12px)]`).
  - Menu này chứa danh sách các ngôn ngữ (có cờ nhỏ và tên ngôn ngữ như "Tiếng Việt", "English").
  - Nút ngôn ngữ nào đang được chọn sẽ có nền highlight nhẹ màu vàng.
  - Khi click vào 1 ngôn ngữ bất kỳ, gọi `handleLanguageChange(l.id)` và set `setIsLangOpen(false)`.

## 3. Chờ Duyệt
Bạn vui lòng kiểm tra xem thiết kế menu dạng dropup kèm tên ngôn ngữ như vậy đã hợp ý chưa nhé. Nếu OK, tôi sẽ tiến hành cập nhật lại giao diện!
