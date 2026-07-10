import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorPageProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ message = 'Failed to load resources.', onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center px-4">
      <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 max-w-max">
        <AlertCircle className="h-8 w-8 text-red-400" />
      </div>
      <div className="max-w-md">
        <h3 className="text-lg font-semibold text-slate-200">System Error</h3>
        <p className="text-sm text-slate-400 mt-1">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 mt-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 px-4 py-2 rounded-xl text-sm font-medium text-slate-200 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
};
