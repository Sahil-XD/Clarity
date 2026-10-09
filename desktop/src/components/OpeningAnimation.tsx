import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sound } from '@/lib/sound';

interface OpeningAnimationProps {
  onComplete: () => void;
}

const LETTERS = ['C', 'l', 'a', 'r', 'i', 't', 'y'];

export const OpeningAnimation: React.FC<OpeningAnimationProps> = ({ onComplete }) => {
  const [markEntered, setMarkEntered] = useState(false);
  const [visibleLetters, setVisibleLetters] = useState(0);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [shimmerActive, setShimmerActive] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const completedRef = useRef(false);

  const handleFinish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 320);
  }, [onComplete]);

  // Keyboard shortcut (Escape / Space / Enter) and skip click handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFinish]);

  // Main Choreography Sequence
  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const quickTimer = setTimeout(handleFinish, 300);
      return () => clearTimeout(quickTimer);
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    // T = 80ms: Mark ignites in center
    timers.push(
      setTimeout(() => {
        setMarkEntered(true);
      }, 80)
    );

    // T = 240ms: Mark ignition acoustic tick
    timers.push(
      setTimeout(() => {
        sound.pop(0.9);
      }, 240)
    );

    // T = 680ms - 1460ms: Progressive typographic unfolding (C -> Cl -> Cla -> Clar -> Clari -> Clarit -> Clarity)
    LETTERS.forEach((_, idx) => {
      timers.push(
        setTimeout(() => {
          setVisibleLetters(idx + 1);
          // Ascending acoustic pitch for each unfolding character
          sound.pop(0.85 + idx * 0.08);
        }, 680 + idx * 110)
      );
    });

    // T = 1550ms: Subtitle whisper and hairline rule reveal
    timers.push(
      setTimeout(() => {
        setShowSubtitle(true);
      }, 1550)
    );

    // T = 1700ms: Specular light sweep & harmonic chime
    timers.push(
      setTimeout(() => {
        setShimmerActive(true);
        sound.chime();
      }, 1700)
    );

    // T = 2850ms: Graceful workspace dissolve
    timers.push(
      setTimeout(() => {
        handleFinish();
      }, 2850)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [handleFinish]);

  return (
    <AnimatePresence>
      {!completedRef.current || isExiting ? (
        <motion.div
          key="clarity-intro-curtain"
          initial={{ opacity: 1 }}
          animate={{ opacity: isExiting ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleFinish}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-ground select-none overflow-hidden cursor-pointer"
          style={{ willChange: 'opacity, transform' }}
        >
          {/* Ambient Studio Lighting (Warm Radial Aura) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div
              className="w-[680px] h-[680px] rounded-full blur-3xl opacity-80"
              style={{
                background:
                  'radial-gradient(circle, rgba(200, 116, 103, 0.16) 0%, rgba(200, 116, 103, 0.04) 45%, transparent 72%)',
              }}
            />
          </motion.div>

          {/* Master Lockup Container */}
          <motion.div
            layout
            initial={{ scale: 0.94, opacity: 0, y: 10, filter: 'blur(8px)' }}
            animate={{
              scale: isExiting ? 1.04 : 1,
              opacity: isExiting ? 0 : 1,
              y: isExiting ? -8 : 0,
              filter: isExiting ? 'blur(6px)' : 'blur(0px)',
            }}
            transition={{
              type: 'spring',
              stiffness: 340,
              damping: 28,
              mass: 0.8,
            }}
            className="relative z-10 flex flex-col items-center justify-center px-8 py-6"
          >
            {/* Horizontal Row: Mark + Expanding Kinetic Typography */}
            <motion.div 
              layout 
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              className="flex items-center gap-3.5 sm:gap-4 md:gap-5"
            >
              {/* High-Fidelity Vector Squircle Mark */}
              <motion.div
                layout
                initial={{ scale: 0.55, rotate: -6, opacity: 0 }}
                animate={{
                  scale: markEntered ? 1 : 0.55,
                  rotate: markEntered ? 0 : -6,
                  opacity: markEntered ? 1 : 0,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 440,
                  damping: 25,
                  mass: 0.7,
                }}
                className="relative flex-shrink-0 w-13 h-13 md:w-15 md:h-15 drop-shadow-md"
              >
                <svg
                  viewBox="0 0 40 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                >
                  <defs>
                    <linearGradient
                      id="introTerra"
                      x1="0"
                      y1="0"
                      x2="40"
                      y2="40"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor="#D98275" />
                      <stop offset="100%" stopColor="#B65548" />
                    </linearGradient>
                  </defs>

                  {/* Terracotta Satin Squircle Chassis */}
                  <rect width="40" height="40" rx="11" fill="url(#introTerra)" />

                  {/* Specular Rim Highlight */}
                  <rect
                    x="0.5"
                    y="0.5"
                    width="39"
                    height="39"
                    rx="10.5"
                    stroke="white"
                    strokeOpacity="0.32"
                    strokeWidth="1"
                  />

                  {/* Geometric 'C' Arc */}
                  <motion.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
                    d="M 24.5 13.8 C 21.2 11.2 16.5 11.2 13.5 14.1 C 10.2 17.3 10.2 22.7 13.5 25.9 C 16.5 28.8 21.2 28.8 24.5 26.2"
                    stroke="#FFFFFF"
                    strokeWidth="2.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Faceted Prism Spark */}
                  <motion.g
                    initial={{ scale: 0, rotate: -25 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 480,
                      damping: 18,
                      delay: 0.26,
                    }}
                    className="origin-[23.2px_20px]"
                  >
                    {/* Left Facet (Bone White) */}
                    <polygon points="23.2,16 23.2,24 18.5,20" fill="#FFFFFF" />

                    {/* Right Facet (Specular Terracotta Tint) */}
                    <polygon
                      points="23.2,16 23.2,24 27.8,20"
                      fill="#FFE5DC"
                      fillOpacity="0.95"
                    />

                    {/* Micro Spark Core */}
                    <circle cx="23.2" cy="20" r="0.85" fill="#FFFFFF" />
                  </motion.g>
                </svg>
              </motion.div>

              {/* Kinetic Typography Unfolding: C -> Cl -> Cla -> Clar -> Clari -> Clarit -> Clarity */}
              <div className="relative flex items-baseline font-serif font-bold text-4xl sm:text-5xl md:text-[56px] leading-none text-ink tracking-tight overflow-hidden py-1">
                {LETTERS.map((char, index) => {
                  const isVisible = index < visibleLetters;
                  return (
                    <motion.span
                      key={index}
                      initial={false}
                      animate={{
                        width: isVisible ? 'auto' : 0,
                        opacity: isVisible ? 1 : 0,
                        y: isVisible ? 0 : 12,
                        scale: isVisible ? 1 : 0.8,
                        filter: isVisible ? 'blur(0px)' : 'blur(4px)',
                      }}
                      transition={{
                        width: { type: 'spring', stiffness: 420, damping: 32 },
                        opacity: { duration: 0.16, ease: 'easeOut' },
                        y: { type: 'spring', stiffness: 460, damping: 26 },
                        scale: { duration: 0.18, ease: 'easeOut' },
                        filter: { duration: 0.2 },
                      }}
                      className="inline-block overflow-hidden whitespace-nowrap origin-bottom"
                    >
                      <span className="inline-block px-[0.5px]">{char}</span>
                    </motion.span>
                  );
                })}

                {/* Specular Light Sweep Shimmer */}
                {shimmerActive && (
                  <motion.div
                    initial={{ x: '-120%', opacity: 0 }}
                    animate={{ x: '240%', opacity: [0, 0.7, 0] }}
                    transition={{ duration: 0.85, ease: 'easeInOut' }}
                    className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-24deg]"
                  />
                )}
              </div>
            </motion.div>

            {/* Subtitle Whisper & Terracotta Hairline Horizon */}
            <motion.div
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{
                opacity: showSubtitle ? 1 : 0,
                y: showSubtitle ? 0 : 6,
              }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center mt-3.5 w-full max-w-[260px]"
            >
              {/* Hairline Horizon Rule */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: showSubtitle ? 1 : 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="h-px w-full bg-gradient-to-r from-transparent via-accent/50 to-transparent mb-2.5 origin-center"
              />

              {/* Subtitle Monogram with Tracking Bloom */}
              <motion.span
                initial={{ letterSpacing: '0.14em' }}
                animate={{ letterSpacing: showSubtitle ? '0.26em' : '0.14em' }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="font-mono text-[9.5px] md:text-[11px] font-semibold tracking-[0.26em] text-ink-soft uppercase text-center select-none"
              >
                PERSONAL WORKSPACE
              </motion.span>
            </motion.div>
          </motion.div>

          {/* Discreet Skip Prompt */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: isExiting ? 0 : 0.5, y: 0 }}
            whileHover={{ opacity: 0.9 }}
            transition={{ delay: 0.7, duration: 0.3 }}
            className="absolute bottom-7 flex items-center gap-1.5 px-3 py-1 rounded-full border border-rule/60 bg-surface/70 backdrop-blur-md text-[11px] text-ink-faint select-none transition-opacity"
          >
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-raised border border-rule text-[9.5px] font-mono text-ink-soft">
              Esc
            </kbd>
            <span>or click to skip</span>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default OpeningAnimation;
