export default function LighterIcon() {
  return (
    <svg width="180" height="320" viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="flameGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#EAA23F" />
          <stop offset="55%" stopColor="#F4C77A" />
          <stop offset="100%" stopColor="#FCEFD6" />
        </linearGradient>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4A2E3E" />
          <stop offset="45%" stopColor="#5E3A4D" />
          <stop offset="100%" stopColor="#7A4D63" />
        </linearGradient>
        <linearGradient id="trailGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F4C77A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F4C77A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g transform="translate(100,70) rotate(-26)">
        <rect x="-10" y="120" width="20" height="220" fill="url(#trailGrad)" />
        <path d="M0 -70 C -22 -40, -26 -8, -8 18 C -2 26, 2 26, 8 18 C 12 10, 10 2, 4 -4 C 10 4, 16 8, 16 18 C 16 28, 8 34, 0 34 C -16 34, -28 22, -28 2 C -28 -26, -14 -50, 0 -70 Z" fill="url(#flameGrad)" />
        <ellipse cx="0" cy="10" rx="5" ry="11" fill="#FFFDF6" opacity="0.85" />
        <rect x="-15" y="40" width="30" height="16" rx="5" fill="#8A5A72" />
        <rect x="-20" y="54" width="40" height="14" rx="5" fill="#4A2E3E" />
        <rect x="-24" y="66" width="48" height="150" rx="16" fill="url(#bodyGrad)" />
        <rect x="-24" y="66" width="14" height="150" rx="8" fill="#7A4D63" opacity="0.7" />
        <rect x="-12" y="86" width="24" height="66" rx="5" fill="#C77486" />
        <circle cx="0" cy="150" r="8" fill="#F4E1D2" />
        <rect x="-24" y="200" width="48" height="18" rx="5" fill="#3C2432" />
      </g>
    </svg>
  );
}