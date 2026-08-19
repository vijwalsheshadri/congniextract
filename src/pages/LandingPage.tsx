import { Link } from 'react-router-dom';
import {
  Brain,
  FileText,
  Network,
  BarChart3,
  Clock,
  Tag,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-800 tracking-tight">CogniExtract</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 mb-6">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-semibold text-teal-700">AI-Powered Text Analysis</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
            Extract structured knowledge
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">
              from any document
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            CogniExtract uses natural language processing to identify entities, relationships, and
            events in your text — then visualizes them as interactive knowledge graphs and timelines.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to={user ? '/dashboard' : '/register'}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm hover:shadow-md"
            >
              Start Analyzing
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
              Live Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
            Five extraction engines in one
          </h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            From part-of-speech tagging to temporal event ordering, CogniExtract covers the full
            NLP pipeline.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center mb-4">
                  <f.icon className="w-5.5 h-5.5 text-teal-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm mb-4">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to extract insights?</h2>
          <p className="text-slate-400 mb-8">
            Create a free account and start analyzing documents in seconds.
          </p>
          <Link
            to={user ? '/dashboard' : '/register'}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-900 bg-teal-400 rounded-xl hover:bg-teal-300 transition-colors"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-teal-600" />
            <span className="text-sm font-semibold text-slate-700">CogniExtract</span>
          </div>
          <p className="text-xs text-slate-400">AI Information Extraction Platform</p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Tag,
    title: 'POS Tagging',
    desc: 'Identify nouns, verbs, adjectives, and every part of speech with precise positions in your text.',
  },
  {
    icon: FileText,
    title: 'Named Entity Recognition',
    desc: 'Automatically detect people, organizations, locations, dates, and monetary values mentioned in text.',
  },
  {
    icon: Network,
    title: 'Relation Extraction',
    desc: 'Discover how entities relate to each other through subject-predicate-object triplets.',
  },
  {
    icon: Sparkles,
    title: 'Event Extraction',
    desc: 'Detect events like mergers, elections, product launches, and more, with participants and locations.',
  },
  {
    icon: Clock,
    title: 'Temporal Ordering',
    desc: 'Order events chronologically on an interactive timeline using detected dates and time references.',
  },
  {
    icon: BarChart3,
    title: 'Visualization Dashboard',
    desc: 'See all extracted data in charts, graphs, and interactive knowledge maps at a glance.',
  },
];

const steps = [
  {
    title: 'Upload or paste text',
    desc: 'Paste raw text or upload a .txt file. Your document is stored securely in your account.',
  },
  {
    title: 'AI processes it',
    desc: 'Five extraction engines run in parallel, identifying entities, relations, events, and timelines.',
  },
  {
    title: 'Explore & export',
    desc: 'View results in dashboards, knowledge graphs, and timelines, then export as PDF reports.',
  },
];
