"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

const LOADING_QUIPS = [
  "Remember to drink water today",
  "Have you stretched in the last hour?",
  "Text someone you haven't talked to in a while",
  "Fun fact: octopuses have three hearts",
  "Did you know honey never spoils?",
  "Time for a deep breath... in... and out",
  "A group of flamingos is called a 'flamboyance'",
  "Your posture could probably use some love",
  "The mitochondria is the powerhouse of the cell",
  "Have you told someone you appreciate them today?",
  "Hot take: breakfast for dinner is elite",
  "A cloud can weigh over a million pounds",
  "Maybe go outside after this? Just a thought",
  "You're doing great, by the way",
  "Sea otters hold hands while sleeping",
  "Reading papers counts as self-care, right?",
  "Scotland's national animal is the unicorn",
  "You've got this",
  "A day on Venus is longer than its year",
  "Maybe make some tea while you wait?",
  "Elephants think humans are cute (allegedly)",
  "Remember: correlation ≠ causation",
];

interface LoadingProps {
  message?: string;
  subMessage?: string;
}

export function Loading({ message = "Loading...", subMessage }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="absolute -inset-4 animate-pulse-subtle rounded-full" style={{ background: "var(--burgundy-wash)" }} />
        <Sparkles className="relative h-8 w-8 animate-pulse" style={{ color: "var(--burgundy)" }} />
      </div>
      <p className="mt-6 font-display text-lg font-medium" style={{ color: "var(--ink)" }}>
        {message}
      </p>
      {subMessage && (
        <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>{subMessage}</p>
      )}
    </div>
  );
}

export function LoadingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full"
          style={{ background: "var(--burgundy)", animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

interface FunLoadingProps {
  userName: string;
}

export function FunLoading({ userName }: FunLoadingProps) {
  const [quipIndex, setQuipIndex] = useState(() => 
    Math.floor(Math.random() * LOADING_QUIPS.length)
  );
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setQuipIndex((prev) => (prev + 1) % LOADING_QUIPS.length);
        setFade(true);
      }, 300);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Animated icon */}
      <div className="relative mb-8">
        <div className="absolute -inset-6 animate-pulse rounded-full"
          style={{ background: "linear-gradient(135deg, var(--burgundy-wash), transparent)" }} />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "var(--bg-card)", boxShadow: "var(--glass-shadow)", border: "var(--glass-border)" }}>
          <Sparkles className="h-8 w-8 animate-pulse" style={{ color: "var(--burgundy)" }} />
        </div>
      </div>

      <h2 className="font-display text-display-sm font-normal" style={{ color: "var(--ink)" }}>
        Analyzing papers for you, {userName}
      </h2>
      <p className="mt-2" style={{ color: "var(--ink-muted)" }}>
        This usually takes a few seconds...
      </p>

      {/* Progress dots */}
      <div className="mt-6 flex items-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-2 w-2 animate-bounce rounded-full"
            style={{ background: "var(--burgundy)", opacity: 0.5, animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>

      {/* Fun quip */}
      <div className="mt-10 h-16 w-full max-w-sm">
        <div
          className="card text-center transition-opacity duration-300"
          style={{ opacity: fade ? 1 : 0 }}
        >
          <p className="font-display text-sm italic" style={{ color: "var(--ink-muted)" }}>
            {LOADING_QUIPS[quipIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
