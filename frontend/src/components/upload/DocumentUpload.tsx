import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, Sparkles } from 'lucide-react';
import { useUploadApplication } from '../../hooks/useApplications';
import { useNavigate } from 'react-router-dom';

export const DocumentUpload: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadApplication();
  const navigate = useNavigate();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF document. InsureVerify requires standard application layouts.");
      return;
    }
    setError(null);
    uploadMutation.mutate(file, {
      onSuccess: (data) => {
        // Redirect to the application review screen
        navigate(`/applications/${data.id}`);
      },
      onError: (err: any) => {
        setError(err.response?.data?.detail || "Failed to process the document. Please try again.");
      }
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

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative glass-panel p-8 border-dashed border-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[300px] ${
          dragActive 
            ? "border-brand-400 bg-brand-500/5 shadow-brand-500/10" 
            : "border-slate-800/80 hover:border-slate-700/60 hover:bg-slate-900/10"
        } ${uploadMutation.isPending ? "pointer-events-none opacity-80" : ""}`}
        onClick={onButtonClick}
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
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-brand-500/10 border-t-brand-500 animate-spin"></div>
              <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-brand-400 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-slate-200">AI Intake Agent Reading File</h4>
              <p className="text-xs text-slate-400 max-w-[280px]">
                Extracting application data, validating rules, and generating risk parameters...
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 shadow-md">
              <Upload className="h-8 w-8 text-brand-400" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-lg font-semibold text-slate-100">
                Upload your life insurance application
              </h4>
              <p className="text-sm text-slate-400 max-w-[340px] mx-auto">
                Drag and drop your application PDF, or <span className="text-brand-400 hover:text-brand-300 font-medium">browse local files</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-950/60 border border-slate-900 px-3 py-1 rounded-full">
              <FileText className="h-3 w-3" />
              <span>Only PDF formats supported</span>
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
