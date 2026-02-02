import { Language } from './github';

interface Props {
  username: string;
  languages: Language[];
}

export function TerminalSVG({ username, languages }: Props) {
  const totalBytes = languages.reduce((a, b) => a + b.size, 0);
  const maxPercent = Math.max(...languages.map(l => (l.size / totalBytes) * 100));
  
  // Calculate SVG height based on language count
  const lineHeight = 35;
  const headerHeight = 80;
  const footerHeight = 40;
  const height = headerHeight + (languages.length * lineHeight) + footerHeight;
  const width = 600;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* CRT Scanlines */}
        <pattern id="scanlines" patternUnits="userSpaceOnUse" width="4" height="4">
          <line x1="0" y1="0" x2="4" y2="0" stroke="#0a0a0a" strokeWidth="1" />
        </pattern>
        
        {/* Glow filter */}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Terminal gradient */}
        <linearGradient id="terminalBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0d1117" />
          <stop offset="100%" stopColor="#010409" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="100%" height="100%" fill="url(#terminalBg)" rx="8" />
      <rect width="100%" height="100%" fill="url(#scanlines)" opacity="0.4" />
      
      {/* Terminal header dots */}
      <g transform="translate(20, 25)">
        <circle cx="0" cy="0" r="6" fill="#ff5f56" />
        <circle cx="20" cy="0" r="6" fill="#ffbd2e" />
        <circle cx="40" cy="0" r="6" fill="#27c93f" />
      </g>

      {/* Command line with typing animation */}
      <text
        x="20"
        y="65"
        fill="#33ff00"
        fontFamily="JetBrains Mono, Fira Code, monospace"
        fontSize="14"
        filter="url(#glow)"
      >
        <tspan fontWeight="bold">$</tspan>
        <tspan dx="8">github-langs</tspan>
        <tspan dx="8" fill="#5fb3b3">--user</tspan>
        <tspan dx="4" fill="#f99157">{username}</tspan>
        
        {/* Cursor blink */}
        <animate
          attributeName="opacity"
          values="1;0;1"
          dur="1s"
          repeatCount="indefinite"
        />
      </text>

      {/* Language stats */}
      {languages.map((lang, i) => {
        const percent = (lang.size / totalBytes) * 100;
        const y = headerHeight + (i * lineHeight);
        const barWidth = (percent / maxPercent) * 300;
        const delay = 0.5 + (i * 0.15);

        return (
          <g key={lang.name} transform={`translate(20, ${y})`}>
            {/* Language name */}
            <text
              fill="#c9d1d9"
              fontFamily="JetBrains Mono, monospace"
              fontSize="13"
              y="15"
            >
              <animate
                attributeName="opacity"
                values="0;1"
                dur="0.3s"
                fill="freeze"
                begin={`${delay}s`}
              />
              {lang.name}
            </text>

            {/* Percentage */}
            <text
              x="150"
              y="15"
              fill={lang.color || '#8b949e'}
              fontFamily="JetBrains Mono, monospace"
              fontSize="13"
              fontWeight="bold"
            >
              <animate
                attributeName="opacity"
                values="0;1"
                dur="0.3s"
                fill="freeze"
                begin={`${delay}s`}
              />
              {percent.toFixed(1)}%
            </text>

            {/* Progress bar background */}
            <rect
              x="220"
              y="5"
              width="300"
              height="12"
              fill="#21262d"
              rx="2"
            />

            {/* Progress bar fill */}
            <rect
              x="220"
              y="5"
              width="0"
              height="12"
              fill={lang.color || '#33ff00'}
              rx="2"
              opacity="0.8"
            >
              <animate
                attributeName="width"
                from="0"
                to={barWidth}
                dur="0.8s"
                fill="freeze"
                begin={`${delay}s`}
                calcMode="spline"
                keySplines="0.4 0 0.2 1"
              />
            </rect>

            {/* Glow effect on bar */}
            <rect
              x="220"
              y="5"
              width="0"
              height="12"
              fill={lang.color || '#33ff00'}
              rx="2"
              opacity="0.3"
              filter="url(#glow)"
            >
              <animate
                attributeName="width"
                from="0"
                to={barWidth}
                dur="0.8s"
                fill="freeze"
                begin={`${delay}s`}
              />
            </rect>
          </g>
        );
      })}

      {/* Footer */}
      <text
        x="20"
        y={height - 15}
        fill="#484f58"
        fontFamily="monospace"
        fontSize="11"
      >
        <animate
          attributeName="opacity"
          values="0;1"
          dur="0.5s"
          fill="freeze"
          begin={`${0.5 + languages.length * 0.15}s`}
        />
        Generated with github-terminal-stats
      </text>
    </svg>
  );
}