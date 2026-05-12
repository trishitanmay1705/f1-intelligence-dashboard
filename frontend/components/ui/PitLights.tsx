"use client";

// PitLights — animated F1 race-start light sequence
// 5 red lights appear one-by-one, then all go out ("LIGHTS OUT AND AWAY WE GO!")
// The sequence loops continuously.

import { useState, useEffect } from "react";

// Each phase: how many lights are lit (0 = all dark) and how long to hold it
const SEQUENCE: { lit: number; ms: number }[] = [
  { lit: 0, ms: 600  }, // dark pause
  { lit: 1, ms: 450  }, // light 1
  { lit: 2, ms: 450  }, // light 2
  { lit: 3, ms: 450  }, // light 3
  { lit: 4, ms: 450  }, // light 4
  { lit: 5, ms: 700  }, // all lit (hold slightly longer — tension!)
  { lit: 0, ms: 1000 }, // LIGHTS OUT — all dark (go!)
];

interface PitLightsProps {
  /** Light circle diameter in px */
  size?: number;
}

export default function PitLights({ size = 14 }: PitLightsProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let phaseIdx = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    function advance() {
      phaseIdx = (phaseIdx + 1) % SEQUENCE.length;
      setPhase(phaseIdx);
      timeoutId = setTimeout(advance, SEQUENCE[phaseIdx].ms);
    }

    timeoutId = setTimeout(advance, SEQUENCE[0].ms);
    return () => clearTimeout(timeoutId);
  }, []);

  const litCount = SEQUENCE[phase].lit;

  return (
    <div
      className="flex items-center gap-2"
      role="img"
      aria-label="F1 start lights"
    >
      {/* Housing bar */}
      <div
        className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
        style={{ gap: size * 0.55 }}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const isLit = n <= litCount;
          return (
            <div
              key={n}
              className="rounded-full transition-all duration-100"
              style={{
                width:  size,
                height: size,
                backgroundColor: isLit ? "#e10600" : "#1f1f1f",
                boxShadow: isLit
                  ? `0 0 ${size * 0.7}px ${size * 0.35}px rgba(225,6,0,0.65)`
                  : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
