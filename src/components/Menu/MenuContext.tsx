/*
 * File: Menu/MenuContext.tsx
 * Chức năng: Context API cung cấp dữ liệu dịch vụ toàn cục
 * Logic:
 * - Fetch toàn bộ services ngay khi Provider mount (tại layout).
 * - Cung cấp danh sách services, loading state và error cho toàn app.
 * - Giúp các trang con (như StandardMenu) có data ngay lập tức mà không cần fetch lại.
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Service, ServiceOptions, CartItem, Category } from '@/components/Menu/types';
import { getServices } from '@/components/Menu/getServices';
import { type VipStaffInfo } from '@/lib/vipStaffUtils';
import { resolveVipServiceId } from '@/lib/vipPricingEngine';

export interface CustomerInfoContext {
    name: string;
    email: string;
    phone: string;
    gender: string;
    room: string;
}

interface MenuContextType {
    services: Service[];
    categories: Category[]; // Added categories
    loading: boolean;
    error: any;
    refreshData: () => Promise<void>;

    // --- Cart Logic ---
    cart: CartItem[];
    addToCart: (service: Service, qty: number, options?: ServiceOptions) => string;
    updateCartItem: (cartId: string, qty: number) => void;
    updateCartItemOptions: (cartId: string, options: ServiceOptions) => void;
    updateAllCartItemOptions: (options: ServiceOptions) => void;
    removeFromCart: (cartId: string) => void;
    clearCart: () => void;
    getQty: (serviceId: string) => number; // Helper lấy tổng số lượng của 1 service ID

    // --- VIP Cart Logic ---
    addVipToCart: (params: {
        serviceId: string;
        staffIds: string[];
        staffInfoList: VipStaffInfo[];
        skillIds: string[];
        displayName: string;
        duration: number;
        totalPrice: number;
        totalPriceUSD?: number;
        customerNotes?: string;
        focus?: string[];
        avoid?: string[];
        note?: string;
    }) => void;
    updateVipCartItem: (cartId: string, updates: {
        vipSkillIds?: string[];
        vipDuration?: number;
        vipDisplayName?: string;
        vipCustomerNotes?: string;
        priceVND?: number;
    }) => void;
    // Xóa toàn bộ pair VIP (item chính + item phụ) cùng 1 booking group
    // groupId = cartId của item đầu tiên (priceVND > 0) được chọn xóa
    removeVipGroup: (groupId: string) => void;

    // --- Customer Logic ---
    customerInfo: CustomerInfoContext;
    updateCustomerInfo: (field: string, value: string) => void;
    resetCustomerInfo: () => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider = ({ children }: { children: ReactNode }) => {
    const [services, setServices] = useState<Service[]>([]);
    const [categories, setCategories] = useState<Category[]>([]); // Add categories state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([]);

    // Customer State
    const [customerInfo, setCustomerInfoContext] = useState<CustomerInfoContext>({
        name: '',
        email: '',
        phone: '',
        gender: 'Male',
        room: ''
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null); // Clear error cũ trước khi thử lại
            const data = await getServices('all');
            console.log('🚀 [MenuData] Pre-fetched', data.length, 'services');
            setServices(data);
        } catch (err) {
            console.error('❌ [MenuData] Error fetching:', err);
            setError(err); // Lưu lỗi vào context để UI biết đường hiển thị
            setServices([]); // Xóa dữ liệu cũ nếu lỗi
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- CART FUNCTIONS ---

    // 1. Thêm món (Tạo cartId mới hoặc cộng dồn nếu option giống hệt - tạm thời cứ tạo mới để dễ custom)
    const addToCart = (service: Service, qty: number, options?: ServiceOptions) => {
        const cartId = `${service.id}-${Date.now()}-${Math.random()}`;
        setCart(prev => {
            const newItem: CartItem = {
                ...service,
                cartId,
                qty,
                options: options || {}
            };
            return [...prev, newItem];
        });
        return cartId;
    };

    // Cập nhật số lượng
    const updateCartItem = (cartId: string, qty: number) => {
        setCart(prev => {
            if (qty <= 0) {
                return prev.filter(item => item.cartId !== cartId);
            }
            return prev.map(item => item.cartId === cartId ? { ...item, qty } : item);
        });
    };

    // [NEW] Cập nhật options cho 1 item cụ thể (CartId)
    const updateCartItemOptions = (cartId: string, options: ServiceOptions) => {
        setCart(prev => prev.map(item => item.cartId === cartId ? { ...item, options: { ...item.options, ...options } } : item));
    };

    // [NEW] Cập nhật options cho TOÀN BỘ giỏ hàng (Bulk Update)
    const updateAllCartItemOptions = (options: ServiceOptions) => {
        setCart(prev => prev.map(item => ({ ...item, options: { ...item.options, ...options } })));
    };

    // 3. Xóa
    const removeFromCart = (cartId: string) => updateCartItem(cartId, 0);

    // 4. Xóa hết
    const clearCart = () => setCart([]);

    // 5. Helper lấy số lượng (để hiện badge trên Menu)
    const getQty = (serviceId: string) => {
        return cart.filter(item => item.id === serviceId).reduce((sum, item) => sum + item.qty, 0);
    };

    // --- VIP CART FUNCTION ---
    const addVipToCart = (params: {
        serviceId: string;
        staffIds: string[];
        staffInfoList: VipStaffInfo[];
        skillIds: string[];
        displayName: string;
        duration: number;
        totalPrice: number;
        totalPriceUSD?: number;
        customerNotes?: string;
        focus?: string[];
        avoid?: string[];
        note?: string;
    }) => {
        const targetId = params.serviceId;
        const vipGroupId = crypto.randomUUID();
        const newItems: CartItem[] = params.staffIds.map((staffId, index) => {
            const staffInfo = params.staffInfoList.find(s => s.id === staffId);
            return {
                // Service base fields (pseudo-service for VIP or exact NHT/NHP service)
                id: targetId,
                cartId: `vip-${staffId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                cat: 'VIP',
                names: { en: params.displayName, vi: params.displayName },
                descriptions: { en: '', vi: '' },
                img: '',
                priceVND: index === 0 ? params.totalPrice : 0, // Price only on first item
                priceUSD: index === 0 ? (params.totalPriceUSD ?? Math.round(params.totalPrice / 25000)) : 0,
                timeValue: params.duration,
                qty: 1,
                menuType: 'vip' as const,
                // VIP-specific fields
                itemType: 'vip' as const,
                serviceId: targetId,
                vipGroupId,
                vipGroupSize: params.staffIds.length,
                vipStaffId: staffId,
                vipStaffName: staffInfo?.fullName || staffId,
                vipStaffAvatar: staffInfo?.avatarUrl || null,
                vipSkillIds: params.skillIds,
                vipDisplayName: params.displayName,
                vipDuration: params.duration,
                vipCustomerNotes: params.customerNotes,
                vipFocus: params.focus || [],
                vipAvoid: params.avoid || [],
                vipNote: params.note || '',
                // Add to options so it gets saved to Supabase JSONB
                options: {
                    serviceId: targetId,
                    vipGroupId,
                    vipGroupSize: params.staffIds.length,
                    displayName: params.displayName,
                    vipDuration: params.duration,
                    vipStaffId: staffId,
                    selectedSkills: params.skillIds,
                    focus: params.focus || [],
                    avoid: params.avoid || [],
                    note: params.note || '',
                    customerNotes: params.customerNotes || '',
                    notes: { tag0: false, tag1: false, privateRoom: false, content: params.customerNotes || '' }
                } as any
            } as CartItem;
        });
        setCart(prev => [...prev, ...newItems]);
    };

    // [NEW] Update VIP cart item fields after editing in checkout
    const updateVipCartItem = (cartId: string, updates: {
        vipSkillIds?: string[];
        vipDuration?: number;
        vipDisplayName?: string;
        vipCustomerNotes?: string;
        priceVND?: number;
    }) => {
        setCart(prev => {
            const target = prev.find(item => item.cartId === cartId);
            if (!target) return prev;
            const groupItems = target.vipGroupId
                ? prev.filter(item => item.vipGroupId === target.vipGroupId)
                : prev.filter(item => item.itemType === 'vip' &&
                    item.vipDisplayName === target.vipDisplayName && item.vipDuration === target.vipDuration);
            const newDuration = updates.vipDuration ?? target.vipDuration ?? target.timeValue;
            const newServiceId = resolveVipServiceId(
                target.serviceId || target.id, newDuration, groupItems.length, target.vipDisplayName
            );
            return prev.map(item => {
                if (!groupItems.includes(item)) return item;
                const newSkillIds = updates.vipSkillIds ?? item.vipSkillIds;
                const newName = updates.vipDisplayName ?? item.vipDisplayName;
                const newNotes = updates.vipCustomerNotes ?? item.vipCustomerNotes;
                const newPrice = item.cartId === cartId ? (updates.priceVND ?? item.priceVND) : item.priceVND;
                return {
                    ...item,
                    id: newServiceId,
                    serviceId: newServiceId,
                    priceVND: newPrice,
                    timeValue: newDuration,
                    vipSkillIds: newSkillIds,
                    vipDisplayName: newName,
                    vipDuration: newDuration,
                    vipCustomerNotes: newNotes,
                    names: newName ? { en: newName, vi: newName } : item.names,
                    options: {
                        ...item.options,
                        serviceId: newServiceId,
                        displayName: newName,
                        vipDuration: newDuration,
                        selectedSkills: newSkillIds,
                        notes: {
                            tag0: item.options?.notes?.tag0 ?? false,
                            tag1: item.options?.notes?.tag1 ?? false,
                            privateRoom: item.options?.notes?.privateRoom ?? false,
                            content: newNotes || '',
                        },
                    } as typeof item.options,
                } as CartItem;
            });
        });
    };

    // [NEW] Xóa toàn bộ VIP group (item chính + item phụ giá 0)
    // groupId = cartId của bất kỳ item nào trong group — dùng vipDisplayName + vipDuration để nhận diện
    const removeVipGroup = (groupId: string) => {
        setCart(prev => {
            const target = prev.find(i => i.cartId === groupId);
            if (!target || target.itemType !== 'vip') {
                // Fallback: xóa đơn lẻ
                return prev.filter(i => i.cartId !== groupId);
            }
            if (target.vipGroupId) {
                return prev.filter(item => item.vipGroupId !== target.vipGroupId);
            }
            // Xóa tất cả VIP items có cùng (vipDisplayName + vipDuration) — signature của 1 booking
            const groupName     = target.vipDisplayName || (target.options as any)?.displayName;
            const groupDuration = target.vipDuration     || (target.options as any)?.vipDuration;
            return prev.filter(i => {
                if (i.itemType !== 'vip') return true; // giữ non-VIP items
                const iName     = i.vipDisplayName || (i.options as any)?.displayName;
                const iDuration = i.vipDuration     || (i.options as any)?.vipDuration;
                // Xóa nếu cùng signature
                return !(iName === groupName && iDuration === groupDuration);
            });
        });
    };

    // --- CUSTOMER FUNCTIONS ---
    const updateCustomerInfo = (field: string, value: string) => {
        setCustomerInfoContext(prev => ({ ...prev, [field]: value }));
    };

    const resetCustomerInfo = () => {
        setCustomerInfoContext({
            name: '',
            email: '',
            phone: '',
            gender: 'Male',
            room: ''
        });
    };

    return (
        <MenuContext.Provider value={{
            services, categories, loading, error, refreshData: fetchData,
            cart, addToCart, updateCartItem, updateCartItemOptions, updateAllCartItemOptions, removeFromCart, clearCart, getQty,
            addVipToCart, updateVipCartItem, removeVipGroup,
            customerInfo, updateCustomerInfo, resetCustomerInfo
        }}>
            {children}
        </MenuContext.Provider>
    );
};

export const useMenuData = () => {
    const context = useContext(MenuContext);
    if (context === undefined) {
        throw new Error('useMenuData must be used within a MenuProvider');
    }
    return context;
};
