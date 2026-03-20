import { NextRequest, NextResponse } from "next/server";
import { fetchRecentPapers } from "@/lib/openalex";
import { fetchWorkingPapers } from "@/lib/working-papers";
import { fetchArxivPapers } from "@/lib/arxiv";
import { WORKING_PAPERS } from "@/lib/journals";
import type { Paper } from "@/lib/types";

export const runtime = "edge";
export const maxDuration = 60;

const WORKING_PAPER_NAMES = new Set(Object.keys(WORKING_PAPERS));
const ARXIV_SOURCE_NAME = "arXiv Preprints";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const daysBack = parseInt(searchParams.get("daysBack") ?? "30", 10);
  const maxResults = parseInt(searchParams.get("maxResults") ?? "100", 10);
  const journalsParam = searchParams.get("journals");
  const includeArxiv = searchParams.get("arxiv") === "true";

  // Validation
  if (daysBack < 1 || daysBack > 365) {
    return NextResponse.json({ error: "daysBack must be between 1 and 365" }, { status: 400 });
  }
  if (maxResults < 1 || maxResults > 500) {
    return NextResponse.json({ error: "maxResults must be between 1 and 500" }, { status: 400 });
  }

  const selectedJournals = journalsParam
    ? journalsParam.split(",").map((j) => decodeURIComponent(j.trim()))
    : undefined;

  // Partition journals into working papers vs. regular journals
  const workingPaperSources = selectedJournals?.filter((j) => WORKING_PAPER_NAMES.has(j)) ?? [];
  const regularJournals = selectedJournals?.filter(
    (j) => !WORKING_PAPER_NAMES.has(j) && j !== ARXIV_SOURCE_NAME
  );

  const allPapers: Paper[] = [];
  const seenIds = new Set<string>();

  const addPapers = (papers: Paper[]) => {
    for (const paper of papers) {
      if (!seenIds.has(paper.id)) {
        seenIds.add(paper.id);
        allPapers.push(paper);
      }
    }
  };

  // 1. Working papers (NBER / CEPR)
  const shouldFetchWorkingPapers = workingPaperSources.length > 0 || !selectedJournals;
  if (shouldFetchWorkingPapers) {
    try {
      addPapers(await fetchWorkingPapers(daysBack, Math.min(50, maxResults)));
    } catch (error) {
      console.warn("Working papers fetch failed:", error);
    }
  }

  // 2. Regular peer-reviewed journals
  const shouldFetchJournals =
    (regularJournals && regularJournals.length > 0) || !selectedJournals;
  if (shouldFetchJournals) {
    try {
      addPapers(
        await fetchRecentPapers({
          daysBack,
          selectedJournals: regularJournals,
          maxResults: maxResults - allPapers.length,
        })
      );
    } catch (error) {
      console.warn("Journal papers fetch failed:", error);
    }
  }

  // 3. arXiv preprints (opt-in)
  const shouldFetchArxiv =
    includeArxiv || selectedJournals?.includes(ARXIV_SOURCE_NAME);
  if (shouldFetchArxiv) {
    try {
      addPapers(await fetchArxivPapers({ daysBack, maxResults: Math.min(40, maxResults) }));
    } catch (error) {
      console.warn("arXiv fetch failed:", error);
    }
  }

  // Sort newest first
  allPapers.sort(
    (a, b) =>
      new Date(b.publication_date || 0).getTime() -
      new Date(a.publication_date || 0).getTime()
  );

  return NextResponse.json({
    papers: allPapers.slice(0, maxResults),
    count: Math.min(allPapers.length, maxResults),
    sources: {
      workingPapers: workingPaperSources.length,
      journals: regularJournals?.length ?? 0,
      arxiv: shouldFetchArxiv ? 1 : 0,
    },
  });
}
