import { useState, useEffect } from 'react';
import { adminAPI, authAPI } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import Select from '../../components/common/Select';
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
    e.preventDefault(); setInviting(true);
    try {
      await authAPI.createInvite(inviteForm);
      toast.success('Invite sent successfully!');
      setShowInvite(false);
      setInviteForm({ name: '', email: '', phone: '', department: '' });
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send invite'); }
    finally { setInviting(false); }
  };

  const filtered = users.filter(u => {
    const q = filters.search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.department?.toLowerCase().includes(q);
    const matchStatus = !filters.status || u.status === filters.status;
    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-poppins text-2xl font-bold">
            <span style={{ color: '#0D2B6B' }}>Admin</span> <span style={{ color: '#F5C518' }}>Dashboard</span>
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage all employees, onboarding and approvals</p>
        </div>
        <button onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl shadow-lg shadow-yellow-900/10 transition active:scale-95"
          style={{ background: '#F5C518', color: '#0D2B6B' }}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Generate Invite
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total" value={stats.total} color="#1A4FA0" />
        <StatCard label="Approved" value={stats.approved} color="#059669" />
        <StatCard label="Pending" value={stats.pending} color="#D97706" />
        <StatCard label="Rejected" value={stats.rejected} color="#DC2626" />
        <StatCard label="Invited" value={stats.invited} color="#7C3AED" />
      </div>

      {/* Quick Nav Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link to="/admin/approvals" className="group bg-white rounded-2xl border border-amber-100 p-6 hover:shadow-md transition">
          <div className="text-sm font-bold text-gray-800 uppercase tracking-tight">Pending Approvals</div>
          <div className="text-xs text-amber-600 mt-1 font-semibold">{stats.pending} waiting</div>
        </Link>
        <Link to="/admin/employees" className="group bg-white rounded-2xl border border-blue-100 p-6 hover:shadow-md transition">
          <div className="text-sm font-bold text-gray-800 uppercase tracking-tight">Employee Directory</div>
          <div className="text-xs text-blue-600 mt-1 font-semibold">View full directory</div>
        </Link>
        <div className="bg-white rounded-2xl border border-green-100 p-6">
          <div className="text-sm font-bold text-gray-800 uppercase tracking-tight">Approval Rate</div>
          <div className="text-xs text-green-600 mt-1 font-semibold">
            {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% success
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Employee Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800 text-sm">All Employees</h2>
            <div className="flex items-center gap-2">
              <input
                placeholder="Search name, email..."
                value={filters.search}
                onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-300 w-40"
              />
              <Select
                value={filters.status}
                onChange={v => setFilters(p => ({ ...p, status: v }))}
                variant="compact"
                className="w-32"
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
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 rounded-full" style={{ borderColor: '#E6F1FB', borderTopColor: '#1A4FA0' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No employees found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    {['Employee', 'Dept.', 'Progress', 'Status', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-400 px-4 py-3 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => {
                    const sb = STATUS_BADGE[u.status] || STATUS_BADGE.invited;
                    return (
                      <tr key={u._id} className="border-t border-gray-50 hover:bg-blue-50/30 transition group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg, #1A4FA0, #2563EB)', color: '#F5C518' }}>
                              {u.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-800">{u.name}</div>
                              <div className="text-xs text-gray-400">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{u.department || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${u.profileCompletion}%`, background: u.profileCompletion === 100 ? '#10B981' : '#1A4FA0' }} />
                            </div>
                            <span className="text-xs text-gray-400">{u.profileCompletion}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: sb.bg, color: sb.text }}>
                            <span className="w-1 h-1 rounded-full" style={{ background: sb.dot }} />
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/admin/employees/${u._id}`}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium opacity-0 group-hover:opacity-100 transition"
                            style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-400">Showing {filtered.length} of {users.length} employees</span>
              <Link to="/admin/employees" className="text-xs text-blue-600 font-medium hover:underline">View all →</Link>
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800 text-sm">Recent Activity</h2>
          </div>
          {logs.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs">No recent activity</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {logs.map(log => (
                <div key={log._id} className="px-5 py-3 flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    log.action?.includes('approved') ? 'bg-green-400' :
                    log.action?.includes('rejected') ? 'bg-red-400' : 'bg-blue-400'}`} />
                  <div className="min-w-0">
                    <div className="text-xs text-gray-700 truncate">
                      <span className="font-medium">{log.userId?.name || 'Unknown'}</span> — {log.action}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} at {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {log.details && <div className="text-xs text-gray-400 italic truncate">{log.details}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-800">Generate Employee Invite</h3>
                <p className="text-xs text-gray-400 mt-0.5">An invite link will be sent to their email</p>
              </div>
              <button onClick={() => setShowInvite(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleInvite} className="px-6 py-5 space-y-4">
              {[
                { key: 'name', label: 'Full Name', type: 'text', ph: 'e.g. Priya Sharma', req: true },
                { key: 'email', label: 'Email Address', type: 'email', ph: 'employee@forge.in', req: true },
                { key: 'phone', label: 'Phone Number', type: 'text', ph: '10-digit mobile', req: true },
                { key: 'department', label: 'Department', type: 'text', ph: 'Engineering, HR, Finance...', req: false },
              ].map(({ key, label, type, ph, req }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label} {req && <span className="text-red-400">*</span>}</label>
                  <input type={type} value={inviteForm[key]} onChange={e => setInviteForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={ph} required={req}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition" />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={inviting}
                  className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl disabled:opacity-60 transition"
                  style={{ background: 'linear-gradient(135deg, #1A4FA0, #2563EB)' }}>
                  {inviting ? 'Sending...' : 'Send Invite'}
                </button>
                <button type="button" onClick={() => setShowInvite(false)}
                  className="px-5 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
