import { useState } from 'react';
import { Outlet, useLocation, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import logoImg from '../../assets/logo.png';
import SupportModal from '../common/SupportModal';
import NotificationBell from '../common/NotificationBell';

const STEPS = [
  { step: 1, label: 'Personal Profile',   sub: 'Basic & address info',   path: '/onboarding/profile', icon: '👤' },
  { step: 2, label: 'Education',          sub: 'Academic qualifications', path: '/onboarding/education', icon: '🎓' },
  { step: 3, label: 'Work Experience',    sub: 'Previous employment',    path: '/onboarding/experience', icon: '💼' },
  { step: 4, label: 'Documents',         sub: 'Upload required files',   path: '/onboarding/documents', icon: '📂' },
  { step: 5, label: 'Bank Details',      sub: 'Salary & payment info',   path: '/onboarding/bank', icon: '🏦' },
];

const Logo = ({ size = 40 }) => (
  <img src={logoImg} alt="Forge India Logo" className="h-10 w-auto object-contain brightness-110" />
);

const STATUS_MAP = {
  invited:    { label: 'Invite Accepted',   color: '#3B82F6', bg: '#EFF6FF' },
  registered: { label: 'Profile Setup',     color: '#8B5CF6', bg: '#F5F3FF' },
  pending:    { label: 'Under HR Review',   color: '#D97706', bg: '#FFFBEB' },
  approved:   { label: 'Approved ✓',        color: '#059669', bg: '#ECFDF5' },
  rejected:   { label: 'Action Required',   color: '#DC2626', bg: '#FEF2F2' },
};

export default function OnboardingLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const completion = user?.profileCompletion || 0;
  const status = STATUS_MAP[user?.status] || STATUS_MAP.registered;

  const currentStepIndex = STEPS.findIndex(s => location.pathname.startsWith(s.path));
  const activeStep = currentStepIndex === -1 ? 0 : currentStepIndex;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F8FAFC' }}>

      {/* ── MOBILE MENU OVERLAY ── */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col flex-shrink-0 transition-all duration-500 ease-in-out lg:static lg:translate-x-0 ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ 
          width: 280, 
          background: '#0D2B6B',
          boxShadow: '20px 0 60px rgba(13, 43, 107, 0.05)'
        }}>

        {/* Brand Section */}
        <div className="h-24 flex items-center px-8 border-b border-white/5 flex-shrink-0 justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-2 bg-white rounded-xl shadow-lg shadow-blue-900/20">
              <Logo size={28} />
            </div>
            <div>
              <div className="font-poppins text-[15px] font-black tracking-[0.12em] leading-none text-white uppercase">
                FORGE <span className="text-[#F5C518]">INDIA</span>
              </div>
              <div className="text-white/30 text-[9px] font-bold tracking-[0.2em] uppercase mt-1.5">MNC Solutions</div>
            </div>
          </div>
          <button className="lg:hidden text-white/40 hover:text-white transition-colors" onClick={() => setIsMenuOpen(false)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Compact User Section */}
        <div className="px-6 mt-8 mb-6">
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/5 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] rounded-full -mr-12 -mt-12 transition-transform duration-700 group-hover:scale-110" />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-2xl bg-[#F5C518] text-[#0D2B6B] ring-4 ring-white/5">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-white text-[13px] font-bold truncate leading-tight tracking-tight">{user?.name}</div>
                <div className="inline-flex items-center gap-1.5 mt-1 px-1.5 py-0.5 rounded-md bg-white/10 text-[8px] font-black uppercase tracking-widest text-white/60">
                  {user?.status || 'Active'}
                </div>
              </div>
            </div>
            
            <div className="mt-4 relative z-10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Onboarding</span>
                <span className="text-[10px] font-black text-[#F5C518]">{completion}%</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#F5C518] shadow-[0_0_8px_rgba(245,197,24,0.4)] transition-all duration-1000 ease-out"
                  style={{ width: `${completion}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-4 text-[9px] font-black text-white/20 tracking-[0.25em] uppercase">Employee Lifecycle</div>
          {STEPS.map((s, i) => {
            const isActive = location.pathname.startsWith(s.path);
            const stepKeys = ['profile', 'education', 'experience', 'documents', 'bank'];
            const isDone = user?.completedSteps?.[stepKeys[i]];
            
            return (
              <NavLink key={s.path} to={s.path}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer relative transition-all duration-300 text-sm font-medium group ${
                  isActive
                    ? 'text-white bg-white/10 shadow-lg'
                    : 'text-white/35 hover:text-white/80 hover:bg-white/5'
                }`}>
                {isActive && (
                  <span className="absolute left-0 top-3.5 bottom-3.5 w-1 rounded-r-full" 
                    style={{ background: '#F5C518', boxShadow: '0 0 15px #F5C518' }} />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="leading-none text-[13px] font-bold tracking-tight flex items-center justify-between">
                    <span>{s.label}</span>
                    {isDone && (
                      <span className="text-[8px] font-black text-[#F5C518] uppercase tracking-widest">Done</span>
                    )}
                  </div>
                  {!isDone && (
                    <div className={`text-[9px] mt-1.5 truncate transition-colors font-bold uppercase tracking-widest ${isActive ? 'text-white/50' : 'text-white/15'}`}>
                      {s.sub}
                    </div>
                  )}
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 space-y-3 border-t border-white/5">
          <button
            onClick={() => { setIsMenuOpen(false); setShowSupport(true); }}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white/5 text-white/40 border border-white/5 rounded-2xl transition-all duration-300 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            HR Support
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white/10 text-white/80 rounded-2xl transition-all duration-300 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-[#F5C518] hover:text-[#0D2B6B] hover:shadow-xl hover:shadow-[#F5C518]/20">
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm flex items-center justify-between px-8 flex-shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-widest"
              onClick={() => setIsMenuOpen(true)}
            >
              Menu
            </button>
            
            <h1 className="font-poppins font-bold text-slate-800 text-xl leading-none">
              {STEPS[activeStep]?.label || 'Onboarding Home'}
            </h1>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={() => setShowSupport(true)}
              className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-50 text-slate-500 hover:text-[#0D2B6B] hover:bg-blue-50 border border-slate-100 transition-all font-bold text-[10px] uppercase tracking-widest"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              HR Support
            </button>
            <NotificationBell />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-800">{user?.name}</div>
                <div className="text-[10px] font-medium text-slate-400">Employee</div>
              </div>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold shadow-md shadow-blue-900/5 ring-4 ring-white"
                style={{ background: 'linear-gradient(135deg, #F8FAFC, #EFF6FF)', color: '#0D2B6B', border: '1px solid #E2E8F0' }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Container */}
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="p-6 sm:p-8 lg:p-12">
            <div className="max-w-4xl mx-auto w-full">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      <SupportModal isOpen={showSupport} onClose={() => setShowSupport(false)} />
    </div>
  );
}
