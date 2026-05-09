// components/ui/LoadingSpinner.tsx

import F1Logo from "./F1Logo";

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({
  message = "Loading F1 data..."
}: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center p-16">
      <div className="flex flex-col items-center gap-8">

        {/* Checkered flag grid animation */}
        <div className="relative">
          <CheckeredFlag />
        </div>

        {/* F1 Logo */}
        <F1Logo size="lg" />

        {/* Loading bar */}
        <div className="w-48 h-0.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-f1-red rounded-full"
            style={{
              width: "40%",
              animation: "loadingBar 1.4s ease-in-out infinite",
            }}
          />
        </div>

        {/* Message */}
        <p className="text-gray-500 text-sm uppercase tracking-widest">
          {message}
        </p>

      </div>

      {/* Inline keyframe for loading bar */}
      <style>{`
        @keyframes loadingBar {
          0%   { margin-left: 0%;   width: 20%; }
          50%  { margin-left: 40%;  width: 40%; }
          100% { margin-left: 80%;  width: 20%; }
        }
      `}</style>
    </div>
  );
}

// ── Checkered Flag Component ──
// 8x8 grid of squares that animate in
function CheckeredFlag() {
  const squares = Array.from({ length: 64 }, (_, i) => i);
  const cols = 8;

  return (
    <div
      className="grid gap-0.5 rounded-lg overflow-hidden"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {squares.map((i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        // Alternating black/white based on position
        const isWhite = (row + col) % 2 === 0;
        const delay = (row + col) * 0.05;

        return (
          <div
            key={i}
            className={`w-5 h-5 ${isWhite ? "bg-white" : "bg-gray-900"}`}
            style={{
              animation: `checkPulse 1.6s ease-in-out ${delay}s infinite`,
              opacity: 0.3,
            }}
          />
        );
      })}

      <style>{`
        @keyframes checkPulse {
          0%, 100% { opacity: 0.15; }
          50%       { opacity: 0.9;  }
        }
      `}</style>
    </div>
  );
}