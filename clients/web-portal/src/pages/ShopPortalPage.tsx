import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Calculator,
  Printer,
  Package,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { ApiError, getStoredUser, spxApi } from '../services/api';
import {
  DistrictLocation,
  FeeCalculationResult,
  OrderItem,
  OrderLabel,
} from '../types/api';
import {
  ORDER_STATUS_META,
  formatCurrency,
  formatDateTime,
} from '../utils/status';
import { ShippingLabelModal } from '../components/ShippingLabelModal';

export function ShopPortalPage() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [locations, setLocations] = useState<DistrictLocation[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [feePreview, setFeePreview] = useState<FeeCalculationResult | null>(null);
  const [activeLabel, setActiveLabel] = useState<OrderLabel | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    senderAddress: user?.defaultAddress || '120 Lê Lợi',
    senderDistrict: 'Quận 1',
    receiverName: 'Nguyễn Thị Lan',
    receiverPhone: '0909888777',
    receiverAddress: '180 Võ Văn Ngân',
    receiverDistrict: 'TP. Thủ Đức',
    itemName: 'Áo sơ mi Linen cao cấp',
    actualWeightGram: 2500,
    lengthCm: 30,
    widthCm: 20,
    heightCm: 15,
    codAmount: 500000,
    note: 'Giao giờ hành chính, cho kiểm hàng',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    spxApi.getLocations().then(setLocations).catch(() => {});
    fetchOrders();
  }, []);

  useEffect(() => {
    if (form.actualWeightGram <= 0) {
      setFeePreview(null);
      return;
    }
    const timer = setTimeout(() => {
      spxApi
        .calculateFee({
          senderDistrict: form.senderDistrict,
          receiverDistrict: form.receiverDistrict,
          actualWeightGram: Number(form.actualWeightGram),
          lengthCm: Number(form.lengthCm),
          widthCm: Number(form.widthCm),
          heightCm: Number(form.heightCm),
        })
        .then(setFeePreview)
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [
    form.senderDistrict,
    form.receiverDistrict,
    form.actualWeightGram,
    form.lengthCm,
    form.widthCm,
    form.heightCm,
  ]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const list = await spxApi.getMyOrders();
      setOrders(list);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const created = await spxApi.createOrder({
        senderName: user?.fullName,
        senderPhone: user?.phone,
        senderAddress: form.senderAddress,
        senderDistrict: form.senderDistrict,
        receiverName: form.receiverName,
        receiverPhone: form.receiverPhone,
        receiverAddress: form.receiverAddress,
        receiverDistrict: form.receiverDistrict,
        itemName: form.itemName,
        actualWeightGram: Number(form.actualWeightGram),
        lengthCm: Number(form.lengthCm),
        widthCm: Number(form.widthCm),
        heightCm: Number(form.heightCm),
        codAmount: Number(form.codAmount),
        note: form.note,
      });
      setSuccessMsg(`Tạo vận đơn thành công! Mã vận đơn: ${created.trackingCode}`);
      await fetchOrders();
      const label = await spxApi.getOrderLabel(created.trackingCode);
      setActiveLabel(label);
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Tạo vận đơn thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenLabel = async (trackingCode: string) => {
    try {
      const label = await spxApi.getOrderLabel(trackingCode);
      setActiveLabel(label);
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Không tải được tem vận đơn');
    }
  };

  const totalCod = orders.reduce((sum, o) => sum + Number(o.codAmount || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Cổng Chủ Shop / Người Gửi (Merchant Portal)
          </h1>
          <p className="text-sm text-slate-500">
            UC06 Tạo vận đơn · UC08 Tự động tính cước Haversine · UC09 In tem nhiệt A6
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-right shadow-sm">
            <div className="text-[11px] font-semibold text-slate-400">Tổng COD của Shop</div>
            <div className="text-base font-black text-spx-orange">{formatCurrency(totalCod)}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-right shadow-sm">
            <div className="text-[11px] font-semibold text-slate-400">Số đơn đã tạo</div>
            <div className="text-base font-black text-slate-900">{orders.length} đơn</div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Create Order */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <PlusCircle className="h-5 w-5 text-spx-orange" />
            Tạo vận đơn mới (UC06)
          </h2>

          <form onSubmit={handleCreateOrder} className="mt-4 space-y-3.5 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600">
                  Khu vực lấy hàng (Shop)
                </label>
                <select
                  value={form.senderDistrict}
                  onChange={(e) => setForm({ ...form, senderDistrict: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium"
                >
                  {(locations.length > 0
                    ? locations
                    : [{ district: 'Quận 1' }, { district: 'TP. Thủ Đức' }]
                  ).map((loc) => (
                    <option key={loc.district} value={loc.district}>
                      {loc.district}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600">
                  Địa chỉ lấy chi tiết
                </label>
                <input
                  type="text"
                  required
                  value={form.senderAddress}
                  onChange={(e) => setForm({ ...form, senderAddress: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600">
                  Tên người nhận
                </label>
                <input
                  type="text"
                  required
                  value={form.receiverName}
                  onChange={(e) => setForm({ ...form, receiverName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600">
                  SĐT người nhận
                </label>
                <input
                  type="text"
                  required
                  value={form.receiverPhone}
                  onChange={(e) => setForm({ ...form, receiverPhone: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600">
                  Quận/Huyện giao hàng
                </label>
                <select
                  value={form.receiverDistrict}
                  onChange={(e) => setForm({ ...form, receiverDistrict: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium"
                >
                  {(locations.length > 0
                    ? locations
                    : [{ district: 'TP. Thủ Đức' }, { district: 'Quận 1' }]
                  ).map((loc) => (
                    <option key={loc.district} value={loc.district}>
                      {loc.district}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600">
                  Địa chỉ giao chi tiết
                </label>
                <input
                  type="text"
                  required
                  value={form.receiverAddress}
                  onChange={(e) => setForm({ ...form, receiverAddress: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600">
                Tên hàng hóa / Kiện hàng
              </label>
              <input
                type="text"
                required
                value={form.itemName}
                onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600">
                  KL thực (g)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.actualWeightGram}
                  onChange={(e) =>
                    setForm({ ...form, actualWeightGram: Number(e.target.value) })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600">
                  Dài (cm)
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.lengthCm}
                  onChange={(e) => setForm({ ...form, lengthCm: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600">
                  Rộng (cm)
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.widthCm}
                  onChange={(e) => setForm({ ...form, widthCm: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600">
                  Cao (cm)
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.heightCm}
                  onChange={(e) => setForm({ ...form, heightCm: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600">
                  Tiền thu hộ COD (VNĐ)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.codAmount}
                  onChange={(e) => setForm({ ...form, codAmount: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-spx-orange"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600">
                  Ghi chú giao hàng
                </label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
            </div>

            {/* Live UC08 Fee Breakdown */}
            {feePreview && (
              <div className="rounded-xl border border-orange-200 bg-spx-light p-3.5 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span className="inline-flex items-center gap-1.5 text-spx-orange">
                    <Calculator className="h-4 w-4" />
                    Ước tính cước tự động (UC08)
                  </span>
                  <span className="text-base font-black text-spx-orange">
                    {formatCurrency(feePreview.shippingFee)}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-600">
                  <div>Khoảng cách: {feePreview.distanceKm} km</div>
                  <div>KL quy đổi: {feePreview.volumetricWeightGram} g</div>
                  <div>KL tính cước: {feePreview.chargeableWeightGram} g</div>
                  <div className="whitespace-nowrap">
                    Phí: {formatCurrency(feePreview.baseFee)} +{' '}
                    {formatCurrency(
                      feePreview.distanceSurcharge + feePreview.weightSurcharge,
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-spx-orange py-2.5 text-sm font-bold text-white shadow-sm hover:bg-spx-dark transition disabled:opacity-60"
            >
              {submitting ? 'Đang tạo vận đơn...' : 'Tạo Vận Đơn & Sinh Tem A6'}
            </button>
          </form>
        </div>

        {/* Orders List */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Package className="h-5 w-5 text-spx-orange" />
              Danh sách vận đơn đã gửi
            </h2>
            <button
              onClick={fetchOrders}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Làm mới
            </button>
          </div>

          {loadingOrders ? (
            <div className="py-10 text-center text-sm text-slate-500">Đang tải đơn hàng...</div>
          ) : orders.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Chưa có vận đơn nào. Hãy tạo vận đơn đầu tiên ở biểu mẫu bên trái!
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                    <th className="py-2.5 pr-3">Mã vận đơn</th>
                    <th className="py-2.5 pr-3">Người nhận &amp; Tuyến</th>
                    <th className="py-2.5 pr-3">Cước / COD</th>
                    <th className="py-2.5 pr-3">Trạng thái</th>
                    <th className="py-2.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => {
                    const meta =
                      ORDER_STATUS_META[order.orderStatus] || ORDER_STATUS_META.CREATED;
                    return (
                      <tr key={order.trackingCode} className="hover:bg-slate-50/70">
                        <td className="py-3 pr-3 align-top">
                          <div className="font-mono font-bold text-slate-900">
                            {order.trackingCode}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {formatDateTime(order.createdAt)}
                          </div>
                        </td>
                        <td className="py-3 pr-3 align-top">
                          <div className="font-semibold text-slate-800">
                            {order.receiverName} ({order.receiverPhone})
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {order.senderDistrict} → {order.receiverDistrict} · {order.itemName}
                          </div>
                        </td>
                        <td className="py-3 pr-3 align-top whitespace-nowrap">
                          <div className="font-semibold text-slate-800">
                            Phí: {formatCurrency(order.shippingFee)}
                          </div>
                          <div className="font-bold text-spx-orange">
                            COD: {formatCurrency(order.codAmount)}
                          </div>
                        </td>
                        <td className="py-3 pr-3 align-top whitespace-nowrap">
                          <span
                            className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${meta.colorClass}`}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-3 text-right align-top">
                          <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenLabel(order.trackingCode)}
                              className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-spx-orange hover:text-spx-orange"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              In tem A6
                            </button>
                            <Link
                              to={`/track?code=${order.trackingCode}`}
                              className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Tracking
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ShippingLabelModal label={activeLabel} onClose={() => setActiveLabel(null)} />
    </div>
  );
}
