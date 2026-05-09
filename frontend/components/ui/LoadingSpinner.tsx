// components/ui/LoadingSpinner.tsx

import F1Logo     from "./F1Logo";
import F1Wheel    from "./F1Wheel";
import PitLights  from "./PitLights";
import SpeedLines from "./SpeedLines";

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({
  message = "Loading F1 data..."
}: LoadingSpinnerProps) {
  return (
    <div className="relative flex items-center justify-center p-20 overflow-hidden">

      {/* ── Background speed lines ── */}
      <SpeedLines />

      <div className="relative z-10 flex flex-col items-center gap-7">

        {/* ── F1 start light sequence ── */}
        <PitLights size={16} />

        {/* ── Spinning F1 wheel ── */}
        <F1Wheel size={120} spinning rimColor="#9ca3af" />

        {/* ── Animated F1 logo (races in from left, with glow) ── */}
        <F1Logo size="lg" animated glow />

        {/* ── Sweeping red progress bar ── */}
        <div className="w-52 h-0.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-f1-red rounded-full"
            style={{ animation: "loadingBar 1.4s ease-in-out infinite" }}
          />
        </div>

        {/* ── Status message ── */}
        <p className="text-gray-500 text-xs uppercase tracking-[0.25em]">
          {message}
        </p>

      </div>

      <style>{`
        @keyframes loadingBar {
          0%   { margin-left: 0%;  width: 15%; }
          50%  { margin-left: 45%; width: 35%; }
          100% { margin-left: 85%; width: 15%; }
        }
      `}</style>
    </div>
  );
}
