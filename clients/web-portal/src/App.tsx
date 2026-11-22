import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { PublicTrackingPage } from './pages/PublicTrackingPage';
import { AuthPage } from './pages/AuthPage';
import { ShopPortalPage } from './pages/ShopPortalPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ShipperCompanionPage } from './pages/ShipperCompanionPage';

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<PublicTrackingPage />} />
            <Route path="/track" element={<PublicTrackingPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/shop" element={<ShopPortalPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/shipper" element={<ShipperCompanionPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 no-print">
          SPX-CLONE-2026 · PTIT Nhóm 24 · Kiến trúc Microservices 3 Miền (Gateway :8080 · Auth/Order :8081/:8082 · Dispatch :8083 · Tracking :8084)
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
