# 📋 PLAN: SỬA LỖI ĐA NGÔN NGỮ TÊN DỊCH VỤ, SKILL VIP & LUỒNG KHÁCH CŨ (BOOKING / WALK-IN)

> **Mục tiêu**: Đảm bảo TÊN DỊCH VỤ (cả Dịch vụ Thường và Dịch vụ VIP) cùng các VIP Skill luôn hiển thị chính xác theo ngôn ngữ khách chọn (`vi`, `en`, `jp`, `kr`, `cn`) trên màn hình Lịch sử đơn hàng, Luồng đặt đơn mới (Walk-in / Booking), và sau khi Rebook (Đặt lại).

---

## 🔍 1. NGUYÊN NHÂN GỐC RỄ CHI TIẾT VỀ TÊN DỊCH VỤ (ROOT CAUSES)

Tại sao trong hình ảnh trên Tablet (giao diện Tiếng Nhật `jp`), toàn bộ Tên Dịch vụ đều hiển thị Tiếng Việt:
- `#1 BODY MIX 90p` (Dịch vụ Thường)
- `#1 Chân + Nail + Mix 4 loại 120p` (Dịch vụ VIP)
- `#2 Thái + Chân 120p` (Dịch vụ Thường)
- `#1 Ấn huyệt chân chuyên nghiệp 60p` (Dịch vụ Thường)

### A. Đối với Tên Dịch Vụ Thường (Standard Services):
1. **API `/api/orders` gán sai fallback**: Trong file [`src/app/api/orders/route.ts`](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/app/api/orders/route.ts) (dòng 407-415), code đang viết:
   ```typescript
   names: {
       vi: i.options?.displayName || svc?.nameVN || '',
       en: i.options?.displayName || svc?.nameEN || '',
       cn: i.options?.displayName || svc?.nameCN || '',
       kr: i.options?.displayName || svc?.nameKR || '',
       jp: i.options?.displayName || svc?.nameJP || '',
   }
   ```
   Nếu trong `options` của BookingItem có lưu `displayName` dạng Tiếng Việt (hoặc nếu `svc.nameJP` trong DB rỗng/chưa cập nhật), thì `names.jp`, `names.en`, `names.kr`, `names.cn` **đều bị ép lấy theo `displayName` / `nameVN` (Tiếng Việt)**.
2. **Thiếu tên dịch vụ đa ngôn ngữ chuẩn trong DB / Fallback**: Nếu `svc.nameJP` hoặc `svc.nameEN` rỗng, API không có cơ chế dịch fallback tự động thông minh theo ID/mã dịch vụ.

### B. Đối với Tên Dịch Vụ VIP (VIP Bespoke / VIP Packages):
1. **Tên ghép cứng dạng Tiếng Việt khi tạo đơn**: Khi khách hàng đặt đơn VIP (gồm nhiều Skill như Ráy tai + Nail + Massage chân), hệ thống ghép các tên Skill thành chuỗi Tiếng Việt (ví dụ: `"Chân + Nail + Mix 4 loại"`) rồi lưu cố định vào `options.displayName`.
2. **Không tự động dịch lại Skill theo ngôn ngữ `lang`**: API `/api/orders` khi đọc `options.selectedSkills` (mảng mã skill như `['skill_1', 'skill_2']`) không dịch lại các mã skill này theo `lang` của người xem (`jp`, `en`, `kr`, `cn`), mà lấy trực tiếp chuỗi `displayName` Tiếng Việt đã lưu trong DB.
3. **Khi Rebook (Khôi phục Giỏ hàng)**: Hàm `restoreCart` lấy lại `options.displayName` Tiếng Việt cũ và đưa vào Cart dưới dạng `vipDisplayName`, khiến màn hình Rebook/Checkout tiếp tục hiển thị Tiếng Việt.

### C. Luồng Khách Cũ (Old User) & Nhãn Giao diện:
1. **Lệch `lang` khi đăng nhập**: `CustomerType.logic.ts` tự động đổi `lang` về `customer.lang` cũ trong DB thay vì giữ đúng `lang` mà khách vừa chọn trên giao diện Tablet.
2. **Hardcode nhãn**: Nhãn giờ hẹn trong Lịch sử bị hardcode Tiếng Việt (`🕐 Hẹn: 17:00` - dòng 353 `History/page.tsx`).

---

## 🛠️ 2. GIẢI PHÁP CHI TIẾT ĐỂ FIX TÊN DỊCH VỤ & SKILL

### Component 1: Xử lý Tên Dịch Vụ (Thường & VIP) tại API `/api/orders`
- **File**: [`src/app/api/orders/route.ts`](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/app/api/orders/route.ts)
- **Giải pháp**:
  - **Với Dịch Vụ VIP**: Đọc mảng `options.selectedSkills` (mã skill ID). Sử dụng `SKILL_MAP` và `getSkillName(skill, lang)` để **dịch và ghép động Tên Dịch vụ VIP** cho từng ngôn ngữ `vi`, `en`, `jp`, `kr`, `cn` (Ví dụ với `jp`: `"Foot + Nail + Mix 4 types"` / `"フット + ネイル"`).
  - **Với Dịch Vụ Thường**: Ưu tiên lấy theo tên ngôn ngữ trong DB (`svc.nameJP`, `svc.nameEN`, `svc.nameKR`, `svc.nameCN`, `svc.nameVN`). Nếu cột tên ngôn ngữ đó trong DB rỗng, fallback sang tên Tiếng Anh hoặc tên gốc của dịch vụ thay vì ép lấy `displayName` Tiếng Việt.

### Component 2: Sửa hiển thị Tên Dịch vụ & Rebook tại `HistoryPage`
- **File**: [`src/app/[lang]/old-user/history/page.tsx`](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/app/[lang]/old-user/history/page.tsx)
- **Giải pháp**:
  - Đa ngôn ngữ hóa nhãn `🕐 Hẹn:` (`dict.history.appt_label` hoặc map `vi`: `Hẹn`, `en`: `Appt`, `jp`: `予約`, `kr`: `예약`, `cn`: `预约`).
  - Trong `restoreCart`: Khi rebook đơn VIP hoặc dịch vụ thường, không dùng chuỗi Tiếng Việt cũ làm `vipDisplayName`. Thay vào đó, tự động re-calculate tên dịch vụ/skill theo `lang` hiện tại của màn hình Tablet.

### Component 3: Ưu tiên `lang` hiện tại của khách khi vào Luồng Khách Cũ
- **File**: [`src/app/[lang]/customer-type/CustomerType.logic.ts`](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/app/[lang]/customer-type/CustomerType.logic.ts)
- **Giải pháp**: Giữ đúng `lang` active hiện tại của giao diện khi chuyển sang `/old-user/history` và các trang tiếp theo (`select-menu`, `menu`, `checkout`).

### Component 4: Đảm bảo Tên Dịch vụ & Skill dịch đúng trên Cart Sheet / Invoice / Checkout
- **File**: [`src/components/Checkout/Invoice.tsx`](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/components/Checkout/Invoice.tsx) & [`src/components/Menu/Premium/VipCartStep/index.tsx`](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/components/Menu/Premium/VipCartStep/index.tsx)
- **Giải pháp**: Đảm bảo khi hiển thị trong Hóa đơn (Invoice) hoặc Cart Sheet VIP, luôn lấy danh sách `vipSkillIds` / `service.names[lang]` dịch theo `lang` hiện tại thay vì hiển thị string cũ.

---

## 🧪 3. KẾ HOẠCH KIỂM THỬ (VERIFICATION PLAN)

### Manual Testing:
1. **Kiểm tra Tên Dịch Vụ trên Màn hình Lịch sử (`/jp/old-user/history`)**:
   - Tất cả các tên dịch vụ thường: "BODY MIX 90p", "Thái + Chân 120p", "Ấn huyệt chân chuyên nghiệp 60p" -> Phải hiển thị chuẩn Tiếng Nhật (hoặc Tiếng Anh nếu DB chưa có chữ JP).
   - Tên dịch vụ VIP: "Chân + Nail + Mix 4 loại 120p" -> Phải hiển thị chuỗi Tiếng Nhật được dịch từ danh sách Skill VIP.
   - Nhãn giờ hẹn -> Hiển thị `🕐 予約: 17:00`.
2. **Kiểm tra Rebook (Đặt lại) & Chọn Walk-in / Booking**:
   - Bấm `再予約` (Rebook) -> Chọn Walk-in hoặc Booking.
   - Kiểm tra tên dịch vụ ở giỏ hàng và màn hình Checkout -> 100% bằng Tiếng Nhật.
