import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import logoImg from '../../assets/logo.png';

const Logo = ({ size = 36 }) => (
  <img src={logoImg} alt="Forge India Logo" className="rounded-lg shadow-sm" style={{ width: size, height: size, objectFit: 'contain', background: 'white' }} />
);

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z', exact: true },
  { to: '/admin/employees', label: 'All Employees', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
  { to: '/admin/approvals', label: 'Approvals', icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const NavItem = ({ to, label, icon, exact }) => (
    <NavLink to={to} end={exact}
      onClick={() => setIsMenuOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl mx-2 cursor-pointer relative transition-all text-sm font-medium min-h-[44px] ${
          isActive
            ? 'text-white bg-white/15 shadow-sm'
            : 'text-white/55 hover:text-white/90 hover:bg-white/8'
        }`
      }>
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r" style={{ background: '#F5C518' }} />}
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d={icon}/>
          </svg>
          {!collapsed && <span>{label}</span>}
        </>
      )}
    </NavLink>
  );

  // Page title from current route
  const pageTitle = navItems.find(n => location.pathname === n.to || (!n.exact && location.pathname.startsWith(n.to)))?.label || 'Admin';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* ── MOBILE OVERLAY ── */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col flex-shrink-0 transition-all duration-300 lg:static lg:translate-x-0 ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: (collapsed && !isMenuOpen) ? 64 : 240, background: 'linear-gradient(180deg, #0D2B6B 0%, #1A4FA0 100%)' }}>

        {/* Brand */}
        <div className="h-16 flex items-center px-4 border-b border-white/10 flex-shrink-0 justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={32} />
            {(!collapsed || isMenuOpen) && (
              <div>
                <div className="font-poppins text-base font-bold tracking-widest leading-none text-white uppercase">FORGE <span style={{ color: '#F5C518' }}>INDIA</span></div>
                <div className="text-white/40 text-xs leading-none mt-0.5">Admin Portal</div>
              </div>
            )}
          </div>
          <button className="lg:hidden text-white/50" onClick={() => setIsMenuOpen(false)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Role badge */}
        {(!collapsed || isMenuOpen) && (
          <div className="mx-3 mt-4 mb-2 px-3 py-2 rounded-xl bg-white/8 border border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: '#F5C518', color: '#0D2B6B' }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-white text-xs font-semibold truncate">{user?.name}</div>
                <div className="text-white/40 text-xs">HR Administrator</div>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto custom-scrollbar">
          {(!collapsed || isMenuOpen) && <div className="px-5 pt-2 pb-1 text-xs font-bold text-white/25 tracking-widest uppercase">Management</div>}
          {navItems.map(item => <NavItem key={item.to} {...item} />)}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 px-3 py-3 text-[#0D2B6B] bg-[#F5C518] rounded-xl transition text-xs font-bold uppercase tracking-widest hover:brightness-105 active:scale-95 shadow-lg shadow-yellow-600/10">
            {(!collapsed || isMenuOpen) && 'Logout'}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100 flex-shrink-0 shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 -ml-2 text-gray-400" onClick={() => setIsMenuOpen(true)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="font-poppins text-lg font-bold text-gray-800 tracking-tight">{pageTitle}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #0D2B6B, #1A4FA0)', color: '#F5C518' }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
