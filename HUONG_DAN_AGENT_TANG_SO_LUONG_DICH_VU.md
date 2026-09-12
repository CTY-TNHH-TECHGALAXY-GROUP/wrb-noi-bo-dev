# Hướng dẫn agent: cộng số lượng dịch vụ và chọn thêm option

## Mục tiêu

Bổ sung/hoàn thiện hành vi chọn dịch vụ trong menu Standard để khách có thể:

1. Chọn một option của dịch vụ (ví dụ 60/90/120 phút) và số lượng `qty`.
2. Khi dịch vụ đã có trong giỏ, tăng/giảm số lượng của **đúng option/tùy chỉnh đang có**.
3. Chọn thêm option khác của cùng nhóm dịch vụ mà không làm mất option đã chọn.
4. Giữ nguyên số lượng, giá, option và ghi chú đến giỏ hàng, checkout và `BookingItems`.

Không cần ưu tiên giao diện. Chỉ cần control `+`, `-`, số lượng, danh sách option đã chọn và action “thêm option khác” có thể thao tác rõ ràng. Thiết kế UI sau này có thể thay thế nhưng phải giữ nguyên contract/flow trong tài liệu này.

## Phạm vi và điểm vào hiện có

| Vai trò | File chính | Trạng thái hiện tại |
| --- | --- | --- |
| Nguồn dữ liệu giỏ | `src/components/Menu/MenuContext.tsx` | `CartItem` có `cartId`, `qty`, `options`; đã có hàm thêm/cập nhật/xóa. |
| Kiểu dữ liệu | `src/components/Menu/types.ts` | `CartItem` kế thừa `Service` và có `qty`; `ServiceOptions` chứa strength, therapist, body parts, notes, addon. |
| Card dịch vụ và nút nhanh | `src/components/Menu/Standard/ServiceItem.tsx`, `ServiceList.tsx` | Đã nhận `quantity`, `onQuickAdd`, `onQuickRemove`. |
| Sheet nhóm / option thời lượng | `src/components/Menu/Standard/Sheets/MainSheet.tsx` | Đã có mode `LIST` / `ADD`, chỉnh SL và “Add another option”. |
| Điều phối menu | `src/components/Menu/Standard/index.tsx` | Nơi phải giữ thống nhất quy tắc add, tăng/giảm, gộp nhóm và mở Custom For You. |
| Giỏ và checkout | `CartDrawer.tsx`, `src/app/[lang]/new-user/[menuType]/checkout/page.tsx` | Tổng tiền đã tính theo `price * qty`; gửi nguyên `cart` sang `/api/orders`. |
| Lưu đơn | `src/app/api/orders/handleStandardItems.ts` | Đã ghi `BookingItems.quantity = item.qty`, giữ `options`. |

Không đổi mô hình dữ liệu backend: `BookingItems.quantity` là nguồn số lượng khi đặt đơn.

## Quy tắc dữ liệu bắt buộc

### 1. `cartId` là đơn vị có thể cập nhật

`cartId` là ID của một dòng giỏ cụ thể; không dùng `service.id` để update/xóa vì cùng một dịch vụ có thể xuất hiện nhiều lần với option khác nhau.

```ts
type CartItem = Service & {
  cartId: string;
  qty: number;             // số nguyên dương
  options?: ServiceOptions;
}
```

`updateCartItem(cartId, nextQty)` phải xóa dòng khi `nextQty <= 0`. Đây là hành vi đã có trong `MenuContext.tsx`, không cần tạo nhánh xóa riêng ở UI.

### 2. Khi nào cộng cùng dòng, khi nào tạo dòng mới

So sánh theo khóa nhóm sau:

```ts
selectionKey = service.id + stableSerialize(options)
```

Trong đó `options` gồm các option nghiệp vụ của dịch vụ: `strength`, `therapist`, `bodyParts`, `notes` (sau khi loại cờ chỉ dùng ở UI nếu có). Hai dòng có cùng `selectionKey` được hiển thị/gộp thành một lựa chọn với tổng `qty`.

| Thao tác | Kết quả đúng |
| --- | --- |
| Bấm `+` ở một lựa chọn đã lưu | Cộng 1 vào cùng lựa chọn/cùng option. Có thể update `cartId` đại diện hoặc thêm instance mới cùng `options`, nhưng tổng nhóm phải tăng đúng 1. |
| Bấm `-` | Trừ 1 khỏi lựa chọn đang thao tác. Nếu tổng còn 0 thì xóa tất cả dòng thuộc lựa chọn đó và các add-on phụ thuộc. |
| Chọn thời lượng/option khác | Tạo lựa chọn mới, không đổi dòng option cũ. |
| Chọn cùng thời lượng nhưng Custom For You khác | Tạo lựa chọn mới, vì `options` khác nhau. |
| Bấm “thêm cùng tùy chỉnh” | Tạo/cộng đúng `selectionKey` của lựa chọn đó; tuyệt đối không mở modal custom và không dùng option rỗng. |

Không gộp hai option chỉ vì trùng `service.id`. Ví dụ massage 60 phút “KTV nữ” và massage 60 phút “KTV nam” là hai lựa chọn độc lập.

### 3. Add-on phòng riêng

Private room hiện là một `CartItem` riêng có:

```ts
options: { addonType: 'private-room', addonForCartId: parentCartId }
```

Khi giảm/xóa dịch vụ cha đến 0, phải xóa tất cả item có `addonForCartId === parentCartId`. Khi tăng số lượng dịch vụ cha, **không tự nhân số lượng phòng riêng** nếu nghiệp vụ chưa quy định “một phòng/một khách”; giữ 1 add-on cho mỗi lựa chọn cha như flow hiện tại. Nếu nghiệp vụ muốn tính phòng theo khách, phải xác nhận lại trước khi đổi quy tắc này.

## Flow cần triển khai

### A. Lần đầu chọn một dịch vụ

1. Khách mở nhóm dịch vụ.
2. Chọn một option (thời lượng/giá) và chỉnh `qty`, mặc định là 1, tối thiểu là 1.
3. Xác nhận.
4. Tạo số lượng item cần thiết với `qty` tương ứng, rồi mở `CustomForYouModal` một lần cho lượt thêm này, trừ dịch vụ có `SHOW_CUSTOM_FOR_YOU === false`.
5. Lưu custom cho toàn bộ item vừa tạo bằng danh sách `lastAddedCartIds`.
6. Nếu chọn phòng riêng, gắn add-on vào từng `parentCartId` theo dữ liệu ở mục trên.

Lý do không lưu custom trước: Custom For You hiện là bước sau khi chọn thời lượng/số lượng; agent không được để modal mở nhiều lần khi khách thêm `qty > 1`.

### B. Dịch vụ đã được chọn: xem danh sách lựa chọn

Khi mở lại cùng nhóm dịch vụ và nhóm có item trong cart, mặc định vào mode `LIST`:

```text
Nhóm dịch vụ
 ├─ 60 phút · KTV nữ · SL 2
 ├─ 90 phút · KTV ngẫu nhiên · SL 1
 └─ [Thêm option khác]
```

Tại mỗi dòng cần có hai thao tác logic:

- `+`/“thêm cùng tùy chỉnh”: cộng 1 vào đúng selection key, không hiển thị Custom For You.
- “Sửa”: mở mode `ADD`, nạp option/thời lượng và tổng SL của dòng đó; save cập nhật đúng nhóm lựa chọn.

Nút “Thêm option khác” chuyển sang mode `ADD`, đặt `qty = 1`, không được mang `options` của dòng cũ sang option mới.

### C. Tăng/giảm từ card nhanh ngoài menu

Card chỉ hiển thị **tổng số lượng theo `service.id`** làm badge. Khi dịch vụ có nhiều option/tùy chỉnh, nó không đủ ngữ cảnh để biết khách muốn cộng vào dòng nào.

Quy tắc an toàn:

1. Nếu chỉ tồn tại một selection key của `service.id`, `+` cộng vào selection đó và `-` trừ selection đó.
2. Nếu tồn tại từ hai selection key trở lên, click card (hoặc `+`) phải mở `MainSheet` mode `LIST` để khách chọn đúng option; không tự ý cộng vào dòng cuối cùng.
3. Khi chưa có service trong giỏ, `+` đi theo flow A.

Điều này thay thế hành vi rủi ro hiện tại trong `handleQuickAddService`/`handleQuickRemoveService`, vốn có thể lấy item cuối cùng theo `service.id` và vô tình đổi lựa chọn khác của khách.

## Hướng triển khai trong code

### MenuContext

Giữ API hiện tại tương thích. Nếu cần giảm lặp code, có thể thêm helper thuần (không phụ thuộc UI):

```ts
getCartSelectionKey(item: Pick<CartItem, 'id' | 'options'>): string
getSelectionTotal(cart: CartItem[], key: string): number
setSelectionQuantity(reference: CartItem, nextQty: number): void
```

`stableSerialize` phải cho kết quả ổn định với object lồng nhau; tránh `JSON.stringify` trực tiếp nếu thứ tự key option có thể thay đổi. Có thể chuẩn hóa object trước khi stringify hoặc dùng thư viện đã được chấp thuận trong dự án.

Không đưa `cartId`, `qty`, field hiển thị hay field UI tạm vào `selectionKey`.

### StandardMenu (`index.tsx`)

- Đặt toàn bộ quyết định “chọn selection nào” ở đây hoặc trong helper dùng chung; `ServiceItem` chỉ phát event.
- Sửa `handleQuickAddService` và `handleQuickRemoveService` theo flow C.
- `handleDuplicateCartItem` phải giữ nguyên `item.options` và không đóng/mở sai sheet.
- `handleSetCartGroupQuantity` chỉ cập nhật selection có cùng `selectionKey`; khi giảm về 0 phải cleanup private-room add-on của các `cartId` bị xóa.
- Tính `cartLookup` bằng tổng `qty` theo `service.id` chỉ để badge, không dùng lookup này để update một dòng.

### MainSheet

- `selectedCartGroups` phải group bằng cùng helper/key với `StandardMenu` và `CartDrawer`.
- Mode `LIST` hiển thị từng selection key, tổng `qty`, option tóm tắt và hành động thêm/sửa.
- Khi edit: giữ tham chiếu selection đang edit, lấy `qty` tổng của selection; save không làm thay đổi các selection khác.
- Khi thêm option mới: clear `editingCartItem`, `qty=1`, chọn option mặc định; dữ liệu custom bắt đầu rỗng.

### CartDrawer

- Tiếp tục group theo selection key để render một dòng cho cùng option.
- Nút `+`/`-` dùng cùng helper cập nhật selection, không chỉ `item.cartId` đại diện khi selection đang được tạo bởi nhiều instance.
- Tổng VND/USD vẫn tính trên `cart` gốc: `sum(price * qty)`, không tính trên mảng group nếu chưa quy đổi lại quantity.

### Checkout và API

Không gộp dữ liệu ở checkout theo `service.id`; gửi các `CartItem` cùng `options` để API ghi thành các dòng `BookingItems` tương ứng. Cần kiểm tra các hàm sau vẫn nhân theo `qty`:

- `src/app/[lang]/new-user/[menuType]/checkout/page.tsx`
- `src/app/api/orders/handleStandardItems.ts`
- `src/services/booking.ts`

## Tiêu chí nghiệm thu

- [ ] Chọn Massage 60 phút, SL 2; giỏ/checkout hiển thị SL 2, tổng giá bằng `giá 60 phút × 2`.
- [ ] Cùng nhóm chọn thêm Massage 90 phút, SL 1; có hai lựa chọn riêng, tổng bằng hai dòng.
- [ ] Hai lựa chọn cùng 60 phút nhưng KTV nam/nữ khác nhau; tăng một dòng không ảnh hưởng dòng kia.
- [ ] Từ card: chỉ có một lựa chọn thì `+/-` thay đổi đúng lựa chọn đó; có nhiều lựa chọn thì buộc chọn trong danh sách thay vì tự chọn “dòng cuối”.
- [ ] Thêm `qty=3` và custom một lần: cả ba item nhận đúng cùng option/note; không xuất hiện ba modal.
- [ ] Khi xóa lựa chọn cha cuối cùng, private-room add-on của đúng lựa chọn đó bị xóa; add-on của lựa chọn khác được giữ lại.
- [ ] Back từ checkout về menu vẫn thấy SL/option đúng; submit đơn ghi `BookingItems.quantity` đúng số lượng và `options` không mất.
- [ ] VIP cart (`itemType === 'vip'`) không bị ảnh hưởng bởi logic Standard.

## Kiểm tra kỹ thuật trước khi bàn giao

1. Chạy `npm run lint`.
2. Chạy `npm run build` nếu môi trường có cấu hình Supabase/env đầy đủ.
3. Kiểm thử tay toàn bộ checklist trên ở menu Standard và checkout; ít nhất với một service có nhiều thời lượng, custom option và private room.
4. Không refactor toàn bộ giỏ/VIP chỉ để làm tính năng này. Thay đổi cần giới hạn ở contract selection key và các điểm vào nêu trên.

## Ngoài phạm vi

- Thiết kế visual/animation/pixel-perfect.
- Quy tắc tồn kho, giới hạn số khách hoặc đồng bộ real-time.
- Thay đổi schema Supabase.
- Thay đổi cách tính số lượng VIP (mỗi KTV VIP hiện là một item riêng).

