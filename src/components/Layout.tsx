import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Shield,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md dark:bg-surface-950/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              className="btn-ghost p-1 lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link to="/" className="flex items-center gap-2 font-semibold text-primary-700 dark:text-primary-400">
              <Wallet size={22} />
              <span className="hidden sm:inline">Moragas</span>
            </Link>
            <nav className="ml-6 hidden items-center gap-1 lg:flex">
              {navItems.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-400'
                        : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800'
                    }`}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="btn-ghost p-2" title="Cambiar tema">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <span className="hidden text-sm text-surface-500 sm:inline">{user?.displayName}</span>
            <button onClick={handleLogout} className="btn-ghost p-2" title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="border-t px-4 py-2 lg:hidden">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                    active
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-400'
                      : 'text-surface-600 dark:text-surface-400'
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
