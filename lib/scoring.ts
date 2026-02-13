/**
 * Relevance Scoring Engine for Econvery (v4 — Exploration-Aware)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * KEY CHANGE FROM v3:
 * Scoring weights are now modulated by an exploration_level (0–1) slider.
 * 
 * NARROW (0.0): Topic & method affinity dominate. Discovery is minimal.
 *   → Best for: "I know exactly what I want, don't waste my time"
 * 
 * BALANCED (0.5): Equal weight to match quality and discovery.
 *   → Best for: "Show me relevant papers but surprise me sometimes"
 * 
 * EXPLORATORY (1.0): Quality and field adjacency dominate.
 *   → Best for: "I want to see what's exciting across fields"
 * 
 * SCORING COMPONENTS (weights vary with exploration_level):
 * 1. QUALITY BASELINE (3.0–5.5): Journal tier + citation signals
 * 2. TOPIC AFFINITY (0–3.0 narrow, 0–1.0 exploratory)
 * 3. METHOD AFFINITY (0–1.5 narrow, 0–0.5 exploratory)
 * 4. DISCOVERY BONUS (0–0.5 narrow, 0–3.0 exploratory)
 * 5. FIELD AFFINITY (0–1.0): Cross-field relevance via affinity map
 */

import type { MatchScore, Paper, ScoredPaper, UserProfile, JournalField } from "./types";
import { isAdjacentField } from "./journals";
import { isGeneralistField, isGeneralistLevel } from "./profile-options";
import { 
  analyzePaper, 
  getMethodTags, 
  getTopicTags,
  type PaperProfile,
  type DetectedMethod,
  type DetectedTopic
} from "./paper-analyzer";
import {
  INTEREST_TO_TAXONOMY,
  METHOD_TO_TAXONOMY,
  METHOD_TAXONOMY,
  TOPIC_TAXONOMY,
  getTopicNeighborhood,
  getMethodFamily,
  getFieldAffinity,
} from "./taxonomy";

// ═══════════════════════════════════════════════════════════════════════════
// EXPLORATION-AWARE WEIGHTS
// ═══════════════════════════════════════════════════════════════════════════

interface ScoringWeights {
  topicMax: number;
  methodMax: number;
  discoveryMax: number;
  fieldAffinityMax: number;
  qualityBaselineMax: number;
  directHopWeight: number;     // Confidence weight for related topics
  adjacentHopWeight: number;   // Confidence weight for adjacent topics
}

function getWeights(explorationLevel: number): ScoringWeights {
  // Interpolate between narrow and exploratory
  const e = Math.max(0, Math.min(1, explorationLevel));
  return {
    topicMax:          3.0 - e * 2.0,      // 3.0 → 1.0
    methodMax:         1.5 - e * 1.0,      // 1.5 → 0.5
    discoveryMax:      0.5 + e * 2.5,      // 0.5 → 3.0
    fieldAffinityMax:  0.0 + e * 1.0,      // 0.0 → 1.0
    qualityBaselineMax: 5.0 + e * 0.5,     // 5.0 → 5.5
    directHopWeight:   0.8 - e * 0.1,      // 0.8 → 0.7 (gentler penalty for related)
    adjacentHopWeight: 0.4 + e * 0.2,      // 0.4 → 0.6 (much gentler in explore mode)
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// USER PROFILE EXPANSION
// ═══════════════════════════════════════════════════════════════════════════

interface ExpandedUserProfile {
  directTopicIds: Set<string>;
  expandedTopicIds: Set<string>;
  adjacentTopicIds: Set<string>;
  directMethodIds: Set<string>;
  expandedMethodIds: Set<string>;
  isGeneralist: boolean;
  hasInterests: boolean;
  hasMethods: boolean;
  explorationLevel: number;
  primaryField: string;
}

function expandUserProfile(profile: UserProfile): ExpandedUserProfile {
  const directTopicIds = new Set<string>();
  const expandedTopicIds = new Set<string>();
  const adjacentTopicIds = new Set<string>();
  const directMethodIds = new Set<string>();
  const expandedMethodIds = new Set<string>();
  
  const explorationLevel = profile.exploration_level ?? 0.5;
  
  // Variable-depth expansion based on exploration level
  const directDepth = explorationLevel > 0.7 ? 2 : 1;
  const adjacentDepth = Math.round(1 + explorationLevel * 2); // 1 to 3
  
  // Expand interests
  const interests = profile.interests || [];
  for (const interest of interests) {
    const taxonomyIds = INTEREST_TO_TAXONOMY[interest];
    if (taxonomyIds) {
      for (const id of taxonomyIds) {
        directTopicIds.add(id);
        expandedTopicIds.add(id);
        
        const neighborhood = getTopicNeighborhood(id, directDepth);
        neighborhood.direct.forEach(t => expandedTopicIds.add(t));
        
        const widerNeighborhood = getTopicNeighborhood(id, adjacentDepth);
        widerNeighborhood.adjacent.forEach(t => adjacentTopicIds.add(t));
      }
    }
  }
  
  // Clean up overlap
  directTopicIds.forEach(t => adjacentTopicIds.delete(t));
  expandedTopicIds.forEach(t => adjacentTopicIds.delete(t));
  
  // Expand methods
  const methods = profile.methods || [];
  for (const method of methods) {
    const taxonomyIds = METHOD_TO_TAXONOMY[method];
    if (taxonomyIds) {
      for (const id of taxonomyIds) {
        directMethodIds.add(id);
        expandedMethodIds.add(id);
        const family = getMethodFamily(id);
        family.forEach(m => expandedMethodIds.add(m));
      }
    }
  }
  
  const isGeneralist = 
    isGeneralistField(profile.primary_field || "") ||
    isGeneralistLevel(profile.academic_level || "") ||
    profile.experience_type === "generalist" ||
    profile.experience_type === "explorer" ||
    interests.length === 0;
  
  return {
    directTopicIds,
    expandedTopicIds,
    adjacentTopicIds,
    directMethodIds,
    expandedMethodIds,
    isGeneralist,
    hasInterests: interests.length > 0,
    hasMethods: methods.length > 0,
    explorationLevel,
    primaryField: profile.primary_field || "",
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// AFFINITY SCORING
// ═══════════════════════════════════════════════════════════════════════════

interface TopicAffinityResult {
  score: number;
  matchedTopics: string[];
  matchType: "direct" | "related" | "adjacent" | "none";
}

function calculateTopicAffinity(
  paperProfile: PaperProfile,
  userProfile: ExpandedUserProfile,
  weights: ScoringWeights
): TopicAffinityResult {
  if (!userProfile.hasInterests) {
    return {
      score: 0.5,
      matchedTopics: paperProfile.topics
        .filter(t => t.confidence === "high")
        .slice(0, 2)
        .map(t => t.name),
      matchType: "none"
    };
  }
  
  const matchedTopics: string[] = [];
  let directMatchScore = 0;
  let relatedMatchScore = 0;
  let adjacentMatchScore = 0;
  
  for (const topic of paperProfile.topics) {
    const confidenceWeight = 
      topic.confidence === "high" ? 1.0 :
      topic.confidence === "medium" ? 0.7 : 0.4;
    
    if (userProfile.directTopicIds.has(topic.id)) {
      directMatchScore += confidenceWeight;
      matchedTopics.push(topic.name);
    } else if (userProfile.expandedTopicIds.has(topic.id)) {
      relatedMatchScore += confidenceWeight * weights.directHopWeight;
      if (topic.confidence !== "low") {
        matchedTopics.push(topic.name);
      }
    } else if (userProfile.adjacentTopicIds.has(topic.id)) {
      adjacentMatchScore += confidenceWeight * weights.adjacentHopWeight;
    }
  }
  
  directMatchScore = Math.min(1.0, directMatchScore);
  relatedMatchScore = Math.min(0.85, relatedMatchScore);
  adjacentMatchScore = Math.min(0.6, adjacentMatchScore);
  
  let score = directMatchScore * 0.5 + relatedMatchScore * 0.3 + adjacentMatchScore * 0.2;
  
  let matchType: "direct" | "related" | "adjacent" | "none" = "none";
  if (directMatchScore > 0.3) matchType = "direct";
  else if (relatedMatchScore > 0.3) matchType = "related";
  else if (adjacentMatchScore > 0.2) matchType = "adjacent";
  
  return {
    score: Math.min(1.0, score),
    matchedTopics: matchedTopics.slice(0, 3),
    matchType
  };
}

interface MethodAffinityResult {
  score: number;
  matchedMethods: string[];
  paradigmMatch: boolean;
}

function calculateMethodAffinity(
  paperProfile: PaperProfile,
  userProfile: ExpandedUserProfile
): MethodAffinityResult {
  if (!userProfile.hasMethods) {
    return {
      score: 0.5,
      matchedMethods: getMethodTags(paperProfile),
      paradigmMatch: false
    };
  }
  
  const matchedMethods: string[] = [];
  let directMatchScore = 0;
  let familyMatchScore = 0;
  
  for (const method of paperProfile.methods) {
    const confidenceWeight = 
      method.confidence === "high" ? 1.0 :
      method.confidence === "medium" ? 0.6 : 0.3;
    
    if (userProfile.directMethodIds.has(method.id)) {
      directMatchScore += confidenceWeight;
      matchedMethods.push(method.name);
    } else if (userProfile.expandedMethodIds.has(method.id)) {
      familyMatchScore += confidenceWeight * 0.6;
      if (method.confidence !== "low") {
        matchedMethods.push(method.name);
      }
    }
  }
  
  directMatchScore = Math.min(1.0, directMatchScore);
  familyMatchScore = Math.min(0.7, familyMatchScore);
  
  const score = directMatchScore * 0.6 + familyMatchScore * 0.4;
  const paradigmMatch = directMatchScore > 0.4 || familyMatchScore > 0.3;
  
  return {
    score: Math.min(1.0, score),
    matchedMethods: matchedMethods.slice(0, 2),
    paradigmMatch
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// QUALITY SCORING
// ═══════════════════════════════════════════════════════════════════════════

function calculateQualityBaseline(paper: Paper, paperProfile: PaperProfile, maxBaseline: number): number {
  const qualityBonus = paperProfile.qualityScore * (maxBaseline - 3.0);
  return 3.0 + qualityBonus;
}

// ═══════════════════════════════════════════════════════════════════════════
// DISCOVERY SCORING (exploration-aware)
// ═══════════════════════════════════════════════════════════════════════════

function calculateDiscoveryBonus(
  paperProfile: PaperProfile,
  topicAffinity: TopicAffinityResult,
  userProfile: ExpandedUserProfile,
  paper: Paper,
  weights: ScoringWeights
): number {
  if (!userProfile.hasInterests) {
    // Generalists: quality IS discovery
    return paperProfile.qualityScore * weights.discoveryMax * 0.5;
  }
  
  // Direct matches don't get discovery bonus
  if (topicAffinity.matchType === "direct") return 0;
  
  // Low quality papers don't get discovery bonus
  if (paperProfile.qualityScore < 0.5) return 0;
  
  // Calculate components
  const adjacentBonus = topicAffinity.matchType === "adjacent" ? 0.4 : 0.15;
  const qualityBonus = (paperProfile.qualityScore - 0.5) * 1.5;  // 0 to 0.75
  
  // Field affinity bonus: papers from intellectually related fields score higher
  let fieldAffinityBonus = 0;
  if (userProfile.primaryField && !isGeneralistField(userProfile.primaryField)) {
    // Get how close this paper's field is to the user's primary field
    const paperField = paper.journal_field || "";
    // Map journal_field to a user-facing field name for lookup
    const fieldNameMap: Record<string, string> = {
      "economics": "Microeconomics",
      "polisci": "Political Economy",
      "psychology": "Psychology (Behavioral/Social)",
      "sociology": "Sociology",
      "management": "Management / Organization Studies",
    };
    const mappedField = fieldNameMap[paperField] || "";
    if (mappedField && mappedField !== userProfile.primaryField) {
      const affinity = getFieldAffinity(userProfile.primaryField, mappedField);
      fieldAffinityBonus = affinity * weights.fieldAffinityMax;
    }
  }
  
  const rawBonus = (adjacentBonus + qualityBonus) * weights.discoveryMax / 3.0 + fieldAffinityBonus;
  return Math.min(weights.discoveryMax, rawBonus);
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPLANATION BUILDER
// ═══════════════════════════════════════════════════════════════════════════

function buildExplanation(
  paperProfile: PaperProfile,
  topicResult: TopicAffinityResult,
  methodResult: MethodAffinityResult,
  paper: Paper,
  userProfile: ExpandedUserProfile
): string {
  const parts: string[] = [];
  
  if (topicResult.matchedTopics.length > 0 && topicResult.matchType !== "none") {
    parts.push(topicResult.matchedTopics.slice(0, 2).join(", "));
  }
  
  if (userProfile.hasMethods && methodResult.paradigmMatch && methodResult.matchedMethods.length > 0) {
    parts.push(methodResult.matchedMethods[0]);
  }
  
  const tier = paper.journal_tier || 4;
  if (tier === 1) parts.push("Top journal");
  else if (tier === 2 && parts.length < 2) parts.push("Top field journal");
  
  if (parts.length < 2) {
    if (paperProfile.isReview) parts.push("Review");
    else if (paperProfile.isTheoretical) parts.push("Theoretical");
  }
  
  if (parts.length === 0) {
    if (userProfile.isGeneralist) {
      const topicTags = getTopicTags(paperProfile);
      if (topicTags.length > 0) {
        return topicTags.slice(0, 2).join(", ");
      }
      return "Recent research";
    }
    return "Related research";
  }
  
  return parts.join(" · ");
}

// ═══════════════════════════════════════════════════════════════════════════
// MATCH TIER CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════

function classifyMatchTier(score: number): "core" | "explore" | "discovery" {
  if (score >= 7.0) return "core";
  if (score >= 5.0) return "explore";
  return "discovery";
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SCORING ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export class RelevanceScorer {
  private userProfile: ExpandedUserProfile;
  private rawProfile: UserProfile;
  private weights: ScoringWeights;
  
  constructor(profile: UserProfile) {
    this.rawProfile = profile;
    
    if (!profile.interests) profile.interests = [];
    if (!profile.methods) profile.methods = [];
    if (!profile.selected_adjacent_fields) profile.selected_adjacent_fields = [];
    if (profile.exploration_level === undefined) profile.exploration_level = 0.5;
    
    this.userProfile = expandUserProfile(profile);
    this.weights = getWeights(this.userProfile.explorationLevel);
  }
  
  public scorePaper(paper: Paper): MatchScore {
    // 1. ANALYZE PAPER (independent of user)
    const paperProfile = analyzePaper(paper);
    
    // 2. CALCULATE AFFINITY SCORES
    const topicResult = calculateTopicAffinity(paperProfile, this.userProfile, this.weights);
    const methodResult = calculateMethodAffinity(paperProfile, this.userProfile);
    
    // 3. CALCULATE SCORE COMPONENTS
    const baselineScore = calculateQualityBaseline(paper, paperProfile, this.weights.qualityBaselineMax);
    
    const topicBonus = this.userProfile.hasInterests
      ? topicResult.score * this.weights.topicMax
      : topicResult.score * 0.5;
    
    const methodBonus = this.userProfile.hasMethods
      ? methodResult.score * this.weights.methodMax
      : methodResult.score * 0.3;
    
    const discoveryBonus = calculateDiscoveryBonus(
      paperProfile, topicResult, this.userProfile, paper, this.weights
    );
    
    // 4. FIELD MODIFIER
    let fieldModifier = 1.0;
    let isAdjacent = false;
    
    if (paper.journal_field && isAdjacentField(paper.journal_field)) {
      isAdjacent = true;
      const selectedAdjacent = this.rawProfile.selected_adjacent_fields || [];
      if (this.rawProfile.include_adjacent_fields && selectedAdjacent.includes(paper.journal_field)) {
        fieldModifier = 0.95;
      } else {
        // In exploratory mode, adjacent field penalty is softer
        fieldModifier = 0.8 + this.userProfile.explorationLevel * 0.1; // 0.8 → 0.9
      }
    }
    
    // 5. FINAL SCORE
    let rawScore = baselineScore + topicBonus + methodBonus + discoveryBonus;
    rawScore *= fieldModifier;
    
    const finalScore = Math.max(1.0, Math.min(10.0, rawScore));
    
    // 6. BUILD EXPLANATION
    const explanation = buildExplanation(
      paperProfile, topicResult, methodResult, paper, this.userProfile
    );
    
    // 7. DISPLAY TAGS
    const displayTopics = topicResult.matchedTopics;
    const displayMethods = methodResult.matchedMethods;
    
    return {
      total: Math.round(finalScore * 10) / 10,
      baseline_score: Math.round(baselineScore * 100) / 100,
      concept_score: Math.round(topicResult.score * 1000) / 1000,
      keyword_score: 0,
      method_score: Math.round(methodResult.score * 1000) / 1000,
      quality_score: Math.round(paperProfile.qualityScore * 1000) / 1000,
      field_relevance_score: Math.round(fieldModifier * 1000) / 1000,
      discovery_score: Math.round(discoveryBonus * 1000) / 1000,
      matched_interests: displayTopics,
      matched_methods: displayMethods,
      matched_topics: paperProfile.topics
        .filter(t => t.confidence !== "low")
        .slice(0, 3)
        .map(t => t.name),
      explanation,
      is_adjacent_field: isAdjacent,
      match_tier: classifyMatchTier(finalScore),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

export function processPapers(
  profile: UserProfile,
  papers: Paper[]
): { papers: ScoredPaper[]; summary: string } {
  if (!papers.length) {
    return { papers: [], summary: "No papers found." };
  }

  const scorer = new RelevanceScorer(profile);

  const results: ScoredPaper[] = papers.map((paper) => {
    const match = scorer.scorePaper(paper);
    return {
      ...paper,
      relevance_score: match.total,
      matched_interests: match.matched_interests,
      matched_methods: match.matched_methods,
      matched_topics: match.matched_topics,
      match_explanation: match.explanation,
      is_adjacent_field: match.is_adjacent_field,
      match_tier: match.match_tier,
    };
  });

  // Sort by relevance score (highest first)
  results.sort((a, b) => b.relevance_score - a.relevance_score);

  // Cap at 50 for presentation
  const capped = results.slice(0, 50);
  
  const core = capped.filter(p => p.match_tier === "core").length;
  const total = capped.length;
  
  const hasInterests = (profile.interests || []).length > 0;
  const summaryPrefix = hasInterests ? "Analyzed" : "Showing quality research:";
  const summary = `${summaryPrefix} ${papers.length} papers · top ${total} shown · ${core} core matches`;

  return { papers: capped, summary };
}

export function createDefaultProfile(name: string): UserProfile {
  return {
    name,
    academic_level: "Curious Learner",
    primary_field: "General Interest (Show me everything)",
    interests: [],
    methods: [],
    region: "Global / No Preference",
    approach_preference: "no_preference",
    experience_type: "explorer",
    include_adjacent_fields: false,
    selected_adjacent_fields: [],
    exploration_level: 0.5,
  };
}
