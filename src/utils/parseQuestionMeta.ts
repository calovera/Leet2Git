export interface QMeta {
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tag: string;                    // first topic tag or "Uncategorized"
}

export function parseQuestionMeta(res: unknown): QMeta | null {
  try {
    const q = (res as any)?.data?.question;
    if (!q?.titleSlug) return null;
    return {
      slug: q.titleSlug,
      title: q.title ?? q.titleSlug.replace(/-/g, " "),
      difficulty: (q.difficulty as any) ?? "Easy",
      tag:
        (Array.isArray(q.topicTags) && q.topicTags[0]?.name) ||
        "Uncategorized"
    };
  } catch {
    return null;
  }
}