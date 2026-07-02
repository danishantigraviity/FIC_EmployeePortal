import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import logoImg from '../assets/logo.png';
import SupportModal from '../components/common/SupportModal';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [form, setForm] = useState({ phone: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState('');
  const [showSupport, setShowSupport] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const isValid = form.phone.length === 10 && form.password.length >= 8 && form.password === form.confirmPassword;

  useEffect(() => {
    if (!token) { setError('No registration token found.'); setValidating(false); return; }
    authAPI.validateToken(token)
      .then(({ data }) => setUserInfo(data.data))
      .catch(err => setError(err.response?.data?.message || 'Invalid token'))
      .finally(() => setValidating(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    try {
      await authAPI.register({ token, phone: form.phone, password: form.password, name: userInfo.name, email: userInfo.email });
      setIsRegistered(true);
      toast.success('Registration completed successfully.');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  if (validating) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <div className="animate-spin w-12 h-12 border-4 rounded-full" style={{ borderColor: '#E2E8F0', borderTopColor: '#0D2B6B' }} />
      <p className="mt-4 text-slate-500 font-medium animate-pulse">Verifying Invitation...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
      <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/60 p-10 max-w-md w-full text-center border border-slate-100">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="text-red-500 font-black text-2xl">!</div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2 font-poppins">Invitation Expired</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">{error}</p>
        <button onClick={() => navigate('/login')} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
          Back to Login
        </button>
      </div>
    </div>
  );

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
              Join the <span className="text-[#F5C518] relative">future<span className="absolute bottom-1 left-0 w-full h-1 bg-yellow-400/20 rounded-full" /></span> of Forge India.
            </h1>
            <p className="text-blue-100/60 text-lg leading-relaxed font-medium">
              You've been invited to join our elite workforce. Complete your registration to start your journey with us.
            </p>
          </div>

          {/* Registration Info */}
          <div className="mt-auto space-y-6">
            <div className="p-6 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-md">
              <p className="text-[10px] font-black text-blue-300 uppercase tracking-[0.3em] mb-4">Official Invitation</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#F5C518] rounded-2xl flex items-center justify-center text-[#0D2B6B] font-black text-xl shadow-lg">
                  {userInfo?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{userInfo?.name}</p>
                  <p className="text-xs text-blue-200/60 truncate">{userInfo?.email}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 text-blue-300/30 text-[9px] font-black uppercase tracking-[0.4em]">
            FIC Secure Registration Gateway • v2.0.4
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (REGISTRATION FORM) ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Subtle background blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/50 rounded-full blur-[100px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-slate-100 rounded-full blur-[80px] -ml-40 -mb-40" />
        
        <div className="w-full max-w-[540px] relative">
          <div className="bg-white rounded-[32px] shadow-[0_32px_80px_-16px_rgba(13,43,107,0.12)] p-10 sm:p-14 border border-slate-50">
            {isRegistered ? (
              <div className="text-center py-12 space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-100/60 border border-emerald-100">
                  <svg className="w-10 h-10 text-emerald-500 animate-in stroke-dash" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" className="animate-dash" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900 font-poppins">Registration Completed Successfully</h3>
                  <p className="text-slate-400 text-sm font-semibold">Redirecting to login portal...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile Branding */}
                <div className="lg:hidden flex flex-col items-center mb-12">
                  <div className="p-2 bg-white rounded-xl shadow-lg border border-slate-100 mb-4">
                    <img src={logoImg} alt="Logo" className="w-8 h-8 object-contain" />
                  </div>
                  <span className="text-xl font-black tracking-tighter text-[#0D2B6B]">FORGE<span className="text-[#F5C518]">INDIA</span></span>
                </div>

                <div className="mb-10">
                  <h2 className="text-3xl font-bold font-poppins tracking-tight text-slate-900">
                    <span style={{ color: '#0D2B6B' }}>Complete</span> <span style={{ color: '#F5C518' }}>Registration</span>
                  </h2>
                  <p className="text-slate-400 text-sm mt-3 font-medium">Set up your secure credentials to access the portal.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-7">
                  {/* Phone Input */}
                  <div className="group">
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Phone Number</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none pr-3 border-r border-slate-200 group-focus-within:border-blue-300 transition-colors">
                        <svg className="w-5 h-3.5 rounded-[2px] shadow-sm border border-slate-100" viewBox="0 0 640 480">
                          <rect width="640" height="160" fill="#FF9933" />
                          <rect y="160" width="640" height="160" fill="#FFFFFF" />
                          <rect y="320" width="640" height="160" fill="#138808" />
                          <circle cx="320" cy="240" r="40" fill="none" stroke="#000080" strokeWidth="4"/>
                        </svg>
                        <span className="text-sm font-bold text-slate-400 group-focus-within:text-blue-500 transition-colors">+91</span>
                      </div>
                      <input 
                        type="tel" 
                        value={form.phone} 
                        onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-24 pr-4 py-4 text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-300" 
                        placeholder="98765 43210" 
                        required 
                      />
                    </div>
                  </div>

                  {/* Password Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Create Password</label>
                      <div className="relative">
                        <input 
                          type={showPass ? "text" : "password"} 
                          value={form.password} 
                          onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all pr-12 placeholder:text-slate-300" 
                          placeholder="••••••••" 
                          required 
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors">
                          {showPass ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Confirm Password</label>
                      <div className="relative">
                        <input 
                          type={showConfirmPass ? "text" : "password"} 
                          value={form.confirmPassword} 
                          onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all pr-12 placeholder:text-slate-300" 
                          placeholder="••••••••" 
                          required 
                        />
                        <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors">
                          {showConfirmPass ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Strength Indicator */}
                  <div className="flex items-center gap-2 px-1">
                    {[1, 2, 3].map((s, i) => {
                      const filled = (i === 0 && form.password.length >= 8) || 
                                    (i === 1 && form.password.length >= 8 && /[A-Z]/.test(form.password) && /[0-9]/.test(form.password)) ||
                                    (i === 2 && form.password.length >= 10);
                      return <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${filled ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'bg-slate-100'}`} />;
                    })}
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Strength</span>
                  </div>

                  <button 
                    type="submit" 
                    disabled={!isValid || loading}
                    className="w-full h-[58px] rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all duration-300 transform active:scale-[0.98] flex items-center justify-between px-6 group/btn relative overflow-hidden mt-4 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none"
                    style={{ 
                      background: isValid ? 'linear-gradient(135deg, #0B2E6D, #1E5EFF)' : '#94A3B8',
                      boxShadow: isValid ? '0 10px 25px -5px rgba(30, 94, 255, 0.3), 0 0 15px rgba(30, 94, 255, 0.1)' : 'none'
                    }}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 opacity-80 group-hover/btn:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
                    </div>
                    <div>
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5 transform group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      )}
                    </div>
                  </button>
                </form>
              </>
            )}

            <div className="mt-12 pt-10 border-t border-slate-50 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed px-4">
                Trouble signing up? <button onClick={() => setShowSupport(true)} className="text-blue-600 hover:text-blue-700 transition-colors">HR Support</button>
              </p>
            </div>
          </div>
        </div>
      </div>
      <SupportModal isOpen={showSupport} onClose={() => setShowSupport(false)} />
    </div>
  );
}
