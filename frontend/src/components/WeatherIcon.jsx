import React from "react";

export function weatherKind(code, night = false) {
  const n = Number(code);
  if (n === 0 || n === 1) return night ? "moon" : "sun";
  if (n === 2) return night ? "mooncloud" : "suncloud";
  if (n === 3) return "cloud";
  if (n === 45 || n === 48) return "fog";
  if ([51,53,55,56,57].includes(n)) return "drizzle";
  if ([61,63,65,66,67,80,81,82].includes(n)) return "rain";
  if ([71,73,75,77,85,86].includes(n)) return "snow";
  if ([95,96,99].includes(n)) return "storm";
  return "cloud";
}

function Sun({ partial = false }) {
  const cx = partial ? 43 : 32;
  const cy = partial ? 21 : 30;
  const rays = Array.from({ length: 8 }, (_, i) => {
    const angle = i * Math.PI / 4;
    const r1 = partial ? 13 : 16;
    const r2 = partial ? 19 : 23;
    return <line key={i} x1={cx + Math.cos(angle) * r1} y1={cy + Math.sin(angle) * r1}
      x2={cx + Math.cos(angle) * r2} y2={cy + Math.sin(angle) * r2} />;
  });
  return <g className="wx-sun">
    <g className="wx-rays" style={{ transformOrigin: `${cx}px ${cy}px` }}>{rays}</g>
    <circle className="wx-halo" cx={cx} cy={cy} r={partial ? 12 : 18} />
    <circle className="wx-core" cx={cx} cy={cy} r={partial ? 9 : 13} />
  </g>;
}

function Moon() {
  return <g className="wx-moon">
    <path className="wx-moon-shape" d="M42 8c-4.5 7.4-4 16 2 22 4 3.9 8.8 5.2 13 4-4 10-14 16-24 12C21 42 16 31 20 21 23 13 32 9 42 8Z" />
    <circle className="wx-star" cx="50" cy="14" r="1.8" />
    <circle className="wx-star wx-star-delayed" cx="55" cy="24" r="1.2" />
  </g>;
}

function Cloud({ partial = false }) {
  return <g className={`wx-cloud ${partial ? "wx-cloud-partial" : ""}`}>
    <path className="wx-cloud-back" d="M13 35c-1-6 3-11 9-12 2-7 11-10 17-5 3 2 4 5 5 8 6 0 10 4 10 10Z" />
    <path className="wx-cloud-front" d="M15 47c-6 0-10-4-10-9s4-9 9-10c2-7 8-11 16-11 8 0 13 5 15 12 8 0 12 5 12 10s-5 8-11 8Z" />
    <path className="wx-cloud-shine" d="M13 35c2-3 5-4 8-4 2-6 6-9 12-9" />
  </g>;
}

export default function WeatherIcon({ code, night = false, size = "medium", label }) {
  const kind = weatherKind(code, night);
  const cloudy = !["sun", "moon"].includes(kind);
  const partial = kind === "suncloud" || kind === "mooncloud";
  return <span className={`wx-symbol wx-${kind} wx-${size}`} aria-label={label} role={label ? "img" : undefined} aria-hidden={!label ? "true" : undefined}>
    <svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">
      {(kind === "sun" || kind === "suncloud") && <Sun partial={partial} />}
      {(kind === "moon" || kind === "mooncloud") && <Moon />}
      {cloudy && <Cloud partial={partial} />}
      {(kind === "rain" || kind === "drizzle") && <g className="wx-drops">
        <path d="M17 49l-3 8" /><path d="M31 49l-3 8" /><path d="M45 49l-3 8" />
      </g>}
      {kind === "storm" && <path className="wx-flash" d="M34 45 24 56h8l-2 8 15-15h-9l3-4Z" />}
      {kind === "snow" && <g className="wx-snowflakes">
        <path d="M18 49v12m-6-6h12m-10-4 8 8m0-8-8 8" />
        <path d="M43 47v12m-6-6h12m-10-4 8 8m0-8-8 8" />
      </g>}
      {kind === "fog" && <g className="wx-fog-lines"><path d="M12 52h29"/><path d="M23 59h30"/></g>}
    </svg>
  </span>;
}
