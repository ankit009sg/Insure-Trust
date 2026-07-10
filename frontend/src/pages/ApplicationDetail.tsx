import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApplication, useReviewAction } from '../hooks/useApplications';
import { useAuthStore } from '../stores/authStore';
import { Loading } from '../components/common/Loading';
import { ErrorPage } from '../components/common/ErrorPage';
import { ActionModal } from '../components/review/ActionModal';
import { ArrowLeft, Clock, FileText, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, CornerUpRight, FileCheck, FileCode } from 'lucide-react';

export const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const appId = id ? parseInt(id, 10) : 0;
  const navigate = useNavigate();

  const { role } = useAuthStore();
  const { data: application, isLoading, isError, refetch } = useApplication(appId);
  const actionMutation = useReviewAction();

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | 'escalate' | null>(null);

  const handleActionClick = (action: 'approve' | 'reject' | 'escalate') => {
    if (action === 'approve') {
      // Approve doesn't strictly force a reason input, we can open modal or proceed directly. 
      // Opening modal for consistency is nice and professional.
      setSelectedAction('approve');
      setModalOpen(true);
    } else {
      setSelectedAction(action);
      setModalOpen(true);
    }
  };

  const handleConfirmAction = async (reason?: string) => {
    if (!selectedAction) return;
    try {
      await actionMutation.mutateAsync({
        id: appId,
        action: selectedAction,
        reason,
      });
      setModalOpen(false);
      setSelectedAction(null);
      refetch();
    } catch (err) {
      console.error("Action execution failed", err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Loading message="Fetching underwriting dossier details..." />
      </div>
    );
  }

  if (isError || !application) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <ErrorPage message="Unable to load this underwriting case." onRetry={refetch} />
      </div>
    );
  }

  const { status, risk_rating = 'low', summary = '', action_reason, applicant_id } = application;

  const isPolicyManager = role === 'policy_manager';
  const isSeniorManager = role === 'senior_manager';

  const canActionPolicy = isPolicyManager && status === 'pending';
  const canActionSenior = isSeniorManager && status === 'escalated';

  const getRiskStyles = (rating: string) => {
    switch (rating.toLowerCase()) {
      case 'high':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'low':
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  const backLink = isPolicyManager ? '/policy-dashboard' : '/senior-dashboard';

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-850 pb-6">
        <div className="space-y-1">
          <Link
            to={backLink}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Worklist</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Underwriting Case Review</h1>
            <span className="text-xs text-slate-500 font-mono bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-md">
              Case #{application.id}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className={`text-xs font-bold uppercase border px-3 py-1 rounded-full ${getRiskBadge(status)}`}>
            Status: {status}
          </span>
          <span className={`text-xs font-bold uppercase border px-3 py-1 rounded-full ${getRiskBadge(risk_rating)}`}>
            Risk Rating: {risk_rating}
          </span>
        </div>
      </div>

      {/* Main Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Original Scan Mock Paper (5 columns) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Original Document Verification
            </h3>
            <p className="text-[10px] text-slate-500">
              Scanned intake record with highlights on parameter mismatch or high risk keywords.
            </p>
          </div>

          {/* Scanned Document Paper effect */}
          <div className="bg-white text-slate-900 shadow-2xl rounded-2xl p-8 min-h-[500px] font-serif border border-slate-250 relative overflow-hidden select-none">
            {/* Header elements in paper */}
            <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold uppercase tracking-tight text-slate-900">Life Intake Inc.</h2>
                <p className="text-[9px] font-sans font-semibold tracking-wider text-slate-500 uppercase">Underwriting Intake Form</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-sans font-bold text-slate-400">FORM ID: LT-4981</p>
                <p className="text-[8px] font-sans font-bold text-slate-400">SUB_USER: {applicant_id}</p>
              </div>
            </div>

            {/* Document Stamp overlay */}
            <div className="absolute top-1/3 right-10 rotate-12 border-4 border-red-500/35 text-red-500/40 text-[10px] font-extrabold uppercase px-3 py-1 rounded tracking-widest font-sans select-none pointer-events-none">
              AI Processed
            </div>

            {/* Fields rendering on mock paper */}
            <div className="space-y-5 text-xs">
              {Object.entries(application.extracted_data).map(([key, field]) => {
                const hasFlags = field.flags && field.flags.length > 0;
                // Highlight text if original values contain flags
                return (
                  <div key={key} className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-sans font-semibold text-slate-500 w-1/3 uppercase text-[9px] tracking-wide mt-0.5">
                      {field.label}:
                    </span>
                    <span className={`w-2/3 text-right font-medium text-slate-800 ${
                      hasFlags 
                        ? 'bg-amber-100/90 text-amber-950 font-bold px-1 rounded border-b border-amber-400' 
                        : ''
                    }`}>
                      {field.original_value || 'None'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer paper seal */}
            <div className="border-t border-slate-200 mt-12 pt-4 flex justify-between items-center text-[8px] font-sans text-slate-400">
              <span>SCANNER DEVICE SIGN: INSURE-VERIFY-AGENT-OCR</span>
              <span>PAGE 1 OF 1</span>
            </div>
          </div>
        </div>

        {/* Right Side: Underwriter review data & actions (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* AI plain-language summary & overall risk rating */}
          <div className="glass-panel p-6 border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 text-brand-400 pb-2 border-b border-slate-855">
              <FileCheck className="h-4.5 w-4.5" />
              <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-200">
                Automated Risk Synthesis
              </h3>
            </div>
            
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {summary || 'No risk synthesis generated.'}
            </div>
          </div>

          {/* Underwriting Extraction Fields & Flags */}
          <div className="glass-panel p-6 border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 text-brand-400 pb-2 border-b border-slate-855">
              <FileCode className="h-4.5 w-4.5" />
              <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-200">
                Extracted Parameters & Flags
              </h3>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {Object.entries(application.extracted_data).map(([key, field]) => {
                const hasFlags = field.flags && field.flags.length > 0;
                
                return (
                  <div 
                    key={key} 
                    className={`p-4 rounded-xl border ${
                      hasFlags 
                        ? 'bg-amber-500/5 border-amber-500/20' 
                        : 'bg-slate-900/10 border-slate-900'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {field.label}
                      </span>
                      {hasFlags && (
                        <span className="text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Unresolved flag
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm font-semibold text-slate-200">
                        {field.value || <span className="text-slate-600 italic">None / Blank</span>}
                      </span>
                    </div>

                    {hasFlags && field.flags.map((flg, idx) => (
                      <div key={idx} className="mt-2.5 flex items-start gap-2 bg-slate-950/80 border border-slate-900 rounded-lg p-2.5 text-xs text-slate-300">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                        <span>{flg.message}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Underwriter Decision Console */}
          <div className="glass-panel p-6 border-slate-800/80 space-y-4">
            <div className="pb-2 border-b border-slate-855">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-200">
                Decision Console
              </h3>
            </div>

            {/* Decision Outcomes already completed */}
            {status !== 'pending' && status !== 'escalated' && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                status === 'approved' 
                  ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-300' 
                  : 'bg-red-500/5 border-red-500/15 text-red-300'
              }`}>
                {status === 'approved' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-slate-100 uppercase text-xs tracking-wider">
                    Underwriting Case Closed
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    This dossier was officially {status === 'approved' ? 'Approved' : 'Declined'} and locked.
                  </p>
                  {action_reason && (
                    <div className="mt-2.5 p-2.5 bg-slate-950/80 border border-slate-900 rounded-lg">
                      <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider mb-0.5">Decision Note</span>
                      <span className="text-xs italic text-slate-300">{action_reason}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Decision Comments for Escalated but waiting for Senior Underwriter */}
            {status === 'escalated' && isPolicyManager && (
              <div className="p-4 rounded-xl border bg-purple-500/5 border-purple-500/15 text-purple-300 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-100 uppercase text-xs tracking-wider">Escalated Case Awaiting Executive Decision</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    You escalated this application for Senior Risk verification. Review comments are attached:
                  </p>
                  {action_reason && (
                    <div className="mt-2.5 p-2.5 bg-slate-950/80 border border-slate-900 rounded-lg">
                      <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider mb-0.5">Escalation Justification</span>
                      <span className="text-xs italic text-slate-300">{action_reason}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons (Policy Manager or Senior Manager) */}
            {canActionPolicy && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Select policy determination for this pending case:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleActionClick('approve')}
                    className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all active:scale-98"
                  >
                    <CheckCircle2 className="h-4.5 w-4.5" />
                    <span>Approve Application</span>
                  </button>
                  <button
                    onClick={() => handleActionClick('reject')}
                    className="flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-red-500/10 hover:shadow-red-500/20 transition-all active:scale-98"
                  >
                    <XCircle className="h-4.5 w-4.5" />
                    <span>Decline Application</span>
                  </button>
                  <button
                    onClick={() => handleActionClick('escalate')}
                    className="flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all active:scale-98"
                  >
                    <CornerUpRight className="h-4.5 w-4.5" />
                    <span>Escalate Case</span>
                  </button>
                </div>
              </div>
            )}

            {canActionSenior && (
              <div className="space-y-4">
                <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl text-purple-300 text-xs">
                  <span className="font-semibold block uppercase text-[9px] tracking-wider mb-1 text-purple-400">Escalation Reason from Underwriter</span>
                  <span className="italic">"{action_reason}"</span>
                </div>
                
                <p className="text-xs text-slate-400">
                  Execute final underwriting determination:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleActionClick('approve')}
                    className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all active:scale-98"
                  >
                    <CheckCircle2 className="h-4.5 w-4.5" />
                    <span>Executive Approval</span>
                  </button>
                  <button
                    onClick={() => handleActionClick('reject')}
                    className="flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-red-500/10 hover:shadow-red-500/20 transition-all active:scale-98"
                  >
                    <XCircle className="h-4.5 w-4.5" />
                    <span>Executive Decline</span>
                  </button>
                </div>
              </div>
            )}

            {!canActionPolicy && !canActionSenior && status !== 'approved' && status !== 'rejected' && (
              <p className="text-xs text-slate-500 italic text-center py-2">
                This case is locked in status "{status}" and cannot be actioned under your role ({role}).
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Decision Modal */}
      <ActionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedAction(null);
        }}
        actionType={selectedAction}
        onConfirm={handleConfirmAction}
        isSubmitting={actionMutation.isPending}
      />
    </div>
  );
};

// Helper for status colors
const getRiskBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'high':
    case 'rejected':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'medium':
    case 'escalated':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'low':
    case 'approved':
    case 'verified':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    default:
      return 'bg-slate-800 text-slate-400 border-slate-700';
  }
};
