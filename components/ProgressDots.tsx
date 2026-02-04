"use client";

interface ProgressDotsProps {
  current: number;
  total: number;
}

export function ProgressDots({ current, total }: ProgressDotsProps) {
  return (
    <div className="progress-dots mb-10">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        let className = "dot";
        if (step < current) {
          className += " done";
        } else if (step === current) {
          className += " active";
        }
        return <div key={step} className={className} />;
      })}
    </div>
  );
}
