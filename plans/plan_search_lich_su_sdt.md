# 🛠️ Kế hoạch triển khai: Tìm kiếm lịch sử bằng Số điện thoại hoặc Email

Nhiệm vụ: Cập nhật chức năng tìm kiếm lịch sử (khách hàng cũ) ở trang chọn loại khách hàng (`customer-type`) để người dùng có thể nhập cả **Số điện thoại** hoặc **Email**, thay vì bắt buộc chỉ nhập Email như hiện tại.

---

## 📂 Các file cần thay đổi

1. [MODIFY] [checkUserEmail.ts](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/services/user/checkUserEmail.ts)
   - Cập nhật hàm `checkUserEmail` để tự động nhận diện tham số truyền vào là Email hay Số điện thoại (dựa vào sự hiện diện của ký tự `@`).
   - Gọi API `/api/auth/lookup` tương ứng với tham số `email` hoặc `phone`.

2. [MODIFY] [CustomerType.logic.ts](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/app/%5Blang%5D/customer-type/CustomerType.logic.ts)
   - Lưu đồng thời cả `email` và `phone` của khách hàng tìm được vào `localStorage` (`currentUserEmail`, `currentUserPhone`). Điều này giúp trang lịch sử sau đó (`/old-user/history`) truy vấn được đầy đủ đơn hàng của cả 2 trường này.

3. [MODIFY] [CustomerType.i18n.ts](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/app/%5Blang%5D/customer-type/CustomerType.i18n.ts)
   - Cập nhật các văn bản dịch (5 ngôn ngữ: EN, VI, JP, KR, CN) để đổi cụm từ "Email" thành "Số điện thoại hoặc Email".

4. [MODIFY] [page.tsx (customer-type)](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/wrb-noi-bo-dev/src/app/%5Blang%5D/customer-type/page.tsx)
   - Đổi ô input tìm kiếm từ `type="email"` sang `type="text"`.
   - Thay đổi tên state `inputEmail` thành `inputValue` cho chuẩn ngữ nghĩa.

---

## 📝 Chi tiết thay đổi mã nguồn

### 1. `src/services/user/checkUserEmail.ts`

```typescript
export const checkUserEmail = async (inputValue: string): Promise<CheckUserResult> => {
    try {
        const trimmed = inputValue.trim();
        // Kiểm tra xem là email hay số điện thoại
        const isEmail = trimmed.includes('@');
        const paramKey = isEmail ? 'email' : 'phone';

        const res = await fetch(`/api/auth/lookup?${paramKey}=${encodeURIComponent(trimmed)}`);
        const data = await res.json();

        if (data.success && data.customer) {
            return {
                exists: true,
                customer: {
                    name: data.customer.fullName || "",
                    phone: data.customer.phone || "",
                    email: data.customer.email || (isEmail ? trimmed : "")
                }
            };
        }

        return { exists: false, customer: null };
    } catch (error) {
        console.error("❌ [API] Lỗi check user:", error);
        return { exists: false, customer: null };
    }
};
```

### 2. `src/app/[lang]/customer-type/CustomerType.logic.ts`

```typescript
  // --- 5. LOGIC CHECK EMAIL/PHONE ---
  const handleCheckUserEmail = async (inputValue: string) => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) return;

    setIsLoading(true);

    const result = await checkUserEmail(trimmedValue);

    setIsLoading(false);

    if (result.exists && result.customer) {
      // Lưu cả email và phone vào localStorage để trang lịch sử sử dụng
      if (result.customer.email) {
        localStorage.setItem('currentUserEmail', result.customer.email);
      } else {
        localStorage.removeItem('currentUserEmail');
      }
      
      if (result.customer.phone) {
        localStorage.setItem('currentUserPhone', result.customer.phone);
      } else {
        localStorage.removeItem('currentUserPhone');
      }
      
      // Save full info for Auto-fill
      localStorage.setItem('currentUserInfo', JSON.stringify(result.customer));

      setIsExiting(true);
      setTimeout(() => {
        router.push(`/${lang}/old-user/history`);
      }, 500);
    } else {
      setPopupStep('error');
    }
  };
```

### 3. `src/app/[lang]/customer-type/CustomerType.i18n.ts`

Cập nhật các keys tương ứng của `translations`:
- `desc_enter_email`: Thay đổi từ "Nhập email..." thành "Nhập số điện thoại hoặc email..." ở mọi ngôn ngữ.
- `input_placeholder`: Đổi ví dụ "example@gmail.com" thành "Số điện thoại hoặc Email" (hoặc ngôn ngữ tương đương).
- `error_desc`: Thay đổi thành "Số điện thoại hoặc email này chưa từng sử dụng dịch vụ."
- `btn_retry`: Thay đổi thành "Thử Số Điện Thoại / Email Khác"
- `or_manual`: Thay đổi thành "hoặc nhập số điện thoại/email"

### 4. `src/app/[lang]/customer-type/page.tsx`

Đổi state `inputEmail` thành `inputValue` và đổi `type="email"` sang `type="text"`.

```typescript
  const [inputValue, setInputValue] = useState("");
  // ...
  // Trong popup input:
  <input
    type="text"
    placeholder={t('input_placeholder')}
    className="w-full bg-[#161b26] border border-[#2a3040] ... text-center focus:border-[#EAB308] focus:ring-1 focus:ring-[#EAB308] outline-none transition-all placeholder-gray-600"
    value={inputValue}
    onChange={(e) => setInputValue(e.target.value)}
    onKeyDown={(e) => e.key === 'Enter' && handleCheckUserEmail(inputValue)}
    autoFocus
  />
```

---

## 🧪 Kế hoạch xác minh (Verification Plan)

1. **Kiểm tra tìm kiếm bằng Email:**
   - Nhập một email đã tồn tại trong hệ thống (ví dụ: `test@gmail.com`).
   - Nhấn Tìm kiếm → Phải điều hướng thành công đến trang `/old-user/history` và hiển thị đúng lịch sử.
2. **Kiểm tra tìm kiếm bằng Số điện thoại:**
   - Nhập một số điện thoại đã tồn tại (ví dụ: `0901234567` hoặc `090 123 4567`).
   - Nhấn Tìm kiếm → Phải điều hướng thành công đến trang `/old-user/history` và hiển thị đúng lịch sử.
3. **Kiểm tra khi nhập giá trị không tồn tại:**
   - Nhập email hoặc số điện thoại không tồn tại.
   - Nhấn Tìm kiếm → Phải hiện màn hình Popup lỗi "Không Tìm Thấy".
4. **Kiểm tra đa ngôn ngữ:**
   - Đổi ngôn ngữ (VI, EN, JP, KR, CN) và xác nhận các chuỗi văn bản của ô tìm kiếm thay đổi tương ứng và hiển thị đúng nhãn "Số điện thoại hoặc Email".
