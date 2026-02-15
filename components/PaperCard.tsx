"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import type { ScoredPaper } from "@/lib/types";

interface PaperCardProps {
  paper: ScoredPaper;
  index?: number;
  compact?: boolean;
}

export function PaperCard({ paper, index = 0, compact = false }: PaperCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch { return dateStr; }
  };

  const formatAuthors = (authors: string[]) => {
    if (!authors.length) return "Unknown authors";
    if (authors.length <= 2) return authors.join(" & ");
    return `${authors[0]} et al.`;
  };

  const getScoreWeight = (score: number) => {
    if (score >= 8) return { color: "var(--fg)", fontWeight: 600 };
    if (score >= 6) return { color: "var(--fg-muted)", fontWeight: 400 };
    return { color: "var(--fg-faint)", fontWeight: 400 };
  };

  const getTierLabel = (tier?: "core" | "explore" | "discovery") => {
    switch (tier) {
      case "core": return { label: "Core", className: "tier-badge-core" };
      case "explore": return { label: "Explore", className: "tier-badge-explore" };
      case "discovery": return { label: "Discovery", className: "tier-badge-discovery" };
      default: return null;
    }
  };

  const getJournalTierLabel = (tier: number) => {
    switch (tier) {
      case 1: return "Top 5";
      case 2: return "Top field";
      case 3: return "Excellent";
      default: return null;
    }
  };

  const tierInfo = getTierLabel(paper.match_tier);
  const journalTier = getJournalTierLabel(paper.journal_tier);
  const link = paper.doi_url || paper.oa_url;
  const scoreStyle = getScoreWeight(paper.relevance_score);

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
          style={{
            fontSize: "0.8125rem",
            color: scoreStyle.color,
            fontWeight: scoreStyle.fontWeight,
            letterSpacing: "-0.01em",
          }}
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

        {/* Right tags */}
        <div style={{ display: "flex", gap: "0.375rem", alignItems: "center", flexShrink: 0 }}>
          {tierInfo && (
            <span className={`tag ${tierInfo.className}`}>
              {tierInfo.label}
            </span>
          )}
          {paper.is_open_access && (
            <span className="tag tag-oa">OA</span>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div
          className="animate-fade-in"
          style={{ padding: "0 0 1rem 3.8rem" }}
        >
          {/* Abstract */}
          {paper.abstract && (
            <p
              style={{
                fontSize: "0.8125rem",
                lineHeight: 1.7,
                color: "var(--fg-soft)",
                maxWidth: "60ch",
              }}
            >
              {paper.abstract}
            </p>
          )}

          {/* Tags row */}
          <div
            style={{
              marginTop: "0.75rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.375rem",
              alignItems: "center",
            }}
          >
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
              style={{
                marginTop: "0.625rem",
                fontSize: "0.8125rem",
                color: "var(--fg-muted)",
              }}
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

          {/* Link */}
          {link && (
            <div style={{ marginTop: "0.75rem" }}>
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
