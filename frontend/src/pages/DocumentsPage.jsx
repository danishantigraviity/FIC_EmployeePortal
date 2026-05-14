import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentAPI, profileAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

const DOC_TYPES = [
  { key: 'aadhaar', label: 'Aadhaar Card', accepts: '.jpg,.jpeg,.png,.pdf', desc: 'Front & back scan of Aadhaar card', identity: true },
  { key: 'pan',     label: 'PAN Card',     accepts: '.jpg,.jpeg,.png,.pdf', desc: 'Clear scan of PAN card',           identity: true },
  { key: 'resume',          label: 'Resume / CV',         accepts: '.pdf',              desc: 'Latest resume in PDF format' },
  { key: 'profilePhoto',    label: 'Profile Photo',       accepts: '.jpg,.jpeg,.png',   desc: 'Recent passport-size photo' },
  { key: 'tenthCertificate',    label: '10th Certificate',    accepts: '.jpg,.jpeg,.png,.pdf', desc: '10th mark sheet or certificate' },
  { key: 'twelfthCertificate',  label: '12th Certificate',    accepts: '.jpg,.jpeg,.png,.pdf', desc: '12th mark sheet or certificate' },
  { key: 'degreeProvisional',   label: 'Degree Provisional',  accepts: '.jpg,.jpeg,.png,.pdf', desc: 'UG provisional certificate' },
  { key: 'pgProvisional',       label: 'PG Provisional',      accepts: '.jpg,.jpeg,.png,.pdf', desc: 'PG provisional certificate', optional: true },
  { key: 'experienceCertificate', label: 'Work Experience',   accepts: '.jpg,.jpeg,.png,.pdf', desc: 'Previous employment certificate', optional: true },
  { key: 'bankPassbook',        label: 'Bank Details',        accepts: '.jpg,.jpeg,.png,.pdf', desc: 'Passbook or cancelled cheque' },
];

// ─── Client-side format validators ───────────────────────────────────────────
const AADHAAR_RE = /^\d{4}[\s]?\d{4}[\s]?\d{4}$/;
const PAN_RE     = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

function clientSideIdentityCheck(key, file, profile) {
  // File size
  if (file.size > 5 * 1024 * 1024) return 'File size must be under 5 MB.';
  if (file.size < 5 * 1024)        return 'File is too small — please upload a clear, original scan.';

  // MIME check
  const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowed.includes(file.type)) return 'Only JPG, PNG, or PDF files are accepted.';

  if (key === 'aadhaar' && profile) {
    if (!profile.aadhaarNumber) return 'Save your Aadhaar number in Step 1 (Profile) first.';
    if (!AADHAAR_RE.test(profile.aadhaarNumber.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim())) {
      return 'Aadhaar number in your profile appears invalid. Please correct it in Step 1.';
    }
  }

  if (key === 'pan' && profile) {
    if (!profile.panNumber) return 'Save your PAN number in Step 1 (Profile) first.';
    if (!PAN_RE.test(profile.panNumber.toUpperCase())) {
      return 'PAN number in your profile appears invalid. Please correct it in Step 1.';
    }
  }

  return null; // no error
}

// ─── ValidationBadge component ────────────────────────────────────────────────
function ValidationBadge({ state }) {
  if (state === 'validating') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-black uppercase tracking-widest animate-pulse">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
      Scanning…
    </span>
  );
  if (state === 'valid') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-black uppercase tracking-widest">
      ✓ Verified
    </span>
  );
  if (state === 'error') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-[9px] font-black uppercase tracking-widest">
      ✕ Rejected
    </span>
  );
  return null;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs]         = useState({});
  const [uploading, setUploading] = useState({});
  const [errors, setErrors]     = useState({});   // key → error string
  const [valState, setValState] = useState({});   // key → 'validating'|'valid'|'error'
  const [profile, setProfile]   = useState(null);
  const inputRefs               = useRef({});

  // Load existing docs + profile on mount
  useEffect(() => {
    documentAPI.get().then(({ data }) => { if (data.data) setDocs(data.data); });
    profileAPI.get().then(({ data })  => { if (data.data) setProfile(data.data); }).catch(() => {});
  }, []);

  const clearError = (key) => setErrors(p => ({ ...p, [key]: null }));

  const handleUpload = async (key, file) => {
    if (!file) return;
    clearError(key);
    setValState(p => ({ ...p, [key]: null }));

    const docType = DOC_TYPES.find(d => d.key === key);

    // ── Client-side pre-check ─────────────────────────────────────────────────
    if (docType.identity) {
      const clientError = clientSideIdentityCheck(key, file, profile);
      if (clientError) {
        setErrors(p => ({ ...p, [key]: clientError }));
        setValState(p => ({ ...p, [key]: 'error' }));
        toast.error(clientError, { duration: 5000 });
        // Reset the file input
        if (inputRefs.current[key]) inputRefs.current[key].value = '';
        return;
      }
      setValState(p => ({ ...p, [key]: 'validating' }));
    }

    setUploading(p => ({ ...p, [key]: true }));
    try {
      const { data } = await documentAPI.upload(key, file);
      setDocs(prev => ({ ...prev, [key]: data.data?.[key] }));
      updateUser({
        profileCompletion: data.profileCompletion,
        completedSteps:    data.completedSteps
      });
      if (docType.identity) {
        setValState(p => ({ ...p, [key]: 'valid' }));
        toast.success(`✅ ${docType.label} validated and uploaded!`);
      } else {
        toast.success('Document uploaded successfully');
      }
      if (data.completedSteps?.documents) {
        toast.success('🎉 All required documents uploaded!');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed. Please try again.';
      setErrors(p => ({ ...p, [key]: msg }));
      if (docType.identity) setValState(p => ({ ...p, [key]: 'error' }));
      toast.error(msg, { duration: 6000 });
      // Reset file input so user can re-select
      if (inputRefs.current[key]) inputRefs.current[key].value = '';
    } finally {
      setUploading(p => ({ ...p, [key]: false }));
    }
  };

  const handleNext = () => {
    const requiredDocs = DOC_TYPES.filter(d => !d.optional);
    const missing = requiredDocs.filter(d => !docs[d.key]);
    if (missing.length > 0) {
      toast.error(`Missing: ${missing.map(d => d.label).join(', ')}`);
      return;
    }
    navigate('/onboarding/bank');
  };

  return (
    <div className="space-y-12 pb-24">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest">
            Step 4 <span className="opacity-30">/</span> 5
          </div>
          <h1 className="text-3xl font-poppins font-black tracking-tight" style={{ color: '#0D2B6B' }}>
            Required <span style={{ color: '#F5C518' }}>Documents</span>
          </h1>
          <p className="text-slate-400 text-xs font-medium">
            Upload high-quality scans. Identity documents are automatically verified.
          </p>
        </div>
      </div>


      {/* ── Upload Guidelines ── */}
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
              { t: 'File Size Limit',      d: 'Each file must be under 5 MB.' },
              { t: 'Accepted Formats',     d: 'JPG, PNG, or PDF only.' },
              { t: 'Identity Validation',  d: 'Aadhaar & PAN are auto-scanned for type and number match.' },
              { t: 'Scanned PDFs',         d: 'If using PDF, ensure it has selectable text. Scanned PDFs should be uploaded as JPG/PNG.' },
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-4">
                <div>
                  <h4 className="text-[13px] font-bold text-white mb-0.5">{rule.t}</h4>
                  <p className="text-[11px] text-blue-100/60 font-medium leading-relaxed">{rule.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Documents Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {DOC_TYPES.map(doc => {
          const uploaded   = docs[doc.key];
          const isUploading = uploading[doc.key];
          const errorMsg   = errors[doc.key];
          const vState     = valState[doc.key];
          const hasError   = !!errorMsg;

          return (
            <div key={doc.key} className={`relative bg-white rounded-[20px] border transition-all duration-500 flex flex-col ${
              hasError
                ? 'border-red-200 shadow-lg shadow-red-100/60 ring-1 ring-red-100'
                : uploaded
                ? 'border-blue-100 shadow-sm shadow-blue-900/5'
                : 'border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-300/50 hover:border-blue-200 hover:-translate-y-1'
            }`}>

              {/* Card Header */}
              <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-50/50">
                <div>
                  <h4 className="text-[13px] font-bold text-slate-800 tracking-tight">{doc.label}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {doc.optional ? 'Optional' : 'Required'}
                    {doc.identity && <span className="ml-2 text-blue-500">• ID Verified</span>}
                  </p>
                </div>

                <div>
                  {doc.identity && vState ? (
                    <ValidationBadge state={vState} />
                  ) : (
                    <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all duration-300 ${
                      uploaded
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                        : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                      {uploaded ? 'Uploaded' : 'Pending'}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col">
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium mb-4 flex-1">
                  {doc.desc}
                </p>

                {/* Error Alert */}
                {hasError && (
                  <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <span className="text-red-500 text-sm mt-0.5 flex-shrink-0">⚠️</span>
                    <div>
                      <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-0.5">Validation Failed</p>
                      <p className="text-[11px] text-red-600 leading-relaxed font-medium">{errorMsg}</p>
                    </div>
                  </div>
                )}

                {/* Uploaded File Preview */}
                {uploaded && !hasError && (
                  <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-[8px] font-black uppercase tracking-tighter">FILE</div>
                      <div className="truncate">
                        <div className="text-[10px] font-bold text-slate-700 truncate">{uploaded.filename || `${doc.label}.pdf`}</div>
                        <div className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider">
                          {doc.identity ? '✓ Validated & Uploaded' : 'Ready for Review'}
                        </div>
                      </div>
                    </div>
                    <a href={uploaded.url} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-white text-blue-600 text-[9px] font-black uppercase tracking-widest shadow-sm border border-slate-100 hover:bg-blue-600 hover:text-white transition-all">
                      Preview
                    </a>
                  </div>
                )}

                {/* Uploading progress & AI Scanning Status */}
                {isUploading && (
                  <div className="mb-4">
                    <Loader 
                      size="sm" 
                      message="Securely Uploading..." 
                    />
                  </div>
                )}

                {/* Upload Button */}
                <label className={`w-full h-[52px] flex items-center justify-center gap-3 rounded-2xl font-bold text-[11px] uppercase tracking-[0.15em] transition-all duration-300 border cursor-pointer group/btn overflow-hidden relative ${
                  isUploading
                    ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                    : hasError
                    ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20'
                    : uploaded
                    ? 'bg-white border-slate-200 text-slate-500 hover:border-[#F5C518] hover:text-[#0D2B6B]'
                    : 'bg-[#0D2B6B] text-white border-[#0D2B6B] hover:shadow-2xl hover:shadow-blue-900/30'
                }`}>
                  <div className={`absolute inset-0 bg-[#F5C518] transition-transform duration-500 -translate-x-full group-hover/btn:translate-x-0 ${(uploaded && !hasError) ? 'opacity-100' : 'opacity-0'}`} />
                  <span className="relative z-10">
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                    ) : hasError ? (
                      '↺ Try Again'
                    ) : uploaded ? (
                      'Replace Document'
                    ) : (
                      'Upload Securely'
                    )}
                  </span>
                  <input
                    type="file"
                    accept={doc.accepts}
                    className="hidden"
                    disabled={isUploading}
                    ref={el => inputRefs.current[doc.key] = el}
                    onChange={e => {
                      clearError(doc.key);
                      handleUpload(doc.key, e.target.files[0]);
                    }}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
        <button onClick={() => navigate('/onboarding/experience')}
          className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 transition flex items-center justify-center gap-2">
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
