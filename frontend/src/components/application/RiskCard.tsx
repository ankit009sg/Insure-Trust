import React from 'react';
import {
  Sparkles,
  AlertOctagon,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  ClipboardList,
  Activity,
  Bot,
  WifiOff,
} from 'lucide-react';
import { Application } from '../../types';
import { useThemeStore } from '../../stores/themeStore';

interface RiskCardProps {
  application: Application;
  isApplicant?: boolean;
}

export const RiskCard: React.FC<RiskCardProps> = ({
  application,
  isApplicant = false,
}) => {
  const { theme } = useThemeStore();
  const isLight = theme === 'light';

  const { risk_rating = 'low', summary = '', status } = application;

  // ── Counts & flag lists ────────────────────────────────────────────────────
  // Applicants only care about blocking data issues in the checklist.
  // Underwriters see all risk factors and data issues.
  const allFlagFields = Object.entries(application.extracted_data).filter(
    ([_, field]) => {
      if (!field.flags || field.flags.length === 0) return false;
      if (isApplicant) {
        return field.flags.some(f => f.blocking);
      }
      return true;
    }
  );

  const getRelevantFlag = (flags: typeof application.extracted_data[string]['flags']) => {
    if (!flags || flags.length === 0) return null;
    if (isApplicant) {
      return flags.find(f => f.blocking) || null;
    }
    return flags[0];
  };

  const getRelevantFlags = (flags: typeof application.extracted_data[string]['flags']) => {
    if (!flags) return [];
    if (isApplicant) {
      return flags.filter(f => f.blocking);
    }
    return flags;
  };

  const flagCount = allFlagFields.reduce(
    (acc, [_, f]) => acc + getRelevantFlags(f.flags).length,
    0
  );

  const highFlags   = allFlagFields.filter(([_, f]) => getRelevantFlag(f.flags)?.severity === 'high');
  const medFlags    = allFlagFields.filter(([_, f]) => getRelevantFlag(f.flags)?.severity === 'medium');
  const lowFlags    = allFlagFields.filter(([_, f]) => getRelevantFlag(f.flags)?.severity === 'low');

  const totalFields = Object.keys(application.extracted_data).length;
  const cleanFields = totalFields - allFlagFields.length;

  // ── Coverage-to-income ratio ───────────────────────────────────────────────
  const covRaw = String(
    application.extracted_data['coverage_amount']?.value || ''
  ).replace(/[^0-9.]/g, '');
  const incRaw = String(
    application.extracted_data['annual_income']?.value || ''
  ).replace(/[^0-9.]/g, '');
  const covVal = parseFloat(covRaw) || 0;
  const incVal = parseFloat(incRaw) || 0;
  const ratio  = covVal > 0 && incVal > 0 ? covVal / incVal : null;

  // ── Risk style maps ────────────────────────────────────────────────────────
  const getRiskStyles = (rating: string) => {
    switch (rating.toLowerCase()) {
      case 'high':
        return {
          pill:   'bg-red-500/10 text-red-500 border-red-500/25',
          bg:     isLight
            ? 'from-red-50/80 to-white/60 border-red-200/60'
            : 'from-red-500/10 to-transparent border-red-500/10',
          dot:    'bg-red-400',
          label:  'text-red-500',
        };
      case 'medium':
        return {
          pill:   'bg-amber-500/10 text-amber-500 border-amber-500/25',
          bg:     isLight
            ? 'from-amber-50/80 to-white/60 border-amber-200/60'
            : 'from-amber-500/10 to-transparent border-amber-500/10',
          dot:    'bg-amber-400',
          label:  'text-amber-500',
        };
      default:
        return {
          pill:   'bg-emerald-500/10 text-emerald-600 border-emerald-500/25',
          bg:     isLight
            ? 'from-emerald-50/80 to-white/60 border-emerald-200/60'
            : 'from-emerald-500/10 to-transparent border-emerald-500/10',
          dot:    'bg-emerald-400',
          label:  'text-emerald-600',
        };
    }
  };

  const styles = getRiskStyles(risk_rating || 'low');

  // ── Helpers ────────────────────────────────────────────────────────────────
  const panelBase = isLight
    ? 'bg-white border-slate-300/70 shadow-md'
    : 'bg-slate-900/30 border-slate-800/60';

  const labelCls = isLight ? 'text-slate-500' : 'text-slate-400';
  const textCls  = isLight ? 'text-slate-800' : 'text-slate-200';
  const mutedCls = isLight ? 'text-slate-600' : 'text-slate-350';
  const divider  = isLight ? 'border-slate-200/60' : 'border-slate-800/60';

  return (
    <div className="space-y-4 animate-fade-slide-up">

      {/* ── 1. Risk Level Bar ──────────────────────────────────────────────── */}
      <div
        className={`p-5 rounded-2xl border bg-gradient-to-br ${styles.bg}`}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${labelCls}`}>
              AI Risk Classifier
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`relative flex h-2 w-2`}
              >
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full ${styles.dot} opacity-60`}
                />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${styles.dot}`} />
              </span>
              <span
                className={`text-sm font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${styles.pill}`}
              >
                {risk_rating} Risk
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${labelCls}`}>
              Active Flags
            </span>
            <div className="mt-1">
              <span
                className={`text-2xl font-extrabold tabular-nums ${
                  flagCount > 0
                    ? risk_rating === 'high' ? 'text-red-500' : 'text-amber-500'
                    : 'text-emerald-500'
                }`}
              >
                {flagCount}
              </span>
              <span className={`text-xs ml-1 ${labelCls}`}>
                / {totalFields} fields
              </span>
            </div>
          </div>
        </div>

        {/* Applicant draft status notice */}
        {isApplicant && status === 'draft' && (
          <div className={`mt-4 pt-4 border-t ${divider}`}>
            {flagCount > 0 ? (
              <div
                className={`flex items-start gap-2.5 p-3 rounded-xl text-xs border ${
                  isLight
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-amber-500/5 border-amber-500/15 text-amber-300'
                }`}
              >
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">
                    Underwriting Flags Restricting Submission
                  </span>
                  Please resolve the highlighted fields below to enable submission.
                </div>
              </div>
            ) : (
              <div
                className={`flex items-start gap-2.5 p-3 rounded-xl text-xs border ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-emerald-500/5 border-emerald-500/15 text-emerald-300'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">Verification Clearance Received</span>
                  All flags resolved. Ready for submission.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 2. AI Assessment Panel (image-style) ──────────────────────────── */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          isLight
            ? 'bg-white border-slate-300/80 shadow-md'
            : 'bg-slate-900/30 border-slate-800/60'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center gap-2.5 px-5 py-3.5 border-b ${
            isLight
              ? 'bg-gradient-to-r from-brand-50 to-white border-slate-200/60'
              : 'bg-gradient-to-r from-brand-950/60 to-transparent border-slate-800/60'
          }`}
        >
          <div
            className={`p-1.5 rounded-lg border ${
              isLight
                ? 'bg-brand-100 border-brand-200 text-brand-600'
                : 'bg-brand-500/15 border-brand-500/25 text-brand-400'
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
          </div>
          <h4
            className={`text-xs font-bold tracking-widest uppercase ${
              isLight ? 'text-brand-700' : 'text-brand-400'
            }`}
          >
            AI Assessment
          </h4>
          <div className="ml-auto flex items-center gap-1">
            <Sparkles
              className={`h-3 w-3 ${isLight ? 'text-brand-500' : 'text-brand-400'} animate-pulse-soft`}
            />
          </div>
        </div>

        <div className="p-5 space-y-5">

          {/* Summary paragraph */}
          <div>
            {summary ? (
              <p className={`text-sm leading-relaxed ${mutedCls}`}>
                {summary}
              </p>
            ) : (
              <div className="flex items-center gap-2">
                <WifiOff className={`h-4 w-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                <p className={`text-sm italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  AI summary unavailable. Groq API may be unreachable — using rule-based assessment.
                </p>
              </div>
            )}
          </div>

          {/* COMPLETENESS section */}
          <div className={`border-t ${divider} pt-4`}>
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList
                className={`h-3.5 w-3.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}
              />
              <span
                className={`text-[10px] font-bold uppercase tracking-widest ${labelCls}`}
              >
                Completeness
              </span>
            </div>

            {flagCount > 0 ? (
              <p
                className={`text-sm font-medium ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                <span
                  className={`font-bold ${
                    risk_rating === 'high' ? 'text-red-500' : 'text-amber-500'
                  }`}
                >
                  {flagCount} field{flagCount !== 1 ? 's' : ''}
                </span>{' '}
                require attention before underwriting can proceed.
              </p>
            ) : (
              <p className="text-sm font-medium text-emerald-500">
                All {totalFields} fields cleared — no issues detected.
              </p>
            )}

            {/* Mini flag breakdown pills */}
            {flagCount > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {highFlags.length > 0 && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${
                      isLight
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}
                  >
                    {highFlags.length} High
                  </span>
                )}
                {medFlags.length > 0 && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${
                      isLight
                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {medFlags.length} Medium
                  </span>
                )}
                {lowFlags.length > 0 && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${
                      isLight
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}
                  >
                    {lowFlags.length} Low
                  </span>
                )}
              </div>
            )}
          </div>

          {/* RISK FACTORS section */}
          {allFlagFields.length > 0 && (
            <div className={`border-t ${divider} pt-4`}>
              <div className="flex items-center gap-2 mb-3">
                <Activity
                  className={`h-3.5 w-3.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}
                />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${labelCls}`}>
                  Risk Factors
                </span>
              </div>

              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {allFlagFields.map(([key, field]) => {
                  const flag = getRelevantFlag(field.flags);
                  if (!flag) return null;

                  const isHigh = flag.severity === 'high';
                  const isMed  = flag.severity === 'medium';

                  const chipStyle = isHigh
                    ? isLight
                      ? 'bg-red-50 border-red-200/80 text-red-700'
                      : 'bg-red-500/5 border-red-500/15 text-red-300'
                    : isMed
                    ? isLight
                      ? 'bg-amber-50 border-amber-200/80 text-amber-700'
                      : 'bg-amber-500/5 border-amber-500/15 text-amber-300'
                    : isLight
                    ? 'bg-blue-50 border-blue-200/80 text-blue-700'
                    : 'bg-blue-500/5 border-blue-500/15 text-blue-300';

                  return (
                    <div
                      key={key}
                      className={`flex gap-2.5 p-2.5 rounded-lg border text-xs ${chipStyle}`}
                    >
                      <AlertOctagon
                        className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${
                          isHigh ? 'text-red-500' : isMed ? 'text-amber-500' : 'text-blue-500'
                        }`}
                      />
                      <div>
                        <span
                          className={`font-bold block mb-0.5 ${
                            isLight ? 'text-slate-700' : 'text-slate-200'
                          }`}
                        >
                          {field.label}
                        </span>
                        <span className="leading-relaxed opacity-90">{flag.message}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* INCOME & COVERAGE section */}
          {ratio !== null && (
            <div className={`border-t ${divider} pt-4`}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp
                  className={`h-3.5 w-3.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}
                />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${labelCls}`}>
                  Income &amp; Coverage
                </span>
              </div>

              <div
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-slate-950/40 border-slate-800/60'
                }`}
              >
                <div>
                  <span className={`text-[10px] uppercase tracking-wider font-bold ${labelCls}`}>
                    Coverage-to-Income Ratio
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`text-xl font-extrabold tabular-nums ${
                        ratio > 20
                          ? 'text-red-500'
                          : ratio > 15
                          ? 'text-amber-500'
                          : 'text-emerald-500'
                      }`}
                    >
                      {ratio.toFixed(1)}×
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] uppercase tracking-wider font-bold ${labelCls}`}>
                    Recommended Limit
                  </span>
                  <div className={`text-sm font-bold mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    ≤ 20×
                  </div>
                </div>
              </div>

              {ratio > 20 && (
                <p className={`text-xs mt-2 ${isLight ? 'text-red-600' : 'text-red-400'}`}>
                  Coverage-to-income ratio is {ratio.toFixed(1)}×. Exceeds recommended 20× limit —
                  escalation may indicate income mis-representation or under-insurance risk.
                </p>
              )}
            </div>
          )}

          {/* All clear state */}
          {allFlagFields.length === 0 && (
            <div className={`border-t ${divider} pt-4 flex flex-col items-center gap-2 py-3`}>
              <div
                className={`p-2.5 rounded-full border ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-500 border-emerald-200'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}
              >
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="text-center space-y-0.5">
                <h5
                  className={`text-xs font-bold uppercase tracking-wide ${
                    isLight ? 'text-slate-700' : 'text-slate-200'
                  }`}
                >
                  All Checks Cleared
                </h5>
                <p className={`text-[11px] max-w-[220px] mx-auto leading-relaxed ${labelCls}`}>
                  This application meets all standard life insurance intake criteria.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
