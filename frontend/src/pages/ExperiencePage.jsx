import { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { experienceAPI, profileAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/common/ConfirmModal';
import toast from 'react-hot-toast';

const Input = memo(({ label, value, onChange, type = 'text', placeholder = '', required = false, min, max, disabled = false, className = '' }) => (
  <div className={`group space-y-1 ${className}`}>
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] transition group-hover:text-blue-600 mb-1 ml-0.5">
      {label}
    </label>
    <input 
      type={type} 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      placeholder={placeholder} 
      required={required} 
      min={min} 
      max={max} 
      disabled={disabled}
      className={`w-full px-4 py-3 text-sm font-medium outline-none transition-all duration-300 rounded-2xl ${
        disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-100' : 
        'bg-white border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 shadow-sm'
      } border`} 
    />
  </div>
));

const TextArea = memo(({ label, value, onChange, placeholder = '', rows = '3', className = '' }) => (
  <div className={`group space-y-1 ${className}`}>
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] transition group-hover:text-blue-600 mb-1 ml-0.5">
      {label}
    </label>
    <textarea 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      rows={rows} 
      placeholder={placeholder}
      className="w-full px-4 py-3 text-sm font-medium outline-none transition-all duration-300 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 shadow-sm" 
    />
  </div>
));

const EMPTY = { companyName: '', role: '', startYear: '', endYear: '', years: '', skills: '', description: '', isCurrent: false, idCard: '', portfolio: '', certificateUrl: '' };

export default function ExperiencePage() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [list, setList] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFresher, setIsFresher] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

  useEffect(() => { 
    experienceAPI.getAll().then(({ data }) => setList(data.data)); 
    profileAPI.get().then(({ data }) => {
      if (data.data?.isFresher) setIsFresher(true);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    const payload = { ...form, skills: form.skills ? (Array.isArray(form.skills) ? form.skills : form.skills.split(',').map(s => s.trim())) : [] };
    try {
      if (editId) {
        const { data } = await experienceAPI.update(editId, payload);
        setList(l => l.map(x => x._id === editId ? data.data : x));
        updateUser({ 
          profileCompletion: data.profileCompletion,
          completedSteps: data.completedSteps
        });
        toast.success('Experience updated');
      } else {
        const { data } = await experienceAPI.add(payload);
        setList(l => [data.data, ...l]);
        updateUser({ 
          profileCompletion: data.profileCompletion,
          completedSteps: data.completedSteps
        });
        toast.success('Experience added');
      }
      setForm(EMPTY); setEditId(null); setShowForm(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving record'); }
    finally { setLoading(false); }
  };

  const set = useCallback((k, v) => setForm(p => ({ ...p, [k]: v })), []);
  
  const handleEdit = (exp) => {
    setForm({ ...exp, skills: exp.skills?.join(', ') || '' });
    setEditId(exp._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFresher = async () => {
    setLoading(true);
    try {
      const { data } = await profileAPI.save({ isFresher: true });
      updateUser({ 
        profileCompletion: data.profileCompletion,
        completedSteps: data.completedSteps
      });
      toast.success('Marked as Fresher');
      navigate('/onboarding/documents');
    } catch (err) {
      toast.error('Failed to update status');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      const { data } = await experienceAPI.delete(id);
      setList(l => l.filter(x => x._id !== id));
      updateUser({ 
        profileCompletion: data.profileCompletion,
        completedSteps: data.completedSteps
      });
      toast.success('Record removed');
    } catch (err) { toast.error('Deletion failed'); }
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest">
            Step 3 <span className="opacity-30">/</span> 5
          </div>
          <h1 className="text-3xl font-poppins font-black tracking-tight" style={{ color: '#0D2B6B' }}>
            Work <span style={{ color: '#F5C518' }}>Experience</span>
          </h1>
          <p className="text-slate-400 text-xs font-medium">
            Tell us about your professional journey. Freshers can skip this step.
          </p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          {!showForm && !isFresher && (
            <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true); }}
              className="flex-1 sm:flex-none px-8 py-3 text-xs font-bold rounded-xl shadow-lg shadow-yellow-600/10 transition active:scale-95 flex items-center justify-center gap-2 hover:brightness-105"
              style={{ background: '#F5C518', color: '#0D2B6B' }}>
              Add Experience
            </button>
          )}
        </div>
      </div>

      {/* Form Card */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/20 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <h3 className="font-poppins font-bold text-slate-800 text-base tracking-tight">
              {editId ? 'Edit' : 'Add'} Experience
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-50 rounded-lg">
              Close
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <Input label="Company Name" value={form.companyName} onChange={v => set('companyName', v)} placeholder="Full name of the organization" required className="md:col-span-2" />
              <Input label="Designation / Role" value={form.role} onChange={v => set('role', v)} placeholder="e.g. Senior Product Manager" required />
              <Input label="Employee ID (Optional)" value={form.idCard} onChange={v => set('idCard', v)} placeholder="e.g. EMP-12345" />
              
              <div className="md:col-span-2 py-1">
                <label className="flex items-center gap-3 cursor-pointer group p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all">
                  <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${form.isCurrent ? 'bg-blue-600 border-blue-600 shadow-sm' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}>
                    {form.isCurrent && <div className="w-2 h-2 bg-white rounded-full" />}
                    <input type="checkbox" className="hidden" checked={form.isCurrent} onChange={e => set('isCurrent', e.target.checked)} />
                  </div>
                  <span className="text-[13px] font-bold text-slate-700 group-hover:text-blue-900 transition">I currently work in this role</span>
                </label>
              </div>

              <Input label="Start Year" type="number" value={form.startYear} onChange={v => set('startYear', v)} min="1990" max={new Date().getFullYear()} required />
              <Input label="End Year" type="number" value={form.endYear} onChange={v => set('endYear', v)} min="1990" max={new Date().getFullYear()} disabled={form.isCurrent} />
              
              <Input label="Skills (Optional)" value={form.skills} onChange={v => set('skills', v)} placeholder="React, Node.js, Project Management" className="md:col-span-2" />
              <TextArea label="Brief Description" value={form.description} onChange={v => set('description', v)} placeholder="Describe your key responsibilities and achievements..." className="md:col-span-2" />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-50">
              <button type="submit" disabled={loading} 
                className="flex-1 py-3.5 text-xs font-bold rounded-xl shadow-lg shadow-yellow-600/10 transition active:scale-95 disabled:opacity-60 hover:brightness-105"
                style={{ background: '#F5C518', color: '#0D2B6B' }}>
                {loading ? 'Processing...' : editId ? 'Update Experience' : 'Save Experience'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} 
                className="px-8 py-3.5 text-xs font-bold text-slate-500 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Experience List */}
      <div className="space-y-6">
        {list.length === 0 && !showForm && (
          <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-100 px-8">
            <h3 className="text-2xl font-poppins font-bold text-slate-800 mb-2">No work history found</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-10 leading-relaxed font-medium">
              If you have previous professional experience, please document it here. 
              If this is your first job, you can mark yourself as a fresher.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true); }}
                className="px-10 py-4 text-sm font-bold rounded-2xl shadow-xl shadow-yellow-900/10 transition active:scale-95"
                style={{ background: '#F5C518', color: '#0D2B6B' }}>
                Add Experience
              </button>
              <button onClick={handleFresher} disabled={loading}
                className="px-10 py-4 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-2xl hover:bg-blue-100 transition-all shadow-sm">
                {loading ? 'Processing...' : 'I am a Fresher'}
              </button>
            </div>
          </div>
        )}
        
        {list.map((exp, i) => (
          <div key={exp._id} className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="px-6 py-3 border-b border-slate-50 flex items-center justify-between" style={{ background: '#0D2B6B' }}>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-[#F5C518]/60">#{list.length - i}</span>
                <h4 className="text-[11px] font-black text-[#F5C518] uppercase tracking-widest">{exp.role}</h4>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setForm(exp); setEditId(exp._id); setShowForm(true); }}
                  className="px-3 py-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest">Edit</button>
                <button onClick={() => setDeleteModal({ open: true, id: exp._id })}
                  className="px-3 py-1 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors text-[9px] font-black uppercase tracking-widest">Delete</button>
              </div>
            </div>
            <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-5">
              <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h4 className="font-poppins font-bold text-slate-800 text-lg tracking-tight">{exp.role}</h4>
                {exp.isCurrent && (
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Current
                  </span>
                )}
              </div>
              <div className="text-slate-500 font-semibold text-sm mb-1">{exp.companyName}</div>
              <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <span>{exp.startYear} — {exp.isCurrent ? 'Present' : exp.endYear}</span>
                {exp.years && <><span className="w-1 h-1 rounded-full bg-slate-200" /><span>{exp.years} Yrs</span></>}
              </div>

              {exp.skills && exp.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {exp.skills.map(s => (
                    <span key={s} className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-100">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Bottom */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-10">
        <button onClick={() => navigate('/onboarding/education')}
          className="w-full sm:w-auto px-8 py-4 text-sm font-bold text-slate-500 hover:text-slate-800 transition flex items-center justify-center gap-2 group">
          Back to Education
        </button>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {list.length === 0 && !isFresher && (
             <button onClick={handleFresher} disabled={loading}
              className="px-8 py-4 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition shadow-sm">
              Skip (I'm a Fresher)
            </button>
          )}
        <button onClick={() => navigate('/onboarding/documents')}
          className="px-10 py-4 text-sm font-bold rounded-2xl shadow-xl shadow-yellow-600/10 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 hover:brightness-105"
          style={{ background: '#F5C518', color: '#0D2B6B' }}>
          Proceed to Documents
        </button>
        </div>
      </div>

      <ConfirmModal 
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={() => handleDelete(deleteModal.id)}
        title="Remove Experience?"
        message="Are you sure you want to delete this record? This action cannot be undone."
        confirmText="Yes, Remove"
      />
    </div>
  );
}
