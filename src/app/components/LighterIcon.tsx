export default function LighterIcon() {
  return (
    <svg width="80" height="120" viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Flame */}
      <path
        d="M40 10 C 30 25, 25 35, 32 45 C 34 48, 38 48, 40 45 C 42 48, 46 48, 48 45 C 55 35, 50 25, 40 10 Z"
        fill="#C77486"
      />
      <path
        d="M40 22 C 36 30, 34 36, 38 41 C 39 42.5, 41 42.5, 42 41 C 46 36, 44 30, 40 22 Z"
        fill="#F4E1D2"
      />

      {/* Lighter body */}
      <rect x="22" y="50" width="36" height="60" rx="8" fill="#5E3A4D" />
      <rect x="30" y="42" width="20" height="14" rx="4" fill="#5E3A4D" />

      {/* Small highlight for a bit of depth */}
      <rect x="26" y="56" width="6" height="48" rx="3" fill="#C77486" opacity="0.4" />
    </svg>
  );
}