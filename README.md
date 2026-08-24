# 🌟 Hệ thống Quản lý Oria / Ngan Ha Spa (Web Nội Bộ)

<div align="center">
  <p><em>Hệ thống đặt lịch, chọn menu, và quản lý toàn trình trải nghiệm khách hàng tại Spa.</em></p>
</div>

---

## 📑 Mục lục
1. [Giới thiệu](#-giới-thiệu)
2. [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
3. [Kiến trúc & Thư mục](#-kiến-trúc--thư-mục)
4. [Luồng Khách Hàng (Customer Flow)](#-luồng-khách-hàng-customer-flow)
5. [Cài đặt & Khởi chạy](#-cài-đặt--khởi-chạy)
6. [Quy chuẩn Code & Phát triển](#-quy-chuẩn-code--phát-triển)

---

## 🚀 Giới thiệu
**Oria / Ngan Ha Spa Internal Web** là một ứng dụng web nội bộ được phát triển nhằm số hóa toàn bộ quy trình tiếp đón, phục vụ và quản lý hành trình của khách hàng. Hệ thống được tối ưu hóa đặc biệt cho thiết bị máy tính bảng (Tablet) đặt tại quầy lễ tân hoặc trong phòng dịch vụ, đồng thời hỗ trợ đa ngôn ngữ (EN, VN, JP, CN, KR).

---

## 🛠 Công nghệ sử dụng

### Frontend
- **Framework**: [Next.js 16.1.4](https://nextjs.org/) (Sử dụng App Router, Turbopack)
- **Ngôn ngữ**: [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons & UI**: [Lucide React](https://lucide.dev/)
- **State Management**: React Context API & Zustand (Tùy chọn)

### Backend & Database
- **Platform**: [Supabase](https://supabase.com/)
- **Cơ sở dữ liệu**: PostgreSQL
- **Tính năng Supabase**: Realtime (Theo dõi tiến độ dịch vụ), Authentication (Google Login), Storage.
- **ORM / Client**: `postgres.js`, `@supabase/supabase-js`, `@supabase/ssr`

---

## 📂 Kiến trúc & Thư mục

Dự án tuân thủ kiến trúc **Feature-based** và tách biệt Logic khỏi UI (Logic Hooks Pattern):

```text
src/
├── app/                        # Next.js App Router
│   ├── (intro)/                # Trang Intro / Chào mừng
│   ├── [lang]/                 # Dynamic Route cho Đa ngôn ngữ (i18n)
│   │   ├── auth/               # Các trang xác thực
│   │   ├── customer-type/      # Màn hình chọn loại khách hàng
│   │   ├── new-user/           # Luồng dành cho khách hàng mới (Walk-in)
│   │   ├── old-user/           # Luồng dành cho khách hàng cũ
│   │   ├── contacted-first/    # Luồng khách đã liên hệ trước
│   │   └── journey/            # Bảng theo dõi tiến độ dịch vụ (Realtime)
│   ├── api/                    # Next.js Route Handlers (API Backend)
│   ├── invoice/                # Trang in hóa đơn điện tử
│   ├── layout.tsx              # Root Layout
│   └── globals.css             # Global Styles
│
├── components/                 # UI Components tái sử dụng
│   ├── Auth/                   # Các component Đăng nhập / Xác thực
│   ├── Checkout/               # Components liên quan đến Giỏ hàng & Thanh toán
│   ├── Menu/                   # Hiển thị Danh sách Dịch vụ (Standard, Premium)
│   └── Shared/                 # Các component dùng chung (Modals, Buttons)
│
├── lib/                        # Thư viện tiện ích, cấu hình Supabase, Helpers
├── services/                   # Business Logic, thao tác gọi Database
└── constants/                  # Các hằng số cấu hình toàn cục (Constants)
```

---

## 🗺 Luồng Khách Hàng (Customer Flow)

Hệ thống được thiết kế theo các luồng phân nhánh rõ ràng để tối ưu hóa trải nghiệm khách hàng:

1. **Phân loại Khách hàng (`/[lang]/customer-type`)**:
   - Khách cũ (History): Đăng nhập / Nhập email để tìm lại lịch sử -> Nhảy sang trang `history`.
   - Khách lẻ (Walk-in): Tạo mới phiên dịch vụ.
   - Khách đặt trước (Advance Booking): Chuyển đến luồng chọn dịch vụ đặt trước.
   - Khách đã liên hệ (Contacted First): Nhập thông tin Sale/CSKH đã ghi nhận.

2. **Chọn Dịch vụ (`/[lang]/new-user/.../menu`)**:
   - Lựa chọn hạng mục dịch vụ (Standard / Premium).
   - Thêm các dịch vụ vào giỏ hàng (Cart).
   - Tùy chỉnh dịch vụ (Chọn KTV, lực ấn, điểm cần tránh/tập trung).

3. **Thanh toán & Xác nhận (`/[lang]/new-user/.../checkout`)**:
   - Điền thông tin cá nhân.
   - Chọn phương thức thanh toán & tùy chọn xuất hóa đơn VAT.
   - Chốt đơn hàng qua API `POST /api/orders`.

4. **Hành trình Dịch vụ - Customer Journey (`/[lang]/journey/[id]`)**:
   - Sử dụng Supabase Realtime để đồng bộ trạng thái thực tế.
   - Các giai đoạn: `PREPARING` (Chờ) -> `IN_PROGRESS` (Đang làm/Đếm ngược) -> `CHECK` (Dọn dẹp) -> `RATING` (Đánh giá).
   - Hỗ trợ gọi SOS khẩn cấp, thêm dịch vụ, đổi KTV giữa chừng.

5. **Kết thúc & In hóa đơn (`/invoice/[id]`)**:
   - Hiển thị hóa đơn điện tử để in hoặc gửi cho khách hàng.

*(Lưu ý: Bạn có thể xem biểu đồ dạng hình ảnh chi tiết tại file `customer_flow.html` ở thư mục gốc của dự án)*

---

## 💻 Cài đặt & Khởi chạy

### 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản 20.x trở lên.
- **Package Manager**: `npm`.

### 2. Cài đặt Dependencies
```bash
# Clone repository
git clone <repository_url>
cd wrb-noi-bo-dev

# Cài đặt các gói thư viện
npm install
```

### 3. Cấu hình Biến môi trường
Tạo file `.env.local` tại thư mục gốc và cung cấp các cấu hình kết nối tới cơ sở dữ liệu Supabase:

```env
# Kết nối PostgreSQL (Dùng cho Prisma / postgres.js)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[REGION].pooler.supabase.com:5432/postgres"

# Kết nối Supabase Client (Auth, Realtime, Storage)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Khởi chạy Môi trường Phát triển (Development)
```bash
npm run dev
# Ứng dụng sẽ chạy tại: http://localhost:3000
```

---

## 🛡 Quy chuẩn Code & Phát triển

Để đảm bảo tính đồng nhất và dễ bảo trì, dự án áp dụng các nguyên tắc sau:

1. **Tách Biệt Logic (Logic Separation)**: 
   - **KHÔNG** nhét toàn bộ Business Logic vào file UI (`.tsx`). 
   - Sử dụng mô hình `*.logic.ts` (Custom Hooks) để quản lý State và Logic nghiệp vụ.
   
2. **Đa Ngôn Ngữ (i18n)**:
   - Hạn chế hard-code text trực tiếp vào file `.tsx`. 
   - Khuyến khích sử dụng mô hình dictionary (`*.i18n.ts` hoặc `dictionaries.ts`) để dễ dàng scale ra nhiều ngôn ngữ.

3. **Cấu hình UI / Animations**:
   - Gom các tham số cấu hình (Thời gian chuyển cảnh, thông số kích thước UI, margin cố định) vào đầu file dưới dạng Hằng số (`PAGE_CONFIG`, `LAYOUT_CONFIG`).

4. **Database & API**:
   - Luôn kiểm tra schema database tại file `TableInSupabase.md` trước khi viết code truy vấn.
   - Backend Next.js APIs (`route.ts`) chỉ đóng vai trò Điều phối (Orchestrator). Các thao tác DB phức tạp nên được module hóa thành các Service handlers riêng biệt.

---
*Developed with ❤️ by Ngan Ha Spa Tech Team.*