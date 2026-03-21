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

/** Escape user-derived strings before inserting into HTML */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

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

  const fieldLabel = escapeHtml(
    profile.primary_field && profile.primary_field !== "General Interest (Show me everything)"
      ? profile.primary_field
      : "General Interest"
  );
  const safeRecipientName = escapeHtml(recipientName);

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const coreCount = papers.filter((p) => p.match_tier === "core").length;
  const exploreCount = papers.filter((p) => p.match_tier === "explore").length;
  const discoverCount = papers.filter((p) => p.match_tier === "discovery").length;

  // Group papers by tier for structured sections
  const corePapers = papers.filter((p) => p.match_tier === "core");
  const explorePapers = papers.filter((p) => p.match_tier === "explore");
  const discoveryPapers = papers.filter((p) => p.match_tier === "discovery");

  const renderPaperRow = (p: ScoredPaper, index: number) => {
    const authors = escapeHtml(
      p.authors.length <= 2 ? p.authors.join(" & ") : `${p.authors[0]} et al.`
    );
    const safeTitle = escapeHtml(p.title);
    const safeJournal = escapeHtml(p.journal);
    const link = p.doi_url || p.oa_url;
    const safeLink = link && /^https?:\/\//i.test(link) ? link : null;

    return `
      <tr>
        <td style="padding:0;vertical-align:top">
          <table cellpadding="0" cellspacing="0" width="100%" style="border-bottom:1px solid #e8e8e6">
            <tr>
              <!-- Index number -->
              <td style="padding:16px 0 16px 0;width:32px;vertical-align:top;font-family:'IBM Plex Mono',monospace;font-size:11px;color:#a0a0a0;text-align:right;padding-right:14px">
                ${String(index + 1).padStart(2, "0")}
              </td>
              <!-- Score -->
              <td style="padding:16px 0;width:36px;vertical-align:top;font-family:'IBM Plex Mono',monospace;font-size:12px;color:#6b2737;font-weight:600;letter-spacing:-0.02em">
                ${p.relevance_score.toFixed(1)}
              </td>
              <!-- Content -->
              <td style="padding:16px 0">
                ${safeLink
                  ? `<a href="${escapeHtml(safeLink)}" style="font-family:'Source Serif 4',Georgia,serif;font-size:15px;color:#1a1a1a;font-weight:500;text-decoration:none;line-height:1.45;letter-spacing:-0.01em">${safeTitle}</a>`
                  : `<span style="font-family:'Source Serif 4',Georgia,serif;font-size:15px;color:#1a1a1a;font-weight:500;line-height:1.45;letter-spacing:-0.01em">${safeTitle}</span>`
                }
                <div style="margin-top:5px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:#a0a0a0;line-height:1.4">
                  ${authors}
                </div>
                <div style="margin-top:2px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:#c0c0be">
                  ${safeJournal}${p.is_open_access ? ` · <span style="color:#2d6a4f">open access</span>` : ""}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  };

  const renderSection = (title: string, sectionPapers: ScoredPaper[], color: string, startIndex: number) => {
    if (!sectionPapers.length) return "";
    return `
      <tr>
        <td style="padding:24px 32px 0 32px">
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding-bottom:12px;border-bottom:2px solid ${color}">
                <span style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${color};font-weight:600">${title}</span>
                <span style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#a0a0a0;margin-left:8px">${sectionPapers.length}</span>
              </td>
            </tr>
            ${sectionPapers.slice(0, 15).map((p, i) => renderPaperRow(p, startIndex + i)).join("")}
          </table>
        </td>
      </tr>`;
  };

  // Interests list for the profile summary
  const interests = profile.interests?.length
    ? profile.interests.slice(0, 4).map(i => escapeHtml(i)).join(" · ")
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>verso — reading list for ${safeRecipientName}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table cellpadding="0" cellspacing="0" width="100%" style="background:#f5f5f3;padding:40px 16px">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto">

        <!-- Masthead -->
        <tr>
          <td style="padding:0 0 24px 0">
            <span style="font-family:Georgia,'Source Serif 4',serif;font-size:24px;letter-spacing:-0.03em;color:#1a1a1a;font-weight:400">verso</span>
          </td>
        </tr>

        <!-- Main card -->
        <tr>
          <td>
            <table cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff;border:1px solid #e2e2e0">

              <!-- Date bar -->
              <tr>
                <td style="padding:20px 32px;border-bottom:1px solid #e2e2e0">
                  <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#a0a0a0">
                        ${date}
                      </td>
                      <td align="right" style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#a0a0a0">
                        ${days}-day window
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Greeting -->
              <tr>
                <td style="padding:28px 32px 0 32px">
                  <p style="margin:0;font-family:'IBM Plex Sans',-apple-system,sans-serif;font-size:15px;color:#333;line-height:1.65">
                    Hi ${safeRecipientName}, here are ${papers.length} papers curated for your work in <strong style="color:#1a1a1a">${fieldLabel}</strong>.
                  </p>
                  ${interests ? `
                  <p style="margin:8px 0 0 0;font-family:'IBM Plex Mono',monospace;font-size:11px;color:#a0a0a0;line-height:1.5">
                    ${interests}
                  </p>` : ""}
                </td>
              </tr>

              <!-- Stats row -->
              <tr>
                <td style="padding:16px 32px 0 32px">
                  <table cellpadding="0" cellspacing="0" style="border:1px solid #e2e2e0;width:100%">
                    <tr>
                      <td style="padding:12px 16px;text-align:center;font-family:'IBM Plex Mono',monospace;font-size:12px;border-right:1px solid #e2e2e0">
                        <div style="color:#1a1a1a;font-weight:600;font-size:16px;letter-spacing:-0.02em">${papers.length}</div>
                        <div style="color:#a0a0a0;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;margin-top:2px">papers</div>
                      </td>
                      <td style="padding:12px 16px;text-align:center;font-family:'IBM Plex Mono',monospace;font-size:12px;border-right:1px solid #e2e2e0">
                        <div style="color:#2d6a4f;font-weight:600;font-size:16px;letter-spacing:-0.02em">${coreCount}</div>
                        <div style="color:#a0a0a0;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;margin-top:2px">core</div>
                      </td>
                      <td style="padding:12px 16px;text-align:center;font-family:'IBM Plex Mono',monospace;font-size:12px;border-right:1px solid #e2e2e0">
                        <div style="color:#6b2737;font-weight:600;font-size:16px;letter-spacing:-0.02em">${exploreCount}</div>
                        <div style="color:#a0a0a0;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;margin-top:2px">explore</div>
                      </td>
                      <td style="padding:12px 16px;text-align:center;font-family:'IBM Plex Mono',monospace;font-size:12px">
                        <div style="color:#8b6914;font-weight:600;font-size:16px;letter-spacing:-0.02em">${discoverCount}</div>
                        <div style="color:#a0a0a0;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;margin-top:2px">discovery</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Paper sections -->
              ${renderSection("Core", corePapers, "#2d6a4f", 0)}
              ${renderSection("Explore", explorePapers, "#6b2737", corePapers.length)}
              ${renderSection("Discovery", discoveryPapers, "#8b6914", corePapers.length + explorePapers.length)}

              <!-- Spacer before footer -->
              <tr><td style="height:28px"></td></tr>

            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 0">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#a0a0a0;line-height:1.6">
                  <a href="https://verso-nextjs.vercel.app" style="color:#6b2737;text-decoration:none;font-family:Georgia,serif;font-size:12px;letter-spacing:-0.02em">verso</a>
                  &nbsp;·&nbsp; recent research, surfaced for you
                </td>
              </tr>
            </table>
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
