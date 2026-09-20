# QR Walk-in → Deep Body Treatment

## Mục tiêu

Thiết kế lại điểm vào walk-in theo đúng baseline `Deep Body Treatment` của branch hiện tại:

```text
QR cố định tại tiệm
→ Server cấp số thứ tự / billCode
→ Khách vào thẳng Deep Body Treatment
→ Chọn KTV, liệu trình, thời lượng và ghi chú
→ Checkout
→ Gắn order vào đúng phiên đã cấp số
→ Đơn chuyển sang NEW để lễ tân/KTV xử lý
```

Timeout 1 giờ chỉ áp dụng cho phiên QR walk-in đã được cấp số nhưng chưa checkout.

## Kết quả kiểm tra hiện trạng

### Branch và phạm vi

- Branch: `feat/deep-body-treatment`.
- Baseline commit: `6051aea`.
- Worktree đang có các thay đổi Deep Body và ảnh KTV chưa commit. Không được reset, checkout hoặc ghi đè các thay đổi đó.
- File kế hoạch này chỉ là tài liệu; chưa sửa logic ứng dụng.

### Deep Body đã có sẵn

- `src/components/Menu/DeepBody/index.tsx` đã quản lý flow chọn KTV → cấu hình liệu trình.
- Khi xác nhận, component đã gọi `addVipToCart(...)` rồi gọi `onCheckout()`.
- Cart dùng `itemType: 'vip'`, `serviceId` dạng `NHT...`, `vipSkillIds`, `vipDuration`, `vipStaffId`, `vipCustomerNotes`, `focus`, `avoid`, `note`.
- `src/app/api/orders/handleVipItems.ts` đã xử lý riêng item VIP/Deep Body, chuẩn hóa tên tiếng Việt cho dispatch và lưu `BookingItems`.
- Không cần viết lại logic chọn KTV, tính giá, chọn kỹ thuật hoặc lưu item Deep Body.

### Điểm vào hiện tại chưa đúng yêu cầu mới

- `src/app/(intro)/LanguageSelector.logic.ts` vẫn chuyển vào `/${lang}/standard/menu`.
- `src/app/[lang]/[menuType]/menu/page.tsx` vẫn điều phối `standard`, `spa`, `vip`.
- `PremiumMenu` mới render `DeepBodyMenu` khi tab `DEEP_BODY_TREATMENT` được chọn.
- Chưa có route walk-in duy nhất render trực tiếp Deep Body.

### Order hiện tại

- `src/app/api/orders/route.ts` đang tạo `billCode`, `Bookings` và `BookingItems` trong lúc checkout.
- `Bookings.status` hiện bắt đầu là `NEW`.
- Vì vậy hiện chưa có bản ghi đại diện cho khách đã lấy số nhưng chưa chọn dịch vụ.
- Không được dùng `NEW` cho trạng thái chờ order; nếu dùng như vậy, dispatch có thể coi phiên rỗng là đơn hợp lệ.

### Timeout hiện tại

- Chưa có job server-side hoặc `pg_cron` cho việc tự động cancel.
- Các `setInterval` trong frontend chỉ dành cho polling/timer UI, không đủ tin cậy để thay đổi trạng thái nghiệp vụ.

### Schema cần lưu ý

Các file schema cũ trong `scripts/supabase_schema.sql` dùng bảng/cột lowercase và UUID, trong khi code hiện tại dùng các bảng như `"Bookings"`, `"BookingItems"`, custom ID và camelCase. Khi triển khai migration phải kiểm tra schema live Supabase trước, không copy nguyên schema cũ.

## Quyết định nghiệp vụ

### Số thứ tự và billCode

QR tại tiệm là QR cố định, không chứa sẵn số bill. Khi khách quét, server cấp số mới.

MVP dùng `billCode` làm số thứ tự hiển thị để không tạo thêm bảng queue. Nếu sau này số thứ tự và mã hóa đơn có quy tắc khác nhau, mới tách `queueNumber`.

### Trạng thái

```text
AWAITING_ORDER
  ├─ checkout thành công → NEW
  └─ hết hạn 1 giờ → CANCELLED
```

Chỉ những booking có `source = QR_WALK_IN` và `status = AWAITING_ORDER` mới được timeout.

### Mốc tính giờ

- Bắt đầu từ lần check-in QR thành công đầu tiên.
- Ghi `qrScannedAt` và `orderDeadlineAt` ở server.
- Reload trang không cấp số mới nếu session hiện tại còn hợp lệ.
- Quét lại sau khi đã cancel không được khôi phục booking cũ; khách nhận số mới.

### Bảo vệ truy cập

- Không dùng `billCode` làm token truy cập.
- QR/session dùng `accessToken` ngẫu nhiên đã có trong hệ thống.
- API checkout phải kiểm tra lại trạng thái và deadline trên server.
- Submit sau khi đã cancel trả HTTP `409`.

## Diff dự kiến

Đây là diff triển khai dự kiến, chưa phải diff đã áp dụng.

### 1. Migration database — thêm lifecycle cho QR walk-in

**File mới:** `supabase/migrations/20260919_qr_walkin_deep_body.sql`

```diff
+ ALTER TABLE public."Bookings"
+   ADD COLUMN IF NOT EXISTS "qrScannedAt" timestamptz,
+   ADD COLUMN IF NOT EXISTS "orderDeadlineAt" timestamptz,
+   ADD COLUMN IF NOT EXISTS "cancelledAt" timestamptz,
+   ADD COLUMN IF NOT EXISTS "cancelReason" text;
+
+ CREATE INDEX IF NOT EXISTS idx_bookings_qr_pending_deadline
+   ON public."Bookings" ("status", "orderDeadlineAt")
+   WHERE "status" = 'AWAITING_ORDER';
+
+ CREATE OR REPLACE FUNCTION public.expire_qr_walkin_orders()
+ RETURNS integer
+ LANGUAGE plpgsql
+ SECURITY DEFINER
+ AS $$
+ DECLARE affected integer;
+ BEGIN
+   UPDATE public."Bookings"
+   SET
+     "status" = 'CANCELLED',
+     "cancelledAt" = now(),
+     "cancelReason" = 'NO_ORDER_AFTER_QR_SCAN',
+     "updatedAt" = now()
+   WHERE "source" = 'QR_WALK_IN'
+     AND "status" = 'AWAITING_ORDER'
+     AND "orderDeadlineAt" <= now();
+
+   GET DIAGNOSTICS affected = ROW_COUNT;
+   RETURN affected;
+ END;
+ $$;
+
+ -- Chỉ thêm khi Supabase project đã bật pg_cron.
+ SELECT cron.schedule(
+   'expire-qr-walkin-orders',
+   '* * * * *',
+   $$SELECT public.expire_qr_walkin_orders();$$
+ );
```

Ghi chú:

- Việc cấp số phải atomic. Không dùng lại cách `select max(billCode) + 1` ở frontend/API nếu có nhiều khách quét cùng lúc.
- Nếu bill sequence hiện tại chưa có RPC/sequence dùng chung, migration cần thêm một PostgreSQL function có lock giao dịch cho việc cấp số.
- Không xóa booking đã cancel.
- Nếu project không bật `pg_cron`, dừng ở migration và báo rõ; không thay bằng timer frontend.

### 2. API cấp số walk-in

**File mới:** `src/app/api/walk-in/check-in/route.ts`

```diff
+ export async function POST(request: Request) {
+   // 1. Validate QR key/signature nếu hệ thống dùng QR key cố định.
+   // 2. Gọi RPC/transaction để cấp billCode duy nhất.
+   // 3. Insert một Booking rỗng:
+   //    source: 'QR_WALK_IN'
+   //    status: 'AWAITING_ORDER'
+   //    totalAmount: 0
+   //    billCode: số thứ tự
+   //    accessToken: random token
+   //    qrScannedAt: now
+   //    orderDeadlineAt: now + 60 minutes
+   // 4. Trả accessToken, billCode, orderDeadlineAt.
+ }
+
+ export async function GET(request: Request) {
+   // Resume session bằng accessToken.
+   // Chỉ trả session nếu source = QR_WALK_IN.
+   // Nếu đã CANCELLED hoặc đã quá hạn thì trả trạng thái hết hạn.
+ }
```

API không nhận `billCode` từ client để tự do tìm/sửa booking. Client chỉ gửi token phiên.

### 3. Route walk-in duy nhất, render trực tiếp Deep Body

**File mới:** `src/app/[lang]/walk-in/page.tsx`

```diff
+ 'use client';
+
+ // Khi mở từ QR:
+ // - lấy session token trong sessionStorage nếu còn;
+ // - nếu chưa có thì POST /api/walk-in/check-in;
+ // - hiển thị billCode/số thứ tự và countdown tới orderDeadlineAt;
+ // - render trực tiếp <DeepBodyMenu />;
+ // - không render CustomerType, SelectMenu, StandardMenu hoặc Premium tab switch.
+
+ <DeepBodyMenu
+   lang={lang}
+   isBookingFlow={false}
+   onBack={handleBack}
+   onCheckout={() => router.push(`/${lang}/walk-in/checkout`)}
+ />
```

Không tạo camera scanner trong web nếu QR được quét bằng camera điện thoại. QR chỉ cần mở route này.

### 4. Route checkout walk-in

**File mới:** `src/app/[lang]/walk-in/checkout/page.tsx`

```diff
+ // Route adapter mỏng để tái sử dụng checkout hiện tại.
+ // Không copy lại toàn bộ UI checkout.
+ // Truyền menuType nội bộ là 'walk-in' chỉ để checkout biết đường quay lại.
+ // Không dùng menuType để phân loại order.
```

Nếu cần tránh route adapter, có thể đổi checkout hiện tại thành component dùng chung; không tạo thêm strategy/factory.

### 5. Checkout hiện tại — gửi token phiên

**File:** `src/app/[lang]/[menuType]/checkout/page.tsx`

```diff
  const handleFinalSubmit = async () => {
+   const walkInToken = menuType === 'walk-in'
+     ? sessionStorage.getItem('qr_walkin_access_token')
+     : undefined;

    const payload = {
      customer: customerInfo,
      items: cart,
      paymentMethod,
      amountPaid: ..., 
      totalVND,
      lang: activeLang,
      vatInvoice,
      preBookingId,
+     walkInToken,
    };
  };
```

Sau khi API trả thành công, xóa `qr_walkin_access_token` và session số thứ tự.

### 6. `/api/orders` — attach vào booking đã cấp số

**File:** `src/app/api/orders/route.ts`

```diff
- const { customer, items, paymentMethod, amountPaid, totalVND, lang, vatInvoice, preBookingId } = body;
+ const {
+   customer,
+   items,
+   paymentMethod,
+   amountPaid,
+   totalVND,
+   lang,
+   vatInvoice,
+   preBookingId,
+   walkInToken,
+ } = body;

+ let existingWalkInBooking = null;
+ if (walkInToken) {
+   // Resolve accessToken bằng service client.
+   // Điều kiện bắt buộc:
+   // source = QR_WALK_IN
+   // status = AWAITING_ORDER
+   // orderDeadlineAt > now()
+   // Nếu fail: trả 409.
+ }

- // Tạo billCode và insert Booking mới cho mọi request.
+ // Nếu có existingWalkInBooking:
+ // - dùng booking.id/billCode/accessToken hiện tại;
+ // - không insert Booking mới;
+ // - update khách hàng + total/payment;
+ // - insert item Deep Body bằng handleVipItems;
+ // - chuyển status AWAITING_ORDER → NEW bằng điều kiện trạng thái.
+ // Nếu không có walkInToken: giữ nguyên flow hiện tại.
```

Để tránh race giữa cron cancel và checkout, phần finalize walk-in phải atomic. Ưu tiên tạo RPC `finalize_qr_walkin_order` nhận booking token, customer data và danh sách item đã chuẩn hóa. Không chỉ kiểm tra status rồi thực hiện nhiều request rời rạc.

RPC phải bảo đảm:

```text
AWAITING_ORDER + chưa hết hạn
→ update Booking + insert BookingItems + status NEW
```

Nếu một bước lỗi thì toàn bộ transaction rollback.

### 7. Không sửa Deep Body logic

**Không thay đổi trong phạm vi này:**

- `src/components/Menu/DeepBody/index.tsx`
- `src/components/Menu/DeepBody/BookingConfig/index.tsx`
- `src/components/Menu/DeepBody/StaffSelector/index.tsx`
- `src/app/api/orders/handleVipItems.ts`
- `src/components/Menu/MenuContext.tsx`

Các thay đổi Deep Body hiện có trong worktree phải được giữ nguyên.

### 8. Bỏ qua flow cũ trong entry walk-in

Không xóa ngay các route cũ để tránh phá lịch sử/deep link. Chỉ bypass khỏi entry mới:

```text
Không dùng cho flow mới:
- CustomerType
- select-menu
- StandardMenu
- old-user
- booking/select-menu
- advance booking
```

Chỉ xóa các route cũ sau khi có bằng chứng không còn caller ngoài branch này.

## Acceptance criteria

1. Khách quét QR và nhận số duy nhất từ server.
2. Deep Body mở ngay sau khi cấp số, không qua `standard` hoặc menu selector.
3. Reload trang không cấp số mới khi session cũ còn `AWAITING_ORDER`.
4. Checkout tạo `BookingItems` Deep Body trong đúng `Bookings.id` đã cấp.
5. Dispatch chỉ thấy đơn sau khi status chuyển thành `NEW`.
6. Không checkout trong 60 phút thì booking chuyển thành `CANCELLED` mà không cần mở trình duyệt.
7. Checkout sau cancel trả `409`, không tạo order mới âm thầm.
8. Hai khách quét cùng thời điểm không nhận trùng `billCode`.
9. Order thường hiện tại ngoài flow QR không bị thay đổi.
10. Các field Deep Body hiện có vẫn nguyên vẹn: KTV, kỹ thuật, thời lượng, focus, avoid, note, grouping mode.

## Kiểm thử tối thiểu

- Migration/RPC: hai lần cấp số liên tiếp phải khác `billCode`.
- Check-in: trả `accessToken`, `billCode`, `orderDeadlineAt`.
- Expiry: đặt deadline quá khứ, chạy `expire_qr_walkin_orders()`, assert status `CANCELLED`.
- Finalize: token còn hạn chuyển `AWAITING_ORDER → NEW` và có `BookingItems`.
- Finalize hết hạn: assert HTTP `409`, không có item mới.
- Regression: submit `/api/orders` không có `walkInToken` vẫn đi vào flow cũ.

## Prompt triển khai dùng cho agent

```text
Bạn đang làm việc trong repository web nội bộ, branch feat/deep-body-treatment.

Mục tiêu:
Triển khai flow walk-in mới lấy Deep Body Treatment làm menu chính:

QR cố định tại tiệm → server cấp số thứ tự/billCode → mở trực tiếp Deep Body → checkout → attach order vào đúng phiên → NEW.

Timeout:
Nếu sau 60 phút tính từ lần QR check-in đầu tiên mà chưa checkout, phiên phải tự động chuyển CANCELLED bằng server-side job/database scheduler.

Ràng buộc:
1. Không dùng StandardMenu, CustomerType, old-user, advance booking hoặc menu selector trong flow mới.
2. Giữ [lang] chỉ cho i18n; không dùng lang/menuType để thay đổi nghiệp vụ.
3. DeepBody là source of truth cho KTV, kỹ thuật, thời lượng, focus, avoid, note và grouping mode.
4. Tái sử dụng handleVipItems và checkout hiện tại; không viết lại logic Deep Body.
5. QR walk-in tạo một Booking rỗng với status AWAITING_ORDER, source QR_WALK_IN, accessToken, qrScannedAt và orderDeadlineAt.
6. Checkout phải cập nhật đúng Booking này, không tạo Booking/bill thứ hai.
7. Chỉ AWAITING_ORDER + QR_WALK_IN mới được timeout. Không cancel NEW, DONE, advance booking hoặc đơn nguồn khác.
8. Không dùng setInterval frontend làm cơ chế cancel.
9. API phải kiểm tra accessToken, status và deadline ở server.
10. Race giữa checkout và expiry phải được xử lý atomic bằng PostgreSQL transaction/RPC.
11. Kiểm tra schema live Supabase trước khi viết migration; không dùng nguyên scripts/supabase_schema.sql vì file đó là schema cũ, khác casing và kiểu ID hiện tại.
12. Không reset/checkout/ghi đè các thay đổi chưa commit trong worktree, đặc biệt các thay đổi Deep Body và ảnh KTV.

Trước khi sửa:
- Đọc plans/plan_qr_walkin_deep_body_prompt_diff.md.
- Kiểm tra các caller của DeepBody, PremiumMenu, checkout và /api/orders.
- Xác minh schema live của Bookings/BookingItems/Customers.
- Xác minh Supabase project có pg_cron. Nếu không có, báo blocker và không thêm timer frontend.

Phạm vi file dự kiến:
- supabase/migrations/20260919_qr_walkin_deep_body.sql
- src/app/api/walk-in/check-in/route.ts
- src/app/[lang]/walk-in/page.tsx
- src/app/[lang]/walk-in/checkout/page.tsx
- src/app/[lang]/[menuType]/checkout/page.tsx
- src/app/api/orders/route.ts

Thực hiện:
- Cấp billCode atomic.
- Resume session bằng accessToken khi reload.
- Render DeepBody trực tiếp.
- Gửi walkInToken khi checkout.
- Finalize order atomic; rollback nếu insert item hoặc update Booking lỗi.
- Cấu hình expiry server-side mỗi phút.
- Trả 409 nếu session đã hết hạn.

Kiểm thử bắt buộc:
- Hai check-in đồng thời không trùng số.
- Reload không cấp số mới.
- Checkout attach đúng booking.
- Expiry chuyển đúng AWAITING_ORDER → CANCELLED.
- Checkout sau expiry bị từ chối.
- Flow /api/orders không có walkInToken vẫn hoạt động.

Kết quả bàn giao:
- Code diff nhỏ nhất có thể.
- Migration/RPC rõ ràng.
- Không sửa các file Deep Body hiện có nếu không cần.
- Báo danh sách file đã đổi, test đã chạy và các giả định schema.
```

## Quyết định tối giản

Không tạo bảng queue mới ở giai đoạn đầu. Reuse `Bookings` với `AWAITING_ORDER` và `billCode`; thêm bảng riêng chỉ khi số thứ tự cần độc lập với hóa đơn hoặc cần nhiều loại queue.

