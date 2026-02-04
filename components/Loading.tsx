"use client";

import { Loader2 } from "lucide-react";

interface LoadingProps {
  message?: string;
  subMessage?: string;
}

export function Loading({
  message = "Loading...",
  subMessage,
}: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="absolute -inset-4 animate-pulse-subtle rounded-full bg-paper-100" />
        <Loader2 className="relative h-8 w-8 animate-spin text-paper-400" />
      </div>
      <p className="mt-6 font-display text-lg font-medium text-paper-700">
        {message}
      </p>
      {subMessage && (
        <p className="mt-1 text-sm text-paper-500">{subMessage}</p>
      )}
    </div>
  );
}

export function LoadingDots() {
  return (
    <div className="flex items-center gap-1">
      <div
        className="h-1.5 w-1.5 animate-bounce rounded-full bg-paper-400"
        style={{ animationDelay: "0ms" }}
      />
      <div
        className="h-1.5 w-1.5 animate-bounce rounded-full bg-paper-400"
        style={{ animationDelay: "150ms" }}
      />
      <div
        className="h-1.5 w-1.5 animate-bounce rounded-full bg-paper-400"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}
