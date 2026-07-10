import React, { useState } from 'react';
import { useApplications } from '../hooks/useApplications';
import { Loading } from '../components/common/Loading';
import { ErrorPage } from '../components/common/ErrorPage';
import { FileText, ArrowRight, ShieldCheck, ShieldAlert, Clock, Filter, Eye, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SeniorManagerDashboard: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('escalated');
  const { data: applications, isLoading, isError, refetch } = useApplications(statusFilter);

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
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-850 pb-6 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
            <Award className="h-4.5 w-4.5" />
            <span>Senior Underwriting Panel</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Executive Worklist</h1>
          <p className="text-xs text-slate-400">
            Review escalated risk cases requiring executive-level life insurance authorization.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-xl">
            <Filter className="h-3.5 w-3.5" />
            <span>Queue Filter:</span>
          </div>
          <div className="flex bg-slate-950 p-1 border border-slate-850 rounded-xl">
            <button
              onClick={() => setStatusFilter('escalated')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                statusFilter === 'escalated' ? 'bg-purple-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Escalated
            </button>
            <button
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                statusFilter === '' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Resolved
            </button>
          </div>
        </div>
      </div>

      {/* Main List */}
      {isLoading ? (
        <Loading message="Fetching executive escalations..." />
      ) : isError ? (
        <ErrorPage message="Unable to load executive worklist." onRetry={refetch} />
      ) : !applications || applications.length === 0 ? (
        <div className="glass-panel p-16 border-slate-850/80 text-center flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-500">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-300">Escalation Queue Clear</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              There are no unresolved executive escalations. All high-risk cases are successfully dispatched.
            </p>
          </div>
        </div>
      ) : (
        <div className="glass-panel border-slate-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-900/40 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  <th className="py-4 px-6">Case Info</th>
                  <th className="py-4 px-6">Applicant</th>
                  <th className="py-4 px-6">AI Risk</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-855 text-xs">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-900/20 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-200">Case ID: {app.id}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>Submitted: {new Date(app.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-slate-300 font-medium font-mono">
                        {app.extracted_data.full_name?.value || `User ID: ${app.applicant_id}`}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-bold uppercase border px-2 py-0.5 rounded-full ${getRiskBadge(app.risk_rating || 'low')}`}>
                        {app.risk_rating}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-bold uppercase border px-2 py-0.5 rounded-full ${getStatusBadge(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/applications/${app.id}`}
                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 px-3.5 py-1.5 rounded-xl font-semibold text-slate-300 hover:text-white transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Review Detail</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
