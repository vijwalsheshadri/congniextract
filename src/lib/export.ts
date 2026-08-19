import type { DocumentRecord, AnalysisResult, Entity, Relation } from '@/types';
import { jsPDF } from 'jspdf';

export function exportToPdf(doc: DocumentRecord, analysis: AnalysisResult) {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const addLine = (text: string, size = 10, bold = false) => {
    pdf.setFontSize(size);
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    const lines = pdf.splitTextToSize(text, contentWidth);
    lines.forEach((line: string) => {
      if (y > 280) { pdf.addPage(); y = 20; }
      pdf.text(line, margin, y);
      y += size * 0.5 + 2;
    });
  };

  const addSection = (title: string) => {
    y += 6;
    if (y > 260) { pdf.addPage(); y = 20; }
    addLine(title, 14, true);
    y += 2;
  };

  // Title
  pdf.setFillColor(13, 148, 136);
  pdf.rect(0, 0, pageWidth, 12, 'F');
  addLine('CogniExtract — Analysis Report', 18, true);
  y += 4;

  // Document info
  addSection('Document Information');
  addLine(`Filename: ${doc.filename}`);
  addLine(`Date: ${new Date(doc.created_at).toLocaleString()}`);
  addLine(`Source Type: ${doc.source_type}`);

  const summary = analysis.summary;
  addLine(`Words: ${summary.wordCount} | Sentences: ${summary.sentenceCount}`);
  addLine(`Entities: ${(analysis.entities as Entity[]).length} | Relations: ${(analysis.relations as Relation[]).length} | Events: ${(analysis.events as unknown[]).length}`);

  // Entities
  addSection('Extracted Entities');
  const entities = analysis.entities as Entity[];
  if (entities.length === 0) {
    addLine('No entities detected.');
  } else {
    entities.forEach((e) => {
      addLine(`  [${e.type}] ${e.text}`);
    });
  }

  // Relations
  addSection('Extracted Relations');
  const relations = analysis.relations as Relation[];
  if (relations.length === 0) {
    addLine('No relations detected.');
  } else {
    relations.forEach((r) => {
      addLine(`  ${r.subject}  —${r.predicate}→  ${r.object}`);
    });
  }

  // Events
  addSection('Extracted Events');
  const events = analysis.events as { type: string; trigger: string; description: string; participants: string[]; location?: string; time?: string }[];
  if (events.length === 0) {
    addLine('No events detected.');
  } else {
    events.forEach((ev) => {
      addLine(`  [${ev.type}] ${ev.trigger}`);
      addLine(`    ${ev.description}`);
      if (ev.participants.length > 0) addLine(`    Participants: ${ev.participants.join(', ')}`);
      if (ev.location) addLine(`    Location: ${ev.location}`);
      if (ev.time) addLine(`    Time: ${ev.time}`);
    });
  }

  // Timeline
  addSection('Temporal Timeline');
  const timeline = analysis.timeline as { order: number; rawTime: string; description: string }[];
  if (timeline.length === 0) {
    addLine('No timeline events detected.');
  } else {
    timeline.forEach((t) => {
      addLine(`  #${t.order} [${t.rawTime}] ${t.description}`);
    });
  }

  // Footer
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(150);
    pdf.text(
      `CogniExtract Report — Page ${i} of ${pageCount}`,
      pageWidth / 2,
      290,
      { align: 'center' },
    );
  }

  pdf.save(`${doc.filename.replace(/\.[^.]+$/, '')}-analysis.pdf`);
}
