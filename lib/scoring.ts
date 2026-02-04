/**
 * Relevance Scoring Engine for Econvery (v3 - Semantic)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * DESIGN PHILOSOPHY: SEMANTIC UNDERSTANDING
 * -----------------------------------------
 * This scoring system is built on three principles:
 * 
 * 1. PAPER-FIRST ANALYSIS
 *    We analyze each paper to understand what it IS, independent of what the
 *    user wants. The paper's identity doesn't change based on who's reading.
 *    
 * 2. SEMANTIC EXPANSION
 *    User interests are expanded using our knowledge taxonomy:
 *    - "Causal Inference" includes DiD, RDD, IV, RCT, etc.
 *    - "Inequality" relates to mobility, poverty, education, etc.
 *    
 * 3. AFFINITY MATCHING
 *    We match based on intellectual affinity, not keyword coincidence.
 *    A paper can be highly relevant without containing the user's exact words.
 * 
 * SCORING COMPONENTS
 * ------------------
 * 1. QUALITY BASELINE (3.0 - 5.0)
 *    Every paper starts with a score based on journal tier and citations.
 *    
 * 2. TOPIC AFFINITY (0 - 2.5)
 *    How well do the paper's topics align with the user's interests?
 *    - Direct matches (user interest = paper topic): Full credit
 *    - Related topics (connected in taxonomy): Partial credit
 *    - Adjacent topics (one step removed): Small credit
 *    
 * 3. METHOD AFFINITY (0 - 1.5)
 *    How well do the paper's methods align with the user's preferences?
 *    - Matching paradigm (e.g., both causal identification): Full credit
 *    - Related methods (e.g., DiD when interested in RDD): Partial credit
 *    
 * 4. DISCOVERY BONUS (0 - 1.0)
 *    For high-quality papers slightly outside direct interests, to encourage
 *    intellectual exploration.
 * 
 * SCORE INTERPRETATION
 * --------------------
 * - 8.0-10.0: Excellent match — strong relevance + high quality
 * - 6.5-7.9:  Very relevant — good fit on topic or method
 * - 5.0-6.4:  Relevant — worth considering
 * - 4.0-4.9:  Tangentially related — quality paper, different focus
 * - 1.0-3.9:  Low relevance — probably not what you're looking for
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
  getMethodFamily
} from "./taxonomy";

// ═══════════════════════════════════════════════════════════════════════════
// USER PROFILE EXPANSION
// ═══════════════════════════════════════════════════════════════════════════

interface ExpandedUserProfile {
  // Direct interests (what user explicitly selected)
  directTopicIds: Set<string>;
  
  // Expanded interests (includes related topics from taxonomy)
  expandedTopicIds: Set<string>;
  
  // Adjacent interests (for discovery, one more step removed)
  adjacentTopicIds: Set<string>;
  
  // Method preferences
  directMethodIds: Set<string>;
  expandedMethodIds: Set<string>;
  
  // Profile characteristics
  isGeneralist: boolean;
  hasInterests: boolean;
  hasMethods: boolean;
  discoveryWeight: number;  // How much to value adjacent content (0-1)
}

function expandUserProfile(profile: UserProfile): ExpandedUserProfile {
  const directTopicIds = new Set<string>();
  const expandedTopicIds = new Set<string>();
  const adjacentTopicIds = new Set<string>();
  const directMethodIds = new Set<string>();
  const expandedMethodIds = new Set<string>();
  
  // Expand interests
  const interests = profile.interests || [];
  for (const interest of interests) {
    const taxonomyIds = INTEREST_TO_TAXONOMY[interest];
    if (taxonomyIds) {
      for (const id of taxonomyIds) {
        directTopicIds.add(id);
        expandedTopicIds.add(id);
        
        // Get related and adjacent topics
        const neighborhood = getTopicNeighborhood(id, 1);
        neighborhood.direct.forEach(t => expandedTopicIds.add(t));
        neighborhood.adjacent.forEach(t => adjacentTopicIds.add(t));
      }
    }
  }
  
  // Remove direct/expanded topics from adjacent
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
        
        // Get method family
        const family = getMethodFamily(id);
        family.forEach(m => expandedMethodIds.add(m));
      }
    }
  }
  
  // Determine if user is a generalist
  const isGeneralist = 
    isGeneralistField(profile.primary_field || "") ||
    isGeneralistLevel(profile.academic_level || "") ||
    profile.experience_type === "generalist" ||
    profile.experience_type === "explorer" ||
    interests.length === 0;
  
  // Discovery weight: generalists explore more, specialists focus more
  let discoveryWeight = 0.3;  // Default
  if (isGeneralist) discoveryWeight = 0.5;
  if (interests.length > 3) discoveryWeight = 0.2;  // Very focused user
  
  return {
    directTopicIds,
    expandedTopicIds,
    adjacentTopicIds,
    directMethodIds,
    expandedMethodIds,
    isGeneralist,
    hasInterests: interests.length > 0,
    hasMethods: methods.length > 0,
    discoveryWeight
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// AFFINITY SCORING
// ═══════════════════════════════════════════════════════════════════════════

interface TopicAffinityResult {
  score: number;          // 0-1
  matchedTopics: string[];  // Human-readable names for display
  matchType: "direct" | "related" | "adjacent" | "none";
}

function calculateTopicAffinity(
  paperProfile: PaperProfile,
  userProfile: ExpandedUserProfile
): TopicAffinityResult {
  // If user has no interests, return neutral score
  if (!userProfile.hasInterests) {
    // Return paper's own topics for display
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
      // Direct match: user explicitly selected this topic
      directMatchScore += confidenceWeight;
      matchedTopics.push(topic.name);
    } else if (userProfile.expandedTopicIds.has(topic.id)) {
      // Related: topic is connected to user's interests
      relatedMatchScore += confidenceWeight * 0.7;
      if (topic.confidence !== "low") {
        matchedTopics.push(topic.name);
      }
    } else if (userProfile.adjacentTopicIds.has(topic.id)) {
      // Adjacent: one step further from user's interests
      adjacentMatchScore += confidenceWeight * 0.4;
    }
  }
  
  // Normalize scores (cap at 1.0)
  directMatchScore = Math.min(1.0, directMatchScore);
  relatedMatchScore = Math.min(0.8, relatedMatchScore);
  adjacentMatchScore = Math.min(0.5, adjacentMatchScore);
  
  // Combined score prioritizes direct matches
  let score = directMatchScore * 0.5 + relatedMatchScore * 0.3 + adjacentMatchScore * 0.2;
  
  // Determine match type for explanation
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
  // If user has no method preferences, return neutral
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
      // Direct match
      directMatchScore += confidenceWeight;
      matchedMethods.push(method.name);
    } else if (userProfile.expandedMethodIds.has(method.id)) {
      // Family match (e.g., user likes DiD, paper uses event study)
      familyMatchScore += confidenceWeight * 0.6;
      if (method.confidence !== "low") {
        matchedMethods.push(method.name);
      }
    }
  }
  
  // Normalize
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

function calculateQualityBaseline(paper: Paper, paperProfile: PaperProfile): number {
  // Base: 3.0
  // Quality adds up to 2.0
  // Result: 3.0 to 5.0
  
  const qualityBonus = paperProfile.qualityScore * 2.0;
  return 3.0 + qualityBonus;
}

// ═══════════════════════════════════════════════════════════════════════════
// DISCOVERY SCORING
// ═══════════════════════════════════════════════════════════════════════════

function calculateDiscoveryBonus(
  paperProfile: PaperProfile,
  topicAffinity: TopicAffinityResult,
  userProfile: ExpandedUserProfile
): number {
  // Discovery bonus for high-quality papers that are slightly outside
  // direct interests but might expand the user's horizons
  
  if (!userProfile.hasInterests) {
    // Generalists: quality IS the discovery
    return paperProfile.qualityScore * userProfile.discoveryWeight * 0.5;
  }
  
  // Only give discovery bonus if paper is NOT a direct match
  // but IS high quality
  if (topicAffinity.matchType === "direct") return 0;
  if (paperProfile.qualityScore < 0.6) return 0;
  
  // Higher bonus for adjacent matches (intellectual expansion)
  const adjacentBonus = topicAffinity.matchType === "adjacent" ? 0.3 : 0;
  const qualityBonus = (paperProfile.qualityScore - 0.6) * 1.5;  // 0 to 0.6
  
  return (adjacentBonus + qualityBonus) * userProfile.discoveryWeight;
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
  
  // Topic relevance
  if (topicResult.matchedTopics.length > 0 && topicResult.matchType !== "none") {
    parts.push(topicResult.matchedTopics.slice(0, 2).join(", "));
  }
  
  // Method match (only if user has method preferences)
  if (userProfile.hasMethods && methodResult.paradigmMatch && methodResult.matchedMethods.length > 0) {
    parts.push(methodResult.matchedMethods[0]);
  }
  
  // Quality signals
  const tier = paper.journal_tier || 4;
  if (tier === 1) parts.push("Top journal");
  else if (tier === 2 && parts.length < 2) parts.push("Top field journal");
  
  // Paper type (for users who might care)
  if (parts.length < 2) {
    if (paperProfile.isReview) parts.push("Review");
    else if (paperProfile.isTheoretical) parts.push("Theoretical");
  }
  
  // Default for generalists or no matches
  if (parts.length === 0) {
    if (userProfile.isGeneralist) {
      // Show paper's own identity
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
// MAIN SCORING ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export class RelevanceScorer {
  private userProfile: ExpandedUserProfile;
  private rawProfile: UserProfile;
  
  constructor(profile: UserProfile) {
    this.rawProfile = profile;
    
    // Ensure arrays exist
    if (!profile.interests) profile.interests = [];
    if (!profile.methods) profile.methods = [];
    if (!profile.selected_adjacent_fields) profile.selected_adjacent_fields = [];
    
    this.userProfile = expandUserProfile(profile);
  }
  
  public scorePaper(paper: Paper): MatchScore {
    // ─────────────────────────────────────────────────────────────────────
    // 1. ANALYZE PAPER (independent of user)
    // ─────────────────────────────────────────────────────────────────────
    const paperProfile = analyzePaper(paper);
    
    // ─────────────────────────────────────────────────────────────────────
    // 2. CALCULATE AFFINITY SCORES
    // ─────────────────────────────────────────────────────────────────────
    const topicResult = calculateTopicAffinity(paperProfile, this.userProfile);
    const methodResult = calculateMethodAffinity(paperProfile, this.userProfile);
    
    // ─────────────────────────────────────────────────────────────────────
    // 3. CALCULATE SCORE COMPONENTS
    // ─────────────────────────────────────────────────────────────────────
    
    // Baseline: 3.0 - 5.0 (quality floor)
    const baselineScore = calculateQualityBaseline(paper, paperProfile);
    
    // Topic bonus: 0 - 2.5
    const topicBonus = this.userProfile.hasInterests
      ? topicResult.score * 2.5
      : topicResult.score * 0.5;  // Small bonus for generalists
    
    // Method bonus: 0 - 1.5
    const methodBonus = this.userProfile.hasMethods
      ? methodResult.score * 1.5
      : methodResult.score * 0.3;  // Small bonus for generalists
    
    // Discovery bonus: 0 - 1.0
    const discoveryBonus = calculateDiscoveryBonus(
      paperProfile, 
      topicResult, 
      this.userProfile
    );
    
    // ─────────────────────────────────────────────────────────────────────
    // 4. FIELD MODIFIER
    // ─────────────────────────────────────────────────────────────────────
    let fieldModifier = 1.0;
    let isAdjacent = false;
    
    if (paper.journal_field && isAdjacentField(paper.journal_field)) {
      isAdjacent = true;
      const selectedAdjacent = this.rawProfile.selected_adjacent_fields || [];
      if (this.rawProfile.include_adjacent_fields && selectedAdjacent.includes(paper.journal_field)) {
        fieldModifier = 0.95;  // Small penalty for explicitly selected
      } else {
        fieldModifier = 0.8;   // Moderate penalty for unselected adjacent
      }
    }
    
    // ─────────────────────────────────────────────────────────────────────
    // 5. FINAL SCORE
    // ─────────────────────────────────────────────────────────────────────
    let rawScore = baselineScore + topicBonus + methodBonus + discoveryBonus;
    rawScore *= fieldModifier;
    
    // Clamp to 1-10
    const finalScore = Math.max(1.0, Math.min(10.0, rawScore));
    
    // ─────────────────────────────────────────────────────────────────────
    // 6. BUILD EXPLANATION
    // ─────────────────────────────────────────────────────────────────────
    const explanation = buildExplanation(
      paperProfile,
      topicResult,
      methodResult,
      paper,
      this.userProfile
    );
    
    // ─────────────────────────────────────────────────────────────────────
    // 7. DETERMINE DISPLAY TAGS
    // ─────────────────────────────────────────────────────────────────────
    // Only show topics/methods that we're confident about AND that matter to user
    const displayTopics = topicResult.matchedTopics;
    const displayMethods = methodResult.matchedMethods;
    
    return {
      total: Math.round(finalScore * 10) / 10,
      baseline_score: Math.round(baselineScore * 100) / 100,
      concept_score: Math.round(topicResult.score * 1000) / 1000,
      keyword_score: 0,  // Deprecated
      method_score: Math.round(methodResult.score * 1000) / 1000,
      quality_score: Math.round(paperProfile.qualityScore * 1000) / 1000,
      field_relevance_score: Math.round(fieldModifier * 1000) / 1000,
      matched_interests: displayTopics,
      matched_methods: displayMethods,
      matched_topics: paperProfile.topics
        .filter(t => t.confidence !== "low")
        .slice(0, 3)
        .map(t => t.name),
      explanation,
      is_adjacent_field: isAdjacent,
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
    };
  });

  // Sort by relevance score (highest first)
  results.sort((a, b) => b.relevance_score - a.relevance_score);

  const high = results.filter((p) => p.relevance_score >= 6.5).length;
  const total = papers.length;
  
  // Dynamic summary
  const hasInterests = (profile.interests || []).length > 0;
  const summaryPrefix = hasInterests ? "Analyzed" : "Showing quality research:";
  
  const summary = `${summaryPrefix} ${total} papers · ${high} highly relevant`;

  return { papers: results, summary };
}

// Helper to create a default profile
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
  };
}
