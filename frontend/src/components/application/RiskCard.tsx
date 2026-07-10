import React from 'react';
import { Sparkles, AlertOctagon, CheckCircle2, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Application } from '../../types';

interface RiskCardProps {
  application: Application;
  isApplicant?: boolean;
}

export const RiskCard: React.FC<RiskCardProps> = ({
  application,
  isApplicant = false,
}) => {
  const { risk_rating = 'low', summary = '', status } = application;

  // Count active flags
  const flagCount = Object.values(application.extracted_data).reduce(
    (acc, field) => acc + (field.flags ? field.flags.length : 0),
    0
  );

  const flagFields = Object.entries(application.extracted_data).filter(
    ([_, field]) => field.flags && field.flags.length > 0
  );

  const getRiskStyles = (rating: string) => {
    switch (rating.toLowerCase()) {
      case 'high':
        return {
          pill: 'bg-red-500/10 text-red-400 border-red-500/20',
          bg: 'from-red-500/10 to-transparent border-red-500/10',
          text: 'text-red-400',
          iconColor: 'text-red-400',
        };
      case 'medium':
        return {
          pill: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          bg: 'from-amber-500/10 to-transparent border-amber-500/10',
          text: 'text-amber-400',
          iconColor: 'text-amber-400',
        };
      case 'low':
      default:
        return {
          pill: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          bg: 'from-emerald-500/10 to-transparent border-emerald-500/10',
          text: 'text-emerald-400',
          iconColor: 'text-emerald-400',
        };
    }
  };

  const styles = getRiskStyles(risk_rating || 'low');

  return (
    <div className="space-y-6">
      {/* Risk Level & Flags Count */}
      <div className={`p-6 rounded-2xl border bg-gradient-to-br ${styles.bg} border-slate-800`}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              AI Risk Classifier
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${styles.pill}`}>
                {risk_rating} Risk
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Warnings
            </span>
            <div className="mt-1">
              <span className={`text-lg font-extrabold ${flagCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {flagCount} Flags
              </span>
            </div>
          </div>
        </div>

        {/* Status specific alert messages */}
        {isApplicant && status === 'draft' && (
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            {flagCount > 0 ? (
              <div className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/10 text-amber-300 p-3 rounded-xl text-xs">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">Underwriting Flags Restricting Submission</span>
                  Please resolve the highlighted risk fields below to enable submission.
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 bg-emerald-500/5 border border-emerald-500/10 text-emerald-300 p-3 rounded-xl text-xs">
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-400 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">Verification Clearance Received</span>
                  All system flags resolved. Your application is verified and ready for submission.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Validation Checks Summary & Errors */}
      <div className="glass-panel p-5 border-slate-800/80 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
          <AlertTriangle className="h-4 w-4 text-brand-400" />
          <h4 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
            Validation Check Summary
          </h4>
        </div>

        {flagFields.length > 0 ? (
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {flagFields.map(([key, field]) => {
              const activeFlag = field.flags[0];
              const isHigh = activeFlag.severity.toLowerCase() === 'high';
              return (
                <div
                  key={key}
                  className={`p-3.5 rounded-xl border text-xs flex gap-3 transition-all ${
                    isHigh
                      ? 'bg-red-500/5 border-red-500/10 text-red-300'
                      : 'bg-amber-500/5 border-amber-500/10 text-amber-300'
                  }`}
                >
                  <AlertOctagon className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${isHigh ? 'text-red-400' : 'text-amber-400'}`} />
                  <div>
                    <span className="font-bold block text-slate-150 mb-0.5">{field.label}</span>
                    <span className="leading-relaxed text-slate-400">{activeFlag.message}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 flex flex-col items-center gap-2">
            <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wide">All Checks Cleared</h5>
              <p className="text-[11px] text-slate-400 max-w-[220px] mx-auto leading-relaxed">
                This application meets all basic life insurance intake criteria.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* AI Plain-Language Summary */}
      <div className="glass-panel p-6 border-slate-800/80 relative overflow-hidden">
        {/* Decorative subtle pulse glow */}
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 rounded-full bg-brand-500/10 blur-xl"></div>
        
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
            AI Underwriting Assessment
          </h4>
        </div>

        <div className="text-sm text-slate-350 leading-relaxed whitespace-pre-wrap">
          {summary || 'Analyst model generating underwriting profile summary...'}
        </div>
      </div>
    </div>
  );
};
