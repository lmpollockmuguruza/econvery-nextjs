"use client";

import { useState } from "react";
import { ExternalLink, Bookmark, BookmarkCheck, X, ThumbsUp, ThumbsDown, Copy, Check } from "lucide-react";
import type { ScoredPaper } from "@/lib/types";
import type { PaperStatus, FeedbackRating } from "@/lib/paper-memory";
import { paperToBibTeX } from "@/lib/bibtex";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface PaperCardProps {
  paper: ScoredPaper;
  index?: number;
  compact?: boolean;
  /** Current saved/dismissed state of this paper */
  status?: PaperStatus | null;
  /** Current thumbs rating */
  rating?: FeedbackRating | null;
  onSave?: (id: string, title: string, journal: string) => void;
  onDismiss?: (id: string, title: string, journal: string) => void;
  onClearStatus?: (id: string) => void;
  onRate?: (id: string, rating: FeedbackRating | null, interests: string[], methods: string[]) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatAuthors(authors: string[]): string {
  if (!authors.length) return "Unknown authors";
  if (authors.length <= 2) return authors.join(" & ");
  return `${authors[0]} et al.`;
}

function getScoreStyle(score: number): { color: string; fontWeight: number } {
  if (score >= 8) return { color: "var(--fg)", fontWeight: 600 };
  if (score >= 6) return { color: "var(--fg-muted)", fontWeight: 400 };
  return { color: "var(--fg-faint)", fontWeight: 400 };
}

function getTierInfo(tier?: "core" | "explore" | "discovery") {
  switch (tier) {
    case "core":      return { label: "Core",      className: "tier-badge-core" };
    case "explore":   return { label: "Explore",   className: "tier-badge-explore" };
    case "discovery": return { label: "Discovery", className: "tier-badge-discovery" };
    default:          return null;
  }
}

function getJournalTierLabel(tier: number): string | null {
  switch (tier) {
    case 1: return "Top 5";
    case 2: return "Top field";
    case 3: return "Excellent";
    default: return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function PaperCard({
  paper,
  index = 0,
  compact = false,
  status,
  rating,
  onSave,
  onDismiss,
  onClearStatus,
  onRate,
}: PaperCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [bibCopied, setBibCopied] = useState(false);

  const tierInfo = getTierInfo(paper.match_tier);
  const journalTier = getJournalTierLabel(paper.journal_tier);
  const link = paper.doi_url || paper.oa_url;
  const scoreStyle = getScoreStyle(paper.relevance_score);

  const isSaved = status === "saved";
  const isDismissed = status === "dismissed";

  function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    if (isSaved) {
      onClearStatus?.(paper.id);
    } else {
      onSave?.(paper.id, paper.title, paper.journal);
    }
  }

  function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation();
    if (isDismissed) {
      onClearStatus?.(paper.id);
    } else {
      onDismiss?.(paper.id, paper.title, paper.journal);
    }
  }

  function handleRate(newRating: FeedbackRating) {
    // Toggle off if clicking the same rating
    const next = rating === newRating ? null : newRating;
    onRate?.(paper.id, next, paper.matched_interests, paper.matched_methods);
  }

  async function handleCopyBibTeX(e: React.MouseEvent) {
    e.stopPropagation();
    const bib = paperToBibTeX(paper);
    try {
      await navigator.clipboard.writeText(bib);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = bib;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setBibCopied(true);
    setTimeout(() => setBibCopied(false), 2000);
  }

  // Dismissed papers show as a subtle single-line entry
  if (isDismissed) {
    return (
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          display: "grid",
          gridTemplateColumns: "2.8rem 1fr auto",
          gap: "1rem",
          padding: "0.5rem 0",
          alignItems: "center",
          opacity: 0.35,
        }}
      >
        <span className="font-mono" style={{ fontSize: "0.8125rem", color: "var(--fg-faint)" }}>
          {paper.relevance_score.toFixed(1)}
        </span>
        <span
          style={{ fontSize: "0.8125rem", color: "var(--fg-faint)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}
        >
          {paper.title}
        </span>
        <button
          onClick={handleDismiss}
          title="Restore paper"
          className="paper-action-btn"
          style={{ opacity: 1 }}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        borderBottom: "1px solid var(--border)",
        animation: `fadeSlideIn 0.3s ease ${index * 0.04}s both`,
      }}
    >
      {/* Main row — clickable */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: "grid",
          gridTemplateColumns: "2.8rem 1fr auto",
          gap: "1rem",
          padding: "0.875rem 0",
          cursor: "pointer",
          alignItems: "baseline",
          transition: "background 0.1s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        {/* Score */}
        <span
          className="font-mono"
          style={{ fontSize: "0.8125rem", ...scoreStyle, letterSpacing: "-0.01em" }}
        >
          {paper.relevance_score.toFixed(1)}
        </span>

        {/* Title + meta */}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: "0.9375rem",
              lineHeight: 1.4,
              color: "var(--fg)",
              fontWeight: 450,
              letterSpacing: "-0.01em",
              fontFamily: "var(--font-sans)",
            }}
          >
            {paper.title}
          </div>
          <div
            className="font-mono"
            style={{
              marginTop: "0.25rem",
              fontSize: "0.75rem",
              color: "var(--fg-muted)",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.125rem 0.5rem",
              alignItems: "center",
            }}
          >
            <span>{formatAuthors(paper.authors)}</span>
            <span style={{ color: "var(--fg-faint)" }}>·</span>
            <span>{paper.journal}</span>
            {journalTier && (
              <>
                <span style={{ color: "var(--fg-faint)" }}>·</span>
                <span style={{ color: "var(--fg-faint)" }}>{journalTier}</span>
              </>
            )}
            <span style={{ color: "var(--fg-faint)" }}>·</span>
            <span>{formatDate(paper.publication_date)}</span>
          </div>
        </div>

        {/* Right tags + quick-save */}
        <div style={{ display: "flex", gap: "0.375rem", alignItems: "center", flexShrink: 0 }}>
          {tierInfo && (
            <span className={`tag ${tierInfo.className}`}>{tierInfo.label}</span>
          )}
          {paper.is_open_access && <span className="tag tag-oa">OA</span>}
          {paper.journal_field === "arxiv" && (
            <span className="tag tag-neutral">arXiv</span>
          )}
          {/* Quick-save bookmark */}
          <button
            onClick={handleSave}
            title={isSaved ? "Remove from saved" : "Save paper"}
            className="paper-action-btn"
            style={{ color: isSaved ? "var(--accent)" : undefined }}
          >
            {isSaved
              ? <BookmarkCheck className="h-3.5 w-3.5" />
              : <Bookmark className="h-3.5 w-3.5" />
            }
          </button>
          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            title="Dismiss paper"
            className="paper-action-btn"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="animate-fade-in" style={{ padding: "0 0 1rem 3.8rem" }}>
          {/* Abstract */}
          {paper.abstract && (
            <p style={{ fontSize: "0.8125rem", lineHeight: 1.7, color: "var(--fg-soft)", maxWidth: "60ch" }}>
              {paper.abstract}
            </p>
          )}

          {/* Interest + method tags */}
          <div style={{ marginTop: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.375rem", alignItems: "center" }}>
            {paper.matched_interests?.slice(0, 3).map((interest) => (
              <span key={interest} className="tag tag-interest">{interest}</span>
            ))}
            {paper.matched_methods?.slice(0, 2).map((method) => (
              <span
                key={method}
                className="font-mono"
                style={{
                  fontSize: "0.6875rem",
                  color: "var(--accent)",
                  padding: "0.125rem 0.375rem",
                  background: "var(--accent-wash)",
                }}
              >
                {method}
              </span>
            ))}
          </div>

          {/* Match explanation */}
          {paper.match_explanation && (
            <p
              className="font-serif italic"
              style={{ marginTop: "0.625rem", fontSize: "0.8125rem", color: "var(--fg-muted)" }}
            >
              {paper.match_explanation}
            </p>
          )}

          {/* AI scoring detail */}
          {paper.ai_score != null && paper.original_score != null && (
            <div
              className="font-mono"
              style={{
                marginTop: "0.5rem",
                fontSize: "0.6875rem",
                color: "var(--accent)",
                padding: "0.25rem 0.5rem",
                background: "var(--accent-wash)",
                border: "1px solid var(--accent-border)",
                display: "inline-block",
              }}
            >
              AI: {paper.ai_score.toFixed(1)}
              {paper.ai_discovery != null && ` · Discovery: ${paper.ai_discovery.toFixed(1)}`}
              {" · "}Base: {paper.original_score.toFixed(1)}
              {paper.ai_explanation && ` · ${paper.ai_explanation}`}
            </div>
          )}

          {/* Action row: link + feedback + bibtex */}
          <div
            style={{
              marginTop: "0.875rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              alignItems: "center",
            }}
          >
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono"
                style={{
                  fontSize: "0.75rem",
                  color: "var(--accent)",
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                Open paper <ExternalLink style={{ width: "0.7rem", height: "0.7rem" }} />
              </a>
            )}

            {/* Separator */}
            {link && <span style={{ color: "var(--fg-ghost)" }}>·</span>}

            {/* Feedback buttons */}
            <div style={{ display: "inline-flex", gap: "0.25rem", alignItems: "center" }}>
              <button
                onClick={() => handleRate("up")}
                title="Relevant — boost similar papers"
                className="paper-feedback-btn"
                style={{ color: rating === "up" ? "var(--score-high)" : undefined }}
              >
                <ThumbsUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleRate("down")}
                title="Not relevant — suppress similar papers"
                className="paper-feedback-btn"
                style={{ color: rating === "down" ? "#c53030" : undefined }}
              >
                <ThumbsDown className="h-3 w-3" />
              </button>
            </div>

            {/* BibTeX copy */}
            <button
              onClick={handleCopyBibTeX}
              className="font-mono paper-feedback-btn"
              title="Copy BibTeX citation"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.6875rem" }}
            >
              {bibCopied
                ? <><Check className="h-3 w-3" style={{ color: "var(--score-high)" }} /> Copied</>
                : <><Copy className="h-3 w-3" /> BibTeX</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
