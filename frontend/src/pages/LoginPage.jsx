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
      <div className="hidden lg:flex flex-col w-[42%] relative overflow-hidden bg-[#0D2B6B]">
        {/* Modern Abstract Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-400/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '48px 48px' }} />
        </div>
        
        <div className="relative z-10 flex flex-col h-full p-16">
          {/* Brand Header */}
          <div className="flex items-center gap-4 mb-24 group transition-all duration-500 hover:translate-x-1">
            <div className="p-2.5 bg-white rounded-2xl shadow-2xl shadow-blue-900/40">
              <img src={logoImg} alt="Forge India Logo" className="w-10 h-10 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-white tracking-tighter leading-none">FORGE<span className="text-[#F5C518]">INDIA</span></span>
              <span className="text-[10px] font-bold text-blue-300/60 uppercase tracking-[0.3em] mt-1">Enterprise Portal</span>
            </div>
          </div>

          {/* Hero Section */}
          <div className="max-w-md mt-12">
            <h1 className="text-5xl font-extrabold text-white mb-8 font-poppins leading-[1.15] tracking-tight">
              Modern <span className="text-[#F5C518] relative">onboarding<span className="absolute bottom-1 left-0 w-full h-1 bg-yellow-400/20 rounded-full" /></span> for the next-gen workforce.
            </h1>
            <p className="text-blue-100/60 text-lg leading-relaxed font-medium">
              A unified platform to streamline employee integration, document verification, and HR operations with precision.
            </p>
          </div>

          {/* Feature highlights with refined icons */}
          <div className="grid gap-8 mt-auto pt-20">
            {[
              { 
                title: 'High-Speed Verification', 
                desc: 'Automated document processing engine.',
                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> 
              },
              { 
                title: 'Cloud Security', 
                desc: 'End-to-end encryption for sensitive data.',
                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              }
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-5 group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#F5C518] shadow-inner transition-all group-hover:bg-[#F5C518] group-hover:text-[#0D2B6B] group-hover:scale-110">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">{f.title}</h3>
                  <p className="text-blue-200/40 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-blue-300/30 text-[9px] font-black uppercase tracking-[0.4em]">
            FIC Digital Infrastructure • v2.0.4
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
