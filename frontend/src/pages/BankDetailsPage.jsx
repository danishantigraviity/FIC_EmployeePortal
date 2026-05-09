import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function BankDetailsPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    profileAPI.get()
      .then(({ data }) => {
        if (data.data?.bankDetails) {
          const { bankName, accountNumber, ifscCode } = data.data.bankDetails;
          setFormData({
            bankName: bankName || '',
            accountNumber: accountNumber || '',
            confirmAccountNumber: accountNumber || '',
            ifscCode: ifscCode || '',
          });
        }
      })
      .catch(() => toast.error('Failed to load bank details'))
      .finally(() => setInitialLoading(false));
  }, []);

  const validateIFSC = (ifsc) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);

  const validate = () => {
    const newErrors = {};
    if (!formData.bankName) newErrors.bankName = 'Bank name is required';
    if (!formData.accountNumber) newErrors.accountNumber = 'Account number is required';
    if (formData.accountNumber !== formData.confirmAccountNumber) {
      newErrors.confirmAccountNumber = 'Account numbers do not match';
    }
    if (!formData.ifscCode) {
      newErrors.ifscCode = 'IFSC code is required';
    } else if (!validateIFSC(formData.ifscCode)) {
      newErrors.ifscCode = 'Invalid IFSC format (e.g. SBIN0001234)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const { data } = await profileAPI.save({
        bankDetails: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode.toUpperCase(),
        }
      });
      
      updateUser({ 
        profileCompletion: data.profileCompletion,
        completedSteps: data.completedSteps
      });
      toast.success('Onboarding complete!');
      navigate('/onboarding');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save bank details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  if (initialLoading) return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4">
      <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Details...</p>
    </div>
  );

  return (
    <div className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest">
            Step 5 <span className="opacity-30">/</span> 5
          </div>
          <h1 className="text-3xl font-poppins font-black tracking-tight" style={{ color: '#0D2B6B' }}>
            Bank <span style={{ color: '#F5C518' }}>Details</span>
          </h1>
          <p className="text-slate-400 text-xs font-medium">
            Please provide your banking information for official payroll processing.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/20">
        <div className="px-6 py-4 border-b border-slate-100 rounded-t-2xl" style={{ background: '#0D2B6B' }}>
          <div>
            <h3 className="font-poppins font-bold text-[11px] uppercase tracking-[0.2em]" style={{ color: '#F5C518' }}>Banking Information</h3>
            <p className="text-[10px] text-white/50 font-medium uppercase tracking-wider mt-0.5">Payroll Processing Details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            
            <div className="group space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-1 ml-0.5">Bank Name</label>
              <input
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                placeholder="e.g. State Bank of India"
                className={`w-full px-4 py-3 text-sm font-medium outline-none transition-all duration-300 rounded-2xl ${
                  errors.bankName ? 'border-red-500 bg-red-50/20 focus:ring-4 focus:ring-red-100/50' : 
                  'bg-white border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 shadow-sm'
                } border`}
              />
              {errors.bankName && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-1 ml-1">{errors.bankName}</p>}
            </div>

            <div className="group space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-1 ml-0.5">IFSC Code</label>
              <input
                name="ifscCode"
                value={formData.ifscCode}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
                  setFormData(prev => ({ ...prev, ifscCode: val }));
                }}
                placeholder="e.g. SBIN0001234"
                maxLength={11}
                className={`w-full px-4 py-3 text-sm font-mono font-bold tracking-widest outline-none transition-all duration-300 rounded-2xl ${
                  errors.ifscCode ? 'border-red-500 bg-red-50/20 focus:ring-4 focus:ring-red-100/50' : 
                  'bg-white border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 shadow-sm'
                } border`}
              />
              {errors.ifscCode && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-1 ml-1">{errors.ifscCode}</p>}
            </div>

            <div className="group space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-1 ml-0.5">Account Number</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setFormData(prev => ({ ...prev, accountNumber: val }));
                }}
                placeholder="Enter account number"
                className={`w-full px-4 py-3 text-sm font-medium outline-none transition-all duration-300 rounded-2xl ${
                  errors.accountNumber ? 'border-red-500 bg-red-50/20 focus:ring-4 focus:ring-red-100/50' : 
                  'bg-white border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 shadow-sm'
                } border`}
              />
              {errors.accountNumber && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-1 ml-1">{errors.accountNumber}</p>}
            </div>

            <div className="group space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-1 ml-0.5">Confirm Account Number</label>
              <input
                type="text"
                name="confirmAccountNumber"
                value={formData.confirmAccountNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setFormData(prev => ({ ...prev, confirmAccountNumber: val }));
                }}
                placeholder="Re-enter account number"
                className={`w-full px-4 py-3 text-sm font-medium outline-none transition-all duration-300 rounded-2xl ${
                  errors.confirmAccountNumber ? 'border-red-500 bg-red-50/20 focus:ring-4 focus:ring-red-100/50' : 
                  'bg-white border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 shadow-sm'
                } border`}
              />
              {errors.confirmAccountNumber && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-1 ml-1">{errors.confirmAccountNumber}</p>}
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-50">
            <button
              type="button"
              onClick={() => navigate('/onboarding/documents')}
              className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 transition flex items-center justify-center gap-2 group"
            >
              Back to Documents
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-10 py-4 text-sm font-bold rounded-2xl shadow-xl shadow-yellow-600/10 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 hover:brightness-105"
              style={{ background: '#F5C518', color: '#0D2B6B' }}
            >
              {loading ? 'Finalizing...' : 'Complete Onboarding'}
            </button>
          </div>
        </form>
      </div>

      {/* Security Trust Banner */}
      <div className="relative group p-6 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative">
          <div>
            <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-1">Encrypted Data Protection</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              Your banking details are protected with bank-grade encryption and stored securely. 
              This information is only accessible by authorized payroll administrators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
