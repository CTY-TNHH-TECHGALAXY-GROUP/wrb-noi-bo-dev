# Kế Hoạch: Fix KTV Availability + Time Slots

**Trạng thái:** ✅ Đã duyệt  
**Ngày:** 19/05/2026

## 🐛 Bugs cần fix

1. **NH025 ca 3 hiện "OFF TODAY" sai** → Thực tế chưa vô ca (chưa đến giờ 17h)
2. **Time slots hiện cả quá khứ** → Phải filter từ giờ hiện tại đến hết ca

## 📊 Logic chính xác (từ User)

### Bảng KTVShifts (ca làm — status = 'ACTIVE')
| shiftType | Giờ bắt đầu | Giờ kết thúc |
|-----------|------------|-------------|
| SHIFT_1 | 09:00 | 17:00 |
| SHIFT_2 | 11:00 | 19:00 |
| SHIFT_3 | 17:00 | 00:00 |
| FREE | linh hoạt | `estimatedEndTime` |

### Bảng TurnQueue (trạng thái live — date = today)
| TurnQueue status | Trạng thái hiển thị | Mã code |
|-----------------|-------|---------|
| Không có record | Chưa vô ca | `NOT_YET` |
| `waiting` | Đang rảnh | `AVAILABLE` |
| `working` / `assigned` | Đang bận | `BUSY` |
| `off` | Đã tan ca | `OFF_DUTY` |

### KTVLeaveRequests (giữ nguyên)
| Điều kiện | Trạng thái | Mã code |
|-----------|-----------|---------|
| Có record APPROVED/PENDING hôm nay | Ngày nghỉ | `ON_LEAVE` |

## 🔧 Thay đổi cần làm

### File 1: `src/lib/vipStaffUtils.ts`
- `StaffAvailability` type: Đổi `OFF_TODAY` → `NOT_YET` + `OFF_DUTY`
- Thêm fields vào `VipStaffInfo`: `shiftType`, `shiftStart`, `shiftEnd`

### File 2: `src/app/api/staff/vip-available/route.ts`
- Thêm query `KTVShifts` (status='ACTIVE')
- Logic mới:
  ```
  1. isOnLeave → ON_LEAVE
  2. tq.status='waiting' → AVAILABLE
  3. tq.status='working'/'assigned' → BUSY
  4. tq.status='off' → OFF_DUTY
  5. Không có TurnQueue → NOT_YET (chưa vô ca)
  ```
- Attach `shiftType`, `shiftStart`, `shiftEnd` từ KTVShifts

### File 3: `src/components/Menu/Premium/Premium.i18n.ts`
- Thêm keys: `status_notYet`, `status_offDuty` (5 ngôn ngữ)

### File 4: `src/components/Menu/Premium/StaffSelector/index.tsx`
- Thêm badge `NOT_YET` (xanh dương) + `OFF_DUTY` (xám)
- `NOT_YET` → hiện giờ vô ca: "VÀO CA LÚC 17:00"
- `OFF_DUTY` → hiện "ĐÃ TAN CA"

### File 5: `src/components/Menu/Premium/BookingConfig/index.tsx`
- Time slots filter:
  - Ngày hôm nay: `max(now+30min, shiftStart)` → `shiftEnd`
  - Ngày mai+: `shiftStart` → `shiftEnd`
- FREE shift: so sánh booking time vs `estimatedEndTime`

## ⚠️ Lưu ý đặc biệt
- KTV ca FREE: Khi khách đặt lịch, so sánh giờ đặt với `estimatedEndTime` để tránh đặt vào giờ KTV đã về
- Column names bảng KTVShifts: `employeeId` (camelCase), `shiftType`, `estimatedEndTime`, `effectiveFrom`
