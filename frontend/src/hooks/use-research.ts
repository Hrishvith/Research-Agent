import { useState, useEffect, useCallback, useRef } from 'react';
import { researchApi, type ResearchResult } from '@/lib/api/research';
import { buildAnalysisFromPapers } from '@/lib/mock-data';
const HISTORY_KEY = 'research_recent_insights';
const HISTORY_LIMIT = 12;

export interface ResearchHistoryItem {
  id: string;
  query: string;
  viewedAt: string;
  result: ResearchResult;
}

export function useResearch() {
  const [query, setQuery] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ResearchHistoryItem[]>(() => {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored) as ResearchHistoryItem[];
    } catch {
      return [];
    }
  });
  const lastSavedSignature = useRef<string | null>(null);

  const persistHistory = useCallback((items: ResearchHistoryItem[]) => {
    setHistory(items);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  }, []);

  const startResearch = useCallback(async (q: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setQuery(q);

    // Try real backend first
    try {
      const { job_id } = await researchApi.startResearch(q);
      setJobId(job_id);
      setIsPolling(true);
      return;
    } catch {
      setIsLoading(false);
      setIsPolling(false);
      setError('Backend is unreachable. Papers must come from arXiv, PubMed, Semantic Scholar, or Google Scholar.');
      return;
    }
  }, []);

  useEffect(() => {
    if (!isPolling || !jobId) return;

    const interval = setInterval(async () => {
      try {
        const data = await researchApi.getStatus(jobId);
        if (data.status === 'completed' && data.papers?.length > 0) {
          // Enrich live backend papers with all flowchart analysis fields
          const analysis = buildAnalysisFromPapers(data.query, data.papers);
          setResult({ ...data, ...analysis });
        } else {
          setResult(data);
        }
        if (data.status === 'completed' || data.status === 'failed') {
          setIsPolling(false);
          setIsLoading(false);
          if (data.status === 'failed') {
            setError('Research pipeline failed');
          }
        }
      } catch {
        // Keep polling on transient errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isPolling, jobId]);

  const generateSynthesis = useCallback(async () => {
    if (!jobId) return;
    try {
      const { synthesis } = await researchApi.generateSynthesis(jobId);
      setResult(prev => prev ? { ...prev, synthesis } : prev);
    } catch {
      setError('Failed to generate synthesis');
    }
  }, [jobId]);

  const beginNewSearch = useCallback(() => {
    setResult(null);
    setQuery('');
    setError(null);
    setIsLoading(false);
    setIsPolling(false);
    setJobId(null);
  }, []);

  const openHistoryItem = useCallback((itemId: string) => {
    const item = history.find((entry) => entry.id === itemId);
    if (!item) return;
    setResult(item.result);
    setQuery(item.query);
    setError(null);
    setIsLoading(false);
    setIsPolling(false);
  }, [history]);

  useEffect(() => {
    if (!result || result.status !== 'completed' || !result.papers?.length) return;

    const signature = `${result.job_id}|${result.query}|${result.papers.length}`;
    if (signature === lastSavedSignature.current) return;
    lastSavedSignature.current = signature;

    const entry: ResearchHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      query: result.query,
      viewedAt: new Date().toISOString(),
      result,
    };

    const updated = [entry, ...history]
      .filter((item, index, arr) => arr.findIndex((x) => x.query === item.query) === index)
      .slice(0, HISTORY_LIMIT);

    persistHistory(updated);
  }, [result, history, persistHistory]);

  return {
    query,
    result,
    isLoading,
    error,
    history,
    startResearch,
    generateSynthesis,
    beginNewSearch,
    openHistoryItem,
  };
}
