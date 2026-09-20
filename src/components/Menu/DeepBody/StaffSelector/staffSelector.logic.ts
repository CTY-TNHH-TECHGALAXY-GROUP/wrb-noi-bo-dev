import {
  type DeepBodyBaseTechniqueId,
  staffHasDeepBodyTechnique,
} from '../../../../lib/deepBody.constants';
import { type TherapyGalleryParsedItem } from '../../../../lib/menuPhotos.helper';
import { type VipStaffInfo } from '../../../../lib/vipStaffUtils';

export interface ApplyPrimaryTechniquesResult {
  nextSelectedIds: string[];
  nextTechniqueIds: DeepBodyBaseTechniqueId[];
  warningMessage?: string;
}

/**
 * Áp dụng kỹ thuật cho KTV thứ nhất và kiểm tra tính tương thích với KTV thứ hai.
 * Nếu KTV thứ hai không tương thích, bỏ chọn KTV thứ hai và phát cảnh báo.
 */
export function applyPrimaryTechniques({
  staffId,
  techniqueIds,
  selectedIds,
  staffList,
  unsupportedWarningText,
}: {
  staffId: string;
  techniqueIds: DeepBodyBaseTechniqueId[];
  selectedIds: string[];
  staffList: VipStaffInfo[];
  unsupportedWarningText?: string;
}): ApplyPrimaryTechniquesResult {
  const secondStaff = staffList.find(
    (candidate) => candidate.id === selectedIds[1]
  );

  let nextSelectedIds = [...selectedIds];
  let warningMessage: string | undefined = undefined;

  if (
    selectedIds[0] === staffId &&
    secondStaff &&
    techniqueIds.some(
      (id) => !staffHasDeepBodyTechnique(secondStaff.skills, id)
    )
  ) {
    nextSelectedIds = [staffId];
    warningMessage = unsupportedWarningText;
  }

  return {
    nextSelectedIds,
    nextTechniqueIds: techniqueIds,
    warningMessage,
  };
}

/**
 * Xử lý khi người dùng đổi ảnh trên carousel:
 * 1. KTV chưa chọn: đổi ảnh chỉ để xem, không tự chọn KTV.
 * 2. KTV thứ hai: đổi ảnh không ghi đè phương pháp chung.
 * 3. KTV được chọn đầu tiên: đổi ảnh cập nhật phương pháp.
 * 4. Ảnh Mix: yêu cầu chọn 2–4 phương pháp (mở popover).
 * 5. Ảnh legacy: xóa lựa chọn kỹ thuật cũ, cấu hình yêu cầu chọn.
 */
export function evaluateActiveItemChange({
  staff,
  item,
  selectedIds,
}: {
  staff: VipStaffInfo;
  item: TherapyGalleryParsedItem | null;
  selectedIds: string[];
  staffList?: VipStaffInfo[];
  unsupportedWarningText?: string;
}): {
  shouldUpdateSelection: boolean;
  openMixStaff?: VipStaffInfo;
  nextSelectedIds?: string[];
  nextTechniqueIds?: DeepBodyBaseTechniqueId[];
  warningMessage?: string;
} {
  if (selectedIds[0] !== staff.id) {
    return { shouldUpdateSelection: false };
  }

  if (item?.kind === 'therapy') {
    return {
      shouldUpdateSelection: true,
      nextSelectedIds: [staff.id],
      nextTechniqueIds: [item.therapyId],
    };
  }

  if (item?.kind === 'mix') {
    return {
      shouldUpdateSelection: true,
      openMixStaff: staff,
      nextTechniqueIds: [],
    };
  }

  return {
    shouldUpdateSelection: true,
    nextSelectedIds: [staff.id],
    nextTechniqueIds: [],
  };
}

/**
 * Xử lý khi xác nhận chọn các phương pháp trong Mix Popover:
 * - Nếu mixStaff là KTV đầu đã chọn: giữ danh sách KTV và kiểm tra tương thích KTV thứ hai.
 * - Nếu mixStaff chưa được chọn: chọn KTV và gán các kỹ thuật đã chọn.
 */
export function evaluateMixApply({
  mixStaff,
  chosenTechniqueIds,
  selectedIds,
  staffList,
  unsupportedWarningText,
}: {
  mixStaff: VipStaffInfo;
  chosenTechniqueIds: DeepBodyBaseTechniqueId[];
  selectedIds: string[];
  staffList: VipStaffInfo[];
  unsupportedWarningText?: string;
}): ApplyPrimaryTechniquesResult {
  if (selectedIds[0] === mixStaff.id) {
    return applyPrimaryTechniques({
      staffId: mixStaff.id,
      techniqueIds: chosenTechniqueIds,
      selectedIds,
      staffList,
      unsupportedWarningText,
    });
  }

  return {
    nextSelectedIds: [mixStaff.id],
    nextTechniqueIds: chosenTechniqueIds,
  };
}

/**
 * Kiểm tra điều kiện xác nhận đặt dịch vụ:
 * Nếu KTV đầu là Mix nhưng chưa chọn đủ 2–4 phương pháp, yêu cầu mở lại popover Mix.
 */
export function canConfirmBooking({
  selectedIds,
  activeItem,
  selectedTechniqueIds,
}: {
  selectedIds: string[];
  activeItem: TherapyGalleryParsedItem | null;
  selectedTechniqueIds: DeepBodyBaseTechniqueId[];
}): { canConfirm: boolean; requiresMixModal: boolean } {
  if (selectedIds.length === 0) {
    return { canConfirm: false, requiresMixModal: false };
  }

  if (activeItem?.kind === 'mix' && selectedTechniqueIds.length < 2) {
    return { canConfirm: false, requiresMixModal: true };
  }

  return { canConfirm: true, requiresMixModal: false };
}

/**
 * Dựng danh sách VipStaffInfo theo đúng thứ tự selectedIds người dùng đã chọn.
 * Nếu có bất kỳ ID nào không tồn tại trong staffList, trả về null để cảnh báo dữ liệu cũ/stale.
 */
export function resolveSelectedStaff(
  selectedIds: string[],
  staffList: VipStaffInfo[],
): VipStaffInfo[] | null {
  const result: VipStaffInfo[] = [];

  for (const id of selectedIds) {
    const staff = staffList.find((candidate) => candidate.id === id);
    if (!staff) return null;
    result.push(staff);
  }

  return result;
}
