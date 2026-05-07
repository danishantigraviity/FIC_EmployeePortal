import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { login } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [form, setForm] = useState({ phone: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setError('No registration token found.'); setValidating(false); return; }
    authAPI.validateToken(token)
      .then(({ data }) => setUserInfo(data.data))
      .catch(err => setError(err.response?.data?.message || 'Invalid token'))
      .finally(() => setValidating(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authAPI.register({ token, phone: form.phone, password: form.password, name: userInfo.name, email: userInfo.email });
      await login({ email: userInfo.email, password: form.password });
      toast.success('Registration successful! Welcome to the team.');
      navigate('/');
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC]" style={{ backgroundImage: 'radial-gradient(at 0% 0%, #E0E7FF 0, transparent 50%), radial-gradient(at 100% 0%, #F1F5F9 0, transparent 50%)' }}>
      <div className="bg-white rounded-[24px] shadow-2xl shadow-slate-200/50 w-full max-w-[480px] overflow-hidden border border-white">
        {/* Top Header Section */}
        <div className="bg-[#0D2B6B] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-400/10 rounded-full -ml-12 -mb-12 blur-xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-3xl font-black tracking-tight" style={{ color: '#FFFFFF' }}>FORGE <span style={{ color: '#F5C518' }}>INDIA</span></span>
            </div>
            <p className="text-blue-100/80 text-xs font-bold uppercase tracking-[0.2em]">Employee Onboarding Portal</p>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 font-poppins tracking-tight">Complete Registration</h1>
            <p className="text-slate-500 text-sm mt-1.5">Set up your account to access the portal</p>
          </div>

          {/* Invited User Identity */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 font-bold text-[#0D2B6B] text-lg">
              {userInfo?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{userInfo?.name}</p>
              <p className="text-xs text-slate-500 truncate">{userInfo?.email}</p>
            </div>
            <div className="ml-auto bg-green-50 text-green-600 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-green-100">
              Invited
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Input */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Phone Number</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none pr-3 border-r border-slate-200">
                  <svg className="w-5 h-3.5 rounded-[2px] shadow-sm border border-slate-100" viewBox="0 0 640 480">
                    <rect width="640" height="160" fill="#FF9933" />
                    <rect y="160" width="640" height="160" fill="#FFFFFF" />
                    <rect y="320" width="640" height="160" fill="#138808" />
                    <circle cx="320" cy="240" r="40" fill="none" stroke="#000080" strokeWidth="4"/>
                  </svg>
                  <span className="text-sm font-bold text-slate-400">+91</span>
                </div>
                <input 
                  type="tel" 
                  value={form.phone} 
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setForm(p => ({ ...p, phone: val }));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-24 pr-4 py-4 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-[#0D2B6B] focus:ring-4 focus:ring-blue-50 transition-all" 
                  placeholder="98765 43210" 
                  required 
                />
              </div>
            </div>

            {/* Password Inputs */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Create Password</label>
                <div className="relative">
                  <input 
                    type={showPass ? "text" : "password"} 
                    value={form.password} 
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-[#0D2B6B] focus:ring-4 focus:ring-blue-50 transition-all pr-12" 
                    placeholder="••••••••" 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPass ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    )}
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2 px-1">
                  <div className={`h-1 flex-1 rounded-full ${form.password.length >= 8 ? 'bg-green-400' : 'bg-slate-200'}`} />
                  <div className={`h-1 flex-1 rounded-full ${form.password.length >= 8 && /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) ? 'bg-green-400' : 'bg-slate-200'}`} />
                  <div className={`h-1 flex-1 rounded-full ${form.password.length >= 10 ? 'bg-green-400' : 'bg-slate-200'}`} />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Strength</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Confirm Password</label>
                <div className="relative">
                  <input 
                    type={showConfirmPass ? "text" : "password"} 
                    value={form.confirmPassword} 
                    onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-[#0D2B6B] focus:ring-4 focus:ring-blue-50 transition-all pr-12" 
                    placeholder="••••••••" 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPass ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all transform active:scale-[0.98] shadow-xl shadow-blue-900/10 hover:shadow-blue-900/20 disabled:opacity-70 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #0D2B6B, #1A4FA0)' }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </button>
            </div>
            
            <p className="text-[11px] text-center text-slate-400 font-medium leading-relaxed px-4">
              By completing registration, you agree to the Forge India 
              <a href="#" className="text-blue-600 hover:underline px-1">Terms of Service</a> and 
              <a href="#" className="text-blue-600 hover:underline px-1">Privacy Policy</a>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

