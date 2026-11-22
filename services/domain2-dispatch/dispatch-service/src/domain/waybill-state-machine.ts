import { BadRequestException } from '@nestjs/common';

export const WAYBILL_STATUS = {
  CREATED: 'CREATED',
  WAITING_FOR_PICKUP: 'WAITING_FOR_PICKUP',
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
} as const;

export type WaybillStatus = (typeof WAYBILL_STATUS)[keyof typeof WAYBILL_STATUS];

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  CREATED: ['WAITING_FOR_PICKUP'],
  WAITING_FOR_PICKUP: ['PICKED_UP'],
  PICKED_UP: ['IN_TRANSIT'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'],
  FAILED: ['WAITING_FOR_PICKUP', 'OUT_FOR_DELIVERY'],
  DELIVERED: [],
};

export class WaybillStateMachine {
  static validateTransition(
    currentStatus: string,
    targetStatus: string,
    deliveryAttempts = 0,
  ): void {
    if (!targetStatus || !(targetStatus in ALLOWED_TRANSITIONS)) {
      throw new BadRequestException({
        message: `Mã trạng thái vận đơn không hợp lệ: ${targetStatus}`,
        errorCode: 'ERR_INVALID_ORDER_STATUS',
        field: 'targetStatus',
      });
    }

    if (currentStatus === targetStatus) {
      throw new BadRequestException({
        message: `Vận đơn đã ở trạng thái ${targetStatus}`,
        errorCode: 'ERR_DUPLICATE_STATE',
        field: 'targetStatus',
      });
    }

    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException({
        message: `Vi phạm quy tắc chuyển đổi vòng đời vận đơn: không thể chuyển từ '${currentStatus}' sang '${targetStatus}'`,
        errorCode: 'ERR_INVALID_STATE_TRANSITION',
        field: 'targetStatus',
      });
    }

    if (currentStatus === WAYBILL_STATUS.FAILED && deliveryAttempts >= 3) {
      throw new BadRequestException({
        message: 'Đơn hàng đã vượt quá tối đa 3 lần giao thất bại, không thể giao lại',
        errorCode: 'ERR_MAX_DELIVERY_ATTEMPTS',
      });
    }
  }
}
