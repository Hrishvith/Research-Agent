import { Search, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const HISTORY_KEY = 'research_recent_insights';
const MAX_SUGGESTIONS = 6;

const TOPIC_PHRASES = [
  'machine learning in healthcare',
  'machine learning for climate prediction',
  'large language models in scientific discovery',
  'retrieval augmented generation for research assistants',
  'federated learning for medical records',
  'transformers for clinical natural language processing',
  'ai for drug discovery and molecular design',
  'smart contract security in blockchain systems',
  'carbon aware scheduling for ai workloads',
  'satellite image analysis for deforestation monitoring',
  'explainable ai in high risk domains',
  'multi agent systems for literature review automation',
];

function normalize(input: string) {
  return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getRecentQueries(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{ query?: string }>;
    return parsed
      .map((item) => String(item?.query || '').trim())
      .filter(Boolean)
      .slice(0, 12);
  } catch {
    return [];
  }
}

function buildPredictedSuggestions(input: string, recentQueries: string[]) {
  const cleaned = normalize(input);
  const corpus = [...recentQueries, ...TOPIC_PHRASES];

  if (!cleaned) {
    return corpus.slice(0, MAX_SUGGESTIONS);
  }

  const scored = corpus
    .map((candidate, index) => {
      const c = normalize(candidate);
      if (!c) return null;

      let score = 0;
      if (c === cleaned) score += 100;
      if (c.startsWith(cleaned)) score += 60;
      if (c.includes(cleaned)) score += 25;

      // Reward next-word style continuation: input is a prefix ending at word boundary.
      if ((`${c} `).startsWith(`${cleaned} `)) score += 20;

      // Prefer shorter completions and recent history first.
      score += Math.max(0, 20 - Math.abs(c.length - cleaned.length));
      score += Math.max(0, 12 - index);

      return { candidate, score };
    })
    .filter((item): item is { candidate: string; score: number } => Boolean(item))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const unique = Array.from(new Set(scored.map((item) => item.candidate)));
  return unique.slice(0, MAX_SUGGESTIONS);
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const inputWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setRecentQueries(getRecentQueries());
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!inputWrapRef.current) return;
      if (!inputWrapRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, []);

  const suggestions = useMemo(
    () => buildPredictedSuggestions(query, recentQueries),
    [query, recentQueries]
  );

  const applySuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="glass-panel neon-border rounded-2xl p-6 md:p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary font-heading">AI-Powered Research Agent</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold font-heading text-foreground mb-3 tracking-tight">
          ResearchHub
        </h1>
        <p className="text-muted-foreground text-base max-w-lg mx-auto">
          Enter a research topic and our agent will autonomously crawl academic databases, extract findings, detect contradictions, and synthesize insights.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div ref={inputWrapRef} className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(event) => {
              if (!showSuggestions || suggestions.length === 0) return;

              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
                return;
              }

              if (event.key === 'ArrowUp') {
                event.preventDefault();
                setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
                return;
              }

              if (event.key === 'Tab' && highlightedIndex >= 0) {
                event.preventDefault();
                applySuggestion(suggestions[highlightedIndex]);
                return;
              }

              if (event.key === 'Enter' && highlightedIndex >= 0) {
                event.preventDefault();
                applySuggestion(suggestions[highlightedIndex]);
                return;
              }

              if (event.key === 'Escape') {
                setShowSuggestions(false);
              }
            }}
            placeholder="e.g. Large Language Models in Scientific Discovery"
            className="pl-11 h-12 text-sm bg-secondary/70 border-border shadow-card focus-visible:shadow-elevated transition-shadow"
            disabled={isLoading}
          />

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-20 mt-2 w-full rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-elevated overflow-hidden">
              <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
                Predictive suggestions
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {suggestions.map((suggestion, index) => {
                  const isActive = index === highlightedIndex;
                  return (
                    <button
                      key={`${suggestion}-${index}`}
                      type="button"
                      onClick={() => applySuggestion(suggestion)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-primary/15 text-foreground'
                          : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                      }`}
                    >
                      {suggestion}
                    </button>
                  );
                })}
              </div>
              <div className="px-3 py-2 text-[11px] text-muted-foreground border-t border-border">
                Use ↑/↓ to navigate and Tab to autocomplete
              </div>
            </div>
          )}
        </div>
        <Button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="h-12 px-6 gradient-primary text-primary-foreground font-heading font-semibold hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Researching...
            </span>
          ) : 'Start Research'}
        </Button>
      </form>
      </div>
    </div>
  );
}
