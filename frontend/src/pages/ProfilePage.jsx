import { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DatePicker from '../components/common/DatePicker';
import Select from '../components/common/Select';
import toast from 'react-hot-toast';
import { INDIAN_STATES_DATA } from '../constants/indiaData';

const Input = memo(({ label, value, onChange, type = 'text', placeholder = '', disabled = false, error, maxLength }) => (
  <div className="group space-y-1">
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] transition group-hover:text-blue-600 mb-1 ml-0.5">
      {label}
    </label>
    <input 
      type={type} 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      placeholder={placeholder} 
      disabled={disabled} 
      maxLength={maxLength}
      className={`w-full px-4 py-3 text-sm font-medium outline-none transition-all duration-300 rounded-2xl ${
        disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-100' : 
        error ? 'border-red-500 bg-red-50/20 focus:ring-4 focus:ring-red-100/50' : 
        'bg-white border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 shadow-sm'
      } border`} 
    />
    {error && (
      <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1 ml-1">{error}</p>
    )}
  </div>
));

const Section = ({ title, description, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 transition-all hover:shadow-md">
    <div className="px-6 py-4 border-b border-slate-100 rounded-t-2xl" style={{ background: '#0D2B6B' }}>
      <div>
        <h3 className="font-poppins font-bold text-[11px] uppercase tracking-[0.2em]" style={{ color: '#F5C518' }}>{title}</h3>
        {description && <p className="text-[10px] text-white/50 font-medium uppercase tracking-wider mt-0.5">{description}</p>}
      </div>
    </div>
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">{children}</div>
    </div>
  </div>
);

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    dob: '', 
    gender: '', 
    fatherName: '',
    motherName: '',
    aadhaarNumber: '', 
    panNumber: '', 
    address: { street: '', city: '', state: '', pincode: '', country: 'India' }, 
    emergencyContact: { name: '', relation: '', phone: '' } 
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    profileAPI.get().then(({ data }) => {
      if (data.data) {
        const p = data.data;
        const savedState = p.address?.state || '';
        const savedCity = p.address?.city || '';

        const stateExists = Object.keys(INDIAN_STATES_DATA).includes(savedState);
        const cityExists = stateExists && INDIAN_STATES_DATA[savedState].includes(savedCity);

        setForm({ 
          dob: p.dob ? p.dob.split('T')[0] : '', 
          gender: p.gender || '', 
          fatherName: p.fatherName || '',
          motherName: p.motherName || '',
          aadhaarNumber: p.aadhaarNumber || '', 
          panNumber: p.panNumber || '', 
          address: {
            ...p.address,
            state: savedState ? (stateExists ? savedState : 'Other') : '',
            city: savedCity ? (cityExists ? savedCity : 'Other') : ''
          }, 
          emergencyContact: p.emergencyContact || { name: '', relation: '', phone: '' } 
        });

        if (savedState && !stateExists) setManualState(savedState);
        if (savedCity && !cityExists) setManualCity(savedCity);
      }
    }).finally(() => setLoading(false));
  }, []);

  const set = useCallback((field, val) => setForm(p => ({ ...p, [field]: val })), []);
  const setAddr = useCallback((field, val) => setForm(p => ({ ...p, address: { ...p.address, [field]: val } })), []);
  const setEC = useCallback((field, val) => setForm(p => ({ ...p, emergencyContact: { ...p.emergencyContact, [field]: val } })), []);

  const handleStateChange = (stateName) => {
    setForm(prev => ({
      ...prev,
      address: {
        ...prev.address,
        state: stateName,
        city: '' // Reset city when state changes
      }
    }));
  };

  const states = [
    ...Object.keys(INDIAN_STATES_DATA).map(s => ({ label: s, value: s })),
    { label: 'Other State / Outside India', value: 'Other' }
  ];

  const districts = (form.address.state && INDIAN_STATES_DATA[form.address.state]) 
    ? [
        ...INDIAN_STATES_DATA[form.address.state].map(d => ({ label: d, value: d })),
        { label: 'Other District / Not Listed', value: 'Other' }
      ]
    : form.address.state === 'Other' ? [{ label: 'Enter Manually', value: 'Other' }] : [];

  const [showManualState, setShowManualState] = useState(false);
  const [showManualCity, setShowManualCity] = useState(false);
  const [manualState, setManualState] = useState('');
  const [manualCity, setManualCity] = useState('');

  useEffect(() => {
    setShowManualState(form.address.state === 'Other');
    if (form.address.state !== 'Other') setManualState('');
  }, [form.address.state]);

  useEffect(() => {
    setShowManualCity(form.address.city === 'Other');
    if (form.address.city !== 'Other') setManualCity('');
  }, [form.address.city]);

  const handleSave = async (e, shouldContinue = false) => {
    if (e) e.preventDefault();
    
    const finalForm = {
      ...form,
      address: {
        ...form.address,
        state: form.address.state === 'Other' ? manualState : form.address.state,
        city: form.address.city === 'Other' ? manualCity : form.address.city
      }
    };

    setSaving(true);
    try {
      const { data } = await profileAPI.save(finalForm);
      updateUser({ 
        profileCompletion: data.profileCompletion,
        completedSteps: data.completedSteps
      });
      toast.success('Profile updated');
      
      if (shouldContinue || data.completedSteps?.profile) {
        navigate('/onboarding/education');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4">
      <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Profile...</p>
    </div>
  );

  return (
    <form onSubmit={handleSave} className="space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest">
            Step 1 <span className="opacity-30">/</span> 5
          </div>
          <h1 className="text-3xl font-poppins font-black tracking-tight" style={{ color: '#0D2B6B' }}>
            Personal <span style={{ color: '#F5C518' }}>Profile</span>
          </h1>
          <p className="text-slate-400 text-xs font-medium">
            Please provide your official information as per your identity documents.
          </p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <button type="submit" disabled={saving} 
            className="flex-1 sm:flex-none px-6 py-3 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition active:scale-95 disabled:opacity-50">
            Save Draft
          </button>
          <button type="button" onClick={(e) => handleSave(e, true)} disabled={saving} 
            className="flex-1 sm:flex-none px-8 py-3 text-xs font-bold rounded-xl shadow-lg shadow-yellow-600/10 transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 hover:brightness-105"
            style={{ background: '#F5C518', color: '#0D2B6B' }}>
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <Section 
          title="Basic Information" 
          description="Your legal name and primary identification details."
        >
          <Input label="Full Name" value={user?.name || ''} onChange={() => {}} disabled />
          <Input label="Email Address" value={user?.email || ''} onChange={() => {}} disabled />
          <DatePicker label="Date of Birth" value={form.dob} onChange={v => set('dob', v)} max={new Date().toISOString().split('T')[0]} />
          <Select 
            label="Gender" 
            value={form.gender} 
            onChange={v => set('gender', v)}
            options={[
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
              { label: 'Other', value: 'other' }
            ]}
          />
          <Input 
            label="Aadhaar Number" 
            value={form.aadhaarNumber} 
            maxLength={12}
            onChange={v => set('aadhaarNumber', v.replace(/\D/g, ''))} 
            placeholder="12-digit Aadhaar" 
            error={form.aadhaarNumber && form.aadhaarNumber.length !== 12 ? 'Must be exactly 12 digits' : ''}
          />
          <Input 
            label="PAN Number" 
            value={form.panNumber} 
            maxLength={10}
            onChange={v => set('panNumber', v.toUpperCase().replace(/[^A-Z0-9]/g, ''))} 
            placeholder="ABCDE1234F" 
            error={form.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber) ? 'Invalid format' : ''}
          />
        </Section>

        <Section 
          title="Residential Address" 
          description="Your current place of residence."
        >
          <div className="md:col-span-2">
            <Input label="Street Address" value={form.address.street} onChange={v => setAddr('street', v)} placeholder="House no, Street name, Area" />
          </div>
          <div className="space-y-4">
            <Select label="State" value={form.address.state} onChange={handleStateChange} options={states} />
            {showManualState && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <Input label="Specify State" value={manualState} onChange={setManualState} placeholder="Enter state name" />
              </div>
            )}
          </div>
          <div className="space-y-4">
            <Select label="City / District" value={form.address.city} onChange={v => setAddr('city', v)} options={districts} disabled={!form.address.state} />
            {showManualCity && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <Input label="Specify City" value={manualCity} onChange={setManualCity} placeholder="Enter city name" />
              </div>
            )}
          </div>
          <Input label="PIN Code" value={form.address.pincode} onChange={v => setAddr('pincode', v.replace(/\D/g, '').slice(0,6))} placeholder="6-digit code" />
          <Input label="Country" value={form.address.country} onChange={v => setAddr('country', v)} />
        </Section>

        <Section 
          title="Emergency Contact" 
          description="Who should we contact in case of an emergency?"
        >
          <Input label="Contact Name" value={form.emergencyContact.name} onChange={v => setEC('name', v)} placeholder="Full name" />
          <Input label="Relationship" value={form.emergencyContact.relation} onChange={v => setEC('relation', v)} placeholder="Relationship to you" />
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none border-r border-slate-100 pr-3">
                <svg className="w-5 h-3.5 rounded-[2px] shadow-sm" viewBox="0 0 640 480">
                  <path fill="#f93" d="M0 0h640v160H0z"/>
                  <path fill="#fff" d="M0 160h640v160H0z"/>
                  <path fill="#128807" d="M0 320h640v160H0z"/>
                  <g transform="translate(320 240)">
                    <circle r="70" fill="#000080"/>
                    <circle r="60" fill="#fff"/>
                    <circle r="15" fill="#000080"/>
                    {Array.from({length: 24}).map((_, i) => (
                      <path key={i} fill="#000080" d="M0-67l2 67h-4z" transform={`rotate(${i * 15})`}/>
                    ))}
                  </g>
                </svg>
                <span className="text-sm font-bold text-slate-400">+91</span>
              </div>
              <input 
                type="tel" 
                value={form.emergencyContact.phone} 
                onChange={e => setEC('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full pl-24 pr-5 py-3.5 text-sm font-bold border border-slate-200 rounded-[14px] outline-none transition-all duration-200 bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/30 shadow-sm" 
                placeholder="98765 43210" 
                required 
              />
            </div>
          </div>
        </Section>
      </div>

      <div className="flex justify-end pt-6">
        <button type="button" onClick={(e) => handleSave(e, true)} disabled={saving} 
          className="w-full sm:w-auto px-10 py-4 text-sm font-bold rounded-2xl shadow-xl shadow-yellow-600/10 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-3 hover:brightness-105"
          style={{ background: '#F5C518', color: '#0D2B6B' }}>
          {saving ? 'Processing...' : 'Save & Proceed to Education'}
        </button>
      </div>
    </form>
  );
}
