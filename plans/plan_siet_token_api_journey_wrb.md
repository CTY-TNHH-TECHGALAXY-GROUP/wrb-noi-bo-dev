# Plan (Mức 2 — auth) — Siết `accessToken` cho API hậu dịch vụ WRB nội bộ

Repo: `web_noi_bo/wrb-noi-bo-dev`, nhánh `main`. Ngày lập: 04/10/2026. Trạng thái: **đã duyệt 04/10, đã code, chờ commit**. Quyết định bổ sung: StaffNotifications.bookingId giữ nguyên giá trị client gửi (chưa đổi sang mã đơn thật). Test mock: `scratch/test_token_routes.cjs` — 23/23 pass..
Nguồn: `plans/bao_cao_audit_wrb_bug_crash_20261003.md` mục S1–S4.

## 1. Vấn đề
Bốn API nhận **mã đơn thô** (`11NDK-001-03102026`, đoán được) thay cho `accessToken`, hoặc không kiểm gì:
`journey/update` (ghi trạng thái, điểm KTV, tip, vi phạm → ảnh hưởng thưởng), `notifications/emergency|normal`
(chuông quầy), `finance/invoice/[id]` (trả cả `accessToken`, `notes`, `violations`), `booking/[id]/add-services`
(chèn item, sửa TurnQueue, không ai gọi).

## 2. Nguyên tắc
- Route **ghi** chỉ resolve đơn bằng `.eq('accessToken', token)`. Không `.or()` với chuỗi người dùng. Không tìm thấy → 403.
- Route **đọc** hoá đơn giữ nhận mã đơn (3 link đang dùng), nhưng response chỉ gồm trường hoá đơn cần; token hành trình
  chỉ trả khi request **đến bằng token**.
- Không đổi định dạng dữ liệu ghi xuống DB, không đổi message chuông, không đổi màn hình nào.

## 3. Thay đổi theo file

| File | Thay đổi |
|---|---|
| `src/app/api/journey/update/route.ts` | (a) Resolve: `.eq('accessToken', bookingId).maybeSingle()`; không có → 403. (b) `status` chỉ nhận `'FEEDBACK'` (trang Journey chỉ gửi giá trị này; DONE do server tự tính), khác → 400. (c) `ktvCode`/`bookingItemId` ép `typeof === 'string'`. (d) `.single()` cuối (dòng ~298) → `maybeSingle` + 404. |
| `src/app/api/notifications/emergency/route.ts` | Resolve đơn bằng `.eq('accessToken', bookingId)` → lấy `id` thật ghi vào `StaffNotifications.bookingId` (giữ nguyên hành vi hôm nay: client đang gửi token, DB đang lưu… **cần kiểm tra** xem admin lọc theo `bookingId` = id hay token — xem mục 6). Rate-limit 60s cùng `type`. `message` cắt 500 ký tự. |
| `src/app/api/notifications/normal/route.ts` | Như trên; rate-limit 60s theo `bookingId + message`. |
| `src/app/api/finance/invoice/[id]/route.ts` | Giữ `.or(id, accessToken)` nhưng **escape**: tách 2 query `.eq('id')` rồi `.eq('accessToken')` (bỏ nội suy chuỗi vào `.or`). Response: whitelist `id, billCode, customerName, customerPhone, customerEmail, customerLang, createdAt, paymentMethod, totalAmount, discountAmount, status, source, parent_booking_id, items`. Thêm `journeyToken` = `accessToken` **chỉ khi** `booking.accessToken === bookingId` (request bằng token). |
| `src/components/invoice/PrintableInvoice.tsx:283` | QR: `bookingData.journeyToken ? /journey/${journeyToken} : baseUrl`. Hiện QR trỏ mã đơn → Journey không tải được; sau sửa quét được khi hoá đơn mở từ màn hành trình. |
| `src/app/api/booking/[id]/add-services/route.ts` | Trả 410 Gone (giữ file để không vỡ import), log cảnh báo. Không ai gọi ở 3 repo. |

Không đổi: `src/app/[lang]/journey/[bookingId]/page.tsx`, `Journey.logic.ts`, `WaitingRoom.tsx`, `old-user/history/page.tsx`, repo Admin, repo WebBooking.

## 4. Bảng Ảnh hưởng chéo

| Hạng mục | Phía KTV | Phía Quản lý (Admin) | Dùng chung | Kết luận |
|---|---|---|---|---|
| Màn hình / API | Không gọi API WRB nào | Không gọi 4 API này. Admin có route `app/api/finance/invoice/[id]` **riêng** (cùng lỗ hổng — ngoài phạm vi, Mức 2 bên Admin) | `Bookings`, `BookingItems`, `StaffNotifications` | Không ảnh hưởng — chỉ chặn request không có token |
| Số liệu (thưởng, điểm, tip) | Thưởng 4 sao đọc `BookingItems.ktvRatings/itemRating` | `finance/ktv-bonus-summary`, `ktv-summary`, `reports/ktv-ranking`, `cron/sync-daily-ledger` đọc cùng cột | Ghi bởi `journey/update` | **Khớp** — payload ghi không đổi một trường; chỉ nguồn ghi được xác thực |
| Realtime / refresh | — | Chuông quầy subscribe `StaffNotifications` | Insert bởi `notifications/*` | Đồng bộ — `type`, `message`, `isRead` giữ nguyên; `bookingId` xem mục 6 |
| Quyền xem | — | — | `finance/invoice` không còn trả `accessToken/notes/violations/reception_feedback` | Không lộ dữ liệu nội bộ |

## 5. Khách / Quầy — khác gì so với hôm nay
| Ai | Khác gì | Cần báo |
|---|---|---|
| Khách (điện thoại) | Không. Mọi link hành trình từ QR quầy đã là token. QR trên hoá đơn in: từ "không tìm thấy đơn" → quét được | Không |
| Quầy | Không. Chuông, yêu cầu, thêm dịch vụ qua Admin như cũ | Không |
| Admin | Không. Dữ liệu thưởng/điểm y hệt | Không |
| Kẻ biết mã đơn | Bị 403 khi ghi; hoá đơn xem theo mã đơn vẫn được nhưng không còn token/ghi chú nội bộ | — |

## 6. Điểm cần xác nhận khi code (không giả định)
1. `StaffNotifications.bookingId` mà admin lọc/hiển thị: hiện client gửi **token** (URL param) vào `bookingId` → DB đang lưu token hay id? Kiểm 20 dòng gần nhất. Nếu đang lưu token mà admin join theo id thì đây là bug sẵn có; plan sẽ ghi **id thật** sau resolve (đúng với `customer/request` đang làm) và báo lại.
2. `Bookings.accessToken` có index chưa (`TableInSupabase.md`) — nếu chưa, query `.eq('accessToken')` quét bảng; đề xuất migration index ở repo Admin (Mức 2 riêng), không chặn plan này.

## 7. Test (bắt buộc trước khi commit)
- Mock route handler (Node, không gọi DB thật) cho 4 route: token đúng → 200 & payload ghi giống trước; mã đơn thô → 403; `status: 'DONE'` → 400; `bookingId` chứa `,` → 403 (không lọt filter).
- Trên preview: (1) quét QR quầy → hành trình → SOS → chuông quầy kêu; (2) chấm 4 sao → `ktvRatings` ghi, Admin thấy REWARD; (3) mở hoá đơn từ phòng chờ & lịch sử (mã đơn) → hiển thị đủ, không có `accessToken` trong Network; (4) mở hoá đơn từ hành trình (token) → QR có token, quét ra hành trình; (5) `curl PATCH journey/update {bookingId: <mã đơn>}` → 403.

## 8. Lùi
Revert 1 commit. Không migration, không ghi đổi dữ liệu. Deploy: WRB `main` = bản đang chạy.
