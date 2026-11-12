/**
 * The TV Empire Chronicle mark: a retro TV set wearing a crown, a play button on screen.
 * Pure SVG so it is sharp at every size; the same drawing makes the app icons
 * (scripts/make_icons.cjs renders public/logo.svg).
 */
export function LogoMark({ size = 72, title = 'TV Empire Chronicle' }: { size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" role="img" aria-label={title}>
      <defs>
        <linearGradient id="lg-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd23f" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="lg-screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b3a9e" />
          <stop offset="1" stopColor="#24124a" />
        </linearGradient>
        <linearGradient id="lg-crown" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff7ad9" />
          <stop offset="1" stopColor="#ff4d6d" />
        </linearGradient>
      </defs>
      {/* antenna */}
      <path d="M206 168 L160 92 M306 168 L352 92" stroke="#ffd23f" strokeWidth="16" strokeLinecap="round" />
      <circle cx="160" cy="88" r="14" fill="#5ce1ff" />
      <circle cx="352" cy="88" r="14" fill="#5ce1ff" />
      {/* crown */}
      <path d="M176 176 L196 112 L232 148 L256 98 L280 148 L316 112 L336 176 Z" fill="url(#lg-crown)" stroke="#1c0f33" strokeWidth="10" strokeLinejoin="round" />
      {/* body */}
      <rect x="64" y="164" width="384" height="270" rx="56" fill="url(#lg-body)" stroke="#1c0f33" strokeWidth="12" />
      {/* screen */}
      <rect x="100" y="198" width="250" height="200" rx="38" fill="url(#lg-screen)" stroke="#1c0f33" strokeWidth="10" />
      <path d="M128 222 Q176 206 226 214" stroke="rgba(255,255,255,0.35)" strokeWidth="12" strokeLinecap="round" fill="none" />
      {/* play */}
      <path d="M198 252 L198 344 L278 298 Z" fill="#ffffff" stroke="#1c0f33" strokeWidth="8" strokeLinejoin="round" />
      {/* knobs */}
      <circle cx="398" cy="244" r="22" fill="#1c0f33" />
      <circle cx="398" cy="244" r="9" fill="#5ce1ff" />
      <circle cx="398" cy="306" r="22" fill="#1c0f33" />
      <circle cx="398" cy="306" r="9" fill="#ff4d6d" />
      <rect x="380" y="346" width="36" height="12" rx="6" fill="#1c0f33" />
      <rect x="380" y="368" width="36" height="12" rx="6" fill="#1c0f33" />
      {/* feet */}
      <path d="M136 434 L120 462 M376 434 L392 462" stroke="#f59e0b" strokeWidth="16" strokeLinecap="round" />
    </svg>
  );
}

/** Mark plus wordmark, for the title screen. */
export function Logo() {
  return (
    <div className="logo-lockup">
      <LogoMark size={96} />
      <div className="logo-words">
        <span className="logo-top">TV EMPIRE</span>
        <span className="logo-bottom">CHRONICLE</span>
      </div>
    </div>
  );
}
