import React, { useState } from 'react';
import { AlertOctagon, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: 'approve' | 'reject' | 'escalate' | null;
  onConfirm: (reason?: string) => void;
  isSubmitting: boolean;
}

export const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  onClose,
  actionType,
  onConfirm,
  isSubmitting,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !actionType) return null;

  const getActionConfig = (type: 'approve' | 'reject' | 'escalate') => {
    switch (type) {
      case 'approve':
        return {
          title: 'Approve Underwriting Application',
          description: 'Are you sure you want to approve this application? The applicant will be notified of the positive outcome.',
          confirmText: 'Confirm Approval',
          colorClass: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/10 hover:shadow-emerald-500/20 text-white',
          icon: <CheckCircle className="h-6 w-6 text-emerald-400" />,
          requiresReason: false,
          placeholder: 'Add optional approval comments...',
        };
      case 'reject':
        return {
          title: 'Reject Underwriting Application',
          description: 'A formal rejection requires a valid reason. Please document the underwriting flags or risk factors justifying this decision.',
          confirmText: 'Confirm Rejection',
          colorClass: 'bg-red-600 hover:bg-red-500 shadow-red-500/10 hover:shadow-red-500/20 text-white',
          icon: <AlertOctagon className="h-6 w-6 text-red-400" />,
          requiresReason: true,
          placeholder: 'e.g. Critical pre-existing medical condition unresolved...',
        };
      case 'escalate':
        return {
          title: 'Escalate to Senior Underwriter',
          description: 'Please describe the complex risk factors or ambiguities that require senior leadership review.',
          confirmText: 'Confirm Escalation',
          colorClass: 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/10 hover:shadow-purple-500/20 text-white',
          icon: <ShieldAlert className="h-6 w-6 text-purple-400" />,
          requiresReason: true,
          placeholder: 'e.g. High-risk occupation with conflicting clinical reports...',
        };
    }
  };

  const config = getActionConfig(actionType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (config.requiresReason && !reason.trim()) {
      setError('A reason is mandatory for this decision.');
      return;
    }
    setError(null);
    onConfirm(reason.trim() || undefined);
    setReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Box */}
      <div className="relative w-full max-w-lg glass-panel border-slate-800 p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
        <div className="flex gap-4 items-start">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shrink-0">
            {config.icon}
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-100">{config.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{config.description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Reviewer Notes {config.requiresReason && <span className="text-red-400 font-bold">*</span>}
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error && e.target.value.trim()) setError(null);
              }}
              placeholder={config.placeholder}
              rows={4}
              className={`w-full px-4 py-3 bg-slate-950/85 border rounded-xl text-sm font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 backdrop-blur-sm transition-all ${
                error ? 'border-red-500/50' : 'border-slate-850'
              }`}
            />
            {error && (
              <span className="text-[10px] font-medium text-red-400 block mt-1">{error}</span>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="bg-slate-900 border border-slate-800 hover:bg-slate-850 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all active:scale-98 ${config.colorClass} disabled:opacity-50`}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <span>{config.confirmText}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
