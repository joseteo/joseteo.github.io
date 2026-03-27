import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  AbsoluteFill,
} from "remotion";

/**
 * TL Brand Logo — Animated Reveal (Teo Lorente)
 *
 * Matched to the Pencil.dev mockup:
 * - 200x200 rounded square (rx 24) with cyan→blue 135deg gradient
 * - "T" at full white, "L" at 40% white opacity
 * - Small accent dot (14px) top-right
 *
 * Animation sequence (3s at 30fps = 90 frames):
 *   0-20   Background scales in with spring + subtle rotation settle
 *  12-30   "T" fades in from bottom with spring
 *  22-40   "L" fades in from bottom, staggered
 *  35-50   Accent dot pops in with overshoot spring
 *  40-60   Particle ring expands outward from logo center
 *  50-70   "Teo Lorente" text fades in below logo
 *  60-75   Subtle glow pulse behind logo
 *  75-90   Hold final state, particles slowly orbit
 */
export const LogoAnimation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Background rounded square ──────────────────────────────
  const bgSpring = spring({
    frame,
    fps,
    config: { damping: 13, stiffness: 90, mass: 0.7 },
  });

  const bgRotation = interpolate(frame, [0, 25], [12, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const bgRadius = interpolate(frame, [0, 15], [50, 24], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // ── "T" letter ─────────────────────────────────────────────
  const tSpring = spring({
    frame: Math.max(0, frame - 12),
    fps,
    config: { damping: 15, stiffness: 120, mass: 0.5 },
  });
  const tOpacity = interpolate(tSpring, [0, 1], [0, 1]);
  const tY = interpolate(tSpring, [0, 1], [30, 0]);

  // ── "L" letter ─────────────────────────────────────────────
  const lSpring = spring({
    frame: Math.max(0, frame - 22),
    fps,
    config: { damping: 15, stiffness: 120, mass: 0.5 },
  });
  const lOpacity = interpolate(lSpring, [0, 1], [0, 0.4]);
  const lY = interpolate(lSpring, [0, 1], [30, 0]);

  // ── Accent dot ─────────────────────────────────────────────
  const dotSpring = spring({
    frame: Math.max(0, frame - 35),
    fps,
    config: { damping: 6, stiffness: 250, mass: 0.3 },
  });

  // ── Brand text "Teo Lorente" ───────────────────────────────
  const textOpacity = interpolate(frame, [50, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [50, 65], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // ── Subtitle ───────────────────────────────────────────────
  const subOpacity = interpolate(frame, [58, 72], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Glow pulse ─────────────────────────────────────────────
  const glowOpacity = interpolate(
    frame,
    [60, 70, 80, 90],
    [0, 0.35, 0.12, 0.12],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // ── Orbiting particles ─────────────────────────────────────
  const particleExpand = interpolate(frame, [40, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const particleFade = interpolate(frame, [40, 55, 82, 90], [0, 0.5, 0.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const particles = [
    { angle: 0, r: 130, size: 4 },
    { angle: Math.PI * 0.33, r: 140, size: 3 },
    { angle: Math.PI * 0.67, r: 125, size: 5 },
    { angle: Math.PI, r: 135, size: 3 },
    { angle: Math.PI * 1.33, r: 145, size: 4 },
    { angle: Math.PI * 1.67, r: 128, size: 3 },
    { angle: Math.PI * 0.5, r: 150, size: 2 },
    { angle: Math.PI * 1.5, r: 120, size: 2 },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0A0F1C",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
      }}
    >
      {/* Particles orbiting the logo */}
      {particles.map((p, i) => {
        const orbitAngle = p.angle + frame * 0.015;
        const radius = p.r * particleExpand;
        const cx = 200 + Math.cos(orbitAngle) * radius;
        const cy = 175 + Math.sin(orbitAngle) * radius;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx - p.size / 2,
              top: cy - p.size / 2,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: "#22D3EE",
              opacity: particleFade,
            }}
          />
        );
      })}

      {/* Connecting lines between adjacent particles */}
      <svg
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          opacity: particleFade * 0.2,
        }}
        viewBox="0 0 400 400"
      >
        {particles.slice(0, 6).map((p, i) => {
          const next = particles[(i + 1) % 6];
          const a1 = p.angle + frame * 0.015;
          const a2 = next.angle + frame * 0.015;
          const r1 = p.r * particleExpand;
          const r2 = next.r * particleExpand;
          return (
            <line
              key={i}
              x1={200 + Math.cos(a1) * r1}
              y1={175 + Math.sin(a1) * r1}
              x2={200 + Math.cos(a2) * r2}
              y2={175 + Math.sin(a2) * r2}
              stroke="#22D3EE"
              strokeWidth={0.5}
            />
          );
        })}
      </svg>

      {/* Glow behind logo */}
      <div
        style={{
          position: "absolute",
          width: 240,
          height: 240,
          top: 175 - 120,
          left: 200 - 120,
          borderRadius: 32,
          background:
            "radial-gradient(circle, rgba(34,211,238,0.25) 0%, transparent 70%)",
          opacity: glowOpacity,
        }}
      />

      {/* Logo container */}
      <div
        style={{
          width: 200,
          height: 200,
          position: "relative",
          transform: `scale(${bgSpring}) rotate(${bgRotation}deg)`,
          flexShrink: 0,
        }}
      >
        {/* Gradient background */}
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: bgRadius,
            background: "linear-gradient(135deg, #22D3EE 0%, #3B82F6 100%)",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />

        {/* "T" — primary letter, full white */}
        <span
          style={{
            position: "absolute",
            left: 24,
            top: 32,
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            fontSize: 100,
            fontWeight: 700,
            color: "#FFFFFF",
            opacity: tOpacity,
            transform: `translateY(${tY}px)`,
            lineHeight: 1,
          }}
        >
          T
        </span>

        {/* "L" — secondary letter, 40% white */}
        <span
          style={{
            position: "absolute",
            left: 96,
            top: 32,
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            fontSize: 100,
            fontWeight: 700,
            color: "#FFFFFF",
            opacity: lOpacity,
            transform: `translateY(${lY}px)`,
            lineHeight: 1,
          }}
        >
          L
        </span>

        {/* Accent dot — top right signature element */}
        <div
          style={{
            position: "absolute",
            right: 16,
            top: 35,
            width: 14,
            height: 14,
            borderRadius: "50%",
            backgroundColor: "#FFFFFF",
            transform: `scale(${dotSpring})`,
          }}
        />
      </div>

      {/* Brand name */}
      <span
        style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 28,
          fontWeight: 700,
          color: "#FFFFFF",
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
          letterSpacing: -0.5,
        }}
      >
        Teo Lorente
      </span>

      {/* Subtitle */}
      <span
        style={{
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: 12,
          fontWeight: 500,
          color: "#22D3EE",
          opacity: subOpacity,
          letterSpacing: 3,
          textTransform: "uppercase",
          marginTop: -16,
        }}
      >
        AI & Data Engineering
      </span>
    </AbsoluteFill>
  );
};
