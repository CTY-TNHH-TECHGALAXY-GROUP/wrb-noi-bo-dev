# Plan: Đánh giá Responsive Design

**Ngày**: 2026-05-19
**Trạng thái**: Đánh giá xong — CHƯA chỉnh sửa code, CHƯA tạo nhánh git
**Phạm vi**: Chỉ review, không sửa

---

## 1. Kết luận chính

Project được code **mobile-first đúng kiểu PWA/native** — hợp lý cho Android/iOS portrait (target chính).

**Trên desktop/tablet ngang KHÔNG có bố cục riêng** — các page chỉ kéo giãn (trông "to đùng"), không tái cấu trúc layout. Chỉ Checkout page có desktop layout tử tế.

---

## 2. Bằng chứng kỹ thuật (file:line)

### 2.1 Khung gốc — full viewport, không có max-width

| File | Dòng | Nội dung |
|---|---|---|
| `src/app/globals.css` | 17-38 | `html, body, :root { width:100%; height: var(--app-height, 100dvh); position: fixed; inset: 0 }` |
| `src/app/layout.tsx` | 49-56 | `viewport: { maximumScale: 1, userScalable: false, viewportFit: "cover" }` — config thuần PWA mobile |
| `tailwind.config.ts` | — | Không override breakpoint, dùng default (sm 640 / md 768 / lg 1024 / xl 1280) |

### 2.2 Mức độ dùng responsive breakpoint trên toàn project

- Tổng số `md:/lg:/xl:/sm:`: **34 lần / 11 file** — rất thấp.
- **Checkout** (`src/app/[lang]/{new,old}-user/[menuType]/checkout/page.tsx`): 7 lần mỗi page — page DUY NHẤT có layout desktop hoàn chỉnh (`max-w-6xl`, `lg:grid-cols-12`, sticky sidebar, `lg:hidden` action bar).
- **Standard Menu**: 1 lần (`md:grid-cols-2` ở `ServiceList.tsx:126`).
- **Premium VIP Menu**: **0 lần** trong toàn bộ `src/components/Menu/Premium/*`.
- **Intro / Customer-type / Select-menu / Journey / Auth**: hầu như không có.

### 2.3 Kích thước cứng (px) không co giãn theo viewport

| File | Element | Giá trị px |
|---|---|---|
| `src/app/(intro)/page.tsx:18-45` | Logo top / orbit radius / flag circle | 200 / 120 / 64 |
| `src/app/[lang]/customer-type/page.tsx:13-34` | Logo / button height | 180 / 70 |
| `src/components/MenuTypeSelector/index.tsx:33-40` | Sách menu | 155×195 |

Không có `clamp()`, `vw`, hay scale theo viewport.

---

## 3. Đánh giá theo viewport

| Viewport | Đánh giá | Trạng thái |
|---|---|---|
| Mobile portrait (≤640px) — Android/iOS | Mobile-first, viewport-fit notch, safe-area inset, app-height fix iOS | ✅ Hợp lý |
| Mobile landscape (~375h) | `position: fixed` + nhiều `absolute` theo safe-area — nguy cơ chồng lấp khi height < 400px | ⚠️ Rủi ro |
| Tablet (768–1024px) | Hầu hết page render kiểu mobile, không tận dụng không gian — chỉ `MenuTypeSelector` chuyển sang `md:flex-row` | ⚠️ Trống trải |
| Desktop (≥1280px) | Element kéo dài full width, không có `max-w-*` ở root → **bị "giãn to đùng"**. Trừ Checkout. | ❌ Vỡ |

---

## 4. Điểm vỡ layout (xác nhận chỉ ổn ở mobile)

1. **VIP Premium flow** (toàn bộ `src/components/Menu/Premium/`): 0 breakpoint. STAFF/BOOKING_CONFIG/CONFIRMATION trải full màn → bottom sheet trông kỳ trên desktop ngang.
2. **Standard menu**: chỉ ServiceList có 1 grid responsive — header/footer/sheet vẫn mobile-only.
3. **Intro orbit (chọn ngôn ngữ)** (`src/app/(intro)/page.tsx`): vòng tròn cờ bán kính 120px cố định, bé tí giữa màn 1920px.
4. **CustomerType / SelectMenu**: form 448px ở giữa màn lớn — không vỡ nhưng trống trải.
5. **Modal/Popup**: dùng `max-w-[400px]`, `max-w-[340px]` — OK trên cả mobile lẫn desktop. ✅
6. **Landscape mobile**: nguy cơ chồng lấp absolute element khi height ngắn.

---

## 5. Điểm làm tốt

- ✅ `manifest.json` + `appleWebApp` PWA config đầy đủ.
- ✅ `IOSViewportFix` (`src/components/IOSViewportFix.tsx`) xử lý `--app-height` cho iOS Safari (vấn đề kinh điển).
- ✅ Safe-area inset (`env(safe-area-inset-top/bottom)`) áp dụng nhất quán cho notch/dynamic island.
- ✅ Modal/Popup có `max-w` giới hạn — không vỡ trên desktop.
- ✅ `overscroll-behavior: none` chống bounce/pull-to-refresh.
- ✅ `next/font` tối ưu font Be Vietnam Pro + Playfair Display.
- ✅ Checkout page có layout desktop 2 cột (`max-w-6xl` + `lg:grid-cols-12` + sticky sidebar).

---

## 6. Đề xuất hướng cải thiện (CHƯA THỰC HIỆN)

> Đề xuất tham khảo — chờ user quyết định mới làm, nhớ KHÔNG tạo nhánh để tránh xung đột.

**Phương án A (nhẹ, ít rủi ro)** — chỉ giới hạn max-width ở root để app trông gọn trên desktop:
- Thêm wrapper `mx-auto max-w-md` (hoặc `max-w-lg`) ở root layout cho mobile-only pages, giữ chiều rộng giống tablet portrait trên cả desktop.
- Ưu: ít file phải đụng, không phá layout mobile.
- Nhược: vẫn không tận dụng được không gian desktop, chỉ "ép" mobile vào giữa.

**Phương án B (toàn diện)** — thêm desktop layout riêng cho từng flow chính:
- Premium VIP: 2-cột (staff list trái, config phải) ở `lg:`.
- Standard menu: grid 2-3 cột service ở `md:/lg:`.
- Intro: scale orbit theo viewport, hoặc đổi sang layout grid trên desktop.
- Ưu: trải nghiệm desktop thật sự.
- Nhược: nhiều file phải đụng (toàn bộ `Menu/Premium/*`, `Menu/Standard/*`, intro), test hồi quy rộng.

**Khuyến nghị**: nếu mục tiêu chính vẫn là khách dùng điện thoại trong spa, **Phương án A** là đủ. Phương án B chỉ làm nếu cần admin/staff xem trên PC.

---

## 7. Visual Test Evidence (cập nhật 2026-05-19)

Sau khi cài "Claude in Chrome" extension, đã chụp ảnh thực tế các page ở 3 viewport. Vì Chrome window không resize được dưới ~500px width, mobile/tablet được mô phỏng qua iframe (same-origin, cùng kích thước viewport thật → media query trigger chính xác).

**Viewport thực tế đã test:**
- Mobile: iframe 375×720
- Tablet: iframe 768×720
- Desktop: native Chrome window ~1568×710

### 7.1 Intro (`/`) — chọn ngôn ngữ

| Viewport | Kết quả | Screenshot ID |
|---|---|---|
| Mobile 375 | ✅ Logo, vòng tròn cờ, marquee scroll vừa khít | ss_5520i1exl |
| Tablet 768 | ⚠️ Logo + cờ giữ kích thước mobile, không gian quá rộng | ss_52049cznv |
| Desktop 1568 | ❌ **Vòng tròn cờ bé tí giữa màn**, marquee chữ "11 NGÔ ĐỨC KẾ..." lặp 3 lần trải hết chiều ngang — bằng chứng rõ nhất của thiết kế mobile bị kéo dài | ss_4659vnhs1 |

### 7.2 Customer-Type (`/vi/customer-type`)

| Viewport | Kết quả | Screenshot ID |
|---|---|---|
| Mobile 375 | ✅ 2 button gold đầy đủ chiều ngang, chữ "XEM LỊCH SỬ ĐƠN HÀNG" wrap 2 dòng | ss_2454v6ftc |
| Tablet 768 | ⚠️ Button vẫn giới hạn `max-w-md` ~448px, hai bên nhiều khoảng trống | ss_2454v6ftc |
| Desktop 1568 | ⚠️ Tương tự tablet, càng trống trải. KHÔNG vỡ, chỉ trống. | ss_2159c75fa |

→ Đây là page **không vỡ nhưng kém tận dụng** không gian desktop.

### 7.3 Select-Menu (`/vi/new-user/select-menu`) — chọn loại menu

| Viewport | Kết quả | Screenshot ID |
|---|---|---|
| Mobile 375 | ⚠️ 3 sách xếp dọc, sách HomeSpa thứ 3 **bị cắt** ở cuối viewport (height 720). Mobile screen ngắn hơn 800px sẽ overflow scroll. | ss_89221j4zd |
| Tablet 768 | ✅ 3 sách hàng ngang (`md:flex-row` kích hoạt), nền spa background đẹp | ss_89221j4zd |
| Desktop 1568 | ✅ Tương tự tablet, nền spa nhìn rõ hơn 2 bên | ss_70317tay1 |

→ Đây là page **responsive tốt nhất trong các page mobile-first** nhờ `md:flex-row`. Vấn đề duy nhất: mobile portrait < 800h có thể bị cắt sách thứ 3.

### 7.4 Standard Menu — Category Picker (`/vi/new-user/standard/menu`)

| Viewport | Kết quả | Screenshot ID |
|---|---|---|
| Mobile 375 | ✅ Grid 2 cột × 5 hàng, full width đẹp | ss_4283wnzlz |
| Tablet 768 | ⚠️ Vẫn 2 cột ở giữa (`max-w-sm` 448px), trống 2 bên | ss_4283wnzlz |
| Desktop 1568 | ⚠️ Same as tablet, trống bao quanh nhiều hơn | ss_7086mc390 |

### 7.5 Premium VIP Menu (`/vi/new-user/vip/menu`) — 🚨 BREAKDOWN POINT

| Viewport | Kết quả | Screenshot ID |
|---|---|---|
| Mobile 375 | ✅ **Thiết kế chuẩn**: title, search bar, card nhân viên với khuôn mặt đóng khung đẹp, button "ĐẶT NGAY" cân đối | ss_1881el8tm |
| Tablet 768 | ⚠️ Search bar mở rộng, ảnh nhân viên kéo dãn nhưng vẫn thấy mặt | ss_1881el8tm |
| Desktop 1568 | ❌❌ **VỠ NGHIÊM TRỌNG**: search bar chiếm full 1500px, card nhân viên 1500×400 (chỉ thấy cổ áo — phần mặt bị crop mất!), button "ĐẶT NGAY" 1500px dài lê thê | ss_6511j8gq2 |

→ **Đây là page bị "giãn to đùng" tồi tệ nhất, đúng như user mô tả ban đầu.** Toàn bộ flow VIP (STAFF → BOOKING_CONFIG → CONFIRMATION) có 0 responsive breakpoint nên sẽ vỡ tương tự ở các bước tiếp theo.

### 7.6 Checkout (`/vi/new-user/standard/checkout`)

- **Không test được visual**: page redirect về `/` vì không có cart state.
- Theo code review (mục 2.2): page DUY NHẤT có desktop layout hoàn chỉnh với `max-w-6xl` + `lg:grid-cols-12` + sticky sidebar + `lg:hidden` cho mobile bottom bar. Đây là chuẩn mực cho phần còn lại của app.

---

## 8. Tổng kết visual + code review

**Xếp hạng từ tốt → tệ trên desktop:**
1. ✅ **Checkout** — desktop layout đầy đủ (chỉ phân tích qua code)
2. ✅ **Select-menu** — md:flex-row cho 3 sách
3. ⚠️ **Customer-type / Standard category picker** — không vỡ, chỉ trống
4. ⚠️ **Intro** — vòng tròn cờ nhỏ + marquee lặp 3x
5. ❌ **VIP Menu (toàn flow)** — vỡ nặng: search/button/photo full 1500px

**Kết luận đối chiếu lo lắng ban đầu của user:**
> "có thể ở máy tính nó bị giãn ra to đùng chứ hk đổi bố cục cho hợp lý"

**Xác nhận hoàn toàn đúng.** Đặc biệt VIP flow là ví dụ điển hình. Code review cộng visual test thống nhất 100%.

---

## 9. Khuyến nghị thực tế (CHƯA THỰC HIỆN)

Mức ưu tiên nếu user muốn xử lý:

**P0 — Ngăn vỡ ngay**: Thêm `max-w-md mx-auto` ở root container của VIP flow (`src/components/Menu/Premium/*`). Một dòng CSS sửa được trải nghiệm desktop từ "vỡ" thành "OK trống".

**P1 — Cải thiện trải nghiệm**: Thêm `max-w-2xl` hoặc `max-w-3xl` ở root layout cho các page mobile-only (Intro, Customer-type, Select-menu, Standard) — app sẽ trông gọn ở giữa màn desktop thay vì trải full width.

**P2 — Tận dụng không gian desktop**: Làm theo Phương án B (đã đề xuất ở mục 6) — thiết kế desktop layout riêng cho từng flow. Tốn nhiều công, chỉ nên làm nếu admin/staff dùng PC nhiều.

**Vẫn giữ nguyên**: Modal/popup (đã `max-w-[400px]`), Checkout (đã có `lg:grid-cols-12`).
