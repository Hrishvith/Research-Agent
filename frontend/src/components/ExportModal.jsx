import { useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Link2, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function downloadTextFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

export function ExportModal({ open, onOpenChange, result, pdfUrl, isGenerating }) {

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    toast.success('PDF download started');
  };

  const handleCopy = async () => {
    if (!pdfUrl) return;

    try {
      await navigator.clipboard.writeText(pdfUrl);
      toast.success('PDF link copied to clipboard');
    } catch {
      toast.error('Unable to copy PDF link');
    }
  };

  const handleDownloadJson = () => {
    const payload = {
      job_id: result.job_id,
      query: result.query,
      overview: result.overview,
      synthesis: result.synthesis,
      papers: result.papers,
      key_findings: result.key_findings,
      contradictions: result.contradictions,
      research_gaps: result.research_gaps,
      pdf_url: pdfUrl,
    };

    downloadTextFile(
      JSON.stringify(payload, null, 2),
      `research-synthesis-${result.job_id || Date.now()}.json`,
      'application/json',
    );
    toast.success('JSON download started');
  };

  const qrValue = useMemo(() => pdfUrl || '', [pdfUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-white/10 bg-slate-950/95 text-slate-100 shadow-[0_30px_90px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:rounded-3xl">
        <DialogHeader className="space-y-2 text-center">
          <DialogTitle className="text-2xl font-extrabold tracking-tight text-white">Export &amp; Share</DialogTitle>
          <p className="text-sm text-slate-300">Scan to download PDF</p>
        </DialogHeader>

        <div className="mt-2 flex flex-col items-center gap-5">
          <div className="rounded-3xl border border-white/10 bg-white p-5 shadow-[0_20px_60px_rgba(14,165,233,0.18)]">
            {qrValue ? (
              <QRCodeCanvas value={qrValue} size={180} includeMargin fgColor="#0f172a" bgColor="#ffffff" />
            ) : (
              <div className="flex h-[180px] w-[180px] items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </div>

          <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-center text-xs text-slate-300 break-all">
            {pdfUrl || 'Preparing PDF link...'}
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2">
            <Button
              type="button"
              onClick={handleDownloadPdf}
              disabled={!pdfUrl}
              className="h-11 gap-2 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5"
            >
              <Download className="h-4 w-4" />
              {isGenerating ? 'Preparing PDF...' : 'Download PDF'}
            </Button>

            <Button
              type="button"
              onClick={handleCopy}
              variant="outline"
              disabled={!pdfUrl}
              className="h-11 gap-2 border-white/10 bg-white/5 font-semibold text-slate-100 transition hover:bg-white/10"
            >
              <Link2 className="h-4 w-4" />
              Copy PDF Link
            </Button>
          </div>

          <div className="w-full sm:flex sm:justify-end">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              variant="ghost"
              className="h-10 w-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 sm:w-auto"
            >
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </div>

          <button
            type="button"
            onClick={handleDownloadJson}
            className="text-xs text-sky-300 underline-offset-4 transition hover:text-sky-200 hover:underline"
          >
            Also download JSON
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ExportModal;