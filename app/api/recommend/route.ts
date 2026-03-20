import { NextRequest, NextResponse } from "next/server";
import { processPapers } from "@/lib/scoring";
import type { Paper, UserProfile } from "@/lib/types";
import type { FeedbackSignal } from "@/lib/paper-memory";

export const runtime = "edge";

interface RecommendRequestBody {
  profile: UserProfile;
  papers: Paper[];
  feedbackSignal?: FeedbackSignal;
}

export async function POST(request: NextRequest) {
  try {
    const body: RecommendRequestBody = await request.json();
    const { profile, papers, feedbackSignal } = body;

    if (!profile) {
      return NextResponse.json({ error: "Profile is required" }, { status: 400 });
    }
    if (!Array.isArray(papers)) {
      return NextResponse.json({ error: "Papers array is required" }, { status: 400 });
    }
    if (!profile.name) {
      return NextResponse.json({ error: "Profile must include name" }, { status: 400 });
    }

    // Normalise optional arrays
    profile.interests = Array.isArray(profile.interests) ? profile.interests : [];
    profile.methods = Array.isArray(profile.methods) ? profile.methods : [];
    profile.exploration_level ??= 0.5;

    const result = processPapers(profile, papers, feedbackSignal);

    return NextResponse.json({
      papers: result.papers,
      summary: result.summary,
      high_relevance_count: result.papers.filter((p) => p.relevance_score >= 7.0).length,
    });
  } catch (error) {
    console.error("Error processing recommendations:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process recommendations" },
      { status: 500 }
    );
  }
}
