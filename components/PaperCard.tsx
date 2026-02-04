"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import type { ScoredPaper } from "@/lib/types";

interface PaperCardProps {
  paper: ScoredPaper;
  index?: number;
}

export function PaperCard({ paper, index = 0 }: PaperCardProps) {
  const [isAbstractOpen, setIsAbstractOpen] = useState(false);

  // Format publication date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Format authors
  const formatAuthors = (authors: string[]) => {
    if (!authors.length) return "Unknown authors";
    if (authors.length <= 2) return authors.join(", ");
    return `${authors.slice(0, 2).join(", ")} +${authors.length - 2}`;
  };

  // Score styling
  const getScoreClass = (score: number) => {
    if (score >= 7) return "score-high";
    if (score >= 4) return "score-medium";
    return "score-low";
  };

  // Tier badge
  const getTierBadge = (tier: number) => {
    switch (tier) {
      case 1:
        return "Top";
      case 2:
        return "Top Field";
      case 3:
        return "Excellent";
      default:
        return null;
    }
  };

  const tierBadge = getTierBadge(paper.journal_tier);
  const link = paper.doi_url || paper.oa_url;

  return (
    <article
      className="card group"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Header: Title + Score */}
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-lg font-medium leading-snug text-paper-900">
          {paper.title}
        </h3>
        <div
          className={`score shrink-0 text-lg ${getScoreClass(paper.relevance_score)}`}
        >
          {paper.relevance_score.toFixed(1)}
        </div>
      </div>

      {/* Meta info */}
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-paper-500">
        <span className="font-medium text-paper-700">{paper.journal}</span>
        {tierBadge && (
          <>
            <span>·</span>
            <span className="text-paper-400">{tierBadge}</span>
          </>
        )}
        <span>·</span>
        <span>{formatAuthors(paper.authors)}</span>
        <span>·</span>
        <span>{formatDate(paper.publication_date)}</span>
      </div>

      {/* Match explanation */}
      {paper.match_explanation && (
        <div className="mt-3 rounded-lg bg-paper-50 px-3 py-2 text-sm text-paper-700">
          {paper.match_explanation}
        </div>
      )}

      {/* Tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {paper.matched_methods?.slice(0, 2).map((method) => (
          <span key={method} className="tag tag-method">
            {method}
          </span>
        ))}
        {paper.matched_interests?.slice(0, 2).map((interest) => (
          <span key={interest} className="tag tag-interest">
            {interest}
          </span>
        ))}
        {paper.is_open_access && <span className="tag tag-oa">Open Access</span>}
      </div>

      {/* Abstract toggle */}
      <div className="mt-4 border-t border-paper-100 pt-3">
        <button
          onClick={() => setIsAbstractOpen(!isAbstractOpen)}
          className="flex w-full items-center gap-2 text-sm font-medium text-paper-600 transition-colors hover:text-paper-900"
        >
          {isAbstractOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <BookOpen className="h-4 w-4" />
          <span>Abstract</span>
        </button>

        {isAbstractOpen && (
          <div className="mt-3 animate-fade-in text-sm leading-relaxed text-paper-600">
            {paper.abstract}
          </div>
        )}
      </div>

      {/* Link to paper */}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-paper-600 transition-colors hover:text-paper-900"
        >
          <ExternalLink className="h-4 w-4" />
          Open paper
        </a>
      )}
    </article>
  );
}
