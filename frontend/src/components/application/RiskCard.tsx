import React from 'react';
import { Sparkles, AlertOctagon, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Application } from '../../types';

interface RiskCardProps {
  application: Application;
  isApplicant?: boolean;
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

export const RiskCard: React.FC<RiskCardProps> = ({
  application,
  isApplicant = false,
  onSubmit,
  isSubmitting = false,
}) => {
  const { risk_rating = 'low', summary = '', status } = application;

  // Count active flags
  const flagCount = Object.values(application.extracted_data).reduce(
    (acc, field) => acc + (field.flags ? field.flags.length : 0),
    0
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
                  Edit the highlighted risk fields above to resolve the warnings. The submit button is disabled until zero flags remain.
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

      {/* AI Plain-Language Summary */}
      <div className="glass-panel p-6 border-slate-800/80 relative overflow-hidden">
        {/* Decorative subtle pulse glow */}
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 rounded-full bg-brand-500/10 blur-xl"></div>
        
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
            AI Plain-Language Summary
          </h4>
        </div>

        <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {summary || 'Analyst model generating underwriting profile summary...'}
        </div>
      </div>

      {/* Applicant Submit Button */}
      {isApplicant && status === 'draft' && onSubmit && (
        <button
          onClick={onSubmit}
          disabled={flagCount > 0 || isSubmitting}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
            flagCount > 0
              ? 'bg-slate-900 border border-slate-850 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-98'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
              <span>Submitting Application...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Submit Application to Review</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
