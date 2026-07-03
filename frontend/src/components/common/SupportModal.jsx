import { useState, useMemo } from 'react';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '../../constants/support';

const HELP_TOPICS = [
  {
    category: 'Document Upload',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    items: [
      { q: 'What file formats are supported?', a: 'We support PDF, JPEG, and PNG formats. Maximum file size is 10MB.' },
      { q: 'My document is being rejected.', a: 'Ensure the document is clear, well-lit, and the text is readable. For identity docs like Aadhaar/PAN, ensure the numbers match your profile.' },
      { q: 'How to upload multiple pages?', a: 'Please combine multiple pages into a single PDF file before uploading.' }
    ]
  },
  {
    category: 'Account & Access',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    items: [
      { q: 'I forgot my password.', a: 'Use the "Forgot Password" link on the login page to receive a reset link via email.' },
      { q: 'Registration link expired.', a: 'Please contact HR to re-issue your onboarding invitation link.' },
      { q: 'Can I change my email?', a: 'Your work email is set by HR and cannot be changed by the user.' }
    ]
  },
  {
    category: 'Onboarding Status',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    items: [
      { q: 'How long does verification take?', a: 'Typically, HR reviews documents within 24-48 business hours.' },
      { q: 'What are the steps?', a: 'Onboarding consists of 5 steps: Profile, Education, Experience, Documents, and Bank Details.' },
      { q: 'Can I start working before approval?', a: 'Please coordinate with your manager for your official start date.' }
    ]
  }
];

export default function SupportModal({ isOpen, onClose }) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('FAQ'); // FAQ or CONTACT

  const filteredTopics = useMemo(() => {
    if (!search) return HELP_TOPICS;
    return HELP_TOPICS.map(cat => ({
      ...cat,
      items: cat.items.filter(i => 
        i.q.toLowerCase().includes(search.toLowerCase()) || 
        i.a.toLowerCase().includes(search.toLowerCase())
      )
    })).filter(cat => cat.items.length > 0);
  }, [search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-[0_40px_100px_-20px_rgba(13,43,107,0.2)] relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0D2B6B] p-8 sm:p-10 relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400/10 rounded-full -ml-16 -mb-16 blur-2xl" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="p-3 bg-white rounded-2xl shadow-xl mb-4">
              <svg className="w-8 h-8 text-[#0D2B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white font-poppins tracking-tight">How can we help?</h2>
            <p className="text-blue-200/60 text-xs font-bold uppercase tracking-[0.2em] mt-2">Forge India Support Center</p>
          </div>

          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-white/30 hover:text-white hover:bg-white/10 rounded-xl transition-all">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 flex-shrink-0">
          {['FAQ', 'Contact HR'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${
                activeTab === tab ? 'text-[#0D2B6B]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#F5C518] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar">
          {activeTab === 'FAQ' ? (
            <div className="space-y-10">
              {/* Search Bar */}
              <div className="relative group">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for help topics..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-5 py-4 text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-300"
                />
              </div>

              {/* Topics */}
              {filteredTopics.length > 0 ? (
                filteredTopics.map((cat, i) => (
                  <div key={i} className="animate-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        {cat.icon}
                      </div>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{cat.category}</h3>
                    </div>
                    <div className="space-y-4">
                      {cat.items.map((item, j) => (
                        <details key={j} className="group bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all overflow-hidden">
                          <summary className="list-none px-5 py-4 flex items-center justify-between cursor-pointer focus:outline-none">
                            <span className="text-sm font-bold text-slate-700 group-open:text-[#0D2B6B]">{item.q}</span>
                            <svg className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                            </svg>
                          </summary>
                          <div className="px-5 pb-5 text-sm text-slate-500 leading-relaxed font-medium border-t border-slate-100 pt-4">
                            {item.a}
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20">
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No results found for "{search}"</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a href={`mailto:${SUPPORT_EMAIL}`} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-blue-200 hover:bg-blue-50/30 transition-all text-center">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-blue-600 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  </div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-1">Email Support</h4>
                  <p className="text-[10px] text-slate-400 font-bold">{SUPPORT_EMAIL}</p>
                </a>
                <a href={`tel:${SUPPORT_PHONE.replace(/[^+\d]/g, '')}`} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-blue-200 hover:bg-blue-50/30 transition-all text-center">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-emerald-600 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  </div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-1">Direct Call</h4>
                  <p className="text-[10px] text-slate-400 font-bold">{SUPPORT_PHONE}</p>
                </a>
              </div>

              <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 rounded-full -mr-16 -mt-16 blur-2xl" />
                <h4 className="text-sm font-black text-[#0D2B6B] uppercase tracking-widest mb-3">Priority Ticket</h4>
                <p className="text-xs text-blue-800/60 font-medium leading-relaxed mb-6">Need a faster response? Open a support ticket and our team will get back to you within 4 hours.</p>
                <button className="px-6 py-3 bg-[#0D2B6B] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Open Support Ticket
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-6 text-center border-t border-slate-100 flex-shrink-0">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">
            FIC Digital Services • Secure Help Center
          </p>
        </div>
      </div>
    </div>
  );
}
