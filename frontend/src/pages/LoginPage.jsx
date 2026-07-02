import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import logoImg from '../assets/logo.png';
import SupportModal from '../components/common/SupportModal';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex font-inter bg-[#F8FAFC]">
      {/* ── LEFT PANEL (PREMIUM BRANDING) ── */}
      <div className="hidden lg:flex flex-col w-[45%] xl:w-[42%] relative overflow-hidden bg-[#0B2E6D] border-r border-white/5">
        <style>{`
          @keyframes float-slow {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(1.5deg); }
          }
          @keyframes float-medium {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-8px) rotate(-1deg); }
          }
          @keyframes float-fast {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-5px) scale(1.03); }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
          }
          @keyframes dash-move {
            to { stroke-dashoffset: -40; }
          }
          @keyframes reveal-cascade {
            0% { opacity: 0; transform: translateY(15px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes orb-drift-1 {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            50% { transform: translate(30px, -20px) scale(1.1); }
          }
          @keyframes orb-drift-2 {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            50% { transform: translate(-40px, 30px) scale(0.95); }
          }
          @keyframes grid-fade {
            0% { opacity: 0; }
            100% { opacity: 0.12; }
          }
          .animate-float-slow { animation: float-slow 7s ease-in-out infinite; }
          .animate-float-medium { animation: float-medium 5s ease-in-out infinite; }
          .animate-float-fast { animation: float-fast 3.5s ease-in-out infinite; }
          .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
          .animate-dash { stroke-dasharray: 8; animation: dash-move 2s linear infinite; }
          .animate-reveal { animation: reveal-cascade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .animate-orb-1 { animation: orb-drift-1 12s ease-in-out infinite; }
          .animate-orb-2 { animation: orb-drift-2 15s ease-in-out infinite; }
        `}</style>

        {/* Layered Glimmer & Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Main glowing light orbs */}
          <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/20 rounded-full blur-[130px] animate-orb-1" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-amber-400/10 rounded-full blur-[110px] animate-orb-2" />
          <div className="absolute top-[35%] right-[-20%] w-[50%] h-[50%] bg-cyan-500/15 rounded-full blur-[120px] animate-orb-1" />
          
          {/* Tech Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.12] pointer-events-none"
               style={{ 
                 backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)', 
                 backgroundSize: '24px 24px',
                 animation: 'grid-fade 1.5s ease-out forwards'
               }} 
          />
        </div>
        
        <div className="relative z-10 flex flex-col h-full p-12 xl:p-16 justify-between overflow-y-auto scrollbar-none">
          {/* Brand Header */}
          <div className="flex items-center gap-3.5 group cursor-pointer">
            <div className="p-2.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-blue-900/30 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[#FFC107]/20 border border-white/10">
              <img src={logoImg} alt="Forge India Logo" className="w-9 h-9 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white tracking-tight leading-none">FORGE<span className="text-[#FFC107]">INDIA</span></span>
              <span className="text-[9px] font-bold text-blue-200/40 uppercase tracking-[0.25em] mt-1.5 font-poppins">Enterprise Portal</span>
            </div>
          </div>

          {/* Hero & Visual Grid Wrapper */}
          <div className="my-auto py-10 space-y-12">
            {/* Headline Reveal */}
            <div className="space-y-4 max-w-lg">
              <h1 className="text-4xl xl:text-5xl font-extrabold text-white font-poppins leading-[1.12] tracking-tight">
                <span className="block opacity-0 animate-reveal" style={{ animationDelay: '0.1s' }}>Empowering Enterprises.</span>
                <span className="block bg-gradient-to-r from-[#FFC107] to-amber-300 bg-clip-text text-transparent opacity-0 animate-reveal" style={{ animationDelay: '0.35s' }}>Enabling People.</span>
              </h1>
              <p className="text-blue-100/50 text-sm xl:text-base leading-relaxed font-semibold max-w-sm opacity-0 animate-reveal" style={{ animationDelay: '0.6s' }}>
                A unified intelligent gateway designed to streamline employee onboarding, AI operations, and secure verification.
              </p>
            </div>

            {/* 3D Animated Illustration Scene */}
            <div className="relative flex justify-center py-4 w-full select-none animate-float-slow">
              <svg viewBox="0 0 500 320" className="w-full max-w-[420px] drop-shadow-[0_20px_50px_rgba(13,43,107,0.3)]">
                {/* Background Glow */}
                <circle cx="250" cy="160" r="140" fill="url(#illustrationGlow)" className="animate-pulse-glow" />

                {/* Definitions */}
                <defs>
                  <radialGradient id="illustrationGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(255, 193, 7, 0.12)" />
                    <stop offset="100%" stopColor="rgba(255, 193, 7, 0)" />
                  </radialGradient>
                  <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255, 255, 255, 0.08)" />
                    <stop offset="100%" stopColor="rgba(255, 255, 255, 0.02)" />
                  </linearGradient>
                  <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0B2E6D" />
                    <stop offset="100%" stopColor="#1A4FA0" />
                  </linearGradient>
                </defs>

                {/* Connecting circuit lines */}
                <path d="M120 180 Q250 140 380 180" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                <path d="M120 180 Q250 140 380 180" fill="none" stroke="#FFC107" strokeWidth="2.5" className="animate-dash" opacity="0.6" />
                
                <path d="M140 100 Q250 210 360 100" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                <path d="M140 100 Q250 210 360 100" fill="none" stroke="#22D3EE" strokeWidth="2.5" className="animate-dash" opacity="0.6" style={{ animationDelay: '-1s' }} />

                {/* Central Main Dashboard Card */}
                <g transform="translate(150, 75)" className="animate-float-medium">
                  {/* Main glass card */}
                  <rect x="0" y="0" width="200" height="130" rx="20" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" style={{ backdropFilter: 'blur(8px)' }} />
                  
                  {/* Mini Card Header */}
                  <rect x="15" y="15" width="40" height="6" rx="3" fill="rgba(255,255,255,0.2)" />
                  <rect x="15" y="27" width="80" height="4" rx="2" fill="rgba(255,255,255,0.08)" />

                  {/* Dashboard Graph Lines */}
                  <path d="M20 100 L50 80 L80 90 L110 65 L140 85 L180 50" fill="none" stroke="#FFC107" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="180" cy="50" r="4.5" fill="#FFC107" className="animate-ping" />
                  <circle cx="180" cy="50" r="3.5" fill="#FFC107" />

                  {/* Analytics Pulse Bar Graph */}
                  <g transform="translate(20, 45)">
                    <rect x="0" y="5" width="8" height="15" rx="1.5" fill="rgba(255,255,255,0.1)" />
                    <rect x="14" y="-3" width="8" height="23" rx="1.5" fill="#22D3EE" opacity="0.8" />
                    <rect x="28" y="7" width="8" height="13" rx="1.5" fill="rgba(255,255,255,0.1)" />
                  </g>
                </g>

                {/* Floating Shield Badge (Document Verification / Security) */}
                <g transform="translate(70, 130)" className="animate-float-slow">
                  <circle cx="35" cy="35" r="32" fill="#0B2E6D" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
                  <circle cx="35" cy="35" r="24" fill="url(#badgeGrad)" />
                  {/* Shield Icon */}
                  <path d="M35 24 L43 27.5 V35 C43 40 40 43.5 35 46 C30 43.5 27 40 27 35 V27.5 L35 24 Z" fill="none" stroke="#FFC107" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M32 35 L34.5 37.5 L38.5 33.5" fill="none" stroke="#FFC107" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </g>

                {/* Floating AI Orb / Globe (AI Automation) */}
                <g transform="translate(340, 120)" className="animate-float-fast">
                  <circle cx="40" cy="40" r="34" fill="#0B2E6D" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
                  {/* Outer spinning ring */}
                  <circle cx="40" cy="40" r="28" fill="none" stroke="rgba(34, 211, 238, 0.2)" strokeWidth="1.5" strokeDasharray="16 8" className="animate-spin" style={{ transformOrigin: '40px 40px', animationDuration: '6s' }} />
                  <circle cx="40" cy="40" r="20" fill="none" stroke="#22D3EE" strokeWidth="2" strokeDasharray="4 4" className="animate-spin" style={{ transformOrigin: '40px 40px', animationDuration: '3s' }} />
                  {/* AI brain core */}
                  <circle cx="40" cy="40" r="11" fill="#FFC107" className="animate-pulse-glow" />
                </g>

                {/* Floating Checkmark Document (Employee Onboarding) */}
                <g transform="translate(100, 40)" className="animate-float-fast">
                  <rect x="0" y="0" width="46" height="58" rx="10" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                  <line x1="8" y1="12" x2="30" y2="12" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="8" y1="20" x2="38" y2="20" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="8" y1="28" x2="38" y2="28" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="34" cy="44" r="7" fill="#10B981" />
                  <path d="M31.5 44 L33.5 46 L36.5 42.5" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            </div>

            {/* Interactive Feature Cards (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-4 max-w-lg">
              {[
                {
                  title: 'Employee Onboarding',
                  desc: 'Digital invitations & onboarding paths.',
                  icon: (
                    <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  )
                },
                {
                  title: 'Secure Verification',
                  desc: 'Automated document & data verification.',
                  icon: (
                    <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  )
                },
                {
                  title: 'AI Insights & Analytics',
                  desc: 'Interactive statistics & activity reporting.',
                  icon: (
                    <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )
                },
                {
                  title: 'HR Operations',
                  desc: 'Seamless approval queues & staff audits.',
                  icon: (
                    <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )
                }
              ].map((f, i) => (
                <div 
                  key={i} 
                  className="group p-5 bg-white/[0.03] border border-white/5 rounded-2xl flex flex-col justify-between h-36 backdrop-blur-md shadow-sm transition-all duration-300 hover:bg-white/[0.06] hover:border-white/10 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-1 cursor-pointer select-none"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-[#FFC107] transition-all duration-300 group-hover:bg-[#FFC107] group-hover:text-[#0B2E6D] group-hover:scale-105">
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xs tracking-tight font-poppins">{f.title}</h3>
                    <p className="text-blue-200/40 text-[10px] leading-relaxed mt-1 font-semibold">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer info */}
          <div className="flex items-center justify-between text-blue-300/30 text-[9px] font-bold uppercase tracking-[0.25em] pt-4 border-t border-white/5">
            <span>FIC Digital Infrastructure</span>
            <span>v2.1.0</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (LOGIN CARD) ── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden bg-slate-50/50">
        {/* Subtle background blobs for visual depth */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/40 rounded-full blur-[100px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-slate-100/50 rounded-full blur-[80px] -ml-40 -mb-40" />
        
        <div className="w-full max-w-[420px] relative z-10">
          <div className="bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(13,43,107,0.08)] p-8 sm:p-10 border border-slate-100/80 transition-all duration-300">
            {/* Mobile Branding */}
            <div className="lg:hidden flex flex-col items-center mb-8">
              <div className="p-2.5 bg-white rounded-2xl shadow-md border border-slate-100 mb-3">
                <img src={logoImg} alt="Logo" className="w-8 h-8 object-contain" />
              </div>
              <span className="text-lg font-black tracking-tighter text-[#0D2B6B]">FORGE<span className="text-[#F5C518]">INDIA</span></span>
            </div>

            <div className="mb-8 text-center sm:text-left">
              <h2 className="text-3xl font-extrabold font-poppins tracking-tight text-[#0D2B6B]">
                Welcome <span className="text-[#F5C518]">back</span>
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-2.5 font-semibold leading-relaxed">
                Access your enterprise dashboard to manage operations.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="group">
                <div className="flex items-center justify-between mb-2 px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                  <span className="text-[9px] text-[#0D2B6B] font-bold opacity-0 group-focus-within:opacity-100 transition-opacity">Work Email</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0D2B6B] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/></svg>
                  </div>
                  <input 
                    type="email" 
                    value={form.email} 
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:border-[#0D2B6B] focus:ring-4 focus:ring-blue-50/50 transition-all placeholder:text-slate-300" 
                    placeholder="name@company.com" 
                    required 
                  />
                </div>
              </div>

              <div className="group">
                <div className="flex items-center justify-between mb-2 px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                  <Link to="/forgot-password" title="Recover your password" 
                        className="text-[10px] font-black text-[#0D2B6B] hover:text-blue-600 transition-colors uppercase tracking-widest">Forgot?</Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0D2B6B] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  </div>
                  <input 
                    type={showPass ? "text" : "password"} 
                    value={form.password} 
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-11 pr-11 py-3 text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:border-[#0D2B6B] focus:ring-4 focus:ring-blue-50/50 transition-all placeholder:text-slate-300" 
                    placeholder="••••••••" 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0D2B6B] transition-colors p-1"
                  >
                    {showPass ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    )}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-[0.15em] text-white transition-all duration-300 shadow-md shadow-blue-900/10 hover:shadow-blue-900/20 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 group/btn relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0D2B6B, #1A4FA0)' }}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    AUTHENTICATING...
                  </>
                ) : (
                  <>
                    SIGN IN TO PORTAL
                    <svg className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                Trouble signing in? <button onClick={() => setShowSupport(true)} className="text-[#0D2B6B] hover:text-blue-600 font-black transition-colors">HR Support</button>
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center text-[9px] text-slate-400/80 font-black uppercase tracking-[0.25em]">
            Protected by FIC Advanced Security Shield
          </div>
        </div>
      </div>
      <SupportModal isOpen={showSupport} onClose={() => setShowSupport(false)} />
    </div>
  );
}
