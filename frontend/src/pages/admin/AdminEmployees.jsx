import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import Select from '../../components/common/Select';

const STATUS_BADGE = {
  approved:   { bg: '#ECFDF5', text: '#065F46', dot: '#10B981' },
  pending:    { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B' },
  rejected:   { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444' },
  invited:    { bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6' },
  registered: { bg: '#F5F3FF', text: '#5B21B6', dot: '#8B5CF6' },
};

const DEPARTMENTS = ['IT', 'Sales', 'Finance', 'Insurance', 'Banking', 'Business Associate', 'HR'];

export default function AdminEmployees() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [filters, setFilters] = useState({ search: '', status: '', department: '', page: 1 });
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getUsers({ ...filters, limit: 15 });
      setUsers(data.data);
      setPagination(data.pagination);
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const setFilter = (key, value) => setFilters(p => ({ ...p, [key]: value, page: 1 }));

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-rajdhani text-2xl font-bold">
            <span style={{ color: '#0D2B6B' }}>All</span> <span style={{ color: '#F5C518' }}>Employees</span>
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">{pagination.total} total employee{pagination.total !== 1 ? 's' : ''} in the system</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-50 bg-gray-50/50">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl pl-9 pr-3 py-2 outline-none focus:border-blue-400 bg-white" />
          </div>
          <div className="w-44">
            <Select 
              value={filters.status} 
              onChange={v => setFilter('status', v)}
              placeholder="All Status"
              variant="compact"
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
          <div className="w-52">
            <Select 
              value={filters.department} 
              onChange={v => setFilter('department', v)}
              placeholder="All Departments"
              variant="compact"
              options={[
                { value: '', label: 'All Departments' },
                ...DEPARTMENTS.map(d => ({ value: d, label: d }))
              ]}
            />
          </div>
          {(filters.search || filters.status || filters.department) && (
            <button onClick={() => setFilters({ search: '', status: '', department: '', page: 1 })}
              className="text-xs text-gray-400 hover:text-gray-700 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition">
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Employee', 'Department', 'Phone', 'Profile', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 px-5 py-3 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="inline-block animate-spin w-6 h-6 border-4 rounded-full" style={{ borderColor: '#E6F1FB', borderTopColor: '#1A4FA0' }} />
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No employees found.</td></tr>
              )}
              {!loading && users.map(u => {
                const sb = STATUS_BADGE[u.status] || STATUS_BADGE.invited;
                const linkId = u.hashedId; 
                if (!linkId) return null; // Safety check for secure routing

                return (
                  <tr key={linkId} className="border-t border-gray-50 hover:bg-blue-50/20 transition group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #1A4FA0, #2563EB)', color: '#F5C518' }}>
                          {u.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{u.name}</div>
                          <div className="text-xs text-gray-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{u.department || <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 font-mono">{u.phone || <span className="text-gray-300 font-sans">—</span>}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${u.profileCompletion}%`, background: u.profileCompletion === 100 ? '#10B981' : '#1A4FA0' }} />
                        </div>
                        <span className="text-xs text-gray-500">{u.profileCompletion}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap"
                        style={{ background: sb.bg, color: sb.text }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sb.dot }} />
                        {u.status?.charAt(0).toUpperCase() + u.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link to={`/admin/employees/${linkId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                        style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                        View Details
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50 bg-gray-50/30">
            <span className="text-xs text-gray-400">Page {pagination.page} of {pagination.pages} ({pagination.total} total)</span>
            <div className="flex gap-2">
              <button disabled={filters.page <= 1} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                ← Prev
              </button>
              <button disabled={filters.page >= pagination.pages} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
