import { NextResponse } from "next/server";

/**
 * ĐÃ KHOÁ (04/10/2026): route này không có xác thực và không còn nơi nào gọi (đã grep 3 repo).
 * Khách muốn thêm dịch vụ → gửi yêu cầu qua /api/customer/request (có accessToken + rate-limit),
 * quầy thêm vào đơn bằng công cụ điều phối của Admin.
 * Giữ file để tránh vỡ import/route; mọi request trả 410 Gone.
 */
export async function POST(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    console.warn(`[API Add Services] Blocked call for booking ${id} — route disabled`);
    return NextResponse.json(
        { success: false, message: "Tính năng này đã tắt. Vui lòng gửi yêu cầu thêm dịch vụ cho quầy." },
        { status: 410 }
    );
}
