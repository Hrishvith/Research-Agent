import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FileDown, Sparkles, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ResearchResult } from '@/lib/api/research';
import { QueryConversation } from '@/components/QueryConversation';
import { KnowledgeGraph } from '@/components/KnowledgeGraph';
import { ExportModal } from '@/components/ExportModal';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

type ExportAnalysis = ResearchResult & {
  selected_paper?: {
    title: string;
    abstract: string;
    summary: string;
  };
};

function buildPdfBlob(result: ExportAnalysis) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 40;
  const maxWidth = pageWidth - margin * 2;

  const lines = [
    'AI Research Summary',
    `Query: ${result.query || 'Research summary'}`,
    `Papers analyzed: ${result.papers?.length || 0}`,
    '',
    result.selected_paper ? `Selected Paper: ${result.selected_paper.title}` : '',
    result.selected_paper ? `Abstract:\n${result.selected_paper.abstract}` : '',
    result.selected_paper ? `Summary:\n${result.selected_paper.summary}` : '',
    !result.selected_paper && result.overview ? `Overview:\n${result.overview}` : '',
    !result.selected_paper && result.synthesis ? `Final Synthesis:\n${result.synthesis}` : '',
    !result.selected_paper && result.key_findings?.length
      ? `Key Findings:\n${result.key_findings.map((item, index) => `${index + 1}. ${item.paper_title}: ${item.findings}`).join('\n')}`
      : '',
    !result.selected_paper && result.contradictions?.length
      ? `Contradictions:\n${result.contradictions.map((item, index) => `${index + 1}. ${item.description}`).join('\n')}`
      : '',
    !result.selected_paper && result.research_gaps?.length
      ? `Research Gaps:\n${result.research_gaps.map((item, index) => `${index + 1}. ${item.description}`).join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const wrapped = pdf.splitTextToSize(lines, maxWidth);
  let y = margin;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text('AI Research Summary', margin, y);
  y += 24;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);

  wrapped.forEach((line) => {
    if (y > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += 16;
  });

  return pdf.output('blob');
}

interface SynthesisPanelProps {
  result: ResearchResult;
  currentAnalysis: ResearchResult | null;
  selectedPaperId: number | null;
  onGenerateSynthesis: () => void;
}

type FlowStepId =
  | 'priority-order'
  | 'structured-literature'
  | 'overview'
  | 'key-findings'
  | 'contradictions'
  | 'research-gaps'
  | 'cross-paper-validation'
  | 'citation-trail-analysis'
  | 'weighted-priority';

function buildExportAnalysis(result: ResearchResult, selectedPaperId: number | null) {
  const selectedPaper =
    selectedPaperId !== null && result.papers?.[selectedPaperId]
      ? result.papers[selectedPaperId]
      : null;

  if (!selectedPaper) {
    return result;
  }

  const paperTitle = selectedPaper.title;
  const paperAbstract = selectedPaper.abstract;
  const paperSummary = selectedPaper.key_findings || result.synthesis || result.overview || '';

  const paperOnlyResult: ResearchResult = {
    ...result,
    papers: [selectedPaper],
    query: `${result.query} - ${paperTitle}`,
    overview: `Selected paper analysis for ${paperTitle}.`,
    synthesis: paperSummary,
    key_findings: [{ paper_title: paperTitle, findings: paperSummary }],
    contradictions: [],
    research_gaps: [],
    cross_paper_validation: [],
    citation_trails: [],
    research_priorities: [],
  };

  return {
    ...paperOnlyResult,
    // keep current paper details for export consumption
    selected_paper: {
      title: paperTitle,
      abstract: paperAbstract,
      summary: paperSummary,
    },
  } as ResearchResult & { selected_paper?: { title: string; abstract: string; summary: string } };
}

export function SynthesisPanel({ result, currentAnalysis, selectedPaperId, onGenerateSynthesis }: SynthesisPanelProps) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportPdfUrl, setExportPdfUrl] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const activeAnalysis = currentAnalysis || result;
  const flowSteps = useMemo(
    () => [
      {
        id: 'priority-order' as const,
        title: 'Priority Order',
        subtitle: 'By Weightage',
        available: (result.research_priorities?.length || 0) > 0,
      },
      {
        id: 'structured-literature' as const,
        title: 'Structured Literature Summary',
        subtitle: 'Paper-wise breakdown',
        available: (result.papers?.length || 0) > 0,
      },
      {
        id: 'overview' as const,
        title: 'Overview',
        subtitle: 'Topic-level context',
        available: true,
      },
      {
        id: 'key-findings' as const,
        title: 'Key Findings',
        subtitle: 'High-signal insights',
        available: (result.key_findings?.length || 0) > 0,
      },
      {
        id: 'contradictions' as const,
        title: 'Contradictions',
        subtitle: 'Conflicting evidence',
        available: (result.contradictions?.length || 0) > 0,
      },
      {
        id: 'research-gaps' as const,
        title: 'Research Gaps',
        subtitle: 'Unsolved opportunities',
        available: (result.research_gaps?.length || 0) > 0,
      },
      {
        id: 'cross-paper-validation' as const,
        title: 'Cross-Paper Validation',
        subtitle: 'Claim consistency check',
        available: (result.cross_paper_validation?.length || 0) > 0,
      },
      {
        id: 'citation-trail-analysis' as const,
        title: 'Citation Trail Analysis',
        subtitle: 'Influence pathways',
        available: (result.citation_trails?.length || 0) > 0,
      },
      {
        id: 'weighted-priority' as const,
        title: 'Weighted Re-Priority',
        subtitle: 'Final ranked action plan',
        available: (result.research_priorities?.length || 0) > 0,
      },
    ],
    [result],
  );

  const [selectedStep, setSelectedStep] = useState<FlowStepId>('overview');

  useEffect(() => {
    const firstAvailable = flowSteps.find((step) => step.available);
    if (firstAvailable) {
      setSelectedStep(firstAvailable.id);
    }
  }, [flowSteps]);

  const handleStepClick = (stepId: FlowStepId) => {
    setSelectedStep(stepId);
  };

  const selectedStepData = flowSteps.find((step) => step.id === selectedStep);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      if (!activeAnalysis) {
        throw new Error('No active analysis to export');
      }

      const exportAnalysis = buildExportAnalysis(activeAnalysis, selectedPaperId);
      const pdfBlob = buildPdfBlob(exportAnalysis);
      const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const response = await axios.post(`${backendUrl}/api/export-synthesis`, pdfBlob, {
        headers: { 'Content-Type': 'application/pdf' },
        params: {
          job_id: exportAnalysis.job_id || 'latest',
          query: exportAnalysis.query || '',
        },
      });

      setExportPdfUrl(response.data.pdf_url);
      setIsExportOpen(true);
    } catch {
      toast.error('Failed to prepare export');
      setIsExportOpen(false);
    } finally {
      setIsExporting(false);
    }
  };

  const focusedContent = useMemo(() => {
    if (!selectedStepData?.available) {
      return {
        summary: 'This section has no data for the current query.',
        points: [] as string[],
      };
    }

    switch (selectedStep) {
      case 'priority-order':
      case 'weighted-priority': {
        const priorities = result.research_priorities || [];
        const top = priorities[0];
        return {
          summary: top
            ? `Top priority: ${top.title} (${top.weightage}%). ${top.rationale}`
            : 'Priority weighting is unavailable for this run.',
          points: priorities.slice(0, 6).map(
            (priority) =>
              `${priority.rank}. ${priority.title} — ${priority.weightage}% weightage${
                priority.related_papers.length ? ` | Related: ${priority.related_papers.slice(0, 2).join('; ')}` : ''
              }`,
          ),
        };
      }
      case 'structured-literature': {
        const papers = result.papers || [];
        const firstPaper = papers[0];
        return {
          summary: firstPaper
            ? `Leading paper: ${firstPaper.title}. ${firstPaper.abstract}`
            : 'No paper details available.',
          points: papers.slice(0, 5).map(
            (paper) =>
              `${paper.title} (${paper.source}, ${paper.year})${
                paper.key_findings ? ` | Result: ${paper.key_findings}` : ''
              }`,
          ),
        };
      }
      case 'overview': {
        return {
          summary:
            result.overview ||
            `Analysis of ${result.papers.length} papers on "${result.query}" with ${result.contradictions?.length || 0} contradictions and ${result.research_gaps?.length || 0} research gaps.`,
          points: [
            `Papers analyzed: ${result.papers.length}`,
            `Key findings extracted: ${result.key_findings?.length || 0}`,
            `Contradictions detected: ${result.contradictions?.length || 0}`,
            `Research gaps identified: ${result.research_gaps?.length || 0}`,
            `Cross-paper validations: ${result.cross_paper_validation?.length || 0}`,
            `Citation trails followed: ${result.citation_trails?.length || 0}`,
          ],
        };
      }
      case 'key-findings': {
        const findings = result.key_findings || [];
        const firstFinding = findings[0];
        return {
          summary: firstFinding
            ? `${firstFinding.paper_title}: ${firstFinding.findings}`
            : 'No key findings available.',
          points: findings
            .slice(0, 6)
            .map((finding) => `${finding.paper_title} — ${finding.findings}`),
        };
      }
      case 'contradictions': {
        const contradictions = result.contradictions || [];
        const first = contradictions[0];
        return {
          summary: first ? first.description : 'No contradictions identified.',
          points: contradictions.slice(0, 6).map((entry) => entry.description),
        };
      }
      case 'research-gaps': {
        const gaps = result.research_gaps || [];
        const first = gaps[0];
        return {
          summary: first ? first.description : 'No research gaps identified.',
          points: gaps.slice(0, 6).map((entry) => entry.description),
        };
      }
      case 'cross-paper-validation': {
        const validations = result.cross_paper_validation || [];
        const first = validations[0];
        return {
          summary: first
            ? `${first.claim} (support: ${first.support_level}, confidence: ${Math.round(first.confidence * 100)}%).`
            : 'No cross-paper validation data available.',
          points: validations.slice(0, 6).map(
            (entry) =>
              `${entry.claim} | ${entry.support_level} support | ${Math.round(entry.confidence * 100)}% confidence | +${entry.supporting_papers.length} support / -${entry.conflicting_papers.length} conflict`,
          ),
        };
      }
      case 'citation-trail-analysis': {
        const trails = result.citation_trails || [];
        const first = trails[0];
        return {
          summary: first
            ? `${first.paper_title}: ${first.influence_note}`
            : 'No citation trail information available.',
          points: trails.slice(0, 6).map(
            (trail) =>
              `${trail.paper_title} | refs: ${trail.citation_count} | cited-by: ${trail.cited_by_estimate}${
                trail.referenced_papers.length ? ` | connected: ${trail.referenced_papers.slice(0, 2).join('; ')}` : ''
              }`,
          ),
        };
      }
      default:
        return { summary: '', points: [] as string[] };
    }
  }, [result, selectedStep, selectedStepData?.available]);

  return (
    <div className="h-full flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-card/60 backdrop-blur-xl border-b border-border p-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold font-heading text-foreground">AI Research Summary</h2>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="gradient-primary text-primary-foreground font-heading text-sm font-semibold gap-2 hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200"
        >
          <FileDown className="w-4 h-4" />
          {isExporting ? 'Preparing Export...' : 'Export Synthesis'}
        </Button>
      </div>

      <ExportModal open={isExportOpen} onOpenChange={setIsExportOpen} result={activeAnalysis || result} pdfUrl={exportPdfUrl} isGenerating={isExporting} />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <p className="text-sm readability-secondary">
          Synthesized from <span className="font-semibold text-foreground">{result.papers.length} real papers</span>
        </p>

        <div id="section-research-flow" className="glass-panel rounded-lg p-5 animate-fade-in-up" style={{ opacity: 0 }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold font-heading readability-heading">Interactive Research Flowchart</h3>
          </div>

          <div className="grid lg:grid-cols-[320px_1fr] gap-4">
            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              <div className="flex flex-col items-center">
                {flowSteps.map((step, idx) => {
                  const isActive = selectedStep === step.id;
                  return (
                    <div key={step.id} className="w-full flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => handleStepClick(step.id)}
                        disabled={!step.available}
                        className={`w-full rounded-md border px-3 py-2 text-left transition-all duration-200 ${
                          isActive
                            ? 'border-primary/60 bg-primary/15 shadow-card'
                            : 'border-border bg-background/65 hover:border-primary/40 hover:bg-background'
                        } ${!step.available ? 'opacity-45 cursor-not-allowed' : ''}`}
                      >
                        <p className={`text-sm font-semibold ${isActive ? 'text-primary' : 'readability-body'}`}>{step.title}</p>
                        <p className="text-[11px] readability-secondary">{step.subtitle}</p>
                      </button>
                      {idx < flowSteps.length - 1 && <span className="text-xs text-primary/70 py-1">↓</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div id="section-final-synthesis" className="rounded-lg border border-primary/20 bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-primary/80 font-semibold">Selected Step</p>
              <h4 className="text-lg font-bold font-heading text-foreground mt-1">
                {selectedStepData?.title || 'Overview'}
              </h4>
              <p className="text-sm readability-secondary mt-1">{selectedStepData?.subtitle || ''}</p>
              <p className="text-sm readability-body leading-relaxed mt-3">{focusedContent.summary}</p>

              {focusedContent.points.length > 0 && (
                <div className="mt-3 rounded-md border border-border bg-background/60 p-3 max-h-64 overflow-y-auto">
                  <p className="text-xs uppercase tracking-wide text-primary/70 font-semibold mb-2">Detailed Evidence</p>
                  <div className="space-y-2">
                    {focusedContent.points.map((point, index) => (
                      <div key={`${selectedStep}-point-${index}`} className="text-xs readability-body leading-relaxed">
                        <span className="text-primary mr-1">{index + 1}.</span>
                        {point}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs readability-secondary mt-3">
                Click any flowchart step to update this panel.
              </p>
            </div>
          </div>
        </div>

        {!result.synthesis ? (
          <button
            onClick={onGenerateSynthesis}
            className="w-full py-3 rounded-lg gradient-hero text-primary-foreground font-heading font-bold text-sm flex items-center justify-center gap-2 hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200"
          >
            <Sparkles className="w-4 h-4" />
            Generate Final Synthesis
          </button>
        ) : (
          <>
            <div className="rounded-lg border border-primary/20 bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-primary/80 font-semibold">Final Synthesis</p>
              <p className="text-sm readability-body mt-2 leading-relaxed whitespace-pre-line">{result.synthesis}</p>
            </div>

            <div id="section-knowledge-graph" className="glass-panel rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-bold font-heading readability-heading">Topic Knowledge Graph</h3>
              </div>
              <p className="text-xs readability-secondary mb-3">
                Visual map of how papers, findings, gaps, and contradictions interconnect around your query.
              </p>
              <KnowledgeGraph result={result} />
            </div>
          </>
        )}

        <QueryConversation result={result} onGenerateSynthesis={onGenerateSynthesis} />
      </div>
    </div>
  );
}
