import nlp from 'compromise';
import type {
  PosTag,
  Entity,
  Relation,
  ExtractedEvent,
  TimelineEvent,
  AnalysisSummary,
} from '@/types';

const EVENT_TRIGGERS = [
  'acquired', 'merger', 'acquisition', 'launched', 'announced', 'filed', 'sued',
  'signed', 'agreed', 'appointed', 'elected', 'resigned', 'fired', 'hired',
  'founded', 'established', 'created', 'released', 'published', 'patented',
  'approved', 'rejected', 'banned', 'invested', 'raised', 'partnered', 'merged',
  'expanded', 'closed', 'opened', 'bought', 'sold', 'declared', 'reported',
  'discovered', 'invented', 'built', 'destroyed', 'attacked', 'signed', 'killed',
  'born', 'died', 'married', 'divorced', 'graduated', 'awarded', 'honored',
];

const TIME_KEYWORDS = [
  'in', 'on', 'during', 'before', 'after', 'since', 'until', 'by', 'at',
];

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june', 'july',
  'august', 'september', 'october', 'november', 'december',
];

interface Match {
  text: () => string;
  offset: () => { start: number; length: number } | null;
}
interface DocWithDates {
  dates: () => { forEach: (cb: (m: Match) => void) => void; out: (mode: string) => string[] };
}

function sentenceSegment(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function performPosTagging(text: string): PosTag[] {
  const doc = nlp(text);
  const tags: PosTag[] = [];
  doc.terms().forEach((term) => {
    const t = term as unknown as {
      text: string;
      offset: { start: number; length: number };
      tags: Set<string>;
    };
    const tagSet = Array.from(t.tags);
    const primaryTag = tagSet[0] ?? 'Unknown';
    tags.push({
      text: t.text,
      tag: mapPosTag(primaryTag),
      start: t.offset?.start ?? 0,
      end: (t.offset?.start ?? 0) + (t.offset?.length ?? t.text.length),
    });
  });
  return tags;
}

function mapPosTag(tag: string): string {
  const tagMap: Record<string, string> = {
    Noun: 'NN',
    Verb: 'VB',
    Adjective: 'JJ',
    Adverb: 'RB',
    Pronoun: 'PRP',
    Preposition: 'IN',
    Conjunction: 'CC',
    Determiner: 'DT',
    Value: 'CD',
    Expression: 'FW',
    ProperNoun: 'NNP',
  };
  return tagMap[tag] ?? tag;
}

export function performNER(text: string): Entity[] {
  const doc = nlp(text);
  const entities: Entity[] = [];

  doc.organizations().forEach((m) => {
    const mm = m as unknown as { text: () => string; offset: () => { start: number; length: number } | null };
    const txt = mm.text();
    const off = mm.offset();
    if (txt) entities.push({ text: txt, type: 'ORGANIZATION', start: off?.start ?? 0, end: (off?.start ?? 0) + (off?.length ?? txt.length) });
  });

  doc.people().forEach((m) => {
    const mm = m as unknown as { text: () => string; offset: () => { start: number; length: number } | null };
    const txt = mm.text();
    const off = mm.offset();
    if (txt) entities.push({ text: txt, type: 'PERSON', start: off?.start ?? 0, end: (off?.start ?? 0) + (off?.length ?? txt.length) });
  });

  doc.places().forEach((m) => {
    const mm = m as unknown as { text: () => string; offset: () => { start: number; length: number } | null };
    const txt = mm.text();
    const off = mm.offset();
    if (txt) entities.push({ text: txt, type: 'LOCATION', start: off?.start ?? 0, end: (off?.start ?? 0) + (off?.length ?? txt.length) });
  });

  (doc as unknown as DocWithDates).dates().forEach((m: Match) => {
    const txt = m.text();
    const off = m.offset();
    if (txt) entities.push({ text: txt, type: 'DATE', start: off?.start ?? 0, end: (off?.start ?? 0) + (off?.length ?? txt.length) });
  });

  doc.money().forEach((m) => {
    const mm = m as unknown as { text: () => string; offset: () => { start: number; length: number } | null };
    const txt = mm.text();
    const off = mm.offset();
    if (txt) entities.push({ text: txt, type: 'MONEY', start: off?.start ?? 0, end: (off?.start ?? 0) + (off?.length ?? txt.length) });
  });

  return entities.filter((e) => e.text.length > 1);
}

export function extractRelations(text: string, entities: Entity[]): Relation[] {
  const relations: Relation[] = [];
  const sentences = sentenceSegment(text);

  for (const sentence of sentences) {
    const doc = nlp(sentence);
    const clauses = doc.clauses();

    clauses.forEach((clause) => {
      const cDoc = nlp((clause as unknown as { text: () => string }).text());
      const subjects = cDoc.match('(#+Noun|#+Person|#+Organization)+').out('array') as string[];
      const objects = cDoc.match('(#+Noun|#+Person|#+Organization)+').out('array') as string[];
      const verbs = cDoc.verbs().out('array') as string[];

      if (subjects.length > 0 && verbs.length > 0) {
        const subject = subjects[0];
        const verb = verbs[0];
        const object = objects.find((o) => o !== subject) ?? '';

        if (object) {
          const subjectType = getEntityType(subject, entities);
          const objectType = getEntityType(object, entities);
          relations.push({ subject, predicate: verb, object, subjectType, objectType });
        }
      }
    });
  }

  return relations;
}

function getEntityType(text: string, entities: Entity[]): string {
  const match = entities.find((e) => e.text.toLowerCase() === text.toLowerCase());
  return match?.type ?? 'UNKNOWN';
}

export function extractEvents(text: string, entities: Entity[]): ExtractedEvent[] {
  const events: ExtractedEvent[] = [];
  const sentences = sentenceSegment(text);

  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    const triggerWord = EVENT_TRIGGERS.find((t) => lowerSentence.includes(t));

    if (!triggerWord) continue;

    const doc = nlp(sentence);
    const participants = [
      ...doc.people().out('array'),
      ...doc.organizations().out('array'),
    ] as string[];

    const location = (doc.places().out('array') as string[])[0] ?? undefined;
    const time = ((doc as unknown as DocWithDates).dates().out('array') as string[])[0] ?? undefined;

    events.push({
      trigger: triggerWord,
      type: categorizeEvent(triggerWord),
      participants: [...new Set(participants)],
      location,
      time,
      description: sentence,
    });
  }

  return events;
}

function categorizeEvent(trigger: string): string {
  const businessTriggers = ['acquired', 'merger', 'acquisition', 'merger', 'bought', 'sold', 'partnered', 'invested', 'raised', 'signed', 'agreed'];
  const politicalTriggers = ['elected', 'appointed', 'resigned', 'filed', 'sued', 'approved', 'rejected', 'banned', 'declared'];
  const personalTriggers = ['born', 'died', 'married', 'divorced', 'graduated', 'hired', 'fired'];
  const productTriggers = ['launched', 'released', 'published', 'patented', 'invented', 'built'];
  const conflictTriggers = ['attacked', 'destroyed', 'killed'];

  if (businessTriggers.includes(trigger)) return 'Business';
  if (politicalTriggers.includes(trigger)) return 'Political';
  if (personalTriggers.includes(trigger)) return 'Personal';
  if (productTriggers.includes(trigger)) return 'Product';
  if (conflictTriggers.includes(trigger)) return 'Conflict';
  return 'General';
}

export function buildTimeline(events: ExtractedEvent[], text: string): TimelineEvent[] {
  const timelineEvents: TimelineEvent[] = [];
  const doc = nlp(text);
  const allDates = (doc as unknown as DocWithDates).dates().out('array') as string[];

  events.forEach((event, idx) => {
    const timeRef = event.time ?? findTimeNearEvent(text, event.trigger, allDates);
    timelineEvents.push({
      event: event.trigger,
      rawTime: timeRef ?? 'Unknown',
      order: idx,
      date: timeRef,
      description: event.description,
    });
  });

  timelineEvents.sort((a, b) => {
    if (a.date && b.date) {
      const dA = parseDate(a.date);
      const dB = parseDate(b.date);
      if (dA && dB) return dA - dB;
    }
    if (a.date && !b.date) return -1;
    if (!a.date && b.date) return 1;
    return a.order - b.order;
  });

  timelineEvents.forEach((e, idx) => (e.order = idx + 1));
  return timelineEvents;
}

function findTimeNearEvent(text: string, trigger: string, allDates: string[]): string | undefined {
  const triggerIdx = text.toLowerCase().indexOf(trigger);
  if (triggerIdx === -1) return undefined;

  const doc = nlp(text);
  let closest: string | undefined;
  let closestDist = Infinity;

  (doc as unknown as DocWithDates).dates().forEach((m: Match) => {
    const off = m.offset();
    if (off) {
      const dist = Math.abs(off.start - triggerIdx);
      if (dist < closestDist && dist < 200) {
        closestDist = dist;
        closest = m.text();
      }
    }
  });

  return closest;
}

function parseDate(dateStr: string): number | null {
  const monthIdx = MONTHS.findIndex((m) => dateStr.toLowerCase().includes(m));
  const yearMatch = dateStr.match(/\b(1[89]\d{2}|20\d{2})\b/);
  const dayMatch = dateStr.match(/\b(\d{1,2})\b/);

  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  const month = monthIdx >= 0 ? monthIdx + 1 : null;
  const day = dayMatch ? parseInt(dayMatch[1]) : 1;

  if (year) {
    return year * 10000 + (month ?? 1) * 100 + day;
  }
  return null;
}

export function buildSummary(
  text: string,
  posTags: PosTag[],
  entities: Entity[],
  relations: Relation[],
  events: ExtractedEvent[],
): AnalysisSummary {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const sentenceCount = sentenceSegment(text).length;

  const posTagCounts: Record<string, number> = {};
  posTags.forEach((t) => {
    posTagCounts[t.tag] = (posTagCounts[t.tag] ?? 0) + 1;
  });

  const entityCounts: Record<string, number> = {};
  entities.forEach((e) => {
    entityCounts[e.type] = (entityCounts[e.type] ?? 0) + 1;
  });

  return {
    wordCount,
    sentenceCount,
    posTagCounts,
    entityCounts,
    relationCount: relations.length,
    eventCount: events.length,
  };
}

export interface FullAnalysis {
  posTags: PosTag[];
  entities: Entity[];
  relations: Relation[];
  events: ExtractedEvent[];
  timeline: TimelineEvent[];
  summary: AnalysisSummary;
}

export function runFullAnalysis(text: string): FullAnalysis {
  const posTags = performPosTagging(text);
  const entities = performNER(text);
  const relations = extractRelations(text, entities);
  const events = extractEvents(text, entities);
  const timeline = buildTimeline(events, text);
  const summary = buildSummary(text, posTags, entities, relations, events);

  return { posTags, entities, relations, events, timeline, summary };
}
