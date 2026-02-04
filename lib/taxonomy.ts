/**
 * Academic Knowledge Taxonomy for Econvery
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This module encodes the STRUCTURE of academic knowledge in economics and
 * political science. It captures:
 * 
 * 1. HIERARCHICAL relationships (causal inference → DiD, RDD, IV, etc.)
 * 2. LATERAL connections (inequality ↔ education ↔ mobility)
 * 3. METHODOLOGICAL camps (structural vs. reduced-form)
 * 4. DETECTION rules (what signals indicate what concepts)
 * 
 * The key insight: different concepts have different "detectability"
 * - "regression discontinuity" almost always means RDD (high specificity)
 * - "network" could mean many things (low specificity, needs context)
 * - "model" is almost meaningless alone (requires disambiguation)
 */

// ═══════════════════════════════════════════════════════════════════════════
// METHODOLOGICAL TAXONOMY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Methods are organized by epistemological approach:
 * 
 * CAUSAL IDENTIFICATION (reduced-form)
 * └── Experimental
 * └── Quasi-experimental
 * └── Selection/Matching
 * 
 * STRUCTURAL (model-based)
 * └── Demand/Supply estimation
 * └── Dynamic models
 * └── Game-theoretic
 * 
 * DESCRIPTIVE/PREDICTIVE
 * └── Machine learning
 * └── Forecasting
 * 
 * QUALITATIVE
 * └── Case studies
 * └── Ethnography
 * └── Historical
 */

export interface MethodNode {
  id: string;
  name: string;
  parent?: string;
  siblings?: string[];  // Conceptually related methods
  
  // Detection rules
  strongSignals: string[];     // Single mention = confident detection
  moderateSignals: string[];   // Need 2+ or corroboration
  weakSignals: string[];       // Only with other evidence
  negativeSignals?: string[];  // Suggests NOT this method
  
  // For matching
  impliedBy?: string[];        // If user selects parent, include this
  implies?: string[];          // If detected, also relevant to these
}

export const METHOD_TAXONOMY: Record<string, MethodNode> = {
  // ─────────────────────────────────────────────────────────────────────────
  // CAUSAL INFERENCE (Meta-category)
  // ─────────────────────────────────────────────────────────────────────────
  "causal_inference": {
    id: "causal_inference",
    name: "Causal Inference",
    strongSignals: [
      "causal effect", "causal inference", "causal identification",
      "identification strategy", "causal impact", "causal estimate"
    ],
    moderateSignals: [
      "treatment effect", "counterfactual", "endogeneity", "selection bias",
      "omitted variable", "unobserved heterogeneity"
    ],
    weakSignals: ["effect of", "impact of", "causes"],
    implies: [
      "diff_in_diff", "regression_discontinuity", "instrumental_variables",
      "rct", "synthetic_control", "event_studies", "matching"
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // EXPERIMENTAL METHODS
  // ─────────────────────────────────────────────────────────────────────────
  "rct": {
    id: "rct",
    name: "Randomized Experiments",
    parent: "causal_inference",
    siblings: ["field_experiment", "lab_experiment", "survey_experiment"],
    strongSignals: [
      "randomized controlled trial", "rct", "randomized experiment",
      "random assignment", "randomization", "randomised"
    ],
    moderateSignals: [
      "field experiment", "lab experiment", "experimental", "randomly assigned",
      "treatment group", "control group", "experimental design"
    ],
    weakSignals: ["experiment", "treated", "treatment"],
    impliedBy: ["causal_inference"],
    implies: ["causal_inference"]
  },

  "field_experiment": {
    id: "field_experiment",
    name: "Field Experiments",
    parent: "rct",
    strongSignals: ["field experiment", "field trial", "in the field"],
    moderateSignals: ["real-world experiment", "natural setting"],
    weakSignals: [],
    impliedBy: ["rct"],
    implies: ["rct", "causal_inference"]
  },

  "survey_experiment": {
    id: "survey_experiment",
    name: "Survey Experiments",
    parent: "rct",
    strongSignals: [
      "survey experiment", "conjoint", "vignette experiment",
      "list experiment", "endorsement experiment"
    ],
    moderateSignals: ["factorial design", "experimental survey"],
    weakSignals: [],
    impliedBy: ["rct"],
    implies: ["rct"]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // QUASI-EXPERIMENTAL METHODS
  // ─────────────────────────────────────────────────────────────────────────
  "diff_in_diff": {
    id: "diff_in_diff",
    name: "Difference-in-Differences",
    parent: "causal_inference",
    siblings: ["event_studies", "synthetic_control"],
    strongSignals: [
      "difference-in-differences", "diff-in-diff", "difference in differences",
      "did ", "did,", "did.", "triple difference", "ddd"
    ],
    moderateSignals: [
      "parallel trends", "pre-trends", "two-way fixed effects", "twfe",
      "staggered adoption", "staggered treatment"
    ],
    weakSignals: ["treatment and control", "before and after"],
    negativeSignals: ["discontinuity", "cutoff", "threshold"],
    impliedBy: ["causal_inference"],
    implies: ["causal_inference", "panel_data"]
  },

  "regression_discontinuity": {
    id: "regression_discontinuity",
    name: "Regression Discontinuity",
    parent: "causal_inference",
    strongSignals: [
      "regression discontinuity", "rdd", "rd design", "discontinuity design",
      "sharp rd", "fuzzy rd", "sharp regression discontinuity",
      "fuzzy regression discontinuity"
    ],
    moderateSignals: [
      "running variable", "forcing variable", "cutoff", "threshold",
      "bandwidth", "local polynomial", "discontinuity at"
    ],
    weakSignals: ["just above", "just below", "around the threshold"],
    negativeSignals: ["difference-in-differences", "parallel trends"],
    impliedBy: ["causal_inference"],
    implies: ["causal_inference"]
  },

  "instrumental_variables": {
    id: "instrumental_variables",
    name: "Instrumental Variables",
    parent: "causal_inference",
    strongSignals: [
      "instrumental variable", "instrument ", "2sls", "two-stage least squares",
      "tsls", "iv ", "iv,", "iv."
    ],
    moderateSignals: [
      "exclusion restriction", "first stage", "first-stage", "weak instrument",
      "late", "local average treatment effect", "complier"
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
      "synthetic control", "synthetic control method", "scm",
      "synthetic counterfactual"
    ],
    moderateSignals: ["donor pool", "synthetic", "comparative case study"],
    weakSignals: [],
    impliedBy: ["causal_inference"],
    implies: ["causal_inference"]
  },

  "event_studies": {
    id: "event_studies",
    name: "Event Studies",
    parent: "causal_inference",
    siblings: ["diff_in_diff"],
    strongSignals: ["event study", "event-study", "dynamic effects"],
    moderateSignals: [
      "leads and lags", "pre-period", "post-period", "event window",
      "event time"
    ],
    weakSignals: ["before and after the event"],
    impliedBy: ["causal_inference", "diff_in_diff"],
    implies: ["causal_inference"]
  },

  "bunching": {
    id: "bunching",
    name: "Bunching Estimation",
    parent: "causal_inference",
    strongSignals: [
      "bunching", "bunching estimation", "excess mass", "missing mass",
      "bunching design"
    ],
    moderateSignals: ["kink", "notch", "threshold"],
    weakSignals: [],
    impliedBy: ["causal_inference"],
    implies: ["causal_inference"]
  },

  "matching": {
    id: "matching",
    name: "Matching Methods",
    parent: "causal_inference",
    strongSignals: [
      "propensity score matching", "matching estimator", "coarsened exact matching",
      "nearest neighbor matching", "matched sample"
    ],
    moderateSignals: [
      "propensity score", "matching on observables", "selection on observables"
    ],
    weakSignals: ["matched"],
    impliedBy: ["causal_inference"],
    implies: ["causal_inference"]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // STRUCTURAL METHODS
  // ─────────────────────────────────────────────────────────────────────────
  "structural_estimation": {
    id: "structural_estimation",
    name: "Structural Estimation",
    strongSignals: [
      "structural estimation", "structural model", "structural approach",
      "estimated structural", "structural parameters"
    ],
    moderateSignals: [
      "counterfactual simulation", "policy simulation", "model estimation",
      "estimated model", "model parameters"
    ],
    weakSignals: ["structural"],
    negativeSignals: ["reduced-form", "quasi-experimental"],
    implies: ["theory", "discrete_choice"]
  },

  "discrete_choice": {
    id: "discrete_choice",
    name: "Discrete Choice Models",
    parent: "structural_estimation",
    strongSignals: [
      "discrete choice", "blp", "berry levinsohn pakes", "random coefficients",
      "mixed logit", "nested logit"
    ],
    moderateSignals: [
      "demand estimation", "choice model", "logit", "multinomial"
    ],
    weakSignals: ["consumer choice", "product choice"],
    impliedBy: ["structural_estimation"],
    implies: ["structural_estimation"]
  },

  "game_theory": {
    id: "game_theory",
    name: "Game Theory / Formal Models",
    strongSignals: [
      "game theory", "game theoretic", "nash equilibrium", "subgame perfect",
      "mechanism design", "formal model", "formal theory"
    ],
    moderateSignals: [
      "equilibrium", "strategic interaction", "signaling", "cheap talk",
      "principal-agent", "contract theory", "auction"
    ],
    weakSignals: ["game", "strategic", "players"],
    implies: ["theory"]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // STATISTICAL / ML METHODS
  // ─────────────────────────────────────────────────────────────────────────
  "machine_learning": {
    id: "machine_learning",
    name: "Machine Learning",
    strongSignals: [
      "machine learning", "random forest", "neural network", "deep learning",
      "gradient boosting", "xgboost", "lasso", "ridge regression",
      "elastic net", "cross-validation"
    ],
    moderateSignals: [
      "prediction", "out-of-sample", "regularization", "supervised learning",
      "training data", "test data"
    ],
    weakSignals: ["algorithm", "predictive"],
    implies: ["quantitative"]
  },

  "causal_ml": {
    id: "causal_ml",
    name: "Causal Machine Learning",
    parent: "machine_learning",
    siblings: ["causal_inference"],
    strongSignals: [
      "causal forest", "double machine learning", "double ml", "causal ml",
      "heterogeneous treatment effects", "cate"
    ],
    moderateSignals: ["honest inference", "sample splitting"],
    weakSignals: [],
    impliedBy: ["machine_learning", "causal_inference"],
    implies: ["machine_learning", "causal_inference"]
  },

  "panel_data": {
    id: "panel_data",
    name: "Panel Data Methods",
    strongSignals: ["panel data", "longitudinal data", "panel regression"],
    moderateSignals: [
      "fixed effects", "random effects", "within estimator",
      "individual fixed effects", "time fixed effects", "entity fixed effects"
    ],
    weakSignals: ["over time", "panel"],
    implies: ["quantitative"]
  },

  "time_series": {
    id: "time_series",
    name: "Time Series",
    strongSignals: [
      "time series", "var", "vector autoregression", "arima", "cointegration"
    ],
    moderateSignals: [
      "granger causality", "impulse response", "autoregressive", "forecast"
    ],
    weakSignals: ["over time"],
    implies: ["quantitative"]
  },

  "text_analysis": {
    id: "text_analysis",
    name: "Text Analysis / NLP",
    strongSignals: [
      "text analysis", "natural language processing", "nlp", "text mining",
      "topic model", "lda", "word embedding", "word2vec", "bert"
    ],
    moderateSignals: [
      "sentiment analysis", "text classification", "corpus", "textual"
    ],
    weakSignals: ["text data", "documents"],
    implies: ["quantitative"]
  },

  "network_analysis": {
    id: "network_analysis",
    name: "Network Analysis",
    strongSignals: [
      "network analysis", "social network analysis", "centrality",
      "network structure", "graph theory", "network topology"
    ],
    moderateSignals: [
      "clustering coefficient", "degree distribution", "community detection",
      "network formation"
    ],
    weakSignals: [],
    negativeSignals: ["neural network"],
    implies: ["quantitative"]
  },

  "spatial": {
    id: "spatial",
    name: "Spatial Analysis",
    strongSignals: [
      "spatial econometrics", "spatial analysis", "gis", "geographic",
      "geospatial", "spatial regression"
    ],
    moderateSignals: ["spatial correlation", "spatial dependence", "location"],
    weakSignals: [],
    implies: ["quantitative"]
  },

  "bayesian": {
    id: "bayesian",
    name: "Bayesian Methods",
    strongSignals: [
      "bayesian", "posterior", "prior", "mcmc", "markov chain monte carlo",
      "gibbs sampling", "bayesian inference"
    ],
    moderateSignals: ["credible interval", "bayesian estimation"],
    weakSignals: [],
    implies: ["quantitative"]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // QUALITATIVE METHODS
  // ─────────────────────────────────────────────────────────────────────────
  "case_study": {
    id: "case_study",
    name: "Case Studies",
    strongSignals: [
      "case study", "case-study", "single case", "comparative case",
      "within-case", "case selection"
    ],
    moderateSignals: ["in-depth analysis", "detailed examination"],
    weakSignals: ["case of"],
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
      "comparative historical", "historical institutionalism",
      "path dependence", "critical juncture"
    ],
    moderateSignals: [
      "historical comparison", "historical analysis", "historical sociology"
    ],
    weakSignals: ["historically"],
    implies: ["qualitative"]
  },

  "ethnography": {
    id: "ethnography",
    name: "Ethnography",
    strongSignals: [
      "ethnograph", "participant observation", "fieldwork", "field research"
    ],
    moderateSignals: ["immersion", "observational study", "field notes"],
    weakSignals: [],
    implies: ["qualitative"]
  },

  "interviews": {
    id: "interviews",
    name: "Interviews",
    strongSignals: [
      "semi-structured interview", "in-depth interview", "elite interview",
      "qualitative interview"
    ],
    moderateSignals: ["interview", "respondent", "interviewee"],
    weakSignals: [],
    implies: ["qualitative"]
  },

  "content_analysis": {
    id: "content_analysis",
    name: "Content Analysis",
    strongSignals: ["content analysis", "qualitative content", "coding scheme"],
    moderateSignals: ["thematic analysis", "codebook"],
    weakSignals: [],
    implies: ["qualitative"]
  },

  "discourse_analysis": {
    id: "discourse_analysis",
    name: "Discourse Analysis",
    strongSignals: [
      "discourse analysis", "critical discourse", "framing analysis",
      "narrative analysis"
    ],
    moderateSignals: ["discursive", "rhetorical analysis"],
    weakSignals: [],
    implies: ["qualitative"]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SYNTHESIS METHODS
  // ─────────────────────────────────────────────────────────────────────────
  "meta_analysis": {
    id: "meta_analysis",
    name: "Meta-Analysis",
    strongSignals: [
      "meta-analysis", "meta analysis", "systematic review", "pooled estimate"
    ],
    moderateSignals: [
      "effect size", "publication bias", "forest plot", "funnel plot",
      "prisma"
    ],
    weakSignals: ["review of studies"],
    implies: ["synthesis"]
  },

  "literature_review": {
    id: "literature_review",
    name: "Literature Review",
    strongSignals: [
      "literature review", "survey article", "review article",
      "state of the art", "handbook"
    ],
    moderateSignals: ["synthesis", "overview of the literature"],
    weakSignals: ["we review"],
    implies: ["synthesis"]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // META-CATEGORIES
  // ─────────────────────────────────────────────────────────────────────────
  "quantitative": {
    id: "quantitative",
    name: "Quantitative Research",
    strongSignals: [],
    moderateSignals: [
      "regression", "coefficient", "standard error", "statistical significance",
      "p-value", "estimate", "sample size", "n ="
    ],
    weakSignals: ["data", "analysis"],
    implies: []
  },

  "qualitative": {
    id: "qualitative",
    name: "Qualitative Research",
    strongSignals: ["qualitative"],
    moderateSignals: [
      "interview", "fieldwork", "case study", "ethnograph", "archival"
    ],
    weakSignals: [],
    implies: []
  },

  "theory": {
    id: "theory",
    name: "Theoretical Contribution",
    strongSignals: ["theoretical model", "theoretical framework", "we model"],
    moderateSignals: [
      "proposition", "theorem", "proof", "lemma", "we show that"
    ],
    weakSignals: ["theory", "theoretical"],
    implies: []
  },

  "synthesis": {
    id: "synthesis",
    name: "Synthesis / Review",
    strongSignals: ["review", "synthesis", "meta-analysis", "survey"],
    moderateSignals: ["we summarize", "literature on"],
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
  related: string[];          // Strongly related topics
  adjacent: string[];         // Somewhat related (discovery potential)
  
  // Detection
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
    adjacent: ["education", "labor", "taxation", "housing"],
    strongSignals: [
      "inequality", "income inequality", "wealth inequality", "gini",
      "income distribution", "wealth distribution"
    ],
    moderateSignals: [
      "top 1%", "top 10%", "income share", "wealth share", "distributional"
    ],
    weakSignals: ["distribution", "unequal"]
  },

  "mobility": {
    id: "mobility",
    name: "Social Mobility",
    parent: "inequality",
    related: ["inequality", "education", "opportunity"],
    adjacent: ["poverty", "labor", "housing"],
    strongSignals: [
      "social mobility", "intergenerational mobility", "economic mobility",
      "income mobility", "upward mobility"
    ],
    moderateSignals: [
      "intergenerational", "transmission across generations",
      "opportunity", "american dream"
    ],
    weakSignals: ["mobility", "moving up"]
  },

  "poverty": {
    id: "poverty",
    name: "Poverty & Welfare",
    related: ["inequality", "welfare_programs", "development"],
    adjacent: ["mobility", "labor", "health", "housing"],
    strongSignals: [
      "poverty", "poor", "low-income", "below poverty line",
      "poverty rate", "poverty reduction"
    ],
    moderateSignals: [
      "disadvantaged", "deprivation", "hardship", "food insecurity"
    ],
    weakSignals: []
  },

  "welfare_programs": {
    id: "welfare_programs",
    name: "Welfare Programs",
    parent: "poverty",
    related: ["poverty", "redistribution", "taxation"],
    adjacent: ["labor", "health", "family"],
    strongSignals: [
      "welfare", "social assistance", "transfer program", "safety net",
      "food stamps", "snap", "eitc", "tanf", "medicaid"
    ],
    moderateSignals: [
      "benefit", "social insurance", "unemployment insurance",
      "means-tested"
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
      "transfer"
    ],
    moderateSignals: ["from rich to poor", "inequality reduction"],
    weakSignals: []
  },

  "top_incomes": {
    id: "top_incomes",
    name: "Top Incomes & Wealth",
    parent: "inequality",
    related: ["inequality", "taxation", "executive_comp"],
    adjacent: ["finance", "corporate_governance"],
    strongSignals: [
      "top income", "top 1%", "top 0.1%", "billionaire", "ultra-wealthy",
      "wealth concentration"
    ],
    moderateSignals: ["high earners", "rich", "wealthy"],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LABOR & EMPLOYMENT
  // ─────────────────────────────────────────────────────────────────────────
  "labor": {
    id: "labor",
    name: "Labor Markets",
    related: ["employment", "wages", "human_capital"],
    adjacent: ["education", "inequality", "immigration", "gender"],
    strongSignals: [
      "labor market", "labor economics", "employment", "unemployment",
      "labor supply", "labor demand"
    ],
    moderateSignals: [
      "worker", "job", "employer", "workforce", "occupation"
    ],
    weakSignals: ["work", "working"]
  },

  "wages": {
    id: "wages",
    name: "Wages & Earnings",
    parent: "labor",
    related: ["labor", "inequality", "minimum_wage"],
    adjacent: ["education", "gender", "immigration"],
    strongSignals: [
      "wage", "wages", "earnings", "compensation", "pay gap",
      "wage inequality"
    ],
    moderateSignals: ["salary", "income", "hourly"],
    weakSignals: []
  },

  "minimum_wage": {
    id: "minimum_wage",
    name: "Minimum Wage",
    parent: "wages",
    related: ["wages", "labor", "policy"],
    adjacent: ["poverty", "inequality"],
    strongSignals: ["minimum wage"],
    moderateSignals: ["wage floor", "living wage"],
    weakSignals: []
  },

  "employment": {
    id: "employment",
    name: "Employment & Unemployment",
    parent: "labor",
    related: ["labor", "business_cycles"],
    adjacent: ["welfare_programs", "education"],
    strongSignals: [
      "employment", "unemployment", "jobless", "layoff",
      "unemployment rate", "job loss"
    ],
    moderateSignals: ["hiring", "fired", "job search", "job finding"],
    weakSignals: ["job", "employed"]
  },

  "human_capital": {
    id: "human_capital",
    name: "Human Capital",
    related: ["education", "labor", "skills"],
    adjacent: ["mobility", "wages", "health"],
    strongSignals: [
      "human capital", "skill", "skills", "training", "returns to education"
    ],
    moderateSignals: ["learning", "ability", "cognitive"],
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
      "education", "educational", "school", "student", "teacher",
      "learning", "academic achievement"
    ],
    moderateSignals: [
      "classroom", "curriculum", "instruction", "test score", "grade"
    ],
    weakSignals: []
  },

  "schools": {
    id: "schools",
    name: "K-12 Education",
    parent: "education",
    related: ["education", "teachers", "achievement_gap"],
    adjacent: ["inequality", "segregation", "local_government"],
    strongSignals: [
      "school", "k-12", "elementary", "high school", "middle school",
      "public school", "charter school"
    ],
    moderateSignals: [
      "district", "principal", "classroom", "student achievement"
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
      "graduate", "bachelor", "tuition"
    ],
    moderateSignals: ["enrollment", "degree", "campus", "professor"],
    weakSignals: []
  },

  "teachers": {
    id: "teachers",
    name: "Teachers & Teaching",
    parent: "schools",
    related: ["schools", "education"],
    adjacent: ["labor", "public_sector"],
    strongSignals: [
      "teacher", "teaching", "teacher quality", "teacher effectiveness",
      "value-added"
    ],
    moderateSignals: ["instructor", "educator", "classroom"],
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
      "racial gap in"
    ],
    moderateSignals: ["gap in", "disparities in achievement"],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // HEALTH
  // ─────────────────────────────────────────────────────────────────────────
  "health": {
    id: "health",
    name: "Health",
    related: ["healthcare", "mortality", "health_behaviors"],
    adjacent: ["poverty", "inequality", "labor", "aging"],
    strongSignals: [
      "health", "health economics", "healthcare", "medical",
      "mortality", "morbidity"
    ],
    moderateSignals: [
      "hospital", "physician", "doctor", "patient", "disease",
      "life expectancy"
    ],
    weakSignals: ["healthy"]
  },

  "healthcare": {
    id: "healthcare",
    name: "Healthcare & Insurance",
    parent: "health",
    related: ["health", "health_insurance"],
    adjacent: ["poverty", "public_economics"],
    strongSignals: [
      "healthcare", "health care", "health insurance", "medicare",
      "medicaid", "aca", "obamacare", "uninsured"
    ],
    moderateSignals: ["coverage", "insurance", "provider"],
    weakSignals: []
  },

  "mortality": {
    id: "mortality",
    name: "Mortality & Life Expectancy",
    parent: "health",
    related: ["health", "aging", "inequality"],
    adjacent: ["poverty", "environment"],
    strongSignals: [
      "mortality", "death", "life expectancy", "survival",
      "deaths of despair"
    ],
    moderateSignals: ["death rate", "lifespan", "longevity"],
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
      "housing", "house price", "home price", "rent", "rental",
      "housing market", "real estate"
    ],
    moderateSignals: [
      "mortgage", "homeowner", "tenant", "landlord", "eviction",
      "homelessness", "affordability"
    ],
    weakSignals: ["home", "house"]
  },

  "urban": {
    id: "urban",
    name: "Urban Economics",
    related: ["housing", "cities", "transportation"],
    adjacent: ["inequality", "environment", "crime"],
    strongSignals: [
      "urban", "city", "cities", "metropolitan", "urban economics",
      "agglomeration"
    ],
    moderateSignals: [
      "neighborhood", "zoning", "land use", "density", "sprawl"
    ],
    weakSignals: []
  },

  "segregation": {
    id: "segregation",
    name: "Residential Segregation",
    parent: "urban",
    related: ["urban", "housing", "race"],
    adjacent: ["inequality", "education", "mobility"],
    strongSignals: [
      "segregation", "residential segregation", "neighborhood sorting"
    ],
    moderateSignals: ["dissimilarity index", "exposure", "isolation"],
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
      "finance", "financial", "banking", "bank", "credit",
      "financial market", "stock market"
    ],
    moderateSignals: [
      "loan", "investment", "asset", "portfolio", "interest rate"
    ],
    weakSignals: []
  },

  "monetary_policy": {
    id: "monetary_policy",
    name: "Monetary Policy",
    related: ["finance", "business_cycles", "inflation"],
    adjacent: ["fiscal_policy", "banking"],
    strongSignals: [
      "monetary policy", "central bank", "federal reserve", "fed",
      "interest rate", "quantitative easing"
    ],
    moderateSignals: [
      "inflation", "money supply", "policy rate", "zero lower bound"
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
      "austerity", "fiscal multiplier"
    ],
    moderateSignals: ["deficit", "budget", "public debt"],
    weakSignals: []
  },

  "business_cycles": {
    id: "business_cycles",
    name: "Business Cycles & Recessions",
    related: ["monetary_policy", "employment", "finance"],
    adjacent: ["fiscal_policy", "labor"],
    strongSignals: [
      "business cycle", "recession", "great recession", "economic crisis",
      "financial crisis", "boom", "bust"
    ],
    moderateSignals: ["downturn", "recovery", "expansion", "contraction"],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TAXATION & PUBLIC ECONOMICS
  // ─────────────────────────────────────────────────────────────────────────
  "taxation": {
    id: "taxation",
    name: "Taxation",
    related: ["public_economics", "redistribution", "fiscal_policy"],
    adjacent: ["inequality", "labor", "corporate"],
    strongSignals: [
      "tax", "taxation", "income tax", "tax rate", "tax policy",
      "tax reform", "tax evasion", "tax avoidance"
    ],
    moderateSignals: [
      "marginal tax", "tax base", "tax revenue", "progressive",
      "regressive"
    ],
    weakSignals: []
  },

  "public_economics": {
    id: "public_economics",
    name: "Public Economics",
    related: ["taxation", "government_spending", "public_goods"],
    adjacent: ["political_economy", "welfare_programs"],
    strongSignals: [
      "public economics", "public finance", "government", "public good",
      "public provision"
    ],
    moderateSignals: ["publicly provided", "government intervention"],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TRADE & INTERNATIONAL
  // ─────────────────────────────────────────────────────────────────────────
  "trade": {
    id: "trade",
    name: "International Trade",
    related: ["globalization", "tariffs", "offshoring"],
    adjacent: ["labor", "inequality", "development"],
    strongSignals: [
      "international trade", "trade", "tariff", "import", "export",
      "trade policy", "trade agreement"
    ],
    moderateSignals: [
      "comparative advantage", "trade war", "protectionism", "wto"
    ],
    weakSignals: []
  },

  "globalization": {
    id: "globalization",
    name: "Globalization",
    parent: "trade",
    related: ["trade", "offshoring", "immigration"],
    adjacent: ["labor", "inequality"],
    strongSignals: [
      "globalization", "globalisation", "china shock", "global value chain"
    ],
    moderateSignals: ["offshoring", "outsourcing", "multinational"],
    weakSignals: ["global"]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DEVELOPMENT
  // ─────────────────────────────────────────────────────────────────────────
  "development": {
    id: "development",
    name: "Development Economics",
    related: ["poverty", "growth", "aid"],
    adjacent: ["health", "education", "institutions"],
    strongSignals: [
      "development economics", "developing country", "developing world",
      "economic development", "global south"
    ],
    moderateSignals: [
      "poor country", "low-income country", "third world", "ldcs"
    ],
    weakSignals: ["development"]
  },

  "aid": {
    id: "aid",
    name: "Foreign Aid",
    parent: "development",
    related: ["development", "international"],
    adjacent: ["poverty", "institutions"],
    strongSignals: [
      "foreign aid", "development aid", "oda", "international aid"
    ],
    moderateSignals: ["donor", "recipient", "aid effectiveness"],
    weakSignals: ["aid"]
  },

  "microfinance": {
    id: "microfinance",
    name: "Microfinance",
    parent: "development",
    related: ["development", "finance", "poverty"],
    adjacent: ["credit", "entrepreneurship"],
    strongSignals: [
      "microfinance", "microcredit", "microinsurance", "grameen"
    ],
    moderateSignals: ["small loans", "village banking"],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CLIMATE & ENVIRONMENT
  // ─────────────────────────────────────────────────────────────────────────
  "environment": {
    id: "environment",
    name: "Environment & Climate",
    related: ["climate_change", "pollution", "energy"],
    adjacent: ["health", "development", "policy"],
    strongSignals: [
      "environment", "environmental", "climate", "climate change",
      "pollution", "emissions", "carbon"
    ],
    moderateSignals: [
      "greenhouse gas", "sustainability", "green", "ecological"
    ],
    weakSignals: []
  },

  "climate_change": {
    id: "climate_change",
    name: "Climate Change",
    parent: "environment",
    related: ["environment", "energy", "policy"],
    adjacent: ["development", "agriculture"],
    strongSignals: [
      "climate change", "global warming", "carbon emissions",
      "greenhouse gas", "climate policy"
    ],
    moderateSignals: ["carbon tax", "cap and trade", "mitigation"],
    weakSignals: []
  },

  "energy": {
    id: "energy",
    name: "Energy",
    parent: "environment",
    related: ["environment", "climate_change"],
    adjacent: ["industrial_organization", "regulation"],
    strongSignals: [
      "energy", "electricity", "renewable", "fossil fuel",
      "solar", "wind", "oil", "natural gas"
    ],
    moderateSignals: ["power plant", "energy market", "energy policy"],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // INNOVATION & TECHNOLOGY
  // ─────────────────────────────────────────────────────────────────────────
  "innovation": {
    id: "innovation",
    name: "Innovation & Technology",
    related: ["patents", "entrepreneurship", "productivity"],
    adjacent: ["labor", "industrial_organization", "growth"],
    strongSignals: [
      "innovation", "technological change", "technology", "invention",
      "patent", "r&d", "research and development"
    ],
    moderateSignals: [
      "startup", "creative destruction", "technology adoption"
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
      "entrepreneur", "entrepreneurship", "startup", "founder",
      "small business", "self-employment"
    ],
    moderateSignals: ["new firm", "business creation", "venture"],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DEMOGRAPHICS & FAMILY
  // ─────────────────────────────────────────────────────────────────────────
  "gender": {
    id: "gender",
    name: "Gender",
    related: ["family", "labor", "discrimination"],
    adjacent: ["wages", "education", "politics"],
    strongSignals: [
      "gender", "gender gap", "women", "female", "male",
      "gender inequality", "gender discrimination"
    ],
    moderateSignals: [
      "sex difference", "motherhood", "fatherhood", "wage gap"
    ],
    weakSignals: []
  },

  "family": {
    id: "family",
    name: "Family Economics",
    related: ["gender", "fertility", "marriage"],
    adjacent: ["labor", "education", "child_development"],
    strongSignals: [
      "family", "household", "marriage", "divorce", "fertility",
      "child", "children", "parenting"
    ],
    moderateSignals: [
      "birth", "childbearing", "spouse", "maternity", "paternity"
    ],
    weakSignals: []
  },

  "immigration": {
    id: "immigration",
    name: "Immigration",
    related: ["migration", "labor"],
    adjacent: ["wages", "public_opinion", "policy"],
    strongSignals: [
      "immigration", "immigrant", "migration", "migrant",
      "foreign-born", "native-born"
    ],
    moderateSignals: [
      "refugee", "asylum", "visa", "border", "undocumented",
      "naturalization"
    ],
    weakSignals: []
  },

  "race": {
    id: "race",
    name: "Race & Ethnicity",
    related: ["discrimination", "inequality"],
    adjacent: ["segregation", "education", "crime", "politics"],
    strongSignals: [
      "race", "racial", "ethnicity", "ethnic", "black", "white",
      "hispanic", "asian", "african american"
    ],
    moderateSignals: [
      "minority", "racial gap", "racial inequality", "discrimination"
    ],
    weakSignals: []
  },

  "aging": {
    id: "aging",
    name: "Aging & Retirement",
    related: ["health", "pensions", "labor"],
    adjacent: ["family", "public_economics"],
    strongSignals: [
      "aging", "elderly", "retirement", "pension", "social security",
      "older workers"
    ],
    moderateSignals: ["retiree", "old age", "senior"],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CRIME & INSTITUTIONS
  // ─────────────────────────────────────────────────────────────────────────
  "crime": {
    id: "crime",
    name: "Crime & Criminal Justice",
    related: ["policing", "incarceration"],
    adjacent: ["poverty", "race", "policy"],
    strongSignals: [
      "crime", "criminal", "policing", "police", "incarceration",
      "prison", "criminal justice"
    ],
    moderateSignals: [
      "arrest", "conviction", "sentencing", "recidivism", "violence",
      "homicide"
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
      "police", "policing", "law enforcement", "officer"
    ],
    moderateSignals: ["patrol", "arrest", "stop and frisk"],
    weakSignals: []
  },

  "incarceration": {
    id: "incarceration",
    name: "Incarceration",
    parent: "crime",
    related: ["crime", "labor"],
    adjacent: ["poverty", "race", "family"],
    strongSignals: [
      "incarceration", "prison", "jail", "imprisonment", "mass incarceration"
    ],
    moderateSignals: ["inmate", "correctional", "sentence"],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // POLITICAL SCIENCE TOPICS
  // ─────────────────────────────────────────────────────────────────────────
  "elections": {
    id: "elections",
    name: "Elections & Voting",
    related: ["voting_behavior", "campaigns", "political_participation"],
    adjacent: ["political_economy", "public_opinion", "media"],
    strongSignals: [
      "election", "voting", "voter", "vote", "electoral", "ballot",
      "turnout", "candidate"
    ],
    moderateSignals: [
      "primary", "campaign", "poll", "partisan", "democrat", "republican"
    ],
    weakSignals: []
  },

  "democracy": {
    id: "democracy",
    name: "Democracy & Democratization",
    related: ["institutions", "authoritarianism", "political_development"],
    adjacent: ["elections", "accountability", "civil_liberties"],
    strongSignals: [
      "democracy", "democratic", "democratization", "authoritarian",
      "autocracy", "regime"
    ],
    moderateSignals: [
      "political freedom", "civil liberties", "political rights"
    ],
    weakSignals: []
  },

  "authoritarianism": {
    id: "authoritarianism",
    name: "Authoritarianism",
    related: ["democracy", "repression", "institutions"],
    adjacent: ["conflict", "political_economy"],
    strongSignals: [
      "authoritarian", "autocracy", "dictatorship", "repression",
      "one-party", "strongman"
    ],
    moderateSignals: ["censorship", "political control", "regime"],
    weakSignals: []
  },

  "conflict": {
    id: "conflict",
    name: "Conflict & Security",
    related: ["civil_war", "international_security", "violence"],
    adjacent: ["development", "institutions", "international_relations"],
    strongSignals: [
      "conflict", "war", "civil war", "violence", "military",
      "armed conflict", "peace"
    ],
    moderateSignals: [
      "battle", "casualty", "rebellion", "insurgency", "terrorism"
    ],
    weakSignals: []
  },

  "accountability": {
    id: "accountability",
    name: "Accountability & Transparency",
    related: ["corruption", "institutions", "governance"],
    adjacent: ["democracy", "elections", "media"],
    strongSignals: [
      "accountability", "transparency", "oversight", "audit",
      "freedom of information", "disclosure"
    ],
    moderateSignals: ["monitoring", "watchdog", "checks and balances"],
    weakSignals: []
  },

  "corruption": {
    id: "corruption",
    name: "Corruption",
    related: ["accountability", "institutions", "governance"],
    adjacent: ["development", "political_economy"],
    strongSignals: [
      "corruption", "bribery", "embezzlement", "graft",
      "anti-corruption", "kleptocracy"
    ],
    moderateSignals: [
      "rent-seeking", "clientelism", "patronage", "nepotism"
    ],
    weakSignals: []
  },

  "institutions": {
    id: "institutions",
    name: "Political Institutions",
    related: ["democracy", "governance", "legislature"],
    adjacent: ["political_economy", "development"],
    strongSignals: [
      "institution", "institutional", "constitution", "legislature",
      "parliament", "congress", "executive", "judiciary"
    ],
    moderateSignals: [
      "bureaucracy", "state capacity", "federalism", "decentralization"
    ],
    weakSignals: []
  },

  "public_opinion": {
    id: "public_opinion",
    name: "Public Opinion",
    related: ["political_behavior", "media", "elections"],
    adjacent: ["policy", "democracy"],
    strongSignals: [
      "public opinion", "survey", "polling", "poll", "attitudes"
    ],
    moderateSignals: ["belief", "preference", "opinion"],
    weakSignals: []
  },

  "international_relations": {
    id: "international_relations",
    name: "International Relations",
    related: ["conflict", "diplomacy", "international_cooperation"],
    adjacent: ["trade", "security"],
    strongSignals: [
      "international relations", "foreign policy", "diplomacy",
      "international", "bilateral", "multilateral"
    ],
    moderateSignals: ["alliance", "treaty", "un", "nato"],
    weakSignals: []
  },

  "political_economy": {
    id: "political_economy",
    name: "Political Economy",
    related: ["institutions", "redistribution", "policy"],
    adjacent: ["inequality", "development", "democracy"],
    strongSignals: [
      "political economy", "political economics"
    ],
    moderateSignals: [
      "vested interest", "political constraint", "lobby", "lobbying"
    ],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // INFORMATION & MEDIA
  // ─────────────────────────────────────────────────────────────────────────
  "media": {
    id: "media",
    name: "Media",
    related: ["news_media", "social_media", "information"],
    adjacent: ["public_opinion", "elections", "democracy"],
    strongSignals: [
      "media", "news", "journalism", "newspaper", "television",
      "press", "broadcast"
    ],
    moderateSignals: ["coverage", "media bias", "media effects"],
    weakSignals: [],
    contextualSignals: [
      { term: "media", requires: ["news", "press", "journalist", "coverage", "outlet"] }
    ]
  },

  "social_media": {
    id: "social_media",
    name: "Social Media & Platforms",
    parent: "media",
    related: ["media", "information", "technology"],
    adjacent: ["public_opinion", "elections", "misinformation"],
    strongSignals: [
      "social media", "facebook", "twitter", "instagram", "tiktok",
      "youtube", "platform"
    ],
    moderateSignals: ["viral", "online", "post", "share"],
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
      "false information"
    ],
    moderateSignals: ["propaganda", "rumor", "misleading"],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SOCIAL PHENOMENA
  // ─────────────────────────────────────────────────────────────────────────
  "social_networks": {
    id: "social_networks",
    name: "Social Networks",
    related: ["peer_effects", "social_capital", "information"],
    adjacent: ["labor", "education", "crime"],
    strongSignals: [
      "social network", "peer effect", "peer effects", "network structure",
      "network formation", "network analysis"
    ],
    moderateSignals: [
      "friendship", "social tie", "social connection", "centrality",
      "network position"
    ],
    weakSignals: [],
    contextualSignals: [
      { term: "network", requires: ["peer", "social", "friendship", "tie", "connection", "centrality"] }
    ]
  },

  "peer_effects": {
    id: "peer_effects",
    name: "Peer Effects",
    parent: "social_networks",
    related: ["social_networks", "education", "labor"],
    adjacent: ["crime", "health"],
    strongSignals: [
      "peer effect", "peer effects", "peer influence", "social influence",
      "contagion"
    ],
    moderateSignals: ["spillover", "neighborhood effect"],
    weakSignals: []
  },

  "social_capital": {
    id: "social_capital",
    name: "Social Capital & Trust",
    related: ["social_networks", "institutions", "culture"],
    adjacent: ["development", "democracy", "crime"],
    strongSignals: [
      "social capital", "trust", "social trust", "civic participation",
      "social cohesion"
    ],
    moderateSignals: ["cooperation", "community", "civic"],
    weakSignals: []
  },

  "norms": {
    id: "norms",
    name: "Norms & Culture",
    related: ["social_capital", "institutions"],
    adjacent: ["development", "gender", "behavior"],
    strongSignals: [
      "social norm", "norm", "culture", "cultural", "tradition", "custom"
    ],
    moderateSignals: ["values", "beliefs", "socialization"],
    weakSignals: []
  },

  "religion": {
    id: "religion",
    name: "Religion",
    related: ["norms", "identity"],
    adjacent: ["politics", "conflict", "development"],
    strongSignals: [
      "religion", "religious", "church", "mosque", "temple",
      "christian", "muslim", "islam", "catholic", "protestant"
    ],
    moderateSignals: ["faith", "secularization", "clergy"],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BEHAVIORAL / PSYCHOLOGY
  // ─────────────────────────────────────────────────────────────────────────
  "behavioral": {
    id: "behavioral",
    name: "Behavioral Economics",
    related: ["nudges", "biases", "decision_making"],
    adjacent: ["policy", "psychology"],
    strongSignals: [
      "behavioral economics", "behavioral", "nudge", "choice architecture"
    ],
    moderateSignals: [
      "bounded rationality", "heuristic", "bias", "framing"
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
      "bias", "cognitive bias", "overconfidence", "anchoring",
      "loss aversion", "present bias"
    ],
    moderateSignals: ["heuristic", "systematic error"],
    weakSignals: []
  },

  "nudges": {
    id: "nudges",
    name: "Nudges & Policy",
    parent: "behavioral",
    related: ["behavioral", "policy"],
    adjacent: ["health", "savings"],
    strongSignals: [
      "nudge", "nudging", "choice architecture", "default",
      "libertarian paternalism"
    ],
    moderateSignals: ["behavioral intervention", "opt-in", "opt-out"],
    weakSignals: []
  },

  "decision_making": {
    id: "decision_making",
    name: "Decision Making",
    related: ["behavioral", "risk"],
    adjacent: ["psychology", "organizations"],
    strongSignals: [
      "decision making", "decision-making", "judgment", "choice"
    ],
    moderateSignals: ["cognitive", "deliberation"],
    weakSignals: []
  },

  "risk": {
    id: "risk",
    name: "Risk & Uncertainty",
    related: ["decision_making", "insurance", "finance"],
    adjacent: ["behavioral", "health"],
    strongSignals: [
      "risk", "uncertainty", "risk aversion", "risk preference",
      "expected utility"
    ],
    moderateSignals: ["probability", "gamble", "lottery"],
    weakSignals: []
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ORGANIZATIONS
  // ─────────────────────────────────────────────────────────────────────────
  "organizations": {
    id: "organizations",
    name: "Organizations & Firms",
    related: ["corporate_governance", "management"],
    adjacent: ["labor", "industrial_organization"],
    strongSignals: [
      "organization", "firm", "company", "corporate", "enterprise"
    ],
    moderateSignals: ["employer", "organizational"],
    weakSignals: []
  },

  "corporate_governance": {
    id: "corporate_governance",
    name: "Corporate Governance",
    parent: "organizations",
    related: ["organizations", "executive_comp", "finance"],
    adjacent: ["inequality", "management"],
    strongSignals: [
      "corporate governance", "board of directors", "shareholder",
      "ceo", "executive compensation"
    ],
    moderateSignals: ["ownership", "agency", "fiduciary"],
    weakSignals: []
  },

  "industrial_organization": {
    id: "industrial_organization",
    name: "Industrial Organization",
    related: ["competition", "regulation", "organizations"],
    adjacent: ["antitrust", "innovation"],
    strongSignals: [
      "industrial organization", "market structure", "competition",
      "market power", "antitrust", "merger"
    ],
    moderateSignals: ["oligopoly", "monopoly", "entry", "exit"],
    weakSignals: []
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all methods that are implied by a given method
 * (including itself and all parents/children)
 */
export function getMethodFamily(methodId: string): string[] {
  const node = METHOD_TAXONOMY[methodId];
  if (!node) return [methodId];
  
  const family = new Set<string>([methodId]);
  
  // Add parent
  if (node.parent) family.add(node.parent);
  
  // Add siblings
  if (node.siblings) node.siblings.forEach(s => family.add(s));
  
  // Add implied methods
  if (node.implies) node.implies.forEach(m => family.add(m));
  
  // Add methods that imply this one
  if (node.impliedBy) node.impliedBy.forEach(m => family.add(m));
  
  return Array.from(family);
}

/**
 * Get all topics that are related to a given topic
 * (for discovery purposes)
 */
export function getTopicNeighborhood(topicId: string, depth: number = 1): {
  direct: string[];
  adjacent: string[];
} {
  const node = TOPIC_TAXONOMY[topicId];
  if (!node) return { direct: [topicId], adjacent: [] };
  
  const direct = new Set<string>([topicId, ...node.related]);
  const adjacent = new Set<string>(node.adjacent);
  
  // Remove direct from adjacent
  direct.forEach(d => adjacent.delete(d));
  
  // If depth > 1, add related topics' related topics
  if (depth > 1) {
    node.related.forEach(relatedId => {
      const relatedNode = TOPIC_TAXONOMY[relatedId];
      if (relatedNode) {
        relatedNode.related.forEach(r => {
          if (!direct.has(r)) adjacent.add(r);
        });
      }
    });
  }
  
  return {
    direct: Array.from(direct),
    adjacent: Array.from(adjacent)
  };
}

/**
 * Map user-facing interest names to taxonomy IDs
 */
export const INTEREST_TO_TAXONOMY: Record<string, string[]> = {
  // Methodological interests
  "Causal Inference": ["causal_inference"],
  "Machine Learning / AI": ["machine_learning", "causal_ml"],
  "Experimental Methods": ["rct", "field_experiment", "survey_experiment"],
  "Formal Theory / Game Theory": ["game_theory", "theory"],
  
  // Economic topics
  "Inequality": ["inequality", "top_incomes"],
  "Education": ["education", "schools", "higher_ed", "teachers"],
  "Housing": ["housing", "urban"],
  "Health": ["health", "healthcare", "mortality"],
  "Labor Markets": ["labor", "wages", "employment"],
  "Poverty and Welfare": ["poverty", "welfare_programs"],
  "Taxation": ["taxation", "public_economics"],
  "Trade and Globalization": ["trade", "globalization"],
  "Monetary Policy": ["monetary_policy", "finance"],
  "Fiscal Policy": ["fiscal_policy", "public_economics"],
  "Innovation and Technology": ["innovation", "entrepreneurship"],
  "Development": ["development", "aid"],
  "Climate and Energy": ["environment", "climate_change", "energy"],
  "Agriculture and Food": ["development"], // Limited coverage
  "Finance and Banking": ["finance", "monetary_policy"],
  "Entrepreneurship": ["entrepreneurship", "innovation"],
  
  // Political topics
  "Elections and Voting": ["elections"],
  "Democracy and Democratization": ["democracy", "authoritarianism"],
  "Conflict and Security": ["conflict"],
  "International Cooperation": ["international_relations"],
  "Political Institutions": ["institutions"],
  "Public Opinion": ["public_opinion"],
  "Political Behavior": ["elections", "public_opinion"],
  "Accountability and Transparency": ["accountability"],
  "Corruption": ["corruption"],
  "Rule of Law": ["institutions", "crime"],
  "State Capacity": ["institutions", "development"],
  "Authoritarianism": ["authoritarianism", "democracy"],
  
  // Social topics
  "Gender": ["gender", "family"],
  "Race and Ethnicity": ["race", "segregation"],
  "Immigration": ["immigration"],
  "Crime and Justice": ["crime", "policing", "incarceration"],
  "Social Mobility": ["mobility", "inequality"],
  "Social Networks": ["social_networks", "peer_effects"],
  "Media and Information": ["media", "news_media"],
  "Social Media and Digital Platforms": ["social_media"],
  "Misinformation and Fake News": ["misinformation"],
  "Trust and Social Capital": ["social_capital"],
  "Norms and Culture": ["norms"],
  "Religion": ["religion"],
  
  // Behavioral
  "Organizations and Firms": ["organizations", "corporate_governance"],
  "Corporate Governance": ["corporate_governance"],
  "Leadership": ["organizations"],
  "Decision Making": ["decision_making", "behavioral"],
  "Behavioral Biases": ["biases", "behavioral"],
  "Nudges and Choice Architecture": ["nudges", "behavioral"],
  "Risk and Uncertainty": ["risk"],
  "Prosocial Behavior": ["social_capital"],
};

/**
 * Map user-facing method names to taxonomy IDs
 */
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
  "Mechanism Design": ["game_theory"],
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
