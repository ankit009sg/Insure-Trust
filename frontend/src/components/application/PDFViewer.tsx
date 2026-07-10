import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Loader2, FileText, AlertCircle } from 'lucide-react';

interface PDFViewerProps {
  applicationId: number;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ applicationId }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let url: string | null = null;

    const fetchPdf = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.get(`/api/v1/applications/${applicationId}/pdf`, {
          responseType: 'blob',
        });

        if (!active) return;

        const blob = new Blob([response.data], { type: 'application/pdf' });
        url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err: any) {
        if (!active) return;
        console.error('Error fetching application PDF:', err);
        setError(
          err.response?.status === 404
            ? 'PDF file not found on the server.'
            : 'Failed to load PDF file. Please ensure you are authorized.'
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchPdf();

    return () => {
      active = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [applicationId]);

  return (
    <div className="glass-panel p-4 border-slate-800/80 flex flex-col h-[580px]">
      <div className="flex items-center gap-2 mb-3 border-b border-slate-850 pb-2">
        <FileText className="h-4 w-4 text-brand-400" />
        <h3 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
          Application Document Preview
        </h3>
      </div>

      <div className="flex-grow bg-slate-950/60 rounded-xl overflow-hidden relative border border-slate-900 flex items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
            <span className="text-xs text-slate-400">Streaming PDF securely...</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-3 text-center p-6 max-w-sm">
            <div className="p-3 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertCircle className="h-6 w-6" />
            </div>
            <p className="text-xs font-medium text-slate-300">{error}</p>
          </div>
        )}

        {!loading && !error && pdfUrl && (
          <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0`}
            title="Application PDF Preview"
            className="w-full h-full border-none rounded-xl bg-slate-900"
          />
        )}
      </div>
    </div>
  );
};
