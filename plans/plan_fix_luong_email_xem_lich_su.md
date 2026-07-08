# 🛠️ Plan: Fix Luồng Khách Nhập Email Xem Lại Lịch Sử

> **Ngày tạo:** 07/07/2026  
> **Tham chiếu:** [Bản phân tích gốc](file:///C:/Users/ADMIN/.gemini/antigravity-ide/brain/d00afcdc-eac0-402e-b721-f3256c82d8ec/phan_tich_luong_email_xem_lich_su.md)  
> **Trạng thái:** ⏳ Chờ duyệt

---

## Tổng Quan

Fix 6 vấn đề đã phát hiện trong luồng email → xem lịch sử, chia thành 4 phase độc lập, mỗi phase có thể deploy riêng.

| Phase | Mô tả | Ưu tiên | Files ảnh hưởng |
|-------|--------|---------|-----------------|
| **1** | Normalize email toàn bộ pipeline | 🔴 CAO | 3 files |
| **2** | Fix SQL injection risk trong `.or()` | 🔴 CAO | 1 file |
| **3** | Thống nhất nguồn check (Bookings → API) | 🟡 TRUNG BÌNH | 3 files |
| **4** | Auto-redirect sau Google Login | 🟢 THẤP | 2 files |

---

## Phase 1: Normalize Email (Ưu tiên CAO)

> **Vấn đề gốc:** `.eq('customerEmail', email)` là case-sensitive. User nhập `ABC@Gmail.com` sẽ không match `abc@gmail.com` trong DB.

### [MODIFY] [checkUserEmail.ts](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/services/user/checkUserEmail.ts)

```diff
 export const checkUserEmail = async (email: string): Promise<CheckUserResult> => {
     try {
+        const normalizedEmail = email.trim().toLowerCase();
         const { data, error } = await supabase
             .from('Bookings')
             .select('customerName, customerPhone, customerEmail')
-            .eq('customerEmail', email)
+            .ilike('customerEmail', normalizedEmail)
             .order('bookingDate', { ascending: false })
             .limit(1)
             .single();
```

### [MODIFY] [CustomerType.logic.ts](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/app/%5Blang%5D/customer-type/CustomerType.logic.ts)

```diff
   const handleCheckUserEmail = async (email: string) => {
-    if (!email.trim()) return;
+    const normalizedEmail = email.trim().toLowerCase();
+    if (!normalizedEmail) return;
     setIsLoading(true);
-    const result = await checkUserEmail(email);
+    const result = await checkUserEmail(normalizedEmail);
     setIsLoading(false);

     if (result.exists && result.customer) {
-      localStorage.setItem('currentUserEmail', email);
+      localStorage.setItem('currentUserEmail', normalizedEmail);
       localStorage.setItem('currentUserInfo', JSON.stringify(result.customer));
```

### [MODIFY] [orders/route.ts](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/app/api/orders/route.ts) — GET handler

```diff
 export async function GET(request: Request) {
     // ...
     const { searchParams } = new URL(request.url);
-    const email = searchParams.get('email');
-    const phone = searchParams.get('phone');
+    const email = searchParams.get('email')?.trim().toLowerCase();
+    const phone = searchParams.get('phone')?.trim();

     // ...
     if (email && phone) {
-        query = query.or(`customerEmail.eq.${email},customerPhone.eq.${phone}`);
+        // Phase 2 sẽ fix .or() riêng, tạm thời dùng ilike
+        query = query.or(`customerEmail.ilike.${email},customerPhone.eq.${phone}`);
     } else if (email) {
-        query = query.eq('customerEmail', email);
+        query = query.ilike('customerEmail', email);
     } else if (phone) {
         query = query.eq('customerPhone', phone);
     }
```

---

## Phase 2: Fix SQL Injection Risk (Ưu tiên CAO)

> **Vấn đề gốc:** `.or()` dùng template literal trực tiếp, nếu `email` chứa ký tự PostgREST syntax (`,`, `.`) có thể gây lỗi query.

### [MODIFY] [orders/route.ts](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/app/api/orders/route.ts) — GET handler

**Giải pháp:** Thay vì dùng `.or()` template literal, query 2 lần rồi merge kết quả (deduplicate bằng booking ID).

```diff
-    if (email && phone) {
-        query = query.or(`customerEmail.ilike.${email},customerPhone.eq.${phone}`);
-    } else if (email) {
-        query = query.ilike('customerEmail', email);
-    } else if (phone) {
-        query = query.eq('customerPhone', phone);
-    }
-
-    const { data: bookings, error } = await query
-        .order('bookingDate', { ascending: false });
-
-    if (error) throw error;

+    let bookings: any[] = [];
+
+    if (email && phone) {
+        // Query riêng biệt để tránh SQL injection qua .or() template literal
+        const selectFields = `id, billCode, totalAmount, bookingDate, status, rating,
+            technicianCode, accessToken,
+            BookingItems!BookingItems_bookingId_fkey (id, serviceId, quantity, price, options)`;
+
+        const [emailResult, phoneResult] = await Promise.all([
+            supabaseAdmin.from('Bookings').select(selectFields)
+                .ilike('customerEmail', email)
+                .order('bookingDate', { ascending: false }),
+            supabaseAdmin.from('Bookings').select(selectFields)
+                .eq('customerPhone', phone)
+                .order('bookingDate', { ascending: false })
+        ]);
+
+        if (emailResult.error) throw emailResult.error;
+        if (phoneResult.error) throw phoneResult.error;
+
+        // Merge & deduplicate by booking ID
+        const seen = new Set<string>();
+        const merged: any[] = [];
+        for (const b of [...(emailResult.data || []), ...(phoneResult.data || [])]) {
+            if (!seen.has(b.id)) {
+                seen.add(b.id);
+                merged.push(b);
+            }
+        }
+        // Re-sort by bookingDate descending
+        bookings = merged.sort((a, b) =>
+            new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()
+        );
+    } else if (email) {
+        const { data, error } = await query
+            .ilike('customerEmail', email)
+            .order('bookingDate', { ascending: false });
+        if (error) throw error;
+        bookings = data || [];
+    } else if (phone) {
+        const { data, error } = await query
+            .eq('customerPhone', phone)
+            .order('bookingDate', { ascending: false });
+        if (error) throw error;
+        bookings = data || [];
+    }
```

> [!IMPORTANT]
> Phase 1 & 2 cùng sửa file `orders/route.ts`, nên **nên merge chung 1 commit** để tránh conflict.

---

## Phase 3: Thống Nhất Nguồn Check (Ưu tiên TRUNG BÌNH)

> **Vấn đề gốc:** 
> - `checkUserEmail.ts` check bảng `Bookings` (client-side, anon key) 
> - `LoginGate.tsx` check bảng `Customers` (server-side API) 
> → Kết quả không nhất quán.

### Giải pháp: Chuyển `checkUserEmail.ts` sang gọi API `/api/auth/lookup` thay vì truy cập Supabase trực tiếp

#### [MODIFY] [checkUserEmail.ts](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/services/user/checkUserEmail.ts)

```diff
-import { supabase } from "@/lib/supabase";
-
 export interface CheckUserResult {
     exists: boolean;
     customer: {
         name: string;
         phone: string;
         email: string;
     } | null;
 }

 export const checkUserEmail = async (email: string): Promise<CheckUserResult> => {
     try {
-        const { data, error } = await supabase
-            .from('Bookings')
-            .select('customerName, customerPhone, customerEmail')
-            .eq('customerEmail', email)
-            .order('bookingDate', { ascending: false })
-            .limit(1)
-            .single();
-
-        if (error) {
-            if (error.code === 'PGRST116') {
-                return { exists: false, customer: null };
-            }
-            throw error;
-        }
-
-        if (data) {
-            return {
-                exists: true,
-                customer: {
-                    name: data.customerName || "",
-                    phone: data.customerPhone || "",
-                    email: data.customerEmail || email
-                }
-            };
+        const normalizedEmail = email.trim().toLowerCase();
+        const res = await fetch(`/api/auth/lookup?email=${encodeURIComponent(normalizedEmail)}`);
+        const data = await res.json();
+
+        if (data.success && data.customer) {
+            return {
+                exists: true,
+                customer: {
+                    name: data.customer.fullName || "",
+                    phone: data.customer.phone || "",
+                    email: data.customer.email || normalizedEmail
+                }
+            };
         }

         return { exists: false, customer: null };
     } catch (error) {
-        console.error("❌ [Supabase] Lỗi check email:", error);
+        console.error("❌ [API] Lỗi check email:", error);
         return { exists: false, customer: null };
     }
 };
```

#### [MODIFY] [auth/lookup/route.ts](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/app/api/auth/lookup/route.ts)

Mở rộng API lookup: nếu không tìm thấy trong `Customers`, fallback check `Bookings`:

```diff
     if (!data) {
-      return NextResponse.json({ success: false, error: 'Customer not found' });
+      // Fallback: Check Bookings table for email/phone
+      let fallbackQuery = supabase
+        .from('Bookings')
+        .select('customerName, customerPhone, customerEmail');
+
+      if (phone) {
+        fallbackQuery = fallbackQuery.eq('customerPhone', phone);
+      } else if (email) {
+        fallbackQuery = fallbackQuery.ilike('customerEmail', email);
+      }
+
+      const { data: bookingData } = await fallbackQuery
+        .order('bookingDate', { ascending: false })
+        .limit(1)
+        .maybeSingle();
+
+      if (bookingData) {
+        return NextResponse.json({
+          success: true,
+          customer: {
+            id: null,
+            fullName: bookingData.customerName || 'Guest',
+            phone: bookingData.customerPhone || '',
+            email: bookingData.customerEmail || '',
+          },
+          source: 'bookings_fallback'
+        });
+      }
+
+      return NextResponse.json({ success: false, error: 'Customer not found' });
     }
```

> [!NOTE]
> **Lợi ích Phase 3:**
> - Loại bỏ client-side Supabase query → không bị RLS block
> - 1 nguồn check duy nhất (`/api/auth/lookup`) cho cả popup lẫn LoginGate
> - Fallback Bookings đảm bảo khách đã từng đặt hàng (dù chưa có trong Customers) vẫn tìm thấy

---

## Phase 4: Auto-Redirect Sau Google Login (Ưu tiên THẤP)

> **Vấn đề gốc:** Sau Google OAuth redirect về customer-type, popup đóng, user phải bấm lại "Xem Lịch Sử".

### Giải pháp: Thêm query param `?intent=history` vào redirect URL

#### [MODIFY] [CustomerType.logic.ts](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/app/%5Blang%5D/customer-type/CustomerType.logic.ts)

```diff
+import { useSearchParams } from 'next/navigation';
+import { useEffect } from 'react';

 export const useCustomerTypeLogic = (lang: string) => {
   const router = useRouter();
+  const searchParams = useSearchParams();
   const { user } = useAuthStore();
   // ...

+  // Auto-redirect nếu user vừa login Google với intent=history
+  useEffect(() => {
+    if (user?.email && searchParams?.get('intent') === 'history') {
+      handleCheckUserEmail(user.email);
+    }
+  }, [user, searchParams]);

   // ...
 };
```

#### [MODIFY] [page.tsx (customer-type)](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/app/%5Blang%5D/customer-type/page.tsx)

Trong popup, thay vì dùng `<GoogleLoginBtn>` mặc định, truyền redirect URL kèm `?intent=history`:

```diff
 {/* Google Login trong popup */}
 <div className="w-full mb-4 shadow-lg rounded-[8px]">
-  <GoogleLoginBtn lang={lang} />
+  <GoogleLoginBtn lang={lang} redirectPath={`/${lang}/customer-type?intent=history`} />
 </div>
```

> [!WARNING]
> Phase 4 yêu cầu sửa thêm `GoogleLoginBtn.tsx` và `GoogleLoginBtn.logic.ts` để nhận prop `redirectPath`. Cần cẩn thận không ảnh hưởng các nơi khác đang dùng GoogleLoginBtn (checkout page, LoginGate...).

---

## Verification Plan

### Manual Verification

| # | Test Case | Kết quả mong đợi |
|---|-----------|-------------------|
| 1 | Nhập email viết HOA `ABC@GMAIL.COM` (đã có đơn dưới `abc@gmail.com`) | ✅ Tìm thấy, chuyển sang history |
| 2 | Nhập email có space ` abc@gmail.com ` | ✅ Trim + normalize → tìm thấy |
| 3 | Nhập email chưa từng đặt hàng | ✅ Popup "Không tìm thấy" |
| 4 | Nhập email có ký tự đặc biệt `,` hoặc `.or.` | ✅ Không crash, trả lỗi sạch |
| 5 | Khách có trong Customers nhưng chưa có Bookings | ✅ Tìm thấy qua Customers (Phase 3) |
| 6 | Google Login → redirect về customer-type → tự check history | ✅ Auto-redirect (Phase 4) |
| 7 | Vào trực tiếp URL `/old-user/history` khi chưa auth | ✅ LoginGate hiện ra, nhập phone/email đều OK |
| 8 | Khách có 2 đơn: 1 bằng email, 1 bằng phone → xem history | ✅ Cả 2 đơn đều hiển thị, không duplicate |

---

## Ước Lượng Thời Gian

| Phase | Thời gian | Commit message đề xuất |
|-------|-----------|----------------------|
| Phase 1 | ~15 phút | `fix: normalize email case-sensitive trong luồng xem lịch sử` |
| Phase 2 | ~20 phút | `fix: chống SQL injection trong API orders GET` |
| Phase 3 | ~30 phút | `refactor: thống nhất nguồn check email qua API lookup` |
| Phase 4 | ~25 phút | `feat: auto-redirect xem lịch sử sau Google Login` |
| **Tổng** | **~1.5 giờ** | |

---

## Open Questions

> [!IMPORTANT]
> **Q1:** Phase 3 sẽ thay đổi hành vi: nếu khách có trong `Customers` nhưng chưa có đơn trong `Bookings`, trước đây popup sẽ báo "Không tìm thấy", sau fix sẽ cho vào history (danh sách rỗng). **Hành vi nào mong muốn?**

> [!IMPORTANT]
> **Q2:** Phase 4 cần sửa `GoogleLoginBtn` để nhận `redirectPath` prop. Component này đang được dùng ở nhiều nơi (checkout, LoginGate...). **Có chấp nhận thêm prop optional này không?**

> [!NOTE]
> **Q3:** Có muốn thêm rate limit cho API `/api/auth/lookup` không? Hiện tại bất kỳ ai cũng có thể brute-force check email tồn tại.
