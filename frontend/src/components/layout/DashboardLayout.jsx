import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

import logoImg from '../../assets/FIC.png';

const Logo = ({ className = "h-8" }) => (
  <img src={logoImg} alt="FIC Logo" className={`${className} w-auto object-contain brightness-110`} />
);

const navItems = [
  { to: '/', label: 'Dashboard', exact: true },
  { to: '/profile', label: 'My Profile' },
  { to: '/education', label: 'Education' },
  { to: '/experience', label: 'Experience' },
  { to: '/documents', label: 'Documents' },
];

const adminItems = [
  { to: '/admin', label: 'Admin Dashboard', exact: true },
  { to: '/admin/employees', label: 'All Employees' },
  { to: '/admin/approvals', label: 'Approvals' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const NavItem = ({ to, label, icon, exact }) => (
    <NavLink to={to} end={exact}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 cursor-pointer relative transition-all text-sm ${isActive ? 'text-white font-medium bg-white/10 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-forge-gold before:rounded-r' : 'text-white/60 hover:text-white/90 hover:bg-white/5'}`
      }>
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside style={{ backgroundColor: '#1A4FA0', width: collapsed ? 64 : 220 }} className="flex flex-col flex-shrink-0 transition-all duration-300">
        {/* Brand */}
        <div className="h-16 flex items-center justify-center border-b border-white/10 px-4">
          <Logo className={collapsed ? "h-8" : "h-10"} />
        </div>
        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {!collapsed && <div className="px-4 py-2 text-xs font-semibold text-white/30 tracking-widest uppercase">Main</div>}
          {navItems.map(item => <NavItem key={item.to} {...item} />)}
          {user?.role === 'admin' && <>
            {!collapsed && <div className="px-4 py-2 mt-3 text-xs font-semibold text-white/30 tracking-widest uppercase">Admin</div>}
            {adminItems.map(item => <NavItem key={item.to} {...item} />)}
          </>}
        </nav>
        {/* Footer */}
        <div className="p-3 border-t border-white/10">
          {!collapsed && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: '#F5C518', color: '#0D3070' }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-white text-xs font-medium truncate">{user?.name}</div>
                <div className="text-white/40 text-xs capitalize">{user?.role}</div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-2 py-3 text-[#0D2B6B] bg-[#F5C518] rounded-xl transition-all text-xs font-bold uppercase tracking-widest hover:brightness-105 active:scale-95 shadow-lg shadow-yellow-600/10">
            {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 font-bold text-xs uppercase tracking-widest">
              Menu
            </button>
            <input placeholder="Search..." className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-64 outline-none focus:border-blue-300" />
          </div>
          <div className="flex items-center gap-3">
            {/* Profile Completion Badge */}
            {user?.role === 'employee' && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                <span className="text-xs text-blue-600 font-medium">Profile</span>
                <div className="w-20 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                  <div className="h-full bg-forge-blue rounded-full" style={{ width: `${user.profileCompletion || 0}%` }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: '#1A4FA0' }}>{user.profileCompletion || 0}%</span>
              </div>
            )}
            {/* Right Logo Type */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium tracking-wide">Employee Portal</span>
              <Logo />
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#1A4FA0', color: '#F5C518' }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          </div>
        </header>
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
