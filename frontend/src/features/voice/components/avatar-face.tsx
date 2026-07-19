import { motion, useAnimationControls } from "framer-motion";
import * as React from "react";

import { cn } from "@/lib/utils";

export type AvatarState = "idle" | "listening" | "thinking" | "speaking";
export type AvatarVariant = "female" | "male" | "professor" | "madam";

interface AvatarFaceProps {
  state: AvatarState;
  amplitude?: number; // 0..1 mouth openness while speaking
  size?: number; // width in px (height scales to a portrait bust)
  variant?: AvatarVariant;
}

/** Per-character look. Face-feature positions are shared so the blink/lip-sync
 * logic stays identical across every avatar; only hair, clothing, glasses and
 * accessories change. */
const LOOKS: Record<
  AvatarVariant,
  {
    skin: [string, string];
    hair: [string, string];
    cloth: [string, string];
    brow: string;
    longHair: boolean;
    bun: boolean;
    glasses: boolean;
    mustache: boolean;
    earrings: boolean;
    necklace: boolean;
    bowtie: boolean;
    stubble: boolean;
    crewNeck: boolean;
    lip: string;
  }
> = {
  female: {
    skin: ["#ffe4c9", "#f2bd93"],
    hair: ["#4a3526", "#2b1d13"],
    cloth: ["#7c6cf5", "#a855f7"],
    brow: "#3a2717",
    longHair: true, bun: false, glasses: false, mustache: false,
    earrings: true, necklace: false, bowtie: false, stubble: false, crewNeck: false,
    lip: "#b3566b",
  },
  male: {
    skin: ["#ffd6a8", "#e7a877"],
    hair: ["#3a2a1c", "#231710"],
    cloth: ["#0ea5e9", "#0369a1"],
    brow: "#2a1c12",
    longHair: false, bun: false, glasses: false, mustache: false,
    earrings: false, necklace: false, bowtie: false, stubble: true, crewNeck: true,
    lip: "#9c5a52",
  },
  professor: {
    skin: ["#ffdcbe", "#e9b489"],
    hair: ["#d7d9e2", "#b3b6c2"],
    cloth: ["#334155", "#1e293b"],
    brow: "#9ca3af",
    longHair: false, bun: false, glasses: true, mustache: true,
    earrings: false, necklace: false, bowtie: true, stubble: false, crewNeck: false,
    lip: "#8a5a55",
  },
  madam: {
    skin: ["#ffe0c6", "#efbd95"],
    hair: ["#cfd2dc", "#a0a6b6"],
    cloth: ["#9d174d", "#6d1a3a"],
    brow: "#8a8f9c",
    longHair: false, bun: true, glasses: true, mustache: false,
    earrings: true, necklace: true, bowtie: false, stubble: false, crewNeck: false,
    lip: "#b04a63",
  },
};

export function AvatarFace({ state, amplitude = 0, size = 220, variant = "female" }: AvatarFaceProps) {
  const controls = useAnimationControls();
  const [blink, setBlink] = React.useState(false);
  const look = LOOKS[variant];

  React.useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const loop = () => {
      const delay = 2200 + Math.random() * 2800;
      timeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 130);
        loop();
      }, delay);
    };
    loop();
    return () => clearTimeout(timeout);
  }, []);

  React.useEffect(() => {
    if (state === "thinking") {
      controls.start({ rotate: [0, -3.5, 3.5, 0], transition: { duration: 1.8, repeat: Infinity } });
    } else {
      controls.start({ rotate: 0 });
    }
  }, [state, controls]);

  const speaking = state === "speaking";
  const listening = state === "listening";
  const eyeRy = blink ? 1.2 : 10;
  const mouthRy = speaking ? 3 + amplitude * 13 : listening ? 3 : 2;
  const mouthRx = speaking ? 13 - amplitude * 3 : 11;

  const glow = listening
    ? "drop-shadow-[0_0_36px_rgba(124,108,245,0.55)]"
    : speaking
      ? "drop-shadow-[0_0_40px_rgba(192,132,252,0.6)]"
      : "drop-shadow-[0_10px_30px_rgba(15,23,42,0.25)]";

  const height = size * (280 / 220);
  const uid = variant; // gradient ids are unique per rendered variant

  return (
    <div className="relative grid place-items-center" style={{ width: size, height }}>
      <div className="pointer-events-none absolute left-1/2 top-[38%] size-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary/25 to-accent/25 blur-2xl" />
      {listening && (
        <>
          <span className="absolute left-1/2 top-[36%] size-40 -translate-x-1/2 -translate-y-1/2 animate-pulse-ring rounded-full bg-primary/25" />
          <span className="absolute left-1/2 top-[36%] size-40 -translate-x-1/2 -translate-y-1/2 animate-pulse-ring rounded-full bg-primary/20 [animation-delay:0.5s]" />
        </>
      )}

      <motion.div
        animate={state === "idle" ? { y: [0, -5, 0] } : { y: 0 }}
        transition={state === "idle" ? { duration: 4.5, repeat: Infinity, ease: "easeInOut" } : {}}
        className="relative"
      >
        <motion.svg
          animate={controls}
          width={size}
          height={height}
          viewBox="0 0 220 280"
          className={cn("origin-bottom", glow)}
          style={{ transformBox: "fill-box" }}
        >
          <defs>
            <radialGradient id={`skin-${uid}`} cx="50%" cy="42%" r="65%">
              <stop offset="0%" stopColor={look.skin[0]} />
              <stop offset="100%" stopColor={look.skin[1]} />
            </radialGradient>
            <linearGradient id={`hair-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={look.hair[0]} />
              <stop offset="100%" stopColor={look.hair[1]} />
            </linearGradient>
            <linearGradient id={`cloth-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={look.cloth[0]} />
              <stop offset="100%" stopColor={look.cloth[1]} />
            </linearGradient>
          </defs>

          {/* ---- Body / shoulders ---- */}
          <path d="M14 280 C14 220 58 198 110 198 C162 198 206 220 206 280 Z" fill={`url(#cloth-${uid})`} />
          <path d="M14 280 C14 232 44 210 74 202 C60 226 58 254 60 280 Z" fill="#000" opacity="0.06" />
          <path d="M206 280 C206 232 176 210 146 202 C160 226 162 254 160 280 Z" fill="#fff" opacity="0.08" />

          {look.crewNeck ? (
            <path d="M88 200 Q110 214 132 200" stroke="#000" strokeOpacity="0.14" strokeWidth="3" fill="none" strokeLinecap="round" />
          ) : (
            <>
              <path d="M92 200 L110 240 L128 200 L118 198 L110 210 L102 198 Z" fill="#f1f4fa" />
              <path d="M92 200 L110 242" stroke="#000" strokeOpacity="0.12" strokeWidth="2" fill="none" />
              <path d="M128 200 L110 242" stroke="#000" strokeOpacity="0.12" strokeWidth="2" fill="none" />
            </>
          )}

          {look.bowtie && (
            <g>
              <path d="M100 198 L110 205 L100 212 Z" fill="#b91c1c" />
              <path d="M120 198 L110 205 L120 212 Z" fill="#b91c1c" />
              <rect x="106" y="201" width="8" height="8" rx="2" fill="#7f1d1d" />
            </g>
          )}

          {look.necklace &&
            Array.from({ length: 9 }).map((_, i) => {
              const t = i / 8;
              const x = 92 + t * 36;
              const y = 200 + Math.sin(t * Math.PI) * 16;
              return <circle key={i} cx={x} cy={y} r="2.6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.6" />;
            })}

          {/* ---- Neck ---- */}
          <rect x="95" y="138" width="30" height="66" rx="14" fill={`url(#skin-${uid})`} />
          <ellipse cx="110" cy="150" rx="26" ry="9" fill="#d99a6c" opacity="0.35" />

          {/* ---- Bun (madam) ---- */}
          {look.bun && <circle cx="110" cy="52" r="20" fill={`url(#hair-${uid})`} />}

          {/* ---- Long hair over shoulders ---- */}
          {look.longHair && (
            <>
              <path d="M56 100 C48 146 50 190 64 218 L86 210 C74 180 74 138 80 108 Z" fill={`url(#hair-${uid})`} />
              <path d="M164 100 C172 146 170 190 156 218 L134 210 C146 180 146 138 140 108 Z" fill={`url(#hair-${uid})`} />
            </>
          )}

          {/* ---- Head ---- */}
          <ellipse cx="110" cy="98" rx="52" ry="56" fill={`url(#skin-${uid})`} />
          {look.stubble && (
            <path d="M62 108 C70 150 150 150 158 108 C150 138 70 138 62 108 Z" fill="#000" opacity="0.07" />
          )}
          <ellipse cx="59" cy="104" rx="8" ry="12" fill={`url(#skin-${uid})`} />
          <ellipse cx="161" cy="104" rx="8" ry="12" fill={`url(#skin-${uid})`} />
          {look.earrings && (
            <>
              <circle cx="59" cy="118" r="2.4" fill="#facc15" />
              <circle cx="161" cy="118" r="2.4" fill="#facc15" />
            </>
          )}

          {/* ---- Hair cap ---- */}
          {look.bun ? (
            // sleek pulled-back hair
            <path d="M58 106 C56 60 164 60 162 106 C156 88 140 82 110 82 C80 82 64 88 58 106 Z" fill={`url(#hair-${uid})`} />
          ) : (
            <path d="M56 106 C54 48 166 48 164 106 C154 82 132 72 110 72 C88 72 66 82 56 106 Z" fill={`url(#hair-${uid})`} />
          )}
          {!look.bun && (
            <path d="M110 72 C92 72 74 80 64 100 C82 84 100 82 112 86 Z" fill="#000" opacity="0.12" />
          )}

          {/* ---- Cheeks ---- */}
          <ellipse cx="84" cy="114" rx="9" ry="6" fill="#ff9a8b" opacity="0.38" />
          <ellipse cx="136" cy="114" rx="9" ry="6" fill="#ff9a8b" opacity="0.38" />

          {/* ---- Eyes ---- */}
          <g>
            <motion.ellipse cx="91" cy="96" rx="9" ry={eyeRy} fill="#ffffff" />
            <motion.ellipse cx="129" cy="96" rx="9" ry={eyeRy} fill="#ffffff" />
            {!blink && (
              <>
                <circle cx="92" cy="97" r="5.4" fill="#7a4b2b" />
                <circle cx="130" cy="97" r="5.4" fill="#7a4b2b" />
                <circle cx="92" cy="97" r="2.6" fill="#241811" />
                <circle cx="130" cy="97" r="2.6" fill="#241811" />
                <circle cx="94" cy="94.5" r="1.5" fill="#fff" />
                <circle cx="132" cy="94.5" r="1.5" fill="#fff" />
              </>
            )}
          </g>

          {/* ---- Glasses ---- */}
          {look.glasses && (
            <g stroke="#20232b" strokeWidth="2.4" fill="rgba(200,220,255,0.16)">
              <rect x="79" y="87" width="24" height="19" rx="7" />
              <rect x="117" y="87" width="24" height="19" rx="7" />
              <path d="M103 94 L117 94" fill="none" />
              <path d="M79 92 L66 96" fill="none" />
              <path d="M141 92 L154 96" fill="none" />
            </g>
          )}

          {/* ---- Eyebrows ---- */}
          <path d="M80 82 Q91 76 102 82" stroke={look.brow} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M118 82 Q129 76 140 82" stroke={look.brow} strokeWidth="3" fill="none" strokeLinecap="round" />

          {/* ---- Nose ---- */}
          <path d="M108 104 Q104 116 112 118" stroke="#d99a6c" strokeWidth="2" fill="none" strokeLinecap="round" />

          {/* ---- Mustache ---- */}
          {look.mustache && (
            <path d="M90 121 Q110 132 130 121 Q120 127 110 126 Q100 127 90 121 Z" fill={`url(#hair-${uid})`} />
          )}

          {/* ---- Mouth (lip-sync) ---- */}
          {speaking || listening ? (
            <g>
              <motion.ellipse
                cx="110"
                cy="130"
                animate={{ rx: mouthRx, ry: mouthRy }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                fill="#7a2438"
              />
              {mouthRy > 7 && <ellipse cx="110" cy={132 + mouthRy / 2} rx={mouthRx * 0.55} ry="3" fill="#ff8fa3" />}
              {mouthRy > 5 && <rect x={110 - mouthRx * 0.7} y={130 - mouthRy} width={mouthRx * 1.4} height="2.5" rx="1" fill="#fff" />}
            </g>
          ) : (
            <path d="M96 126 Q110 140 124 126" stroke={look.lip} strokeWidth="3.2" fill="none" strokeLinecap="round" />
          )}
        </motion.svg>
      </motion.div>
    </div>
  );
}
