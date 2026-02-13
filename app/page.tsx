"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  ArrowLeft, ArrowRight, Search, RotateCcw, Sparkles,
  SkipForward, BookOpen, FlaskConical, Lightbulb, Globe,
  Brain, Key, CheckCircle, AlertCircle, ExternalLink,
  ChevronDown, Compass, Focus
} from "lucide-react";
import { ProgressDots, PaperCard, Loading, FunLoading, MultiSelect } from "@/components";
import { 
  getProfileOptions, getGroupedOptions,
  APPROACH_PREFERENCES, isGeneralistField, getMethodsByApproach
} from "@/lib/profile-options";
import { 
  getJournalOptions, getCoreJournals, getWorkingPapers,
  getJournalsByTier, getSmartJournalDefaults, getAllJournalsList
} from "@/lib/journals";
import type { ScoredPaper, UserProfile, ApproachPreference, JournalField } from "@/lib/types";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const TOTAL_STEPS = 8;
const TOP_DISPLAY = 15;
const MAX_RESULTS = 50;
const profileOptions = getProfileOptions();
const groupedOptions = getGroupedOptions();
const journalOptions = getJournalOptions();

// ═══════════════════════════════════════════════════════════════════════════
// STATE INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

interface AppState {
  step: number;
  name: string;
  level: string;
  field: string;
  approachPreference: ApproachPreference;
  explorationLevel: number; // 0 = narrow, 0.5 = balanced, 1 = exploratory
  interests: string[];
  methods: string[];
  region: string;
  fieldType: "Economics" | "Political Science" | "Both";
  includeWorkingPapers: boolean;
  includeAdjacentFields: boolean;
  selectedAdjacentFields: JournalField[];
  journals: string[];
  days: number;
  papers: ScoredPaper[];
  summary: string;
  isLoading: boolean;
  error: string | null;
  geminiApiKey: string;
  geminiModel: string;
  aiEnabled: boolean;
  aiKeyValid: boolean | null;
  aiKeyValidating: boolean;
  aiReranking: boolean;
  aiEnhanced: boolean;
  aiPapersScored: number;
  aiError: string | null;
}

const initialState: AppState = {
  step: 1,
  name: "",
  level: "Curious Learner",
  field: "General Interest (Show me everything)",
  approachPreference: "no_preference",
  explorationLevel: 0.5,
  interests: [],
  methods: [],
  region: "Global / No Preference",
  fieldType: "Both",
  includeWorkingPapers: true,
  includeAdjacentFields: false,
  selectedAdjacentFields: [],
  journals: [],
  days: 30,
  papers: [],
  summary: "",
  isLoading: false,
  error: null,
  geminiApiKey: "",
  geminiModel: "gemini-2.5-flash",
  aiEnabled: false,
  aiKeyValid: null,
  aiKeyValidating: false,
  aiReranking: false,
  aiEnhanced: false,
  aiPapersScored: 0,
  aiError: null,
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function Home() {
  const [state, setState] = useState<AppState>(initialState);

  useEffect(() => {
    const saved = localStorage.getItem("econvery-state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.step < TOTAL_STEPS) {
          setState((s) => ({ ...s, ...parsed, papers: [], summary: "" }));
        }
      } catch (e) { console.error("Failed to restore state:", e); }
    }
  }, []);

  useEffect(() => {
    const toSave = { 
      ...state, papers: [], summary: "", isLoading: false, error: null,
      aiReranking: false, aiEnhanced: false, aiPapersScored: 0, aiError: null, aiKeyValidating: false,
    };
    localStorage.setItem("econvery-state", JSON.stringify(toSave));
  }, [state]);

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState((s) => ({ ...s, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    setState((s) => ({ ...s, step: Math.min(s.step + 1, TOTAL_STEPS) }));
  }, []);

  const prevStep = useCallback(() => {
    setState((s) => ({ ...s, step: Math.max(s.step - 1, 1) }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setState((s) => ({ ...s, step }));
  }, []);

  const startOver = useCallback(() => {
    setState({ ...initialState });
    localStorage.removeItem("econvery-state");
  }, []);

  const discoverPapers = useCallback(async () => {
    updateState({ isLoading: true, error: null, aiEnhanced: false, aiError: null, aiPapersScored: 0 });

    try {
      const profile: UserProfile = {
        name: state.name,
        academic_level: state.level,
        primary_field: state.field,
        interests: state.interests,
        methods: state.methods,
        region: state.region,
        approach_preference: state.approachPreference,
        experience_type: isGeneralistField(state.field) ? "generalist" : "specialist",
        include_adjacent_fields: state.includeAdjacentFields,
        selected_adjacent_fields: state.selectedAdjacentFields,
        exploration_level: state.explorationLevel,
      };

      const journalParam = state.journals.length > 0 
        ? state.journals.join(",") 
        : getCoreJournals().join(",");
        
      const papersRes = await fetch(
        `/api/papers?daysBack=${state.days}&maxResults=100&journals=${encodeURIComponent(journalParam)}`
      );
      
      if (!papersRes.ok) throw new Error("Failed to fetch papers");
      const papersData = await papersRes.json();
      if (papersData.error) throw new Error(papersData.error);

      if (!papersData.papers?.length) {
        updateState({ isLoading: false, error: "No papers found. Try expanding your date range or journal selection." });
        return;
      }

      const recommendRes = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, papers: papersData.papers }),
      });

      if (!recommendRes.ok) throw new Error("Failed to process papers");
      const recommendData = await recommendRes.json();
      let finalPapers = recommendData.papers;
      let aiEnhanced = false;
      let aiPapersScored = 0;
      let aiError: string | null = null;

      if (state.aiEnabled && state.geminiApiKey.trim()) {
        updateState({ aiReranking: true });
        try {
          const aiRes = await fetch("/api/ai-rerank", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "rerank",
              apiKey: state.geminiApiKey,
              model: state.geminiModel,
              profile,
              papers: recommendData.papers,
            }),
          });
          const aiData = await aiRes.json();
          if (aiRes.ok && aiData.aiEnhanced) {
            finalPapers = aiData.papers;
            aiEnhanced = true;
            aiPapersScored = aiData.aiPapersScored || 0;
          }
          if (aiData.error) aiError = aiData.error;
        } catch (err) {
          aiError = err instanceof Error ? err.message : "AI scoring failed";
        }
      }

      updateState({
        papers: finalPapers,
        summary: recommendData.summary,
        isLoading: false,
        aiReranking: false,
        aiEnhanced,
        aiPapersScored,
        aiError,
      });
    } catch (err) {
      updateState({
        isLoading: false,
        aiReranking: false,
        error: err instanceof Error ? err.message : "Something went wrong",
      });
    }
  }, [state, updateState]);

  const renderStep = () => {
    const stepProps = { state, updateState, nextStep, prevStep, goToStep, startOver, discoverPapers };
    switch (state.step) {
      case 1: return <StepWelcome {...stepProps} />;
      case 2: return <StepLevel {...stepProps} />;
      case 3: return <StepField {...stepProps} />;
      case 4: return <StepApproach {...stepProps} />;
      case 5: return <StepInterests {...stepProps} />;
      case 6: return <StepMethods {...stepProps} />;
      case 7: return <StepSources {...stepProps} />;
      case 8: return <StepResults {...stepProps} />;
      default: return <StepWelcome {...stepProps} />;
    }
  };

  return (
    <main className="relative z-10 min-h-screen px-4 py-12">
      <div className="mx-auto max-w-lg">
        {renderStep()}
      </div>
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

interface StepProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  startOver: () => void;
  discoverPapers: () => Promise<void>;
}

// ─── STEP 1: WELCOME ─────────────────────────────────────────────────────

function StepWelcome({ state, updateState, nextStep }: StepProps) {
  return (
    <div className="animate-fade-in">
      <h1 className="text-center font-display text-display-lg font-light tracking-tight" style={{ color: "var(--ink)" }}>
        Econvery
      </h1>
      <p className="mt-2 text-center text-lg" style={{ color: "var(--ink-muted)" }}>
        Discover research that matters to you.
      </p>

      <ProgressDots current={1} total={TOTAL_STEPS} />

      <div className="mt-8">
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--ink-faint)" }}>
          Let us start
        </p>
        <h2 className="mt-2 font-display text-display-sm font-normal" style={{ color: "var(--ink)" }}>
          What is your name?
        </h2>
        <p className="mt-1" style={{ color: "var(--ink-muted)" }}>
          We will personalize your experience.
        </p>

        <input
          type="text"
          value={state.name}
          onChange={(e) => updateState({ name: e.target.value })}
          onKeyDown={(e) => { if (e.key === "Enter" && state.name.trim()) nextStep(); }}
          placeholder="First name"
          className="mt-6 w-full"
          autoFocus
        />

        <button onClick={nextStep} disabled={!state.name.trim()} className="btn-primary mt-6 w-full">
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── STEP 2: LEVEL ───────────────────────────────────────────────────────

function StepLevel({ state, updateState, nextStep, prevStep }: StepProps) {
  return (
    <div className="animate-fade-in">
      <ProgressDots current={2} total={TOTAL_STEPS} />
      <p className="text-lg" style={{ color: "var(--ink-soft)" }}>Nice to meet you, {state.name}.</p>
      <h2 className="mt-4 font-display text-display-sm font-normal" style={{ color: "var(--ink)" }}>
        What best describes you?
      </h2>
      <p className="mt-1" style={{ color: "var(--ink-muted)" }}>No academic background needed — curious minds welcome.</p>

      <div className="mt-6 space-y-2">
        {groupedOptions.academic_levels.groups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--ink-faint)" }}>{group.label}</p>
            <div className="space-y-1">
              {group.options.map((level) => (
                <button
                  key={level}
                  onClick={() => updateState({ level })}
                  className={`option-btn ${state.level === level ? "selected" : ""}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={prevStep} className="btn-secondary flex-1"><ArrowLeft className="h-4 w-4" /> Back</button>
        <button onClick={nextStep} className="btn-primary flex-1">Continue <ArrowRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

// ─── STEP 3: FIELD ───────────────────────────────────────────────────────

function StepField({ state, updateState, nextStep, prevStep }: StepProps) {
  const isGeneralist = isGeneralistField(state.field);
  return (
    <div className="animate-fade-in">
      <ProgressDots current={3} total={TOTAL_STEPS} />
      <h2 className="font-display text-display-sm font-normal" style={{ color: "var(--ink)" }}>What interests you most?</h2>
      <p className="mt-1" style={{ color: "var(--ink-muted)" }}>Pick a focus area, or explore broadly.</p>

      <div className="mt-6 space-y-4">
        {groupedOptions.primary_fields.groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--ink-faint)" }}>{group.label}</p>
            <div className="grid grid-cols-1 gap-1">
              {group.options.map((field) => (
                <button
                  key={field}
                  onClick={() => updateState({ field })}
                  className={`option-btn ${state.field === field ? "selected" : ""}`}
                >
                  {field}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isGeneralist && (
        <div className="mt-4 rounded-xl p-4 text-sm" style={{ background: "var(--burgundy-wash)", color: "var(--burgundy)" }}>
          <Lightbulb className="mb-1 inline h-4 w-4" />{" "}
          Great choice! We will show you quality research from across disciplines.
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button onClick={prevStep} className="btn-secondary flex-1"><ArrowLeft className="h-4 w-4" /> Back</button>
        <button onClick={nextStep} className="btn-primary flex-1">Continue <ArrowRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

// ─── STEP 4: APPROACH + EXPLORATION SLIDER ───────────────────────────────

function StepApproach({ state, updateState, nextStep, prevStep }: StepProps) {
  const explorationLabels = [
    { value: 0, icon: Focus, label: "Narrow", desc: "Only papers directly in my areas" },
    { value: 0.5, icon: Sparkles, label: "Balanced", desc: "Relevant papers with some surprises" },
    { value: 1, icon: Compass, label: "Exploratory", desc: "Surprise me with quality from adjacent fields" },
  ];
  
  return (
    <div className="animate-fade-in">
      <ProgressDots current={4} total={TOTAL_STEPS} />
      <h2 className="font-display text-display-sm font-normal" style={{ color: "var(--ink)" }}>How should we search?</h2>
      <p className="mt-1" style={{ color: "var(--ink-muted)" }}>Choose your research approach and discovery preference.</p>

      {/* Research approach */}
      <p className="mt-6 mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--ink-faint)" }}>Research Type</p>
      <div className="space-y-2">
        {APPROACH_PREFERENCES.map((pref) => (
          <button
            key={pref.value}
            onClick={() => updateState({ approachPreference: pref.value })}
            className={`option-btn flex items-center gap-3 ${state.approachPreference === pref.value ? "selected" : ""}`}
          >
            {pref.value === "quantitative" && <FlaskConical className="h-4 w-4 shrink-0" />}
            {pref.value === "qualitative" && <BookOpen className="h-4 w-4 shrink-0" />}
            {pref.value === "both" && <Sparkles className="h-4 w-4 shrink-0" />}
            {pref.value === "no_preference" && <Globe className="h-4 w-4 shrink-0" />}
            <div>
              <div className="font-medium">{pref.label}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--ink-faint)" }}>{pref.description}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Exploration slider */}
      <div className="mt-8">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--ink-faint)" }}>Discovery Preference</p>
        <div className="card">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={state.explorationLevel}
            onChange={(e) => updateState({ explorationLevel: parseFloat(e.target.value) })}
            className="w-full"
          />
          <div className="mt-3 flex justify-between text-xs" style={{ color: "var(--ink-muted)" }}>
            <span className="flex items-center gap-1"><Focus className="h-3.5 w-3.5" /> Narrow</span>
            <span className="flex items-center gap-1"><Compass className="h-3.5 w-3.5" /> Exploratory</span>
          </div>
          <div className="mt-3 text-center">
            {explorationLabels.map((l) => {
              const isActive = Math.abs(state.explorationLevel - l.value) < 0.2;
              if (!isActive) return null;
              return (
                <div key={l.value}>
                  <p className="font-display text-sm font-medium" style={{ color: "var(--burgundy)" }}>
                    {l.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>{l.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={prevStep} className="btn-secondary flex-1"><ArrowLeft className="h-4 w-4" /> Back</button>
        <button onClick={nextStep} className="btn-primary flex-1">Continue <ArrowRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

// ─── STEP 5: INTERESTS ───────────────────────────────────────────────────

function StepInterests({ state, updateState, nextStep, prevStep }: StepProps) {
  const isGeneralist = isGeneralistField(state.field);
  return (
    <div className="animate-fade-in">
      <ProgressDots current={5} total={TOTAL_STEPS} />
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-display-sm font-normal" style={{ color: "var(--ink)" }}>Any specific topics?</h2>
          <p className="mt-1" style={{ color: "var(--ink-muted)" }}>Select up to 5 topics — or skip to see everything.</p>
        </div>
        <span className="rounded-full px-2 py-1 text-xs" style={{ background: "var(--burgundy-wash)", color: "var(--burgundy)" }}>Optional</span>
      </div>

      <div className="mt-6">
        <MultiSelect
          options={profileOptions.interests}
          selected={state.interests}
          onChange={(interests) => updateState({ interests })}
          placeholder="Search topics..."
          maxSelections={5}
          groups={groupedOptions.interests.groups}
        />
      </div>

      {state.interests.length > 0 && (
        <p className="mt-3 text-sm" style={{ color: "var(--ink-muted)" }}>First selections are weighted more heavily.</p>
      )}

      <div className="mt-6 flex gap-3">
        <button onClick={prevStep} className="btn-secondary flex-1"><ArrowLeft className="h-4 w-4" /> Back</button>
        {state.interests.length === 0 ? (
          <button onClick={nextStep} className="btn-secondary flex-1">Skip <SkipForward className="h-4 w-4" /></button>
        ) : (
          <button onClick={nextStep} className="btn-primary flex-1">Continue <ArrowRight className="h-4 w-4" /></button>
        )}
      </div>
      {isGeneralist && state.interests.length === 0 && (
        <p className="mt-4 text-center text-sm" style={{ color: "var(--ink-faint)" }}>
          As a generalist, skipping is fine — you will see quality papers from across fields.
        </p>
      )}
    </div>
  );
}

// ─── STEP 6: METHODS ─────────────────────────────────────────────────────

function StepMethods({ state, updateState, nextStep, prevStep }: StepProps) {
  const availableMethods = getMethodsByApproach(state.approachPreference);
  return (
    <div className="animate-fade-in">
      <ProgressDots current={6} total={TOTAL_STEPS} />
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-display-sm font-normal" style={{ color: "var(--ink)" }}>Preferred methodologies?</h2>
          <p className="mt-1" style={{ color: "var(--ink-muted)" }}>Select up to 4 methods — or skip if open to all.</p>
        </div>
        <span className="rounded-full px-2 py-1 text-xs" style={{ background: "var(--burgundy-wash)", color: "var(--burgundy)" }}>Optional</span>
      </div>

      <div className="mt-6">
        <MultiSelect
          options={availableMethods}
          selected={state.methods}
          onChange={(methods) => updateState({ methods })}
          placeholder="Search methods..."
          maxSelections={4}
          groups={groupedOptions.methods.groups}
        />
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={prevStep} className="btn-secondary flex-1"><ArrowLeft className="h-4 w-4" /> Back</button>
        {state.methods.length === 0 ? (
          <button onClick={nextStep} className="btn-secondary flex-1">Skip <SkipForward className="h-4 w-4" /></button>
        ) : (
          <button onClick={nextStep} className="btn-primary flex-1">Continue <ArrowRight className="h-4 w-4" /></button>
        )}
      </div>
    </div>
  );
}

// ─── STEP 7: SOURCES ─────────────────────────────────────────────────────

function StepSources({ state, updateState, nextStep, prevStep, discoverPapers }: StepProps) {
  const [showAdjacentOptions, setShowAdjacentOptions] = useState(state.includeAdjacentFields);
  const [showJournalPicker, setShowJournalPicker] = useState(false);
  
  const buildJournalList = (
    fieldType: "Economics" | "Political Science" | "Both",
    includeWPs: boolean,
    adjacentFields: JournalField[]
  ) => {
    // Use smart defaults based on field + interests
    let selected = getSmartJournalDefaults(state.field, fieldType, includeWPs);
    
    // If polisci only, remove econ journals except working papers
    if (fieldType === "Political Science") {
      const polisciJournals = [
        ...Object.keys(journalOptions.polisci.tier1 ? {} : {}),
        ...getJournalsByTier("polisci", [1, 2, 3]),
      ];
      const wpJournals = includeWPs ? getWorkingPapers() : [];
      selected = [...new Set([...polisciJournals, ...wpJournals])];
    }
    
    // Add adjacent fields
    for (const field of adjacentFields) {
      const adjacentJournals = getJournalsByTier(field, [1, 2]);
      selected = [...selected, ...adjacentJournals];
    }
    
    return [...new Set(selected)];
  };
  
  const setFieldType = (type: "Economics" | "Political Science" | "Both") => {
    updateState({ fieldType: type });
    const journals = buildJournalList(type, state.includeWorkingPapers, state.selectedAdjacentFields);
    updateState({ journals });
  };
  
  const toggleWorkingPapers = () => {
    const newValue = !state.includeWorkingPapers;
    updateState({ includeWorkingPapers: newValue });
    const journals = buildJournalList(state.fieldType, newValue, state.selectedAdjacentFields);
    updateState({ journals });
  };

  const toggleAdjacentField = (field: JournalField) => {
    const current = state.selectedAdjacentFields;
    const updated = current.includes(field) ? current.filter(f => f !== field) : [...current, field];
    updateState({ selectedAdjacentFields: updated, includeAdjacentFields: updated.length > 0 });
    const journals = buildJournalList(state.fieldType, state.includeWorkingPapers, updated);
    updateState({ journals });
  };

  const handleDiscover = () => {
    nextStep();
    discoverPapers();
  };
  
  // Initialize journals
  useEffect(() => {
    if (state.journals.length === 0) {
      const journals = buildJournalList(state.fieldType, state.includeWorkingPapers, state.selectedAdjacentFields);
      updateState({ journals });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Available journals for the picker
  const allJournals = getAllJournalsList();
  const journalsByField = allJournals.reduce((acc, j) => {
    const key = j.field === "working_papers" ? "Working Papers" :
      j.field === "economics" ? "Economics" :
      j.field === "polisci" ? "Political Science" :
      j.field.charAt(0).toUpperCase() + j.field.slice(1);
    if (!acc[key]) acc[key] = [];
    acc[key].push(j.name);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="animate-fade-in">
      <ProgressDots current={7} total={TOTAL_STEPS} />
      <h2 className="font-display text-display-sm font-normal" style={{ color: "var(--ink)" }}>Where to look?</h2>
      <p className="mt-1" style={{ color: "var(--ink-muted)" }}>Choose journals, time range, and optional enhancements.</p>

      {/* Working Papers */}
      <div className="mt-6">
        <label className="flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-colors"
          style={{ border: "2px solid var(--burgundy-glow)", background: "var(--burgundy-wash)" }}>
          <input type="checkbox" checked={state.includeWorkingPapers} onChange={toggleWorkingPapers} />
          <div className="flex-1">
            <span className="font-medium" style={{ color: "var(--ink)" }}>Working Papers</span>
            <span className="ml-2 text-xs" style={{ color: "var(--burgundy)" }}>(NBER, CEPR)</span>
          </div>
          <span className="tag tag-interest">Cutting-edge</span>
        </label>
      </div>

      {/* Field Selection */}
      <div className="mt-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--ink-faint)" }}>Published Journals</p>
        <div className="flex gap-2">
          {(["Economics", "Political Science", "Both"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFieldType(type)}
              className={`option-btn flex-1 text-center ${state.fieldType === type ? "selected" : ""}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Journal Picker Toggle */}
      <div className="mt-4">
        <button onClick={() => setShowJournalPicker(!showJournalPicker)}
          className="text-sm flex items-center gap-1 transition-colors" style={{ color: "var(--ink-muted)" }}>
          <ChevronDown className={`h-4 w-4 transition-transform ${showJournalPicker ? "" : "-rotate-90"}`} />
          Choose specific journals ({state.journals.length} selected)
        </button>
        {showJournalPicker && (
          <div className="mt-3">
            <MultiSelect
              options={allJournals.map(j => j.name)}
              selected={state.journals}
              onChange={(journals) => updateState({ journals })}
              placeholder="Search journals..."
              groups={Object.entries(journalsByField).map(([label, options]) => ({ label, options }))}
            />
          </div>
        )}
      </div>

      {/* Adjacent Fields */}
      <div className="mt-5">
        <button onClick={() => setShowAdjacentOptions(!showAdjacentOptions)}
          className="text-sm flex items-center gap-1 transition-colors" style={{ color: "var(--ink-muted)" }}>
          <ChevronDown className={`h-4 w-4 transition-transform ${showAdjacentOptions ? "" : "-rotate-90"}`} />
          Include related fields
        </button>
        {showAdjacentOptions && (
          <div className="mt-3 space-y-2">
            {(["psychology", "sociology", "management"] as JournalField[]).map((field) => (
              <label key={field} className="flex items-center gap-3 rounded-xl p-3 cursor-pointer"
                style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-card)" }}>
                <input type="checkbox" checked={state.selectedAdjacentFields.includes(field)} onChange={() => toggleAdjacentField(field)} />
                <span className="text-sm capitalize">{field}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Time Range */}
      <div className="mt-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--ink-faint)" }}>Time Range</p>
        <input
          type="range" min={7} max={90} step={7}
          value={state.days}
          onChange={(e) => updateState({ days: parseInt(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-sm" style={{ color: "var(--ink-muted)" }}>
          <span>Last {state.days} days</span>
          <span>{state.days === 7 ? "1 week" : state.days === 30 ? "1 month" : `${Math.round(state.days / 7)} weeks`}</span>
        </div>
      </div>

      {/* AI Enhancement */}
      <div className="mt-5">
        <button
          onClick={() => updateState({ aiEnabled: !state.aiEnabled })}
          className={`w-full flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-colors`}
          style={{
            border: state.aiEnabled ? "2px solid rgba(107,39,55,0.3)" : "1px solid var(--border-subtle)",
            background: state.aiEnabled ? "rgba(107,39,55,0.04)" : "var(--bg-card)",
          }}
        >
          <Brain className="h-5 w-5 shrink-0" style={{ color: state.aiEnabled ? "var(--burgundy)" : "var(--ink-faint)" }} />
          <div className="flex-1 text-left">
            <span className="font-medium" style={{ color: state.aiEnabled ? "var(--burgundy)" : "var(--ink-soft)" }}>
              AI-Enhanced Scoring
            </span>
            <span className="ml-2 tag tag-interest">Free</span>
          </div>
        </button>
        
        {state.aiEnabled && (
          <div className="mt-3 card space-y-3">
            <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
              Uses Gemini AI to understand semantic connections between papers and your interests.
            </p>
            <div>
              <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--burgundy)" }}>
                <Key className="h-3.5 w-3.5" /> Gemini API Key
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="password"
                  value={state.geminiApiKey}
                  onChange={(e) => updateState({ geminiApiKey: e.target.value, aiKeyValid: null, aiError: null })}
                  placeholder="Paste your API key"
                  className="flex-1 text-sm"
                />
                <button
                  onClick={async () => {
                    if (!state.geminiApiKey.trim()) return;
                    updateState({ aiKeyValidating: true, aiKeyValid: null });
                    try {
                      const res = await fetch("/api/ai-rerank", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "validate", apiKey: state.geminiApiKey, model: state.geminiModel }),
                      });
                      const data = await res.json();
                      updateState({ aiKeyValid: data.valid, aiKeyValidating: false, aiError: data.valid ? null : data.error });
                    } catch {
                      updateState({ aiKeyValid: false, aiKeyValidating: false, aiError: "Connection failed" });
                    }
                  }}
                  disabled={!state.geminiApiKey.trim() || state.aiKeyValidating}
                  className="btn-primary text-sm px-3 py-2"
                >
                  {state.aiKeyValidating ? "..." : "Test"}
                </button>
              </div>
              {state.aiKeyValid === true && (
                <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: "#2d6a4f" }}>
                  <CheckCircle className="h-3.5 w-3.5" /> Key valid — AI enhancement active
                </p>
              )}
              {state.aiKeyValid === false && (
                <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: "#c53030" }}>
                  <AlertCircle className="h-3.5 w-3.5" /> {state.aiError || "Invalid key"}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--burgundy)" }}>Model</label>
              <select
                value={state.geminiModel}
                onChange={(e) => updateState({ geminiModel: e.target.value, aiKeyValid: null, aiError: null })}
                className="mt-1 w-full text-sm"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (recommended)</option>
                <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash-Lite</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              </select>
            </div>
            <div className="rounded-xl p-3 text-xs space-y-1.5" style={{ background: "var(--burgundy-wash)", color: "var(--burgundy)" }}>
              <p className="font-medium">Get a free API key (1 minute):</p>
              <ol className="list-decimal list-inside space-y-0.5" style={{ color: "var(--ink-muted)" }}>
                <li>Go to <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-0.5" style={{ color: "var(--burgundy)" }}>Google AI Studio <ExternalLink className="h-3 w-3" /></a></li>
                <li>Sign in → <strong>Get API key</strong> → <strong>Create API key</strong></li>
                <li>Copy and paste above</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Summary + Discover */}
      <div className="mt-5 card text-sm" style={{ color: "var(--ink-muted)" }}>
        <Search className="mr-2 inline h-4 w-4" />
        Searching {state.journals.length} sources
        {state.includeWorkingPapers && <span style={{ color: "var(--burgundy)" }}> (incl. working papers)</span>}
        {state.selectedAdjacentFields.length > 0 && <span> + {state.selectedAdjacentFields.length} related fields</span>}
        {state.aiEnabled && state.geminiApiKey.trim() && <span style={{ color: "var(--burgundy)" }}> + AI scoring</span>}
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={prevStep} className="btn-secondary flex-1"><ArrowLeft className="h-4 w-4" /> Back</button>
        <button onClick={handleDiscover} disabled={state.journals.length === 0} className="btn-primary flex-1">
          <Sparkles className="h-4 w-4" /> Discover Papers
        </button>
      </div>
    </div>
  );
}

// ─── STEP 8: RESULTS ─────────────────────────────────────────────────────

function StepResults({ state, updateState, startOver, discoverPapers, goToStep }: StepProps) {
  const [showAll, setShowAll] = useState(false);

  if (state.isLoading) {
    return (
      <div className="animate-fade-in">
        <FunLoading userName={state.name} />
        {state.aiReranking && (
          <p className="mt-4 text-center text-sm flex items-center justify-center gap-2" style={{ color: "var(--burgundy)" }}>
            <Brain className="h-4 w-4 animate-pulse" /> AI is analyzing paper relevance...
          </p>
        )}
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="animate-fade-in text-center">
        <p className="text-lg" style={{ color: "var(--ink-soft)" }}>{state.error}</p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => goToStep(7)} className="btn-secondary flex-1"><ArrowLeft className="h-4 w-4" /> Adjust</button>
          <button onClick={() => discoverPapers()} className="btn-primary flex-1"><RotateCcw className="h-4 w-4" /> Try Again</button>
        </div>
      </div>
    );
  }

  if (!state.papers.length && !state.isLoading) {
    return (
      <div className="animate-fade-in">
        <FunLoading userName={state.name} />
        <div className="mt-6 text-center">
          <button onClick={() => discoverPapers()} className="btn-primary"><Sparkles className="h-4 w-4" /> Load Papers</button>
        </div>
      </div>
    );
  }

  const allPapers = state.papers.slice(0, MAX_RESULTS);
  const topPapers = allPapers.slice(0, TOP_DISPLAY);
  const morePapers = allPapers.slice(TOP_DISPLAY);
  const displayPapers = showAll ? allPapers : topPapers;

  const coreCount = allPapers.filter(p => p.match_tier === "core").length;
  const exploreCount = allPapers.filter(p => p.match_tier === "explore").length;
  const discoveryCount = allPapers.filter(p => p.match_tier === "discovery").length;

  return (
    <div className="animate-fade-in">
      <h1 className="text-center font-display text-display-lg font-light" style={{ color: "var(--ink)" }}>
        For you, {state.name}
      </h1>
      <p className="mt-2 text-center" style={{ color: "var(--ink-muted)" }}>
        {state.summary}
        {state.aiEnhanced && " · AI-scored"}
      </p>

      {/* AI Badge */}
      {state.aiEnhanced && (
        <div className="mt-3 mx-auto flex items-center justify-center gap-2 rounded-full px-4 py-1.5 w-fit"
          style={{ background: "var(--burgundy-wash)", border: "1px solid var(--burgundy-glow)" }}>
          <Brain className="h-4 w-4" style={{ color: "var(--burgundy)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--burgundy)" }}>
            AI-scored · {state.aiPapersScored} papers ranked by Gemini
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="card text-center">
          <div className="font-display text-2xl font-light" style={{ color: "#2d6a4f" }}>{coreCount}</div>
          <div className="text-xs uppercase tracking-wider" style={{ color: "var(--ink-faint)" }}>Core</div>
        </div>
        <div className="card text-center">
          <div className="font-display text-2xl font-light" style={{ color: "var(--burgundy)" }}>{exploreCount}</div>
          <div className="text-xs uppercase tracking-wider" style={{ color: "var(--ink-faint)" }}>Explore</div>
        </div>
        <div className="card text-center">
          <div className="font-display text-2xl font-light" style={{ color: "#8b6914" }}>{discoveryCount}</div>
          <div className="text-xs uppercase tracking-wider" style={{ color: "var(--ink-faint)" }}>Discovery</div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <button onClick={() => goToStep(7)} className="btn-secondary flex-1">
          <ArrowLeft className="h-4 w-4" /> Adjust
        </button>
        <button onClick={startOver} className="btn-ghost flex-1">
          <RotateCcw className="h-4 w-4" /> Start over
        </button>
      </div>

      {/* Paper list */}
      <div className="mt-8 space-y-4 stagger-children">
        {displayPapers.map((paper, index) => (
          <PaperCard 
            key={paper.id} 
            paper={paper} 
            index={index} 
            compact={showAll && index >= TOP_DISPLAY}
          />
        ))}
      </div>

      {/* Show more button */}
      {!showAll && morePapers.length > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="btn-secondary mt-6 w-full"
        >
          <ChevronDown className="h-4 w-4" />
          Show {morePapers.length} more papers
        </button>
      )}

      {displayPapers.length === 0 && (
        <div className="mt-8 text-center" style={{ color: "var(--ink-muted)" }}>
          No papers found. Try adjusting your settings.
        </div>
      )}
    </div>
  );
}
