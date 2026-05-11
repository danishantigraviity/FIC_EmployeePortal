import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AdminApprovals() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [rejReason, setRejReason] = useState({});

  useEffect(() => {
    setLoading(true);
    adminAPI.getUsers({ status: 'pending,registered' })
      .then(({ data }) => setUsers(data.data))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (u, status) => {
    const linkId = u.hashedId || u._id;
    if (status === 'rejected' && !rejReason[linkId]?.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setActionLoading(p => ({ ...p, [linkId]: status }));
    try {
      await adminAPI.verifyUser(linkId, { status, rejectionReason: rejReason[linkId] || '' });
      setUsers(l => l.filter(emp => (emp.hashedId || emp._id) !== linkId));
      toast.success(`Employee ${status} successfully.`);
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setActionLoading(p => ({ ...p, [linkId]: null })); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-10 h-10 border-4 rounded-full" style={{ borderColor: '#E6F1FB', borderTopColor: '#1A4FA0' }} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-rajdhani text-3xl font-bold tracking-tight">
            <span style={{ color: '#0D2B6B' }}>Pending</span> <span style={{ color: '#F5C518' }}>Approvals</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Review and approve employee onboarding profiles.</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-2.5 flex items-center">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-widest">{users.length} Awaiting Review</span>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-2 uppercase tracking-tight">All Clear!</h3>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            There are no pending approvals at the moment. All onboarding profiles have been processed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map(u => {
            const linkId = u.hashedId || u._id;
            return (
            <div key={linkId} className="group bg-white rounded-3xl border border-gray-100 p-6 transition-all hover:border-blue-100 hover:shadow-lg shadow-blue-900/5">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                
                {/* Profile info */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-inner"
                    style={{ background: 'linear-gradient(135deg, #1A4FA0, #2563EB)', color: '#F5C518' }}>
                    {u.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 text-lg truncate">{u.name}</div>
                    <div className="text-xs text-gray-400 font-medium mb-2">{u.email} • {u.department || 'No department'}</div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all bg-blue-600" style={{ width: `${u.profileCompletion}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-500">{u.profileCompletion}%</span>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${u.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                        {u.status === 'pending' ? 'Awaiting Review' : 'In Progress'}
                      </span>
                      <Link to={`/admin/employees/${linkId}`} 
                        className="text-xs font-bold text-blue-600 hover:underline uppercase tracking-wider">
                        View Full Profile
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:border-l lg:pl-6 border-gray-50">
                  <div className="flex flex-col gap-2">
                    <input 
                      placeholder="Reason (if rejecting)..." 
                      value={rejReason[linkId] || ''} 
                      onChange={e => setRejReason(p => ({ ...p, [linkId]: e.target.value }))}
                      className="text-xs border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50 w-full sm:w-48 transition bg-gray-50/50" 
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(u, 'approved')} disabled={!!actionLoading[linkId]}
                      className="flex-1 px-6 py-2.5 rounded-xl font-bold text-xs text-white transition active:scale-95 disabled:opacity-50 shadow-md shadow-green-900/10" 
                      style={{ background: '#059669' }}>
                      {actionLoading[linkId] === 'approved' ? 'Approving...' : 'Approve'}
                    </button>
                    <button onClick={() => handleAction(u, 'rejected')} disabled={!!actionLoading[linkId]}
                      className="flex-1 px-6 py-2.5 rounded-xl font-bold text-xs text-white transition active:scale-95 disabled:opacity-50 shadow-md shadow-red-900/10" 
                      style={{ background: '#DC2626' }}>
                      {actionLoading[linkId] === 'rejected' ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
