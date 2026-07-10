import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ExtractedField, Application } from '../../types';
import { AlertTriangle, ShieldCheck, Check } from 'lucide-react';

interface ExtractionFormProps {
  application: Application;
  onSave: (data: Record<string, any>) => void;
  isSaving: boolean;
}

export const ExtractionForm: React.FC<ExtractionFormProps> = ({
  application,
  onSave,
  isSaving,
}) => {
  // Setup react-hook-form
  const { register, handleSubmit, reset } = useForm({
    defaultValues: Object.keys(application.extracted_data).reduce<Record<string, any>>((acc, key) => {
      acc[key] = {
        value: application.extracted_data[key].value,
        original_value: application.extracted_data[key].original_value,
        label: application.extracted_data[key].label
      };
      return acc;
    }, {}),
  });

  // Keep form in sync if application changes
  useEffect(() => {
    reset(Object.keys(application.extracted_data).reduce<Record<string, any>>((acc, key) => {
      acc[key] = {
        value: application.extracted_data[key].value,
        original_value: application.extracted_data[key].original_value,
        label: application.extracted_data[key].label
      };
      return acc;
    }, {}));
  }, [application, reset]);

  const onSubmit = (formData: any) => {
    // Map the form data back to the structure the backend expects for validate
    const updates = Object.keys(formData).reduce<Record<string, any>>((acc, key) => {
      acc[key] = {
        value: formData[key].value,
        original_value: formData[key].original_value
      };
      return acc;
    }, {});
    onSave(updates);
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return {
          badge: 'bg-red-500/10 text-red-400 border-red-500/20',
          text: 'text-red-400',
          border: 'border-red-500/30 focus:ring-red-500/30 focus:border-red-500/50',
          bg: 'bg-red-500/5',
        };
      case 'medium':
        return {
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          text: 'text-amber-400',
          border: 'border-amber-500/30 focus:ring-amber-500/30 focus:border-amber-500/50',
          bg: 'bg-amber-500/5',
        };
      case 'low':
        return {
          badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          text: 'text-blue-400',
          border: 'border-blue-500/30 focus:ring-blue-500/30 focus:border-blue-500/50',
          bg: 'bg-blue-500/5',
        };
      default:
        return {
          badge: 'bg-slate-800 text-slate-400 border-slate-700',
          text: 'text-slate-400',
          border: 'border-slate-800 focus:ring-brand-500/50 focus:border-brand-500/50',
          bg: 'bg-slate-950/50',
        };
    }
  };

  // Render input wrapper helper
  const renderField = (key: string, type: 'text' | 'select' | 'date' | 'number', options?: string[]) => {
    const fieldData = application.extracted_data[key];
    if (!fieldData) return null;

    const hasFlags = fieldData.flags && fieldData.flags.length > 0;
    const activeFlag = hasFlags ? fieldData.flags[0] : null;
    const styles = getSeverityStyles(activeFlag?.severity || '');

    return (
      <div key={key} className={`p-4 rounded-xl border transition-all duration-200 ${
        hasFlags ? `bg-slate-950/70 border-slate-800/80` : 'bg-slate-900/20 border-slate-900 hover:border-slate-800/60'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {fieldData.label}
          </label>
          
          {hasFlags && activeFlag && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase ${styles.badge} flex items-center gap-1`}>
              <AlertTriangle className="h-3 w-3" />
              <span>{activeFlag.severity} Severity Flag</span>
            </span>
          )}
          
          {!hasFlags && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 uppercase tracking-wide">
              <ShieldCheck className="h-3 w-3" />
              <span>Verified</span>
            </span>
          )}
        </div>

        {/* Input/Select Render */}
        <div className="relative">
          {type === 'select' ? (
            <select
              {...register(`${key}.value`)}
              className={`w-full px-4 py-2.5 bg-slate-950 border rounded-xl text-sm font-medium text-slate-200 transition-all ${
                hasFlags ? styles.border : 'border-slate-800/80 focus:border-brand-500/50 focus:ring-brand-500/50'
              }`}
            >
              {options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              {...register(`${key}.value`)}
              className={`w-full px-4 py-2.5 bg-slate-950 border rounded-xl text-sm font-medium text-slate-200 transition-all ${
                hasFlags ? styles.border : 'border-slate-800/80 focus:border-brand-500/50 focus:ring-brand-500/50'
              }`}
            />
          )}
          
          {/* original value mismatch checker */}
          {String(fieldData.value).trim().toLowerCase() !== String(fieldData.original_value).trim().toLowerCase() && (
            <div className="mt-1 text-[10px] text-slate-500 flex items-center gap-1.5 px-1">
              <span>Original Extraction:</span>
              <span className="font-semibold italic text-slate-400">{fieldData.original_value || 'None'}</span>
            </div>
          )}
        </div>

        {/* Display flag message */}
        {hasFlags && activeFlag && (
          <div className="mt-2.5 flex items-start gap-2 text-xs bg-slate-950/80 border border-slate-900 rounded-lg p-2.5 text-slate-300">
            <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${styles.text}`} />
            <span>{activeFlag.message}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {renderField('full_name', 'text')}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField('dob', 'date')}
          {renderField('gender', 'select', ['Male', 'Female', 'Other'])}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField('tobacco_use', 'select', ['Yes', 'No'])}
          {renderField('alcohol_consumption', 'select', ['None', 'Moderate', 'Heavy', 'Social'])}
        </div>

        {renderField('pre_existing_conditions', 'text')}
        {renderField('occupation', 'text')}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField('coverage_amount', 'text')}
          {renderField('beneficiary', 'text')}
        </div>

        {renderField('family_history', 'text')}
      </div>

      <div className="pt-4 border-t border-slate-800 flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-medium px-6 py-3 rounded-xl shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 active:scale-98 transition-all disabled:opacity-50 text-sm"
        >
          {isSaving ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
              <span>Revalidating fields...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              <span>Save & Revalidate</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
