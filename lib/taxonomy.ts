/**
 * Academic Knowledge Taxonomy for Econvery (v5 — Gold Standard)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * SIGNAL PRECISION PRINCIPLES:
 * - Strong signals: Multi-word phrases or highly technical terms. A single
 *   occurrence means confident detection.
 * - Moderate signals: Suggestive terms. Need 2+ or corroboration from
 *   strong signals for detection.
 * - Weak signals: Only matter with substantial corroborating evidence.
 *   Must NEVER be the sole trigger.
 * - NO bare common English words as strong signals: "trade", "risk",
 *   "choice", "trust", "survey", "media", "environment", "institution",
 *   "firm", "energy", "vote" etc. must be moderate or weak, or appear
 *   only in multi-word compounds.
 * - contextualSignals: For genuinely ambiguous terms that become
 *   meaningful only with specific neighbors (e.g., "network" + "peer").
 */

// ═══════════════════════════════════════════════════════════════════════════
// METHODOLOGICAL TAXONOMY
// ═══════════════════════════════════════════════════════════════════════════

export interface MethodNode {
  id: string;
  name: string;
  parent?: string;
  siblings?: string[];
  strongSignals: string[];
  moderateSignals: string[];
  weakSignals: string[];
  negativeSignals?: string[];
  impliedBy?: string[];
  implies?: string[];
}

export const METHOD_TAXONOMY: Record<string, MethodNode> = {
  // ─── CAUSAL INFERENCE (meta) ───────────────────────────────────────────
  "causal_inference": {
    id: "causal_inference",
    name: "Causal Inference",
    strongSignals: [
      "causal effect", "causal inference", "causal identification",
      "identification strategy", "causal impact", "causal estimate",
      "causal relationship"
    ],
    moderateSignals: [
      "treatment effect", "counterfactual", "endogeneity", "selection bias",
      "omitted variable", "unobserved heterogeneity", "exogenous variation",
      "average treatment effect", "local average treatment effect"
    ],
    weakSignals: [],
    implies: [
      "diff_in_diff", "regression_discontinuity", "instrumental_variables",
      "rct", "synthetic_control", "event_studies", "matching"
    ]
  },

  // ─── EXPERIMENTAL ──────────────────────────────────────────────────────
  "rct": {
    id: "rct",
    name: "Randomized Experiments",
    parent: "causal_inference",
    siblings: ["field_experiment", "lab_experiment", "survey_experiment"],
    strongSignals: [
      "randomized controlled trial", "randomized experiment",
      "random assignment", "randomization", "randomised controlled trial",
      "randomised experiment", "randomly assigned"
    ],
    moderateSignals: [
      "field experiment", "lab experiment", "treatment group",
      "control group", "experimental design", "experimental evidence",
      "experimental arm"
    ],
    weakSignals: ["treatment", "treated"],
    impliedBy: ["causal_inference"],
    implies: ["causal_inference"]
  },

  "field_experiment": {
    id: "field_experiment",
    name: "Field Experiments",
    parent: "rct",
    strongSignals: ["field experiment", "field trial", "natural field experiment"],
    moderateSignals: ["real-world experiment", "in the field"],
    weakSignals: [],
    impliedBy: ["rct"],
    implies: ["rct", "causal_inference"]
  },

  "survey_experiment": {
    id: "survey_experiment",
    name: "Survey Experiments",
    parent: "rct",
    strongSignals: [
      "survey experiment", "conjoint experiment", "conjoint analysis",
      "vignette experiment", "list experiment", "endorsement experiment",
      "factorial experiment"
    ],
    moderateSignals: ["experimental survey", "conjoint"],
    weakSignals: [],
    impliedBy: ["rct"],
    implies: ["rct"]
  },

  // ─── QUASI-EXPERIMENTAL ────────────────────────────────────────────────
  "diff_in_diff": {
    id: "diff_in_diff",
    name: "Difference-in-Differences",
    parent: "causal_inference",
    siblings: ["event_studies", "synthetic_control"],
    strongSignals: [
      "difference-in-differences", "diff-in-diff", "difference in differences",
      "differences-in-differences", "triple difference", "triple differences",
      "did design", "did estimation", "did approach", "did estimator"
    ],
    moderateSignals: [
      "parallel trends", "pre-trends", "two-way fixed effects", "twfe",
      "staggered adoption", "staggered treatment", "staggered rollout",
      "callaway and sant'anna", "de chaisemartin", "sun and abraham",
      "goodman-bacon", "borusyak"
    ],
    weakSignals: ["before and after"],
    negativeSignals: ["discontinuity", "cutoff", "threshold", "running variable"],
    impliedBy: ["causal_inference"],
    implies: ["causal_inference", "panel_data"]
  },

  "regression_discontinuity": {
    id: "regression_discontinuity",
    name: "Regression Discontinuity",
    parent: "causal_inference",
    strongSignals: [
      "regression discontinuity", "regression-discontinuity",
      "rd design", "rdd", "discontinuity design",
      "sharp rd", "fuzzy rd", "sharp regression discontinuity",
      "fuzzy regression discontinuity", "geographic rd",
      "spatial regression discontinuity", "rd estimate"
    ],
    moderateSignals: [
      "running variable", "forcing variable", "cutoff",
      "bandwidth selection", "local polynomial", "discontinuity at the",
      "mccrary test", "manipulation test", "donut rd"
    ],
    weakSignals: ["just above", "just below"],
    negativeSignals: ["difference-in-differences", "parallel trends"],
    impliedBy: ["causal_inference"],
    implies: ["causal_inference"]
  },

  "instrumental_variables": {
    id: "instrumental_variables",
    name: "Instrumental Variables",
    parent: "causal_inference",
    strongSignals: [
      "instrumental variable", "instrumental variables",
      "two-stage least squares", "2sls", "tsls",
      "iv estimation", "iv approach", "iv strategy", "iv regression"
    ],
    moderateSignals: [
      "exclusion restriction", "first stage", "first-stage",
      "weak instrument", "instrument relevance", "overidentification",
      "local average treatment effect", "late", "complier",
      "bartik instrument", "shift-share", "judges as instruments"
    ],
    weakSignals: ["exogenous variation", "source of variation"],
    impliedBy: ["causal_inference"],
    implies: ["causal_inference"]
  },

  "synthetic_control": {
    id: "synthetic_control",
    name: "Synthetic Control",
    parent: "causal_inference",
    siblings: ["diff_in_diff"],
    strongSignals: [
      "synthetic control", "synthetic control method",
      "synthetic counterfactual", "augmented synthetic control",
      "synthetic diff-in-diff"
    ],
    moderateSignals: ["donor pool", "comparative case study method"],
    weakSignals: [],
    impliedBy: ["causal_inference"],
    implies: ["causal_inference"]
  },

  "event_studies": {
    id: "event_studies",
    name: "Event Studies",
    parent: "causal_inference",
    siblings: ["diff_in_diff"],
    strongSignals: [
      "event study", "event-study", "event study design",
      "dynamic treatment effects", "dynamic effects"
    ],
    moderateSignals: [
      "leads and lags", "pre-period", "post-period", "event window",
      "event time", "relative time"
    ],
    weakSignals: [],
    impliedBy: ["causal_inference", "diff_in_diff"],
    implies: ["causal_inference"]
  },

  "bunching": {
    id: "bunching",
    name: "Bunching Estimation",
    parent: "causal_inference",
    strongSignals: [
      "bunching", "bunching estimation", "bunching estimator",
      "excess mass", "missing mass", "bunching design"
    ],
    moderateSignals: ["kink point", "notch", "bunching at"],
    weakSignals: [],
    impliedBy: ["causal_inference"],
    implies: ["causal_inference"]
  },

  "matching": {
    id: "matching",
    name: "Matching Methods",
    parent: "causal_inference",
    strongSignals: [
      "propensity score matching", "matching estimator",
      "coarsened exact matching", "nearest neighbor matching",
      "matched sample", "matching on observables"
    ],
    moderateSignals: [
      "propensity score", "selection on observables",
      "inverse probability weighting", "ipw", "doubly robust"
    ],
    weakSignals: [],
    impliedBy: ["causal_inference"],
    implies: ["causal_inference"]
  },

  // ─── STRUCTURAL ────────────────────────────────────────────────────────
  "structural_estimation": {
    id: "structural_estimation",
    name: "Structural Estimation",
    strongSignals: [
      "structural estimation", "structural model", "structural approach",
      "estimated structural", "structural parameters",
      "structural econometric"
    ],
    moderateSignals: [
      "counterfactual simulation", "policy simulation",
      "model estimation", "estimated model", "simulated method of moments",
      "indirect inference", "maximum likelihood estimation"
    ],
    weakSignals: [],
    negativeSignals: ["reduced-form", "quasi-experimental"],
    implies: ["theory", "discrete_choice"]
  },

  "discrete_choice": {
    id: "discrete_choice",
    name: "Discrete Choice Models",
    parent: "structural_estimation",
    strongSignals: [
      "discrete choice", "blp", "berry levinsohn pakes",
      "random coefficients logit", "mixed logit", "nested logit",
      "demand estimation"
    ],
    moderateSignals: [
      "choice model", "multinomial logit", "conditional logit",
      "revealed preference"
    ],
    weakSignals: [],
    impliedBy: ["structural_estimation"],
    implies: ["structural_estimation"]
  },

  "game_theory": {
    id: "game_theory",
    name: "Game Theory / Formal Models",
    strongSignals: [
      "game theory", "game-theoretic", "nash equilibrium",
      "subgame perfect", "mechanism design", "formal model",
      "formal theory", "bayesian game", "perfect bayesian equilibrium"
    ],
    moderateSignals: [
      "strategic interaction", "signaling model", "cheap talk",
      "principal-agent", "contract theory", "auction theory",
      "auction design", "information design", "screening model",
      "moral hazard", "adverse selection"
    ],
    weakSignals: ["equilibrium", "strategic"],
    implies: ["theory"]
  },

  // ─── STATISTICAL / ML ─────────────────────────────────────────────────
  "machine_learning": {
    id: "machine_learning",
    name: "Machine Learning",
    strongSignals: [
      "machine learning", "random forest", "neural network",
      "deep learning", "gradient boosting", "xgboost",
      "lasso regression", "ridge regression", "elastic net",
      "convolutional neural network", "recurrent neural network",
      "transformer model", "large language model"
    ],
    moderateSignals: [
      "cross-validation", "out-of-sample prediction", "regularization",
      "supervised learning", "unsupervised learning",
      "training data", "test data", "feature selection",
      "classification", "clustering algorithm"
    ],
    weakSignals: ["predictive model"],
    implies: ["quantitative"]
  },

  "causal_ml": {
    id: "causal_ml",
    name: "Causal Machine Learning",
    parent: "machine_learning",
    siblings: ["causal_inference"],
    strongSignals: [
      "causal forest", "double machine learning", "double ml",
      "causal ml", "heterogeneous treatment effects",
      "conditional average treatment effect", "cate",
      "generalized random forest"
    ],
    moderateSignals: ["honest inference", "sample splitting", "debiased lasso"],
    weakSignals: [],
    impliedBy: ["machine_learning", "causal_inference"],
    implies: ["machine_learning", "causal_inference"]
  },

  "panel_data": {
    id: "panel_data",
    name: "Panel Data Methods",
    strongSignals: [
      "panel data", "longitudinal data", "panel regression",
      "panel fixed effects"
    ],
    moderateSignals: [
      "fixed effects", "random effects", "within estimator",
      "individual fixed effects", "time fixed effects",
      "entity fixed effects", "hausman test"
    ],
    weakSignals: [],
    implies: ["quantitative"]
  },

  "time_series": {
    id: "time_series",
    name: "Time Series",
    strongSignals: [
      "time series", "vector autoregression", "var model",
      "arima", "cointegration", "error correction model"
    ],
    moderateSignals: [
      "granger causality", "impulse response", "autoregressive",
      "forecast error variance", "structural var", "svar"
    ],
    weakSignals: [],
    implies: ["quantitative"]
  },

  "text_analysis": {
    id: "text_analysis",
    name: "Text Analysis / NLP",
    strongSignals: [
      "text analysis", "natural language processing", "text mining",
      "topic model", "topic modeling", "latent dirichlet allocation",
      "word embedding", "word2vec", "bert", "text as data"
    ],
    moderateSignals: [
      "sentiment analysis", "text classification", "corpus",
      "textual analysis", "computational linguistics",
      "document classification"
    ],
    weakSignals: [],
    implies: ["quantitative"]
  },

  "network_analysis": {
    id: "network_analysis",
    name: "Network Analysis",
    strongSignals: [
      "network analysis", "social network analysis", "network centrality",
      "network structure", "graph theory", "network topology",
      "network formation model"
    ],
    moderateSignals: [
      "clustering coefficient", "degree distribution",
      "community detection", "network effects"
    ],
    weakSignals: [],
    negativeSignals: ["neural network"],
    implies: ["quantitative"]
  },

  "spatial": {
    id: "spatial",
    name: "Spatial Analysis",
    strongSignals: [
      "spatial econometrics", "spatial analysis", "spatial regression",
      "geospatial analysis", "geographic information system",
      "spatial autoregressive"
    ],
    moderateSignals: [
      "spatial correlation", "spatial dependence", "spatial lag",
      "spatial heterogeneity", "gis data"
    ],
    weakSignals: [],
    implies: ["quantitative"]
  },

  "bayesian": {
    id: "bayesian",
    name: "Bayesian Methods",
    strongSignals: [
      "bayesian estimation", "bayesian inference", "posterior distribution",
      "mcmc", "markov chain monte carlo", "gibbs sampling",
      "bayesian model"
    ],
    moderateSignals: [
      "credible interval", "prior distribution", "bayesian approach",
      "bayesian updating"
    ],
    weakSignals: [],
    implies: ["quantitative"]
  },

  // ─── QUALITATIVE ──────────────────────────────────────────────────────
  "case_study": {
    id: "case_study",
    name: "Case Studies",
    strongSignals: [
      "case study", "case-study", "single case", "comparative case",
      "within-case analysis", "case selection", "most-likely case"
    ],
    moderateSignals: ["in-depth analysis", "detailed examination"],
    weakSignals: [],
    implies: ["qualitative"]
  },

  "process_tracing": {
    id: "process_tracing",
    name: "Process Tracing",
    strongSignals: [
      "process tracing", "process-tracing", "causal mechanism",
      "causal process observation"
    ],
    moderateSignals: ["mechanistic evidence", "within-case analysis"],
    weakSignals: [],
    impliedBy: ["qualitative"],
    implies: ["qualitative", "case_study"]
  },

  "comparative_historical": {
    id: "comparative_historical",
    name: "Comparative Historical Analysis",
    strongSignals: [
      "comparative historical analysis", "historical institutionalism",
      "path dependence", "critical juncture", "historical comparative"
    ],
    moderateSignals: [
      "historical comparison", "historical analysis",
      "historical sociology", "archival research"
    ],
    weakSignals: [],
    implies: ["qualitative"]
  },

  "ethnography": {
    id: "ethnography",
    name: "Ethnography",
    strongSignals: [
      "ethnograph", "participant observation", "fieldwork",
      "ethnographic research", "field research"
    ],
    moderateSignals: ["immersion", "field notes", "observational study"],
    weakSignals: [],
    implies: ["qualitative"]
  },

  "interviews": {
    id: "interviews",
    name: "Interviews",
    strongSignals: [
      "semi-structured interview", "in-depth interview",
      "elite interview", "qualitative interview"
    ],
    moderateSignals: ["interview data", "respondent", "interviewee"],
    weakSignals: [],
    implies: ["qualitative"]
  },

  "content_analysis": {
    id: "content_analysis",
    name: "Content Analysis",
    strongSignals: [
      "content analysis", "qualitative content analysis", "coding scheme"
    ],
    moderateSignals: ["thematic analysis", "codebook", "intercoder reliability"],
    weakSignals: [],
    implies: ["qualitative"]
  },

  "discourse_analysis": {
    id: "discourse_analysis",
    name: "Discourse Analysis",
    strongSignals: [
      "discourse analysis", "critical discourse analysis",
      "framing analysis", "narrative analysis"
    ],
    moderateSignals: ["discursive", "rhetorical analysis"],
    weakSignals: [],
    implies: ["qualitative"]
  },

  // ─── SYNTHESIS ─────────────────────────────────────────────────────────
  "meta_analysis": {
    id: "meta_analysis",
    name: "Meta-Analysis",
    strongSignals: [
      "meta-analysis", "meta analysis", "systematic review",
      "pooled estimate", "systematic literature review"
    ],
    moderateSignals: [
      "effect size", "publication bias", "forest plot", "funnel plot",
      "prisma", "heterogeneity across studies"
    ],
    weakSignals: [],
    implies: ["synthesis"]
  },

  "literature_review": {
    id: "literature_review",
    name: "Literature Review",
    strongSignals: [
      "literature review", "survey article", "review article",
      "state of the literature", "handbook chapter"
    ],
    moderateSignals: ["overview of the literature", "we survey the"],
    weakSignals: [],
    implies: ["synthesis"]
  },

  // ─── META-CATEGORIES ───────────────────────────────────────────────────
  "quantitative": {
    id: "quantitative",
    name: "Quantitative Research",
    strongSignals: [],
    moderateSignals: [
      "regression analysis", "coefficient estimate", "standard error",
      "statistical significance", "confidence interval",
      "sample size", "ordinary least squares", "ols"
    ],
    weakSignals: [],
    implies: []
  },

  "qualitative": {
    id: "qualitative",
    name: "Qualitative Research",
    strongSignals: ["qualitative research", "qualitative methods"],
    moderateSignals: ["qualitative", "fieldwork", "archival"],
    weakSignals: [],
    implies: []
  },

  "theory": {
    id: "theory",
    name: "Theoretical Contribution",
    strongSignals: [
      "theoretical model", "theoretical framework", "we model",
      "we develop a model", "we build a model"
    ],
    moderateSignals: [
      "proposition", "theorem", "proof", "lemma", "corollary",
      "we show that", "we derive"
    ],
    weakSignals: [],
    implies: []
  },

  "synthesis": {
    id: "synthesis",
    name: "Synthesis / Review",
    strongSignals: [
      "systematic review", "literature survey", "meta-analysis",
      "review of the literature"
    ],
    moderateSignals: ["we summarize", "existing evidence on"],
    weakSignals: [],
    implies: []
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// TOPIC TAXONOMY
// ═══════════════════════════════════════════════════════════════════════════

export interface TopicNode {
  id: string;
  name: string;
  parent?: string;
  related: string[];
  adjacent: string[];
  strongSignals: string[];
  moderateSignals: string[];
  weakSignals: string[];
  contextualSignals?: { term: string; requires: string[] }[];
}

export const TOPIC_TAXONOMY: Record<string, TopicNode> = {
  // ─────────────────────────────────────────────────────────────────────────
  // INEQUALITY & DISTRIBUTION
  // ─────────────────────────────────────────────────────────────────────────
  "inequality": {
    id: "inequality",
    name: "Inequality",
    related: ["mobility", "poverty", "redistribution", "top_incomes"],
    adjacent: ["education", "labor", "taxation", "housing", "discrimination"],
    strongSignals: [
      "inequality", "income inequality", "wealth inequality", "gini coefficient",
      "income distribution", "wealth distribution", "economic inequality",
      "wage inequality", "consumption inequality"
    ],
    moderateSignals: [
      "top 1%", "top 10%", "income share", "wealth share",
      "distributional effects", "income gap", "wealth gap",
      "lorenz curve", "percentile"
    ],
    weakSignals: ["unequal"]
  },

  "mobility": {
    id: "mobility",
    name: "Social Mobility",
    parent: "inequality",
    related: ["inequality", "education", "opportunity"],
    adjacent: ["poverty", "labor", "housing", "segregation"],
    strongSignals: [
      "social mobility", "intergenerational mobility", "economic mobility",
      "income mobility", "upward mobility", "downward mobility",
      "intergenerational transmission", "rank-rank slope"
    ],
    moderateSignals: [
      "intergenerational elasticity", "opportunity atlas",
      "american dream", "relative mobility", "absolute mobility",
      "transmission across generations"
    ],
    weakSignals: []
  },

  "poverty": {
    id: "poverty",
    name: "Poverty",
    related: ["inequality", "welfare_programs", "development"],
    adjacent: ["mobility", "labor", "health", "housing"],
    strongSignals: [
      "poverty", "poverty rate", "poverty line", "poverty reduction",
      "poverty trap", "poverty measurement", "low-income",
      "extreme poverty", "child poverty"
    ],
    moderateSignals: [
      "deprivation", "food insecurity", "material hardship",
      "below poverty", "poverty gap"
    ],
    weakSignals: []
  },

  "welfare_programs": {
    id: "welfare_programs",
    name: "Welfare & Transfer Programs",
    parent: "poverty",
    related: ["poverty", "redistribution", "taxation"],
    adjacent: ["labor", "health", "family"],
    strongSignals: [
      "welfare program", "social assistance", "transfer program",
      "safety net", "food stamps", "snap", "eitc", "tanf",
      "conditional cash transfer", "unconditional cash transfer",
      "universal basic income", "social protection"
    ],
    moderateSignals: [
      "social insurance", "unemployment insurance", "means-tested",
      "benefit receipt", "welfare state", "social spending",
      "disability insurance"
    ],
    weakSignals: []
  },

  "redistribution": {
    id: "redistribution",
    name: "Redistribution",
    related: ["inequality", "taxation", "welfare_programs"],
    adjacent: ["political_economy", "public_economics"],
    strongSignals: [
      "redistribution", "redistributive", "progressive taxation",
      "redistributive policy", "income redistribution"
    ],
    moderateSignals: [
      "from rich to poor", "inequality reduction",
      "pre-tax vs post-tax", "fiscal redistribution"
    ],
    weakSignals: []
  },

  "top_incomes": {
    id: "top_incomes",
    name: "Top Incomes & Wealth",
    parent: "inequality",
    related: ["inequality", "taxation", "executive_comp"],
    adjacent: ["finance", "corporate_governance"],
    strongSignals: [
      "top income", "top 1%", "top 0.1%", "billionaire",
      "wealth concentration", "ultra-high-net-worth", "top earners"
    ],
    moderateSignals: [
      "wealth tax", "estate tax", "wealth at the top",
      "high earners", "top percentile"
    ],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LABOR & EMPLOYMENT
  // ─────────────────────────────────────────────────────────────────────────
  "labor": {
    id: "labor",
    name: "Labor Markets",
    related: ["employment", "wages", "human_capital", "monopsony"],
    adjacent: ["education", "inequality", "immigration", "gender", "automation"],
    strongSignals: [
      "labor market", "labour market", "labor economics",
      "labor supply", "labor demand", "labor force",
      "labor market outcomes", "labor market effects"
    ],
    moderateSignals: [
      "workforce", "employment rate", "unemployment rate",
      "occupational choice", "job market", "job displacement"
    ],
    weakSignals: [],
    contextualSignals: [
      { term: "worker", requires: ["wage", "employ", "labor", "job", "occupation", "firm"] }
    ]
  },

  "wages": {
    id: "wages",
    name: "Wages & Earnings",
    parent: "labor",
    related: ["labor", "inequality", "minimum_wage"],
    adjacent: ["education", "gender", "immigration", "discrimination"],
    strongSignals: [
      "wage", "wages", "earnings", "compensation", "pay gap",
      "wage inequality", "wage premium", "wage growth",
      "earnings gap", "wage determination"
    ],
    moderateSignals: [
      "salary", "hourly pay", "wage distribution",
      "returns to experience", "wage penalty"
    ],
    weakSignals: []
  },

  "minimum_wage": {
    id: "minimum_wage",
    name: "Minimum Wage",
    parent: "wages",
    related: ["wages", "labor", "policy"],
    adjacent: ["poverty", "inequality", "employment"],
    strongSignals: [
      "minimum wage", "minimum wage increase", "minimum wage effect"
    ],
    moderateSignals: ["wage floor", "living wage", "sub-minimum wage"],
    weakSignals: []
  },

  "employment": {
    id: "employment",
    name: "Employment & Unemployment",
    parent: "labor",
    related: ["labor", "business_cycles"],
    adjacent: ["welfare_programs", "education", "automation"],
    strongSignals: [
      "employment", "unemployment", "unemployment rate",
      "job loss", "job creation", "employment effects",
      "labor force participation", "jobless"
    ],
    moderateSignals: [
      "hiring", "layoff", "job search", "job finding rate",
      "labor market tightness", "vacancy"
    ],
    weakSignals: []
  },

  "human_capital": {
    id: "human_capital",
    name: "Human Capital",
    related: ["education", "labor", "skills"],
    adjacent: ["mobility", "wages", "health", "growth"],
    strongSignals: [
      "human capital", "skill formation", "returns to education",
      "returns to schooling", "human capital accumulation",
      "skill premium"
    ],
    moderateSignals: [
      "skill", "skills", "training program", "on-the-job training",
      "cognitive skill", "non-cognitive skill"
    ],
    weakSignals: []
  },

  "monopsony": {
    id: "monopsony",
    name: "Labor Market Power",
    parent: "labor",
    related: ["labor", "wages", "industrial_organization"],
    adjacent: ["antitrust", "inequality"],
    strongSignals: [
      "monopsony", "labor market concentration", "employer market power",
      "labor market power", "wage-setting power", "oligopsony"
    ],
    moderateSignals: [
      "labor market concentration", "hiring concentration",
      "non-compete", "no-poach", "wage posting"
    ],
    weakSignals: []
  },

  "unions": {
    id: "unions",
    name: "Unions & Collective Bargaining",
    parent: "labor",
    related: ["labor", "wages", "inequality"],
    adjacent: ["political_economy", "organizations"],
    strongSignals: [
      "union", "unions", "trade union", "labor union",
      "collective bargaining", "unionization", "unionized"
    ],
    moderateSignals: [
      "union membership", "union density", "right to work",
      "strike", "industrial relations", "union wage premium"
    ],
    weakSignals: []
  },

  "automation": {
    id: "automation",
    name: "Automation & AI",
    related: ["labor", "innovation", "skills"],
    adjacent: ["wages", "inequality", "employment"],
    strongSignals: [
      "automation", "robot", "robots", "artificial intelligence",
      "technological unemployment", "future of work",
      "task automation", "automated"
    ],
    moderateSignals: [
      "routine tasks", "labor-replacing", "skill-biased",
      "routine-biased", "computerization", "digitalization"
    ],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // EDUCATION
  // ─────────────────────────────────────────────────────────────────────────
  "education": {
    id: "education",
    name: "Education",
    related: ["human_capital", "schools", "higher_ed"],
    adjacent: ["mobility", "inequality", "labor", "child_development"],
    strongSignals: [
      "education", "educational", "school choice", "academic achievement",
      "educational attainment", "education policy", "education reform",
      "education system", "educational outcomes"
    ],
    moderateSignals: [
      "student achievement", "test score", "curriculum", "instruction",
      "school quality", "school funding", "class size"
    ],
    weakSignals: [],
    contextualSignals: [
      { term: "school", requires: ["student", "teacher", "education", "achievement", "enrollment", "grade"] },
      { term: "learning", requires: ["student", "school", "education", "classroom", "academic"] }
    ]
  },

  "schools": {
    id: "schools",
    name: "K-12 Education",
    parent: "education",
    related: ["education", "teachers", "achievement_gap"],
    adjacent: ["inequality", "segregation", "local_government"],
    strongSignals: [
      "k-12", "elementary school", "high school", "middle school",
      "public school", "charter school", "school district",
      "primary school", "secondary school"
    ],
    moderateSignals: [
      "school accountability", "school voucher", "student performance",
      "school principal", "magnet school"
    ],
    weakSignals: []
  },

  "higher_ed": {
    id: "higher_ed",
    name: "Higher Education",
    parent: "education",
    related: ["education", "human_capital", "student_debt"],
    adjacent: ["labor", "mobility", "inequality"],
    strongSignals: [
      "college", "university", "higher education", "undergraduate",
      "graduate education", "tuition", "student loan", "student debt",
      "college premium", "college enrollment", "selective college"
    ],
    moderateSignals: [
      "enrollment", "campus", "degree completion",
      "community college", "for-profit college"
    ],
    weakSignals: []
  },

  "teachers": {
    id: "teachers",
    name: "Teachers & Teaching",
    parent: "schools",
    related: ["schools", "education"],
    adjacent: ["labor", "public_sector"],
    strongSignals: [
      "teacher quality", "teacher effectiveness", "teacher labor market",
      "teacher evaluation", "teacher value-added", "teacher turnover",
      "teacher certification"
    ],
    moderateSignals: [
      "teacher pay", "teacher supply", "teaching quality",
      "class size", "instructional quality"
    ],
    weakSignals: []
  },

  "achievement_gap": {
    id: "achievement_gap",
    name: "Achievement Gaps",
    parent: "education",
    related: ["education", "inequality", "race"],
    adjacent: ["mobility", "poverty", "schools"],
    strongSignals: [
      "achievement gap", "test score gap", "educational inequality",
      "racial achievement gap", "income achievement gap",
      "performance gap"
    ],
    moderateSignals: ["gap in achievement", "disparities in education"],
    weakSignals: []
  },

  "child_development": {
    id: "child_development",
    name: "Child Development",
    related: ["education", "family", "health"],
    adjacent: ["poverty", "inequality", "mobility"],
    strongSignals: [
      "child development", "early childhood", "preschool",
      "head start", "kindergarten readiness", "childcare",
      "child care", "early intervention"
    ],
    moderateSignals: [
      "child outcome", "developmental", "pre-kindergarten",
      "nursery", "child health"
    ],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // HEALTH
  // ─────────────────────────────────────────────────────────────────────────
  "health": {
    id: "health",
    name: "Health Economics",
    related: ["healthcare", "mortality", "health_behaviors"],
    adjacent: ["poverty", "inequality", "labor", "aging"],
    strongSignals: [
      "health economics", "health outcome", "health effect",
      "health expenditure", "health status", "morbidity",
      "public health", "health policy", "health care cost",
      "health disparities", "health inequality"
    ],
    moderateSignals: [
      "hospital", "physician", "patient", "disease", "life expectancy",
      "medical", "chronic condition", "mental health",
      "health insurance", "drug", "pharmaceutical"
    ],
    weakSignals: [],
    contextualSignals: [
      { term: "health", requires: ["outcome", "care", "insurance", "expenditure", "mortality", "disease", "hospital", "medical", "patient"] }
    ]
  },

  "healthcare": {
    id: "healthcare",
    name: "Healthcare Systems & Insurance",
    parent: "health",
    related: ["health", "health_insurance"],
    adjacent: ["poverty", "public_economics"],
    strongSignals: [
      "healthcare system", "health care system", "health insurance",
      "medicare", "medicaid", "affordable care act", "obamacare",
      "uninsured", "universal health care", "single payer",
      "health insurance coverage"
    ],
    moderateSignals: [
      "insurance coverage", "insurance market", "provider",
      "health plan", "hospital quality", "emergency department"
    ],
    weakSignals: []
  },

  "mortality": {
    id: "mortality",
    name: "Mortality & Life Expectancy",
    parent: "health",
    related: ["health", "aging", "inequality"],
    adjacent: ["poverty", "environment"],
    strongSignals: [
      "mortality", "mortality rate", "life expectancy", "deaths of despair",
      "infant mortality", "child mortality", "excess mortality",
      "cause of death", "survival rate"
    ],
    moderateSignals: ["death rate", "lifespan", "longevity", "premature death"],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // HOUSING & URBAN
  // ─────────────────────────────────────────────────────────────────────────
  "housing": {
    id: "housing",
    name: "Housing",
    related: ["real_estate", "rental", "homeownership"],
    adjacent: ["urban", "inequality", "mobility", "finance"],
    strongSignals: [
      "housing market", "house price", "home price", "housing supply",
      "housing demand", "housing affordability", "housing policy",
      "rental market", "housing crisis"
    ],
    moderateSignals: [
      "mortgage", "homeowner", "homeownership", "tenant", "landlord",
      "eviction", "homelessness", "rent control", "zoning",
      "housing voucher"
    ],
    weakSignals: []
  },

  "urban": {
    id: "urban",
    name: "Urban Economics",
    related: ["housing", "cities", "transportation"],
    adjacent: ["inequality", "environment", "crime", "segregation"],
    strongSignals: [
      "urban economics", "agglomeration", "urban growth",
      "urban development", "urban planning", "land use regulation",
      "spatial equilibrium", "commuting zone"
    ],
    moderateSignals: [
      "metropolitan area", "neighborhood", "zoning", "land use",
      "urban sprawl", "population density", "gentrification",
      "place-based policy"
    ],
    weakSignals: [],
    contextualSignals: [
      { term: "city", requires: ["urban", "neighborhood", "agglomeration", "local", "zoning", "density", "metro"] }
    ]
  },

  "segregation": {
    id: "segregation",
    name: "Residential Segregation",
    parent: "urban",
    related: ["urban", "housing", "race"],
    adjacent: ["inequality", "education", "mobility"],
    strongSignals: [
      "segregation", "residential segregation", "neighborhood sorting",
      "racial segregation", "economic segregation"
    ],
    moderateSignals: [
      "dissimilarity index", "exposure index", "isolation index",
      "neighborhood composition"
    ],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FINANCE & MACRO
  // ─────────────────────────────────────────────────────────────────────────
  "finance": {
    id: "finance",
    name: "Finance & Banking",
    related: ["banking", "credit", "household_finance"],
    adjacent: ["business_cycles", "monetary_policy", "housing"],
    strongSignals: [
      "financial market", "stock market", "financial crisis",
      "banking sector", "credit market", "asset pricing",
      "financial regulation", "financial intermediation",
      "financial inclusion", "financial literacy"
    ],
    moderateSignals: [
      "banking", "credit", "loan", "investment portfolio",
      "interest rate", "bond market", "equity market",
      "financial institution", "capital market"
    ],
    weakSignals: [],
    contextualSignals: [
      { term: "bank", requires: ["credit", "loan", "deposit", "lending", "financial", "banking", "monetary"] }
    ]
  },

  "monetary_policy": {
    id: "monetary_policy",
    name: "Monetary Policy",
    related: ["finance", "business_cycles", "inflation"],
    adjacent: ["fiscal_policy", "banking"],
    strongSignals: [
      "monetary policy", "central bank", "federal reserve",
      "interest rate policy", "quantitative easing",
      "inflation targeting", "forward guidance",
      "monetary transmission"
    ],
    moderateSignals: [
      "policy rate", "zero lower bound", "money supply",
      "taylor rule", "unconventional monetary policy",
      "exchange rate policy"
    ],
    weakSignals: []
  },

  "inflation": {
    id: "inflation",
    name: "Inflation & Prices",
    related: ["monetary_policy", "business_cycles"],
    adjacent: ["fiscal_policy", "wages"],
    strongSignals: [
      "inflation", "price level", "deflation", "price stability",
      "consumer price index", "cpi", "price inflation",
      "inflationary", "disinflation"
    ],
    moderateSignals: [
      "price dynamics", "price rigidity", "price setting",
      "expectations anchoring", "phillips curve"
    ],
    weakSignals: []
  },

  "fiscal_policy": {
    id: "fiscal_policy",
    name: "Fiscal Policy",
    related: ["taxation", "government_spending", "public_debt"],
    adjacent: ["business_cycles", "redistribution"],
    strongSignals: [
      "fiscal policy", "government spending", "fiscal stimulus",
      "austerity", "fiscal multiplier", "fiscal consolidation",
      "public debt", "government debt", "fiscal rule"
    ],
    moderateSignals: [
      "budget deficit", "fiscal space", "debt sustainability",
      "sovereign debt", "fiscal adjustment"
    ],
    weakSignals: []
  },

  "business_cycles": {
    id: "business_cycles",
    name: "Business Cycles & Recessions",
    related: ["monetary_policy", "employment", "finance"],
    adjacent: ["fiscal_policy", "labor"],
    strongSignals: [
      "business cycle", "recession", "great recession", "economic crisis",
      "financial crisis", "macroeconomic fluctuation",
      "great depression"
    ],
    moderateSignals: [
      "economic downturn", "recovery", "expansion", "contraction",
      "boom-bust", "gdp growth"
    ],
    weakSignals: []
  },

  "growth": {
    id: "growth",
    name: "Economic Growth",
    related: ["productivity", "innovation", "development"],
    adjacent: ["human_capital", "institutions", "trade"],
    strongSignals: [
      "economic growth", "growth theory", "endogenous growth",
      "growth model", "long-run growth", "growth rate",
      "convergence", "divergence"
    ],
    moderateSignals: [
      "gdp per capita", "growth accounting", "total factor productivity",
      "structural transformation", "development accounting",
      "sustained growth"
    ],
    weakSignals: []
  },

  "productivity": {
    id: "productivity",
    name: "Productivity",
    related: ["growth", "innovation", "firms"],
    adjacent: ["labor", "industrial_organization"],
    strongSignals: [
      "productivity", "total factor productivity", "tfp",
      "labor productivity", "productivity growth",
      "productivity dispersion", "productivity measurement"
    ],
    moderateSignals: [
      "misallocation", "reallocation", "firm productivity",
      "plant-level productivity", "multifactor productivity"
    ],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TAXATION & PUBLIC ECONOMICS
  // ─────────────────────────────────────────────────────────────────────────
  "taxation": {
    id: "taxation",
    name: "Taxation",
    related: ["public_economics", "redistribution", "fiscal_policy"],
    adjacent: ["inequality", "labor", "corporate_governance", "compliance"],
    strongSignals: [
      "taxation", "income tax", "tax rate", "tax policy", "tax reform",
      "tax evasion", "tax avoidance", "tax base", "tax revenue",
      "tax incidence", "corporate tax", "property tax",
      "value-added tax", "vat", "capital gains tax",
      "estate tax", "wealth tax", "carbon tax",
      "tax system", "tax compliance", "tax enforcement"
    ],
    moderateSignals: [
      "marginal tax rate", "effective tax rate", "tax bracket",
      "progressive tax", "regressive tax", "tax burden",
      "taxable income", "tax elasticity", "laffer curve",
      "salt tax", "excise tax", "indirect tax"
    ],
    weakSignals: ["tax"]
  },

  "public_economics": {
    id: "public_economics",
    name: "Public Economics",
    related: ["taxation", "government_spending", "public_goods"],
    adjacent: ["political_economy", "welfare_programs"],
    strongSignals: [
      "public economics", "public finance", "public good",
      "public provision", "public sector", "government revenue",
      "fiscal federalism", "intergovernmental"
    ],
    moderateSignals: [
      "government intervention", "public expenditure",
      "state and local government", "municipal"
    ],
    weakSignals: []
  },

  "regulation": {
    id: "regulation",
    name: "Regulation",
    related: ["public_economics", "industrial_organization"],
    adjacent: ["energy", "finance", "environment", "labor"],
    strongSignals: [
      "regulation", "regulatory", "deregulation", "regulatory reform",
      "regulatory burden", "occupational licensing", "licensing requirement"
    ],
    moderateSignals: [
      "compliance cost", "regulatory impact", "permitting",
      "entry barrier", "red tape"
    ],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TRADE & INTERNATIONAL
  // ─────────────────────────────────────────────────────────────────────────
  "trade": {
    id: "trade",
    name: "International Trade",
    related: ["globalization", "tariffs", "offshoring"],
    adjacent: ["labor", "inequality", "development", "industrial_organization"],
    strongSignals: [
      "international trade", "trade policy", "trade agreement",
      "trade liberalization", "free trade", "trade barrier",
      "trade deficit", "trade surplus", "trade flow",
      "gravity model", "comparative advantage"
    ],
    moderateSignals: [
      "tariff", "import", "export", "protectionism", "wto",
      "trade war", "trade shock", "terms of trade",
      "trade integration", "customs"
    ],
    weakSignals: [],
    contextualSignals: [
      { term: "trade", requires: ["international", "tariff", "import", "export", "bilateral", "agreement", "liberalization", "barrier", "goods", "services"] }
    ]
  },

  "globalization": {
    id: "globalization",
    name: "Globalization",
    parent: "trade",
    related: ["trade", "offshoring", "immigration"],
    adjacent: ["labor", "inequality"],
    strongSignals: [
      "globalization", "globalisation", "china shock",
      "global value chain", "supply chain", "global supply chain",
      "offshoring", "outsourcing"
    ],
    moderateSignals: [
      "multinational", "foreign direct investment", "fdi",
      "global integration", "trade openness"
    ],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DEVELOPMENT
  // ─────────────────────────────────────────────────────────────────────────
  "development": {
    id: "development",
    name: "Development Economics",
    related: ["poverty", "growth", "aid", "institutions"],
    adjacent: ["health", "education", "conflict", "agriculture"],
    strongSignals: [
      "development economics", "developing country", "developing world",
      "economic development", "global south", "low-income country",
      "developing economies", "development policy"
    ],
    moderateSignals: [
      "sub-saharan africa", "south asia", "southeast asia",
      "ldc", "least developed", "emerging economy",
      "world bank", "international development"
    ],
    weakSignals: [],
    contextualSignals: [
      { term: "development", requires: ["country", "poverty", "aid", "africa", "asia", "latin america", "rural", "village", "household survey"] }
    ]
  },

  "aid": {
    id: "aid",
    name: "Foreign Aid",
    parent: "development",
    related: ["development", "international_relations"],
    adjacent: ["poverty", "institutions"],
    strongSignals: [
      "foreign aid", "development aid", "official development assistance",
      "oda", "international aid", "aid effectiveness"
    ],
    moderateSignals: ["donor", "recipient country", "aid allocation"],
    weakSignals: []
  },

  "microfinance": {
    id: "microfinance",
    name: "Microfinance",
    parent: "development",
    related: ["development", "finance", "poverty"],
    adjacent: ["credit", "entrepreneurship"],
    strongSignals: [
      "microfinance", "microcredit", "microinsurance", "grameen",
      "microfinance institution"
    ],
    moderateSignals: ["small loans", "village banking"],
    weakSignals: []
  },

  "agriculture": {
    id: "agriculture",
    name: "Agriculture",
    related: ["development", "environment", "trade"],
    adjacent: ["poverty", "climate_change", "land"],
    strongSignals: [
      "agriculture", "agricultural", "farming", "farmer", "crop",
      "agricultural policy", "food production", "agricultural productivity",
      "farm", "livestock"
    ],
    moderateSignals: [
      "harvest", "irrigation", "fertilizer", "seed",
      "agricultural extension", "food price"
    ],
    weakSignals: []
  },

  "land": {
    id: "land",
    name: "Land & Property Rights",
    related: ["agriculture", "development", "institutions"],
    adjacent: ["housing", "inequality", "growth"],
    strongSignals: [
      "land reform", "land rights", "property rights", "land tenure",
      "land titling", "land redistribution", "land ownership",
      "common property"
    ],
    moderateSignals: [
      "land market", "expropriation", "eminent domain",
      "customary tenure", "communal land"
    ],
    weakSignals: []
  },

  "colonial_legacy": {
    id: "colonial_legacy",
    name: "Colonial Legacy & Persistence",
    related: ["development", "institutions", "economic_history"],
    adjacent: ["inequality", "conflict", "growth"],
    strongSignals: [
      "colonial", "colonialism", "colonial legacy", "post-colonial",
      "colonial institutions", "historical persistence",
      "long-run effects", "persistence"
    ],
    moderateSignals: [
      "settler mortality", "extractive institutions",
      "missionary", "slave trade", "colonial rule"
    ],
    weakSignals: [],
    contextualSignals: [
      { term: "persistence", requires: ["historical", "colonial", "long-run", "centuries", "institutional"] }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CLIMATE & ENVIRONMENT
  // ─────────────────────────────────────────────────────────────────────────
  "environment": {
    id: "environment",
    name: "Environment & Climate",
    related: ["climate_change", "pollution", "energy"],
    adjacent: ["health", "development", "policy", "agriculture"],
    strongSignals: [
      "environmental economics", "environmental policy",
      "environmental regulation", "pollution", "emissions",
      "carbon emissions", "air quality", "water quality",
      "environmental damage", "environmental impact"
    ],
    moderateSignals: [
      "greenhouse gas", "sustainability", "ecological",
      "biodiversity", "deforestation", "conservation"
    ],
    weakSignals: [],
    contextualSignals: [
      { term: "environment", requires: ["pollution", "emission", "climate", "regulation", "environmental", "carbon", "green", "sustainability"] }
    ]
  },

  "climate_change": {
    id: "climate_change",
    name: "Climate Change",
    parent: "environment",
    related: ["environment", "energy", "policy"],
    adjacent: ["development", "agriculture", "natural_disasters"],
    strongSignals: [
      "climate change", "global warming", "carbon emissions",
      "greenhouse gas emissions", "climate policy", "climate adaptation",
      "climate mitigation", "paris agreement", "carbon tax",
      "emission trading", "cap and trade"
    ],
    moderateSignals: [
      "climate risk", "temperature increase", "sea level rise",
      "climate damage", "climate model", "net zero"
    ],
    weakSignals: []
  },

  "energy": {
    id: "energy",
    name: "Energy Economics",
    parent: "environment",
    related: ["environment", "climate_change"],
    adjacent: ["industrial_organization", "regulation"],
    strongSignals: [
      "energy economics", "energy market", "energy policy",
      "electricity market", "renewable energy", "fossil fuel",
      "solar energy", "wind energy", "energy transition",
      "energy efficiency"
    ],
    moderateSignals: [
      "power plant", "electricity price", "oil price",
      "natural gas", "energy consumption", "energy subsidy"
    ],
    weakSignals: []
  },

  "natural_disasters": {
    id: "natural_disasters",
    name: "Natural Disasters",
    related: ["climate_change", "development"],
    adjacent: ["health", "insurance", "poverty"],
    strongSignals: [
      "natural disaster", "earthquake", "hurricane", "flood",
      "drought", "tsunami", "disaster relief", "disaster risk",
      "extreme weather", "weather shock"
    ],
    moderateSignals: [
      "catastrophe", "disaster recovery", "climate shock",
      "storm", "wildfire", "famine"
    ],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // INNOVATION & TECHNOLOGY
  // ─────────────────────────────────────────────────────────────────────────
  "innovation": {
    id: "innovation",
    name: "Innovation & Technology",
    related: ["patents", "entrepreneurship", "productivity"],
    adjacent: ["labor", "industrial_organization", "growth", "automation"],
    strongSignals: [
      "innovation", "technological change", "patent", "patents",
      "r&d", "research and development", "technology adoption",
      "invention", "innovative", "creative destruction"
    ],
    moderateSignals: [
      "intellectual property", "knowledge spillover",
      "technology transfer", "tech sector", "startup ecosystem"
    ],
    weakSignals: []
  },

  "entrepreneurship": {
    id: "entrepreneurship",
    name: "Entrepreneurship",
    parent: "innovation",
    related: ["innovation", "firm_dynamics"],
    adjacent: ["labor", "finance"],
    strongSignals: [
      "entrepreneurship", "startup", "entrepreneur",
      "small business", "self-employment", "new venture",
      "business creation", "founding"
    ],
    moderateSignals: [
      "venture capital", "angel investor", "seed funding",
      "business incubator", "startup ecosystem"
    ],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DEMOGRAPHICS & FAMILY
  // ─────────────────────────────────────────────────────────────────────────
  "gender": {
    id: "gender",
    name: "Gender Economics",
    related: ["family", "labor", "discrimination"],
    adjacent: ["wages", "education", "politics"],
    strongSignals: [
      "gender gap", "gender inequality", "gender discrimination",
      "gender wage gap", "gender economics", "women in the labor",
      "female labor force", "gender norms", "gender roles",
      "women empowerment", "gender parity"
    ],
    moderateSignals: [
      "motherhood penalty", "fatherhood", "gender difference",
      "glass ceiling", "gender bias", "sexual harassment",
      "women in politics"
    ],
    weakSignals: [],
    contextualSignals: [
      { term: "gender", requires: ["gap", "inequality", "discrimination", "wage", "labor", "norm", "role", "difference", "parity", "bias"] },
      { term: "women", requires: ["labor", "wage", "work", "employment", "education", "empowerment", "representation", "participation"] }
    ]
  },

  "family": {
    id: "family",
    name: "Family Economics",
    related: ["gender", "fertility", "marriage"],
    adjacent: ["labor", "education", "child_development"],
    strongSignals: [
      "family economics", "household economics", "marriage market",
      "divorce", "fertility", "birth rate", "fertility rate",
      "family structure", "household formation",
      "intrahousehold", "intra-household"
    ],
    moderateSignals: [
      "childbearing", "maternity leave", "paternity leave",
      "parental leave", "marital status", "cohabitation",
      "household bargaining", "family size"
    ],
    weakSignals: [],
    contextualSignals: [
      { term: "family", requires: ["marriage", "fertility", "child", "household", "divorce", "parent", "spouse"] }
    ]
  },

  "immigration": {
    id: "immigration",
    name: "Immigration & Migration",
    related: ["migration", "labor"],
    adjacent: ["wages", "public_opinion", "policy", "cultural"],
    strongSignals: [
      "immigration", "immigrant", "immigration policy",
      "foreign-born", "native-born", "immigration reform",
      "migrant", "migration", "emigration",
      "internal migration", "international migration"
    ],
    moderateSignals: [
      "refugee", "asylum", "visa", "undocumented",
      "naturalization", "deportation", "immigration enforcement",
      "brain drain", "remittance"
    ],
    weakSignals: []
  },

  "race": {
    id: "race",
    name: "Race & Ethnicity",
    related: ["discrimination", "inequality"],
    adjacent: ["segregation", "education", "crime", "politics"],
    strongSignals: [
      "racial inequality", "racial discrimination", "racial gap",
      "race and ethnicity", "racial justice", "racial disparities",
      "ethnic conflict", "ethnic politics", "ethnic diversity",
      "african american", "racial segregation"
    ],
    moderateSignals: [
      "minority group", "racial bias", "interethnic",
      "racial wealth gap", "racial profiling", "hate crime",
      "ethnic group", "ethno-linguistic"
    ],
    weakSignals: [],
    contextualSignals: [
      { term: "race", requires: ["racial", "discrimination", "inequality", "gap", "ethnic", "minority", "segregation", "bias"] }
    ]
  },

  "discrimination": {
    id: "discrimination",
    name: "Discrimination",
    related: ["race", "gender", "inequality"],
    adjacent: ["labor", "housing", "crime"],
    strongSignals: [
      "discrimination", "discriminatory", "audit study",
      "correspondence study", "hiring discrimination",
      "taste-based discrimination", "statistical discrimination",
      "implicit bias"
    ],
    moderateSignals: [
      "prejudice", "stereotype", "racial profiling",
      "disparate impact", "equal opportunity"
    ],
    weakSignals: []
  },

  "aging": {
    id: "aging",
    name: "Aging & Retirement",
    related: ["health", "pensions", "labor"],
    adjacent: ["family", "public_economics"],
    strongSignals: [
      "aging", "retirement", "pension", "social security",
      "older workers", "aging population", "retirement savings",
      "pension reform"
    ],
    moderateSignals: [
      "retiree", "elderly", "old age", "senior",
      "retirement age", "life cycle"
    ],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CRIME & JUSTICE
  // ─────────────────────────────────────────────────────────────────────────
  "crime": {
    id: "crime",
    name: "Crime & Criminal Justice",
    related: ["policing", "incarceration"],
    adjacent: ["poverty", "race", "policy"],
    strongSignals: [
      "crime", "criminal justice", "criminal behavior",
      "crime rate", "property crime", "violent crime",
      "criminal", "criminal activity"
    ],
    moderateSignals: [
      "arrest", "conviction", "sentencing", "recidivism",
      "homicide", "robbery", "burglary", "assault",
      "gun violence", "deterrence"
    ],
    weakSignals: []
  },

  "policing": {
    id: "policing",
    name: "Policing",
    parent: "crime",
    related: ["crime", "race"],
    adjacent: ["public_economics", "policy"],
    strongSignals: [
      "policing", "police force", "law enforcement",
      "police officer", "police reform", "police violence",
      "use of force"
    ],
    moderateSignals: [
      "patrol", "stop and frisk", "body camera",
      "police department", "police shooting"
    ],
    weakSignals: []
  },

  "incarceration": {
    id: "incarceration",
    name: "Incarceration",
    parent: "crime",
    related: ["crime", "labor"],
    adjacent: ["poverty", "race", "family"],
    strongSignals: [
      "incarceration", "prison", "imprisonment", "mass incarceration",
      "jail", "correctional"
    ],
    moderateSignals: ["inmate", "sentence", "parole", "probation"],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // POLITICAL SCIENCE
  // ─────────────────────────────────────────────────────────────────────────
  "elections": {
    id: "elections",
    name: "Elections & Voting",
    related: ["voting_behavior", "campaigns", "political_participation"],
    adjacent: ["political_economy", "public_opinion", "media", "democracy"],
    strongSignals: [
      "election", "electoral", "ballot", "voter turnout",
      "vote share", "voting behavior", "election results",
      "general election", "midterm election", "primary election",
      "electoral system", "proportional representation",
      "gerrymandering", "redistricting"
    ],
    moderateSignals: [
      "candidate", "campaign", "voter registration",
      "incumbent", "reelection", "swing state",
      "political party", "partisan", "polling"
    ],
    weakSignals: ["vote"]
  },

  "democracy": {
    id: "democracy",
    name: "Democracy & Democratization",
    related: ["institutions", "authoritarianism", "political_development"],
    adjacent: ["elections", "accountability", "civil_liberties"],
    strongSignals: [
      "democracy", "democratization", "democratic transition",
      "democratic institution", "democratic governance",
      "democratic backsliding", "polity score"
    ],
    moderateSignals: [
      "political freedom", "civil liberties", "political rights",
      "democratic consolidation", "electoral democracy",
      "liberal democracy"
    ],
    weakSignals: [],
    contextualSignals: [
      { term: "regime", requires: ["democratic", "authoritarian", "political", "transition", "change", "type", "stability"] }
    ]
  },

  "authoritarianism": {
    id: "authoritarianism",
    name: "Authoritarianism",
    related: ["democracy", "repression", "institutions"],
    adjacent: ["conflict", "political_economy"],
    strongSignals: [
      "authoritarian", "autocracy", "dictatorship", "authoritarian regime",
      "one-party state", "political repression",
      "authoritarian governance"
    ],
    moderateSignals: [
      "censorship", "political control", "opposition repression",
      "strongman", "regime survival"
    ],
    weakSignals: []
  },

  "polarization": {
    id: "polarization",
    name: "Political Polarization",
    related: ["elections", "public_opinion", "media"],
    adjacent: ["democracy", "social_media", "political_economy"],
    strongSignals: [
      "political polarization", "partisan polarization",
      "affective polarization", "ideological polarization",
      "polarized", "bipartisan"
    ],
    moderateSignals: [
      "partisan divide", "cross-party", "tribalism",
      "echo chamber", "filter bubble", "political divide"
    ],
    weakSignals: []
  },

  "conflict": {
    id: "conflict",
    name: "Conflict & Security",
    related: ["civil_war", "international_security", "violence"],
    adjacent: ["development", "institutions", "international_relations"],
    strongSignals: [
      "civil war", "armed conflict", "military conflict",
      "warfare", "political violence", "insurgency",
      "peacekeeping", "post-conflict", "conflict resolution"
    ],
    moderateSignals: [
      "battle", "casualty", "rebellion", "terrorism",
      "guerrilla", "ceasefire", "ethnic violence",
      "genocide", "mass atrocity"
    ],
    weakSignals: [],
    contextualSignals: [
      { term: "conflict", requires: ["armed", "civil", "violent", "military", "war", "peace", "ethnic", "political"] },
      { term: "war", requires: ["civil", "world", "armed", "military", "conflict", "postwar", "wartime"] }
    ]
  },

  "accountability": {
    id: "accountability",
    name: "Accountability & Transparency",
    related: ["corruption", "institutions", "governance"],
    adjacent: ["democracy", "elections", "media"],
    strongSignals: [
      "accountability", "government transparency", "oversight",
      "government audit", "freedom of information",
      "public disclosure", "political accountability"
    ],
    moderateSignals: [
      "monitoring", "watchdog", "checks and balances",
      "open government", "anti-corruption"
    ],
    weakSignals: []
  },

  "corruption": {
    id: "corruption",
    name: "Corruption",
    related: ["accountability", "institutions", "governance"],
    adjacent: ["development", "political_economy", "crime"],
    strongSignals: [
      "corruption", "bribery", "embezzlement", "graft",
      "anti-corruption", "kleptocracy", "corrupt"
    ],
    moderateSignals: [
      "rent-seeking", "clientelism", "patronage", "nepotism",
      "malfeasance", "misappropriation", "kickback"
    ],
    weakSignals: []
  },

  "institutions": {
    id: "institutions",
    name: "Political Institutions",
    related: ["democracy", "governance", "legislature"],
    adjacent: ["political_economy", "development", "colonial_legacy"],
    strongSignals: [
      "political institution", "institutional design",
      "constitutional", "legislature", "parliament",
      "congressional", "judicial independence", "separation of powers",
      "institutional quality", "institutional change"
    ],
    moderateSignals: [
      "bureaucracy", "state capacity", "federalism",
      "decentralization", "executive power", "veto player",
      "bicameral", "state formation"
    ],
    weakSignals: [],
    contextualSignals: [
      { term: "institution", requires: ["political", "democratic", "colonial", "state", "governance", "constitutional", "reform", "quality", "building"] }
    ]
  },

  "state_capacity": {
    id: "state_capacity",
    name: "State Capacity",
    parent: "institutions",
    related: ["institutions", "development", "taxation"],
    adjacent: ["conflict", "colonial_legacy", "public_economics"],
    strongSignals: [
      "state capacity", "state building", "state formation",
      "fiscal capacity", "administrative capacity",
      "bureaucratic quality", "government effectiveness"
    ],
    moderateSignals: [
      "state weakness", "failed state", "fragile state",
      "governance quality", "civil service"
    ],
    weakSignals: []
  },

  "public_opinion": {
    id: "public_opinion",
    name: "Public Opinion",
    related: ["political_behavior", "media", "elections", "polarization"],
    adjacent: ["policy", "democracy"],
    strongSignals: [
      "public opinion", "opinion poll", "public attitudes",
      "policy preferences", "mass opinion", "political attitudes",
      "public support"
    ],
    moderateSignals: [
      "survey data", "attitudinal", "political preferences",
      "public sentiment", "approval rating"
    ],
    weakSignals: [],
    contextualSignals: [
      { term: "survey", requires: ["opinion", "attitude", "preference", "respondent", "nationally representative", "polling"] }
    ]
  },

  "international_relations": {
    id: "international_relations",
    name: "International Relations",
    related: ["conflict", "diplomacy", "international_cooperation"],
    adjacent: ["trade", "security"],
    strongSignals: [
      "international relations", "foreign policy", "diplomacy",
      "bilateral relations", "multilateral cooperation",
      "international cooperation", "geopolitics",
      "international organization", "sanctions"
    ],
    moderateSignals: [
      "alliance", "treaty", "united nations", "nato",
      "international law", "soft power", "economic sanctions"
    ],
    weakSignals: []
  },

  "political_economy": {
    id: "political_economy",
    name: "Political Economy",
    related: ["institutions", "redistribution", "policy", "taxation"],
    adjacent: ["inequality", "development", "democracy"],
    strongSignals: [
      "political economy", "political economics",
      "political constraints", "political competition",
      "political incentive", "political determinants"
    ],
    moderateSignals: [
      "vested interest", "lobby", "lobbying", "interest group",
      "political influence", "revolving door", "regulatory capture",
      "political connection", "political cycle"
    ],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // INFORMATION & MEDIA
  // ─────────────────────────────────────────────────────────────────────────
  "media": {
    id: "media",
    name: "Media & News",
    related: ["news_media", "social_media", "information"],
    adjacent: ["public_opinion", "elections", "democracy", "polarization"],
    strongSignals: [
      "news media", "media bias", "media effect", "newspaper",
      "journalism", "media coverage", "media market",
      "media influence", "press freedom", "media consumption",
      "broadcast media", "television news"
    ],
    moderateSignals: [
      "news coverage", "media outlet", "journalist",
      "editorial", "media ownership", "media slant"
    ],
    weakSignals: [],
    contextualSignals: [
      { term: "media", requires: ["news", "journalist", "coverage", "outlet", "bias", "broadcast", "television", "radio", "consumption", "freedom"] },
      { term: "press", requires: ["freedom", "media", "news", "journalist", "newspaper"] }
    ]
  },

  "social_media": {
    id: "social_media",
    name: "Social Media & Digital Platforms",
    parent: "media",
    related: ["media", "information", "technology"],
    adjacent: ["public_opinion", "elections", "misinformation", "polarization"],
    strongSignals: [
      "social media", "facebook", "twitter", "instagram", "tiktok",
      "youtube", "online platform", "digital platform",
      "social media platform"
    ],
    moderateSignals: [
      "viral", "online content", "user-generated content",
      "platform regulation", "content moderation"
    ],
    weakSignals: []
  },

  "misinformation": {
    id: "misinformation",
    name: "Misinformation",
    parent: "media",
    related: ["media", "social_media", "public_opinion"],
    adjacent: ["elections", "health", "democracy"],
    strongSignals: [
      "misinformation", "disinformation", "fake news", "fact-check",
      "false information", "information disorder",
      "conspiracy theory"
    ],
    moderateSignals: [
      "propaganda", "misleading information", "debunking",
      "media literacy"
    ],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SOCIAL PHENOMENA
  // ─────────────────────────────────────────────────────────────────────────
  "social_networks": {
    id: "social_networks",
    name: "Social Networks & Peer Effects",
    related: ["peer_effects", "social_capital", "information"],
    adjacent: ["labor", "education", "crime"],
    strongSignals: [
      "social network", "peer effect", "peer effects",
      "network formation", "network structure",
      "peer influence", "social influence", "social contagion"
    ],
    moderateSignals: [
      "friendship network", "social tie", "social connection",
      "network centrality", "network position", "spillover effect"
    ],
    weakSignals: [],
    contextualSignals: [
      { term: "network", requires: ["peer", "social", "friendship", "tie", "connection", "centrality", "formation"] }
    ]
  },

  "peer_effects": {
    id: "peer_effects",
    name: "Peer Effects",
    parent: "social_networks",
    related: ["social_networks", "education", "labor"],
    adjacent: ["crime", "health"],
    strongSignals: [
      "peer effect", "peer effects", "peer influence",
      "peer group", "neighborhood effect"
    ],
    moderateSignals: [
      "social multiplier", "reflection problem",
      "endogenous peer effect", "contextual effect"
    ],
    weakSignals: []
  },

  "social_capital": {
    id: "social_capital",
    name: "Social Capital & Trust",
    related: ["social_networks", "institutions", "norms"],
    adjacent: ["development", "democracy", "crime"],
    strongSignals: [
      "social capital", "social trust", "civic participation",
      "social cohesion", "generalized trust",
      "interpersonal trust"
    ],
    moderateSignals: [
      "civic engagement", "community organization",
      "voluntary association", "trust game"
    ],
    weakSignals: [],
    contextualSignals: [
      { term: "trust", requires: ["social", "civic", "generalized", "interpersonal", "institutional", "political", "community"] }
    ]
  },

  "norms": {
    id: "norms",
    name: "Norms & Culture",
    related: ["social_capital", "institutions"],
    adjacent: ["development", "gender", "behavioral"],
    strongSignals: [
      "social norm", "cultural norm", "cultural values",
      "cultural economics", "cultural change", "social norms"
    ],
    moderateSignals: [
      "tradition", "custom", "cultural trait", "socialization",
      "cultural persistence", "value change"
    ],
    weakSignals: [],
    contextualSignals: [
      { term: "culture", requires: ["norm", "value", "tradition", "belief", "identity", "persistence", "cultural"] },
      { term: "norm", requires: ["social", "cultural", "gender", "enforcement", "compliance", "informal"] }
    ]
  },

  "religion": {
    id: "religion",
    name: "Religion",
    related: ["norms", "identity"],
    adjacent: ["politics", "conflict", "development"],
    strongSignals: [
      "religion", "religious", "church", "mosque",
      "secularization", "religious institution",
      "religious belief", "religiosity"
    ],
    moderateSignals: [
      "faith", "clergy", "religious freedom",
      "religious conflict", "missionary"
    ],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BEHAVIORAL / PSYCHOLOGY
  // ─────────────────────────────────────────────────────────────────────────
  "behavioral": {
    id: "behavioral",
    name: "Behavioral Economics",
    related: ["nudges", "biases", "decision_making"],
    adjacent: ["policy", "psychology", "health"],
    strongSignals: [
      "behavioral economics", "nudge", "choice architecture",
      "bounded rationality", "behavioral intervention",
      "behavioral insight", "behavioral science"
    ],
    moderateSignals: [
      "heuristic", "framing effect", "default option",
      "present bias", "time inconsistency", "reference point",
      "loss aversion", "prospect theory"
    ],
    weakSignals: []
  },

  "biases": {
    id: "biases",
    name: "Cognitive Biases",
    parent: "behavioral",
    related: ["behavioral", "decision_making"],
    adjacent: ["psychology", "finance"],
    strongSignals: [
      "cognitive bias", "overconfidence", "anchoring effect",
      "loss aversion", "present bias", "confirmation bias",
      "availability heuristic", "representativeness heuristic"
    ],
    moderateSignals: [
      "heuristic", "systematic error", "cognitive limitation",
      "status quo bias"
    ],
    weakSignals: []
  },

  "nudges": {
    id: "nudges",
    name: "Nudges & Choice Architecture",
    parent: "behavioral",
    related: ["behavioral", "policy"],
    adjacent: ["health", "savings"],
    strongSignals: [
      "nudge", "nudging", "choice architecture",
      "libertarian paternalism", "default effect",
      "behavioral policy"
    ],
    moderateSignals: [
      "opt-in", "opt-out", "behavioral intervention",
      "automatic enrollment"
    ],
    weakSignals: []
  },

  "decision_making": {
    id: "decision_making",
    name: "Decision Making",
    related: ["behavioral", "risk"],
    adjacent: ["psychology", "organizations"],
    strongSignals: [
      "decision making", "decision-making", "judgment under uncertainty",
      "choice under uncertainty", "decision theory"
    ],
    moderateSignals: [
      "cognitive process", "deliberation", "attention allocation",
      "information processing"
    ],
    weakSignals: []
  },

  "risk": {
    id: "risk",
    name: "Risk & Uncertainty",
    related: ["decision_making", "insurance", "finance"],
    adjacent: ["behavioral", "health"],
    strongSignals: [
      "risk aversion", "risk preference", "risk management",
      "expected utility", "uncertainty", "risk taking",
      "ambiguity aversion"
    ],
    moderateSignals: [
      "probability weighting", "insurance demand",
      "precautionary saving"
    ],
    weakSignals: [],
    contextualSignals: [
      { term: "risk", requires: ["aversion", "preference", "uncertainty", "insurance", "manage", "taking", "appetite", "tolerance"] }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ORGANIZATIONS & IO
  // ─────────────────────────────────────────────────────────────────────────
  "organizations": {
    id: "organizations",
    name: "Organizations & Firms",
    related: ["corporate_governance", "management", "firms"],
    adjacent: ["labor", "industrial_organization"],
    strongSignals: [
      "organizational behavior", "organizational structure",
      "firm organization", "management practice",
      "firm performance", "corporate culture"
    ],
    moderateSignals: [
      "organizational change", "firm dynamics",
      "employer-employee", "enterprise"
    ],
    weakSignals: [],
    contextualSignals: [
      { term: "firm", requires: ["productivity", "performance", "size", "entry", "exit", "dynamics", "manager", "employer"] }
    ]
  },

  "corporate_governance": {
    id: "corporate_governance",
    name: "Corporate Governance",
    parent: "organizations",
    related: ["organizations", "executive_comp", "finance"],
    adjacent: ["inequality", "management"],
    strongSignals: [
      "corporate governance", "board of directors", "shareholder activism",
      "executive compensation", "ceo pay", "agency problem",
      "corporate board"
    ],
    moderateSignals: [
      "ownership structure", "fiduciary duty", "proxy",
      "institutional investor", "corporate control"
    ],
    weakSignals: []
  },

  "industrial_organization": {
    id: "industrial_organization",
    name: "Industrial Organization",
    related: ["competition", "regulation", "organizations"],
    adjacent: ["antitrust", "innovation", "trade"],
    strongSignals: [
      "industrial organization", "market structure", "market power",
      "antitrust", "merger", "market concentration",
      "competition policy", "market definition"
    ],
    moderateSignals: [
      "oligopoly", "monopoly", "entry barrier",
      "horizontal merger", "vertical integration",
      "price discrimination", "herfindahl"
    ],
    weakSignals: []
  },

  "market_design": {
    id: "market_design",
    name: "Market Design & Matching",
    related: ["game_theory", "industrial_organization"],
    adjacent: ["education", "health", "labor"],
    strongSignals: [
      "market design", "matching market", "mechanism design",
      "school choice mechanism", "deferred acceptance",
      "auction design", "matching algorithm"
    ],
    moderateSignals: [
      "stable matching", "kidney exchange", "assignment mechanism",
      "allocation mechanism", "top trading cycle"
    ],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ECONOMIC HISTORY
  // ─────────────────────────────────────────────────────────────────────────
  "economic_history": {
    id: "economic_history",
    name: "Economic History",
    related: ["colonial_legacy", "growth", "institutions"],
    adjacent: ["development", "political_economy", "trade"],
    strongSignals: [
      "economic history", "historical economics",
      "historical evidence", "historical data",
      "nineteenth century", "eighteenth century",
      "interwar", "postwar period", "historical development"
    ],
    moderateSignals: [
      "historical", "archival data", "historical records",
      "long-run", "centuries", "preindustrial",
      "industrial revolution"
    ],
    weakSignals: []
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function getMethodFamily(methodId: string): string[] {
  const node = METHOD_TAXONOMY[methodId];
  if (!node) return [methodId];
  const family = new Set<string>([methodId]);
  if (node.parent) family.add(node.parent);
  if (node.siblings) node.siblings.forEach(s => family.add(s));
  if (node.implies) node.implies.forEach(m => family.add(m));
  if (node.impliedBy) node.impliedBy.forEach(m => family.add(m));
  return Array.from(family);
}

export function getTopicNeighborhood(topicId: string, depth: number = 1): {
  direct: string[];
  adjacent: string[];
} {
  const node = TOPIC_TAXONOMY[topicId];
  if (!node) return { direct: [topicId], adjacent: [] };
  const direct = new Set<string>([topicId, ...node.related]);
  const adjacent = new Set<string>(node.adjacent);
  direct.forEach(d => adjacent.delete(d));
  if (depth >= 2) {
    node.related.forEach(relatedId => {
      const relatedNode = TOPIC_TAXONOMY[relatedId];
      if (relatedNode) {
        relatedNode.related.forEach(r => { if (!direct.has(r)) adjacent.add(r); });
        relatedNode.adjacent.forEach(a => { if (!direct.has(a)) adjacent.add(a); });
      }
    });
  }
  if (depth >= 3) {
    const currentAdjacent = Array.from(adjacent);
    for (const adjId of currentAdjacent) {
      const adjNode = TOPIC_TAXONOMY[adjId];
      if (adjNode) {
        adjNode.related.forEach(r => { if (!direct.has(r) && !adjacent.has(r)) adjacent.add(r); });
      }
    }
  }
  return { direct: Array.from(direct), adjacent: Array.from(adjacent) };
}

// ═══════════════════════════════════════════════════════════════════════════
// FIELD AFFINITY MAP
// ═══════════════════════════════════════════════════════════════════════════

export const FIELD_AFFINITY: Record<string, Record<string, number>> = {
  "Development Economics": {
    "Labor Economics": 0.7, "Public Economics": 0.7, "Health Economics": 0.65,
    "Microeconomics": 0.5, "International Economics": 0.6, "Environmental Economics": 0.55,
    "Agricultural Economics": 0.7, "Urban Economics": 0.5, "Behavioral Economics": 0.45,
    "Economic History": 0.5, "Political Economy": 0.75, "Comparative Politics": 0.6,
    "Public Policy": 0.65, "Demography": 0.55, "Sociology": 0.45,
  },
  "Labor Economics": {
    "Public Economics": 0.7, "Development Economics": 0.7, "Health Economics": 0.6,
    "Microeconomics": 0.6, "Behavioral Economics": 0.55, "Urban Economics": 0.6,
    "Industrial Organization": 0.5, "Economic History": 0.45, "Demography": 0.6,
    "Sociology": 0.5, "Public Policy": 0.6, "Law and Economics": 0.45,
    "Management / Organization Studies": 0.5, "Econometrics": 0.4,
  },
  "Public Economics": {
    "Labor Economics": 0.7, "Development Economics": 0.7, "Health Economics": 0.65,
    "Microeconomics": 0.6, "Macroeconomics": 0.55, "Urban Economics": 0.55,
    "Environmental Economics": 0.55, "Political Economy": 0.7, "Public Policy": 0.75,
    "Law and Economics": 0.6, "Public Administration": 0.6, "Behavioral Economics": 0.5,
  },
  "Macroeconomics": {
    "Financial Economics": 0.65, "International Economics": 0.7, "Public Economics": 0.55,
    "Econometrics": 0.55, "Economic History": 0.55, "Development Economics": 0.45,
    "Labor Economics": 0.4, "Political Economy": 0.5,
  },
  "Microeconomics": {
    "Industrial Organization": 0.75, "Behavioral Economics": 0.7, "Labor Economics": 0.6,
    "Public Economics": 0.6, "Health Economics": 0.55, "Econometrics": 0.5,
    "Law and Economics": 0.6, "Management / Organization Studies": 0.5,
  },
  "Financial Economics": {
    "Macroeconomics": 0.65, "Industrial Organization": 0.5, "Econometrics": 0.5,
    "International Economics": 0.5, "Behavioral Economics": 0.5, "Law and Economics": 0.55,
    "Management / Organization Studies": 0.55,
  },
  "Econometrics": {
    "Microeconomics": 0.5, "Macroeconomics": 0.55, "Labor Economics": 0.4,
    "Financial Economics": 0.5, "Political Methodology": 0.65,
  },
  "International Economics": {
    "Macroeconomics": 0.7, "Development Economics": 0.6, "Financial Economics": 0.5,
    "Political Economy": 0.6, "International Relations": 0.65, "Economic History": 0.45,
  },
  "Industrial Organization": {
    "Microeconomics": 0.75, "Law and Economics": 0.65, "Financial Economics": 0.5,
    "Management / Organization Studies": 0.6, "Labor Economics": 0.5, "Public Economics": 0.5,
    "Behavioral Economics": 0.5,
  },
  "Behavioral Economics": {
    "Microeconomics": 0.7, "Psychology (Behavioral/Social)": 0.75, "Health Economics": 0.5,
    "Public Economics": 0.5, "Labor Economics": 0.55, "Industrial Organization": 0.5,
    "Development Economics": 0.45, "Management / Organization Studies": 0.55,
  },
  "Health Economics": {
    "Public Economics": 0.65, "Labor Economics": 0.6, "Development Economics": 0.65,
    "Behavioral Economics": 0.5, "Microeconomics": 0.55, "Demography": 0.6,
    "Public Policy": 0.6, "Psychology (Behavioral/Social)": 0.45,
  },
  "Environmental Economics": {
    "Public Economics": 0.55, "Development Economics": 0.55, "International Economics": 0.4,
    "Agricultural Economics": 0.6, "Urban Economics": 0.5, "Political Economy": 0.45,
    "Public Policy": 0.55,
  },
  "Urban Economics": {
    "Labor Economics": 0.6, "Public Economics": 0.55, "Environmental Economics": 0.5,
    "Development Economics": 0.5, "Sociology": 0.5, "Demography": 0.55,
  },
  "Economic History": {
    "Macroeconomics": 0.55, "Development Economics": 0.5, "Political Economy": 0.6,
    "International Economics": 0.45, "Labor Economics": 0.45, "Comparative Politics": 0.5,
  },
  "Agricultural Economics": {
    "Development Economics": 0.7, "Environmental Economics": 0.6, "Health Economics": 0.4,
    "International Economics": 0.4,
  },
  "Political Economy": {
    "Public Economics": 0.7, "Development Economics": 0.75, "Comparative Politics": 0.75,
    "International Relations": 0.5, "Public Policy": 0.7, "Economic History": 0.6,
    "Labor Economics": 0.5, "Macroeconomics": 0.5, "Sociology": 0.5,
    "Public Administration": 0.55,
  },
  "Comparative Politics": {
    "Political Economy": 0.75, "International Relations": 0.55, "Public Policy": 0.6,
    "Development Economics": 0.6, "Sociology": 0.55, "Economic History": 0.5,
    "Security Studies": 0.45, "Public Administration": 0.55,
  },
  "International Relations": {
    "Political Economy": 0.5, "Comparative Politics": 0.55, "Security Studies": 0.7,
    "International Economics": 0.65, "Public Policy": 0.45, "Economic History": 0.4,
  },
  "American Politics": {
    "Public Policy": 0.65, "Political Economy": 0.5, "Comparative Politics": 0.45,
    "Public Administration": 0.55, "Sociology": 0.45, "Law and Economics": 0.5,
  },
  "Public Policy": {
    "Public Economics": 0.75, "Political Economy": 0.7, "Public Administration": 0.7,
    "Health Economics": 0.6, "Labor Economics": 0.6, "Development Economics": 0.65,
    "American Politics": 0.65, "Comparative Politics": 0.6, "Sociology": 0.5,
  },
  "Security Studies": {
    "International Relations": 0.7, "Comparative Politics": 0.45, "Political Economy": 0.35,
  },
  "Political Methodology": {
    "Econometrics": 0.65, "Political Economy": 0.4, "Comparative Politics": 0.4,
  },
};

export function getFieldAffinity(fieldA: string, fieldB: string): number {
  if (fieldA === fieldB) return 1.0;
  const affinityMap = FIELD_AFFINITY[fieldA];
  if (affinityMap && affinityMap[fieldB] !== undefined) return affinityMap[fieldB];
  const reverseMap = FIELD_AFFINITY[fieldB];
  if (reverseMap && reverseMap[fieldA] !== undefined) return reverseMap[fieldA];
  return 0.2;
}

// ═══════════════════════════════════════════════════════════════════════════
// INTEREST → TAXONOMY MAPPING
// ═══════════════════════════════════════════════════════════════════════════

export const INTEREST_TO_TAXONOMY: Record<string, string[]> = {
  // Methods as interests
  "Causal Inference": ["causal_inference"],
  "Machine Learning / AI": ["machine_learning", "causal_ml", "automation"],
  "Experimental Methods": ["rct", "field_experiment", "survey_experiment"],
  "Formal Theory / Game Theory": ["game_theory", "theory", "market_design"],
  // Economics topics
  "Inequality": ["inequality", "top_incomes", "mobility"],
  "Education": ["education", "schools", "higher_ed", "teachers", "child_development"],
  "Housing": ["housing", "urban", "segregation"],
  "Health": ["health", "healthcare", "mortality"],
  "Labor Markets": ["labor", "wages", "employment", "monopsony", "unions"],
  "Poverty and Welfare": ["poverty", "welfare_programs"],
  "Taxation": ["taxation", "public_economics"],
  "Trade and Globalization": ["trade", "globalization"],
  "Monetary Policy": ["monetary_policy", "inflation", "finance"],
  "Fiscal Policy": ["fiscal_policy", "public_economics"],
  "Innovation and Technology": ["innovation", "entrepreneurship", "automation"],
  "Development": ["development", "aid", "microfinance", "agriculture", "colonial_legacy"],
  "Climate and Energy": ["environment", "climate_change", "energy", "natural_disasters"],
  "Agriculture and Food": ["agriculture", "development", "land"],
  "Finance and Banking": ["finance", "monetary_policy"],
  "Entrepreneurship": ["entrepreneurship", "innovation"],
  "Economic Growth": ["growth", "productivity"],
  // Political topics
  "Elections and Voting": ["elections"],
  "Democracy and Democratization": ["democracy", "authoritarianism"],
  "Conflict and Security": ["conflict"],
  "International Cooperation": ["international_relations"],
  "Political Institutions": ["institutions", "state_capacity"],
  "Public Opinion": ["public_opinion", "polarization"],
  "Political Behavior": ["elections", "public_opinion", "polarization"],
  "Accountability and Transparency": ["accountability"],
  "Corruption": ["corruption"],
  "Rule of Law": ["institutions", "crime"],
  "State Capacity": ["state_capacity", "institutions", "development"],
  "Authoritarianism": ["authoritarianism", "democracy"],
  "Political Polarization": ["polarization", "public_opinion", "media"],
  // Social topics
  "Gender": ["gender", "family", "discrimination"],
  "Race and Ethnicity": ["race", "segregation", "discrimination"],
  "Immigration": ["immigration"],
  "Crime and Justice": ["crime", "policing", "incarceration"],
  "Social Mobility": ["mobility", "inequality"],
  "Social Networks": ["social_networks", "peer_effects"],
  "Media and Information": ["media", "social_media"],
  "Social Media and Digital Platforms": ["social_media"],
  "Misinformation and Fake News": ["misinformation"],
  "Trust and Social Capital": ["social_capital"],
  "Norms and Culture": ["norms", "colonial_legacy"],
  "Religion": ["religion"],
  "Economic History": ["economic_history", "colonial_legacy"],
  // Organizational / Behavioral
  "Organizations and Firms": ["organizations", "corporate_governance"],
  "Corporate Governance": ["corporate_governance"],
  "Leadership": ["organizations"],
  "Decision Making": ["decision_making", "behavioral"],
  "Behavioral Biases": ["biases", "behavioral"],
  "Nudges and Choice Architecture": ["nudges", "behavioral"],
  "Risk and Uncertainty": ["risk"],
  "Prosocial Behavior": ["social_capital"],
};

// ═══════════════════════════════════════════════════════════════════════════
// METHOD → TAXONOMY MAPPING
// ═══════════════════════════════════════════════════════════════════════════

export const METHOD_TO_TAXONOMY: Record<string, string[]> = {
  // Quantitative
  "Difference-in-Differences": ["diff_in_diff", "causal_inference"],
  "Regression Discontinuity": ["regression_discontinuity", "causal_inference"],
  "Instrumental Variables": ["instrumental_variables", "causal_inference"],
  "Randomized Experiments (RCTs)": ["rct", "field_experiment", "causal_inference"],
  "Synthetic Control": ["synthetic_control", "causal_inference"],
  "Bunching Estimation": ["bunching", "causal_inference"],
  "Event Studies": ["event_studies", "diff_in_diff", "causal_inference"],
  "Structural Models": ["structural_estimation", "discrete_choice"],
  "Game Theoretic Models": ["game_theory", "theory"],
  "Mechanism Design": ["game_theory", "market_design"],
  "Machine Learning Methods": ["machine_learning", "causal_ml"],
  "Panel Data Methods": ["panel_data"],
  "Time Series Analysis": ["time_series"],
  "Bayesian Methods": ["bayesian"],
  "Network Analysis": ["network_analysis"],
  "Text Analysis / NLP": ["text_analysis"],
  "Spatial Analysis / GIS": ["spatial"],
  "Survey Experiments": ["survey_experiment", "rct"],
  // Qualitative
  "Case Studies": ["case_study", "qualitative"],
  "Comparative Historical Analysis": ["comparative_historical", "qualitative"],
  "Process Tracing": ["process_tracing", "qualitative"],
  "Interviews": ["interviews", "qualitative"],
  "Ethnography": ["ethnography", "qualitative"],
  "Focus Groups": ["interviews", "qualitative"],
  "Content Analysis": ["content_analysis", "qualitative"],
  "Discourse Analysis": ["discourse_analysis", "qualitative"],
  "Archival Research": ["comparative_historical", "qualitative"],
  "Participant Observation": ["ethnography", "qualitative"],
  // Mixed
  "Meta-Analysis": ["meta_analysis", "synthesis"],
  "Systematic Review": ["meta_analysis", "literature_review", "synthesis"],
  "Mixed Methods Design": ["qualitative", "quantitative"],
  "Multi-Method Research": ["qualitative", "quantitative"],
  "Replication Studies": ["quantitative"],
  "Literature Review / Survey": ["literature_review", "synthesis"],
};
