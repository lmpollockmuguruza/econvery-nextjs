/**
 * Paper Analyzer for Econvery
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This module analyzes papers INDEPENDENTLY of user preferences to determine:
 * 1. What topics the paper is actually about
 * 2. What methods it employs
 * 3. What type of contribution it makes
 * 
 * KEY DESIGN PRINCIPLE:
 * This analysis happens BEFORE we know anything about the user.
 * We're asking "What IS this paper?" not "Does this paper match the user?"
 */

import type { Paper } from "./types";
import { 
  METHOD_TAXONOMY, 
  TOPIC_TAXONOMY,
  type MethodNode,
  type TopicNode 
} from "./taxonomy";

// ═══════════════════════════════════════════════════════════════════════════
// PAPER PROFILE
// ═══════════════════════════════════════════════════════════════════════════

export interface DetectedMethod {
  id: string;
  name: string;
  confidence: "high" | "medium" | "low";
  evidence: string[];  // What signals led to this detection
}

export interface DetectedTopic {
  id: string;
  name: string;
  confidence: "high" | "medium" | "low";
  source: "abstract" | "concepts" | "both";
}

export interface PaperProfile {
  // Core identity
  methods: DetectedMethod[];
  topics: DetectedTopic[];
  
  // Meta-characteristics
  isEmpirical: boolean;
  isTheoretical: boolean;
  isReview: boolean;
  isQuantitative: boolean;
  isQualitative: boolean;
  
  // Quality signals
  qualityScore: number;  // 0-1
  
  // For debugging/transparency
  rawSignals: {
    methodSignals: Map<string, string[]>;
    topicSignals: Map<string, string[]>;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TEXT PROCESSING
// ═══════════════════════════════════════════════════════════════════════════

function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[-–—]/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Check if text contains a term, handling word boundaries
 * to avoid false positives (e.g., "did" shouldn't match inside "individual")
 */
function containsTerm(text: string, term: string): boolean {
  if (!text || !term) return false;
  
  const normalizedText = normalizeText(text);
  const normalizedTerm = normalizeText(term);
  
  // For very short terms (3 chars or less), require word boundaries
  if (normalizedTerm.length <= 3) {
    const regex = new RegExp(`\\b${normalizedTerm}\\b`, 'i');
    return regex.test(normalizedText);
  }
  
  return normalizedText.includes(normalizedTerm);
}

/**
 * Count how many terms from a list appear in the text
 */
function countTermMatches(text: string, terms: string[]): { count: number; matched: string[] } {
  const matched: string[] = [];
  for (const term of terms) {
    if (containsTerm(text, term)) {
      matched.push(term);
    }
  }
  return { count: matched.length, matched };
}

// ═══════════════════════════════════════════════════════════════════════════
// METHOD DETECTION
// ═══════════════════════════════════════════════════════════════════════════

function detectMethods(title: string, abstract: string): {
  methods: DetectedMethod[];
  signals: Map<string, string[]>;
} {
  const text = `${title} ${abstract}`;
  const detectedMethods: DetectedMethod[] = [];
  const signals = new Map<string, string[]>();
  
  for (const [methodId, node] of Object.entries(METHOD_TAXONOMY)) {
    // Check strong signals
    const strongMatch = countTermMatches(text, node.strongSignals);
    const moderateMatch = countTermMatches(text, node.moderateSignals);
    const weakMatch = countTermMatches(text, node.weakSignals);
    
    // Check negative signals (disqualifiers)
    const negativeMatch = node.negativeSignals 
      ? countTermMatches(text, node.negativeSignals)
      : { count: 0, matched: [] };
    
    // Determine confidence based on signal pattern
    let confidence: "high" | "medium" | "low" | null = null;
    const evidence: string[] = [];
    
    if (strongMatch.count >= 2) {
      confidence = "high";
      evidence.push(...strongMatch.matched);
    } else if (strongMatch.count >= 1) {
      // Single strong signal + corroboration
      if (moderateMatch.count >= 1) {
        confidence = "high";
      } else {
        confidence = "medium";
      }
      evidence.push(...strongMatch.matched, ...moderateMatch.matched);
    } else if (moderateMatch.count >= 2) {
      confidence = "medium";
      evidence.push(...moderateMatch.matched);
    } else if (moderateMatch.count >= 1 && weakMatch.count >= 1) {
      confidence = "low";
      evidence.push(...moderateMatch.matched);
    }
    
    // Negative signals reduce confidence or disqualify
    if (negativeMatch.count > 0 && confidence !== "high") {
      if (confidence === "medium") confidence = "low";
      else confidence = null;
    }
    
    if (confidence) {
      detectedMethods.push({
        id: methodId,
        name: node.name,
        confidence,
        evidence: evidence.slice(0, 3)  // Top 3 pieces of evidence
      });
      signals.set(methodId, evidence);
    }
  }
  
  // Sort by confidence (high > medium > low)
  const confidenceOrder = { high: 0, medium: 1, low: 2 };
  detectedMethods.sort((a, b) => confidenceOrder[a.confidence] - confidenceOrder[b.confidence]);
  
  // Deduplicate: if a child method is detected, don't also report parent
  const methodIds = new Set(detectedMethods.map(m => m.id));
  const filteredMethods = detectedMethods.filter(method => {
    const node = METHOD_TAXONOMY[method.id];
    // Keep if no parent, or parent not also detected
    return !node.parent || !methodIds.has(node.parent);
  });
  
  return { methods: filteredMethods, signals };
}

// ═══════════════════════════════════════════════════════════════════════════
// TOPIC DETECTION
// ═══════════════════════════════════════════════════════════════════════════

function detectTopicsFromText(title: string, abstract: string): Map<string, {
  confidence: "high" | "medium" | "low";
  evidence: string[];
}> {
  const text = `${title} ${title} ${abstract}`;  // Title weighted 2x
  const detections = new Map<string, { confidence: "high" | "medium" | "low"; evidence: string[] }>();
  
  for (const [topicId, node] of Object.entries(TOPIC_TAXONOMY)) {
    const strongMatch = countTermMatches(text, node.strongSignals);
    const moderateMatch = countTermMatches(text, node.moderateSignals);
    
    // Handle contextual signals (terms that need corroboration)
    let contextualBonus = 0;
    if (node.contextualSignals) {
      for (const { term, requires } of node.contextualSignals) {
        if (containsTerm(text, term)) {
          const hasContext = requires.some(r => containsTerm(text, r));
          if (hasContext) contextualBonus++;
        }
      }
    }
    
    let confidence: "high" | "medium" | "low" | null = null;
    const evidence: string[] = [];
    
    if (strongMatch.count >= 2) {
      confidence = "high";
      evidence.push(...strongMatch.matched);
    } else if (strongMatch.count >= 1) {
      if (moderateMatch.count >= 1 || contextualBonus > 0) {
        confidence = "high";
      } else {
        confidence = "medium";
      }
      evidence.push(...strongMatch.matched, ...moderateMatch.matched.slice(0, 2));
    } else if (moderateMatch.count >= 3) {
      confidence = "medium";
      evidence.push(...moderateMatch.matched.slice(0, 3));
    } else if (moderateMatch.count >= 2) {
      confidence = "low";
      evidence.push(...moderateMatch.matched);
    }
    
    if (confidence) {
      detections.set(topicId, { confidence, evidence });
    }
  }
  
  return detections;
}

function detectTopicsFromConcepts(concepts: { name: string; score: number }[]): Map<string, {
  confidence: "high" | "medium" | "low";
  score: number;
}> {
  const detections = new Map<string, { confidence: "high" | "medium" | "low"; score: number }>();
  
  for (const concept of concepts) {
    const conceptName = normalizeText(concept.name);
    
    for (const [topicId, node] of Object.entries(TOPIC_TAXONOMY)) {
      // Check if this OpenAlex concept matches any of our topic signals
      const matchesStrong = node.strongSignals.some(s => 
        conceptName.includes(normalizeText(s)) || normalizeText(s).includes(conceptName)
      );
      const matchesModerate = node.moderateSignals.some(s => 
        conceptName.includes(normalizeText(s)) || normalizeText(s).includes(conceptName)
      );
      
      if (matchesStrong || matchesModerate) {
        const existing = detections.get(topicId);
        const newScore = concept.score;
        
        if (!existing || newScore > existing.score) {
          let confidence: "high" | "medium" | "low";
          if (matchesStrong && concept.score > 0.5) confidence = "high";
          else if (matchesStrong || concept.score > 0.6) confidence = "medium";
          else confidence = "low";
          
          detections.set(topicId, { confidence, score: newScore });
        }
      }
    }
  }
  
  return detections;
}

function combineTopicDetections(
  textDetections: Map<string, { confidence: "high" | "medium" | "low"; evidence: string[] }>,
  conceptDetections: Map<string, { confidence: "high" | "medium" | "low"; score: number }>
): DetectedTopic[] {
  const combined = new Map<string, DetectedTopic>();
  
  // Add text detections
  for (const [topicId, detection] of textDetections) {
    const node = TOPIC_TAXONOMY[topicId];
    if (!node) continue;
    
    combined.set(topicId, {
      id: topicId,
      name: node.name,
      confidence: detection.confidence,
      source: "abstract"
    });
  }
  
  // Merge concept detections
  for (const [topicId, detection] of conceptDetections) {
    const node = TOPIC_TAXONOMY[topicId];
    if (!node) continue;
    
    const existing = combined.get(topicId);
    if (existing) {
      // Upgrade confidence if both sources agree
      if (existing.confidence !== "high" && detection.confidence !== "low") {
        existing.confidence = "high";
      }
      existing.source = "both";
    } else {
      combined.set(topicId, {
        id: topicId,
        name: node.name,
        confidence: detection.confidence,
        source: "concepts"
      });
    }
  }
  
  // Convert to array and sort
  const topics = Array.from(combined.values());
  const confidenceOrder = { high: 0, medium: 1, low: 2 };
  topics.sort((a, b) => confidenceOrder[a.confidence] - confidenceOrder[b.confidence]);
  
  // Deduplicate: if child detected with high confidence, don't also show parent
  const topicIds = new Set(topics.filter(t => t.confidence === "high").map(t => t.id));
  const filtered = topics.filter(topic => {
    const node = TOPIC_TAXONOMY[topic.id];
    if (!node || !node.parent) return true;
    // Keep if parent not detected with high confidence
    return !topicIds.has(node.parent);
  });
  
  return filtered;
}

// ═══════════════════════════════════════════════════════════════════════════
// QUALITY SCORING
// ═══════════════════════════════════════════════════════════════════════════

function calculateQualityScore(paper: Paper): number {
  const tierScores: Record<number, number> = { 1: 1.0, 2: 0.8, 3: 0.6, 4: 0.35 };
  const tierScore = tierScores[paper.journal_tier] || 0.35;
  
  // Citation score with diminishing returns and recency adjustment
  const cites = paper.cited_by_count || 0;
  let citeScore: number;
  if (cites >= 100) citeScore = 1.0;
  else if (cites >= 50) citeScore = 0.9;
  else if (cites >= 20) citeScore = 0.75;
  else if (cites >= 10) citeScore = 0.6;
  else if (cites >= 5) citeScore = 0.45;
  else if (cites >= 1) citeScore = 0.35;
  else citeScore = 0.25;  // New papers get benefit of doubt
  
  // Recency bonus for papers with few citations (might be new)
  const pubDate = paper.publication_date ? new Date(paper.publication_date) : null;
  if (pubDate && cites < 10) {
    const ageMonths = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (ageMonths < 6) citeScore = Math.max(citeScore, 0.5);
    else if (ageMonths < 12) citeScore = Math.max(citeScore, 0.4);
  }
  
  return tierScore * 0.6 + citeScore * 0.4;
}

// ═══════════════════════════════════════════════════════════════════════════
// META-CHARACTERISTIC DETECTION
// ═══════════════════════════════════════════════════════════════════════════

function detectMetaCharacteristics(
  text: string, 
  methods: DetectedMethod[]
): {
  isEmpirical: boolean;
  isTheoretical: boolean;
  isReview: boolean;
  isQuantitative: boolean;
  isQualitative: boolean;
} {
  const methodIds = new Set(methods.map(m => m.id));
  
  // Check for review
  const isReview = methodIds.has("meta_analysis") || 
    methodIds.has("literature_review") || 
    methodIds.has("synthesis") ||
    containsTerm(text, "review") && (containsTerm(text, "literature") || containsTerm(text, "systematic"));
  
  // Check for theoretical
  const isTheoretical = methodIds.has("game_theory") || 
    methodIds.has("theory") ||
    containsTerm(text, "theorem") || 
    containsTerm(text, "proposition") ||
    (containsTerm(text, "model") && containsTerm(text, "prove"));
  
  // Check for qualitative
  const qualMethods = ["case_study", "ethnography", "interviews", "process_tracing", 
    "comparative_historical", "content_analysis", "discourse_analysis", "qualitative"];
  const isQualitative = qualMethods.some(m => methodIds.has(m));
  
  // Check for quantitative
  const isQuantitative = !isQualitative && !isTheoretical && (
    methodIds.has("quantitative") ||
    containsTerm(text, "regression") ||
    containsTerm(text, "estimate") ||
    containsTerm(text, "data") && containsTerm(text, "sample")
  );
  
  // Empirical = has data, not just theory
  const isEmpirical = isQuantitative || isQualitative || (
    containsTerm(text, "data") ||
    containsTerm(text, "evidence") ||
    containsTerm(text, "empirical")
  ) && !isTheoretical && !isReview;
  
  return { isEmpirical, isTheoretical, isReview, isQuantitative, isQualitative };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ANALYZER FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

export function analyzePaper(paper: Paper): PaperProfile {
  const title = paper.title || "";
  const abstract = paper.abstract || "";
  const text = `${title} ${abstract}`;
  
  // Detect methods
  const { methods, signals: methodSignals } = detectMethods(title, abstract);
  
  // Detect topics from text
  const textTopics = detectTopicsFromText(title, abstract);
  
  // Detect topics from OpenAlex concepts
  const conceptTopics = detectTopicsFromConcepts(paper.concepts || []);
  
  // Combine topic detections
  const topics = combineTopicDetections(textTopics, conceptTopics);
  
  // Calculate quality
  const qualityScore = calculateQualityScore(paper);
  
  // Detect meta-characteristics
  const meta = detectMetaCharacteristics(text, methods);
  
  // Build topic signals map for debugging
  const topicSignals = new Map<string, string[]>();
  for (const [topicId, detection] of textTopics) {
    topicSignals.set(topicId, detection.evidence);
  }
  
  return {
    methods,
    topics,
    ...meta,
    qualityScore,
    rawSignals: {
      methodSignals,
      topicSignals
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// DISPLAY HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get human-readable method tags for display
 * Only returns high/medium confidence detections
 */
export function getMethodTags(profile: PaperProfile): string[] {
  return profile.methods
    .filter(m => m.confidence === "high" || m.confidence === "medium")
    .map(m => m.name)
    .slice(0, 2);
}

/**
 * Get human-readable topic tags for display
 * Only returns high/medium confidence detections
 */
export function getTopicTags(profile: PaperProfile): string[] {
  return profile.topics
    .filter(t => t.confidence === "high" || t.confidence === "medium")
    .map(t => t.name)
    .slice(0, 3);
}

/**
 * Get a brief characterization of the paper type
 */
export function getPaperType(profile: PaperProfile): string {
  if (profile.isReview) return "Review/Synthesis";
  if (profile.isTheoretical) return "Theoretical";
  if (profile.isQualitative) return "Qualitative";
  if (profile.isQuantitative) return "Empirical";
  return "Research";
}
