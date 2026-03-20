/**
 * Email Utilities — reading list delivery via Resend
 * ═══════════════════════════════════════════════════════════════════════════
 * Uses the Resend REST API directly (no npm package) to send HTML emails.
 *
 * Required environment variables:
 *   RESEND_API_KEY   — from resend.com (free tier: 3,000 emails/month)
 *   RESEND_FROM      — verified sender address (e.g. "verso@yourdomain.com")
 *                      Defaults to "verso@resend.dev" for testing
 *
 * Weekly digest subscriptions are stored via the Upstash Redis REST API:
 *   UPSTASH_REDIS_REST_URL    — from upstash.com (free tier available)
 *   UPSTASH_REDIS_REST_TOKEN  — from upstash.com
 */

import type { ScoredPaper, UserProfile } from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface DigestEmailData {
  recipientEmail: string;
  recipientName: string;
  papers: ScoredPaper[];
  profile: UserProfile;
  days: number;
}

export interface DigestSubscription {
  email: string;
  name: string;
  /** Base64-encoded JSON of UserProfile — regenerated at send time */
  encodedProfile: string;
  journals: string[];
  days: number;
  subscribedAt: string;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HTML TEMPLATE
// ═══════════════════════════════════════════════════════════════════════════

function tierBadgeStyle(tier?: "core" | "explore" | "discovery"): string {
  switch (tier) {
    case "core":      return "background:#d1fae5;color:#065f46;border:1px solid #a7f3d0";
    case "explore":   return "background:#fdf2f8;color:#701a75;border:1px solid #f5d0fe";
    case "discovery": return "background:#fefce8;color:#713f12;border:1px solid #fef08a";
    default:          return "background:#f3f4f6;color:#374151;border:1px solid #d1d5db";
  }
}

export function generateDigestHtml(data: DigestEmailData): string {
  const { recipientName, papers, profile, days } = data;

  const fieldLabel =
    profile.primary_field && profile.primary_field !== "General Interest (Show me everything)"
      ? profile.primary_field
      : "General Interest";

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const coreCount = papers.filter((p) => p.match_tier === "core").length;
  const exploreCount = papers.filter((p) => p.match_tier === "explore").length;
  const discoverCount = papers.filter((p) => p.match_tier === "discovery").length;

  const paperRows = papers
    .slice(0, 20) // cap email at 20 papers to keep size reasonable
    .map((p) => {
      const authors =
        p.authors.length <= 2 ? p.authors.join(" & ") : `${p.authors[0]} et al.`;
      const link = p.doi_url || p.oa_url;
      const tierStyle = tierBadgeStyle(p.match_tier);
      const tierLabel =
        p.match_tier === "core" ? "Core"
        : p.match_tier === "explore" ? "Explore"
        : p.match_tier === "discovery" ? "Discovery"
        : "";

      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #e5e7eb;vertical-align:top">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="font-family:monospace;font-size:13px;color:#6b2737;font-weight:600;padding-right:12px;white-space:nowrap;vertical-align:top;padding-top:3px">
                  ${p.relevance_score.toFixed(1)}
                </td>
                <td>
                  ${link
                    ? `<a href="${link}" style="font-size:15px;color:#111;font-weight:500;text-decoration:none;line-height:1.4">${p.title}</a>`
                    : `<span style="font-size:15px;color:#111;font-weight:500;line-height:1.4">${p.title}</span>`
                  }
                  <div style="margin-top:4px;font-family:monospace;font-size:12px;color:#9ca3af">
                    ${authors} · ${p.journal}
                  </div>
                  ${tierLabel
                    ? `<span style="display:inline-block;margin-top:6px;padding:2px 6px;font-family:monospace;font-size:10px;letter-spacing:0.05em;text-transform:uppercase;${tierStyle}">${tierLabel}</span>`
                    : ""
                  }
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>verso — reading list for ${recipientName}</title>
</head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table cellpadding="0" cellspacing="0" width="100%" style="background:#fafaf8;padding:32px 16px">
    <tr><td>
      <table cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e5e7eb">

        <!-- Header -->
        <tr>
          <td style="padding:24px 28px;border-bottom:1px solid #e5e7eb">
            <span style="font-family:Georgia,serif;font-size:22px;letter-spacing:-0.02em;color:#1a1a1a">verso</span>
            <div style="margin-top:6px;font-family:monospace;font-size:11px;color:#a0a0a0">
              ${date} · ${days}-day window
            </div>
          </td>
        </tr>

        <!-- Intro -->
        <tr>
          <td style="padding:20px 28px;border-bottom:1px solid #e5e7eb">
            <p style="margin:0;font-size:15px;color:#374151;line-height:1.6">
              Hi ${recipientName}, here is your curated reading list for <strong>${fieldLabel}</strong>.
            </p>
            <div style="margin-top:12px;font-family:monospace;font-size:11px;color:#a0a0a0">
              ${papers.length} papers &nbsp;·&nbsp;
              <span style="color:#065f46">${coreCount} core</span> &nbsp;·&nbsp;
              <span style="color:#701a75">${exploreCount} explore</span> &nbsp;·&nbsp;
              <span style="color:#713f12">${discoverCount} discovery</span>
            </div>
          </td>
        </tr>

        <!-- Papers -->
        <tr>
          <td style="padding:0 28px">
            <table cellpadding="0" cellspacing="0" width="100%">
              ${paperRows}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 28px;border-top:1px solid #e5e7eb">
            <p style="margin:0;font-family:monospace;font-size:11px;color:#a0a0a0;line-height:1.6">
              Sent by <a href="https://verso-nextjs.vercel.app" style="color:#6b2737;text-decoration:none">verso</a>
              · recent research, surfaced for you
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SEND EMAIL VIA RESEND
// ═══════════════════════════════════════════════════════════════════════════

export async function sendDigestEmail(data: DigestEmailData): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  const from = process.env.RESEND_FROM ?? "verso <verso@resend.dev>";
  const fieldLabel =
    data.profile.primary_field && data.profile.primary_field !== "General Interest (Show me everything)"
      ? data.profile.primary_field
      : "research";

  const subject = `verso — your ${fieldLabel} reading list (${data.papers.length} papers)`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [data.recipientEmail],
        subject,
        html: generateDigestHtml(data),
      }),
    });

    const body = await res.json();

    if (!res.ok) {
      return { success: false, error: body.message ?? `HTTP ${res.status}` };
    }

    return { success: true, id: body.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION STORAGE VIA UPSTASH REDIS REST API
// ═══════════════════════════════════════════════════════════════════════════

function getUpstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

async function upstashRequest(
  config: { url: string; token: string },
  ...commands: (string | number)[]
): Promise<unknown> {
  const res = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`Upstash error: ${res.status}`);
  const data = await res.json();
  return data.result;
}

const SUBS_KEY = "verso:subscriptions";

export async function saveSubscription(sub: DigestSubscription): Promise<{ success: boolean; error?: string }> {
  const config = getUpstashConfig();
  if (!config) {
    return { success: false, error: "UPSTASH_REDIS_REST_URL / _TOKEN not configured" };
  }
  try {
    await upstashRequest(config, "HSET", SUBS_KEY, sub.email, JSON.stringify(sub));
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function removeSubscription(email: string): Promise<void> {
  const config = getUpstashConfig();
  if (!config) return;
  await upstashRequest(config, "HDEL", SUBS_KEY, email);
}

export async function getAllSubscriptions(): Promise<DigestSubscription[]> {
  const config = getUpstashConfig();
  if (!config) return [];
  try {
    const result = await upstashRequest(config, "HGETALL", SUBS_KEY);
    if (!result || !Array.isArray(result)) return [];

    const subs: DigestSubscription[] = [];
    for (let i = 1; i < result.length; i += 2) {
      try {
        subs.push(JSON.parse(result[i] as string) as DigestSubscription);
      } catch {
        // skip malformed entries
      }
    }
    return subs;
  } catch {
    return [];
  }
}
