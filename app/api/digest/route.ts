/**
 * Email digest endpoint
 * ═══════════════════════════════════════════════════════════════════════════
 * POST /api/digest
 *
 * Two modes:
 *   action: "send-now"  — send the current reading list to a single address
 *   action: "cron"      — iterate all stored subscriptions and send digests
 *                         (called by Vercel Cron — see vercel.json)
 *
 * Required env vars:
 *   RESEND_API_KEY               — from resend.com
 *   RESEND_FROM                  — verified sender (default: verso@resend.dev)
 *
 * For cron mode additionally:
 *   UPSTASH_REDIS_REST_URL       — from upstash.com
 *   UPSTASH_REDIS_REST_TOKEN     — from upstash.com
 *   CRON_SECRET                  — arbitrary secret set in vercel.json cron headers
 */

import { NextRequest, NextResponse } from "next/server";
import { sendDigestEmail, getAllSubscriptions, type DigestEmailData } from "@/lib/email";
import { fetchRecentPapers } from "@/lib/openalex";
import { fetchWorkingPapers } from "@/lib/working-papers";
import { fetchArxivPapers } from "@/lib/arxiv";
import { processPapers } from "@/lib/scoring";
import type { ScoredPaper, UserProfile } from "@/lib/types";

export const runtime = "edge";
export const maxDuration = 120;

// ─── Send-now helper ──────────────────────────────────────────────────────

interface SendNowBody {
  action: "send-now";
  email: string;
  name: string;
  papers: ScoredPaper[];
  profile: UserProfile;
  days: number;
}

// ─── Cron helper ─────────────────────────────────────────────────────────

async function fetchAndScorePapers(
  profile: UserProfile,
  journals: string[],
  days: number
): Promise<ScoredPaper[]> {
  const allPapers = await Promise.allSettled([
    fetchWorkingPapers(days, 40),
    fetchRecentPapers({ daysBack: days, selectedJournals: journals, maxResults: 80 }),
    fetchArxivPapers({ daysBack: days, maxResults: 30 }),
  ]);

  const papers = allPapers
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchWorkingPapers>>> =>
      r.status === "fulfilled"
    )
    .flatMap((r) => r.value);

  if (!papers.length) return [];

  const { papers: scored } = processPapers(profile, papers);
  return scored;
}

// ─── Route handler ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ── send-now: email the current reading list immediately ───────────────
    if (body.action === "send-now") {
      const { email, name, papers, profile, days } = body as SendNowBody;

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "Valid email required" }, { status: 400 });
      }
      if (!Array.isArray(papers) || !papers.length) {
        return NextResponse.json({ error: "No papers to send" }, { status: 400 });
      }

      const resendConfigured = Boolean(process.env.RESEND_API_KEY);
      if (!resendConfigured) {
        return NextResponse.json({
          success: false,
          configured: false,
          error:
            "Email delivery requires a RESEND_API_KEY environment variable. " +
            "Sign up for free at resend.com, create an API key, and add it to your Vercel project settings.",
        });
      }

      const result = await sendDigestEmail({
        recipientEmail: email,
        recipientName: name || "Researcher",
        papers,
        profile,
        days,
      } satisfies DigestEmailData);

      return NextResponse.json({ ...result, configured: true });
    }

    // ── cron: send weekly digests to all subscribers ───────────────────────
    if (body.action === "cron") {
      const cronSecret = process.env.CRON_SECRET;
      if (cronSecret && body.secret !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const subscriptions = await getAllSubscriptions();
      const results: { email: string; success: boolean; error?: string }[] = [];

      for (const sub of subscriptions) {
        try {
          let profile: UserProfile;
          try {
            profile = JSON.parse(
              Buffer.from(sub.encodedProfile, "base64").toString("utf-8")
            ) as UserProfile;
          } catch {
            results.push({ email: sub.email, success: false, error: "Invalid stored profile" });
            continue;
          }

          const scored = await fetchAndScorePapers(profile, sub.journals, sub.days);
          if (!scored.length) {
            results.push({ email: sub.email, success: false, error: "No papers found" });
            continue;
          }

          const result = await sendDigestEmail({
            recipientEmail: sub.email,
            recipientName: sub.name,
            papers: scored,
            profile,
            days: sub.days,
          });

          results.push({ email: sub.email, ...result });
        } catch (err) {
          results.push({
            email: sub.email,
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }

      return NextResponse.json({ sent: results.filter((r) => r.success).length, results });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Digest error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
