import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  PackageCheck,
  Clock,
  AlertCircle,
  Truck,
  XCircle,
} from 'lucide-react';
import { spxApi, ApiError } from '../services/api';
import { PublicTrackingSummary, TrackingReadModel } from '../types/api';
import {
  ORDER_STATUS_META,
  STATUS_STEPS,
  formatCurrency,
  formatDateTime,
} from '../utils/status';

export function PublicTrackingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || '';
  const [codeInput, setCodeInput] = useState(initialCode || 'SPX20260501089');
  const [tracking, setTracking] = useState<TrackingReadModel | null>(null);
  const [recentList, setRecentList] = useState<PublicTrackingSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const performLookup = async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await spxApi.trackOrderPublic(trimmed);
      setTracking(data);
    } catch (err) {
      setTracking(null);
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Không thể kết nối tới Tracking Service qua API Gateway');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    spxApi
      .getRecentPublicTracking()
      .then(setRecentList)
      .catch(() => setRecentList([]));
    if (initialCode) {
      performLookup(initialCode);
    } else {
      performLookup('SPX20260501089');
    }
  }, [initialCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = codeInput.trim().toUpperCase();
    if (!cleaned) return;
    if (cleaned === initialCode.toUpperCase()) {
      performLookup(cleaned);
    } else {
      setSearchParams({ code: cleaned });
    }
  };

  const handleQuickPick = (code: string) => {
    const cleaned = code.trim().toUpperCase();
    setCodeInput(cleaned);
    if (cleaned === initialCode.toUpperCase()) {
      performLookup(cleaned);
    } else {
      setSearchParams({ code: cleaned });
    }
  };

  const statusMeta = tracking
    ? ORDER_STATUS_META[tracking.currentStatus] || ORDER_STATUS_META.CREATED
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="inline-flex items-center gap-2 rounded-full bg-spx-orange/20 px-3 py-1 text-xs font-semibold text-orange-300">
          <PackageCheck className="h-3.5 w-3.5" />
          UC11 · Tra cứu hành trình vận đơn công khai (Không cần đăng nhập)
        </div>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
          Theo dõi hành trình kiện hàng SPX theo thời gian thực
        </h1>
        <p className="mt-1.5 text-sm text-slate-300">
          Dữ liệu được đồng bộ bất đồng bộ qua CQRS Read Model (Miền 3 - .NET 9 &amp; MongoDB).
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Nhập mã vận đơn (VD: SPX20260501089 hoặc thử SPX999)..."
              className="w-full rounded-xl border border-slate-700 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-spx-orange focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-spx-orange px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-spx-dark transition disabled:opacity-60"
          >
            {loading ? 'Đang tra cứu...' : 'Tra cứu vận đơn'}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400">Mã tra cứu nhanh:</span>
          {['SPX20260501089', 'SPX20260501001', 'SPX20260501006', 'SPX20260501009', 'SPX999'].map(
            (sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => handleQuickPick(sample)}
                className={`rounded-lg px-2.5 py-1 font-mono font-semibold transition ${
                  sample === 'SPX999'
                    ? 'bg-rose-500/20 text-rose-200 hover:bg-rose-500/30'
                    : 'bg-white/10 text-slate-100 hover:bg-white/20'
                }`}
              >
                {sample}
              </button>
            ),
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
          <XCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold">Không tìm thấy thông tin vận đơn</h3>
            <p className="mt-0.5 text-sm">{errorMsg}</p>
          </div>
        </div>
      )}

      {tracking && statusMeta && (
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Mã vận đơn
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-3">
                  <span className="font-mono text-2xl font-black text-slate-900">
                    {tracking.trackingCode}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-0.5 text-xs font-bold ${statusMeta.colorClass}`}
                  >
                    {statusMeta.label} ({tracking.currentStatus})
                  </span>
                </div>
              </div>
              <div className="text-sm text-slate-600">
                <div>
                  Bưu cục xử lý: <span className="font-bold text-slate-900">{tracking.hubCode}</span>
                </div>
                {tracking.assignedShipperName && (
                  <div>
                    Tài xế:{' '}
                    <span className="font-semibold text-slate-900">
                      {tracking.assignedShipperName} ({tracking.assignedShipperCode})
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-6 gap-2">
              {STATUS_STEPS.map((step, idx) => {
                const isFailed = tracking.currentStatus === 'FAILED';
                const completed = !isFailed && idx <= statusMeta.stepIndex;
                const active = idx === statusMeta.stepIndex;
                return (
                  <div
                    key={step.key}
                    className={`rounded-xl border p-2.5 text-center transition ${
                      isFailed && active
                        ? 'border-rose-300 bg-rose-50 text-rose-700'
                        : completed
                          ? 'border-spx-orange/30 bg-spx-light text-spx-orange'
                          : 'border-slate-100 bg-slate-50 text-slate-400'
                    }`}
                  >
                    <div className="text-[11px] font-bold">
                      {idx + 1}. {step.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {tracking.failReason && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>
                  <strong>Lý do giao thất bại (Lần {tracking.deliveryAttempts}/3):</strong>{' '}
                  {tracking.failReason}
                </span>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl bg-slate-50 p-4 text-sm">
              <div>
                <div className="text-xs font-semibold text-slate-500">Hành trình tuyến</div>
                <div className="mt-1 font-bold text-slate-900">
                  {tracking.senderDistrict} → {tracking.receiverDistrict}
                </div>
                <div className="text-xs text-slate-500">
                  Gửi: {tracking.senderName} · Nhận: {tracking.receiverName}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">Thông tin kiện hàng</div>
                <div className="mt-1 font-bold text-slate-900">{tracking.itemName}</div>
                <div className="text-xs text-slate-500">
                  Cước phí: {formatCurrency(tracking.shippingFee)}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">Tiền thu hộ (COD)</div>
                <div className="mt-1 text-lg font-black text-spx-orange">
                  {formatCurrency(tracking.codAmount)}
                </div>
                <div className="text-xs text-slate-500">
                  Cập nhật: {formatDateTime(tracking.updatedAt)}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Clock className="h-4 w-4 text-spx-orange" />
              Nhật ký hành trình chi tiết ({tracking.timeline.length} sự kiện)
            </h2>

            <div className="mt-5 space-y-5 border-l-2 border-slate-200 pl-5 ml-2">
              {tracking.timeline.map((evt, index) => (
                <div key={evt.eventId || index} className="relative">
                  <span
                    className={`absolute -left-[27px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-white ${
                      index === 0
                        ? evt.status === 'FAILED'
                          ? 'bg-rose-500'
                          : 'bg-spx-orange'
                        : 'bg-slate-300'
                    }`}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="text-sm font-bold text-slate-900">
                      {evt.title}{' '}
                      <span className="ml-1.5 rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                        {evt.status}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-500">
                      {formatDateTime(evt.occurredAt)}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{evt.description}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {evt.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Truck className="h-3 w-3" /> Tác nhân: {evt.actorCode}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {recentList.length > 0 && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">
            Vận đơn mẫu gần đây trên hệ thống
          </h3>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {recentList.slice(0, 6).map((item) => {
              const meta = ORDER_STATUS_META[item.currentStatus] || ORDER_STATUS_META.CREATED;
              return (
                <button
                  key={item.trackingCode}
                  onClick={() => handleQuickPick(item.trackingCode)}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-left hover:border-spx-orange/50 hover:bg-spx-light/40 transition"
                >
                  <div>
                    <div className="font-mono text-xs font-bold text-slate-900">
                      {item.trackingCode}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                      {item.senderDistrict} → {item.receiverDistrict}
                    </div>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.colorClass}`}
                  >
                    {meta.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
