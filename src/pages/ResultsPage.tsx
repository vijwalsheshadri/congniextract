import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Tag,
  Network,
  Clock,
  FileText,
  Users,
  TrendingUp,
  Loader2,
  Download,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DocumentRecord, AnalysisResult, Entity, Relation, TimelineEvent, ExtractedEvent } from '@/types';
import { BarChart, DonutChart } from '@/components/visualizations/Charts';
import { exportToPdf } from '@/lib/export';

const ENTITY_COLORS: Record<string, string> = {
  PERSON: '#0ea5e9',
  ORGANIZATION: '#14b8a6',
  LOCATION: '#f59e0b',
  DATE: '#ec4899',
  MONEY: '#8b5cf6',
};

const POS_COLORS: Record<string, string> = {
  NN: '#0d9488',
  NNP: '#0891b2',
  VB: '#6366f1',
  JJ: '#f59e0b',
  RB: '#ec4899',
  PRP: '#8b5cf6',
  IN: '#64748b',
  CC: '#64748b',
  DT: '#94a3b8',
  CD: '#10b981',
};

type Tab = 'overview' | 'pos' | 'entities' | 'relations' | 'events' | 'timeline';

export default function ResultsPage() {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DocumentRecord | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!docId) return;
      const { data } = await supabase
        .from('documents')
        .select('*, analysis_results(*)')
        .eq('id', docId)
        .maybeSingle();

      if (data) {
        setDoc(data as DocumentRecord);
        setAnalysis((data as unknown as { analysis_results: AnalysisResult[] }).analysis_results?.[0] ?? null);
      }
      setLoading(false);
    }
    loadData();
  }, [docId]);

  const handleExport = async () => {
    if (!doc || !analysis) return;
    setExporting(true);
    try {
      exportToPdf(doc, analysis);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
      </div>
    );
  }

  if (!doc || !analysis) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 mb-4">Document not found.</p>
        <Link to="/dashboard" className="text-teal-600 font-semibold">Back to Dashboard</Link>
      </div>
    );
  }

  const summary = analysis.summary;
  const entities = analysis.entities as Entity[];
  const relations = analysis.relations as Relation[];
  const events = analysis.events as ExtractedEvent[];
  const timeline = analysis.timeline as TimelineEvent[];

  const entityChartData = Object.entries(summary.entityCounts).map(([label, value]) => ({
    label,
    value,
    color: ENTITY_COLORS[label] ?? '#94a3b8',
  }));

  const posChartData = Object.entries(summary.posTagCounts).map(([label, value]) => ({
    label,
    value,
    color: POS_COLORS[label] ?? '#94a3b8',
  }));

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900 truncate">{doc.filename}</h1>
          <p className="text-xs text-slate-500">
            {new Date(doc.created_at).toLocaleString()} · {summary.wordCount} words · {summary.sentenceCount} sentences
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === t.id
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Tag} label="Entities" value={entities.length} color="text-blue-600" bg="bg-blue-50" />
            <StatCard icon={Network} label="Relations" value={relations.length} color="text-amber-600" bg="bg-amber-50" />
            <StatCard icon={Clock} label="Events" value={events.length} color="text-rose-600" bg="bg-rose-50" />
            <StatCard icon={TrendingUp} label="Timeline Items" value={timeline.length} color="text-teal-600" bg="bg-teal-50" />
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <Panel title="Entity Distribution">
              <DonutChart data={entityChartData} />
            </Panel>
            <Panel title="Part-of-Speech Distribution">
              <BarChart data={posChartData} />
            </Panel>
          </div>

          <Panel title="Source Text Preview">
            <div className="max-h-48 overflow-y-auto p-4 bg-slate-50 rounded-lg text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-mono">
              {doc.extracted_text.slice(0, 1500)}
              {doc.extracted_text.length > 1500 && '...'}
            </div>
          </Panel>
        </div>
      )}

      {activeTab === 'pos' && (
        <div className="space-y-5">
          <Panel title="Part-of-Speech Tags">
            <BarChart data={posChartData} />
          </Panel>
          <Panel title="Tagged Text">
            <div className="max-h-96 overflow-y-auto p-4 bg-slate-50 rounded-lg text-sm leading-relaxed">
              {(analysis.pos_tags as { text: string; tag: string }[]).slice(0, 200).map((tag, i) => (
                <span
                  key={i}
                  className="inline-block mr-1.5 mb-1.5 px-2 py-0.5 rounded text-xs"
                  style={{
                    backgroundColor: (POS_COLORS[tag.tag] ?? '#94a3b8') + '20',
                    color: POS_COLORS[tag.tag] ?? '#475569',
                  }}
                  title={tag.tag}
                >
                  {tag.text}
                  <span className="opacity-50 ml-1">{tag.tag}</span>
                </span>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {activeTab === 'entities' && (
        <div className="space-y-5">
          <Panel title="Entity Distribution">
            <DonutChart data={entityChartData} />
          </Panel>
          <Panel title="Extracted Entities">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {entities.map((e, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: (ENTITY_COLORS[e.type] ?? '#94a3b8') + '20',
                      color: ENTITY_COLORS[e.type] ?? '#475569',
                    }}
                  >
                    {e.type}
                  </span>
                  <span className="text-sm font-medium text-slate-800">{e.text}</span>
                </div>
              ))}
              {entities.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">No entities detected</p>
              )}
            </div>
          </Panel>
        </div>
      )}

      {activeTab === 'relations' && (
        <Panel title="Extracted Relations">
          {relations.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No relations detected</p>
          ) : (
            <div className="space-y-3">
              {relations.map((r, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 flex-wrap">
                  <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                    {r.subject}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium">
                    → {r.predicate} →
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 text-xs font-semibold">
                    {r.object}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {activeTab === 'events' && (
        <Panel title="Extracted Events">
          {events.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No events detected</p>
          ) : (
            <div className="space-y-3">
              {events.map((ev, i) => (
                <div key={i} className="p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700">
                      {ev.type}
                    </span>
                    <span className="text-xs text-slate-400">trigger: {ev.trigger}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed mb-2">{ev.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    {ev.participants.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {ev.participants.join(', ')}
                      </span>
                    )}
                    {ev.location && <span>📍 {ev.location}</span>}
                    {ev.time && <span>🕐 {ev.time}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {activeTab === 'timeline' && (
        <Panel title="Temporal Timeline">
          {timeline.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No timeline events detected</p>
          ) : (
            <div className="relative pl-8">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200" />
              {timeline.map((ev, i) => (
                <div key={i} className="relative pb-6 last:pb-0">
                  <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-teal-500 ring-4 ring-teal-50" />
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-400">#{ev.order}</span>
                    {ev.rawTime !== 'Unknown' && (
                      <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                        {ev.rawTime}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{ev.description}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

const tabs: { id: Tab; label: string; icon: typeof FileText }[] = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'pos', label: 'POS Tags', icon: Tag },
  { id: 'entities', label: 'Entities', icon: Users },
  { id: 'relations', label: 'Relations', icon: Network },
  { id: 'events', label: 'Events', icon: Clock },
  { id: 'timeline', label: 'Timeline', icon: TrendingUp },
];

function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: typeof FileText;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200">
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-2`}>
        <Icon className={`w-4.5 h-4.5 ${color}`} />
      </div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}
