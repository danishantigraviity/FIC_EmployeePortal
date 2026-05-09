import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
      toast.success('Reset link sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
      <div className="w-full max-w-[440px] bg-white rounded-[32px] shadow-2xl shadow-slate-900/10 p-8 sm:p-12 border border-white">
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 font-poppins tracking-tight">Forgot Password?</h2>
          <p className="text-slate-400 text-sm mt-2">No worries! Enter your email and we'll send you a secure link to reset it.</p>
        </div>

        {sent ? (
          <div className="text-center space-y-6">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700 text-sm font-medium">
              We've sent a password reset link to <span className="font-bold">{email}</span>. Please check your inbox.
            </div>
            <p className="text-xs text-slate-400">Didn't receive the email? Check your spam folder or try again in a few minutes.</p>
            <Link to="/login" className="block w-full py-4 rounded-2xl text-sm font-bold text-[#0D2B6B] bg-slate-100 hover:bg-slate-200 transition-all">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Work Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-[#0D2B6B] focus:ring-4 focus:ring-blue-50 transition-all" 
                placeholder="name@company.com" 
                required 
              />
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
                  Sending Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>

            <Link to="/login" className="block text-center text-sm font-bold text-slate-500 hover:text-[#0D2B6B] transition-colors">
              Remembered? Sign In
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
