"use client";

import { useState, useMemo } from "react";

export default function OrbitAnimation() {
  const [activeMode, setActiveMode] = useState("ufo"); // 'ufo' | 'globe' | 'reactor'
  const [isBeaming, setIsBeaming] = useState(true);

  // Background stars
  const stars = useMemo(() => [
    { cx: 20, cy: 30, r: 1.2, delay: "0s", dur: "3.5s" },
    { cx: 65, cy: 20, r: 0.8, delay: "1.2s", dur: "4.8s" },
    { cx: 185, cy: 25, r: 1.4, delay: "0.5s", dur: "5.2s" },
    { cx: 215, cy: 75, r: 0.9, delay: "2.1s", dur: "4.2s" },
    { cx: 30, cy: 110, r: 1.1, delay: "3.0s", dur: "5.8s" },
    { cx: 205, cy: 155, r: 0.8, delay: "1.6s", dur: "6.0s" },
    { cx: 25, cy: 190, r: 1.3, delay: "2.7s", dur: "4.5s" },
    { cx: 190, cy: 205, r: 1.0, delay: "0.8s", dur: "5.0s" },
    { cx: 75, cy: 215, r: 0.7, delay: "1.9s", dur: "6.5s" },
  ], []);

  return (
    <div style={styles.container}>
      {/* Visual Mode 1: Sci-Fi UFO Abduction Cruiser (Primary) */}
      {activeMode === "ufo" && (
        <svg
          viewBox="0 0 240 230"
          style={styles.svg}
          xmlns="http://www.w3.org/2000/svg"
          onClick={() => setIsBeaming(prev => !prev)}
        >
          <defs>
            {/* Gradients */}
            <radialGradient id="ufoDomeGrad" cx="40%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#0284c7" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#082f49" stopOpacity="0.8" />
            </radialGradient>

            <linearGradient id="ufoHullGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="30%" stopColor="#94a3b8" />
              <stop offset="70%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            <linearGradient id="ufoRimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            <linearGradient id="ufoTractorBeamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.85" />
              <stop offset="30%" stopColor="var(--accent)" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
            </linearGradient>

            <radialGradient id="ufoCoreThruster" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>

            <radialGradient id="moonGlow" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.7" />
              <stop offset="70%" stopColor="#94a3b8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>

            <filter id="neonBeamGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Distant Moon in corner */}
          <circle cx="205" cy="35" r="14" fill="url(#moonGlow)" opacity="0.6" />
          <circle cx="202" cy="33" r="3" fill="var(--card-border)" opacity="0.3" />
          <circle cx="209" cy="39" r="2" fill="var(--card-border)" opacity="0.25" />

          {/* Ambient Cosmic Stars */}
          {stars.map((s, idx) => (
            <circle
              key={idx}
              cx={s.cx}
              cy={s.cy}
              r={s.r}
              fill="var(--text)"
              className="cosmic-star"
              style={{ animationDelay: s.delay, animationDuration: s.dur }}
            />
          ))}

          {/* Holographic Radar Waves radiating from mothership */}
          <g className="ufo-radar-rings">
            <ellipse cx="120" cy="85" rx="55" ry="16" fill="none" stroke="var(--accent)" strokeWidth="0.75" strokeDasharray="3,6" opacity="0.4" />
            <ellipse cx="120" cy="85" rx="85" ry="24" fill="none" stroke="var(--line)" strokeWidth="0.6" strokeDasharray="4,8" opacity="0.3" />
          </g>

          {/* Entire Floating UFO Craft Group (Drifts and bobs in flight) */}
          <g className="ufo-hover-craft">
            
            {/* TRACTOR ABDUCTION BEAM */}
            {isBeaming && (
              <g className="ufo-tractor-beam-group">
                {/* Conical Light Beam */}
                <polygon
                  points="102,96 138,96 182,215 58,215"
                  fill="url(#ufoTractorBeamGrad)"
                  filter="url(#neonBeamGlow)"
                  className="ufo-tractor-cone"
                />

                {/* Vertical Scanning Light Particles */}
                <line x1="85" y1="130" x2="155" y2="130" stroke="var(--accent)" strokeWidth="1.2" opacity="0.6" className="ufo-beam-scanline-1" />
                <line x1="72" y1="165" x2="168" y2="165" stroke="#38bdf8" strokeWidth="1" opacity="0.5" className="ufo-beam-scanline-2" />
                <line x1="62" y1="195" x2="178" y2="195" stroke="var(--accent)" strokeWidth="1.2" opacity="0.4" className="ufo-beam-scanline-3" />

                {/* Ground Abduction Target Ring */}
                <ellipse cx="120" cy="214" rx="58" ry="12" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.75" strokeDasharray="6,4" className="ufo-target-ring" />
                <ellipse cx="120" cy="214" rx="40" ry="8" fill="var(--accent)" opacity="0.15" />

                {/* Levitating "Bug / Link" Data Core being Abducted! */}
                <g className="ufo-abducted-object">
                  {/* Floating Link/Bug Core */}
                  <rect x="111" y="152" width="18" height="18" rx="4" fill="url(#ufoHullGrad)" stroke="var(--accent)" strokeWidth="1.5" transform="rotate(45 120 161)" />
                  {/* Glowing Bug Indicator Icon inside */}
                  <circle cx="120" cy="161" r="3.5" fill="#f97316" filter="url(#neonBeamGlow)" />
                  <circle cx="120" cy="161" r="1.5" fill="#ffffff" />
                  
                  {/* Levitating Orbit Energy Halo */}
                  <ellipse cx="120" cy="161" rx="16" ry="6" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" className="ufo-object-halo" />
                </g>
              </g>
            )}

            {/* UFO MOTHERSHIP BODY */}
            
            {/* Thruster Engine Glow Cone */}
            <ellipse cx="120" cy="95" rx="18" ry="6" fill="url(#ufoCoreThruster)" filter="url(#neonBeamGlow)" className="ufo-thruster-pulse" />

            {/* Lower Hull Plate */}
            <path
              d="M 68 85 Q 120 102 172 85 Q 150 96 120 96 Q 90 96 68 85 Z"
              fill="#1e293b"
              stroke="var(--card-border)"
              strokeWidth="0.75"
            />

            {/* Main Saucer Disk */}
            <ellipse cx="120" cy="80" rx="72" ry="18" fill="url(#ufoHullGrad)" stroke="var(--line)" strokeWidth="1" />

            {/* Upper Saucer Terrace */}
            <ellipse cx="120" cy="76" rx="52" ry="12" fill="#334155" stroke="var(--card-border)" strokeWidth="0.75" />

            {/* Glass Cockpit Dome */}
            <path
              d="M 94 72 C 94 48, 146 48, 146 72 Z"
              fill="url(#ufoDomeGrad)"
              stroke="#38bdf8"
              strokeWidth="1.2"
              filter="url(#neonBeamGlow)"
              opacity="0.95"
            />
            {/* Dome Glare Highlight */}
            <path
              d="M 102 68 C 104 54, 126 52, 134 56 C 122 56, 108 62, 104 68 Z"
              fill="#ffffff"
              opacity="0.6"
            />

            {/* Little Alien / Pilot Silhouette */}
            <g className="ufo-alien-pilot">
              {/* Alien Head */}
              <ellipse cx="120" cy="62" rx="6.5" ry="5.5" fill="#047857" />
              {/* Big Alien Eyes */}
              <ellipse cx="117.5" cy="61.5" rx="2" ry="2.6" fill="#09090b" transform="rotate(-15 117.5 61.5)" />
              <ellipse cx="122.5" cy="61.5" rx="2" ry="2.6" fill="#09090b" transform="rotate(15 122.5 61.5)" />
              <circle cx="117.2" cy="60.5" r="0.7" fill="#ffffff" />
              <circle cx="122.2" cy="60.5" r="0.7" fill="#ffffff" />
              {/* Antennas */}
              <line x1="117" y1="57" x2="114" y2="52" stroke="#10b981" strokeWidth="1" />
              <circle cx="113.5" cy="51.5" r="1.2" fill="#38bdf8" />
              <line x1="123" y1="57" x2="126" y2="52" stroke="#10b981" strokeWidth="1" />
              <circle cx="126.5" cy="51.5" r="1.2" fill="#38bdf8" />
            </g>

            {/* Saucer Rim Neon LED Lights (Chasing circular pulse) */}
            <g className="ufo-rim-leds">
              <circle cx="58" cy="80" r="2.8" fill="#10b981" className="ufo-led-1" filter="url(#neonBeamGlow)" />
              <circle cx="70" cy="86" r="2.8" fill="#38bdf8" className="ufo-led-2" filter="url(#neonBeamGlow)" />
              <circle cx="88" cy="90" r="3.0" fill="#f59e0b" className="ufo-led-3" filter="url(#neonBeamGlow)" />
              <circle cx="109" cy="92" r="3.2" fill="#10b981" className="ufo-led-4" filter="url(#neonBeamGlow)" />
              <circle cx="131" cy="92" r="3.2" fill="#ec4899" className="ufo-led-5" filter="url(#neonBeamGlow)" />
              <circle cx="152" cy="90" r="3.0" fill="#38bdf8" className="ufo-led-6" filter="url(#neonBeamGlow)" />
              <circle cx="170" cy="86" r="2.8" fill="#f59e0b" className="ufo-led-7" filter="url(#neonBeamGlow)" />
              <circle cx="182" cy="80" r="2.8" fill="#10b981" className="ufo-led-8" filter="url(#neonBeamGlow)" />
            </g>

            {/* Top Antenna Beacon */}
            <line x1="120" y1="48" x2="120" y2="40" stroke="var(--card-border)" strokeWidth="1.2" />
            <circle cx="120" cy="39" r="2.5" fill="#38bdf8" filter="url(#neonBeamGlow)" className="ufo-top-beacon" />
          </g>
        </svg>
      )}

      {/* Visual Mode 2: 3D Wireframe Cyber-Globe */}
      {activeMode === "globe" && (
        <svg viewBox="0 0 220 220" style={styles.svg} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="globeGlow2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
              <stop offset="65%" stopColor="var(--accent)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
            <filter id="cyberGlow2" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Stars */}
          {stars.map((s, idx) => (
            <circle key={idx} cx={s.cx} cy={s.cy} r={s.r} fill="var(--text)" className="cosmic-star" style={{ animationDelay: s.delay, animationDuration: s.dur }} />
          ))}

          {/* Gyro Rings */}
          <g className="holo-gyro-1">
            <ellipse cx="110" cy="110" rx="96" ry="42" fill="none" stroke="var(--card-border)" strokeWidth="0.8" strokeDasharray="4,8" opacity="0.6" />
            <circle cx="206" cy="110" r="3" fill="var(--accent)" filter="url(#cyberGlow2)" />
          </g>
          <g className="holo-gyro-2">
            <ellipse cx="110" cy="110" rx="90" ry="38" fill="none" stroke="var(--line)" strokeWidth="0.8" strokeDasharray="8,6" opacity="0.5" />
            <circle cx="20" cy="110" r="2.5" fill="#38bdf8" filter="url(#cyberGlow2)" />
          </g>

          <circle cx="110" cy="110" r="62" fill="url(#globeGlow2)" />
          <circle cx="110" cy="110" r="54" fill="none" stroke="var(--accent)" strokeWidth="1.2" opacity="0.6" />

          <g className="holo-globe-longitudes">
            <ellipse cx="110" cy="110" rx="46" ry="54" fill="none" stroke="var(--accent)" strokeWidth="0.75" opacity="0.4" strokeDasharray="3,3" />
            <ellipse cx="110" cy="110" rx="28" ry="54" fill="none" stroke="var(--accent)" strokeWidth="0.85" opacity="0.5" />
            <ellipse cx="110" cy="110" rx="10" ry="54" fill="none" stroke="var(--accent)" strokeWidth="0.95" opacity="0.65" />
          </g>

          <ellipse cx="110" cy="110" rx="54" ry="18" fill="none" stroke="var(--accent)" strokeWidth="1.1" opacity="0.75" className="holo-equator-pulse" />
          <ellipse cx="110" cy="88" rx="48" ry="12" fill="none" stroke="var(--line)" strokeWidth="0.75" opacity="0.45" />
          <ellipse cx="110" cy="132" rx="48" ry="12" fill="none" stroke="var(--line)" strokeWidth="0.75" opacity="0.45" />
        </svg>
      )}

      {/* Visual Mode 3: Quantum Reactor Core */}
      {activeMode === "reactor" && (
        <svg viewBox="0 0 220 220" style={styles.svg} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="reactorCore2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="40%" stopColor="var(--accent)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          <polygon points="110,18 190,64 190,156 110,202 30,156 30,64" fill="none" stroke="var(--card-border)" strokeWidth="0.8" strokeDasharray="4,8" className="reactor-hex-outer" />
          <polygon points="110,36 174,73 174,147 110,184 46,147 46,73" fill="none" stroke="var(--accent)" strokeWidth="1.2" opacity="0.6" strokeDasharray="8,6" className="reactor-hex-mid" />

          <circle cx="110" cy="110" r="54" fill="none" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="16,12" className="reactor-ring-cw" />
          <circle cx="110" cy="110" r="42" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="10,8" opacity="0.8" className="reactor-ring-ccw" />
          <circle cx="110" cy="110" r="28" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="6,6" className="reactor-ring-cw-fast" />

          <circle cx="110" cy="110" r="32" fill="url(#reactorCore2)" className="cosmic-core-glow" />
          <circle cx="110" cy="110" r="12" fill="var(--accent)" className="cosmic-core-glow" />
          <circle cx="110" cy="110" r="5" fill="#ffffff" />
        </svg>
      )}

      {/* Interactive Mode Tabs Pill */}
      <div style={styles.tabBar}>
        <button
          onClick={() => setActiveMode("ufo")}
          style={{
            ...styles.modeTab,
            ...(activeMode === "ufo" ? styles.modeTabActive : {})
          }}
          title="🛸 Sci-Fi UFO Abduction Cruiser"
        >
          🛸 UFO
        </button>
        <button
          onClick={() => setActiveMode("globe")}
          style={{
            ...styles.modeTab,
            ...(activeMode === "globe" ? styles.modeTabActive : {})
          }}
          title="🌐 3D Holographic Globe"
        >
          🌐 Globe
        </button>
        <button
          onClick={() => setActiveMode("reactor")}
          style={{
            ...styles.modeTab,
            ...(activeMode === "reactor" ? styles.modeTabActive : {})
          }}
          title="⚛️ Quantum Reactor Core"
        >
          ⚛️ Core
        </button>
      </div>

      {/* Telemetry Status Line */}
      <div style={styles.hudSubtext}>
        {activeMode === "ufo" && "🛸 MOTHERSHIP IN ORBIT // ABDUCTING BUG #404"}
        {activeMode === "globe" && "🌐 HOLO-PLANET // STANDBY SCAN"}
        {activeMode === "reactor" && "⚛️ QUANTUM CORE // HARMONIC STABLE"}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    height: "100%",
    minHeight: "220px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.5rem",
    position: "relative",
    overflow: "hidden"
  },
  svg: {
    width: "100%",
    maxWidth: "205px",
    height: "auto",
    aspectRatio: "1/1",
    filter: "drop-shadow(0 4px 18px rgba(0,0,0,0.2))",
    cursor: "pointer"
  },
  tabBar: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.2rem",
    backgroundColor: "var(--bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "14px",
    padding: "0.15rem 0.25rem",
    marginTop: "0.3rem",
    zIndex: 5
  },
  modeTab: {
    padding: "0.15rem 0.45rem",
    fontSize: "0.68rem",
    fontWeight: "700",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "transparent",
    color: "var(--muted)",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  modeTabActive: {
    backgroundColor: "var(--card-bg)",
    color: "var(--accent)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.12)"
  },
  hudSubtext: {
    marginTop: "0.25rem",
    fontSize: "0.6rem",
    fontWeight: "700",
    letterSpacing: "0.08em",
    color: "var(--muted)",
    textTransform: "uppercase"
  }
};
