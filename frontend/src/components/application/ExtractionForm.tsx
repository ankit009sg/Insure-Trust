import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Application } from '../../types';
import {
  AlertTriangle,
  ShieldCheck,
  Trash2,
  Save,
  CheckCircle2,
  User,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Cigarette,
  HeartPulse,
  Wine,
  Users,
  Briefcase,
  IndianRupee,
  Shield,
  Clock,
  UserCheck,
  Building2,
} from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

interface ExtractionFormProps {
  application: Application;
  onSave: (data: Record<string, any>) => void;
  isSaving: boolean;
  onDelete: () => void;
  isDeleting: boolean;
  onSubmitApp: () => void;
  isSubmitting: boolean;
}

// Field metadata — icon & input type for each key
const FIELD_CONFIG: Record<
  string,
  { icon: React.ElementType; type: 'text' | 'select' | 'date' | 'number'; options?: string[] }
> = {
  name:                   { icon: User,       type: 'text' },
  dob:                    { icon: Calendar,   type: 'date' },
  gender:                 { icon: UserCheck,  type: 'select', options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
  pan_number:             { icon: CreditCard, type: 'text' },
  phone:                  { icon: Phone,      type: 'text' },
  email:                  { icon: Mail,       type: 'text' },
  address:                { icon: MapPin,     type: 'text' },
  tobacco_use:            { icon: Cigarette,  type: 'select', options: ['No', 'Yes', 'Former', 'Never'] },
  pre_existing_conditions:{ icon: HeartPulse, type: 'text' },
  alcohol_consumption:    { icon: Wine,       type: 'select', options: ['None', 'Occasional', 'Moderate', 'Social', 'Heavy'] },
  family_history:         { icon: Users,      type: 'text' },
  profession:             { icon: Briefcase,  type: 'text' },
  annual_income:          { icon: IndianRupee,type: 'number' },
  coverage_amount:        { icon: Shield,     type: 'number' },
  policy_term:            { icon: Clock,      type: 'text' },
  nominee:                { icon: UserCheck,  type: 'text' },
  employment_type:        { icon: Building2,  type: 'select', options: ['Employed', 'Self-Employed', 'Retired', 'Unemployed', 'Student'] },
};

// Layout groups — pairs shown side-by-side on md+
const FIELD_LAYOUT: Array<string | [string, string]> = [
  'name',
  ['dob', 'gender'],
  ['pan_number', 'phone'],
  ['email', 'address'],
  ['tobacco_use', 'alcohol_consumption'],
  'pre_existing_conditions',
  'family_history',
  'profession',
  ['annual_income', 'coverage_amount'],
  ['policy_term', 'employment_type'],
  'nominee',
];

export const ExtractionForm: React.FC<ExtractionFormProps> = ({
  application,
  onSave,
  isSaving,
  onDelete,
  isDeleting,
  onSubmitApp,
  isSubmitting,
}) => {
  const { theme } = useThemeStore();
  const isLight = theme === 'light';

  // ── Form setup ─────────────────────────────────────────────────────────────
  const { register, handleSubmit, reset } = useForm({
    defaultValues: buildDefaultValues(application),
  });

  useEffect(() => {
    reset(buildDefaultValues(application));
  }, [application, reset]);

  function buildDefaultValues(app: typeof application) {
    return Object.keys(app.extracted_data).reduce<Record<string, any>>((acc, key) => {
      acc[key] = {
        value:          app.extracted_data[key].value,
        original_value: app.extracted_data[key].original_value,
        label:          app.extracted_data[key].label,
      };
      return acc;
    }, {});
  }

  const onSubmit = (formData: any) => {
    const updates = Object.keys(formData).reduce<Record<string, any>>((acc, key) => {
      acc[key] = {
        value:          formData[key].value,
        original_value: formData[key].original_value,
      };
      return acc;
    }, {});
    onSave(updates);
  };

  const blockingFlagCount = Object.values(application.extracted_data).reduce(
    (acc, field) => acc + (field.flags ? field.flags.filter(f => f.blocking).length : 0),
    0
  );

  // ── Severity styles ────────────────────────────────────────────────────────
  const getSeverityStyles = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return {
          badge:    isLight
            ? 'bg-red-50 text-red-700 border-red-300'
            : 'bg-red-500/10 text-red-400 border-red-500/20',
          text:     'text-red-500',
          border:   isLight
            ? 'border-red-300 focus:ring-red-400/30 focus:border-red-400'
            : 'border-red-500/30 focus:ring-red-500/30 focus:border-red-500/50',
          wrapBg:   isLight ? 'bg-red-50 border-red-200' : 'bg-red-500/5 border-red-500/15',
          msgBg:    isLight ? 'bg-red-50 border-red-200' : 'bg-slate-950/80 border-slate-900',
          msgText:  isLight ? 'text-red-700' : 'text-slate-300',
        };
      case 'medium':
        return {
          badge:    isLight
            ? 'bg-amber-50 text-amber-700 border-amber-300'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          text:     'text-amber-600',
          border:   isLight
            ? 'border-amber-300 focus:ring-amber-400/30 focus:border-amber-400'
            : 'border-amber-500/30 focus:ring-amber-500/30 focus:border-amber-500/50',
          wrapBg:   isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-500/5 border-amber-500/15',
          msgBg:    isLight ? 'bg-amber-50 border-amber-200' : 'bg-slate-950/80 border-slate-900',
          msgText:  isLight ? 'text-amber-800' : 'text-slate-300',
        };
      case 'low':
        return {
          badge:    isLight
            ? 'bg-blue-50 text-blue-600 border-blue-200'
            : 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          text:     'text-blue-500',
          border:   isLight
            ? 'border-blue-300 focus:ring-blue-400/30 focus:border-blue-400'
            : 'border-blue-500/30 focus:ring-blue-500/30 focus:border-blue-500/50',
          wrapBg:   isLight ? 'bg-blue-50/40 border-blue-200/70' : 'bg-blue-500/5 border-blue-500/15',
          msgBg:    isLight ? 'bg-blue-50 border-blue-200' : 'bg-slate-950/80 border-slate-900',
          msgText:  isLight ? 'text-blue-700' : 'text-slate-300',
        };
      default:
        return {
          badge:    isLight ? 'bg-slate-100 text-slate-600 border-slate-300' : 'bg-slate-800 text-slate-400 border-slate-700',
          text:     isLight ? 'text-slate-600' : 'text-slate-400',
          border:   isLight
            ? 'border-slate-300 focus:ring-brand-400/30 focus:border-brand-400'
            : 'border-slate-800 focus:ring-brand-500/50 focus:border-brand-500/50',
          wrapBg:   isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/20 border-slate-900',
          msgBg:    isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/80 border-slate-900',
          msgText:  isLight ? 'text-slate-700' : 'text-slate-300',
        };
    }
  };

  // ── Render single field ────────────────────────────────────────────────────
  const renderField = (key: string) => {
    const fieldData = application.extracted_data[key];
    if (!fieldData) return null;

    const config    = FIELD_CONFIG[key];
    const FieldIcon = config?.icon ?? User;
    const inputType = config?.type ?? 'text';
    const options   = config?.options;

    const hasFlags  = fieldData.flags && fieldData.flags.filter(f => f.blocking).length > 0;
    const activeFlag = hasFlags ? fieldData.flags.find(f => f.blocking) : null;
    const styles    = getSeverityStyles(activeFlag?.severity || '');

    const inputClass = `
      w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
      ${isLight
        ? 'bg-white text-slate-800 placeholder-slate-400'
        : 'bg-slate-950 text-slate-200 placeholder-slate-600'}
      border ${hasFlags ? styles.border : isLight
        ? 'border-slate-300 focus:border-brand-500/70 focus:ring-brand-400/20'
        : 'border-slate-800/80 focus:border-brand-500/50 focus:ring-brand-500/50'}
      focus:outline-none focus:ring-2
    `;

    return (
      <div
        key={key}
        className={`p-4 rounded-xl border transition-all duration-200 ${styles.wrapBg}`}
      >
        {/* Label row */}
        <div className="flex items-center justify-between mb-2">
          <label
            className={`text-[10px] font-bold uppercase tracking-widest ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            {fieldData.label}
          </label>

          {hasFlags && activeFlag ? (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase flex items-center gap-1 ${styles.badge}`}
            >
              <AlertTriangle className="h-3 w-3" />
              {activeFlag.severity}
            </span>
          ) : (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 uppercase tracking-wide ${
                isLight
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}
            >
              <ShieldCheck className="h-3 w-3" />
              Verified
            </span>
          )}
        </div>

        {/* Input */}
        <div className="relative">
          <FieldIcon
            className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${
              hasFlags
                ? styles.text
                : isLight ? 'text-slate-400' : 'text-slate-600'
            }`}
          />

          {inputType === 'select' && options ? (
            <select {...register(`${key}.value`)} className={inputClass}>
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={inputType === 'number' ? 'text' : inputType}
              inputMode={inputType === 'number' ? 'decimal' : undefined}
              {...register(`${key}.value`)}
              className={inputClass}
            />
          )}

          {/* Original value drift hint */}
          {String(fieldData.value).trim().toLowerCase() !==
            String(fieldData.original_value).trim().toLowerCase() && (
            <div
              className={`mt-1 text-[10px] flex items-center gap-1.5 px-1 ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              <span>Original extraction:</span>
              <span
                className={`font-semibold italic ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {fieldData.original_value || 'None'}
              </span>
            </div>
          )}
        </div>

        {/* Flag message */}
        {hasFlags && activeFlag && (
          <div
            className={`mt-2.5 flex items-start gap-2 text-xs rounded-lg p-2.5 border ${styles.msgBg}`}
          >
            <AlertTriangle className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${styles.text}`} />
            <span className={styles.msgText}>{activeFlag.message}</span>
          </div>
        )}
      </div>
    );
  };

  // ── Render a layout slot (single or pair) ─────────────────────────────────
  const renderSlot = (slot: string | [string, string]) => {
    if (Array.isArray(slot)) {
      return (
        <div key={slot.join('-')} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {slot.map((k) => renderField(k))}
        </div>
      );
    }
    return renderField(slot);
  };

  // ── Bottom action bar ──────────────────────────────────────────────────────
  const divider = isLight ? 'border-slate-200' : 'border-slate-800';
  const btnBase = `w-full sm:w-auto flex items-center justify-center gap-2 font-medium px-5 py-2.5 rounded-xl text-sm transition-all duration-200 active:scale-[.98] border disabled:opacity-50`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {FIELD_LAYOUT.map((slot) => renderSlot(slot))}

      {/* Actions */}
      <div className={`pt-6 border-t ${divider} flex flex-col sm:flex-row justify-between items-center gap-4`}>
        {/* Delete */}
        <button
          type="button"
          id="delete-application-btn"
          onClick={onDelete}
          disabled={isDeleting || isSaving}
          className={`${btnBase} ${
            isLight
              ? 'border-red-200 bg-red-50 hover:bg-red-100 text-red-600 hover:border-red-300'
              : 'border-red-500/30 hover:border-red-500 bg-red-500/5 hover:bg-red-500/10 text-red-400'
          }`}
        >
          <Trash2 className="h-4 w-4" />
          Delete Application
        </button>

        {/* Save & Submit */}
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            id="save-progress-btn"
            disabled={isSaving || isDeleting}
            className={`${btnBase} ${
              isLight
                ? 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'border-slate-700 bg-slate-800 hover:bg-slate-750 text-white'
            }`}
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 opacity-70" />
                Save Progress
              </>
            )}
          </button>

          <button
            type="button"
            id="submit-application-btn"
            onClick={onSubmitApp}
            disabled={blockingFlagCount > 0 || isSubmitting || isSaving || isDeleting}
            className={`${btnBase} ${
              blockingFlagCount > 0
                ? isLight
                  ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 border-slate-850 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 hover:border-emerald-500 shadow-lg shadow-emerald-600/15 hover:shadow-emerald-600/25'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Submit Application →
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
