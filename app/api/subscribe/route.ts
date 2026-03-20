/**
 * Digest subscription endpoint
 * ═══════════════════════════════════════════════════════════════════════════
 * POST /api/subscribe — save or remove a weekly digest subscription
 *
 * Requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN env vars.
 * Returns { success, error?, configured } so the client can show setup
 * instructions when the store is not yet configured.
 */

import { NextRequest, NextResponse } from "next/server";
import { saveSubscription, removeSubscription, type DigestSubscription } from "@/lib/email";
import type { UserProfile } from "@/lib/types";

export const runtime = "edge";

interface SubscribeBody {
  action: "subscribe" | "unsubscribe";
  email: string;
  name: string;
  profile?: UserProfile;
  journals?: string[];
  days?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: SubscribeBody = await request.json();
    const { action, email, name } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const configured =
      Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
      Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

    if (action === "unsubscribe") {
      if (configured) await removeSubscription(email);
      return NextResponse.json({ success: true, configured });
    }

    // subscribe
    if (!body.profile) {
      return NextResponse.json({ error: "Profile required to subscribe" }, { status: 400 });
    }

    const sub: DigestSubscription = {
      email,
      name,
      encodedProfile: Buffer.from(JSON.stringify(body.profile)).toString("base64"),
      journals: body.journals ?? [],
      days: body.days ?? 30,
      subscribedAt: new Date().toISOString(),
    };

    if (!configured) {
      // Return success=false with clear setup instructions
      return NextResponse.json({
        success: false,
        configured: false,
        error:
          "Weekly digests require UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN. " +
          "See verso README for setup instructions.",
      });
    }

    const result = await saveSubscription(sub);
    return NextResponse.json({ ...result, configured });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
