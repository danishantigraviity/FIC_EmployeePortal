import React from 'react';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message = "This action cannot be undone.", 
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  type = "danger" 
}) {
  if (!isOpen) return null;

  const accentColor = type === 'danger' ? '#DC2626' : '#1A4FA0';
  const brandYellow = '#F5C518';
  const brandNavy = '#0D2B6B';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20">
        <div className="p-8 text-center">
          <div className="mb-4">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
              {type === 'danger' ? 'Attention' : 'Confirmation'}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight font-poppins">{title}</h3>
          <p className="text-gray-500 text-sm leading-relaxed font-medium px-4">{message}</p>
        </div>
        
        <div className="p-4 flex gap-3 bg-gray-50/50">
          <button 
            onClick={onClose} 
            className="flex-1 px-6 py-3.5 text-sm font-bold text-gray-500 bg-white border border-gray-200 rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className="flex-1 px-6 py-3.5 text-sm font-bold rounded-2xl shadow-lg transition-all active:scale-95 hover:brightness-110" 
            style={{ 
              background: brandYellow,
              color: brandNavy,
              boxShadow: '0 10px 15px -3px rgba(245, 197, 24, 0.2)'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
