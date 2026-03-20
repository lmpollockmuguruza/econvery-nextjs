/**
 * arXiv Preprint Fetcher
 * ═══════════════════════════════════════════════════════════════════════════
 * Fetches recent preprints from arXiv via the OpenAlex API.
 *
 * OpenAlex indexes arXiv as a source (ID: S4306400194) and applies concept
 * tagging, making it a convenient single-endpoint solution without needing
 * the arXiv API directly.
 *
 * Papers are filtered to economics and social-science-adjacent concepts so
 * that only field-relevant preprints surface alongside journal papers.
 */

import type { Paper } from "./types";
import { reconstructAbstract } from "./openalex";

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const OPENALEX_WORKS_URL = "https://api.openalex.org/works";
const POLITE_EMAIL = "verso@research.app";
const ARXIV_SOURCE_ID = "S4306400194";
const TIMEOUT = 20000;

/**
 * OpenAlex concept IDs covering economics, political science, and adjacent
 * social-science fields. These are used to filter arXiv preprints.
 */
const FIELD_CONCEPT_IDS = [
  "C162324750", // Economics
  "C17744445",  // Political science
  "C39432304",  // Macroeconomics
  "C71924100",  // Microeconomics
  "C187736073", // Finance
  "C17354064",  // Public policy
  "C144133560", // Business
  "C127413603", // Engineering economics / industrial economics
  "C142362112", // Social science
  "C2986936954",// Game theory
  "C121332964", // Statistics
  "C41008148",  // Computer science (for AI/ML × economics)
];

// ═══════════════════════════════════════════════════════════════════════════
// PAPER PROCESSING
// ═══════════════════════════════════════════════════════════════════════════

function processArxivWork(work: Record<string, unknown>): Paper | null {
  const title = work.title as string | undefined;
  if (!title) return null;

  const abstract = reconstructAbstract(
    work.abstract_inverted_index as Record<string, number[]> | undefined
  );
  if (!abstract || abstract.length < 80) return null;

  // Authors
  const authors: string[] = [];
  const authorships = (work.authorships as Array<{ author?: { display_name?: string } }>) || [];
  for (const a of authorships.slice(0, 10)) {
    if (a.author?.display_name) authors.push(a.author.display_name);
  }

  // Institutions (first from each authorship, unique, max 3)
  const institutions: string[] = [];
  for (const a of authorships.slice(0, 5)) {
    const insts = (a as { institutions?: Array<{ display_name?: string }> }).institutions || [];
    for (const inst of insts.slice(0, 1)) {
      if (inst.display_name && !institutions.includes(inst.display_name)) {
        institutions.push(inst.display_name);
      }
    }
  }

  // Concepts (score > 0.2, max 8)
  const rawConcepts = (work.concepts as Array<{ display_name?: string; score?: number }>) || [];
  const concepts = rawConcepts
    .filter((c) => (c.score ?? 0) > 0.2)
    .slice(0, 8)
    .map((c) => ({ name: c.display_name ?? "", score: Math.round((c.score ?? 0) * 100) / 100 }));

  // Open access
  const oa = (work.open_access as { is_oa?: boolean; oa_url?: string }) || {};
  const isOpenAccess = oa.is_oa ?? false;
  const oaUrl = oa.oa_url;

  // DOI
  const doi = work.doi as string | undefined;
  const doiUrl = doi
    ? `https://doi.org/${doi.replace("https://doi.org/", "")}`
    : undefined;

  // arXiv URL from primary location if available
  const primaryLocation = work.primary_location as {
    landing_page_url?: string;
    source?: { display_name?: string };
  } | undefined;
  const landingUrl = primaryLocation?.landing_page_url;

  return {
    id: ((work.id as string) || "").replace("https://openalex.org/", ""),
    doi: doi || undefined,
    doi_url: doiUrl,
    title,
    authors,
    institutions: institutions.slice(0, 3),
    abstract,
    journal: "arXiv Preprints",
    journal_tier: 2,
    journal_field: "arxiv",
    publication_date: (work.publication_date as string) || "",
    concepts,
    cited_by_count: (work.cited_by_count as number) || 0,
    is_open_access: isOpenAccess,
    oa_url: oaUrl ?? landingUrl,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FETCHER
// ═══════════════════════════════════════════════════════════════════════════

export interface FetchArxivOptions {
  daysBack?: number;
  maxResults?: number;
  /** If provided, restrict to papers that have at least one matching concept */
  fieldConceptIds?: string[];
}

/**
 * Fetch recent arXiv preprints via OpenAlex, filtered to social-science topics.
 */
export async function fetchArxivPapers(options: FetchArxivOptions = {}): Promise<Paper[]> {
  const {
    daysBack = 30,
    maxResults = 50,
    fieldConceptIds = FIELD_CONCEPT_IDS,
  } = options;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  const fromDate = startDate.toISOString().split("T")[0];
  const toDate = endDate.toISOString().split("T")[0];

  const conceptFilter = fieldConceptIds.slice(0, 15).join("|");

  const params = new URLSearchParams({
    filter: [
      `primary_location.source.id:${ARXIV_SOURCE_ID}`,
      `from_publication_date:${fromDate}`,
      `to_publication_date:${toDate}`,
      `concepts.id:${conceptFilter}`,
    ].join(","),
    per_page: String(Math.min(maxResults, 50)),
    select: [
      "id", "doi", "title", "authorships", "publication_date",
      "primary_location", "abstract_inverted_index", "concepts",
      "cited_by_count", "open_access",
    ].join(","),
    sort: "publication_date:desc",
    mailto: POLITE_EMAIL,
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(`${OPENALEX_WORKS_URL}?${params}`, {
      signal: controller.signal,
      headers: { "User-Agent": `Verso/1.0 (mailto:${POLITE_EMAIL})` },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`arXiv fetch failed: HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    const works = (data.results as Record<string, unknown>[]) || [];

    const papers: Paper[] = [];
    const seenIds = new Set<string>();

    for (const work of works) {
      const paper = processArxivWork(work);
      if (paper && !seenIds.has(paper.id)) {
        seenIds.add(paper.id);
        papers.push(paper);
        if (papers.length >= maxResults) break;
      }
    }

    return papers;
  } catch (error) {
    console.warn("arXiv fetch error:", error instanceof Error ? error.message : error);
    return [];
  }
}
