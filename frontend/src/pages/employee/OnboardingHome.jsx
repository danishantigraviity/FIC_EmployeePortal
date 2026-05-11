import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { profileAPI } from '../../services/api';
import toast from 'react-hot-toast';

const STEPS = [
  {
    step: 1, label: 'Personal Profile', sub: 'Fill in your personal details, address & emergency contact',
    path: '/onboarding/profile', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    ),
    fields: ['Date of birth', 'Aadhaar & PAN', 'Address', 'Emergency contact'],
  },
  {
    step: 2, label: 'Education', sub: 'Add your academic qualifications and degrees',
    path: '/onboarding/education', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
    ),
    fields: ['Degree & specialization', 'College / university', 'Year of passing', 'Percentage / CGPA'],
  },
  {
    step: 3, label: 'Work Experience', sub: 'List your previous employment history',
    path: '/onboarding/experience', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
    ),
    fields: ['Company & role', 'Duration', 'Skills used', 'Description'],
  },
  {
    step: 4, label: 'Upload Documents', sub: 'Upload required identity and qualification documents',
    path: '/onboarding/documents', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    ),
    fields: ['Aadhaar card', 'PAN card', 'Resume / CV', 'Profile photo'],
  },
  {
    step: 5, label: 'Bank Details', sub: 'Add your salary and payment information',
    path: '/onboarding/bank', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
    ),
    fields: ['Bank Name', 'Account Number', 'IFSC Code', 'Passbook Copy'],
  },
];

const STATUS_CONFIG = {
  invited:    { label: 'Invite Accepted',  color: '#3B82F6', bg: '#EFF6FF',  msg: 'Please complete all steps below to submit your profile for HR review.' },
  registered: { label: 'Profile Setup',    color: '#8B5CF6', bg: '#F5F3FF',  msg: 'You are in the process of completing your onboarding. Fill in all sections.' },
  pending:    { label: 'Under HR Review',  color: '#D97706', bg: '#FFFBEB',  msg: 'Your profile has been submitted and is being reviewed by HR. We\'ll notify you soon.' },
  approved:   { label: 'Approved!',        color: '#059669', bg: '#ECFDF5',  msg: 'Congratulations! Your profile has been approved. Welcome to Forge India!' },
  rejected:   { label: 'Action Required',  color: '#DC2626', bg: '#FEF2F2',  msg: 'Your profile needs updates. Please review and re-submit your information.' },
};

export default function OnboardingHome() {
  const { user, updateUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const completion = user?.profileCompletion || 0;
  const status = STATUS_CONFIG[user?.status] || STATUS_CONFIG.registered;

  const handleSubmit = async () => {
    if (completion < 100) return toast.error('Please complete all steps to 100% first');
    
    setSubmitting(true);
    try {
      const { data } = await profileAPI.submit();
      updateUser({ status: data.status });
      toast.success('Profile submitted successfully!');
    } catch (err) {
      // Global handler takes care of toast
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* ── Welcome Hero Banner ── */}
      <div className="relative rounded-[32px] p-8 sm:p-10 text-white overflow-hidden shadow-2xl shadow-blue-900/20"
        style={{ background: 'linear-gradient(135deg, #0D2B6B 0%, #1A4FA0 50%, #2563EB 100%)' }}>
        
        {/* Decorative Glass Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              Onboarding Journey
            </div>
            
            <div>
              <h1 className="text-4xl sm:text-5xl font-poppins font-bold tracking-tight mb-3">
                Hello, {user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-blue-100/80 text-base sm:text-lg max-w-md leading-relaxed">
                Welcome to the Forge India family. Let's get your professional record set up in just a few steps.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
               <div className="px-4 py-2 rounded-xl bg-white text-blue-900 text-xs font-bold shadow-lg shadow-white/10">
                {status.label}
              </div>
              <div className="px-4 py-2 rounded-xl bg-blue-800/40 backdrop-blur-sm border border-white/10 text-xs font-medium text-white/90">
                Member since {new Date(user?.createdAt).getFullYear()}
              </div>
            </div>
          </div>

          {/* Premium Progress Visualizer */}
          <div className="flex-shrink-0 relative group">
            <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
            <div className="relative w-32 h-32 sm:w-40 sm:h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6"/>
                <circle cx="50" cy="50" r="44" fill="none" stroke="#F5C518" strokeWidth="6"
                  strokeDasharray="276.46"
                  strokeDashoffset={276.46 - (completion / 100) * 276.46}
                  strokeLinecap="round" className="transition-all duration-1000 ease-out"/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl sm:text-4xl font-bold text-white tracking-tighter">{completion}%</div>
                <div className="text-[10px] font-black text-white/50 uppercase tracking-widest">Complete</div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className="relative mt-10 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-start gap-4">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01" /></svg>
          </div>
          <p className="text-sm text-blue-50/90 leading-relaxed italic">
            "{status.msg}"
          </p>
        </div>
      </div>

      {/* ── Steps Checklist ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-poppins font-bold text-slate-800">Your Checklist</h2>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {STEPS.filter((_, i) => user?.completedSteps?.[['profile', 'education', 'experience', 'documents', 'bank'][i]]).length} / 5 Done
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {STEPS.map((s, i) => {
            const stepKeys = ['profile', 'education', 'experience', 'documents', 'bank'];
            const isDone = user?.completedSteps?.[stepKeys[i]];
            
            return (
              <Link key={s.step} to={s.path}
                className={`group relative flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-[24px] border transition-all duration-300 ${
                  isDone 
                    ? 'bg-white border-slate-100 opacity-80 hover:opacity-100' 
                    : 'bg-white border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 hover:-translate-y-1'
                }`}>
                
                {/* Step Icon Container */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isDone 
                    ? 'bg-green-50 text-green-500 ring-4 ring-green-50/50' 
                    : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:ring-4 group-hover:ring-blue-50/50'
                }`}>
                  {isDone ? (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                  ) : s.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isDone ? 'text-green-500' : 'text-blue-600'}`}>
                      Step {s.step}
                    </span>
                    {isDone && (
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[9px] font-bold uppercase tracking-wider">Completed</span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-900 transition-colors">{s.label}</h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-lg">{s.sub}</p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {s.fields.map(f => (
                      <span key={f} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 border border-slate-100 group-hover:bg-blue-50/50 group-hover:border-blue-100 transition-colors">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex-shrink-0 w-full sm:w-auto flex justify-end">
                  <div className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isDone 
                      ? 'text-slate-400 group-hover:text-green-600' 
                      : 'bg-slate-900 text-white shadow-lg shadow-slate-900/10 group-hover:bg-blue-600 group-hover:shadow-blue-600/20'
                  }`}>
                    {isDone ? 'Review Details' : 'Continue →'}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Alerts ── */}
      <div className="pt-6">
        {user?.status === 'pending' && (
          <div className="p-6 rounded-[24px] bg-amber-50/50 border border-amber-100 flex gap-5 items-start">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shadow-inner flex-shrink-0">
              <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-amber-900 text-base mb-1">Application Under Review</h4>
              <p className="text-amber-800/70 text-sm leading-relaxed">
                Your profile has been submitted and is currently being verified by the HR team. 
                You will receive an automated email as soon as your account is approved or if any action is needed.
              </p>
            </div>
          </div>
        )}
        
        {user?.status === 'approved' && (
          <div className="p-6 rounded-[24px] bg-green-50/50 border border-green-100 flex gap-5 items-start">
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center shadow-inner flex-shrink-0">
              <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-green-900 text-base mb-1">Onboarding Approved</h4>
              <p className="text-green-800/70 text-sm leading-relaxed">
                Great news! Your account has been approved by HR. Welcome aboard! 
                Please wait for further instructions from your department head regarding your joining date and orientation.
              </p>
            </div>
          </div>
        )}

        {!['pending','approved'].includes(user?.status) && (
          <div className="p-8 rounded-[32px] bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="relative z-10 text-center md:text-left">
              <h4 className="text-xl font-bold mb-2">Ready to submit?</h4>
              <p className="text-slate-400 text-sm max-w-sm">
                Ensure all sections are complete. You can submit your profile for final HR approval once you reach 100%.
              </p>
            </div>
            <button 
              onClick={handleSubmit}
              disabled={completion < 100 || submitting}
              className={`relative z-10 px-8 py-3 rounded-2xl text-sm font-bold transition-all shadow-xl flex items-center gap-3 ${
              completion === 100 
                ? 'bg-yellow-400 text-blue-900 hover:scale-105 active:scale-95' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}>
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-900/30 border-t-blue-900 rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit for Review'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
