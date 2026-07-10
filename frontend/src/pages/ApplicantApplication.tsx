import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApplication, useValidateApplication, useSubmitApplication, useDeleteApplication } from '../hooks/useApplications';
import { ExtractionForm } from '../components/application/ExtractionForm';
import { RiskCard } from '../components/application/RiskCard';
import { PDFViewer } from '../components/application/PDFViewer';
import { Loading } from '../components/common/Loading';
import { ErrorPage } from '../components/common/ErrorPage';
import { ArrowLeft, Clock, FileText, CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export const ApplicantApplication: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const appId = id ? parseInt(id, 10) : 0;
  const navigate = useNavigate();

  const { data: application, isLoading, isError, refetch } = useApplication(appId);
  const validateMutation = useValidateApplication();
  const submitMutation = useSubmitApplication();
  const deleteMutation = useDeleteApplication();

  const handleSave = async (updatedFields: Record<string, any>) => {
    try {
      await validateMutation.mutateAsync({
        id: appId,
        extractedData: updatedFields,
      });
    } catch (err) {
      console.error("Validation failed", err);
    }
  };

  const handleSubmitApplication = async () => {
    try {
      await submitMutation.mutateAsync(appId);
      // Refresh local queries
      refetch();
    } catch (err) {
      console.error("Submission failed", err);
    }
  };

  const handleDeleteApplication = async () => {
    if (window.confirm("Are you sure you want to delete this application? This action cannot be undone and the file will be removed.")) {
      try {
        await deleteMutation.mutateAsync(appId);
        navigate('/dashboard');
      } catch (err) {
        console.error("Deletion failed", err);
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-850 pb-6">
        <div className="space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Underwriting Case Review</h1>
            <span className="text-xs text-slate-500 font-mono bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-md">
              Case #{application.id}
            </span>
          </div>
        </div>

        {/* Top Status Alert bar */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-4 w-4 text-slate-500" />
            <span>Modified: {new Date(application.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Top Split View: PDF on Left, AI Assessment on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Left Side: Uploaded PDF (3 columns) */}
        <div className="lg:col-span-3">
          <PDFViewer applicationId={application.id} />
        </div>

        {/* Right Side: AI Risk assessment & Decision status (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Decision Status Box (If not Draft) */}
          {status !== 'draft' && (
            <div className={`p-6 rounded-2xl border text-sm font-medium ${
              status === 'approved' 
                ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-300' 
                : status === 'rejected'
                ? 'bg-red-500/5 border-red-500/10 text-red-300'
                : status === 'escalated'
                ? 'bg-purple-500/5 border-purple-500/10 text-purple-300'
                : 'bg-blue-500/5 border-blue-500/10 text-blue-300'
            }`}>
              <div className="flex items-start gap-3">
                {status === 'approved' && <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />}
                {status === 'rejected' && <XCircle className="h-6 w-6 text-red-400 shrink-0" />}
                {status === 'escalated' && <AlertTriangle className="h-6 w-6 text-purple-400 shrink-0" />}
                {status === 'pending' && <Clock className="h-6 w-6 text-blue-400 shrink-0" />}

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-100 uppercase tracking-wide">
                    {status === 'approved' && 'Underwriting Approved'}
                    {status === 'rejected' && 'Underwriting Declined'}
                    {status === 'escalated' && 'Escalated to Senior Leadership'}
                    {status === 'pending' && 'Underwriting Review Pending'}
                  </h4>
                  
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    {status === 'approved' && 'Your application met all system criteria. Underwriting parameters are locked and policy document generation is initiated.'}
                    {status === 'rejected' && 'Declined based on clinical risk assessment. Review comments are attached below.'}
                    {status === 'escalated' && 'Your case is escalated for advanced risk evaluation. A senior review specialist is assigned.'}
                    {status === 'pending' && 'Application files received. Underwriter assignment and verification review is currently in progress.'}
                  </p>

                  {action_reason && (
                    <div className="mt-3.5 p-3 bg-slate-950/80 border border-slate-900 rounded-xl">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mb-1">
                        Reviewer Decision Comments
                      </span>
                      <span className="text-xs text-slate-300 italic">{action_reason}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <RiskCard
            application={application}
            isApplicant={true}
          />
        </div>
      </div>

      {/* Bottom Section: Form fields (Editable if draft, read-only list if not) */}
      <div className="glass-panel p-6 border-slate-800/80 mt-8">
        <div className="flex items-center justify-between border-b border-slate-855 pb-4 mb-6">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-200">
              {status === 'draft' ? 'Edit & Verify Application Parameters' : 'Intake Parameters'}
            </h3>
            <p className="text-xs text-slate-400">
              {status === 'draft' 
                ? 'Correct the AI-extracted fields where validation failed. Click Save to revalidate, or Submit once all flags are resolved.' 
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
          // Read-only parameters listing spanning full width (arranged nicely in grid)
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(application.extracted_data).map(([key, field]) => {
              const hasFlags = field.flags && field.flags.length > 0;
              return (
                <div 
                  key={key} 
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-900 bg-slate-900/10 hover:border-slate-800/60 transition-colors gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      {field.label}
                    </span>
                    <span className="text-sm font-semibold text-slate-200">
                      {field.value || <span className="text-slate-600 italic">None / Blank</span>}
                    </span>
                  </div>
                  
                  {hasFlags ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[10px] font-bold uppercase tracking-wide">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Flagged</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/85 text-slate-400 border border-slate-800 rounded-full text-[10px] font-bold uppercase tracking-wide">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Verified</span>
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
