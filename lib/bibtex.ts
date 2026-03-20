/**
 * BibTeX Export Utilities
 * ═══════════════════════════════════════════════════════════════════════════
 * Generates BibTeX entries from scored papers for import into reference
 * managers (Zotero, Mendeley, Overleaf, etc.).
 */

import type { ScoredPaper, UserProfile } from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Escape special BibTeX characters in a string value.
 */
function escapeBibTeX(str: string): string {
  return str
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/[&%$#_{}]/g, "\\$&")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/</g, "\\textless{}")
    .replace(/>/g, "\\textgreater{}")
    .replace(/"/g, "''")
    .replace(/'/g, "'");
}

/**
 * Generate a cite key from authors and year.
 * Format: firstAuthorLastName + year (e.g., "acemoglu2024")
 */
function generateCiteKey(paper: ScoredPaper): string {
  const year = paper.publication_date
    ? new Date(paper.publication_date).getFullYear()
    : "unkn";

  const firstAuthor = paper.authors[0] || "";
  const lastName = firstAuthor.includes(",")
    ? firstAuthor.split(",")[0].trim()
    : firstAuthor.split(" ").pop() || "unknown";

  // Sanitize: lowercase, remove non-alphanumeric
  const cleanLastName = lastName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9]/g, "");

  return `${cleanLastName}${year}`;
}

/**
 * Format authors in BibTeX "Last, First and Last, First" style.
 * OpenAlex provides "First Last" format, so we invert.
 */
function formatAuthors(authors: string[]): string {
  const formatted = authors.map((author) => {
    const parts = author.trim().split(/\s+/);
    if (parts.length === 1) return author;
    const last = parts[parts.length - 1];
    const first = parts.slice(0, -1).join(" ");
    return `${last}, ${first}`;
  });
  return formatted.join(" and ");
}

// ═══════════════════════════════════════════════════════════════════════════
// ENTRY GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert a single paper to a BibTeX entry string.
 */
export function paperToBibTeX(paper: ScoredPaper): string {
  const citeKey = generateCiteKey(paper);
  const year = paper.publication_date
    ? String(new Date(paper.publication_date).getFullYear())
    : "";
  const month = paper.publication_date
    ? String(new Date(paper.publication_date).getMonth() + 1).padStart(2, "0")
    : "";

  // Determine entry type: working papers are @techreport, journals are @article
  const isWorkingPaper =
    paper.journal_field === "working_papers" ||
    paper.journal_field === "arxiv";
  const entryType = isWorkingPaper ? "techreport" : "article";

  const fields: [string, string][] = [
    ["title", `{${escapeBibTeX(paper.title)}}`],
    ["author", `{${formatAuthors(paper.authors)}}`],
    ...(isWorkingPaper
      ? [["institution", `{${escapeBibTeX(paper.journal)}}`] as [string, string]]
      : [["journal", `{${escapeBibTeX(paper.journal)}}`] as [string, string]]),
    ...(year ? [["year", year] as [string, string]] : []),
    ...(month ? [["month", month] as [string, string]] : []),
  ];

  if (paper.doi) {
    fields.push(["doi", escapeBibTeX(paper.doi.replace("https://doi.org/", ""))]);
  }

  const url = paper.doi_url || paper.oa_url;
  if (url) {
    fields.push(["url", escapeBibTeX(url)]);
  }

  if (paper.abstract) {
    // Truncate very long abstracts to avoid bloating the file
    const abstract = paper.abstract.length > 800
      ? paper.abstract.slice(0, 800) + "..."
      : paper.abstract;
    fields.push(["abstract", `{${escapeBibTeX(abstract)}}`]);
  }

  const fieldLines = fields
    .map(([key, val]) => `  ${key} = ${val}`)
    .join(",\n");

  return `@${entryType}{${citeKey},\n${fieldLines}\n}`;
}

/**
 * Generate a full BibTeX file string for a list of papers.
 */
export function papersToBibTeX(papers: ScoredPaper[], profile?: UserProfile): string {
  const date = new Date().toISOString().split("T")[0];
  const name = profile?.name || "Researcher";
  const field = profile?.primary_field && profile.primary_field !== "General Interest (Show me everything)"
    ? profile.primary_field
    : "General Interest";

  const header = [
    `% verso — reading list`,
    `% Curated for ${name} · ${field}`,
    `% Generated: ${date} · ${papers.length} entries`,
    `% Import into Zotero, Mendeley, or Overleaf`,
    "",
  ].join("\n");

  // Deduplicate cite keys by appending letter suffixes
  const seenKeys = new Map<string, number>();
  const entries = papers.map((paper) => {
    let key = generateCiteKey(paper);
    const count = seenKeys.get(key) ?? 0;
    if (count > 0) {
      const suffix = String.fromCharCode(96 + count); // a, b, c, ...
      key = `${key}${suffix}`;
    }
    seenKeys.set(generateCiteKey(paper), count + 1);
    return paperToBibTeX(paper);
  });

  return header + entries.join("\n\n") + "\n";
}
