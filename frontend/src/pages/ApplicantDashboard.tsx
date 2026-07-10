import React from 'react';
import { useApplications } from '../hooks/useApplications';
import { DocumentUpload } from '../components/upload/DocumentUpload';
import { Loading } from '../components/common/Loading';
import { ErrorPage } from '../components/common/ErrorPage';
import { FileText, ArrowRight, ShieldCheck, ShieldAlert, Sparkles, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export const ApplicantDashboard: React.FC = () => {
  const { data: applications, isLoading, isError, refetch } = useApplications();
  const { email } = useAuthStore();

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'escalated':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'pending':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'draft':
      default:
        return 'bg-slate-700/10 text-slate-400 border-slate-700/20';
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'low':
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
      {/* Welcome Banner */}
      <div className="glass-panel p-8 border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 blur-3xl"></div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-brand-400">
            <Sparkles className="h-4.5 w-4.5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Applicant Workspace</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome to InsureVerify
          </h1>
          <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
            Upload your underwriting document. Our AI Intake Agent will parse parameters, review flags, and assist in validating your application.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Upload Zone (Left/Middle Spanning 2 cols) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-200 uppercase tracking-wide">
              Initiate Application
            </h3>
            <p className="text-xs text-slate-400">
              Submit your documents for automated intake extraction.
            </p>
          </div>
          <DocumentUpload />
        </div>

        {/* Applications History (Right Spanning 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-200 uppercase tracking-wide">
              Application Intake & History
            </h3>
            <p className="text-xs text-slate-400">
              Track the state and underwriting outcome of your cases.
            </p>
          </div>

          {isLoading ? (
            <div className="glass-panel p-8 border-slate-850">
              <Loading message="Loading application history..." />
            </div>
          ) : isError ? (
            <div className="glass-panel p-8 border-slate-850">
              <ErrorPage message="Failed to load your history." onRetry={refetch} />
            </div>
          ) : !applications || applications.length === 0 ? (
            <div className="glass-panel p-12 border-slate-850/80 text-center flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-500">
                <FileText className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-300">No active applications</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  You haven't uploaded any applications yet. Complete the upload zone to trigger your first intake session.
                </p>
              </div>
            </div>
          ) : (
            <div className="glass-panel border-slate-800/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-900/40 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      <th className="py-4 px-6">ID & Date</th>
                      <th className="py-4 px-6">AI Risk Rating</th>
                      <th className="py-4 px-6">Decision Status</th>
                      <th className="py-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60 text-xs">
                    {applications.map((app) => {
                      const flagCount = Object.values(app.extracted_data).reduce(
                        (acc, field) => acc + (field.flags ? field.flags.length : 0),
                        0
                      );
                      
                      return (
                        <tr key={app.id} className="hover:bg-slate-900/20 transition-colors group">
                          <td className="py-4.5 px-6">
                            <div className="font-semibold text-slate-200">Case ID: {app.id}</div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(app.created_at).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="py-4.5 px-6">
                            <span className={`text-[10px] font-bold uppercase border px-2 py-0.5 rounded-full ${getRiskBadge(app.risk_rating || 'low')}`}>
                              {app.risk_rating}
                            </span>
                            {flagCount > 0 && app.status === 'draft' && (
                              <span className="text-[10px] font-medium text-amber-400/80 block mt-1">
                                {flagCount} unresolved flag(s)
                              </span>
                            )}
                          </td>
                          <td className="py-4.5 px-6">
                            <span className={`text-[10px] font-bold uppercase border px-2 py-0.5 rounded-full ${getStatusBadge(app.status)}`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="py-4.5 px-6 text-right">
                            <Link
                              to={`/applications/${app.id}`}
                              className="inline-flex items-center gap-1.5 text-brand-400 hover:text-brand-300 font-semibold group-hover:translate-x-0.5 transition-transform"
                            >
                              <span>
                                {app.status === 'draft' ? 'Edit & Submit' : 'View Case'}
                              </span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
