# Kế hoạch Thay Đổi Giao Diện 4 Nút - Customer Type

**Mục tiêu**: Cập nhật lại giao diện chọn loại khách hàng (customer-type) thành một lưới 2x2 vuông vức, đảm bảo tính thẩm mỹ trên Mobile.

## Các thay đổi đã thực hiện

---

### UI Components

#### src/app/[lang]/customer-type/page.tsx
- Loại bỏ giao diện Card to (<section>) của "Xem lịch sử".
- Loại bỏ nhãn phân cách "NEW VISIT".
- Bọc 4 nút trong grid grid-cols-2 gap-[10px] w-full.
- **Hàng 1**: 
  - Nút **Xem lịch sử**: Sử dụng icon <History />, dùng logic onSelectOldUser.
  - Nút **Walk-in**: Sử dụng icon <ArrowRight />, dùng logic onSelectWalkIn.
- **Hàng 2**:
  - Nút **Advance Booking**: Sử dụng icon <Calendar />, dùng logic onSelectAdvance.
  - Nút **Contacted First**: Sử dụng icon <Phone />, dùng logic mới onSelectContactedFirst.
- Mọi nút dùng chung 1 style CSS đồng nhất (Dark theme, viền vàng glow khi hover/active).

---

### Logic & i18n

#### src/app/[lang]/customer-type/CustomerType.logic.ts
- Phục hồi lại hàm onSelectAdvance điều hướng về 
ew-user/booking/select-menu (như lịch sử commit cũ).
- Tách riêng hàm onSelectContactedFirst điều hướng đến contacted-first dành cho nút "Đã liên hệ trước".
- Export cả 2 hàm để giao diện sử dụng.

#### src/app/[lang]/customer-type/CustomerType.i18n.ts
- Bổ sung các key dịch thuật mới cho 5 ngôn ngữ (en, vi, jp, kr, cn).
  - Key tiêu đề: tn_history_title / "Lịch sử đơn hàng".
