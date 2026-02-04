/**
 * Relevance Scoring Engine for Econvery
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * A principled approach to matching academic papers to researcher profiles.
 * 
 * SCORING PHILOSOPHY
 * ------------------
 * We use multiple independent signals, each interpretable on its own:
 * 
 * 1. CONCEPT MATCH (Primary Signal)
 *    - OpenAlex extracts ML-classified concepts with confidence scores
 *    - We map user interests → OpenAlex concept names
 *    - This is our most reliable signal (pre-computed by ML, not keyword hacking)
 * 
 * 2. KEYWORD MATCH (Secondary Signal)
 *    - Searches title + abstract for domain-specific terms
 *    - Uses canonical terms + synonyms to catch variations
 *    - Weighted by term specificity (rare terms = stronger signal)
 * 
 * 3. METHOD DETECTION
 *    - Looks for methodology-specific vocabulary
 *    - Methods are usually explicitly stated in abstracts
 * 
 * 4. QUALITY SIGNALS
 *    - Journal tier (reliable proxy for quality)
 *    - Citation count (for papers with time to accumulate)
 * 
 * SCORE INTERPRETATION
 * --------------------
 * Final scores are calibrated to be meaningful:
 * - 8.5-10.0: Directly relevant — multiple strong matches
 * - 7.0-8.4:  Highly relevant — at least one strong match
 * - 5.0-6.9:  Moderately relevant — partial matches
 * - 3.0-4.9:  Tangentially relevant — weak connections
 * - 1.0-2.9:  Low relevance — minimal overlap
 */

import type { KeywordEntry, MatchScore, Paper, ScoredPaper, UserProfile } from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// CONCEPT MAPPING
// Maps user-facing interest names → OpenAlex concept names (case-insensitive)
// ═══════════════════════════════════════════════════════════════════════════

export const INTEREST_TO_CONCEPTS: Record<string, string[]> = {
  "Causal Inference": [
    "causal inference", "causality", "treatment effect", "instrumental variable",
    "regression discontinuity", "natural experiment", "randomized experiment",
    "econometrics", "identification"
  ],
  "Machine Learning": [
    "machine learning", "artificial intelligence", "deep learning",
    "neural network", "prediction", "statistical learning", "data science"
  ],
  "Field Experiments": [
    "randomized controlled trial", "field experiment", "randomized experiment",
    "experimental economics", "rct", "experiment"
  ],
  "Natural Experiments": [
    "natural experiment", "quasi-experiment", "regression discontinuity",
    "instrumental variable", "difference in differences", "policy evaluation"
  ],
  "Structural Estimation": [
    "structural estimation", "structural model", "discrete choice",
    "demand estimation", "dynamic programming", "industrial organization"
  ],
  "Mechanism Design": [
    "mechanism design", "auction", "matching", "market design",
    "game theory", "information economics", "contract theory"
  ],
  "Policy Evaluation": [
    "policy evaluation", "program evaluation", "impact evaluation",
    "policy analysis", "cost-benefit analysis", "public policy"
  ],
  "Inequality": [
    "inequality", "income distribution", "wealth distribution",
    "economic inequality", "income inequality", "social mobility",
    "poverty", "redistribution", "gini"
  ],
  "Climate and Energy": [
    "climate change", "climate economics", "environmental economics",
    "energy economics", "carbon", "renewable energy", "emissions",
    "pollution", "sustainability"
  ],
  "Education": [
    "education economics", "education", "human capital", "school",
    "student achievement", "higher education", "returns to education",
    "teacher", "college"
  ],
  "Housing": [
    "housing", "real estate", "housing market", "rent", "mortgage",
    "urban economics", "housing policy", "homeownership", "zoning"
  ],
  "Trade": [
    "international trade", "trade policy", "globalization", "tariff",
    "trade agreement", "export", "import", "comparative advantage"
  ],
  "Monetary Policy": [
    "monetary policy", "central bank", "interest rate", "inflation",
    "money supply", "federal reserve", "monetary economics", "banking"
  ],
  "Fiscal Policy": [
    "fiscal policy", "government spending", "taxation", "public debt",
    "budget deficit", "stimulus", "public finance"
  ],
  "Innovation": [
    "innovation", "technological change", "patent", "r&d",
    "entrepreneurship", "productivity", "technology", "startup"
  ],
  "Gender": [
    "gender", "gender economics", "gender gap", "discrimination",
    "female labor", "wage gap", "women", "family economics"
  ],
  "Crime and Justice": [
    "crime", "criminal justice", "law enforcement", "prison",
    "incarceration", "policing", "recidivism", "law and economics"
  ],
  "Health": [
    "health economics", "healthcare", "public health", "mortality",
    "health insurance", "epidemiology", "medical", "hospital"
  ],
  "Immigration": [
    "immigration", "migration", "immigrant", "refugee",
    "labor migration", "international migration", "asylum"
  ],
  "Elections and Voting": [
    "election", "voting", "political economy", "voter turnout",
    "electoral", "democracy", "political participation", "campaign"
  ],
  "Conflict and Security": [
    "conflict", "war", "civil war", "political violence",
    "security", "peace", "military", "international relations"
  ],
  "Social Mobility": [
    "social mobility", "intergenerational mobility", "economic mobility",
    "income mobility", "opportunity", "inequality"
  ],
  "Poverty and Welfare": [
    "poverty", "welfare", "social protection", "transfer program",
    "food stamps", "social assistance", "safety net", "aid"
  ],
  "Labor Markets": [
    "labor market", "labor economics", "employment", "unemployment",
    "wage", "job search", "labor supply", "labor demand", "minimum wage"
  ],
  "Taxation": [
    "taxation", "tax policy", "income tax", "tax evasion",
    "optimal taxation", "tax incidence", "corporate tax", "public finance"
  ],
  "Development": [
    "development economics", "economic development", "poverty",
    "developing country", "foreign aid", "microfinance", "growth"
  ]
};

export const FIELD_TO_CONCEPTS: Record<string, string[]> = {
  "Microeconomics": ["microeconomics", "consumer behavior", "market", "game theory", "industrial organization", "welfare economics"],
  "Macroeconomics": ["macroeconomics", "economic growth", "business cycle", "monetary economics", "gdp", "inflation"],
  "Econometrics": ["econometrics", "statistical method", "causal inference", "estimation", "regression"],
  "Labor Economics": ["labor economics", "wage", "employment", "human capital", "labor market", "unemployment"],
  "Public Economics": ["public economics", "taxation", "public finance", "government", "welfare", "redistribution"],
  "International Economics": ["international economics", "international trade", "exchange rate", "globalization", "tariff"],
  "Development Economics": ["development economics", "poverty", "economic development", "foreign aid", "microfinance"],
  "Financial Economics": ["finance", "financial economics", "asset pricing", "banking", "stock market", "credit"],
  "Industrial Organization": ["industrial organization", "competition", "antitrust", "market structure", "monopoly"],
  "Behavioral Economics": ["behavioral economics", "psychology", "decision making", "bounded rationality", "bias"],
  "Health Economics": ["health economics", "healthcare", "health insurance", "medical", "mortality"],
  "Environmental Economics": ["environmental economics", "climate", "pollution", "energy", "carbon"],
  "Urban Economics": ["urban economics", "housing", "city", "real estate", "agglomeration", "rent"],
  "Economic History": ["economic history", "history", "historical economics", "long run"],
  "Political Economy": ["political economy", "institution", "democracy", "political economics", "voting"],
  "Comparative Politics": ["comparative politics", "regime", "democracy", "political system", "government"],
  "International Relations": ["international relations", "foreign policy", "diplomacy", "conflict", "war"],
  "American Politics": ["american politics", "congress", "election", "united states", "president"],
  "Public Policy": ["public policy", "policy analysis", "regulation", "government", "reform"],
  "Political Methodology": ["political methodology", "quantitative methods", "causal inference", "measurement"]
};

// ═══════════════════════════════════════════════════════════════════════════
// KEYWORD DEFINITIONS WITH SYNONYMS
// ═══════════════════════════════════════════════════════════════════════════

export const METHOD_KEYWORDS: Record<string, KeywordEntry> = {
  "Difference-in-Differences": {
    canonical: "difference-in-differences",
    synonyms: [
      "diff-in-diff", "did ", "difference in differences", "parallel trends",
      "two-way fixed effects", "twfe", "staggered", "event study", "pretrend",
      "treated group", "control group", "treatment group"
    ],
    weight: 1.0
  },
  "Regression Discontinuity": {
    canonical: "regression discontinuity",
    synonyms: [
      "rdd", "rd design", "discontinuity", "sharp rd", "fuzzy rd",
      "running variable", "forcing variable", "cutoff", "threshold",
      "bandwidth", "local polynomial"
    ],
    weight: 1.0
  },
  "Instrumental Variables": {
    canonical: "instrumental variable",
    synonyms: [
      "iv ", " iv,", "instrument", "2sls", "two-stage", "tsls",
      "exclusion restriction", "first stage", "first-stage",
      "weak instrument", "late", "local average treatment effect", "complier"
    ],
    weight: 1.0
  },
  "Randomized Experiments": {
    canonical: "randomized",
    synonyms: [
      "rct", "randomized controlled trial", "randomized trial", "randomised",
      "random assignment", "randomization", "field experiment", "lab experiment",
      "experimental", "treatment group", "control group", "intent to treat",
      "intention to treat", "randomly assigned", "random sample"
    ],
    weight: 1.0
  },
  "Structural Models": {
    canonical: "structural model",
    synonyms: [
      "structural estimation", "structural approach", "discrete choice model",
      "blp", "demand estimation", "supply estimation", "dynamic model",
      "counterfactual simulation", "estimated model", "model estimation"
    ],
    weight: 1.0
  },
  "Machine Learning Methods": {
    canonical: "machine learning",
    synonyms: [
      "lasso", "ridge regression", "elastic net", "random forest",
      "gradient boosting", "neural network", "deep learning", "causal forest",
      "double ml", "cross-validation", "regularization", "prediction model",
      "xgboost", "boosted"
    ],
    weight: 0.95
  },
  "Panel Data": {
    canonical: "panel data",
    synonyms: [
      "fixed effects", "fixed effect", "random effects", "within estimator",
      "longitudinal", "panel regression", "individual fixed effects",
      "time fixed effects", "entity fixed effects", "year fixed effects"
    ],
    weight: 0.85
  },
  "Time Series": {
    canonical: "time series",
    synonyms: [
      "var ", "vector autoregression", "arima", "cointegration",
      "granger causality", "impulse response", "forecast", "autoregressive"
    ],
    weight: 0.85
  },
  "Text Analysis": {
    canonical: "text analysis",
    synonyms: [
      "nlp", "natural language processing", "text mining", "topic model",
      "sentiment analysis", "word embedding", "text classification",
      "lda", "word2vec", "corpus"
    ],
    weight: 0.95
  },
  "Synthetic Control": {
    canonical: "synthetic control",
    synonyms: [
      "synthetic control method", "scm", "donor pool", "synthetic counterfactual",
      "abadie", "comparative case study"
    ],
    weight: 1.0
  },
  "Bunching Estimation": {
    canonical: "bunching",
    synonyms: [
      "bunching estimation", "bunching design", "kink", "notch",
      "excess mass", "missing mass"
    ],
    weight: 1.0
  },
  "Event Studies": {
    canonical: "event study",
    synonyms: [
      "event-study", "event window", "abnormal return", "announcement effect"
    ],
    weight: 0.9
  }
};

export const INTEREST_KEYWORDS: Record<string, KeywordEntry> = {
  "Causal Inference": {
    canonical: "causal",
    synonyms: [
      "causal effect", "causal inference", "causality", "causal identification",
      "identification strategy", "treatment effect", "causal impact",
      "endogeneity", "selection bias", "omitted variable", "confounding",
      "causal estimate", "causally"
    ],
    weight: 1.0
  },
  "Inequality": {
    canonical: "inequality",
    synonyms: [
      "income inequality", "wealth inequality", "economic inequality",
      "income distribution", "wealth distribution", "gini coefficient",
      "top 1%", "top income", "top 10%", "redistribution", "intergenerational",
      "income gap", "wage inequality", "earnings inequality"
    ],
    weight: 1.0
  },
  "Education": {
    canonical: "education",
    synonyms: [
      "school", "student", "teacher", "college", "university",
      "test score", "achievement gap", "graduation", "dropout",
      "returns to education", "human capital", "educational attainment",
      "classroom", "tuition", "enrollment", "academic"
    ],
    weight: 0.9
  },
  "Housing": {
    canonical: "housing",
    synonyms: [
      "house price", "home price", "rent", "rental", "mortgage",
      "homeownership", "housing market", "real estate", "zoning",
      "affordability", "eviction", "homelessness", "tenant", "landlord",
      "housing supply", "residential"
    ],
    weight: 1.0
  },
  "Health": {
    canonical: "health",
    synonyms: [
      "healthcare", "hospital", "physician", "doctor", "patient",
      "mortality", "morbidity", "life expectancy", "disease",
      "health insurance", "medicare", "medicaid", "aca", "obamacare",
      "medical", "clinical", "epidemic", "pandemic"
    ],
    weight: 0.9
  },
  "Immigration": {
    canonical: "immigration",
    synonyms: [
      "immigrant", "migration", "migrant", "refugee", "asylum",
      "foreign-born", "native-born", "undocumented", "visa", "border",
      "deportation", "naturalization", "citizenship"
    ],
    weight: 1.0
  },
  "Crime and Justice": {
    canonical: "crime",
    synonyms: [
      "criminal", "police", "policing", "prison", "incarceration",
      "recidivism", "sentencing", "arrest", "violence", "homicide",
      "theft", "robbery", "assault", "prosecution", "conviction"
    ],
    weight: 1.0
  },
  "Gender": {
    canonical: "gender",
    synonyms: [
      "female", "women", "woman", "male", "men", "sex difference",
      "gender gap", "wage gap", "discrimination", "motherhood",
      "child penalty", "fertility", "family", "maternity", "paternity"
    ],
    weight: 0.9
  },
  "Climate and Energy": {
    canonical: "climate",
    synonyms: [
      "climate change", "global warming", "carbon", "emissions",
      "greenhouse gas", "renewable", "energy", "fossil fuel",
      "carbon tax", "cap and trade", "electricity", "solar", "wind",
      "environmental", "pollution", "clean energy"
    ],
    weight: 1.0
  },
  "Trade": {
    canonical: "trade",
    synonyms: [
      "international trade", "tariff", "import", "export",
      "globalization", "trade policy", "trade war", "china shock",
      "offshoring", "outsourcing", "comparative advantage", "wto",
      "trade agreement", "trade liberalization"
    ],
    weight: 1.0
  },
  "Labor Markets": {
    canonical: "labor",
    synonyms: [
      "labour", "employment", "unemployment", "wage", "wages",
      "worker", "job", "hiring", "layoff", "minimum wage",
      "labor supply", "labor demand", "earnings", "workforce",
      "occupation", "employer", "employee"
    ],
    weight: 0.85
  },
  "Poverty and Welfare": {
    canonical: "poverty",
    synonyms: [
      "poor", "welfare", "social assistance", "transfer",
      "food stamp", "snap", "eitc", "safety net", "benefit",
      "low-income", "low income", "disadvantaged", "tanf"
    ],
    weight: 1.0
  },
  "Taxation": {
    canonical: "tax",
    synonyms: [
      "taxation", "income tax", "corporate tax", "tax rate",
      "tax evasion", "tax avoidance", "tax policy", "tax reform",
      "marginal tax", "progressive tax", "tax revenue", "taxpayer"
    ],
    weight: 1.0
  },
  "Monetary Policy": {
    canonical: "monetary policy",
    synonyms: [
      "central bank", "federal reserve", "fed ", "interest rate",
      "inflation", "money supply", "quantitative easing", "qe",
      "zero lower bound", "monetary transmission"
    ],
    weight: 1.0
  },
  "Fiscal Policy": {
    canonical: "fiscal",
    synonyms: [
      "government spending", "fiscal policy", "stimulus", "austerity",
      "deficit", "debt", "multiplier", "budget", "public spending"
    ],
    weight: 1.0
  },
  "Innovation": {
    canonical: "innovation",
    synonyms: [
      "patent", "r&d", "research and development", "invention",
      "entrepreneur", "startup", "technology", "productivity",
      "technological change", "creative destruction"
    ],
    weight: 0.9
  },
  "Development": {
    canonical: "development",
    synonyms: [
      "developing country", "developing world", "poor country",
      "foreign aid", "microfinance", "microcredit", "poverty reduction",
      "economic development", "third world", "global south"
    ],
    weight: 0.9
  },
  "Elections and Voting": {
    canonical: "election",
    synonyms: [
      "vote", "voting", "voter", "ballot", "electoral",
      "turnout", "campaign", "candidate", "polling", "poll",
      "democrat", "republican", "partisan"
    ],
    weight: 1.0
  },
  "Social Mobility": {
    canonical: "mobility",
    synonyms: [
      "intergenerational", "upward mobility", "downward mobility",
      "economic mobility", "income mobility", "opportunity",
      "social mobility", "class", "socioeconomic"
    ],
    weight: 1.0
  },
  "Conflict and Security": {
    canonical: "conflict",
    synonyms: [
      "war", "civil war", "violence", "military", "peace",
      "terrorism", "security", "battle", "casualty", "armed"
    ],
    weight: 1.0
  },
  "Field Experiments": {
    canonical: "field experiment",
    synonyms: [
      "rct", "randomized controlled", "randomized experiment",
      "randomization", "treatment arm", "control arm", "random assignment"
    ],
    weight: 1.0
  },
  "Natural Experiments": {
    canonical: "natural experiment",
    synonyms: [
      "quasi-experiment", "exogenous shock", "policy change",
      "reform", "plausibly exogenous", "exogenous variation"
    ],
    weight: 1.0
  },
  "Structural Estimation": {
    canonical: "structural",
    synonyms: [
      "structural model", "discrete choice", "demand estimation",
      "counterfactual", "structural estimation"
    ],
    weight: 1.0
  },
  "Mechanism Design": {
    canonical: "mechanism design",
    synonyms: [
      "auction", "matching market", "market design", "allocation mechanism"
    ],
    weight: 1.0
  },
  "Policy Evaluation": {
    canonical: "policy evaluation",
    synonyms: [
      "program evaluation", "impact evaluation", "effectiveness",
      "cost-benefit", "policy analysis", "intervention"
    ],
    weight: 1.0
  },
  "Machine Learning": {
    canonical: "machine learning",
    synonyms: [
      "ml ", "artificial intelligence", "ai ", "neural network",
      "deep learning", "prediction", "algorithm", "predictive"
    ],
    weight: 0.95
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// TEXT PROCESSING
// ═══════════════════════════════════════════════════════════════════════════

export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function textContainsAny(text: string, terms: string[]): boolean {
  const textNorm = normalizeText(text);
  return terms.some((term) => textNorm.includes(normalizeText(term)));
}

export function countKeywordMatches(
  text: string,
  entry: KeywordEntry
): [number, number] {
  const textNorm = normalizeText(text);
  const allTerms = [entry.canonical, ...entry.synonyms];

  let matches = 0;
  for (const term of allTerms) {
    const termNorm = normalizeText(term);
    if (termNorm && textNorm.includes(termNorm)) {
      matches++;
    }
  }

  // More matches = stronger signal (with diminishing returns)
  let score: number;
  if (matches === 0) {
    score = 0.0;
  } else if (matches === 1) {
    score = 0.6 * entry.weight;
  } else if (matches === 2) {
    score = 0.8 * entry.weight;
  } else {
    score = 1.0 * entry.weight;
  }

  return [matches, score];
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORING ENGINE
// ═══════════════════════════════════════════════════════════════════════════

const TIER_SCORES: Record<number, number> = { 1: 1.0, 2: 0.75, 3: 0.5, 4: 0.2 };

export class RelevanceScorer {
  private profile: UserProfile;
  private targetConcepts: Set<string>;
  private wConcept: number;
  private wInterest: number;
  private wMethod: number;
  private wQuality: number;

  constructor(profile: UserProfile) {
    this.profile = profile;

    // Build concept targets
    this.targetConcepts = new Set<string>();
    for (const interest of profile.interests) {
      if (INTEREST_TO_CONCEPTS[interest]) {
        for (const c of INTEREST_TO_CONCEPTS[interest]) {
          this.targetConcepts.add(normalizeText(c));
        }
      }
    }

    if (FIELD_TO_CONCEPTS[profile.primary_field]) {
      for (const c of FIELD_TO_CONCEPTS[profile.primary_field]) {
        this.targetConcepts.add(normalizeText(c));
      }
    }

    // Adaptive weights based on user emphasis
    const nMethods = Math.max(1, profile.methods.length);

    // Base weights
    this.wConcept = 0.30;
    this.wInterest = 0.30;
    this.wMethod = 0.25;
    this.wQuality = 0.15;

    // Adjust: more methods selected → weight methods higher
    if (nMethods >= 3) {
      this.wMethod += 0.05;
      this.wInterest -= 0.05;
    }
  }

  private scoreConcepts(paper: Paper): [number, string[]] {
    const concepts = paper.concepts || [];
    if (!concepts.length || !this.targetConcepts.size) {
      return [0.0, []];
    }

    const matched: string[] = [];
    let weightedSum = 0.0;

    for (const concept of concepts) {
      const name = normalizeText(concept.name || "");
      const conf = concept.score || 0;

      for (const target of this.targetConcepts) {
        // Flexible matching: either contains the other
        if (target.includes(name) || name.includes(target)) {
          matched.push(concept.name);
          weightedSum += conf;
          break;
        }
      }
    }

    // Normalize: 1.2 cumulative confidence = perfect score
    const score = Math.min(1.0, weightedSum / 1.2);
    return [score, matched.slice(0, 5)];
  }

  private scoreInterestKeywords(text: string): [number, string[]] {
    if (!this.profile.interests.length) {
      return [0.0, []];
    }

    const matched: string[] = [];
    const scores: number[] = [];

    for (let i = 0; i < this.profile.interests.length; i++) {
      const interest = this.profile.interests[i];
      if (!INTEREST_KEYWORDS[interest]) {
        scores.push(0.0);
        continue;
      }

      const entry = INTEREST_KEYWORDS[interest];
      const [count, score] = countKeywordMatches(text, entry);

      if (count > 0) {
        matched.push(interest);
      }

      // Position weight: first = 1.0, second = 0.9, etc.
      const posWeight = Math.max(0.6, 1.0 - i * 0.1);
      scores.push(score * posWeight);
    }

    if (!scores.length) {
      return [0.0, []];
    }

    // Take best score + bonus for multiple matches
    const best = Math.max(...scores);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

    let combined = best * 0.6 + avg * 0.4;

    // Bonus for multiple strong matches
    if (matched.length >= 3) {
      combined *= 1.25;
    } else if (matched.length >= 2) {
      combined *= 1.1;
    }

    return [Math.min(1.0, combined), matched];
  }

  private scoreMethods(text: string): [number, string[]] {
    if (!this.profile.methods.length) {
      return [0.0, []];
    }

    const matched: string[] = [];
    const scores: number[] = [];

    for (let i = 0; i < this.profile.methods.length; i++) {
      const method = this.profile.methods[i];
      if (!METHOD_KEYWORDS[method]) {
        scores.push(0.0);
        continue;
      }

      const entry = METHOD_KEYWORDS[method];
      const [count, score] = countKeywordMatches(text, entry);

      if (count > 0) {
        matched.push(method);
      }

      const posWeight = Math.max(0.5, 1.0 - i * 0.12);
      scores.push(score * posWeight);
    }

    if (!scores.length) {
      return [0.0, []];
    }

    const best = Math.max(...scores);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    let combined = best * 0.7 + avg * 0.3;

    if (matched.length >= 2) {
      combined *= 1.15;
    }

    return [Math.min(1.0, combined), matched];
  }

  private scoreQuality(paper: Paper): number {
    const tier = paper.journal_tier || 4;
    const tierScore = TIER_SCORES[tier] || 0.2;

    const cites = paper.cited_by_count || 0;
    let citeScore: number;
    if (cites >= 100) {
      citeScore = 1.0;
    } else if (cites >= 50) {
      citeScore = 0.85;
    } else if (cites >= 20) {
      citeScore = 0.7;
    } else if (cites >= 5) {
      citeScore = 0.5;
    } else {
      citeScore = 0.3;
    }

    return tierScore * 0.6 + citeScore * 0.4;
  }

  private buildExplanation(
    matchedInterests: string[],
    matchedMethods: string[],
    paper: Paper
  ): string {
    const parts: string[] = [];

    if (matchedInterests.length) {
      parts.push(matchedInterests.slice(0, 2).join(", "));
    }

    if (matchedMethods.length) {
      const methodsStr =
        matchedMethods.length === 1
          ? matchedMethods[0]
          : `${matchedMethods[0]} + more`;
      parts.push(`Uses ${methodsStr}`);
    }

    const tier = paper.journal_tier || 4;
    if (tier === 1) {
      parts.push("Top journal");
    } else if (tier === 2) {
      parts.push("Top field journal");
    }

    return parts.length ? parts.join(" · ") : "Related to your field";
  }

  public scorePaper(paper: Paper): MatchScore {
    const title = paper.title || "";
    const abstract = paper.abstract || "";
    // Title 3x weight
    const text = `${title} ${title} ${title} ${abstract}`;

    const [conceptScore, matchedConcepts] = this.scoreConcepts(paper);
    const [keywordScore, matchedInterests] = this.scoreInterestKeywords(text);
    const [methodScore, matchedMethods] = this.scoreMethods(text);
    const qualityScore = this.scoreQuality(paper);

    // Combine interest signals: best of concept OR keyword
    let interestCombined = Math.max(conceptScore, keywordScore);
    // But if both are good, give a bonus
    if (conceptScore > 0.3 && keywordScore > 0.3) {
      interestCombined = Math.min(1.0, interestCombined * 1.15);
    }

    // Weighted combination
    const raw =
      this.wConcept * conceptScore +
      this.wInterest * keywordScore +
      this.wMethod * methodScore +
      this.wQuality * qualityScore;

    // CALIBRATION to 1-10 scale
    // Designed so that:
    //   raw >= 0.45 → 8+ (excellent)
    //   raw >= 0.30 → 6.5+ (very good)
    //   raw >= 0.18 → 5+ (good)
    //   raw >= 0.10 → 3.5+ (some relevance)
    let final: number;
    if (raw >= 0.45) {
      final = 8.0 + ((raw - 0.45) / 0.55) * 2.0;
    } else if (raw >= 0.3) {
      final = 6.5 + ((raw - 0.3) / 0.15) * 1.5;
    } else if (raw >= 0.18) {
      final = 5.0 + ((raw - 0.18) / 0.12) * 1.5;
    } else if (raw >= 0.1) {
      final = 3.5 + ((raw - 0.1) / 0.08) * 1.5;
    } else {
      final = 1.0 + (raw / 0.1) * 2.5;
    }

    final = Math.max(1.0, Math.min(10.0, final));

    const explanation = this.buildExplanation(
      matchedInterests,
      matchedMethods,
      paper
    );

    return {
      total: Math.round(final * 10) / 10,
      concept_score: Math.round(conceptScore * 1000) / 1000,
      keyword_score: Math.round(keywordScore * 1000) / 1000,
      method_score: Math.round(methodScore * 1000) / 1000,
      quality_score: Math.round(qualityScore * 1000) / 1000,
      matched_interests: matchedInterests,
      matched_methods: matchedMethods,
      explanation,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

export function processPapers(
  profile: UserProfile,
  papers: Paper[]
): { papers: ScoredPaper[]; summary: string } {
  if (!papers.length) {
    return { papers: [], summary: "No papers found." };
  }

  const scorer = new RelevanceScorer(profile);

  const results: ScoredPaper[] = papers.map((paper) => {
    const match = scorer.scorePaper(paper);
    return {
      ...paper,
      relevance_score: match.total,
      matched_interests: match.matched_interests,
      matched_methods: match.matched_methods,
      match_explanation: match.explanation,
    };
  });

  // Sort by relevance score (highest first)
  results.sort((a, b) => b.relevance_score - a.relevance_score);

  const high = results.filter((p) => p.relevance_score >= 7.0).length;
  const summary = `Analyzed ${papers.length} papers · ${high} highly relevant`;

  return { papers: results, summary };
}
