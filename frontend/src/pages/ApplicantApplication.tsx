import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApplication, useValidateApplication, useSubmitApplication, useDeleteApplication } from '../hooks/useApplications';
import { ExtractionForm } from '../components/application/ExtractionForm';
import { RiskCard } from '../components/application/RiskCard';
import { PDFViewer } from '../components/application/PDFViewer';
import { Loading } from '../components/common/Loading';
import { ErrorPage } from '../components/common/ErrorPage';
import { useThemeStore } from '../stores/themeStore';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';

export const ApplicantApplication: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const appId = id ? parseInt(id, 10) : 0;
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const isLight = theme === 'light';

  const { data: application, isLoading, isError, refetch } = useApplication(appId);
  const validateMutation  = useValidateApplication();
  const submitMutation    = useSubmitApplication();
  const deleteMutation    = useDeleteApplication();

  const handleSave = async (updatedFields: Record<string, any>) => {
    try {
      await validateMutation.mutateAsync({ id: appId, extractedData: updatedFields });
    } catch (err) {
      console.error('Validation failed', err);
    }
  };

  const handleSubmitApplication = async () => {
    try {
      await submitMutation.mutateAsync(appId);
      alert("Application is submitted and under review");
      refetch();
    } catch (err) {
      console.error('Submission failed', err);
    }
  };

  const handleDeleteApplication = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete this application? This action cannot be undone.'
      )
    ) {
      try {
        await deleteMutation.mutateAsync(appId);
        navigate('/dashboard');
      } catch (err) {
        console.error('Deletion failed', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Loading message="Loading application details and underwriting parameters..." />
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

  const { status, action_reason } = application;

  // Theme-based class helpers
  const labelCls   = isLight ? 'text-slate-500' : 'text-slate-400';
  const textCls    = isLight ? 'text-slate-800' : 'text-slate-200';
  const mutedCls   = isLight ? 'text-slate-600' : 'text-slate-400';
  const divider    = isLight ? 'border-slate-200/70' : 'border-slate-800/70';
  const panelBase  = isLight ? 'bg-white/85 border-slate-200/80 shadow-sm' : '';
  const caseChip   = isLight
    ? 'text-slate-500 bg-slate-100 border-slate-200 font-mono'
    : 'text-slate-500 font-mono bg-slate-900 border-slate-850';

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b ${divider} pb-6`}>
        <div className="space-y-1">
          <Link
            to="/dashboard"
            className={`flex items-center gap-1.5 text-xs transition-colors mb-2 ${
              isLight
                ? 'text-slate-400 hover:text-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <h1 className={`text-2xl font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Underwriting Case Review
            </h1>
            <span className={`text-xs px-2 py-0.5 rounded-md border ${caseChip}`}>
              Case #{application.id}
            </span>
          </div>
        </div>

        <div className={`flex items-center gap-1 text-xs ${labelCls}`}>
          <Clock className="h-4 w-4 opacity-60" />
          Modified: {new Date(application.updated_at).toLocaleDateString()}
        </div>
      </div>

      {/* ── Split view: PDF | AI Assessment ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* Left: PDF Viewer (3 cols) */}
        <div className="lg:col-span-3">
          <PDFViewer applicationId={application.id} />
        </div>

        {/* Right: Decision status + RiskCard (2 cols) */}
        <div className="lg:col-span-2 space-y-4">

          {/* Decision status box (when not draft) */}
          {status !== 'draft' && (
            <div
              className={`p-5 rounded-2xl border text-sm font-medium ${
                status === 'approved'
                  ? isLight
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-300'
                  : status === 'rejected'
                  ? isLight
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-red-500/5 border-red-500/10 text-red-300'
                  : status === 'escalated'
                  ? isLight
                    ? 'bg-purple-50 border-purple-200 text-purple-700'
                    : 'bg-purple-500/5 border-purple-500/10 text-purple-300'
                  : isLight
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-blue-500/5 border-blue-500/10 text-blue-300'
              }`}
            >
              <div className="flex items-start gap-3">
                {status === 'approved'  && <CheckCircle2  className="h-5 w-5 text-emerald-500 shrink-0" />}
                {status === 'rejected'  && <XCircle       className="h-5 w-5 text-red-500    shrink-0" />}
                {status === 'escalated' && <AlertTriangle className="h-5 w-5 text-purple-500  shrink-0" />}
                {status === 'pending'   && <Clock         className="h-5 w-5 text-blue-500    shrink-0" />}

                <div className="space-y-1">
                  <h4 className={`font-bold uppercase tracking-wide ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                    {status === 'approved'  && 'Underwriting Approved'}
                    {status === 'rejected'  && 'Underwriting Declined'}
                    {status === 'escalated' && 'Escalated to Senior Leadership'}
                    {status === 'pending'   && 'Underwriting Review Pending'}
                  </h4>
                  <p className={`text-xs leading-relaxed ${mutedCls}`}>
                    {status === 'approved'  && 'Your application met all criteria. Policy document generation is initiated.'}
                    {status === 'rejected'  && 'Declined based on clinical risk assessment. Review comments attached below.'}
                    {status === 'escalated' && 'Case escalated for advanced risk evaluation. A senior review specialist is assigned.'}
                    {status === 'pending'   && 'Application files received. Underwriter assignment and verification is in progress.'}
                  </p>

                  {action_reason && (
                    <div
                      className={`mt-3 p-3 rounded-xl border ${
                        isLight
                          ? 'bg-white/70 border-slate-200'
                          : 'bg-slate-950/80 border-slate-900'
                      }`}
                    >
                      <span
                        className={`text-[10px] block uppercase font-bold tracking-wider mb-1 ${labelCls}`}
                      >
                        Reviewer Comments
                      </span>
                      <span className={`text-xs italic ${mutedCls}`}>{action_reason}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <RiskCard application={application} isApplicant={true} />
        </div>
      </div>

      {/* ── Form / Read-only parameters ────────────────────────────────────── */}
      <div className={`glass-panel p-6 ${panelBase} border-slate-200/60 mt-8`}>
        <div className={`flex items-center justify-between border-b ${divider} pb-4 mb-6`}>
          <div className="space-y-1">
            <h3 className={`text-base font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              {status === 'draft' ? 'Edit & Verify Application Parameters' : 'Intake Parameters'}
            </h3>
            <p className={`text-xs ${labelCls}`}>
              {status === 'draft'
                ? 'Correct the AI-extracted fields where validation failed. Save to revalidate, then Submit once all flags are resolved.'
                : 'Read-only record of parameters submitted for underwriting.'}
            </p>
          </div>
        </div>

        {status === 'draft' ? (
          <ExtractionForm
            application={application}
            onSave={handleSave}
            isSaving={validateMutation.isPending}
            onDelete={handleDeleteApplication}
            isDeleting={deleteMutation.isPending}
            onSubmitApp={handleSubmitApplication}
            isSubmitting={submitMutation.isPending}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Object.entries(application.extracted_data).map(([key, field]) => {
              const hasFlags = field.flags && field.flags.length > 0;
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-colors gap-3 ${
                    isLight
                      ? 'bg-white/70 border-slate-200/80 hover:border-slate-300/80'
                      : 'bg-slate-900/10 border-slate-900 hover:border-slate-800/60'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className={`text-[10px] font-bold uppercase tracking-widest block ${labelCls}`}>
                      {field.label}
                    </span>
                    <span className={`text-sm font-semibold truncate block ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                      {field.value || (
                        <span className={isLight ? 'text-slate-400 italic' : 'text-slate-600 italic'}>
                          None / Blank
                        </span>
                      )}
                    </span>
                  </div>

                  {hasFlags ? (
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide shrink-0 ${
                        isLight
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Flagged
                    </div>
                  ) : (
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide shrink-0 ${
                        isLight
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-slate-900/85 text-slate-400 border-slate-800'
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      Verified
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
