import { NextRequest, NextResponse } from "next/server";
import { processPapers } from "@/lib/scoring";
import type { Paper, UserProfile } from "@/lib/types";

export const runtime = "edge";

interface RecommendRequestBody {
  profile: UserProfile;
  papers: Paper[];
}

export async function POST(request: NextRequest) {
  try {
    const body: RecommendRequestBody = await request.json();

    const { profile, papers } = body;

    // Validate required fields
    if (!profile) {
      return NextResponse.json(
        { error: "Profile is required" },
        { status: 400 }
      );
    }

    if (!papers || !Array.isArray(papers)) {
      return NextResponse.json(
        { error: "Papers array is required" },
        { status: 400 }
      );
    }

    if (!profile.name) {
      return NextResponse.json(
        { error: "Profile must include name" },
        { status: 400 }
      );
    }
    
    // Ensure interests and methods are arrays (can be empty)
    if (!Array.isArray(profile.interests)) {
      profile.interests = [];
    }
    if (!Array.isArray(profile.methods)) {
      profile.methods = [];
    }
    if (profile.exploration_level === undefined) {
      profile.exploration_level = 0.5;
    }

    // Process papers with scoring engine
    const result = processPapers(profile, papers);

    return NextResponse.json({
      papers: result.papers,
      summary: result.summary,
      high_relevance_count: result.papers.filter((p) => p.relevance_score >= 7.0)
        .length,
    });
  } catch (error) {
    console.error("Error processing recommendations:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process recommendations",
      },
      { status: 500 }
    );
  }
}
