import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { SynthesisPanel } from '@/components/SynthesisPanel';
import { CosmicBackdrop } from '@/components/CosmicBackdrop';
import { Button } from '@/components/ui/button';
import { researchApi, type ResearchResult } from '@/lib/api/research';
import { buildAnalysisFromPapers } from '@/lib/mock-data';

export default function SynthesisShare() {
  const { jobId } = useParams();
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!jobId) {
        setError('Missing synthesis ID.');
        setLoading(false);
        return;
      }

      try {
        const data = await researchApi.getStatus(jobId);
        if (!active) return;

        if (data.papers?.length > 0) {
          const analysis = buildAnalysisFromPapers(data.query, data.papers);
          setResult({ ...data, ...analysis });
        } else {
          setResult(data);
        }
      } catch {
        if (active) setError('This synthesis could not be loaded. It may have expired.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [jobId]);

  return (
    <div className="min-h-screen app-shell relative overflow-hidden">
      <CosmicBackdrop />

      <div className="fixed top-0 left-0 right-0 z-50 bg-card/60 backdrop-blur-xl border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold font-heading text-foreground tracking-wide">ResearchHub Share</span>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <Link to="/">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to app
          </Link>
        </Button>
      </div>

      <div className="pt-14 min-h-screen">
        {loading && (
          <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center text-slate-200">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading synthesis...
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6">
            <div className="max-w-lg rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-200 backdrop-blur-xl">
              <p className="text-lg font-semibold text-white">{error}</p>
              <p className="mt-2 text-sm text-slate-300">Open the app and generate a new synthesis to create another share link.</p>
            </div>
          </div>
        )}

        {!loading && result && result.status === 'completed' && (
          <div className="h-[calc(100vh-3.5rem)]">
            <SynthesisPanel result={result} onGenerateSynthesis={() => undefined} />
          </div>
        )}

        {!loading && result && result.status !== 'completed' && !error && (
          <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6">
            <div className="max-w-lg rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-200 backdrop-blur-xl">
              <p className="text-lg font-semibold text-white">Synthesis not ready yet</p>
              <p className="mt-2 text-sm text-slate-300">This shared synthesis is still processing or has not been generated.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}