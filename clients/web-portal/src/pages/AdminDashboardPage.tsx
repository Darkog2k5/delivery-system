import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  Search,
  RefreshCw,
  Building2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { ApiError, getStoredUser, spxApi } from '../services/api';
import { DispatchDashboardData } from '../types/api';
import { ORDER_STATUS_META, formatCurrency, formatDateTime } from '../utils/status';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [dashboard, setDashboard] = useState<DispatchDashboardData | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [hubFilter, setHubFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipper, setSelectedShipper] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await spxApi.getDispatchDashboard({
        status: statusFilter,
        hubCode: hubFilter,
        search: searchTerm,
      });
      setDashboard(data);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) navigate('/login');
        else setErrorMsg(err.message);
      } else {
        setErrorMsg('Không thể tải dữ liệu Master Dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadDashboard();
  }, [statusFilter, hubFilter]);

  const handleAssign = async (trackingCode: string) => {
    const shipperCode =
      selectedShipper[trackingCode] || dashboard?.shippers[0]?.shipperCode || 'SHIPPER_01';
    setErrorMsg(null);
    setToastMsg(null);
    try {
      await spxApi.assignShipper(trackingCode, shipperCode);
      setToastMsg(
        `Đã gán vận đơn ${trackingCode} cho ${shipperCode} và phát sự kiện RabbitMQ sang Tracking Service!`,
      );
      await loadDashboard();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Gán tài xế thất bại');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <LayoutDashboard className="h-6 w-6 text-spx-orange" />
            Master Dashboard Điều Phối Toàn Hệ Thống (UC26)
          </h1>
          <p className="text-sm text-slate-500">
            Miền 2: Dispatch &amp; Operations Service (NestJS + MySQL + RabbitMQ · Cổng 8083)
          </p>
        </div>
        <button
          onClick={loadDashboard}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Đồng bộ dữ liệu
        </button>
      </div>

      {errorMsg && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}
      {toastMsg && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {toastMsg}
        </div>
      )}

      {dashboard && (
        <>
          {/* KPI Grid */}
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-slate-500">Tổng vận đơn</div>
              <div className="mt-1 text-2xl font-black text-slate-900">
                {dashboard.summary.totalOrders}
              </div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
              <div className="text-xs font-semibold text-amber-700">Chờ điều phối (CREATED)</div>
              <div className="mt-1 text-2xl font-black text-amber-700">
                {dashboard.summary.byStatus.CREATED || 0}
              </div>
            </div>
            <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-4 shadow-sm">
              <div className="text-xs font-semibold text-spx-orange">Đang đi giao</div>
              <div className="mt-1 text-2xl font-black text-spx-orange">
                {dashboard.summary.byStatus.OUT_FOR_DELIVERY || 0}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
              <div className="text-xs font-semibold text-emerald-700">Giao thành công</div>
              <div className="mt-1 text-2xl font-black text-emerald-700">
                {dashboard.summary.byStatus.DELIVERED || 0}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm col-span-2 lg:col-span-1">
              <div className="text-xs font-semibold text-slate-500">Tổng giá trị COD</div>
              <div className="mt-1 text-xl font-black text-slate-900">
                {formatCurrency(dashboard.summary.totalCodAmount)}
              </div>
            </div>
          </div>

          {/* Hubs & Shippers Status */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Building2 className="h-4 w-4 text-spx-orange" />
                Mạng lưới Bưu cục / Hub Trung chuyển ({dashboard.hubs.length})
              </h2>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {dashboard.hubs.map((h) => (
                  <div key={h.hubCode} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="font-bold text-slate-900">
                      {h.hubCode} · {h.district}
                    </div>
                    <div className="text-slate-600">{h.hubName}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <UserCheck className="h-4 w-4 text-spx-orange" />
                Đội ngũ Tài xế Shipper ({dashboard.summary.onlineShippers}/
                {dashboard.summary.totalShippers} Online)
              </h2>
              <div className="mt-3 space-y-2 text-xs">
                {dashboard.shippers.map((s) => (
                  <div
                    key={s.shipperCode}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900">{s.shipperCode}</span>{' '}
                      · <span className="font-semibold">{s.fullName}</span>{' '}
                      <span className="text-slate-500">({s.hubCode})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600">Đơn đang giữ: {s.activeOrdersCount}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          s.isOnline
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {s.isOnline ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filter Bar & Master Orders Table */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  {Object.keys(ORDER_STATUS_META).map((st) => (
                    <option key={st} value={st}>
                      {ORDER_STATUS_META[st].label} ({st})
                    </option>
                  ))}
                </select>

                <select
                  value={hubFilter}
                  onChange={(e) => setHubFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
                >
                  <option value="ALL">Tất cả bưu cục Hub</option>
                  {dashboard.hubs.map((h) => (
                    <option key={h.hubCode} value={h.hubCode}>
                      {h.hubCode} - {h.district}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadDashboard()}
                    placeholder="Tìm mã vận đơn, tên khách..."
                    className="rounded-xl border border-slate-200 py-2 pl-8 pr-3 text-xs w-64"
                  />
                </div>
                <button
                  onClick={loadDashboard}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Lọc
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                    <th className="py-2.5 pr-3">Mã vận đơn</th>
                    <th className="py-2.5 pr-3">Tuyến &amp; Kiện hàng</th>
                    <th className="py-2.5 pr-3">COD</th>
                    <th className="py-2.5 pr-3">Trạng thái</th>
                    <th className="py-2.5 pr-3">Tài xế phụ trách</th>
                    <th className="py-2.5 text-right">Điều phối / Hành trình</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboard.orders.map((order) => {
                    const meta =
                      ORDER_STATUS_META[order.orderStatus] || ORDER_STATUS_META.CREATED;
                    const canAssign =
                      order.orderStatus === 'CREATED' ||
                      (order.orderStatus === 'FAILED' && order.deliveryAttempts < 3);

                    return (
                      <tr key={order.trackingCode} className="hover:bg-slate-50/70">
                        <td className="py-3 pr-3 align-top">
                          <div className="font-mono font-bold text-slate-900">
                            {order.trackingCode}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {order.hubCode} · {formatDateTime(order.updatedAt)}
                          </div>
                        </td>
                        <td className="py-3 pr-3 align-top">
                          <div className="font-semibold text-slate-800">
                            {order.senderDistrict} → {order.receiverDistrict}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {order.receiverName} ({order.receiverPhone}) · {order.itemName}
                          </div>
                          {order.failReason && (
                            <div className="mt-0.5 text-[11px] font-medium text-rose-600">
                              Lý do lỗi: {order.failReason}
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-3 align-top font-bold text-spx-orange">
                          {formatCurrency(order.codAmount)}
                        </td>
                        <td className="py-3 pr-3 align-top">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${meta.colorClass}`}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-3 pr-3 align-top">
                          {order.assignedShipperCode ? (
                            <div>
                              <div className="font-bold text-slate-800">
                                {order.assignedShipperCode}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {order.assignedShipperName}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Chưa phân công</span>
                          )}
                        </td>
                        <td className="py-3 text-right align-top">
                          <div className="inline-flex items-center gap-1.5">
                            {canAssign && (
                              <>
                                <select
                                  value={
                                    selectedShipper[order.trackingCode] ||
                                    dashboard.shippers[0]?.shipperCode ||
                                    'SHIPPER_01'
                                  }
                                  onChange={(e) =>
                                    setSelectedShipper({
                                      ...selectedShipper,
                                      [order.trackingCode]: e.target.value,
                                    })
                                  }
                                  className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium"
                                >
                                  {dashboard.shippers.map((s) => (
                                    <option key={s.shipperCode} value={s.shipperCode}>
                                      {s.shipperCode} ({s.hubCode})
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleAssign(order.trackingCode)}
                                  className="rounded-lg bg-spx-orange px-2.5 py-1 text-[11px] font-bold text-white hover:bg-spx-dark"
                                >
                                  Gán đơn
                                </button>
                              </>
                            )}
                            <Link
                              to={`/track?code=${order.trackingCode}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
