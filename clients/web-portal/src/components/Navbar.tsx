import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  Store,
  LayoutDashboard,
  Truck,
  LogOut,
  LogIn,
} from 'lucide-react';
import { clearAuthSession, getStoredUser } from '../services/api';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleLogout = () => {
    clearAuthSession();
    navigate('/login');
  };

  const navLinkClass = (path: string) => {
    const active = location.pathname === path;
    return `inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition ${
      active
        ? 'bg-spx-light text-spx-orange'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur no-print">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-spx-orange text-white shadow-sm">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-slate-900">
                SPX Express <span className="text-spx-orange">Clone</span>
              </div>
              <div className="text-[11px] font-medium text-slate-500">
                Microservices Logistics Platform
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            <Link to="/" className={navLinkClass('/')}>
              <Search className="h-4 w-4" />
              Tra cứu công khai (UC11)
            </Link>

            {(!user || user.role === 'ROLE_CUSTOMER' || user.role === 'ROLE_ADMIN') && (
              <Link to="/shop" className={navLinkClass('/shop')}>
                <Store className="h-4 w-4" />
                Cổng Shop (UC06–09)
              </Link>
            )}

            {(!user || user.role === 'ROLE_ADMIN') && (
              <Link to="/admin" className={navLinkClass('/admin')}>
                <LayoutDashboard className="h-4 w-4" />
                Điều phối Admin (UC26)
              </Link>
            )}

            <Link to="/shipper" className={navLinkClass('/shipper')}>
              <Truck className="h-4 w-4" />
              Shipper Mobile (UC16–21)
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden xl:block text-right whitespace-nowrap">
                <div className="text-xs font-semibold text-slate-900">
                  {user.fullName}
                </div>
                <div className="text-[11px] text-slate-500">
                  {user.userCode} · {user.role.replace('ROLE_', '')}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <LogOut className="h-3.5 w-3.5" />
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-spx-orange px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-spx-dark transition"
            >
              <LogIn className="h-4 w-4" />
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
