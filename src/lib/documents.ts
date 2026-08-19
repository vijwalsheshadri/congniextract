import { supabase } from '@/lib/supabase';
import type { AnalysisResult, DocumentRecord, DocumentWithAnalysis } from '@/types';

export async function loadDocumentsWithAnalysis(limit?: number) {
  let documentQuery = supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (limit) documentQuery = documentQuery.limit(limit);

  const { data: documents, error: documentsError } = await documentQuery;
  if (documentsError) return { data: null, error: documentsError };
  if (!documents || documents.length === 0) return { data: [], error: null };

  const documentIds = documents.map((document) => document.id);
  const { data: analyses, error: analysesError } = await supabase
    .from('analysis_results')
    .select('*')
    .in('document_id', documentIds)
    .order('created_at', { ascending: false });

  if (analysesError) return { data: null, error: analysesError };

  const analysisByDocument = new Map<string, AnalysisResult[]>();
  (analyses ?? []).forEach((analysis) => {
    const existing = analysisByDocument.get(analysis.document_id) ?? [];
    existing.push(analysis as AnalysisResult);
    analysisByDocument.set(analysis.document_id, existing);
  });

  const result = (documents as DocumentRecord[]).map((document): DocumentWithAnalysis => ({
    ...document,
    analysis: analysisByDocument.get(document.id) ?? [],
  }));

  return { data: result, error: null };
}

export async function loadDocumentWithAnalysis(documentId: string) {
  const { data: document, error: documentError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .maybeSingle();

  if (documentError) return { data: null, error: documentError };
  if (!document) return { data: null, error: null };

  const { data: analyses, error: analysesError } = await supabase
    .from('analysis_results')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false });

  if (analysesError) return { data: null, error: analysesError };

  return {
    data: {
      ...(document as DocumentRecord),
      analysis: (analyses ?? []) as AnalysisResult[],
    } as DocumentWithAnalysis,
    error: null,
  };
}
