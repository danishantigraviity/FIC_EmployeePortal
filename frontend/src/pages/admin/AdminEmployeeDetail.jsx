import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_COLOR = {
  approved: { bg: '#ECFDF5', text: '#065F46', dot: '#10B981' },
  pending:  { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B' },
  rejected: { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444' },
  invited:  { bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6' },
  registered:{ bg: '#F5F3FF', text: '#5B21B6', dot: '#8B5CF6' },
};

const TABS = ['Overview', 'Personal', 'Education', 'Experience', 'Documents', 'Bank', 'Action'];

export default function AdminEmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Overview');
  const [actLoading, setActLoading] = useState('');
  const [reason, setReason] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  useEffect(() => {
    adminAPI.getUserDetail(id)
      .then(({ data }) => setDetail(data.data))
      .catch(() => toast.error('Failed to load employee'))
      .finally(() => setLoading(false));

    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [id, pdfBlobUrl]);

  const handleVerify = async (status) => {
    if (status === 'rejected' && !reason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }
    setActLoading(status);
    try {
      await adminAPI.verifyUser(id, { status, rejectionReason: reason });
      toast.success(`Employee ${status} successfully`);
      setDetail(prev => ({ ...prev, user: { ...prev.user, status } }));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActLoading(''); }
  };

  const handleCompile = async () => {
    setIsCompiling(true);
    const toastId = toast.loading('Initializing compilation pipeline...');
    try {
      toast.loading('Merging documents into high-quality PDF...', { id: toastId });
      const { data } = await adminAPI.compilePdf(id);
      
      setDetail(prev => ({ 
        ...prev, 
        docs: { ...prev.docs, compiledPdf: data.data } 
      }));
      
      toast.success('Documents compiled & secured successfully!', { id: toastId });

      // Automatically trigger download
      if (data.data.url) {
        const baseUrl = import.meta.env.VITE_API_URL || '';
        const downloadUrl = data.data.url.startsWith('http') ? data.data.url : `${baseUrl}${data.data.url}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `compiled_docs_${detail.user.name?.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Compilation pipeline failed', { id: toastId });
    } finally {
      setIsCompiling(false);
    }
  };

  const handleSyncDrive = async () => {
    setIsSyncingDrive(true);
    const toastId = toast.loading('Establishing secure connection to Google Drive...');
    try {
      const { data } = await adminAPI.syncDrive(id);
      
      setDetail(prev => ({ 
        ...prev, 
        docs: { ...prev.docs, compiledPdf: data.data } 
      }));
      
      toast.success('Dossier successfully synchronized with Google Drive!', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Drive synchronization failed', { id: toastId });
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleDownload = async (previewOnly = false) => {
    if (!previewOnly) setIsDownloading(true);
    const toastId = !previewOnly ? toast.loading('Preparing your dossier for download...') : null;
    try {
      const response = await adminAPI.downloadPdf(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      
      if (previewOnly) {
        setPdfBlobUrl(blobUrl);
        return;
      }

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `compiled_docs_${detail?.user?.name?.replace(/\s+/g, '_') || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // We don't revoke immediately so the preview stays working if needed, 
      // but usually we'd keep one blobUrl in state
      setPdfBlobUrl(blobUrl);
      toast.success('Dossier downloaded successfully!', { id: toastId });
    } catch (err) {
      const msg = err.response?.data?.message || 'Download failed. Please try again.';
      if (!previewOnly) toast.error(msg, { id: toastId });
    } finally {
      if (!previewOnly) setIsDownloading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-10 h-10 border-4 rounded-full" style={{ borderColor: '#E6F1FB', borderTopColor: '#1A4FA0' }} />
    </div>
  );
  if (!detail) return <div className="text-center text-gray-400 py-20">Employee not found</div>;

  const { user, profile, docs, education = [], experience = [] } = detail;
  const sc = STATUS_COLOR[user.status] || STATUS_COLOR.invited;

  const Field = ({ label, value, mono }) => (
    <div className="py-3 border-b border-gray-50 last:border-0">
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className={`text-sm text-gray-800 font-medium ${mono ? 'font-mono' : ''}`}>{value || <span className="text-gray-300 font-normal">Not provided</span>}</div>
    </div>
  );

  const Card = ({ title, children }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2 rounded-t-2xl" style={{ background: '#0D2B6B' }}>
        <h3 className="font-bold text-[10px] uppercase tracking-[0.15em]" style={{ color: '#F5C518' }}>{title}</h3>
      </div>
      <div className="px-5 py-2">{children}</div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Employees
      </button>

      {/* Hero */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0 shadow-inner"
            style={{ background: 'linear-gradient(135deg, #1A4FA0, #2563EB)', color: '#F5C518' }}>
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="font-rajdhani text-2xl font-bold text-gray-900">{user.name}</h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: sc.bg, color: sc.text }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
              </span>
            </div>
            <div className="text-gray-400 text-sm">{user.email} {user.phone && `• ${user.phone}`}</div>
            <div className="flex flex-wrap items-center gap-4 mt-3">
              {user.department && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-medium">{user.department}</span>
              )}
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${user.profileCompletion || 0}%`, background: user.profileCompletion === 100 ? '#10B981' : '#1A4FA0' }} />
                </div>
                <span className="text-xs text-gray-500 font-medium">{user.profileCompletion || 0}% Complete</span>
              </div>
              <span className="text-xs text-gray-400">Joined {new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
          {['pending', 'registered'].includes(user.status) && (
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => { setTab('Action'); }} className="px-4 py-2 text-xs font-semibold rounded-xl border-2 text-white" style={{ background: '#059669', borderColor: '#059669' }}>
                Review
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-1 mb-5 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 min-w-max px-4 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              tab === t ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            style={tab === t ? { background: '#1A4FA0' } : {}}>
            {t}
          </button>
        ))}
      </div>
      
      {/* PDF Loader Effect */}
      {tab === 'Documents' && docs?.compiledPdf?.url && !pdfBlobUrl && (
        <div className="hidden">
          {(() => {
            if (!pdfBlobUrl && !isDownloading) {
              handleDownload(true); // Quiet fetch for preview
            }
            return null;
          })()}
        </div>
      )}

      {/* ── OVERVIEW ── */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Account Info">
            <Field label="Full Name" value={user.name} />
            <Field label="Email Address" value={user.email} />
            <Field label="Phone Number" value={user.phone} />
            <Field label="Department" value={user.department} />
            <Field label="Employee ID" value={user.employeeId} mono />
            <Field label="Role" value={user.role?.charAt(0).toUpperCase() + user.role?.slice(1)} />
          </Card>
          <Card title="Onboarding Status">
            <div className="py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-medium">Profile Completion</span>
                <span className="text-sm font-bold" style={{ color: '#1A4FA0' }}>{user.profileCompletion || 0}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${user.profileCompletion || 0}%`, background: 'linear-gradient(90deg, #1A4FA0, #2563EB)' }} />
              </div>
            </div>
            <Field label="Current Status" value={user.status?.charAt(0).toUpperCase() + user.status?.slice(1)} />
            <Field label="Registration Date" value={new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} />
            <Field label="Last Updated" value={new Date(user.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} />
            {user.rejectionReason && <Field label="Rejection Reason" value={user.rejectionReason} />}
          </Card>
          <Card title="Education Summary">
            {education.length === 0
              ? <div className="py-4 text-xs text-gray-400 text-center">No education records</div>
              : education.map(e => (
                <div key={e._id} className="py-3 border-b border-gray-50 last:border-0">
                  <div className="text-sm font-medium text-gray-800">{e.degree} — {e.specialization || e.field}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{e.college} • {e.year} {e.percentage && `• ${e.percentage}%`}</div>
                </div>
              ))
            }
          </Card>
          <Card title="Experience Summary">
            {experience.length === 0
              ? <div className="py-4 text-xs text-gray-400 text-center">No experience records</div>
              : experience.map(e => (
                <div key={e._id} className="py-3 border-b border-gray-50 last:border-0">
                  <div className="text-sm font-medium text-gray-800">{e.role} @ {e.companyName}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{e.startYear} – {e.isCurrent ? 'Present' : e.endYear} {e.years && `• ${e.years} yrs`}</div>
                  {e.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {e.skills.map(s => <span key={s} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{s}</span>)}
                    </div>
                  )}
                </div>
              ))
            }
          </Card>
        </div>
      )}

      {/* ── PERSONAL ── */}
      {tab === 'Personal' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Basic Information">
            <Field label="Date of Birth" value={profile?.dob ? new Date(profile.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : null} />
            <Field label="Gender" value={profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : null} />
            <Field 
              label="Aadhaar Number" 
              value={profile?.aadhaarNumber ? `XXXX XXXX ${profile.aadhaarNumber.slice(-4)}` : null} 
              mono 
            />
            <Field 
              label="PAN Number" 
              value={profile?.panNumber ? `${profile.panNumber.slice(0,2)}XXX ${profile.panNumber.slice(5,9)} ${profile.panNumber.slice(-1)}` : null} 
              mono 
            />
          </Card>
          <Card title="Address">
            <Field label="Street" value={profile?.address?.street} />
            <Field label="City" value={profile?.address?.city} />
            <Field label="State" value={profile?.address?.state} />
            <Field label="Pincode" value={profile?.address?.pincode} mono />
            <Field label="Country" value={profile?.address?.country || 'India'} />
          </Card>
          <Card title="Emergency Contact">
            <Field label="Contact Name" value={profile?.emergencyContact?.name} />
            <Field label="Relationship" value={profile?.emergencyContact?.relation} />
            <Field label="Phone Number" value={profile?.emergencyContact?.phone} mono />
          </Card>
        </div>
      )}

      {/* ── EDUCATION ── */}
      {tab === 'Education' && (
        <div className="space-y-4">
          {education.length === 0
            ? <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">No education records submitted yet.</div>
            : education.map((e, i) => (
              <Card key={e._id} title={`Education ${i + 1}`} icon="🎓">
                <div className="grid grid-cols-2 gap-x-8">
                  <Field label="Degree" value={e.degree} />
                  <Field label="Specialization / Field" value={e.specialization || e.field} />
                  <Field label="College / University" value={e.college} />
                  <Field label="Passing Year" value={e.year} />
                  <Field label="Percentage / CGPA" value={e.percentage ? `${e.percentage}%` : null} />
                </div>
              </Card>
            ))
          }
        </div>
      )}

      {/* ── EXPERIENCE ── */}
      {tab === 'Experience' && (
        <div className="space-y-4">
          {experience.length === 0
            ? <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">No experience records submitted yet.</div>
            : experience.map((e, i) => (
              <Card key={e._id} title={`Experience ${i + 1}${e.isCurrent ? ' (Current)' : ''}`}>
                <div className="grid grid-cols-2 gap-x-8">
                  <Field label="Job Title / Role" value={e.role} />
                  <Field label="Company Name" value={e.companyName} />
                  <Field label="Start Year" value={e.startYear} />
                  <Field label="End Year" value={e.isCurrent ? 'Present' : e.endYear} />
                  <Field label="Duration" value={e.years ? `${e.years} year(s)` : null} />
                  <Field label="Current Job" value={e.isCurrent ? 'Yes' : 'No'} />
                </div>
                {e.description && <Field label="Description" value={e.description} />}
                {e.skills?.length > 0 && (
                  <div className="py-3">
                    <div className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Skills</div>
                    <div className="flex flex-wrap gap-1.5">
                      {e.skills.map(s => <span key={s} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: '#EFF6FF', color: '#1E40AF' }}>{s}</span>)}
                    </div>
                  </div>
                )}
              </Card>
            ))
          }
        </div>
      )}

      {/* ── DOCUMENTS ── */}
      {tab === 'Documents' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'aadhaar', label: 'Aadhaar Card' },
            { key: 'pan', label: 'PAN Card' },
            { key: 'resume', label: 'Resume / CV' },
            { key: 'profilePhoto', label: 'Profile Photo' },
            { key: 'tenthCertificate', label: '10th Certificate' },
            { key: 'twelfthCertificate', label: '12th Certificate' },
            { key: 'degreeProvisional', label: 'Degree Provisional' },
            { key: 'pgProvisional', label: 'PG Provisional' },
            { key: 'experienceCertificate', label: 'Experience Certificate' },
            { key: 'bankPassbook', label: 'Bank Passbook / Cheque' },
          ].map(({ key, label }) => {
            const doc = docs?.[key];
            return (
              <div key={key} className={`bg-white rounded-2xl border p-5 transition ${doc?.url ? 'border-green-100' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800 uppercase tracking-tight">{label}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${doc?.url ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {doc?.url ? 'Uploaded' : 'Missing'}
                  </span>
                </div>
                {doc?.url ? (
                  <a href={doc.url?.startsWith('http') ? doc.url : `${import.meta.env.VITE_API_URL || ''}${doc.url}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    View Document
                  </a>
                ) : (
                  <p className="text-xs text-gray-400">Document not yet uploaded by employee.</p>
                )}
                {doc?.uploadedAt && (
                  <div className="text-xs text-gray-300 mt-2">Uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── COMPILED PDF PIPELINE ── */}
        <div className="mt-8">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="px-8 py-7 border-b border-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" 
              style={{ background: 'linear-gradient(90deg, #0D2B6B, #163B8C)' }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  <h3 className="font-poppins font-bold text-white text-sm uppercase tracking-[0.2em]">Compiled Document Pipeline</h3>
                </div>
                <p className="text-[10px] text-white/50 uppercase tracking-widest font-medium">Automatic merging & secure cloud synchronization</p>
              </div>
              <button
                onClick={handleCompile}
                disabled={isCompiling}
                className={`px-8 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2.5 ${
                  isCompiling 
                    ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                    : 'shadow-2xl shadow-yellow-400/20 active:scale-95 hover:scale-[1.02]'
                }`}
                style={!isCompiling ? { background: '#F5C518', color: '#0D2B6B' } : {}}
              >
                {isCompiling ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> RUNNING PIPELINE...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> GENERATE COMPILED PDF</>
                )}
              </button>
            </div>
            
            <div className="p-8">
              {isCompiling ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-3xl border-4 border-slate-50 border-t-blue-600 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-8 h-8 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Processing Secure Pipeline</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Validating assets, merging layers, and synchronizing with Google Drive...</p>
                  </div>
                </div>
              ) : docs?.compiledPdf?.url ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group p-6 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-blue-800 uppercase tracking-[0.2em] mb-0.5">Internal Secure Link</div>
                        <div className="text-xs text-slate-400 font-medium">High-quality production output</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className={`w-full py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm border ${
                          isDownloading
                            ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white border-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white'
                        }`}
                      >
                        {isDownloading ? (
                          <><div className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" /> Downloading...</>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3" />
                            </svg>
                            Download Dossier PDF
                          </>
                        )}
                      </button>
                      
                      {!docs.compiledPdf.driveViewLink && (
                        <button 
                          onClick={handleSyncDrive}
                          disabled={isSyncingDrive}
                          className={`w-full py-3.5 border rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm ${
                            isSyncingDrive 
                              ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white'
                          }`}
                        >
                          {isSyncingDrive ? (
                            <><div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" /> SYNCING...</>
                          ) : (
                            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg> Store in Google Drive</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {docs.compiledPdf.driveViewLink && (
                    <div className="group p-6 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-green-200 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-green-800 uppercase tracking-[0.2em] mb-0.5">Google Drive Sync</div>
                          <div className="text-xs text-slate-400 font-medium">Encrypted cloud backup secured</div>
                        </div>
                      </div>
                      <a href={docs.compiledPdf.driveViewLink} target="_blank" rel="noopener noreferrer" 
                        className="w-full py-3.5 bg-white border border-green-100 text-green-700 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm">
                        Open in Google Drive
                      </a>
                    </div>
                  )}

                  {/* ── PDF PREVIEWER ── */}
                  <div className="md:col-span-2 mt-4">
                    <div className="bg-slate-900 rounded-3xl overflow-hidden border-8 border-slate-900 shadow-2xl">
                      <div className="px-4 py-3 bg-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-400" />
                          <div className="w-3 h-3 rounded-full bg-yellow-400" />
                          <div className="w-3 h-3 rounded-full bg-green-400" />
                          <span className="ml-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dossier Preview</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">SECURE_VIEWER_v1.0</span>
                      </div>
                      <iframe 
                        src={
                          pdfBlobUrl || (
                            docs.compiledPdf.url?.startsWith('http') 
                              ? docs.compiledPdf.url 
                              : `${import.meta.env.VITE_API_URL || ''}${docs.compiledPdf.url}`
                          )
                        }
                        className="w-full h-[600px] bg-white border-0"
                        title="Compiled Document Preview"
                      />
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 flex items-center justify-center gap-4 py-4 border-t border-slate-50 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Last compiled: {new Date(docs.compiledPdf.generatedAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">📑</div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-2">Pipeline Ready</h4>
                  <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto leading-relaxed">
                    Click the button above to merge all verified identity and academic documents into a single dossier.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    )}

      {/* ── BANK ── */}
      {tab === 'Bank' && (
        <div className="max-w-2xl mx-auto">
          <Card title="Salary & Bank Details">
            <Field label="Bank Name" value={profile?.bankDetails?.bankName} />
            <Field label="Account Number" value={profile?.bankDetails?.accountNumber} mono />
            <Field label="IFSC Code" value={profile?.bankDetails?.ifscCode} mono />
            
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-1">Payroll Note</div>
              <p className="text-xs text-blue-600 leading-relaxed">
                These details are used for salary processing and expense reimbursements. Ensure accuracy before final approval.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* ── BANK DETAILS ── */}
      {tab === 'Bank' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Banking Information" icon="🏦">
            <Field label="Bank Name" value={profile?.bankDetails?.bankName} />
            <Field label="IFSC Code" value={profile?.bankDetails?.ifscCode} mono />
            <Field 
              label="Account Number" 
              value={profile?.bankDetails?.accountNumber ? `XXXX XXXX ${profile.bankDetails.accountNumber.slice(-4)}` : 'Not provided'} 
              mono 
            />
          </Card>
          <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 text-xl">🛡️</div>
            <div>
              <h4 className="text-sm font-bold text-blue-900 mb-1">Payroll Verification</h4>
              <p className="text-xs text-blue-800/60 leading-relaxed">
                These details will be used for automated monthly salary disbursements. 
                Ensure the name in the profile matches the bank account holder name to prevent payment failures.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── ACTION ── */}
      {tab === 'Action' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-1">Verification Decision</h3>
            <p className="text-xs text-gray-400 mb-5">Review the employee's submitted information before making a decision.</p>

            <div className="mb-5 p-4 rounded-xl" style={{ background: '#F8FAFF', border: '1px solid #DBEAFE' }}>
              <div className="text-xs font-semibold text-blue-700 mb-2">Current Status</div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: sc.dot }} />
                <span className="text-sm font-medium" style={{ color: sc.text }}>{user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}</span>
              </div>
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-600 block mb-2">Rejection Reason <span className="text-gray-400 font-normal">(required when rejecting)</span></label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
                placeholder="Enter a clear reason for rejection that will be communicated to the employee..."
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-400 resize-none" />
            </div>

            <div className="flex gap-3">
              <button onClick={() => handleVerify('approved')} disabled={!!actLoading || user.status === 'approved'}
                className="flex-1 py-3 text-sm font-bold text-white rounded-xl transition disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: '#059669' }}>
                {actLoading === 'approved'
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Approving...</>
                  : <>Approve Employee</>
                }
              </button>
              <button onClick={() => handleVerify('rejected')} disabled={!!actLoading || user.status === 'rejected'}
                className="flex-1 py-3 text-sm font-bold text-white rounded-xl transition disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: '#DC2626' }}>
                {actLoading === 'rejected'
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Rejecting...</>
                  : <>Reject Employee</>
                }
              </button>
            </div>

            {user.status === 'approved' && (
              <div className="mt-4 p-3 rounded-xl bg-green-50 text-green-700 text-xs font-medium text-center">
                ✅ This employee has already been approved.
              </div>
            )}
            {user.status === 'rejected' && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium text-center">
                ❌ This employee has been rejected. Reason: {user.rejectionReason || 'Not specified'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
