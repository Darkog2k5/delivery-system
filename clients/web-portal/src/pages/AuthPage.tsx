import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Phone, UserPlus, LogIn, ShieldCheck } from 'lucide-react';
import { ApiError, saveAuthSession, spxApi } from '../services/api';

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('0988000001');
  const [password, setPassword] = useState('123456');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'SHIPPER'>('CUSTOMER');
  const [defaultAddress, setDefaultAddress] = useState('Quận 1, TP. Hồ Chí Minh');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectByRole = (userRole: string) => {
    if (userRole === 'ROLE_ADMIN') navigate('/admin');
    else if (userRole === 'ROLE_SHIPPER') navigate('/shipper');
    else navigate('/shop');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const auth = await spxApi.login(identifier, password);
      saveAuthSession(auth);
      redirectByRole(auth.user.role);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const auth = await spxApi.register({
        fullName,
        phone,
        password,
        role,
        defaultAddress,
      });
      saveAuthSession(auth);
      redirectByRole(auth.user.role);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (id: string) => {
    setMode('login');
    setIdentifier(id);
    setPassword('123456');
    setError(null);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <div className="flex items-center gap-2.5 text-spx-orange">
          <ShieldCheck className="h-6 w-6" />
          <h1 className="text-xl font-bold text-slate-900">
            Cổng Đăng Nhập Tập Trung (JWT RBAC)
          </h1>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          UC01 &amp; UC02 · Phân quyền tự động theo 3 vai trò qua API Gateway (:8080)
        </p>

        <div className="mt-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`rounded-lg py-2 transition ${
              mode === 'login' ? 'bg-white text-spx-orange shadow-sm' : 'text-slate-600'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`rounded-lg py-2 transition ${
              mode === 'register' ? 'bg-white text-spx-orange shadow-sm' : 'text-slate-600'
            }`}
          >
            Đăng ký tài khoản
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Số điện thoại hoặc Mã tài khoản
              </label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="VD: 0988000001 hoặc ADMIN_01"
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-spx-orange focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Mật khẩu
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-spx-orange focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-spx-orange py-2.5 text-sm font-bold text-white hover:bg-spx-dark transition disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>

            <div className="border-t border-slate-100 pt-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Điền nhanh tài khoản Demo (Pass: 123456)
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fillDemo('SHOP_01')}
                  className="rounded-lg border border-slate-200 py-1.5 font-semibold text-slate-700 hover:border-spx-orange hover:text-spx-orange"
                >
                  Shop 01
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('ADMIN_01')}
                  className="rounded-lg border border-slate-200 py-1.5 font-semibold text-slate-700 hover:border-spx-orange hover:text-spx-orange"
                >
                  Admin 01
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('SHIPPER_01')}
                  className="rounded-lg border border-slate-200 py-1.5 font-semibold text-slate-700 hover:border-spx-orange hover:text-spx-orange"
                >
                  Shipper 01
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="mt-5 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Họ và tên / Tên Shop
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Cửa Hàng Thời Trang ABC"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-spx-orange focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Số điện thoại
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0901234567"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-spx-orange focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Vai trò tài khoản
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'CUSTOMER' | 'SHIPPER')}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-spx-orange focus:outline-none"
              >
                <option value="CUSTOMER">Shop / Người gửi hàng (ROLE_CUSTOMER)</option>
                <option value="SHIPPER">Tài xế giao nhận (ROLE_SHIPPER)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Địa chỉ mặc định
              </label>
              <input
                type="text"
                value={defaultAddress}
                onChange={(e) => setDefaultAddress(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-spx-orange focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Mật khẩu (tối thiểu 6 ký tự)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-spx-orange focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-spx-orange py-2.5 text-sm font-bold text-white hover:bg-spx-dark transition disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              {loading ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
