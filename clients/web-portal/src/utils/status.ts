export const ORDER_STATUS_META: Record<
  string,
  { label: string; colorClass: string; stepIndex: number }
> = {
  CREATED: {
    label: 'Mới tạo',
    colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
    stepIndex: 0,
  },
  WAITING_FOR_PICKUP: {
    label: 'Chờ lấy hàng',
    colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
    stepIndex: 1,
  },
  PICKED_UP: {
    label: 'Đã lấy hàng',
    colorClass: 'bg-sky-50 text-sky-700 border-sky-200',
    stepIndex: 2,
  },
  IN_TRANSIT: {
    label: 'Đang luân chuyển',
    colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    stepIndex: 3,
  },
  OUT_FOR_DELIVERY: {
    label: 'Đang đi giao',
    colorClass: 'bg-orange-50 text-orange-700 border-orange-200',
    stepIndex: 4,
  },
  DELIVERED: {
    label: 'Giao thành công',
    colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    stepIndex: 5,
  },
  FAILED: {
    label: 'Giao thất bại',
    colorClass: 'bg-rose-50 text-rose-700 border-rose-200',
    stepIndex: 4,
  },
};

export const STATUS_STEPS = [
  { key: 'CREATED', label: 'Đã tạo đơn' },
  { key: 'WAITING_FOR_PICKUP', label: 'Chờ lấy hàng' },
  { key: 'PICKED_UP', label: 'Đã lấy hàng' },
  { key: 'IN_TRANSIT', label: 'Luân chuyển' },
  { key: 'OUT_FOR_DELIVERY', label: 'Đang giao' },
  { key: 'DELIVERED', label: 'Hoàn tất' },
];

export function formatCurrency(amount: number): string {
  return `${Number(amount || 0).toLocaleString('vi-VN')} đ`;
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
