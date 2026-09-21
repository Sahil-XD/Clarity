import React from 'react';

export interface ClarityLogoProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Visual theme for the icon */
  theme?: 'terracotta' | 'dark' | 'light' | 'outline';
  /** Chassis shape */
  shape?: 'squircle' | 'circle' | 'none';
  /** Whether to render the 'Clarity' text lockup */
  showText?: boolean;
  /** Subtitle to display under the brand name */
  subtitle?: string;
  /** Additional container classes */
  className?: string;
}

export const ClarityLogo: React.FC<ClarityLogoProps> = ({
  size = 'md',
  theme = 'terracotta',
  shape = 'squircle',
  showText = true,
  subtitle = 'WORKSPACE & LEDGER',
  className = '',
}) => {
  // Dimension tokens
  const dimensions = {
    sm: { px: 28, text: 'text-base', subText: 'text-[8.5px]', gap: 'gap-2.5', stroke: 2.6 },
    md: { px: 38, text: 'text-xl', subText: 'text-[9.5px]', gap: 'gap-3.5', stroke: 2.9 },
    lg: { px: 48, text: 'text-2xl', subText: 'text-[11px]', gap: 'gap-4', stroke: 3.2 },
    xl: { px: 60, text: 'text-3xl', subText: 'text-[12px]', gap: 'gap-4.5', stroke: 3.6 },
  }[size];

  const rx = shape === 'circle' ? 20 : 11;
  const showChassis = shape !== 'none';

  return (
    <div className={`inline-flex items-center ${dimensions.gap} ${className}`}>
      {/* Modern Minimalist Vector Mark */}
      <div
        className="relative flex-shrink-0 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] select-none group"
        style={{ width: dimensions.px, height: dimensions.px }}
      >
        <svg
          viewBox="0 0 40 40"
          width={dimensions.px}
          height={dimensions.px}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          <defs>
            {/* Terracotta Satin Gradient */}
            <linearGradient id="clarityTerra" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#D98275" />
              <stop offset="100%" stopColor="#B65548" />
            </linearGradient>

            {/* Obsidian Dark Gradient */}
            <linearGradient id="clarityDark" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2A2522" />
              <stop offset="100%" stopColor="#181513" />
            </linearGradient>

            {/* Light Parchment Gradient */}
            <linearGradient id="clarityLight" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F4EFEA" />
            </linearGradient>
          </defs>

          {/* Background Chassis */}
          {showChassis && theme === 'terracotta' && (
            <>
              <rect
                width="40"
                height="40"
                rx={rx}
                fill="url(#clarityTerra)"
              />
              {/* Subtle top rim specular highlight */}
              <rect
                x="0.5"
                y="0.5"
                width="39"
                height="39"
                rx={rx - 0.5}
                stroke="white"
                strokeOpacity="0.25"
                strokeWidth="1"
              />
            </>
          )}

          {showChassis && theme === 'dark' && (
            <>
              <rect
                width="40"
                height="40"
                rx={rx}
                fill="url(#clarityDark)"
              />
              <rect
                x="0.5"
                y="0.5"
                width="39"
                height="39"
                rx={rx - 0.5}
                stroke="white"
                strokeOpacity="0.1"
                strokeWidth="1"
              />
            </>
          )}

          {showChassis && theme === 'light' && (
            <>
              <rect
                width="40"
                height="40"
                rx={rx}
                fill="url(#clarityLight)"
              />
              <rect
                x="0.5"
                y="0.5"
                width="39"
                height="39"
                rx={rx - 0.5}
                stroke="black"
                strokeOpacity="0.08"
                strokeWidth="1"
              />
            </>
          )}

          {showChassis && theme === 'outline' && (
            <rect
              x="0.75"
              y="0.75"
              width="38.5"
              height="38.5"
              rx={rx - 0.75}
              stroke="#C87467"
              strokeWidth="1.5"
              fill="#FAF8F5"
            />
          )}

          {/* 
            Geometric "C" Arc
            - Mathematical 270° curve with continuous curvature
            - Centered at (18.5, 20) with radius 8.5px
          */}
          <path
            d="M 24.5 13.8 C 21.2 11.2 16.5 11.2 13.5 14.1 C 10.2 17.3 10.2 22.7 13.5 25.9 C 16.5 28.8 21.2 28.8 24.5 26.2"
            stroke={
              theme === 'light'
                ? '#24211E'
                : theme === 'outline'
                ? '#C87467'
                : '#FFFFFF'
            }
            strokeWidth={dimensions.stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 
            Faceted Prism Spark of Clarity
            - Centered at (23.2, 20) with left apex touching (18.5, 20)
            - Dual-facet geometric shimmer
          */}
          <g className="transition-transform duration-300 origin-[23.2px_20px] group-hover:scale-115">
            {/* Left Facet (Light) */}
            <polygon
              points="23.2,16 23.2,24 18.5,20"
              fill={
                theme === 'light'
                  ? '#C87467'
                  : theme === 'outline'
                  ? '#C87467'
                  : '#FFFFFF'
              }
            />

            {/* Right Facet (Specular) */}
            <polygon
              points="23.2,16 23.2,24 27.8,20"
              fill={
                theme === 'terracotta'
                  ? '#FFE5DC'
                  : theme === 'dark'
                  ? '#E88F82'
                  : theme === 'outline'
                  ? '#E88F82'
                  : '#D98275'
              }
              fillOpacity="0.9"
            />

            {/* Center Micro Spark Core */}
            <circle
              cx="23.2"
              cy="20"
              r="0.75"
              fill={theme === 'light' ? '#FAF8F5' : '#FFFFFF'}
            />
          </g>
        </svg>
      </div>

      {/* Brand Text Lockup */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <span
            className={`font-serif font-bold tracking-tight text-ink ${dimensions.text} leading-tight truncate select-none`}
          >
            Clarity
          </span>
          {subtitle && (
            <span
              className={`font-mono ${dimensions.subText} uppercase tracking-[0.16em] text-ink-faint font-semibold truncate mt-0.5 select-none`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ClarityLogo;
