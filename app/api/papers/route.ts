import { NextRequest, NextResponse } from "next/server";
import { fetchRecentPapers } from "@/lib/openalex";
import { fetchWorkingPapers } from "@/lib/working-papers";
import { WORKING_PAPERS } from "@/lib/journals";

export const runtime = "edge";
export const maxDuration = 60;

// List of working paper sources
const WORKING_PAPER_NAMES = Object.keys(WORKING_PAPERS);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const daysBack = parseInt(searchParams.get("daysBack") || "30", 10);
    const maxResults = parseInt(searchParams.get("maxResults") || "100", 10);
    const journalsParam = searchParams.get("journals");

    // Parse journals array from comma-separated string
    const selectedJournals = journalsParam
      ? journalsParam.split(",").map((j) => decodeURIComponent(j.trim()))
      : undefined;

    // Validate parameters
    if (daysBack < 1 || daysBack > 365) {
      return NextResponse.json(
        { error: "daysBack must be between 1 and 365" },
        { status: 400 }
      );
    }

    if (maxResults < 1 || maxResults > 500) {
      return NextResponse.json(
        { error: "maxResults must be between 1 and 500" },
        { status: 400 }
      );
    }

    // Separate working papers from regular journals
    const workingPaperSources = selectedJournals?.filter(j => 
      WORKING_PAPER_NAMES.includes(j)
    ) || [];
    
    const regularJournals = selectedJournals?.filter(j => 
      !WORKING_PAPER_NAMES.includes(j)
    );

    const allPapers: any[] = [];
    const seenIds = new Set<string>();

    // Fetch working papers if requested (using dedicated fetcher)
    if (workingPaperSources.length > 0 || !selectedJournals) {
      console.log("Fetching working papers via dedicated fetcher...");
      try {
        const wpPapers = await fetchWorkingPapers(daysBack, Math.min(50, maxResults));
        for (const paper of wpPapers) {
          if (!seenIds.has(paper.id)) {
            seenIds.add(paper.id);
            allPapers.push(paper);
          }
        }
        console.log(`Got ${wpPapers.length} working papers`);
      } catch (error) {
        console.warn("Working papers fetch failed:", error);
      }
    }

    // Fetch regular journals if requested
    if ((regularJournals && regularJournals.length > 0) || !selectedJournals) {
      console.log("Fetching regular journals via OpenAlex...");
      try {
        const journalPapers = await fetchRecentPapers({
          daysBack,
          selectedJournals: regularJournals,
          maxResults: maxResults - allPapers.length,
        });
        
        for (const paper of journalPapers) {
          if (!seenIds.has(paper.id)) {
            seenIds.add(paper.id);
            allPapers.push(paper);
          }
        }
        console.log(`Got ${journalPapers.length} journal papers`);
      } catch (error) {
        console.warn("Journal papers fetch failed:", error);
      }
    }

    // Sort by date (most recent first)
    allPapers.sort((a, b) => {
      const dateA = new Date(a.publication_date || 0).getTime();
      const dateB = new Date(b.publication_date || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({
      papers: allPapers.slice(0, maxResults),
      count: Math.min(allPapers.length, maxResults),
      sources: {
        workingPapers: workingPaperSources.length,
        journals: regularJournals?.length || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching papers:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch papers",
        papers: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
