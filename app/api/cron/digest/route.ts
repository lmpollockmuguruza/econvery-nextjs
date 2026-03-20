/**
 * Weekly digest cron job — invoked by Vercel Cron every Monday at 08:00 UTC
 * ═══════════════════════════════════════════════════════════════════════════
 * Configured in vercel.json:
 *   { "path": "/api/cron/digest", "schedule": "0 8 * * 1" }
 *
 * Vercel automatically adds an "Authorization: Bearer {CRON_SECRET}" header
 * when calling this endpoint. Set CRON_SECRET in your Vercel project settings.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllSubscriptions, sendDigestEmail } from "@/lib/email";
import { fetchRecentPapers } from "@/lib/openalex";
import { fetchWorkingPapers } from "@/lib/working-papers";
import { fetchArxivPapers } from "@/lib/arxiv";
import { processPapers } from "@/lib/scoring";
import type { UserProfile } from "@/lib/types";

export const runtime = "edge";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  // Verify Vercel Cron auth header
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscriptions = await getAllSubscriptions();
  if (!subscriptions.length) {
    return NextResponse.json({ message: "No subscribers", sent: 0 });
  }

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

      // Fetch + score papers for this subscriber
      const [wpPapers, journalPapers, arxivPapers] = await Promise.allSettled([
        fetchWorkingPapers(sub.days, 40),
        fetchRecentPapers({ daysBack: sub.days, selectedJournals: sub.journals, maxResults: 80 }),
        fetchArxivPapers({ daysBack: sub.days, maxResults: 30 }),
      ]);

      const allPapers = [
        ...(wpPapers.status === "fulfilled" ? wpPapers.value : []),
        ...(journalPapers.status === "fulfilled" ? journalPapers.value : []),
        ...(arxivPapers.status === "fulfilled" ? arxivPapers.value : []),
      ];

      if (!allPapers.length) {
        results.push({ email: sub.email, success: false, error: "No papers found" });
        continue;
      }

      const { papers: scored } = processPapers(profile, allPapers);

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

  const sent = results.filter((r) => r.success).length;
  console.log(`Digest cron: sent ${sent}/${subscriptions.length}`);

  return NextResponse.json({ sent, total: subscriptions.length, results });
}
