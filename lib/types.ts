// ═══════════════════════════════════════════════════════════════════════════
// CORE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Journal {
  name: string;
  issn: string;
  field: "economics" | "polisci";
  tier: 1 | 2 | 3;
}

export interface Concept {
  name: string;
  score: number;
}

export interface Paper {
  id: string;
  doi?: string;
  doi_url?: string;
  title: string;
  authors: string[];
  institutions: string[];
  abstract: string;
  journal: string;
  journal_tier: number;
  publication_date: string;
  concepts: Concept[];
  cited_by_count: number;
  is_open_access: boolean;
  oa_url?: string;
}

export interface ScoredPaper extends Paper {
  relevance_score: number;
  matched_interests: string[];
  matched_methods: string[];
  match_explanation: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// USER PROFILE
// ═══════════════════════════════════════════════════════════════════════════

export interface UserProfile {
  name: string;
  academic_level: string;
  primary_field: string;
  interests: string[];
  methods: string[];
  region: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// API TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface FetchPapersParams {
  days_back: number;
  selected_journals: string[];
  max_results?: number;
}

export interface FetchPapersResponse {
  papers: Paper[];
  count: number;
  error?: string;
}

export interface ProcessPapersParams {
  profile: UserProfile;
  papers: Paper[];
}

export interface ProcessPapersResponse {
  papers: ScoredPaper[];
  summary: string;
  high_relevance_count: number;
}

export interface JournalOptions {
  economics: {
    tier1: string[];
    tier2: string[];
    tier3: string[];
  };
  polisci: {
    tier1: string[];
    tier2: string[];
    tier3: string[];
  };
}

export interface ProfileOptions {
  academic_levels: string[];
  primary_fields: string[];
  interests: string[];
  methods: string[];
  regions: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORING TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface KeywordEntry {
  canonical: string;
  synonyms: string[];
  weight: number;
}

export interface MatchScore {
  total: number;
  concept_score: number;
  keyword_score: number;
  method_score: number;
  quality_score: number;
  matched_interests: string[];
  matched_methods: string[];
  explanation: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// OPENALEX API TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface OpenAlexWork {
  id: string;
  doi?: string;
  title?: string;
  authorships?: OpenAlexAuthorship[];
  publication_date?: string;
  primary_location?: {
    source?: {
      display_name?: string;
      issn?: string[];
    };
  };
  abstract_inverted_index?: Record<string, number[]>;
  concepts?: OpenAlexConcept[];
  cited_by_count?: number;
  open_access?: {
    is_oa?: boolean;
    oa_url?: string;
  };
  type?: string;
}

export interface OpenAlexAuthorship {
  author?: {
    display_name?: string;
  };
  institutions?: {
    display_name?: string;
  }[];
}

export interface OpenAlexConcept {
  display_name?: string;
  score?: number;
}

export interface OpenAlexResponse {
  results: OpenAlexWork[];
  meta?: {
    count?: number;
    next_cursor?: string;
  };
}
