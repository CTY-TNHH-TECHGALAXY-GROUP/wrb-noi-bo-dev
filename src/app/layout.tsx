/*
 * File: layout.tsx
 * Chức năng: Layout gốc của ứng dụng Next.js
 * Định nghĩa metadata cho trang web và cấu trúc HTML cơ bản
 * Bao gồm import CSS toàn cục và render children (các trang con)
 */

import type { Metadata } from "next";
import "./globals.css"; // 👈 QUAN TRỌNG: Dòng này để tải file CSS nền đen, font chữ...
import { MenuProvider } from "@/components/Menu/MenuContext";
import { AuthProvider } from "@/components/Auth/AuthProvider";
// Import component fix lỗi height cho iOS
import IOSViewportFix from "@/components/IOSViewportFix";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

import { Analytics } from "@vercel/analytics/react"

const isVercelDeployment = process.env.VERCEL === "1";

export const metadata: Metadata = {
  title: "Oria Spa",
  description: "Booking System for Oria Spa",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Oria Spa",
  },
  icons: {
    icon: "/Image/oria-spa-logo.png",
    apple: "/Image/oria-spa-logo.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zooming
  viewportFit: "cover",
  themeColor: "#b8860b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Thẻ body này là nơi chứa mọi trang web của bạn.
        Nó sẽ tự động nhận các style từ globals.css
      */}
      <body suppressHydrationWarning className="font-sans antialiased w-full h-full">
        <AuthProvider>
          <MenuProvider>
            <IOSViewportFix /> {/* Kích hoạt script tính chiều cao */}
            <ServiceWorkerRegister />
            {isVercelDeployment && <Analytics />}
            {children}
          </MenuProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
