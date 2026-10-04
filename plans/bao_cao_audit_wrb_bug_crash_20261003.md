# Báo cáo rà soát bug / crash tiềm ẩn — WRB nội bộ (main @ 0f8c35a, 03/10/2026)

Phạm vi: toàn bộ `src/app/api`, `src/app/[lang]`, `src/components`, `src/lib`, cấu hình. Chỉ đọc, chưa sửa gì.
Mọi mục đều đã đọc code xác nhận; `file:line` tính từ gốc repo. ESLint toàn repo: 110 cảnh báo, không có lỗi gây crash.

## 1. BẢO MẬT — sửa gấp (ai biết mã đơn dạng `11NDK-001-03102026` là thao tác được đơn người khác)

| # | Vị trí | Vấn đề | Cách sửa |
|---|---|---|---|
| S1 | `src/app/api/journey/update/route.ts:55` | `.or('accessToken.eq.X,id.eq.X')` nhận **mã đơn thô** làm token → đổi status/tip/violations, chấm điểm KTV, bắn push "Xuất sắc" giả. `status` không whitelist. | Chỉ `.eq('accessToken')`; whitelist `status`; không dùng `.or` với chuỗi người dùng |
| S2 | `src/app/api/finance/invoice/[id]/route.ts:29-37` | `.or(id,accessToken)` + `select('*')` → lộ `accessToken`, SĐT, email, notes, violations của mọi đơn. Có token là khai thác S1. | Chỉ tìm theo token; chọn cột rõ, bỏ `accessToken/notes/violations` |
| S3 | `src/app/api/booking/[id]/add-services/route.ts` → `src/services/booking.ts:146-265` | Không auth, không giới hạn qty → chèn item, cộng `totalAmount`, sửa `TurnQueue` của KTV, spam quầy. Dùng anon key. | Bắt buộc `accessToken` khớp đơn hoặc auth nhân viên |
| S4 | `src/app/api/notifications/emergency|normal/route.ts` | Chỉ cần `bookingId` bất kỳ, không rate-limit → chuông khẩn quầy kêu liên tục với nội dung tuỳ ý. | Dùng mẫu của `customer/request` (zod + token + chặn 3 phút) |
| S5 | `src/app/api/orders/route.ts:486` | `GET /api/orders?phone=` trả `accessToken` mọi đơn của số đó, không xác thực chủ số. | Không trả token trong lịch sử |
| S6 | `.env.local` `NEXT_PUBLIC_DEVICE_REGISTER_PIN`, `src/app/register-device/page.tsx:7` | PIN đăng ký tablet nằm trong bundle client, có fallback `'8899'`. | Kiểm PIN ở API server |
| S7 | `src/app/api/translate/route.ts` | Public, không giới hạn, tốn Google key; `sourceLang` không phải string → 500. | Rate-limit + validate |

## 2. CRASH tiềm ẩn

| # | Vị trí | Vấn đề | Cách sửa |
|---|---|---|---|
| C1 | `src/components/Journey/ServiceList.tsx:52` | `return null` đứng TRƯỚC 3 hook → items đi từ rỗng sang có (quầy thêm dịch vụ) → "Rendered more hooks" → trang Journey khách trắng. | Đưa early-return xuống dưới mọi hook |
| C2 | `src/components/Journey/useJourneyRealtime.ts:389, 221-227` | `JSON.parse(segments)` trong `setData` không try/catch; `.replace` trên giá trị không phải string. | Helper `safeParseSegments`, `String(x)` |
| C3 | `src/components/Menu/MenuContext.tsx:261` | `resolveVipServiceId` throw bên trong `setCart` updater khi duration lệch. | try/catch, giữ id cũ |
| C4 | `src/components/Journey/CustomerRequestFAB.tsx:81` | `(payload.new.type as string).replace` với type null. | `String(type ?? '')` |
| C5 | Dead code `Checkout/CheckoutForm*`, `Feedback/*`, `ServiceOptionSelector` | `t[lang]` không fallback, chỉ có vi/en → gọi với kr/jp/cn là crash. Không ai gọi nhưng `ignoreBuildErrors` che. | `t[lang] \|\| t.en` hoặc xoá |

## 3. SAI DỮ LIỆU — tiền, giờ, khách

| # | Vị trí | Vấn đề | Cách sửa |
|---|---|---|---|
| D1 | `api/orders/route.ts:134`, `api/bookings/route.ts:149`, `handleStandardItems.ts:80`, `handleVipItems.ts:256` | **Tin `totalVND`/`priceVND` từ client.** Rebook từ lịch sử (`old-user/history/page.tsx:284`) gửi giá cũ → server chấp nhận. `totalVND` trống → `totalAmount` NULL. | Server tra `Services.priceVND` / `menu_vip_pricing` và tự tính |
| D2 | `src/lib/vipPricingEngine.ts:145-153` | `lookupPrice` trả 0 khi bảng giá thiếu key → đơn VIP 0đ lọt qua, `isReady` không kiểm giá > 0. | Fallback theo từng key; disable nút khi giá 0 |
| D3 | `handleStandardItems.ts:79` | `qty` không validate: 500 → 500 item; -1 → đơn không có item nhưng 200. | `Number.isInteger && 1..MAX` |
| D4 | 4 trang checkout + `lib/bookingCustomer.ts:18` | **Email không validate** → "Aa", "aa" vào `Customers.email` (đã có trong DB). Đổi tab Email/SĐT không xoá giá trị tab kia. | Regex email ở client và `realContact` |
| D5 | `CustomerInfo.tsx:158`, `bookingCustomer.ts` | SĐT nhận chữ ("+84abc") → tạo khách mới. DB đang có `+84sf`. | Chỉ giữ `\d`; server bắt `/^\+?\d{6,15}$/` |
| D6 | `MenuContext.tsx:325-343`, `lib/customerVisit.ts:40-42` | **Thông tin khách ca trước rò sang khách sau**: lưu localStorage mỗi phím gõ, chỉ xoá khi đặt thành công trên máy đã đăng ký. Khách bỏ dở hoặc máy chưa đăng ký → khách sau thấy tên/SĐT/email khách trước. Luồng booking không xoá `contactedFirstInfo` → `preBookingId` cũ gắn nhầm vào đơn khách khác. | `resetCustomerInfo` gọi `clearCustomerVisit()`; xoá sau mọi lần đặt; về `customer-type` thay vì menu |
| D7 | `MenuContext.tsx:91`, `CustomerInfo.tsx:218` | Giới tính mặc định ngầm "Male"; "Other" bị ép thành "Male" khi khôi phục. | Default rỗng + option chọn |
| D8 | `api/booking/vip-appointment/route.ts:228`, `services/booking.ts:59` | `createdAt` ghi giờ VN không múi giờ vào cột timestamp, nơi khác ghi UTC → lịch sử hiện lệch +7h. | `toISOString()` thống nhất |
| D9 | `api/staff/vip-available/route.ts:53`, `therapy-available/route.ts:53` | `today` theo UTC → 00:00–07:00 VN tra TurnQueue/nghỉ phép của hôm qua → KTV hiện sai trạng thái. | Dùng ngày VN như `check-availability:58` |
| D11 | `src/app/invoice/[id]/page.tsx:44-48` | `SystemConfigs.select('configValue').eq('configKey')` nhưng bảng là `key/value` → cấu hình hoá đơn admin không bao giờ áp, luôn in địa chỉ hard-code. | `.select('value').eq('key', …)` |
| D12 | `services/booking.ts` (`/api/booking`) | Menu lỗi → đơn rỗng `totalAmount 0` vẫn 200; không rollback; `dateCode` theo UTC không cutoff 8h; `created_at` sai tên cột; id item theo count dễ trùng PK. | Gom về logic của `/api/orders` + admin client |
| D13 | `vip-appointment/route.ts:349-376` | Insert items lỗi vẫn trả success; `selectedStaffIds` không phải mảng → Booking mồ côi. | Validate trước, rollback khi lỗi |
| D14 | `orders:51`, `bookings:76`, `vip-appointment:233`, `services/booking.ts:65` | **4 chỗ sinh `billCode` kiểu select-max rồi insert** → 2 máy cùng giây: máy 2 bị 409/500, khách phải bấm lại. | Một RPC/sequence cấp số trong DB |
| D15 | `useJourneyRealtime.ts:178`, `Journey.logic.ts:43` | Fallback `Bookings.timeStart` (timestamp không TZ, admin ghi UTC) parse theo giờ máy → timer lệch 7h ở nhánh fallback. | Thêm `Z` cho riêng nhánh này |
| D16 | `PaymentModal.tsx:111` | Luôn gửi `amountPaid: ''` → mọi đơn `amountPaid = 0`, dữ liệu thu tiền mặt vô nghĩa. | Bỏ trường hoặc thu đúng |

## 4. UX nghiêm trọng / cấu hình

| # | Vị trí | Vấn đề | Cách sửa |
|---|---|---|---|
| U1 | `MenuContext.tsx:84`, 4 trang checkout `router.push('/')` | Giỏ chỉ trong memory → F5/mất mạng/Back ở checkout mất đơn, văng về trang chọn ngôn ngữ không báo. Rebook không khôi phục được món nào vẫn đẩy vào checkout → văng. | Persist cart `sessionStorage`; cart rỗng → về menu kèm toast |
| U2 | `src/app/middleware.ts` | **Đặt sai thư mục nên không bao giờ chạy** (Next chỉ nhận `src/middleware.ts`). Redirect `/vn→/vi`, chặn locale lạ là code chết. | Dời sang `src/middleware.ts` (hoặc `src/proxy.ts` Next 16) |
| U3 | `next.config.mjs:3-8` | `ignoreBuildErrors` + `ignoreDuringBuilds` → lỗi kiểu lọt production. | Tắt `ignoreBuildErrors` |
| U4 | `public/sw.js:56-66` | SW cache mọi GET same-origin kể cả HTML journey/hoá đơn từng khách, không giới hạn → phình bộ nhớ tablet, offline hiện trang khách trước. | Chỉ cache `/_next/static`, assets |
| U5 | `CustomerRequestFAB.tsx:48-98` | Re-subscribe realtime **mỗi giây** suốt cooldown. | `requests` vào ref, deps `[realBookingId]` |
| U6 | `useJourneyRealtime.ts:308-413` | Subscribe 2 lần, refetch mỗi UPDATE, polling 5s song song realtime. | Giãn polling khi SUBSCRIBED |
| U7 | `Premium/index.tsx:54-113`, `DeepBody/index.tsx:71-107` | `useState` đọc URL/sessionStorage → hydration mismatch, flash UI mỗi lần vào `?tab=deep_body`. | Đọc trong `useEffect` |
| U8 | `auth/page.tsx:100`, `Auth/LoginGate.tsx:21-61`, `Journey/CheckBelongings.tsx:18` | Hard-code "Ngân Hà"; brand hiện là Oria. `OrderConfirmModal.tsx:21` fallback `oriaspa.com`. | Lấy từ SystemConfigs |
| U9 | `package.json` | `firebase`, `postgres` không dùng; 7 biến `NEXT_PUBLIC_FIREBASE_*` thừa. | Gỡ |
| U10 | `contacted-first/page.tsx:48-82` | Client anon đọc toàn bộ PreBookings hôm nay (SĐT đầy đủ) và insert trực tiếp, phụ thuộc RLS. | Chuyển qua API route |

## 5. Đã kiểm và KHÔNG thấy lỗi
Double submit (nút disable đúng), `useSearchParams` đã bọc Suspense ở 4 trang menu, truy cập `window/localStorage` đều trong effect/guard, dictionaries 5 ngôn ngữ đủ key, realtime channel/interval đều cleanup, `supabaseAdmin` chỉ import trong `api/*`, `customer/request` là mẫu auth + rate-limit đúng.

## 6. Thứ tự đề xuất
1. **Đợt 1 (bảo mật, 1 ngày):** S1, S2, S3, S4, S5 — cùng một mẫu: resolve đơn chỉ bằng `accessToken`, không nhận id thô.
2. **Đợt 2 (crash + dữ liệu sai thấy ngay):** C1, C2, D11, D9, U2.
3. **Đợt 3 (tiền):** D1, D2, D3, D14 (RPC cấp billCode).
4. **Đợt 4 (khách/UX):** D4, D5, D6, D7, U1, U4, U5.
5. Còn lại dọn dần.


> Ghi chú 04/10: mục D10 (lịch sử hiện mã KTV thay vì tên) đã gỡ — user xác nhận hiện mã nhân viên là đúng chủ ý.
