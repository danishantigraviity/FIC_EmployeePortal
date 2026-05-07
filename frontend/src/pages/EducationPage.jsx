import { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { educationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/common/ConfirmModal';
import toast from 'react-hot-toast';

const Input = memo(({ label, value, onChange, type = 'text', placeholder = '', required = false, min, max, step, className = '' }) => (
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
      step={step}
      className="w-full px-4 py-3 text-sm font-medium outline-none transition-all duration-300 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 shadow-sm" 
    />
  </div>
));

const EMPTY = { degree: '', college: '', university: '', year: '', percentage: '', specialization: '' };

export default function EducationPage() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

  useEffect(() => {
    educationAPI.getAll().then(({ data }) => setList(data.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        const { data } = await educationAPI.update(editId, form);
        setList(l => l.map(x => x._id === editId ? data.data : x));
        updateUser({ 
          profileCompletion: data.profileCompletion,
          completedSteps: data.completedSteps
        });
        toast.success('Qualification updated');
      } else {
        const { data } = await educationAPI.add(form);
        setList(l => [data.data, ...l]);
        updateUser({ 
          profileCompletion: data.profileCompletion,
          completedSteps: data.completedSteps
        });
        toast.success('Qualification added');
      }
      setForm(EMPTY); setEditId(null); setShowForm(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving record'); }
    finally { setLoading(false); }
  };

  const handleEdit = (edu) => { 
    setForm({ ...edu }); 
    setEditId(edu._id); 
    setShowForm(true); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleDelete = async (id) => {
    try {
      const { data } = await educationAPI.delete(id);
      setList(l => l.filter(x => x._id !== id));
      updateUser({ 
        profileCompletion: data.profileCompletion,
        completedSteps: data.completedSteps
      });
      toast.success('Record removed');
    } catch (err) { toast.error('Deletion failed'); }
  };

  const set = useCallback((k, v) => setForm(p => ({ ...p, [k]: v })), []);

  return (
    <div className="space-y-12 pb-24">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest">
            Step 2 <span className="opacity-30">/</span> 5
          </div>
          <h1 className="text-3xl font-poppins font-black tracking-tight" style={{ color: '#0D2B6B' }}>
            Academic <span style={{ color: '#F5C518' }}>Background</span>
          </h1>
          <p className="text-slate-400 text-xs font-medium">
            Add your degrees and diplomas starting from the most recent.
          </p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          {!showForm && (
            <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true); }}
              className="flex-1 sm:flex-none px-8 py-3 text-xs font-bold rounded-xl shadow-lg shadow-yellow-600/10 transition active:scale-95 flex items-center justify-center gap-2 hover:brightness-105"
              style={{ background: '#F5C518', color: '#0D2B6B' }}>
              Add Qualification
            </button>
          )}
        </div>
      </div>

      {/* Form Card */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/20 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <h3 className="font-poppins font-bold text-slate-800 text-base tracking-tight">
              {editId ? 'Edit' : 'Add'} Qualification
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-50 rounded-lg">
              Close
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <Input label="Degree / Qualification" value={form.degree} onChange={v => set('degree', v)} placeholder="e.g. B.Tech Computer Science" required />
              <Input label="Specialization" value={form.specialization} onChange={v => set('specialization', v)} placeholder="Major subjects (optional)" />
              <Input label="College / Institute" value={form.college} onChange={v => set('college', v)} placeholder="Full name of your college" required className="md:col-span-2" />
              <Input label="University" value={form.university} onChange={v => set('university', v)} placeholder="Affiliated university" required className="md:col-span-2" />
              <Input label="Year of Passing" type="number" value={form.year} onChange={v => set('year', v)} min="1990" max={new Date().getFullYear()} required />
              <Input label="Percentage / CGPA" type="number" value={form.percentage} onChange={v => set('percentage', v)} min="0" max="100" step="0.01" />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-50">
              <button type="submit" disabled={loading} 
                className="flex-1 py-3.5 text-xs font-bold rounded-xl shadow-lg shadow-yellow-600/10 transition active:scale-95 disabled:opacity-60 hover:brightness-105"
                style={{ background: '#F5C518', color: '#0D2B6B' }}>
                {loading ? 'Processing...' : editId ? 'Update Record' : 'Save Qualification'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} 
                className="px-8 py-3.5 text-xs font-bold text-[#0D2B6B] bg-[#F5C518]/10 border border-[#F5C518]/20 rounded-xl hover:bg-[#F5C518]/20 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Records List */}
      <div className="space-y-6">
        {list.length === 0 && !showForm && (
          <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-100 px-8">
            <h3 className="text-2xl font-poppins font-bold text-slate-800 mb-2">No qualifications found</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mb-10 leading-relaxed font-medium">
              Please document your educational journey to help us verify your professional qualifications.
            </p>
            <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true); }}
              className="px-10 py-4 text-sm font-bold rounded-2xl shadow-xl shadow-yellow-900/10 transition active:scale-95"
              style={{ background: '#F5C518', color: '#0D2B6B' }}>
              Add Your First Qualification
            </button>
          </div>
        )}
        
        {list.map((edu, i) => (
          <div key={edu._id} className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="px-6 py-3 border-b border-slate-50 flex items-center justify-between" style={{ background: '#0D2B6B' }}>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-[#F5C518]/60">#{list.length - i}</span>
                <h4 className="text-[11px] font-black text-[#F5C518] uppercase tracking-widest">{edu.degree}</h4>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setForm(edu); setEditId(edu._id); setShowForm(true); }}
                  className="px-3 py-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest">Edit</button>
                <button onClick={() => setDeleteModal({ open: true, id: edu._id })}
                  className="px-3 py-1 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors text-[9px] font-black uppercase tracking-widest">Delete</button>
              </div>
            </div>
            <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-5">
              <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h4 className="font-poppins font-bold text-slate-800 text-lg tracking-tight">{edu.degree}</h4>
                {edu.year && (
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Class of {edu.year}
                  </span>
                )}
              </div>
              <div className="text-slate-500 font-semibold text-sm mb-1">{edu.college}</div>
              <div className="flex flex-wrap items-center gap-y-1 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                {edu.university && <span>{edu.university}</span>}
                {edu.specialization && <><span className="mx-2 opacity-30">•</span><span>{edu.specialization}</span></>}
                {edu.percentage && <><span className="mx-2 opacity-30">•</span><span className="text-blue-600">{edu.percentage}%</span></>}
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
              <button onClick={() => handleEdit(edu)} 
                className="flex-1 md:flex-none text-[11px] font-bold px-4 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                Edit
              </button>
              <button onClick={() => setDeleteModal({ open: true, id: edu._id })} 
                className="text-slate-300 hover:text-red-500 transition-colors p-2 text-xs font-bold uppercase tracking-widest">
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
      </div>

      {/* Navigation bottom */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
        <button onClick={() => navigate('/onboarding/profile')}
          className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 transition flex items-center justify-center gap-2 group">
          Back to Profile
        </button>
        <button onClick={() => navigate('/onboarding/experience')}
          className="w-full sm:w-auto px-10 py-4 text-sm font-bold rounded-2xl shadow-xl shadow-yellow-600/10 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 hover:brightness-105"
          style={{ background: '#F5C518', color: '#0D2B6B' }}>
          Proceed to Work Experience
        </button>
      </div>

      <ConfirmModal 
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={() => handleDelete(deleteModal.id)}
        title="Remove Qualification?"
        message="Are you sure you want to delete this record? This action cannot be undone."
        confirmText="Yes, Remove"
      />
    </div>
  );
}
