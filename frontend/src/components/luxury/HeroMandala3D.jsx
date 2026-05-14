import React from 'react';
import { motion } from 'framer-motion';

/**
 * HeroMandala3D — CSS/SVG animated gold mandala + dust particles.
 * Avoids R3F + React 19 incompatibility while delivering the same
 * cinematic "rotating ornate gold mandala" feel from the master spec.
 */
const GOLD = '#C9A84C';
const LIGHT_GOLD = '#E8D5A3';

const PARTICLE_COUNT = 60;

const HeroMandala3D = () => {
  return (
    <div className="hero-mandala-3d" aria-hidden="true">
      {/* Layered rotating mandalas */}
      <div className="mandala-stack">
        <Mandala size={760} duration={120} reverse={false} opacity={0.9} ringCount={12} />
        <Mandala size={580} duration={90}  reverse={true}  opacity={0.7} ringCount={8} />
        <Mandala size={400} duration={60}  reverse={false} opacity={0.55} ringCount={6} simple />
      </div>

      {/* Gold dust particles */}
      <div className="gold-dust-container">
        {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
          <span
            key={i}
            className="gold-dust"
            style={{
              left:  `${Math.random() * 100}%`,
              bottom: `${Math.random() * 100}%`,
              width:  `${1.5 + Math.random() * 3}px`,
              height: `${1.5 + Math.random() * 3}px`,
              animationDelay:    `${Math.random() * 18}s`,
              animationDuration: `${14 + Math.random() * 18}s`,
              opacity:           0.25 + Math.random() * 0.5,
            }}
          />
        ))}
      </div>

      {/* Inner gold glow */}
      <motion.div
        className="mandala-glow"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
};

const Mandala = ({ size, duration, reverse, opacity, ringCount = 8, simple = false }) => {
  const r = size / 2 - 20;
  const cx = size / 2;
  const cy = size / 2;
  const petals = ringCount * 2;

  return (
    <motion.svg
      className="mandala-svg"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ opacity }}
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    >
      <defs>
        <radialGradient id={`g-${size}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={LIGHT_GOLD} stopOpacity="0.0" />
          <stop offset="60%"  stopColor={GOLD}       stopOpacity="0.4" />
          <stop offset="100%" stopColor={GOLD}       stopOpacity="0.0" />
        </radialGradient>
      </defs>

      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r}      fill="none" stroke={GOLD}       strokeWidth="0.6" strokeOpacity="0.7" />
      <circle cx={cx} cy={cy} r={r - 14} fill="none" stroke={LIGHT_GOLD} strokeWidth="0.4" strokeOpacity="0.4" strokeDasharray="3 5" />

      {/* Inner ring */}
      {!simple && (
        <>
          <circle cx={cx} cy={cy} r={r * 0.6} fill="none" stroke={GOLD} strokeWidth="0.4" strokeOpacity="0.6" />
          <circle cx={cx} cy={cy} r={r * 0.42} fill="none" stroke={LIGHT_GOLD} strokeWidth="0.3" strokeOpacity="0.4" strokeDasharray="2 3" />
        </>
      )}

      {/* Petals — radial spokes */}
      {Array.from({ length: petals }).map((_, i) => {
        const angle = (i / petals) * Math.PI * 2;
        const innerR = r * 0.3;
        const outerR = r;
        const x1 = cx + Math.cos(angle) * innerR;
        const y1 = cy + Math.sin(angle) * innerR;
        const x2 = cx + Math.cos(angle) * outerR;
        const y2 = cy + Math.sin(angle) * outerR;
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={i % 2 === 0 ? GOLD : LIGHT_GOLD}
            strokeWidth={i % 2 === 0 ? 0.7 : 0.4}
            strokeOpacity={i % 2 === 0 ? 0.7 : 0.4}
            strokeLinecap="round"
          />
        );
      })}

      {/* Lotus-style curved petals */}
      {!simple && Array.from({ length: ringCount }).map((_, i) => {
        const angle = (i / ringCount) * 360;
        return (
          <g key={`petal-${i}`} transform={`rotate(${angle} ${cx} ${cy})`}>
            <path
              d={`M ${cx} ${cy - r * 0.55} Q ${cx + r * 0.12} ${cy - r * 0.4} ${cx} ${cy - r * 0.25} Q ${cx - r * 0.12} ${cy - r * 0.4} ${cx} ${cy - r * 0.55} Z`}
              fill="none"
              stroke={GOLD}
              strokeWidth="0.5"
              strokeOpacity="0.6"
            />
          </g>
        );
      })}

      {/* Center diamond */}
      <circle cx={cx} cy={cy} r={r * 0.08} fill={GOLD} fillOpacity="0.7" />
      <circle cx={cx} cy={cy} r={r * 0.04} fill={LIGHT_GOLD} />

      {/* Glow halo */}
      <circle cx={cx} cy={cy} r={r * 0.95} fill={`url(#g-${size})`} />
    </motion.svg>
  );
};

export default HeroMandala3D;
