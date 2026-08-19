import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileBarChart,
  Loader2,
  Download,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DocumentRecord, AnalysisResult } from '@/types';
import { exportToPdf } from '@/lib/export';

export default function ReportsPage() {
  const [documents, setDocuments] = useState<(DocumentRecord & { analysis?: AnalysisResult[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('documents')
        .select('*, analysis(*)')
        .order('created_at', { ascending: false });
      if (data) {
        setDocuments(data as (DocumentRecord & { analysis?: AnalysisResult[] })[]);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleExport = (doc: DocumentRecord & { analysis?: AnalysisResult[] }) => {
    const analysis = doc.analysis?.[0];
    if (!analysis) return;
    setExporting(doc.id);
    try {
      exportToPdf(doc, analysis);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <FileBarChart className="w-6 h-6 text-teal-600" />
          Reports
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Export analysis results as PDF reports for any of your documents.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">No reports yet</h3>
          <p className="text-sm text-slate-500 mb-4">Analyze documents to generate downloadable reports.</p>
          <Link to="/analyze" className="text-teal-600 font-semibold text-sm">Analyze a document →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const analysis = doc.analysis?.[0];
            const summary = analysis?.summary;
            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{doc.filename}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {new Date(doc.created_at).toLocaleString()}
                    </p>
                    {summary && (
                      <div className="flex gap-3 mt-2 text-xs text-slate-500">
                        <span>{summary.wordCount} words</span>
                        <span>·</span>
                        <span>{(analysis!.entities as unknown[]).length} entities</span>
                        <span>·</span>
                        <span>{(analysis!.relations as unknown[]).length} relations</span>
                        <span>·</span>
                        <span>{(analysis!.events as unknown[]).length} events</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/results/${doc.id}`}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    View
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  {analysis && (
                    <button
                      onClick={() => handleExport(doc)}
                      disabled={exporting === doc.id}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-60"
                    >
                      {exporting === doc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      PDF
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
