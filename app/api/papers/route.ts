import { NextRequest, NextResponse } from "next/server";
import { fetchRecentPapers } from "@/lib/openalex";

export const runtime = "edge";
export const maxDuration = 60;

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

    // Fetch papers
    const papers = await fetchRecentPapers({
      daysBack,
      selectedJournals,
      maxResults,
    });

    return NextResponse.json({
      papers,
      count: papers.length,
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
