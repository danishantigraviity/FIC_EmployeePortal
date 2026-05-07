import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const steps = [
  { label: 'Personal Profile', path: '/profile' },
  { label: 'Education Details', path: '/education' },
  { label: 'Work Experience', path: '/experience' },
  { label: 'Upload Documents', path: '/documents' },
];

const statusConfig = {
  invited: { label: 'Invited', color: '#3B82F6', bg: '#EFF6FF' },
  registered: { label: 'Registered', color: '#8B5CF6', bg: '#F5F3FF' },
  pending: { label: 'Pending Review', color: '#D97706', bg: '#FFFBEB' },
  approved: { label: 'Approved', color: '#059669', bg: '#ECFDF5' },
  rejected: { label: 'Action Required', color: '#DC2626', bg: '#FEF2F2' },
};

export default function DashboardHome() {
  const { user } = useAuth();
  const status = statusConfig[user?.status] || statusConfig.registered;
  const completion = user?.profileCompletion || 0;

  return (
    <div className="max-w-4xl">
      {/* Welcome */}
      <div className="rounded-2xl p-6 mb-6 text-white" style={{ background: 'linear-gradient(135deg, #0D3070, #1A4FA0)' }}>
        <div className="flex items-center justify-between">
          <div>
          <div>
            <h1 className="text-3xl font-poppins font-black tracking-tight mb-1">
              Welcome, <span style={{ color: '#F5C518' }}>{user?.name?.split(' ')[0]}!</span>
            </h1>
            <p className="text-blue-200 text-sm">Complete your onboarding to join the Forge India family.</p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium" style={{ background: status.bg, color: status.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }}></span>
              {status.label}
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-semibold" style={{ color: '#F5C518' }}>{completion}%</div>
            <div className="text-blue-200 text-xs mt-1">Profile Complete</div>
            <div className="mt-3 w-32 h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${completion}%`, background: '#F5C518' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Steps */}
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Onboarding Checklist</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {steps.map((step, i) => (
          <Link to={step.path} key={step.label}
            className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center gap-5 hover:border-[#F5C518] hover:shadow-xl transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-1 h-full bg-[#0D2B6B] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-50 text-[18px] font-black group-hover:bg-[#F5C518] group-hover:text-[#0D2B6B] transition duration-300" style={{ color: '#0D2B6B' }}>
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="font-poppins font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Step {i + 1}</div>
              <div className="text-slate-800 font-bold text-base tracking-tight">{step.label}</div>
            </div>
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-[#0D2B6B] transition">Open</div>
          </Link>
        ))}
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div>
            <p className="text-sm font-medium text-amber-800">Complete your profile for HR review</p>
            <p className="text-xs text-amber-600 mt-0.5">All sections must be filled before your profile can be submitted for admin approval.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
