/**
 * Journal Definitions for Econvery
 * ═══════════════════════════════════════════════════════════════════════════
 * Economics and Political Science journals organized by tier.
 * Tier 1 = Top journals, Tier 2 = Top field, Tier 3 = Excellent
 */

import type { Journal, JournalOptions } from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// ECONOMICS JOURNALS
// ═══════════════════════════════════════════════════════════════════════════

export const ECONOMICS_JOURNALS: Record<string, Journal> = {
  // Tier 1 - Top 5
  "American Economic Review": {
    name: "American Economic Review",
    issn: "0002-8282",
    field: "economics",
    tier: 1,
  },
  "Quarterly Journal of Economics": {
    name: "Quarterly Journal of Economics",
    issn: "0033-5533",
    field: "economics",
    tier: 1,
  },
  "Journal of Political Economy": {
    name: "Journal of Political Economy",
    issn: "0022-3808",
    field: "economics",
    tier: 1,
  },
  Econometrica: {
    name: "Econometrica",
    issn: "0012-9682",
    field: "economics",
    tier: 1,
  },
  "Review of Economic Studies": {
    name: "Review of Economic Studies",
    issn: "0034-6527",
    field: "economics",
    tier: 1,
  },
  // Tier 2 - Top Field
  "Journal of Finance": {
    name: "Journal of Finance",
    issn: "0022-1082",
    field: "economics",
    tier: 2,
  },
  "Review of Financial Studies": {
    name: "Review of Financial Studies",
    issn: "0893-9454",
    field: "economics",
    tier: 2,
  },
  "Journal of Financial Economics": {
    name: "Journal of Financial Economics",
    issn: "0304-405X",
    field: "economics",
    tier: 2,
  },
  "Journal of Monetary Economics": {
    name: "Journal of Monetary Economics",
    issn: "0304-3932",
    field: "economics",
    tier: 2,
  },
  "Journal of Economic Theory": {
    name: "Journal of Economic Theory",
    issn: "0022-0531",
    field: "economics",
    tier: 2,
  },
  "AEJ: Applied Economics": {
    name: "AEJ: Applied Economics",
    issn: "1945-7782",
    field: "economics",
    tier: 2,
  },
  "AEJ: Economic Policy": {
    name: "AEJ: Economic Policy",
    issn: "1945-7731",
    field: "economics",
    tier: 2,
  },
  "AEJ: Macroeconomics": {
    name: "AEJ: Macroeconomics",
    issn: "1945-7707",
    field: "economics",
    tier: 2,
  },
  "AEJ: Microeconomics": {
    name: "AEJ: Microeconomics",
    issn: "1945-7669",
    field: "economics",
    tier: 2,
  },
  "Journal of Labor Economics": {
    name: "Journal of Labor Economics",
    issn: "0734-306X",
    field: "economics",
    tier: 2,
  },
  "Journal of Public Economics": {
    name: "Journal of Public Economics",
    issn: "0047-2727",
    field: "economics",
    tier: 2,
  },
  "Journal of Human Resources": {
    name: "Journal of Human Resources",
    issn: "0022-166X",
    field: "economics",
    tier: 2,
  },
  "Journal of Economic Perspectives": {
    name: "Journal of Economic Perspectives",
    issn: "0895-3309",
    field: "economics",
    tier: 2,
  },
  // Tier 3 - Excellent
  "Review of Economics and Statistics": {
    name: "Review of Economics and Statistics",
    issn: "0034-6535",
    field: "economics",
    tier: 3,
  },
  "Journal of the European Economic Association": {
    name: "Journal of the European Economic Association",
    issn: "1542-4766",
    field: "economics",
    tier: 3,
  },
  "Economic Journal": {
    name: "Economic Journal",
    issn: "0013-0133",
    field: "economics",
    tier: 3,
  },
  "Journal of Development Economics": {
    name: "Journal of Development Economics",
    issn: "0304-3878",
    field: "economics",
    tier: 3,
  },
  "Journal of International Economics": {
    name: "Journal of International Economics",
    issn: "0022-1996",
    field: "economics",
    tier: 3,
  },
  "Journal of Economic Growth": {
    name: "Journal of Economic Growth",
    issn: "1381-4338",
    field: "economics",
    tier: 3,
  },
  "Journal of Applied Econometrics": {
    name: "Journal of Applied Econometrics",
    issn: "0883-7252",
    field: "economics",
    tier: 3,
  },
  "Journal of Business & Economic Statistics": {
    name: "Journal of Business & Economic Statistics",
    issn: "0735-0015",
    field: "economics",
    tier: 3,
  },
  "Economic Policy": {
    name: "Economic Policy",
    issn: "0266-4658",
    field: "economics",
    tier: 3,
  },
  "Journal of Economic Literature": {
    name: "Journal of Economic Literature",
    issn: "0022-0515",
    field: "economics",
    tier: 3,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// POLITICAL SCIENCE JOURNALS
// ═══════════════════════════════════════════════════════════════════════════

export const POLISCI_JOURNALS: Record<string, Journal> = {
  // Tier 1 - Top 3
  "American Political Science Review": {
    name: "American Political Science Review",
    issn: "0003-0554",
    field: "polisci",
    tier: 1,
  },
  "American Journal of Political Science": {
    name: "American Journal of Political Science",
    issn: "0092-5853",
    field: "polisci",
    tier: 1,
  },
  "Journal of Politics": {
    name: "Journal of Politics",
    issn: "0022-3816",
    field: "polisci",
    tier: 1,
  },
  // Tier 2 - Top Field
  "Quarterly Journal of Political Science": {
    name: "Quarterly Journal of Political Science",
    issn: "1554-0626",
    field: "polisci",
    tier: 2,
  },
  "British Journal of Political Science": {
    name: "British Journal of Political Science",
    issn: "0007-1234",
    field: "polisci",
    tier: 2,
  },
  "World Politics": {
    name: "World Politics",
    issn: "0043-8871",
    field: "polisci",
    tier: 2,
  },
  "Comparative Political Studies": {
    name: "Comparative Political Studies",
    issn: "0010-4140",
    field: "polisci",
    tier: 2,
  },
  "International Organization": {
    name: "International Organization",
    issn: "0020-8183",
    field: "polisci",
    tier: 2,
  },
  "Political Analysis": {
    name: "Political Analysis",
    issn: "1047-1987",
    field: "polisci",
    tier: 2,
  },
  "Annual Review of Political Science": {
    name: "Annual Review of Political Science",
    issn: "1094-2939",
    field: "polisci",
    tier: 2,
  },
  "Political Science Research and Methods": {
    name: "Political Science Research and Methods",
    issn: "2049-8470",
    field: "polisci",
    tier: 2,
  },
  "Journal of Conflict Resolution": {
    name: "Journal of Conflict Resolution",
    issn: "0022-0027",
    field: "polisci",
    tier: 2,
  },
  "International Security": {
    name: "International Security",
    issn: "0162-2889",
    field: "polisci",
    tier: 2,
  },
  // Tier 3 - Excellent
  "International Studies Quarterly": {
    name: "International Studies Quarterly",
    issn: "0020-8833",
    field: "polisci",
    tier: 3,
  },
  "Comparative Politics": {
    name: "Comparative Politics",
    issn: "0010-4159",
    field: "polisci",
    tier: 3,
  },
  "Political Behavior": {
    name: "Political Behavior",
    issn: "0190-9320",
    field: "polisci",
    tier: 3,
  },
  "Public Opinion Quarterly": {
    name: "Public Opinion Quarterly",
    issn: "0033-362X",
    field: "polisci",
    tier: 3,
  },
  "Legislative Studies Quarterly": {
    name: "Legislative Studies Quarterly",
    issn: "0362-9805",
    field: "polisci",
    tier: 3,
  },
  "European Journal of Political Research": {
    name: "European Journal of Political Research",
    issn: "0304-4130",
    field: "polisci",
    tier: 3,
  },
  "Journal of Peace Research": {
    name: "Journal of Peace Research",
    issn: "0022-3433",
    field: "polisci",
    tier: 3,
  },
  "Political Science Quarterly": {
    name: "Political Science Quarterly",
    issn: "0032-3195",
    field: "polisci",
    tier: 3,
  },
  "Perspectives on Politics": {
    name: "Perspectives on Politics",
    issn: "1537-5927",
    field: "polisci",
    tier: 3,
  },
};

// Combined journals
export const ALL_JOURNALS: Record<string, Journal> = {
  ...ECONOMICS_JOURNALS,
  ...POLISCI_JOURNALS,
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function getEconomicsJournals(): string[] {
  return Object.keys(ECONOMICS_JOURNALS);
}

export function getPolisciJournals(): string[] {
  return Object.keys(POLISCI_JOURNALS);
}

export function getAllJournals(): string[] {
  return Object.keys(ALL_JOURNALS);
}

export function getJournalOptions(): JournalOptions {
  return {
    economics: {
      tier1: Object.entries(ECONOMICS_JOURNALS)
        .filter(([, j]) => j.tier === 1)
        .map(([name]) => name),
      tier2: Object.entries(ECONOMICS_JOURNALS)
        .filter(([, j]) => j.tier === 2)
        .map(([name]) => name),
      tier3: Object.entries(ECONOMICS_JOURNALS)
        .filter(([, j]) => j.tier === 3)
        .map(([name]) => name),
    },
    polisci: {
      tier1: Object.entries(POLISCI_JOURNALS)
        .filter(([, j]) => j.tier === 1)
        .map(([name]) => name),
      tier2: Object.entries(POLISCI_JOURNALS)
        .filter(([, j]) => j.tier === 2)
        .map(([name]) => name),
      tier3: Object.entries(POLISCI_JOURNALS)
        .filter(([, j]) => j.tier === 3)
        .map(([name]) => name),
    },
  };
}

export function getJournalsByTier(
  field: "economics" | "polisci" | "both",
  tiers: number[]
): string[] {
  let journals: Record<string, Journal>;

  if (field === "economics") {
    journals = ECONOMICS_JOURNALS;
  } else if (field === "polisci") {
    journals = POLISCI_JOURNALS;
  } else {
    journals = ALL_JOURNALS;
  }

  return Object.entries(journals)
    .filter(([, j]) => tiers.includes(j.tier))
    .map(([name]) => name);
}
