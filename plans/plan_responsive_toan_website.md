# Responsive toàn website WRB — plan, diff và prompt cho agent

## 1. Phạm vi và mốc code

Yêu cầu: nâng cấp responsive **toàn website trong repository này**, không chỉ popup Mix, không chỉ Deep Body. Mobile, tablet, desktop; portrait/landscape; nội dung dài; bàn phím ảo; zoom chữ; loading/error/empty state đều phải dùng được.

- Repository: `wrb-noi-bo-dev`.
- HEAD tại lúc lập tài liệu: `6bf8a4c`.
- Mốc trước nhóm thay đổi vừa thực hiện: `4376795`.
- Working tree sạch trước khi thêm tài liệu này: thay đổi đã được một luồng làm việc khác đưa vào commit mới. Không reset/revert commit và không áp lại diff cũ.
- [Diff thực tế 55 file giữa hai commit](./responsive_current_snapshot.diff.md). Snapshot bao gồm cả thay đổi Mix/carousel được commit đồng thời; không được đánh đồng tất cả là sửa responsive.
- Tài liệu này là kế hoạch hoàn thiện và nghiệm thu, **không phải xác nhận website đã đạt responsive toàn bộ**.
- Chỉ sửa repository hiện tại. Website quản trị/KTV trong repository khác không tự động nằm trong phạm vi.

Không đổi nghiệp vụ: chọn KTV theo ảnh gallery; therapy đang xem được truyền đúng vào bước tiếp theo; Mix 2–4 phương pháp theo skill; duration/giá/giỏ hàng/booking/payment giữ nguyên. Không đổi crop/fit NHP/NHT đã được tách riêng trong commit mới.

## 2. Hiện trạng đã xác minh

### 2.1 Đã có trong HEAD — không làm lại

| Nhóm | File/component | Thay đổi đã có |
|---|---|---|
| Nền dùng chung | `src/app/globals.css`, `layout.tsx` | Breakpoint xs; min-width cho con flex/grid; min-height vùng cuộn; panel/sheet giới hạn viewport; cho phép zoom |
| Menu Standard | Header, Footer, ServiceList, ServiceItem | Footer đưa vào flow, giá được wrap; danh mục cuộn ngang; vùng danh sách co được; thẻ dịch vụ xếp dọc trên mobile |
| Shell | Premium/index, Therapy/index, DeepBody/index | Co khung flex; header tránh ép chiều ngang; vùng nội dung cuộn |
| Drawer | Standard/Sheets, Premium và Therapy/VipCartStep | `dvh`, giới hạn rộng trên desktop, cuộn trên màn hình thấp |
| Booking | Premium/Therapy BookingConfig, SkillBuilder, TimeSlotPicker | CTA có đường thoát ở màn hình thấp; lịch co cột; bớt absolute gây đè nội dung |
| Deep Body | BookingConfig, CertificateModal, TechniqueGalleryModal | Lưới duration đổi breakpoint; giá tách dòng; modal giới hạn cao |
| Checkout | Header, Invoice, Payment/CustomRequest/OrderConfirmModal, ServiceOptionSelector | Header không dùng title absolute; invoice wrap; lựa chọn đổi số cột; modal dùng viewport động |
| Tùy chỉnh | CustomForYou/index, BodyMap | Body map xếp dọc mobile, hai cột tablet; header/footer gọn; vùng cuộn co được |
| Trang khác | auth, contacted-first, MenuTypeSelector | Login không khóa chiều cao; form khách hẹn trước cuộn; menu selector không ép height |
| Journey/Feedback | TipModal, AlertModal, BelongingsCheck, PostReviewScale, ServiceCountdownGauge | Panel cuộn; nhóm đánh giá wrap; đồng hồ co theo khung |
| Hóa đơn in | PrintableInvoice.tsx/module.css | Bảng cuộn ngang riêng, giữ đủ cột; reset khi in |
| Translator | FloatingTranslator | Khung chính giới hạn theo `dvh` |

### 2.2 Các khoảng trống cần xử lý tiếp

1. **CategoryPicker là trang vào mặc định**: `fixed inset-0`, phần lớn nội dung absolute; wheel scale theo `vh` nhưng kích thước node/center nhảy theo chiều rộng. Landscape dễ làm vòng quay, banner, lịch sử, marquee và cờ đè nhau. 5 cờ 56px + gap 12px đã chiếm 328px, chưa tính padding: không vừa màn 320px.
2. **Không dùng CSS global làm bằng chứng đã responsive**: rule `:where(.flex,.grid) > *` ảnh hưởng toàn app; phải kiểm tra icon/control shrink, giá, nhãn và carousel. Các vùng cố ý cuộn ngang phải giữ `shrink-0`/min-width riêng.
3. **Viewport/bàn phím**: `IOSViewportFix` vẫn dựa vào `window.innerHeight`. Chưa kiểm tra keyboard và zoom trên Safari thật. Không tự thay mọi height bằng visualViewport vì sẽ làm layout đổi khi pinch zoom.
4. **CTA nổi**: StaffSelector/ConfirmationScreen ở nhiều nhánh vẫn fixed; translator ở góc phải có thể che CTA checkout. Phải giải quyết khoảng trống và vị trí theo khung thực tế, không thêm một số `pb-32` dùng cho mọi trang.
5. **Popup chưa bao phủ hết**: group KTV/certificate trong Therapy; popup lịch sử; customer-type popup; popup Journey nội tuyến; calendar trong BookingTimePicker; từ điển translator. Không chỉ sửa các file tên `Modal`.
6. **DeepBody/BodyFocusAvoidMap** vẫn chia ngang 38–45% cho hình và checklist có cột control cố định; nhãn truncate trên mobile. Phải kiểm tra đủ tên vùng cơ thể và touch target.
7. **FlipTimePicker** có padding 64px + hai cột 96px + dấu `:`/gap: có thể vượt khung form nhỏ.
8. **Checkout có bốn route wrapper**: khách mới, khách cũ, booking, old-user booking. Component dùng chung đã sửa nhưng sticky sidebar/footer của từng wrapper phải kiểm tra riêng.
9. **Hóa đơn in**: phải test print preview sau khi thêm wrapper cuộn, không chỉ nhìn trên điện thoại.
10. Chưa có ma trận ảnh chụp và kết quả nghiệm thu đa viewport. Test logic thành công không chứng minh layout đúng.

## 3. Quy tắc triển khai

- CSS/Tailwind/native trước; không thêm thư viện responsive, không tạo bản mobile/desktop có logic riêng.
- Không dùng `overflow-x:hidden`, `scale()`, `zoom`, chữ cực nhỏ hoặc `truncate` để che lỗi layout.
- Một vùng cuộn chính cho mỗi màn; modal dài có vùng cuộn riêng. Khi header/footer không còn chỗ trên màn thấp, chuyển cả panel sang cuộn thay vì kẹp body về 0px.
- Footer trong flow nếu có thể; sticky chỉ khi vẫn còn đủ vùng đọc. Fixed phải có khoảng đệm được tính theo chiều cao thật.
- Bảng rộng cuộn trong wrapper, không kéo ngang cả document; không ẩn dữ liệu quan trọng để vừa khung.
- Flex/grid con phải co được. Giữ `shrink-0` cho nút đóng và control cần kích thước tối thiểu, không áp cứng lên mọi ảnh/icon.
- Chữ dịch dài phải wrap; giữ nhãn đầy đủ cho phương pháp, tổng tiền và hành động chính.
- Mobile không được đổi thứ tự nghiệp vụ. Tab, carousel, popover và nút checkout hoạt động như cũ.
- Safe area trên/dưới/trái/phải cho màn notch, đặc biệt landscape.
- Các nút chính đạt vùng chạm tối thiểu 44×44 CSS px. Không kéo giãn toàn bộ icon thành 44px; tăng vùng button/label khi cần.
- Không thay giá, service ID, giới hạn Mix, danh sách skill, API hoặc database trong task này.

## 4. Plan theo giai đoạn

### P0 — Chốt baseline và inventory

1. Đọc `AGENTS.md` nếu xuất hiện; kiểm tra HEAD/status mới nhất.
2. Ghi danh sách tất cả page/layout và UI component trong `src/app`, `src/components`.
3. Với mỗi component, đánh dấu: shared shell / content / overlay / fixed action / intentional horizontal scroll / printable.
4. Lần theo caller của các helper/CSS dùng chung. Liệt kê cả Premium và Therapy vì nhiều component là hai bản riêng, không giả định sửa một bản là đủ.
5. Lưu baseline ảnh desktop/mobile trước khi thay đổi thêm. Không test trực tiếp dữ liệu production bằng thao tác tạo đơn/thanh toán.

Đầu ra: inventory có cột file, route tiêu biểu, nguy cơ, trạng thái kiểm tra. Component không cần sửa phải ghi lý do, không sửa lấy số lượng file.

### P1 — Nền layout toàn app

- Audit lại rules trong globals; sửa đúng intrinsic sizing, không che tràn.
- Chốt viewport contract: trang nội dung dùng min-height; app menu dùng shell giới hạn cao + `min-h-0` + body cuộn.
- Kiểm tra zoom, keyboard, safe area. Nếu cần JS viewport, chỉ dùng cho trường hợp chứng minh CSS không đủ; cleanup listener, không làm hỏng pinch zoom.
- Kiểm tra stylesheet Tailwind sinh ra thực sự có `xs`, `calc`, `dvh` và media query mới.

Đầu ra: auth/menu/checkout/overlay không kẹt cuộn tại 320px và landscape 568×320.

### P2 — Entry, chọn menu và lịch sử

- CategoryPicker: giữ wheel trên khung đủ lớn; màn hẹp/thấp chuyển bố cục danh mục dễ chạm, dùng **cùng dữ liệu và handler**. Không tạo handler nghiệp vụ mới.
- Banner/history/cờ không absolute chồng nhau trên màn thấp. Nếu chuyển sang grid phải ẩn bản wheel khỏi accessibility tree, không để hai bộ nút cùng tab được.
- MenuTypeSelector: kiểm tra cả poster và label dài.
- customer-type/contacted-first/auth/history/register-device: kiểm tra form dài, nhập liệu, error, popup, CTA cuối trang.

Đầu ra: mọi đường vào menu có thể truy cập bằng touch và keyboard.

### P3 — Standard/Premium/Therapy/Deep Body

- Standard: header danh mục cuộn đến mục đầu/cuối được trên tablet; footer hiển thị đủ VND/USD, số lượng, back, ngôn ngữ, giỏ hàng.
- Thẻ dịch vụ: tên dài, giá dài, quantity controls không đè tên; badge bestseller không che nội dung.
- Staff gallery: test ảnh portrait/landscape, arrows, dots, tag therapy, certificate, Select Treatment; giữ semantics ảnh đang xem → KTV + therapy.
- Booking: lưới duration theo **chiều rộng vùng nội dung**, không chỉ viewport; không đổi rule filter duration.
- Body maps: mobile xếp dọc; tablet/desktop đủ rộng mới đặt hình cạnh checklist; giữ focus/avoid mutual exclusion.
- SkillBuilder/TimeSlotPicker/ConfirmationScreen/VipCartStep: kiểm tra cả Premium và Therapy.

Đầu ra: đi từ menu đến cart được ở mọi viewport trong ma trận, không phải gửi đơn để kiểm tra.

### P4 — Checkout, overlay, translator, Journey và invoice

- Kiểm tra bốn route checkout, tất cả form, VAT, payment, change denomination, confirmation, edit VIP.
- Kiểm tra overlay lồng nhau: đóng overlay trên cùng không làm trang nền kẹt cuộn; Escape/backdrop/nút đóng; focus không bị mất.
- Translator: toolbar mobile wrap; dictionary popup không vượt khung; input và nút gửi dùng được khi keyboard mở. FAB không che CTA chính.
- Journey: waiting/active/check belongings/feedback/error/confirm popup; test nội dung nhiều dịch vụ và rating label dài.
- Invoice: mobile scroll bảng, desktop đọc đầy đủ, print không cắt cột hoặc in thanh cuộn.

### P5 — Nghiệm thu và bàn giao

- Chạy TypeScript, regression tests, lint các file sửa; so sánh lỗi lint với baseline, không âm thầm bỏ qua.
- Chạy preview/build riêng nếu cần; không giết server do người dùng chạy. HEAD hiện có `NEXT_DIST_DIR` và ignore `.next-responsive` hỗ trợ preview tách biệt.
- Chụp ảnh ma trận và ghi kết quả cụ thể. Không có data/backend thì ghi BLOCKED cho luồng đó, không ghi PASS.
- Review diff để chắc chắn không thay business logic. Không commit/push/deploy nếu chưa được yêu cầu.

## 5. Diff đề xuất tiếp theo — chưa áp dụng

Đây là các hunks thiết kế dựa trên HEAD `6bf8a4c`. Agent phải kiểm tra context với HEAD mới nhất, không chạy `git apply` mù. Chỉ áp sau khi tái hiện đúng vấn đề. Các phần cần quyết định layout được mô tả rõ, không giả vờ là patch hoàn chỉnh.

### D1. FlipTimePicker: co hai cột trong khung form

File: `src/components/Booking/FlipTimePicker.tsx`.

```diff
- <div className="flex items-center gap-3 bg-[#1b1b1d]/80 rounded-2xl px-8 py-2 border border-[#4d463a]/30">
+ <div className="grid w-full max-w-sm grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 bg-[#1b1b1d]/80 rounded-2xl px-3 sm:px-6 py-2 border border-[#4d463a]/30">
- <div className="w-24">
+ <div className="min-w-0">
```

Đổi cả hai wrapper hours/minutes. Không đổi ITEM_HEIGHT, index scroll, snap, interval hay onChange. Test wheel vẫn chọn đúng 00/15/30/45 sau resize.

### D2. Deep Body BodyFocusAvoidMap: tránh checklist bị ép

File: `src/components/Menu/DeepBody/BodyFocusAvoidMap/index.tsx`.

```diff
- ... overflow-hidden flex flex-row items-stretch
+ ... overflow-hidden flex flex-col sm:flex-row items-stretch
- relative w-[38%] xs:w-[40%] sm:w-[42%] md:w-[45%] shrink-0 ...
+ relative w-full h-72 sm:h-auto sm:w-[38%] shrink-0 ...
- flex-1 flex flex-col justify-between p-2 sm:p-4 md:p-5 ... h-full overflow-hidden
+ flex-1 min-w-0 flex flex-col justify-between p-3 sm:p-4 ...
- grid-cols-[1fr_44px_44px] xs:grid-cols-[1fr_50px_50px] sm:grid-cols-[1fr_64px_64px] md:grid-cols-[1fr_76px_76px]
+ grid-cols-[minmax(0,1fr)_44px_44px] sm:grid-cols-[minmax(0,1fr)_48px_48px]
- <span className="truncate">{label}</span>
+ <span className="break-words leading-snug">{label}</span>
```

Áp cùng cấu trúc cột cho header và từng row. Bỏ `truncate` trên cha của label. Vùng bấm 44px cho focus/avoid; hình không bị kéo méo. Kiểm tra ở 320px, 768px và khi container nằm trong panel max-width.

### D3. Popup còn sót: dùng shared panel, không đổi state

Ví dụ chính xác trong `src/components/Menu/Therapy/StaffSelector/index.tsx`:

```diff
- className="relative w-full max-w-sm bg-[#131315] border border-[#e6c487]/30 rounded-[2rem] p-6 shadow-2xl overflow-hidden"
+ className="responsive-panel relative w-full max-w-sm bg-[#131315] border border-[#e6c487]/30 rounded-[2rem] p-4 sm:p-6 shadow-2xl"
- className="relative w-full max-w-lg bg-[#131315] border border-[#e6c487]/30 rounded-2xl overflow-hidden shadow-2xl"
+ className="responsive-panel relative w-full max-w-lg bg-[#131315] border border-[#e6c487]/30 rounded-2xl shadow-2xl"
```

Audit cùng pattern trong Premium/DeepBody grouping popup; CategoryPicker history popup; customer-type popup helper; history/page; Journey inline confirm/alert. Không thêm class vào backdrop thay vì panel. Nếu panel có absolute footer, phải đưa footer về flow ở màn thấp, không chỉ thêm overflow.

### D4. CategoryPicker: cần patch layout theo kết quả tái hiện

File: `src/components/Menu/Standard/CategoryPicker.tsx`.

```diff
- fixed inset-0 z-[100] flex flex-col ...
+ fixed inset-0 z-[100] overflow-y-auto ...
```

Chỉ hunk này **chưa đủ**, vì con absolute không tạo chiều cao flow. Agent phải:

1. Chia header actions / category content / language footer thành ba vùng có chiều cao nội dung.
2. Trên màn hẹp hoặc chiều cao thấp, category content dùng grid 2 cột; tái sử dụng `wheelCategories`, `handleSelect`, cùng nhãn/icon.
3. Vùng wheel hiện tại chỉ render/hiển thị trên khung đủ chỗ; giữ hiệu ứng hiện có ở desktop nếu không tràn.
4. Flags dùng grid 5 cột, `minmax(0,1fr)`, nút max 56px và max-width 100%; có padding bên; không ép tối thiểu 328px.
5. Marquee không đè flags/CTA. Không dùng cm để căn bottom theo viewport.
6. Chụp cả 320×568 và 844×390 để duyệt thay đổi này. Đây là thay đổi bố cục responsive, không đổi taxonomy/menu routing.

### D5. Fixed CTA và translator: ưu tiên không đè nhau

Files: StaffSelector/ConfirmationScreen các nhánh; BookingConfig; `FloatingTranslator.tsx`; bốn route checkout.

- Menu shell có thể dành một footer row trong flex, tương tự Standard đã sửa.
- Các CTA không nằm trong shell: dùng normal flow trên mobile/landscape nếu không cần luôn nổi; nếu phải fixed, đo chiều cao footer thật để dành chỗ (một cách dùng chung, không copy logic vào từng route).
- Translator FAB đặt ngoài vùng CTA chính hoặc dùng slot có khoảng trống rõ ràng. Không lấy `bottom: 96px` làm đáp án chung cho mọi trang.

Diff toolbar translator dự kiến:

```diff
- ... flex items-center justify-between shrink-0
+ ... flex flex-wrap items-center justify-between gap-2 shrink-0
```

Áp đúng header toolbar, không replace mọi flex row của transcript. Dictionary modal cần `responsive-panel`/max-height và close luôn tới được. Test keyboard thật trước khi thay viewport JS.

### D6. Safe area và short-screen fallback

Kiểm tra bổ sung safe-area-inline cho page shell/header/footer, tránh gắn padding ngang lên toàn `body` khiến overlay/ảnh full-bleed sai kích thước. Chỉ thêm tại container tương ứng.

`responsive-panel`/`responsive-sheet` hiện là CSS unlayered và có thể thắng utility cùng thuộc tính. Agent phải kiểm tra computed style trước khi thêm `max-h-*`; chọn một nguồn quyết định max-height, không chồng quy tắc không rõ ưu tiên.

Ở màn thấp, rule display:block hiện có thể làm icon mất căn giữa trong flex panel. Sửa component tương ứng hoặc dùng wrapper body, không chấp nhận lệch layout chỉ để có scrollbar.

### D7. Audit lại các thay đổi đã có

- BodyMap: checkbox toàn thân vẫn focus được bằng keyboard; tránh `hidden` làm control không truy cập được.
- PrintableInvoice: CSS mobile không được làm hỏng bản print; print vẫn đủ cột, không `display:none` đơn giá.
- Footer Standard: kiểm tra animation/position relative, giá VND/USD nhiều chữ số và language popup không mở ra ngoài viewport.
- Breakpoint `xs`: vừa được khai báo nên các class `xs:*` cũ nay có tác dụng; kiểm tra tất cả caller, không chỉ Deep Body.
- Global `overflow-wrap:anywhere`: không làm mã/ngày/giá khó đọc; áp nowrap chỉ cho token ngắn có khung đủ rộng, không cả hàng tiền.
- Không sử dụng thay đổi logic Mix/carousel trong snapshot làm template responsive.

## 6. Ma trận nghiệm thu bắt buộc

| Nhóm | CSS viewport tiêu biểu |
|---|---|
| Mobile nhỏ | 320×568, 360×640 |
| Mobile phổ biến | 390×844, 430×932 |
| Mobile landscape | 568×320, 844×390 |
| Tablet portrait | 768×1024, 820×1180 |
| Tablet landscape | 1024×768, 1180×820 |
| Desktop | 1280×720, 1440×900, 1920×1080 |

Test trên Chrome responsive mode; thêm Safari iPhone/iPad thật hoặc simulator cho safe area/keyboard. Test 200% zoom desktop và nội dung tiếng Việt/Anh/Nhật/Hàn/Trung. Không cần chụp mọi tổ hợp ngôn ngữ×viewport, nhưng phải chọn chuỗi dài nhất cho từng control quan trọng.

### Các luồng phải chạy

1. `/` → Standard CategoryPicker → các category → service → duration → custom-for-you → cart.
2. `/en/vip/menu?tab=journey` → KTV → cấu hình → cart.
3. `/en/vip/menu?tab=deep_body` → gallery tagged → chọn KTV/therapy → Mix 2/3/4 → duration → notes.
4. `/en/therapy/menu` → KTV → config → cart (nếu route vẫn được sử dụng).
5. Checkout tương ứng bốn wrapper: `/{lang}/{menuType}/checkout`, `/{lang}/old-user/{menuType}/checkout`, `/{lang}/booking/{menuType}/checkout`, `/{lang}/old-user/booking/{menuType}/checkout`.
6. auth/customer-type/select-menu/contacted-first/history/register-device; form mở keyboard, lỗi xác thực, popup.
7. Journey demo + fixture booking được phép: waiting/active/feedback/check belongings/confirm.
8. Invoice fixture và print preview; translator mở/thu/phóng/dictionary, không gửi nội dung khách thật.

### Điều kiện PASS

- Không có document horizontal overflow; ngoại lệ chỉ là wrapper bảng/carousel đã thiết kế để cuộn.
- Không che/cắt tên therapy, số tiền, nút đóng, áp dụng, checkout.
- Tới được mọi control bằng cuộn; không khóa cuộn sau mở/đóng modal nhiều lần.
- Keyboard không làm mất input đang nhập/nút đóng. Zoom không bị vô hiệu hóa.
- Resize/xoay không reset KTV, therapy, Mix, duration, notes, giỏ hàng.
- Chọn ảnh therapy đơn → therapy tương ứng; Mix → chọn 2–4 đúng skill; duration theo rule hiện có: 1–2 hiện toàn bộ duration hợp lệ từ DB; 3 từ 90 đến 180; 4 từ 120 đến 180. Không hardcode thêm service không có trong DB.
- Không tạo booking/charge thật trong QA. Bước submit cuối chỉ chạy trên test backend/fixture được cho phép.

## 7. Lệnh kiểm tra

```bash
git status --short
git log -3 --oneline
npx tsc --noEmit
npm run test:menu-photos
npm run test:carousel
npm run test:api-fallback
git diff --check
```

Preview tách biệt (nếu cổng trống):

```bash
NEXT_DIST_DIR=.next-responsive npm run dev -- --port 3002 --webpack
```

Không chạy hai Next processes chung distDir. Không kill server cổng 3000 của người dùng. Build cũng dùng distDir riêng khi dev server còn chạy; `ignoreBuildErrors` hiện có trong config không thay thế `tsc --noEmit`.

Với lint: chạy trên danh sách file thay đổi, lưu lỗi có sẵn và lỗi mới riêng. Không tắt rule hoặc thêm `any` chỉ để báo pass.

## 8. Prompt ready-to-paste cho agent

```text
TASK: Hoàn thiện RESPONSIVE TOÀN WEBSITE WRB, không chỉ popup Mix.

Đọc plans/plan_responsive_toan_website.md và
plans/responsive_current_snapshot.diff.md trước khi sửa.
Baseline tài liệu là 6bf8a4c; kiểm tra HEAD/status thực tế trước khi bắt đầu.
Snapshot là diff ĐÃ COMMIT, tuyệt đối không áp lại lên HEAD.

Phạm vi: mọi page/layout/UI component trong repo hiện tại: entry/auth/history/
contacted-first, Standard/Premium/Therapy/DeepBody, booking/cart/custom-for-you,
bốn checkout wrappers, modal/drawer/popover, translator, Journey/feedback,
invoice và print. Không tự mở rộng sang repo quản trị khác.

Làm P0→P5 trong tài liệu. Audit từng nhóm; component không cần sửa phải được
kiểm tra và ghi nhận, không sửa hàng loạt chỉ để tăng số file.
Ưu tiên CSS/layout dùng chung nhưng kiểm tra blast radius của global rules.
Không thêm dependency. Không dùng overflow hidden/scale/zoom/truncate để che lỗi.
Không đổi business logic, schema, API, giá, skill, duration, cart hoặc payment.
Giữ nguyên thay đổi mới về Mix/gallery và cách fit ảnh riêng NHP/NHT.

Tập trung các khoảng trống: CategoryPicker fixed+absolute/cờ ở 320px;
DeepBody BodyFocusAvoidMap; FlipTimePicker; các popup nội tuyến còn sót;
fixed CTA vs translator; keyboard/safe-area/zoom; print invoice.
Các diff D1–D7 là hướng sửa theo baseline, phải đối chiếu context và QA.

Kiểm tra 320/360/390/430, tablet 768/820/1024, desktop 1280/1440/1920,
landscape 568×320 và 844×390, zoom 200%, label dài đa ngôn ngữ.
Chụp screenshot có tên route+viewport; ghi PASS/FAIL/BLOCKED và lý do.
Test đóng/mở modal, scroll tới cuối, keyboard, resize không mất selection.
Không gửi booking, payment hoặc dữ liệu khách thật trong kiểm thử.

Chạy tsc, ba regression scripts, lint file sửa, diff --check và build phù hợp.
Giữ nguyên dirty worktree của người dùng; không reset, không commit/push/deploy
khi chưa được yêu cầu. Không dừng hoặc dùng chung distDir với dev server khác.

Bàn giao: inventory phạm vi đã rà; diff thực tế; ảnh/ma trận QA;
kết quả test; lỗi còn lại và giới hạn kiểm thử. Chưa đủ bằng chứng thì ghi
“chưa nghiệm thu”, không tuyên bố “responsive tất cả thiết bị”.
```

## 9. Trạng thái kiểm thử tại thời điểm bàn giao

- Trước đợt mở rộng: TypeScript và 45 checks logic đã pass; lint file sửa còn lỗi có sẵn. Không coi đó là kết quả cho mọi chỉnh sửa về sau.
- Chạy lại trên baseline `6bf8a4c` khi lập tài liệu: `tsc --noEmit` PASS; menu-photos 19, carousel 22, api-fallback 6 — tổng 47 checks PASS. Đây là kiểm tra TypeScript/logic, không thay thế kiểm thử responsive. Chưa chạy lại lint/build toàn bộ sau đợt mở rộng.
- Preview riêng cổng 3002 đã chạy và route Standard trả HTTP 200; chỉ quan sát bước render ban đầu trên desktop. Chưa có ma trận mobile/tablet/landscape hay print.
- Backend từng có lỗi DNS Supabase trong phiên preview. Không dùng trạng thái thiếu dữ liệu làm bằng chứng UI hoàn chỉnh.
- Preview do tôi tạo đã được dừng khi người dùng chuyển yêu cầu sang plan/diff. Không dừng server cổng 3000.
- Kết luận: **đã có nền sửa responsive trên nhiều nhóm component, nhưng chưa nghiệm thu toàn website**. Agent phải hoàn thiện P0–P5 và thu bằng chứng trước khi bàn giao bản hoàn tất.
