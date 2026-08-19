import { useState, type FormEvent, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  Loader2,
  AlertCircle,
  Sparkles,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { runFullAnalysis } from '@/lib/nlp';
import type { SourceType } from '@/types';

const SAMPLE_TEXT = `Apple Inc. was founded by Steve Jobs, Steve Wozniak, and Ronald Wayne in April 1976 in Cupertino, California. The company launched the iPhone in January 2007 and the iPad in April 2010. Tim Cook was appointed as CEO in August 2011 after Jobs resigned due to health reasons.

In March 2016, Apple acquired the machine learning startup Turi for approximately 200 million dollars. Later, in June 2020, Apple announced a partnership with IBM to develop enterprise applications. The company reported record revenue of 365 billion dollars in 2021.

Microsoft, founded by Bill Gates and Paul Allen in April 1975 in Albuquerque, New Mexico, launched Windows 95 in August 1995. Satya Nadella was appointed as CEO in February 2014. Microsoft acquired LinkedIn in December 2016 for 26 billion dollars and GitHub in June 2018 for 7.5 billion dollars.`;

export default function AnalyzePage() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    if (file.size > 500_000) {
      setError('File too large. Please keep files under 500KB.');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'txt' && ext !== 'text' && file.type !== 'text/plain') {
      setError('Only .txt files are supported.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result || ''));
      setFilename(file.name);
    };
    reader.onerror = () => setError('Failed to read file.');
    reader.readAsText(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (text.trim().length < 10) {
      setError('Please enter at least 10 characters of text to analyze.');
      return;
    }

    setLoading(true);

    try {
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          filename: filename || `Document ${new Date().toLocaleString()}`,
          extracted_text: text,
          source_type: filename ? 'txt' : ('text' as SourceType),
        })
        .select()
        .single();

      if (docError || !docData) {
        setError(docError?.message || 'Failed to save document.');
        setLoading(false);
        return;
      }

      const analysis = runFullAnalysis(text);

      const { error: analysisError } = await supabase
        .from('analysis_results')
        .insert({
          document_id: docData.id,
          pos_tags: analysis.posTags,
          entities: analysis.entities,
          relations: analysis.relations,
          events: analysis.events,
          timeline: analysis.timeline,
          summary: analysis.summary,
        });

      if (analysisError) {
        setError(analysisError.message);
        setLoading(false);
        return;
      }

      navigate(`/results/${docData.id}`);
    } catch {
      setError('An unexpected error occurred during analysis.');
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analyze Text</h1>
        <p className="text-sm text-slate-500 mt-1">
          Paste text or upload a .txt file to run the full NLP extraction pipeline.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 mb-5 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed p-6 text-center transition-all ${
            dragOver ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white'
          }`}
        >
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-600 font-medium mb-1">Drop a .txt file here or click to browse</p>
          <p className="text-xs text-slate-400 mb-3">Max 500KB · Plain text only</p>
          <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-teal-600 bg-teal-50 rounded-lg cursor-pointer hover:bg-teal-100 transition-colors">
            <FileText className="w-3.5 h-3.5" />
            Choose File
            <input
              type="file"
              accept=".txt,text/plain"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </label>
          {filename && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                {filename}
              </span>
              <button
                type="button"
                onClick={() => { setFilename(''); setText(''); }}
                className="text-slate-400 hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Text input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">Text to analyze</label>
            <button
              type="button"
              onClick={() => { setText(SAMPLE_TEXT); setFilename(''); }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load sample text
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            placeholder="Paste your text here..."
            className="w-full p-4 text-sm rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all resize-y leading-relaxed font-mono"
          />
          <p className="text-xs text-slate-400 mt-1.5">{text.split(/\s+/).filter(Boolean).length} words</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || text.trim().length < 10}
          className="w-full py-3 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Run Analysis
            </>
          )}
        </button>
      </form>
    </div>
  );
}
