import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DOC_TYPES = [
  { key: 'aadhaar', label: 'Aadhaar Card', accepts: '.jpg,.jpeg,.png,.pdf', desc: 'Front & back scan of Aadhaar card', icon: '🪪' },
  { key: 'pan', label: 'PAN Card', accepts: '.jpg,.jpeg,.png,.pdf', desc: 'Clear scan of PAN card', icon: '💳' },
  { key: 'resume', label: 'Resume / CV', accepts: '.pdf', desc: 'Latest resume in PDF format', icon: '📄' },
  { key: 'profilePhoto', label: 'Profile Photo', accepts: '.jpg,.jpeg,.png', desc: 'Recent passport-size photo', icon: '👤' },
  { key: 'tenthCertificate', label: '10th Certificate', accepts: '.jpg,.jpeg,.png,.pdf', desc: '10th mark sheet or certificate', icon: '🏫' },
  { key: 'twelfthCertificate', label: '12th Certificate', accepts: '.jpg,.jpeg,.png,.pdf', desc: '12th mark sheet or certificate', icon: '🎓' },
  { key: 'degreeProvisional', label: 'Degree Provisional', accepts: '.jpg,.jpeg,.png,.pdf', desc: 'UG provisional certificate', icon: '📜' },
  { key: 'pgProvisional', label: 'PG Provisional', accepts: '.jpg,.jpeg,.png,.pdf', desc: 'PG provisional certificate', optional: true, icon: '🏛️' },
  { key: 'experienceCertificate', label: 'Work Experience', accepts: '.jpg,.jpeg,.png,.pdf', desc: 'Previous employment certificate', optional: true, icon: '💼' },
  { key: 'bankPassbook', label: 'Bank Details', accepts: '.jpg,.jpeg,.png,.pdf', desc: 'Passbook or cancelled cheque', icon: '🏦' },
];

export default function DocumentsPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs] = useState({});
  const [uploading, setUploading] = useState({});

  useEffect(() => {
    documentAPI.get().then(({ data }) => { if (data.data) setDocs(data.data); });
  }, []);

  const handleUpload = async (key, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    setUploading(p => ({ ...p, [key]: true }));
    try {
      const { data } = await documentAPI.upload(key, file);
      setDocs(prev => ({ ...prev, [key]: data.data?.[key] }));
      updateUser({ 
        profileCompletion: data.profileCompletion,
        completedSteps: data.completedSteps
      });
      toast.success('Document uploaded');
      
      if (data.completedSteps?.documents) {
        toast.success('All required documents uploaded!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setUploading(p => ({ ...p, [key]: false })); }
  };

  const handleNext = () => {
    const requiredDocs = DOC_TYPES.filter(d => !d.optional);
    const uploadedCount = requiredDocs.filter(d => docs[d.key]).length;
    if (uploadedCount < requiredDocs.length) {
      toast.error(`Please upload all ${requiredDocs.length} required documents`);
      return;
    }
    navigate('/onboarding/bank');
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest">
            Step 4 <span className="opacity-30">/</span> 5
          </div>
          <h1 className="text-3xl font-poppins font-black tracking-tight" style={{ color: '#0D2B6B' }}>
            Required <span style={{ color: '#F5C518' }}>Documents</span>
          </h1>
          <p className="text-slate-400 text-xs font-medium">
            Please upload high-quality scans of your documents for verification.
          </p>
        </div>
      </div>

      {/* Guidelines Hero Banner */}
      <div className="relative rounded-2xl p-8 sm:p-10 text-white overflow-hidden shadow-xl shadow-blue-900/10"
        style={{ background: 'linear-gradient(135deg, #0D2B6B 0%, #163B8C 100%)' }}>
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[9px] font-bold uppercase tracking-[0.2em] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            Upload Guidelines
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {[
              { t: "File Size Limit", d: "Each file must be under 5MB for fast processing." },
              { t: "Accepted Formats", d: "JPG, PNG, or PDF files are supported." },
              { t: "Visual Clarity", d: "Ensure text is readable and edges aren't cut off." },
              { t: "Original Scans", d: "Avoid photos of screens or blurred copies." }
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-4 group">
                <div>
                  <h4 className="text-[13px] font-bold text-white mb-0.5">{rule.t}</h4>
                  <p className="text-[11px] text-blue-100/60 font-medium leading-relaxed">{rule.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-12">
        {DOC_TYPES.map(doc => {
          const uploaded = docs[doc.key];
          const isUploading = uploading[doc.key];
          
          return (
            <div key={doc.key} className={`relative bg-white rounded-[20px] border transition-all duration-500 flex flex-col group ${
              uploaded ? 'border-blue-100 shadow-sm shadow-blue-900/5' : 'border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-300/50 hover:border-blue-200 hover:-translate-y-1'
            }`}>
              {/* Card Header with Status */}
              <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-50/50">
                <div>
                  <h4 className="text-[13px] font-bold text-slate-800 tracking-tight">{doc.label}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {doc.optional ? 'Optional' : 'Required'}
                  </p>
                </div>
                
                <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all duration-300 ${
                  uploaded 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' 
                    : 'bg-slate-50 text-slate-400 border-slate-100'
                }`}>
                  {uploaded ? 'Verified' : 'Pending'}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col">
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium mb-6 flex-1">
                  {doc.desc}
                </p>

                {uploaded && (
                  <div className="mb-6 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between group/file">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-[8px] font-black uppercase tracking-tighter">FILE</div>
                      <div className="truncate">
                        <div className="text-[10px] font-bold text-slate-700 truncate">{uploaded.filename || `${doc.label}.pdf`}</div>
                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Ready for Review</div>
                      </div>
                    </div>
                    <a href={uploaded.url} target="_blank" rel="noopener noreferrer" 
                      className="px-3 py-1.5 rounded-lg bg-white text-blue-600 text-[9px] font-black uppercase tracking-widest shadow-sm border border-slate-100 hover:bg-blue-600 hover:text-white transition-all">
                      Preview
                    </a>
                  </div>
                )}

                {/* Progress State */}
                {isUploading && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest animate-pulse">Uploading file...</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Encrypting</span>
                    </div>
                    <div className="w-full h-1 bg-blue-50 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full animate-[progress_2s_ease-in-out_infinite]" />
                    </div>
                  </div>
                )}

                <label className={`w-full h-[52px] flex items-center justify-center gap-3 rounded-2xl font-bold text-[11px] uppercase tracking-[0.15em] transition-all duration-300 border cursor-pointer group/btn overflow-hidden relative ${
                  isUploading ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 
                  uploaded ? 'bg-white border-slate-200 text-slate-500 hover:border-[#F5C518] hover:text-[#0D2B6B]' : 
                  'bg-[#0D2B6B] text-white border-[#0D2B6B] hover:shadow-2xl hover:shadow-blue-900/30'
                }`}>
                  <div className={`absolute inset-0 bg-[#F5C518] transition-transform duration-500 -translate-x-full group-hover/btn:translate-x-0 ${uploaded ? 'opacity-100' : 'opacity-0'}`} />
                  
                  <span className="relative z-10">
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                      <>{uploaded ? 'Replace Document' : 'Upload Securely'}</>
                    )}
                  </span>
                  
                  <input type="file" accept={doc.accepts} className="hidden" disabled={isUploading}
                    onChange={e => handleUpload(doc.key, e.target.files[0])} />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation bottom */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
        <button onClick={() => navigate('/onboarding/experience')}
          className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 transition flex items-center justify-center gap-2 group">
          Back to Experience
        </button>
        <button onClick={handleNext}
          className="w-full sm:w-auto px-10 py-4 text-sm font-bold rounded-2xl shadow-xl shadow-yellow-600/10 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 hover:brightness-105"
          style={{ background: '#F5C518', color: '#0D2B6B' }}>
          Proceed to Bank Details
        </button>
      </div>
    </div>
  );
}
