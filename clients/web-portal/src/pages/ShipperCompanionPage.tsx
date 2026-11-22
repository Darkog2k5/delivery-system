import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  QrCode,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Power,
} from 'lucide-react';
import { ApiError, getStoredUser, spxApi } from '../services/api';
import { DispatchOrder, ShipperProfile } from '../types/api';
import { ORDER_STATUS_META, formatCurrency } from '../utils/status';

export function ShipperCompanionPage() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [profile, setProfile] = useState<ShipperProfile | null>(null);
  const [tab, setTab] = useState<'pickup' | 'delivery' | 'history'>('pickup');
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [barcodeInput, setBarcodeInput] = useState<Record<string, string>>({});
  const [failModalCode, setFailModalCode] = useState<string | null>(null);
  const [failReason, setFailReason] = useState('Không liên lạc được với người nhận');
  const [msg, setMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const loadData = async () => {
    setErrMsg(null);
    try {
      const code = user?.role === 'ROLE_ADMIN' ? 'SHIPPER_01' : undefined;
      const [p, list] = await Promise.all([
        spxApi.getShipperProfile(code),
        spxApi.getShipperOrders(tab, code),
      ]);
      setProfile(p);
      setOrders(list);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) navigate('/login');
      else setErrMsg(err instanceof ApiError ? err.message : 'Không tải được dữ liệu Shipper');
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [tab]);

  const toggleOnline = async () => {
    if (!profile) return;
    try {
      const updated = await spxApi.setShipperOnline(!profile.isOnline);
      setProfile(updated);
      setMsg(`Đã chuyển trạng thái tài xế sang ${updated.isOnline ? 'ONLINE' : 'OFFLINE'}`);
    } catch (err) {
      setErrMsg(err instanceof ApiError ? err.message : 'Lỗi cập nhật trạng thái');
    }
  };

  const handlePickup = async (trackingCode: string) => {
    setErrMsg(null);
    setMsg(null);
    try {
      const scanned = barcodeInput[trackingCode] || trackingCode;
      await spxApi.confirmPickup(trackingCode, scanned);
      setMsg(`Xác nhận đã lấy hàng thành công: ${trackingCode}`);
      await loadData();
    } catch (err) {
      setErrMsg(err instanceof ApiError ? err.message : 'Lỗi xác nhận lấy hàng');
    }
  };

  const handleTransit = async (trackingCode: string, target: string) => {
    setErrMsg(null);
    setMsg(null);
    try {
      await spxApi.advanceTransit(trackingCode, target);
      setMsg(`Đã cập nhật ${trackingCode} -> ${target}`);
      await loadData();
    } catch (err) {
      setErrMsg(err instanceof ApiError ? err.message : 'Lỗi cập nhật trạng thái');
    }
  };

  const handleDeliver = async (order: DispatchOrder) => {
    setErrMsg(null);
    setMsg(null);
    try {
      await spxApi.confirmDeliver(order.trackingCode, {
        receiverSignature: order.receiverName,
        codCollected: true,
      });
      setMsg(`Giao thành công ${order.trackingCode}! Đã đồng bộ sang Tracking.`);
      await loadData();
    } catch (err) {
      setErrMsg(err instanceof ApiError ? err.message : 'Lỗi xác nhận giao hàng');
    }
  };

  const handleFailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!failModalCode) return;
    setErrMsg(null);
    setMsg(null);
    try {
      await spxApi.reportFailure(failModalCode, failReason);
      setMsg(`Đã ghi nhận giao thất bại cho ${failModalCode}`);
      setFailModalCode(null);
      await loadData();
    } catch (err) {
      setErrMsg(err instanceof ApiError ? err.message : 'Lỗi báo giao thất bại');
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-7">
      <div className="mb-3 text-center">
        <span className="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-bold text-slate-700">
          Shipper App Web Companion (UC16–UC21 · Dự phòng Demo R09)
        </span>
      </div>

      <div className="overflow-hidden rounded-[28px] border-4 border-slate-900 bg-slate-50 shadow-2xl">
        {/* Mobile Header */}
        <div className="bg-slate-900 px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Truck className="h-5 w-5 text-spx-orange" />
              <div>
                <div className="text-sm font-bold">
                  {profile?.fullName || user?.fullName || 'Tài xế Shipper'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {profile?.shipperCode} · {profile?.hubCode}
                </div>
              </div>
            </div>

            <button
              onClick={toggleOnline}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
                profile?.isOnline
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              <Power className="h-3.5 w-3.5" />
              {profile?.isOnline ? 'ONLINE' : 'OFFLINE'}
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-white/10 px-3 py-2 text-xs">
            <span>COD đang giữ trong ca:</span>
            <span className="font-black text-orange-300">
              {formatCurrency(profile?.codHolding || 0)}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-white text-xs font-bold">
          {[
            { id: 'pickup', label: 'Cần lấy (UC17)' },
            { id: 'delivery', label: 'Đang xử lý' },
            { id: 'history', label: 'Lịch sử' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`py-3 border-b-2 transition ${
                tab === t.id
                  ? 'border-spx-orange text-spx-orange'
                  : 'border-transparent text-slate-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3 min-h-[420px]">
          {errMsg && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
              {errMsg}
            </div>
          )}
          {msg && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-700">
              {msg}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">
              Không có đơn hàng nào trong mục này.
            </div>
          ) : (
            orders.map((order) => {
              const meta =
                ORDER_STATUS_META[order.orderStatus] || ORDER_STATUS_META.CREATED;
              return (
                <div
                  key={order.trackingCode}
                  className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-slate-900">
                      {order.trackingCode}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.colorClass}`}
                    >
                      {meta.label}
                    </span>
                  </div>

                  <div className="text-slate-600">
                    <div>
                      <strong>Lấy:</strong> {order.senderAddress}, {order.senderDistrict}
                    </div>
                    <div>
                      <strong>Giao:</strong> {order.receiverName} · {order.receiverAddress},{' '}
                      {order.receiverDistrict}
                    </div>
                    <div className="font-bold text-spx-orange mt-1">
                      Thu hộ COD: {formatCurrency(order.codAmount)}
                    </div>
                  </div>

                  {order.orderStatus === 'WAITING_FOR_PICKUP' && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <QrCode className="h-4 w-4 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={barcodeInput[order.trackingCode] ?? order.trackingCode}
                          onChange={(e) =>
                            setBarcodeInput({
                              ...barcodeInput,
                              [order.trackingCode]: e.target.value,
                            })
                          }
                          placeholder="Mã Barcode quét được..."
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-[11px]"
                        />
                      </div>
                      <button
                        onClick={() => handlePickup(order.trackingCode)}
                        className="w-full rounded-xl bg-spx-orange py-2 font-bold text-white hover:bg-spx-dark"
                      >
                        Quét Barcode &amp; Xác nhận Đã Lấy Hàng (UC18)
                      </button>
                    </div>
                  )}

                  {order.orderStatus === 'PICKED_UP' && (
                    <button
                      onClick={() => handleTransit(order.trackingCode, 'IN_TRANSIT')}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 font-bold text-white hover:bg-indigo-700"
                    >
                      Nhập kho &amp; Luân chuyển Hub <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {order.orderStatus === 'IN_TRANSIT' && (
                    <button
                      onClick={() => handleTransit(order.trackingCode, 'OUT_FOR_DELIVERY')}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-spx-orange py-2 font-bold text-white hover:bg-spx-dark"
                    >
                      Bắt đầu Đi Giao Hàng <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {order.orderStatus === 'OUT_FOR_DELIVERY' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleDeliver(order)}
                        className="flex items-center justify-center gap-1 rounded-xl bg-emerald-600 py-2 font-bold text-white hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Giao thành công
                      </button>
                      <button
                        onClick={() => setFailModalCode(order.trackingCode)}
                        className="flex items-center justify-center gap-1 rounded-xl bg-rose-600 py-2 font-bold text-white hover:bg-rose-700"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Giao thất bại
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Fail Reason Modal */}
      {failModalCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <form
            onSubmit={handleFailSubmit}
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl space-y-3"
          >
            <h3 className="text-sm font-bold text-slate-900">
              Báo cáo Giao thất bại — {failModalCode} (UC21)
            </h3>
            <textarea
              required
              rows={3}
              value={failReason}
              onChange={(e) => setFailReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFailModalCode(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white"
              >
                Xác nhận thất bại
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
