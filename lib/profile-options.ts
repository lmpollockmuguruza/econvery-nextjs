/**
 * Profile Options for Econvery
 * ═══════════════════════════════════════════════════════════════════════════
 * Configuration options for user profiles including academic levels, fields,
 * research interests, methodologies, and regions.
 */

import type { ProfileOptions } from "./types";

export const ACADEMIC_LEVELS = [
  "Undergraduate",
  "Masters Student",
  "PhD Student",
  "Postdoc",
  "Assistant Professor",
  "Associate Professor",
  "Full Professor",
  "Industry Researcher",
  "Policy Analyst",
  "Independent Researcher",
] as const;

export const PRIMARY_FIELDS = [
  "Microeconomics",
  "Macroeconomics",
  "Econometrics",
  "Labor Economics",
  "Public Economics",
  "International Economics",
  "Development Economics",
  "Financial Economics",
  "Industrial Organization",
  "Behavioral Economics",
  "Health Economics",
  "Environmental Economics",
  "Urban Economics",
  "Economic History",
  "Political Economy",
  "Comparative Politics",
  "International Relations",
  "American Politics",
  "Public Policy",
  "Political Methodology",
] as const;

export const RESEARCH_INTERESTS = [
  "Causal Inference",
  "Machine Learning",
  "Field Experiments",
  "Natural Experiments",
  "Structural Estimation",
  "Mechanism Design",
  "Policy Evaluation",
  "Inequality",
  "Climate and Energy",
  "Education",
  "Housing",
  "Trade",
  "Monetary Policy",
  "Fiscal Policy",
  "Innovation",
  "Gender",
  "Crime and Justice",
  "Health",
  "Immigration",
  "Elections and Voting",
  "Conflict and Security",
  "Social Mobility",
  "Poverty and Welfare",
  "Labor Markets",
  "Taxation",
  "Development",
] as const;

export const METHODOLOGIES = [
  "Difference-in-Differences",
  "Regression Discontinuity",
  "Instrumental Variables",
  "Randomized Experiments",
  "Structural Models",
  "Machine Learning Methods",
  "Panel Data",
  "Time Series",
  "Text Analysis",
  "Synthetic Control",
  "Bunching Estimation",
  "Event Studies",
] as const;

export const REGIONS = [
  "Global",
  "United States",
  "Europe",
  "United Kingdom",
  "China",
  "India",
  "Latin America",
  "Africa",
  "Middle East",
  "Southeast Asia",
] as const;

export function getProfileOptions(): ProfileOptions {
  return {
    academic_levels: [...ACADEMIC_LEVELS],
    primary_fields: [...PRIMARY_FIELDS],
    interests: [...RESEARCH_INTERESTS],
    methods: [...METHODOLOGIES],
    regions: [...REGIONS],
  };
}
