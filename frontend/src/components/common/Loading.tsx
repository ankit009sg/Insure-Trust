import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loading: React.FC<{ message?: string }> = ({ message = 'Loading system parameters...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="relative flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin"></div>
        <Loader2 className="absolute h-5 w-5 text-brand-400 animate-pulse" />
      </div>
      <p className="text-slate-400 text-sm font-medium animate-pulse">{message}</p>
    </div>
  );
};
