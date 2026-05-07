import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const FEATURES = [
    { title: 'Secure Onboarding', desc: 'Enterprise-grade security for employee data.', step: '01' },
    { title: 'Real-time Tracking', desc: 'Monitor verification status in real-time.', step: '02' },
    { title: 'Smart Document AI', desc: 'Automated verification of employee files.', step: '03' }
  ];

  return (
    <div className="min-h-screen flex font-inter bg-[#F8FAFC]">
      {/* ── LEFT PANEL (BRANDING & FEATURES) ── */}
      <div className="hidden lg:flex flex-col w-[45%] relative overflow-hidden bg-[#0D2B6B]">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full -mr-64 -mt-64 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-yellow-400/5 rounded-full -ml-48 -mb-48 blur-3xl" />
        
        <div className="relative z-10 flex flex-col h-full p-16">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-20 transition hover:scale-105 cursor-pointer">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #1A4FA0, #2563EB)' }}>
              <span className="text-yellow-400 font-black text-xl">F</span>
            </div>
            <span className="text-2xl font-black text-white tracking-tight">FORGE <span className="text-[#F5C518]">INDIA</span></span>
          </div>

          {/* Hero Text */}
          <div className="max-w-md mb-16">
            <h1 className="text-4xl font-bold text-white mb-6 font-poppins leading-tight">
              The modern way to <span className="text-[#F5C518]">onboard</span> your workforce.
            </h1>
            <p className="text-blue-100/70 text-lg leading-relaxed">
              Streamline your HR workflows with our enterprise-grade employee portal system.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-8 mt-auto">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-4 group cursor-default">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#F5C518] font-black text-xs transition-all group-hover:bg-[#F5C518] group-hover:text-[#0D2B6B] group-hover:scale-110 shadow-sm">
                  {f.step}
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm tracking-wide">{f.title}</h3>
                  <p className="text-blue-100/50 text-xs mt-1">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Copyright */}
          <div className="mt-20 text-blue-100/30 text-[10px] font-bold uppercase tracking-[0.3em]">
            © 2026 Forge India • Enterprise Solutions
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (LOGIN FORM) ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Subtle background for mobile */}
        <div className="lg:hidden absolute inset-0 bg-[#0D2B6B] -z-10" />
        
        <div className="w-full max-w-[440px] bg-white rounded-[32px] shadow-2xl shadow-slate-900/10 p-8 sm:p-12 border border-white relative">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <span className="text-2xl font-black tracking-tight text-[#0D2B6B]">FORGE <span className="text-[#F5C518]">INDIA</span></span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 font-poppins tracking-tight">Welcome back</h2>
            <p className="text-slate-400 text-sm mt-2">Access your portal to continue onboarding</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Email Address</label>
              <div className="relative group">
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-[#0D2B6B] focus:ring-4 focus:ring-blue-50 transition-all" 
                  placeholder="name@company.com" 
                  required 
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <a href="#" className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-wider">Forgot?</a>
              </div>
              <div className="relative group">
                <input 
                  type={showPass ? "text" : "password"} 
                  value={form.password} 
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-5 pr-12 py-4 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-[#0D2B6B] focus:ring-4 focus:ring-blue-50 transition-all" 
                  placeholder="••••••••" 
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0D2B6B] transition-colors"
                >
                  {showPass ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  )}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all transform active:scale-[0.98] shadow-xl shadow-blue-900/10 hover:shadow-blue-900/20 disabled:opacity-70 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #0D2B6B, #1A4FA0)' }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In to Portal'
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100">
            <p className="text-center text-[11px] text-slate-400 font-medium leading-relaxed">
              New employee? Use the registration link sent to your corporate email. 
              Contact <a href="#" className="text-blue-600 hover:underline">HR Support</a> if you haven't received it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

