import { QMeta } from './parseQuestionMeta';

// In-memory cache for question metadata
const questionCache = new Map<string, QMeta>();

export function put(meta: QMeta): void {
  questionCache.set(meta.slug, meta);
  console.info(`[Leet2Git] Question meta cached: ${meta.slug}`);
}

export function get(slug: string): QMeta | null {
  return questionCache.get(slug) || null;
}

export function clear(): void {
  questionCache.clear();
}