import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, AlertCircle, Sparkles, Brain, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useUploadApplication } from '../../hooks/useApplications';
import { useNavigate } from 'react-router-dom';

// Processing stages shown during upload
const PROCESSING_STAGES = [
  { icon: FileText,    label: 'Reading PDF',          sub: 'Extracting raw text from your document...' },
  { icon: Brain,       label: 'AI Extracting Fields', sub: 'Groq LLM identifying application data...' },
  { icon: ShieldCheck, label: 'Running Validation',   sub: 'Checking fields against underwriting rules...' },
  { icon: CheckCircle2,label: 'Preparing Form',       sub: 'Auto-filling your application fields...' },
];

// Timing: cycle through stages every N ms
const STAGE_DURATION_MS = 2200;

export const DocumentUpload: React.FC = () => {
  const [dragActive, setDragActive]   = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [stageIndex, setStageIndex]   = useState(0);
  const stageTimer                    = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef                  = useRef<HTMLInputElement>(null);
  const uploadMutation                = useUploadApplication();
  const navigate                      = useNavigate();

  // Start / stop stage cycling while upload is in progress
  useEffect(() => {
    if (uploadMutation.isPending) {
      setStageIndex(0);
      stageTimer.current = setInterval(() => {
        setStageIndex(prev => Math.min(prev + 1, PROCESSING_STAGES.length - 1));
      }, STAGE_DURATION_MS);
    } else {
      if (stageTimer.current) {
        clearInterval(stageTimer.current);
        stageTimer.current = null;
      }
      setStageIndex(0);
    }
    return () => {
      if (stageTimer.current) clearInterval(stageTimer.current);
    };
  }, [uploadMutation.isPending]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF document. InsureVerify requires standard application layouts.');
      return;
    }
    setError(null);
    uploadMutation.mutate(file, {
      onSuccess: (data) => {
        navigate(`/applications/${data.id}`);
      },
      onError: (err: any) => {
        setError(err.response?.data?.detail || 'Failed to process the document. Please try again.');
      },
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const currentStage = PROCESSING_STAGES[stageIndex];
  const StageIcon    = currentStage.icon;

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative glass-panel p-8 border-dashed border-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[300px] ${
          dragActive
            ? 'border-brand-400 bg-brand-500/5 shadow-brand-500/10'
            : 'border-slate-800/80 hover:border-slate-700/60 hover:bg-slate-900/10'
        } ${uploadMutation.isPending ? 'pointer-events-none opacity-90' : ''}`}
        onClick={!uploadMutation.isPending ? onButtonClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf"
          onChange={handleChange}
          disabled={uploadMutation.isPending}
        />

        {uploadMutation.isPending ? (
          /* ── Processing State ── */
          <div className="flex flex-col items-center gap-5 py-4 w-full max-w-xs">

            {/* Spinner + icon */}
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-brand-500/10 border-t-brand-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <StageIcon className="h-6 w-6 text-brand-400 transition-all duration-500" />
              </div>
            </div>

            {/* Stage label */}
            <div className="space-y-1.5">
              <h4 className="text-base font-semibold text-slate-200 transition-all duration-500">
                {currentStage.label}
              </h4>
              <p className="text-xs text-slate-400 max-w-[280px] transition-all duration-500">
                {currentStage.sub}
              </p>
            </div>

            {/* Stage progress dots */}
            <div className="flex items-center gap-2">
              {PROCESSING_STAGES.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === stageIndex
                      ? 'w-5 bg-brand-500'
                      : i < stageIndex
                        ? 'w-1.5 bg-brand-500/40'
                        : 'w-1.5 bg-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Step list */}
            <div className="w-full space-y-1.5">
              {PROCESSING_STAGES.map((stage, i) => {
                const S = stage.icon;
                const isDone    = i < stageIndex;
                const isActive  = i === stageIndex;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-300 ${
                      isActive
                        ? 'bg-brand-500/10 border border-brand-500/20'
                        : isDone
                          ? 'opacity-60'
                          : 'opacity-30'
                    }`}
                  >
                    <S className={`h-3.5 w-3.5 shrink-0 ${
                      isActive ? 'text-brand-400' : isDone ? 'text-emerald-400' : 'text-slate-600'
                    }`} />
                    <span className={`text-[11px] font-medium ${
                      isActive ? 'text-slate-200' : isDone ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {stage.label}
                    </span>
                    {isDone && (
                      <CheckCircle2 className="h-3 w-3 text-emerald-400 ml-auto shrink-0" />
                    )}
                    {isActive && (
                      <Sparkles className="h-3 w-3 text-brand-400 ml-auto shrink-0 animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── Idle / Drop State ── */
          <div className="flex flex-col items-center gap-4 py-4">
            <div className={`p-4 rounded-2xl border shadow-md transition-all duration-300 ${
              dragActive
                ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <Upload className={`h-8 w-8 transition-colors ${dragActive ? 'text-brand-400' : 'text-brand-400'}`} />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-lg font-semibold text-slate-100">
                Upload your life insurance application
              </h4>
              <p className="text-sm text-slate-400 max-w-[340px] mx-auto">
                Drag and drop your application PDF, or{' '}
                <span className="text-brand-400 hover:text-brand-300 font-medium">browse local files</span>
              </p>
            </div>

            {/* AI feature callouts */}
            <div className="flex flex-col items-center gap-2 mt-1">
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {[
                  { icon: Brain,       text: 'AI field extraction' },
                  { icon: ShieldCheck, text: 'Underwriting validation' },
                  { icon: Sparkles,    text: 'Auto-fill form' },
                ].map(({ icon: Icon, text }) => (
                  <span
                    key={text}
                    className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-950/60 border border-slate-900 px-2.5 py-1 rounded-full"
                  >
                    <Icon className="h-3 w-3 text-brand-500/70" />
                    {text}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-950/60 border border-slate-900 px-3 py-1 rounded-full">
                <FileText className="h-3 w-3" />
                <span>Only PDF formats supported</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}
    </div>
  );
};
