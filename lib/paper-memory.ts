/**
 * Paper Memory — localStorage-based persistence for paper states
 * ═══════════════════════════════════════════════════════════════════════════
 * Tracks:
 *  - "saved"    papers (bookmarked for later)
 *  - "dismissed" papers (won't surface again)
 *  - Relevance feedback (thumbs up/down) used to improve future scoring
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type PaperStatus = "saved" | "dismissed";
export type FeedbackRating = "up" | "down";

export interface PaperMemoryEntry {
  status: PaperStatus;
  title: string;
  journal: string;
  addedAt: string;
}

export interface PaperFeedbackEntry {
  rating: FeedbackRating;
  /** Interests matched by this paper — used to up/down-weight similar papers */
  interests: string[];
  /** Methods matched by this paper */
  methods: string[];
  ratedAt: string;
}

export type PaperMemoryStore = Record<string, PaperMemoryEntry>;
export type PaperFeedbackStore = Record<string, PaperFeedbackEntry>;

// Summarised feedback used by the scoring engine
export interface FeedbackSignal {
  /** Interest labels that appeared in liked (👍) papers */
  upvotedInterests: Record<string, number>;
  /** Interest labels that appeared in disliked (👎) papers */
  downvotedInterests: Record<string, number>;
  /** Method labels that appeared in liked papers */
  upvotedMethods: Record<string, number>;
  /** Method labels that appeared in disliked papers */
  downvotedMethods: Record<string, number>;
}

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE KEYS
// ═══════════════════════════════════════════════════════════════════════════

const MEMORY_KEY = "verso-paper-memory";
const FEEDBACK_KEY = "verso-paper-feedback";

// ═══════════════════════════════════════════════════════════════════════════
// PAPER MEMORY (saved / dismissed)
// ═══════════════════════════════════════════════════════════════════════════

export function getPaperMemory(): PaperMemoryStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    return raw ? (JSON.parse(raw) as PaperMemoryStore) : {};
  } catch {
    return {};
  }
}

export function setPaperStatus(
  id: string,
  meta: { title: string; journal: string },
  status: PaperStatus | null
): PaperMemoryStore {
  const store = getPaperMemory();
  if (status === null) {
    delete store[id];
  } else {
    store[id] = { status, title: meta.title, journal: meta.journal, addedAt: new Date().toISOString() };
  }
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(store));
  } catch {
    // localStorage quota exceeded — fail silently
  }
  return store;
}

export function getDismissedIds(): Set<string> {
  const store = getPaperMemory();
  return new Set(
    Object.entries(store)
      .filter(([, entry]) => entry.status === "dismissed")
      .map(([id]) => id)
  );
}

export function getSavedPapers(): Array<{ id: string } & PaperMemoryEntry> {
  const store = getPaperMemory();
  return Object.entries(store)
    .filter(([, entry]) => entry.status === "saved")
    .map(([id, entry]) => ({ id, ...entry }))
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
}

// ═══════════════════════════════════════════════════════════════════════════
// FEEDBACK (thumbs up / down)
// ═══════════════════════════════════════════════════════════════════════════

export function getPaperFeedback(): PaperFeedbackStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    return raw ? (JSON.parse(raw) as PaperFeedbackStore) : {};
  } catch {
    return {};
  }
}

export function setPaperFeedback(
  id: string,
  rating: FeedbackRating | null,
  interests: string[],
  methods: string[]
): PaperFeedbackStore {
  const store = getPaperFeedback();
  if (rating === null) {
    delete store[id];
  } else {
    store[id] = { rating, interests, methods, ratedAt: new Date().toISOString() };
  }
  try {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(store));
  } catch {
    // localStorage quota exceeded — fail silently
  }
  return store;
}

// ═══════════════════════════════════════════════════════════════════════════
// FEEDBACK SIGNAL — aggregated for scoring engine
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Aggregate stored feedback into a signal object the scoring engine can use.
 * Returns weighted counts of interests/methods from liked vs. disliked papers.
 */
export function buildFeedbackSignal(store?: PaperFeedbackStore): FeedbackSignal {
  const feedback = store ?? getPaperFeedback();
  const signal: FeedbackSignal = {
    upvotedInterests: {},
    downvotedInterests: {},
    upvotedMethods: {},
    downvotedMethods: {},
  };

  for (const entry of Object.values(feedback)) {
    const interestTarget =
      entry.rating === "up" ? signal.upvotedInterests : signal.downvotedInterests;
    const methodTarget =
      entry.rating === "up" ? signal.upvotedMethods : signal.downvotedMethods;

    for (const interest of entry.interests) {
      interestTarget[interest] = (interestTarget[interest] ?? 0) + 1;
    }
    for (const method of entry.methods) {
      methodTarget[method] = (methodTarget[method] ?? 0) + 1;
    }
  }

  return signal;
}
