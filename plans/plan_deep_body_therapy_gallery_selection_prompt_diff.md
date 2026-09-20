# PROMPT + PLAN + DIFF CHI TIẾT — KTV THERAPY GALLERY CHỌN NHÂN VIÊN THEO ẢNH

> Tài liệu bàn giao cho agent tiếp theo. Phải đọc hết trước khi sửa code.
> Mục tiêu là sửa đúng codebase và đúng UX đã chốt; không tự thiết kế lại flow.

---

## 1. PROMPT BẮT BUỘC CHO AGENT

Hãy triển khai nâng cấp Deep Body / Therapy Menu trong repo hiện tại theo đúng các quy tắc sau:

1. Màn hình hiện tại có các **thẻ KTV** được lọc bằng `Staff.is_active_therapy_menu = true`.
2. Bên trong mỗi thẻ KTV có carousel nhiều ảnh. Mỗi ảnh therapy phải đi kèm metadata phương pháp trị liệu.
3. Người dùng vuốt carousel để đưa ảnh mong muốn ra trước, sau đó **bấm thẻ để chọn nhân viên**.
4. Không được biến carousel thành danh sách nút chọn phương pháp. Hành động chính vẫn là chọn KTV.
5. Khi chọn KTV, hệ thống đọc metadata của **ảnh đang hiển thị**:
   - Ảnh Body dầu → chọn KTV và preselect `coconutOil`.
   - Ảnh Thái → chọn KTV và preselect `thaiTherapy`.
   - Ảnh bấm huyệt → chọn KTV và preselect `shiatsu`.
   - Ảnh đá nóng → chọn KTV và preselect `hotStone`.
   - Ảnh Mix → chọn KTV, sau đó mở popover để khách tự chọn từ 2 đến 4 phương pháp.
6. Vuốt, bấm mũi tên hoặc pagination dot chỉ đổi ảnh, tuyệt đối không được làm chọn/bỏ chọn KTV.
7. Mix phải lưu danh sách ID thật, ví dụ `['coconutOil', 'hotStone']`; không lưu `mixofourtherapies` như một kỹ thuật giả.
8. Sau khi xác nhận KTV, màn `BookingConfig` nhận danh sách phương pháp preselect. Khách không phải chọn lại phương pháp mà họ đã chọn thông qua ảnh KTV.
9. Duration phải lấy mã, thời gian và giá trực tiếp từ `Services`, không dựng mã dịch vụ bằng chuỗi:
   - 1–2 phương pháp: 70, 90, 120, 150, 180 phút.
   - 3 phương pháp: 90, 120, 150, 180 phút.
   - 4 phương pháp: 120, 150, 180 phút.
10. Dùng NHT0002–NHT0006. Không tự động đưa NHT0001/60 phút vào UI vì yêu cầu hiện tại là mở rộng từ 70–120 lên 150–180.
11. Giữ nguyên flow chọn 1–2 KTV, `FOUR_HAND` / `SEPARATE`, cart, checkout, invoice và booking hiện có.
12. Không thêm dependency, không tạo table mới, không tạo abstraction không cần thiết.
13. Repo đang có nhiều thay đổi chưa commit của người dùng/agent trước. Phải bảo toàn các thay đổi không liên quan; không reset/checkout file.
14. Hai write API ảnh mới chưa có authentication không được ship công khai. Nếu không có caller trong repo này thì xóa; nếu buộc giữ thì phải dùng cơ chế auth/admin đã có trong codebase, không tự chế auth mới.

---

## 2. KHÔNG ĐƯỢC HIỂU SAI UX

### Sai

- Bấm trực tiếp vào ảnh hoặc icon phương pháp để chọn therapy như một danh sách service.
- Tự chuyển sang `BookingConfig` ngay sau khi vuốt ảnh.
- Dùng mỗi carousel image như một nút therapy độc lập.
- Tự coi hai KTV đang hiện hai ảnh khác nhau là một combo mix.

### Đúng

```text
Vuốt carousel đến ảnh mong muốn
                  ↓
Bấm thẻ KTV để chọn NHÂN VIÊN
                  ↓
Hệ thống đọc therapy metadata của ảnh đang hiển thị
                  ↓
Single: ghi nhận therapy       Mix: mở popover chọn 2–4 therapy
                  ↓
Xác nhận KTV → BookingConfig đã có preselectedTechniqueIds
```

Phương pháp thuộc booking hiện tại, không tự sinh thành hai booking therapy khác nhau chỉ vì chọn hai KTV.

Khi KTV đầu tiên đã xác lập therapy cho booking, việc chọn KTV thứ hai không được âm thầm ghi đè therapy. Chỉ kiểm tra KTV thứ hai có skills phù hợp. Muốn đổi therapy thì bỏ chọn KTV và chọn lại từ ảnh mong muốn.

---

## 3. HIỆN TRẠNG CODEBASE ĐÃ KIỂM CHỨNG

### 3.1 Git/worktree

Nhánh hiện tại: `feat/deep-body-treatment`.

Worktree đang dirty. Các file Deep Body/API/gallery đã có thay đổi chưa commit. Không được xóa thay đổi hợp lệ của agent trước khi chưa đối chiếu.

`npx tsc --noEmit` hiện đang pass.

### 3.2 Staff therapy API

File: `src/app/api/staff/therapy-available/route.ts`

API đang lọc đúng:

```ts
.eq('status', 'ĐANG LÀM')
.eq('is_active_therapy_menu', true)
```

DB live hiện **không có** cột `Staff.gallery_urls`. Query cột này trả lỗi `column Staff.gallery_urls does not exist`.

Ảnh hiện có tại:

- `Staff.feature_flags.gallery_urls`
- `Staff.feature_flags.photos`
- `SystemConfigs.deep_body_therapist_photos`

Config live hiện tại chỉ có key legacy `deep_body_therapist_photos`, shape:

```ts
Record<string, string[]>
```

Cả 5 KTV01–KTV05 đều có gallery URL, nhưng chưa có metadata therapy trên từng ảnh.

### 3.3 Skills live

KTV01–KTV05 hiện đều có:

```ts
{
  oilBody: true,
  thaiBody: true,
  shiatsuBody: true,
  hotStoneBody: true,
  bodyMix: true
}
```

Mapping bắt buộc:

```ts
const DEEP_BODY_SKILL_KEY = {
  coconutOil: 'oilBody',
  thaiTherapy: 'thaiBody',
  shiatsu: 'shiatsuBody',
  hotStone: 'hotStoneBody',
} as const;
```

### 3.4 Dịch vụ live trong `Services`

| ID | duration | priceVND | priceUSD | isActive |
|---|---:|---:|---:|---|
| NHT0001 | 60 | 720000 | 29 | false |
| NHT0002 | 70 | 840000 | 35 | false |
| NHT0003 | 90 | 1080000 | 43 | false |
| NHT0004 | 120 | 1440000 | 58 | false |
| NHT0005 | 150 | 1800000 | 72 | false |
| NHT0006 | 180 | 2160000 | 86 | false |

`src/services/menu.ts` lấy toàn bộ `Services`, không lọc `isActive`, nên Deep Body có thể dùng NHT0002–NHT0006 dù các record này đang ẩn khỏi menu thường.

### 3.5 Logic UI hiện tại

- `StaffSelector/index.tsx` chọn KTV bằng `onClick={() => handleToggle(staff.id)}` trên card.
- `StaffImageCarousel.tsx` chỉ nhận `images: string[]`; component cha không biết active image hiện tại.
- `hasMovedRef` trong carousel đang được set nhưng chưa dùng để chặn click sau swipe.
- `BookingConfig/index.tsx` đang hard-code `[70, 90, 120]`.
- `handleToggleTechnique` đang là radio selection: `setSelectedTechniqueIds([id])`.
- `mixofourtherapies` đang tồn tại như technique thứ năm trong config live. Không được dùng ID này để tính số therapy sau khi nâng cấp.
- Luồng order/cart đã truyền `serviceId` rõ ràng và backend chấp nhận NHT ID động; không cần viết luồng order mới.

### 3.6 Vấn đề security trong phần agent trước

Hai route untracked sau dùng Supabase Admin để ghi/xóa dữ liệu nhưng không kiểm tra auth:

- `src/app/api/config/deep-body-photos/route.ts`
- `src/app/api/staff/[staffId]/photos/route.ts`

Không ship write endpoint public. Cách nhỏ nhất là xóa hai route này nếu không có caller. Dự án quản trị KTV là nơi upload/tag ảnh; repo này chỉ cần read.

---

## 4. DATA CONTRACT CẦN TRIỂN KHAI

Không thêm table/cột. Dùng `SystemConfigs.nht_therapist_photos` là canonical key mới, vẫn fallback `deep_body_therapist_photos` trong giai đoạn chuyển đổi.

```ts
export const DEEP_BODY_BASE_TECHNIQUE_IDS = [
  'coconutOil',
  'thaiTherapy',
  'shiatsu',
  'hotStone',
] as const;

export type DeepBodyBaseTechniqueId =
  (typeof DEEP_BODY_BASE_TECHNIQUE_IDS)[number];

export type TherapyGalleryItem =
  | {
      url: string;
      kind: 'therapy';
      therapyId: DeepBodyBaseTechniqueId;
    }
  | {
      url: string;
      kind: 'mix';
    };

export type TherapyGalleryConfig = {
  version: 2;
  staff: Record<string, TherapyGalleryItem[]>;
};
```

Ví dụ DB:

```json
{
  "version": 2,
  "staff": {
    "KTV01": [
      {
        "url": "https://.../ktv01-oil.jpg",
        "kind": "therapy",
        "therapyId": "coconutOil"
      },
      {
        "url": "https://.../ktv01-hot-stone.jpg",
        "kind": "therapy",
        "therapyId": "hotStone"
      },
      {
        "url": "https://.../ktv01-mix.jpg",
        "kind": "mix"
      }
    ]
  }
}
```

### Tương thích ngược

Config cũ là `Record<staffId, string[]>`. Parser phải chịu được config cũ trong lúc chuyển đổi, nhưng URL cũ không có metadata thì không được đoán therapy theo thứ tự file/tên file.

Cách xử lý an toàn:

- Vẫn hiển thị legacy URL.
- Legacy URL không xác lập therapy.
- Khi card đang ở legacy image chưa tag, cho chọn KTV như cũ và để `BookingConfig` yêu cầu chọn therapy.
- Sau khi dự án quản trị migrate/tag đủ ảnh, flow auto-preselect hoạt động toàn bộ.

Không được gán mặc định URL thứ 1 = dầu, URL thứ 2 = Thái... vì dữ liệu thực tế không bảo đảm thứ tự.

---

## 5. LOGIC CHỌN KTV VÀ THERAPY

### 5.1 State tại `StaffSelector`

Thêm tối thiểu:

```ts
const [activeGalleryByStaff, setActiveGalleryByStaff] = useState<
  Record<string, TherapyGalleryItem | null>
>({});

const [selectedTechniqueIds, setSelectedTechniqueIds] = useState<
  DeepBodyBaseTechniqueId[]
>([]);

const [mixStaffId, setMixStaffId] = useState<string | null>(null);
```

`activeGalleryByStaff[staff.id]` phải được cập nhật mỗi khi carousel của card đó đổi index.

### 5.2 Khi bấm card KTV

Pseudo-code bắt buộc:

```ts
const handleToggle = (staff: VipStaffInfo) => {
  if (isUnavailable(staff)) return;

  if (selectedIds.includes(staff.id)) {
    removeStaff(staff.id);
    if (selectedIds.length === 1) setSelectedTechniqueIds([]);
    return;
  }

  const activeItem = activeGalleryByStaff[staff.id]
    ?? staff.therapyGallery?.[0]
    ?? null;

  if (selectedIds.length === 0) {
    if (activeItem?.kind === 'therapy') {
      setSelectedTechniqueIds([activeItem.therapyId]);
    } else if (activeItem?.kind === 'mix') {
      setMixStaffId(staff.id);
    }
  } else {
    // KTV thứ hai không ghi đè therapy của booking.
    // Chỉ validate selectedTechniqueIds với staff.skills.
  }

  addStaff(staff.id);
};
```

Khi chọn KTV thứ hai:

```ts
const unsupported = selectedTechniqueIds.filter(
  (therapyId) => !staffHasDeepBodyTechnique(staff.skills, therapyId)
);

if (unsupported.length > 0) {
  // Không add KTV; hiển thị thông báo i18n ngắn gọn.
  return;
}
```

Hiện live data tất cả KTV đều có đủ skill, nhưng guard này phải có để không tạo booking sai sau này.

### 5.3 Mix popover

- Chỉ mở sau khi khách bấm chọn KTV lúc ảnh active có `kind: 'mix'`.
- Hiển thị bốn base techniques, không hiển thị `mixofourtherapies`.
- Min 2, max 4.
- Chỉ cho tick technique mà KTV có skill.
- `Apply`: lưu ID thật và đóng popover.
- `Cancel`, click backdrop hoặc close khi chưa Apply: hủy lựa chọn KTV vừa thêm và không thay đổi therapy trước đó.
- Nút Apply disabled khi chưa đủ 2 technique.

### 5.4 Callback sang parent

Đổi callback thành:

```ts
onConfirmSelection: (
  selectedStaffIds: string[],
  staffInfoList: VipStaffInfo[],
  groupingMode: 'FOUR_HAND' | 'SEPARATE' | null | undefined,
  techniqueIds: DeepBodyBaseTechniqueId[]
) => void;
```

`handleConfirm` và `handleGroupingConfirm` đều phải truyền `selectedTechniqueIds`.

---

## 6. DURATION VÀ SERVICE TỪ DB

### 6.1 Nguồn dữ liệu

Trong `BookingConfig`, dùng `services` từ `useMenuData()`:

```ts
const deepBodyServices = useMemo(
  () => services
    .filter((service) => [
      'NHT0002',
      'NHT0003',
      'NHT0004',
      'NHT0005',
      'NHT0006',
    ].includes(service.id))
    .sort((a, b) => a.timeValue - b.timeValue),
  [services]
);
```

Không filter theo `ACTIVE`, vì các NHT record đang `isActive = false` nhưng vẫn là pricing source của Deep Body.

### 6.2 Rule

```ts
export const getDeepBodyMinDuration = (techniqueCount: number) => {
  if (techniqueCount >= 4) return 120;
  if (techniqueCount === 3) return 90;
  return 70;
};
```

```ts
const availableServices = deepBodyServices.filter(
  (service) => service.timeValue >= getDeepBodyMinDuration(selectedTechniqueIds.length)
);
```

Kết quả bắt buộc:

| technique count | service IDs | durations |
|---:|---|---|
| 1 | NHT0002–NHT0006 | 70, 90, 120, 150, 180 |
| 2 | NHT0002–NHT0006 | 70, 90, 120, 150, 180 |
| 3 | NHT0003–NHT0006 | 90, 120, 150, 180 |
| 4 | NHT0004–NHT0006 | 120, 150, 180 |

### 6.3 Selected duration

- Không hard-code default sai khi `services` chưa load.
- Khi available list có data:
  - Giữ selected service nếu nó vẫn hợp lệ.
  - Nếu không hợp lệ, chọn service đầu tiên trong available list.
- `currentService` là chính object `Service` từ DB.
- Cart/order nhận:

```ts
{
  serviceId: currentService.id,
  totalDuration: currentService.timeValue,
  totalPrice: adjustedVnd,
  totalPriceUSD: adjustedUsd,
}
```

Giữ logic multiplier `FOUR_HAND` hiện có: chỉ nhân 1.5 khi `staffGroupingMode === 'FOUR_HAND'` và có hơn một KTV.

Fallback constants chỉ dùng khi DB/API thực sự không trả service. Nếu giữ fallback, phải bổ sung NHT0005/150 và NHT0006/180 với giá live đã liệt kê ở trên.

---

## 7. DIFF CHI TIẾT THEO FILE

Phần này là diff định hướng. Agent phải đối chiếu code thực tế trước khi apply, không copy mù.

### 7.1 `src/lib/deepBody.constants.ts`

```diff
+ export const DEEP_BODY_BASE_TECHNIQUE_IDS = [
+   'coconutOil',
+   'thaiTherapy',
+   'shiatsu',
+   'hotStone',
+ ] as const;
+
+ export type DeepBodyBaseTechniqueId =
+   (typeof DEEP_BODY_BASE_TECHNIQUE_IDS)[number];
+
+ export const DEEP_BODY_SKILL_KEY: Record<DeepBodyBaseTechniqueId, string> = {
+   coconutOil: 'oilBody',
+   thaiTherapy: 'thaiBody',
+   shiatsu: 'shiatsuBody',
+   hotStone: 'hotStoneBody',
+ };
+
+ export const getDeepBodyMinDuration = (count: number) =>
+   count >= 4 ? 120 : count === 3 ? 90 : 70;

 export const DEEP_BODY_DURATION_SERVICES = {
   70:  { serviceId: 'NHT0002', ... },
   90:  { serviceId: 'NHT0003', ... },
   120: { serviceId: 'NHT0004', ... },
+  150: { serviceId: 'NHT0005', defaultPriceVND: 1800000, defaultPriceUSD: 72 },
+  180: { serviceId: 'NHT0006', defaultPriceVND: 2160000, defaultPriceUSD: 86 },
 };
```

Giữ `mixofourtherapies` trong data config để tương thích hiển thị cũ nếu cần, nhưng loại nó khỏi `baseMethods` và không được lưu vào selection mới.

### 7.2 `src/lib/menuPhotos.helper.ts`

```diff
+ export type TherapyGalleryItem =
+   | { url: string; kind: 'therapy'; therapyId: DeepBodyBaseTechniqueId }
+   | { url: string; kind: 'mix' };
+
+ export function normalizeTherapyGallery(
+   value: unknown
+ ): Array<TherapyGalleryItem | { url: string; kind: 'legacy' }> {
+   // Accept version 2 object and old string[].
+   // Validate URL string, kind and therapyId.
+   // Ignore malformed records.
+   // Do not infer therapy from URL/index.
+ }
```

Giữ `resolveMenuPhotos` cho NHP. NHT có thể dùng cùng helper nhưng phải trả thêm `therapyGallery`; không phá shape NHP.

### 7.3 `src/lib/vipStaffUtils.ts`

```diff
 export interface VipStaffInfo {
   ...
   galleryUrls?: string[];
+  therapyGallery?: TherapyGalleryItem[];
 }
```

Nếu cần legacy item cho thời gian migrate, type field nên chịu union local rõ ràng; không dùng `any`.

### 7.4 `src/app/api/staff/therapy-available/route.ts`

```diff
- .select('..., certificate_url, gallery_urls')
+ .select('..., certificate_url')
```

Lý do: live DB không có `Staff.gallery_urls`; không nên cố tình gọi một query sẽ fail rồi mới fallback trong mỗi request.

Fetch config:

```diff
  .in('key', [
    'nht_therapist_photos',
    'deep_body_therapist_photos',
  ])
```

Resolve:

```diff
+ const therapyGallery = resolveTherapyGalleryForStaff({
+   staffId: s.id,
+   nhtConfig: nhtConfigValue,
+   legacyConfig: deepBodyConfigValue,
+   featureFlags: s.feature_flags,
+ });

  return {
    ...,
+   therapyGallery,
    galleryUrls: therapyGallery.map((item) => item.url),
  };
```

Thứ tự source cho NHT:

1. `nht_therapist_photos` version 2 nếu hợp lệ.
2. `deep_body_therapist_photos` legacy.
3. `feature_flags.gallery_urls` / `feature_flags.photos`.
4. Avatar chỉ fallback khi không có gallery.

### 7.5 `src/components/Menu/DeepBody/StaffSelector/StaffImageCarousel.tsx`

```diff
 interface StaffImageCarouselProps {
-  images: string[];
+  items: TherapyGalleryItem[];
   staffId: string;
   staffName: string;
+  onActiveItemChange: (item: TherapyGalleryItem | null) => void;
 }
```

Khi index thay đổi:

```diff
+ useEffect(() => {
+   onActiveItemChange(items[currentIndex] ?? null);
+ }, [currentIndex, items, onActiveItemChange]);
```

Render:

```diff
- images.map((imgUrl, idx) => <img src={imgUrl} ... />)
+ items.map((item, idx) => <img src={item.url} ... />)
```

Chặn click sau swipe/drag:

```diff
+ const suppressClickRef = useRef(false);

  if (Math.abs(diffX) > 40) {
+   suppressClickRef.current = true;
    e.stopPropagation();
    ...
  }

+ const handleClickCapture = (e: React.MouseEvent) => {
+   if (!suppressClickRef.current) return;
+   e.preventDefault();
+   e.stopPropagation();
+   suppressClickRef.current = false;
+ };
```

Mũi tên và dot phải `preventDefault()` + `stopPropagation()`.

Không đặt `onClick={() => selectTherapy(...)}` trên `img`.

### 7.6 `src/components/Menu/DeepBody/StaffSelector/index.tsx`

Callback:

```diff
 onConfirmSelection: (
   selectedStaffIds: string[],
   staffInfoList: VipStaffInfo[],
-  groupingMode?: 'FOUR_HAND' | 'SEPARATE' | null
+  groupingMode: 'FOUR_HAND' | 'SEPARATE' | null | undefined,
+  techniqueIds: DeepBodyBaseTechniqueId[]
 ) => void;
```

Carousel:

```diff
 <StaffImageCarousel
-  images={...}
+  items={staff.therapyGallery ?? []}
   staffId={staff.id}
   staffName={staff.fullName}
+  onActiveItemChange={(item) => {
+    setActiveGalleryByStaff((current) => ({
+      ...current,
+      [staff.id]: item,
+    }));
+  }}
 />
```

Card:

```diff
- onClick={() => handleToggle(staff.id)}
+ onClick={() => handleToggle(staff)}
```

Thêm mix popover trong chính feature folder, không thêm UI library. Có thể là component nhỏ `MixTechniquePopover.tsx` nếu JSX làm `StaffSelector` quá dài; không tạo framework modal chung.

Khi confirm:

```diff
- onConfirmSelection(selectedIds, selectedStaff, mode)
+ onConfirmSelection(selectedIds, selectedStaff, mode, selectedTechniqueIds)
```

### 7.7 `src/components/Menu/DeepBody/index.tsx`

State:

```diff
+ const [selectedTechniqueIds, setSelectedTechniqueIds] =
+   useState<DeepBodyBaseTechniqueId[]>(() => readSessionValue(...));
```

Callback:

```diff
- onConfirmSelection={(ids, staffInfoList, mode) => {
+ onConfirmSelection={(ids, staffInfoList, mode, techniqueIds) => {
    setSelectedStaffIds(ids);
    setSelectedStaffInfoList(staffInfoList);
    setStaffGroupingMode(mode || null);
+   setSelectedTechniqueIds(techniqueIds);
    ...
+   sessionStorage.setItem(
+     'deep_body_selected_technique_ids',
+     JSON.stringify(techniqueIds)
+   );
  }}
```

Booking config:

```diff
 <DeepBookingConfig
   ...
+  initialTechniqueIds={selectedTechniqueIds}
 />
```

Phải clear `deep_body_selected_technique_ids` ở cùng mọi nhánh đang clear staff/grouping state: back, add another, confirm order và regular visit. Giữ nó khi switch language giống staff selection.

### 7.8 `src/components/Menu/DeepBody/BookingConfig/index.tsx`

Props/state:

```diff
 interface DeepBookingConfigProps {
   ...
+  initialTechniqueIds?: DeepBodyBaseTechniqueId[];
 }

- const [selectedTechniqueIds, setSelectedTechniqueIds] =
-   useState<string[]>([methodsList[0].id]);
+ const [selectedTechniqueIds, setSelectedTechniqueIds] =
+   useState<DeepBodyBaseTechniqueId[]>(initialTechniqueIds ?? []);
```

Methods hiển thị:

```diff
+ const baseMethods = methodsList.filter((method) =>
+   DEEP_BODY_BASE_TECHNIQUE_IDS.includes(
+     method.id as DeepBodyBaseTechniqueId
+   )
+ );
```

Không dùng `mixofourtherapies` như selected technique. Nếu card mix cũ vẫn được hiển thị vì business muốn giữ, click card đó phải mở cùng mix popover chứ không set ID mix.

Duration:

```diff
- const AVAILABLE_DURATIONS: VipDuration[] = [70, 90, 120];
- const getServiceInfo = (dur: number) => { ...build targetServiceId... };
+ const deepBodyServices = useMemo(...NHT0002 through NHT0006..., [services]);
+ const minDuration = getDeepBodyMinDuration(selectedTechniqueIds.length);
+ const availableServices = useMemo(
+   () => deepBodyServices.filter((s) => s.timeValue >= minDuration),
+   [deepBodyServices, minDuration]
+ );
+ const currentService = availableServices.find(
+   (s) => s.id === selectedServiceId
+ ) ?? availableServices[0];
```

Render duration cards bằng `availableServices.map(service => ...)`, key `service.id`, hiển `service.timeValue`, giá từ service sau khi áp dụng multiplier Four Hands.

### 7.9 `src/components/Menu/DeepBody/DeepBody.i18n.ts`

Thêm tối thiểu chuỗi cho 5 ngôn ngữ hiện có:

- Tiêu đề popover mix.
- Hướng dẫn chọn 2–4 phương pháp.
- Apply / Cancel.
- Cảnh báo chưa đủ 2 phương pháp.
- Cảnh báo KTV thứ hai không hỗ trợ selected therapy.

Không hard-code text tiếng Việt trong component.

### 7.10 Hai API write ảnh

```diff
- src/app/api/config/deep-body-photos/route.ts
- src/app/api/staff/[staffId]/photos/route.ts
```

Xóa nếu `rg` xác nhận không có caller và chúng chỉ là code untracked của agent trước. Không để POST/DELETE Supabase Admin không auth.

---

## 8. DỮ LIỆU ADMIN / MIGRATION

Repo này không nên tự cung cấp public upload API. Dự án `Quan_Tri_Va_KTV` cần ghi config version 2.

Thứ tự migrate an toàn:

1. Đọc `deep_body_therapist_photos` cũ.
2. Admin hiển thị từng ảnh cũ cho người quản trị tag `therapyId` hoặc `mix`.
3. Ghi config đã tag sang `nht_therapist_photos` version 2.
4. WRB ưu tiên key mới, fallback key cũ.
5. Chỉ xóa key cũ sau khi xác nhận tất cả KTV đã có gallery version 2.

Không migrate tự động dựa trên thứ tự URL vì không có bằng chứng mapping.

---

## 9. TEST TỐI THIỂU BẮT BUỘC

Không cần thêm test framework. Dùng test setup đã có hoặc một file test nhỏ chạy được bằng tool hiện có.

### Unit/data tests

1. Parse gallery version 2 đúng `therapyId`/`mix`.
2. Legacy `string[]` vẫn hiển thị và không tự suy diễn therapy.
3. Record sai `kind`, URL rỗng hoặc therapy ID lạ bị loại.
4. Duration matrix:

```ts
assert.deepEqual(durationsFor(1), [70, 90, 120, 150, 180]);
assert.deepEqual(durationsFor(2), [70, 90, 120, 150, 180]);
assert.deepEqual(durationsFor(3), [90, 120, 150, 180]);
assert.deepEqual(durationsFor(4), [120, 150, 180]);
```

5. Mapping duration/service:

```text
70  → NHT0002
90  → NHT0003
120 → NHT0004
150 → NHT0005
180 → NHT0006
```

### Interaction checks

1. Vuốt từ ảnh dầu sang đá nóng không select KTV.
2. Khi ảnh đá nóng đang active, bấm card select KTV và `hotStone` được preselect.
3. Bấm arrow/dot không select KTV.
4. Chọn card khi ảnh Mix active mở popover.
5. Mix chọn 1 item không Apply được.
6. Mix chọn 2/3/4 item trả đúng ID thật.
7. Cancel mix bỏ lựa chọn KTV vừa thêm.
8. KTV thứ hai không ghi đè therapy đã chọn bởi KTV đầu tiên.
9. Language switch giữ KTV + therapy selection; visit bình thường clear state cũ.
10. Cart, checkout, invoice và BookingItems giữ đúng NHT0005/NHT0006 và duration 150/180.

### Commands cuối

```bash
npx tsc --noEmit
npm run build
git diff --check
```

---

## 10. ACCEPTANCE CRITERIA

- [ ] Danh sách KTV vẫn chỉ lấy `status = 'ĐANG LÀM'` và `is_active_therapy_menu = true`.
- [ ] Mỗi gallery item version 2 có metadata therapy hoặc mix.
- [ ] Vuốt/mũi tên/dot chỉ đổi active image, không chọn KTV.
- [ ] Bấm card là hành động chọn nhân viên.
- [ ] Therapy được suy ra từ active image tại thời điểm chọn KTV.
- [ ] Ảnh Mix mở popover sau khi chọn KTV.
- [ ] Mix lưu 2–4 base technique IDs, không lưu `mixofourtherapies`.
- [ ] BookingConfig nhận preselected techniques.
- [ ] Duration hiển thị đúng ma trận 1/2/3/4 therapy.
- [ ] NHT0005 và NHT0006 lấy đúng duration/giá từ DB.
- [ ] KTV thứ hai không ghi đè therapy của booking.
- [ ] Không có public POST/DELETE dùng Supabase Admin mà không auth.
- [ ] Không làm hỏng NHP gallery, Standard Menu, cart, checkout hoặc invoice.
- [ ] `tsc`, build và `git diff --check` pass.

---

## 11. PHẠM VI KHÔNG LÀM

- Không tạo database table mới.
- Không thêm dependency carousel/modal/form.
- Không thay đổi toàn bộ kiến trúc VIP menu.
- Không refactor các file không liên quan.
- Không tự động gán therapy cho legacy URL khi chưa có metadata.
- Không coi swipe là select.
- Không coi mix là một technique ID.
- Không thêm 60 phút/NHT0001 vào UI trong task này.

Kết quả cần giao: diff nhỏ nhất có thể, test logic duration/gallery, báo cáo các file đã sửa và bằng chứng `tsc`/build pass.
