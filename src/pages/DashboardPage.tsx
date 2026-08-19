import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  FileText,
  Tag,
  Network,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { DocumentRecord, AnalysisResult } from '@/types';

interface DashboardStats {
  totalDocuments: number;
  totalEntities: number;
  totalRelations: number;
  totalEvents: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<(DocumentRecord & { analysis?: AnalysisResult[] })[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalDocuments: 0, totalEntities: 0, totalRelations: 0, totalEvents: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .from('documents')
        .select('*, analysis(*)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setDocuments(data as (DocumentRecord & { analysis?: AnalysisResult[] })[]);
        let totalEntities = 0, totalRelations = 0, totalEvents = 0;
        data.forEach((doc) => {
          const a = doc.analysis?.[0];
          if (a) {
            totalEntities += (a.entities as unknown[]).length;
            totalRelations += (a.relations as unknown[]).length;
            totalEvents += (a.events as unknown[]).length;
          }
        });
        setStats({
          totalDocuments: data.length,
          totalEntities,
          totalRelations,
          totalEvents,
        });
      }
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, {user?.email?.split('@')[0]}
          </p>
        </div>
        <button
          onClick={() => navigate('/analyze')}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Analysis
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-300" /> : s.value(stats)}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent documents */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Recent Documents</h2>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">No documents yet</h3>
            <p className="text-sm text-slate-500 mb-4">Upload or paste text to start extracting insights.</p>
            <Link
              to="/analyze"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-teal-600 hover:text-teal-700"
            >
              Analyze your first document
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => {
              const analysis = doc.analysis?.[0];
              return (
                <Link
                  key={doc.id}
                  to={`/results/${doc.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate">{doc.filename}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(doc.created_at).toLocaleDateString()} ·{' '}
                      {analysis ? `${(analysis.entities as unknown[]).length} entities, ${(analysis.events as unknown[]).length} events` : 'No analysis'}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 transition-colors shrink-0 ml-3" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const statCards = [
  {
    label: 'Documents Analyzed',
    icon: FileText,
    bg: 'bg-teal-50',
    color: 'text-teal-600',
    value: (s: DashboardStats) => s.totalDocuments,
  },
  {
    label: 'Entities Extracted',
    icon: Tag,
    bg: 'bg-blue-50',
    color: 'text-blue-600',
    value: (s: DashboardStats) => s.totalEntities,
  },
  {
    label: 'Relations Found',
    icon: Network,
    bg: 'bg-amber-50',
    color: 'text-amber-600',
    value: (s: DashboardStats) => s.totalRelations,
  },
  {
    label: 'Events Detected',
    icon: Clock,
    bg: 'bg-rose-50',
    color: 'text-rose-600',
    value: (s: DashboardStats) => s.totalEvents,
  },
];
