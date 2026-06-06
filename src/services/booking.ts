import { getMenuData } from "@/services/menu";
import { supabase } from "@/lib/supabase";
import crypto from "node:crypto";

// Kiểu dữ liệu cho item trong giỏ hàng gửi lên từ Client
export interface BookingItem {
    id: string;
    qty: number;
    options?: any;
}

export interface BookingRequest {
    customer: {
        name: string;
        phone: string;
        email?: string;
        gender?: string;
    };
    items: BookingItem[];
    paymentMethod: string;
}

/**
 * Tính tổng tiền hóa đơn trên Server.
 */
export const calculateOrderTotal = async (items: BookingItem[]): Promise<{ totalVND: number, detailedItems: any[] }> => {
    const allServices = await getMenuData();

    let totalVND = 0;
    const detailedItems = [];

    for (const item of items) {
        const service = allServices.find(s => s.id === item.id);

        if (service) {
            const lineTotal = service.priceVND * item.qty;
            totalVND += lineTotal;

            detailedItems.push({
                ...item,
                name: service.names.vn,
                priceOriginal: service.priceVND,
                lineTotal
            });
        } else {
            console.warn(`⚠️ Warning: Service ID ${item.id} not found in DB`);
        }
    }

    return { totalVND, detailedItems };
};

/**
 * Tạo đơn hàng mới trong Supabase
 */
export const createBooking = async (data: BookingRequest, calculatedTotal: number) => {
    try {
        const vnTimeStr = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });

        const now = new Date();
        const dateCode = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}`;

        // Count to generate billCode
        const { count } = await supabase
            .from('Bookings')
            .select('*', { count: 'exact', head: true })
            .ilike('billCode', `%-${dateCode}`);

        const nextNum = (count || 0) + 1;
        const billNum = `${String(nextNum).padStart(3, '0')}-${dateCode}`;
        const branchCode = '11NDK'; // TODO: Dynamically pass this from frontend later
        const customId = `${branchCode}-${billNum}`;

        // 1. Chèn vào bảng 'Bookings'
        const { data: booking, error: bookingError } = await supabase
            .from('Bookings')
            .insert({
                id: customId,
                billCode: billNum,
                customerName: data.customer.name,
                customerPhone: data.customer.phone,
                customerEmail: data.customer.email,
                totalAmount: calculatedTotal,
                paymentMethod: data.paymentMethod,
                source: 'STANDARD_WALK_IN',
                accessToken: 'NGANHA_SECURE_TOKEN_2026',
                createdAt: vnTimeStr,
                updatedAt: vnTimeStr,
                status: 'NEW'
            })
            .select()
            .single();

        if (bookingError) throw bookingError;

        // 2. Chèn các item vào bảng 'BookingItems'
        const { detailedItems } = await calculateOrderTotal(data.items);

        const itemsToInsert = detailedItems.map((item, index) => ({
            id: `${customId}-item${index + 1}`,
            bookingId: customId,
            serviceId: item.id,
            quantity: item.qty,
            price: item.priceOriginal
        }));

        const { error: itemsError } = await supabase
            .from('BookingItems')
            .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        console.log(`✅ [Booking Service] Created booking ${booking.id} in Supabase`);

        return {
            id: booking.id,
            status: booking.status,
            createdAt: booking.created_at,
            total: calculatedTotal
        };

    } catch (error: any) {
        console.error("❌ [Booking Service] Lỗi tạo đơn hàng:", error.message);
        throw error;
    }
};

/**
 * Thêm dịch vụ vào đơn hàng đang chạy (Add-on)
 */
export const addServicesToBooking = async (bookingId: string, items: BookingItem[], adminId: string) => {
    try {
        const vnTimeStr = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });

        // 1. Lấy đơn hàng hiện tại
        const { data: booking, error: bookingError } = await supabase
            .from('Bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

        if (bookingError || !booking) throw new Error('Không tìm thấy đơn hàng');

        // 2. Tính tiền các dịch vụ mới và tổng thời lượng
        const { totalVND, detailedItems } = await calculateOrderTotal(items);
        let addedDuration = 0;

        // Lấy thông tin chi tiết dịch vụ để tính duration
        const allServices = await getMenuData();
        
        // 3. Chuẩn bị data cho BookingItems
        // Lấy số lượng item hiện tại để đánh index cho ID
        const { count: currentItemCount } = await supabase
            .from('BookingItems')
            .select('*', { count: 'exact', head: true })
            .eq('bookingId', bookingId);

        const nextIndex = (currentItemCount || 0) + 1;

        const itemsToInsert = detailedItems.map((item, index) => {
            const serviceDef = allServices.find(s => s.id === item.id);
            const itemDuration = serviceDef?.timeValue || 60; // fallback 60
            addedDuration += itemDuration * item.qty;

            return {
                id: `${bookingId}-item${nextIndex + index}`,
                bookingId: bookingId,
                serviceId: item.id,
                quantity: item.qty,
                price: item.priceOriginal,
                status: 'WAITING',
                technicianCodes: [booking.technicianCode].filter(Boolean),
                options: { ...item.options, isAddon: true, isPaid: false }
            };
        });

        // 4. Insert vào BookingItems
        const { error: itemsError } = await supabase
            .from('BookingItems')
            .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        // 5. Update tổng tiền Bookings
        const newTotalAmount = (Number(booking.totalAmount) || 0) + totalVND;
        const { error: updateBookingError } = await supabase
            .from('Bookings')
            .update({ totalAmount: newTotalAmount, updatedAt: vnTimeStr })
            .eq('id', bookingId);
            
        if (updateBookingError) throw updateBookingError;

        // 6. Update TurnQueue (tăng estimated_end_time + nối addon item ID)
        // ⚠️ KHÔNG tăng turns_completed — add-on chung 1 bill = chung 1 tua
        const newItemIds = itemsToInsert.map(i => i.id);

        if (booking.technicianCode) {
            const { data: turn, error: turnError } = await supabase
                .from('TurnQueue')
                .select('*')
                .eq('current_order_id', bookingId)
                .eq('employee_id', booking.technicianCode)
                .maybeSingle();

            if (turn) {
                const updateData: any = {};

                // 6a. Tăng estimated_end_time
                if (turn.estimated_end_time) {
                    const [h, m, s] = turn.estimated_end_time.split(':').map(Number);
                    const d = new Date();
                    d.setHours(h, m, s || 0);
                    d.setMinutes(d.getMinutes() + addedDuration);
                    
                    updateData.estimated_end_time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
                }

                // 6b. Nối addon item IDs vào booking_item_id
                const existingItemIds = turn.booking_item_id 
                    ? String(turn.booking_item_id).split(',').map((s: string) => s.trim()).filter(Boolean)
                    : [];
                const mergedItemIds = [...new Set([...existingItemIds, ...newItemIds])];
                updateData.booking_item_id = mergedItemIds.join(',');

                await supabase
                    .from('TurnQueue')
                    .update(updateData)
                    .eq('id', turn.id);
            }
        }

        // 7. Tạo StaffNotification (Gửi cho quầy lễ tân)
        const addedServiceNames = detailedItems.map(i => i.name).join(', ');
        await supabase
            .from('StaffNotifications')
            .insert({
                bookingId: bookingId,
                employeeId: null, // null là gửi cho admin/lễ tân
                type: 'ADDON_SERVICE',
                message: `Phát sinh chưa thu: Đơn ${booking.billCode || bookingId} vừa thêm ${addedServiceNames} (${totalVND.toLocaleString()}đ).`,
                isRead: false,
                createdAt: vnTimeStr
            });

        return {
            success: true,
            totalVND,
            addedDuration,
            newTotalAmount
        };

    } catch (error: any) {
        console.error("❌ [Booking Service] Lỗi mua thêm dịch vụ:", error.message);
        throw error;
    }
};
