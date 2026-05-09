import { useState, useEffect } from 'react';
import { adminAPI, authAPI } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import Select from '../../components/common/Select';
import ConfirmModal from '../../components/common/ConfirmModal';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  approved:   { bg: '#ECFDF5', text: '#065F46', dot: '#10B981' },
  pending:    { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B' },
  rejected:   { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444' },
  invited:    { bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6' },
  registered: { bg: '#F5F3FF', text: '#5B21B6', dot: '#8B5CF6' },
};

const StatCard = ({ label, value, color, sub }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
    <div className="font-poppins text-3xl font-bold" style={{ color }}>{value}</div>
    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{label}</div>
    {sub && <div className="text-[10px] text-gray-400 mt-1">{sub}</div>}
  </div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, invited: 0 });
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', phone: '', department: '' });
  const [inviting, setInviting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, logsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers({ limit: 20 }),
        adminAPI.getActivityLogs(),
      ]);
      setStats(statsRes.data.data);
      setUsers(usersRes.data.data);
      setLogs(logsRes.data.data.slice(0, 8));
    } catch { toast.error('Failed to load dashboard data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    
    // Basic Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteForm.email)) {
      return toast.error('Please enter a valid email address');
    }
    if (inviteForm.phone.length < 10) {
      return toast.error('Phone number must be at least 10 digits');
    }

    setInviting(true);
    const loadingToast = toast.loading('Sending invitation email...');
    
    try {
      const res = await authAPI.createInvite(inviteForm);
      toast.dismiss(loadingToast);
      
      if (res.data.emailWarning) {
        toast.success('Employee added, but email delivery is delayed.');
      } else {
        toast.success('Invite sent successfully!');
      }
      
      setShowInvite(false);
      setInviteForm({ name: '', email: '', phone: '', department: '' });
      loadData();
    } catch (err) {
      toast.dismiss(loadingToast);
      const msg = err.response?.data?.message || 'Failed to send invite. Check backend logs.';
      toast.error(msg, { duration: 5000 });
      console.error('Invite Error:', err);
    } finally {
      setInviting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const tid = toast.loading('Purging employee data...');
    try {
      await adminAPI.deleteUser(deleteId);
      setUsers(prev => prev.filter(u => u._id !== deleteId));
      setStats(prev => ({ ...prev, total: prev.total - 1 }));
      toast.success('Employee record permanently removed', { id: tid });
      setShowDelete(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Purge failed', { id: tid });
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (userId, userName) => {
    const tid = toast.loading('Retrieving employee dossier...');
    try {
      const response = await adminAPI.downloadPdf(userId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dossier_${userName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Dossier downloaded', { id: tid });
    } catch (err) {
      toast.error('Dossier not found or compilation failed', { id: tid });
    }
  };

  const filtered = users.filter(u => {
    const q = filters.search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.department?.toLowerCase().includes(q);
    const matchStatus = !filters.status || u.status === filters.status;
    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-poppins text-2xl sm:text-3xl font-bold">
            <span style={{ color: '#0D2B6B' }}>Admin</span> <span style={{ color: '#F5C518' }}>Dashboard</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage employees, onboarding progress and document approvals</p>
        </div>
        <button onClick={() => setShowInvite(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold rounded-xl shadow-lg shadow-yellow-900/10 transition active:scale-95 hover:brightness-105"
          style={{ background: '#F5C518', color: '#0D2B6B' }}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Generate Invite
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total" value={stats.total} color="#1A4FA0" />
        <StatCard label="Approved" value={stats.approved} color="#059669" />
        <StatCard label="Pending" value={stats.pending} color="#D97706" />
        <StatCard label="Rejected" value={stats.rejected} color="#DC2626" />
        <StatCard label="Invited" value={stats.invited} color="#7C3AED" />
      </div>

      {/* Quick Nav Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/admin/approvals" className="group bg-white rounded-2xl border border-amber-100 p-6 hover:shadow-md transition">
          <div className="text-sm font-bold text-gray-800 uppercase tracking-tight">Pending Approvals</div>
          <div className="text-xs text-amber-600 mt-1 font-semibold">{stats.pending} waiting for review</div>
        </Link>
        <Link to="/admin/employees" className="group bg-white rounded-2xl border border-blue-100 p-6 hover:shadow-md transition">
          <div className="text-sm font-bold text-gray-800 uppercase tracking-tight">Employee Directory</div>
          <div className="text-xs text-blue-600 mt-1 font-semibold">View all {stats.total} staff profiles</div>
        </Link>
        <div className="bg-white rounded-2xl border border-green-100 p-6">
          <div className="text-sm font-bold text-gray-800 uppercase tracking-tight">Approval Rate</div>
          <div className="text-xs text-green-600 mt-1 font-semibold">
            {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% success rate
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-5 border-b border-gray-50 gap-4">
            <h2 className="font-bold text-gray-800">All Employees</h2>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <input
                placeholder="Search..."
                value={filters.search}
                onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
                className="text-xs border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-blue-300 w-full sm:w-48 bg-gray-50/50"
              />
              <Select
                value={filters.status}
                onChange={v => setFilters(p => ({ ...p, status: v }))}
                variant="compact"
                className="w-full sm:w-36"
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'invited', label: 'Invited' },
                  { value: 'registered', label: 'Registered' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-10 h-10 border-4 rounded-full" style={{ borderColor: '#E6F1FB', borderTopColor: '#1A4FA0' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-300 mb-2"><svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg></div>
              <div className="text-gray-400 text-sm font-medium">No employees matching your filters</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    {['Employee', 'Dept.', 'Progress', 'Status', ''].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-gray-400 px-6 py-4 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(u => {
                    const sb = STATUS_BADGE[u.status] || STATUS_BADGE.invited;
                    return (
                      <tr key={u._id} className="hover:bg-blue-50/20 transition group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm"
                              style={{ background: 'linear-gradient(135deg, #1A4FA0, #2563EB)', color: '#F5C518' }}>
                              {u.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-gray-800 truncate">{u.name}</div>
                              <div className="text-xs text-gray-400 truncate">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500 uppercase">{u.department || '—'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${u.profileCompletion}%`, background: u.profileCompletion === 100 ? '#10B981' : '#1A4FA0' }} />
                            </div>
                            <span className="text-[10px] font-bold text-gray-400">{u.profileCompletion}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider" style={{ background: sb.bg, color: sb.text }}>
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: sb.dot }} />
                            {u.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {u.status === 'approved' && (
                              <button 
                                onClick={() => handleDownload(u._id, u.name)}
                                className="p-2 rounded-xl text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                title="Download Dossier"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 11l3 3m0 0l3-3m-3 3V8" />
                                </svg>
                              </button>
                            )}
                            <Link to={`/admin/employees/${u._id}`}
                              className="inline-flex items-center gap-1 text-xs px-4 py-2 rounded-xl font-bold transition-all bg-gray-50 text-gray-600 hover:bg-blue-600 hover:text-white shadow-sm"
                            >
                              Details
                            </Link>
                            <button 
                              onClick={() => { setDeleteId(u._id); setShowDelete(true); }}
                              className="p-2 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                              title="Delete Employee"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
              <span className="text-xs text-gray-400 font-medium">Displaying {filtered.length} employees</span>
              <Link to="/admin/employees" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
                View Full Directory <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
              </Link>
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-50">
            <h2 className="font-bold text-gray-800">System Logs</h2>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[600px] scrollbar-thin">
            {logs.length === 0 ? (
              <div className="text-center py-20 text-gray-300 italic text-xs">No recent system activity</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {logs.map(log => (
                  <div key={log._id} className="px-6 py-4 hover:bg-gray-50 transition group">
                    <div className="flex items-start gap-4">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 shadow-sm ${
                        log.action?.toLowerCase().includes('approved') ? 'bg-emerald-400 ring-4 ring-emerald-50' :
                        log.action?.toLowerCase().includes('rejected') ? 'bg-rose-400 ring-4 ring-rose-50' : 
                        'bg-blue-400 ring-4 ring-blue-50'}`} />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-800 leading-relaxed">
                          <span className="text-blue-600">{log.userId?.name || 'System'}</span> {log.action}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1 font-semibold uppercase tracking-wider">
                          {new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {log.details && <div className="text-[10px] text-gray-500 mt-2 p-2 bg-gray-50 rounded-lg italic border-l-2 border-gray-200">{log.details}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 bg-gray-50/50 border-t border-gray-50">
            <Link to="/admin/activity-logs" className="block text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-blue-600 transition">View All Audit Logs</Link>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-slate-50 px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Employee Invite</h3>
                <p className="text-xs text-slate-500 mt-1">Generate a secure onboarding link</p>
              </div>
              <button onClick={() => !inviting && setShowInvite(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleInvite} className="px-8 py-8 space-y-5">
              {[
                { key: 'name', label: 'Full Name', type: 'text', ph: 'e.g. Danish P', req: true, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                { key: 'email', label: 'Work Email', type: 'email', ph: 'name@company.com', req: true, icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                { key: 'phone', label: 'Phone Number', type: 'tel', ph: '10-digit mobile', req: true, icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
                { key: 'department', label: 'Department', type: 'text', ph: 'e.g. Engineering', req: false, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5' },
              ].map(({ key, label, type, ph, req, icon }) => (
                <div key={key} className="relative">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">{label} {req && <span className="text-rose-500">*</span>}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon}/></svg>
                    </div>
                    <input type={type} value={inviteForm[key]} onChange={e => setInviteForm(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={ph} required={req}
                      disabled={inviting}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none focus:bg-white focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/10 transition-all font-medium" />
                  </div>
                </div>
              ))}
              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={inviting}
                  className="flex-1 py-4 text-sm font-bold text-white rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  style={{ background: 'linear-gradient(135deg, #1A4FA0, #2563EB)' }}>
                  {inviting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending Invite...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                      <span>Send Invitation</span>
                    </>
                  )}
                </button>
                <button type="button" onClick={() => setShowInvite(false)} disabled={inviting}
                  className="px-6 py-4 text-sm font-bold text-slate-500 border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation */}
      <ConfirmModal 
        isOpen={showDelete}
        onClose={() => !deleting && setShowDelete(false)}
        onConfirm={handleDelete}
        title="Permanent Deletion"
        message="This will completely purge the employee's profile, documents, and records from the system. This action cannot be reversed."
        confirmText={deleting ? "Purging..." : "Confirm Delete"}
        type="danger"
      />
    </div>
  );
}
