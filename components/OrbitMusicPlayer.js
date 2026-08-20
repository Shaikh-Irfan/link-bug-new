"use client";

import { useMemo, useState, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Sparkles, Music, Disc3, Radio, Shuffle } from "lucide-react";
import OrbitAnimation from "./OrbitAnimation";

function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function CircularEqualizer({ isPlaying, currentTrack }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    let animId;
    const tick = () => {
      setPhase(p => p + 0.08);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const tempo = useMemo(() => {
    const title = (currentTrack?.title || "").toLowerCase();
    const artist = (currentTrack?.artist || "").toLowerCase();
    
    if (title.includes("lofi") || title.includes("chill") || title.includes("relax") || artist.includes("lofi")) {
      return { bpm: 72, intensity: 0.7, noiseJitter: 0.08 };
    }
    if (title.includes("trap") || title.includes("remix") || title.includes("boost") || title.includes("edm") || title.includes("dubstep") || title.includes("bass") || title.includes("nation")) {
      return { bpm: 132, intensity: 1.8, noiseJitter: 0.32 };
    }
    if (title.includes("synthwave") || title.includes("retro") || title.includes("electro") || title.includes("cyber")) {
      return { bpm: 115, intensity: 1.3, noiseJitter: 0.2 };
    }
    return { bpm: 95, intensity: 1.1, noiseJitter: 0.15 };
  }, [currentTrack]);

  const getWavyCirclePath = (cx, cy, r, baseAmp, wavesCount, speed, beatEffect = 0) => {
    const points = [];
    const steps = 80;
    
    // Sync beat thumps to estimated track BPM
    const beatInterval = (60 / tempo.bpm) * 4.8;
    const beatTime = phase % beatInterval;
    const beatStrength = Math.exp(-beatTime * (tempo.bpm / 50)); 
    
    const waveMod = Math.sin(phase * speed * 1.5) * 0.25;
    const ampMultiplier = 0.65 + waveMod + (beatEffect * beatStrength * tempo.intensity);
    const currentAmp = isPlaying ? baseAmp * ampMultiplier : baseAmp * 0.15;

    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      
      // Inject high-frequency jitter/noise for Treble (outer ring)
      const noise = beatEffect === 0 ? (Math.sin(angle * 45 + phase * 12) * tempo.noiseJitter) : 0;
      const wavePhase = isPlaying ? phase * speed : 0;
      
      const currentR = r + Math.sin(angle * wavesCount - wavePhase + noise) * currentAmp;
      
      const x = cx + Math.cos(angle) * currentR;
      const y = cy + Math.sin(angle) * currentR;
      points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    points.push('Z');
    return points.join(' ');
  };

  // Bass: Inner magenta/pink ring - low wave count (6), large amplitude (3.2), slow rotation, heavy thumping
  const wavyPath1 = getWavyCirclePath(60, 60, 34, 3.2, 6, 0.9, 1.0);
  // Mid: Middle green ring - mid wave count (12), medium amplitude (2.2), average rotation, minor thumping
  const wavyPath2 = getWavyCirclePath(60, 60, 40, 2.2, 12, 1.6, 0.4);
  // Treble: Outer blue ring - high wave count (22), tight amplitude (1.2), fast wiggling
  const wavyPath3 = getWavyCirclePath(60, 60, 46, 1.2, 22, 2.5, 0.0);

  // Calculate dynamic beat thumping scale for visual bounce
  const beatInterval = (60 / tempo.bpm) * 4.8;
  const beatTime = phase % beatInterval;
  const beatStrength = Math.exp(-beatTime * (tempo.bpm / 50)); 
  const scaleVal = isPlaying 
    ? 1 + (beatStrength * 0.08 * tempo.intensity)
    : 1.0;

  return (
    <div style={styles.discSection}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rotateCw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rotateCcw {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .wavy-ring {
          transform-origin: 60px 60px;
          transition: opacity 0.3s ease;
        }
        .wavy-ring.playing.ring-fast {
          animation: rotateCw 9s linear infinite;
        }
        .wavy-ring.playing.ring-mid {
          animation: rotateCcw 13s linear infinite;
        }
        .wavy-ring.playing.ring-slow {
          animation: rotateCw 18s linear infinite;
        }
        .center-vinyl.spinning {
          animation: rotateCw 20s linear infinite;
        }
      `}} />
      <svg
        viewBox="0 0 120 120"
        style={{
          ...styles.circularSvg,
          transform: `scale(${scaleVal})`,
          transformOrigin: '60px 60px',
          transition: 'transform 0.05s ease-out'
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="neonGlowPink" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="neonGlowGreen" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.0" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="neonGlowBlue" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="centerCircleClip">
            <circle cx="60" cy="60" r="28" />
          </clipPath>
        </defs>

        {/* Wavy Equalizer Rings */}
        <path
          d={wavyPath1}
          stroke="#ec4899"
          strokeWidth="1.2"
          fill="none"
          filter="url(#neonGlowPink)"
          className={`wavy-ring ring-fast ${isPlaying ? 'playing' : ''}`}
          style={{ opacity: isPlaying ? 0.95 : 0.4 }}
        />
        <path
          d={wavyPath2}
          stroke="var(--accent)"
          strokeWidth="1.0"
          fill="none"
          filter="url(#neonGlowGreen)"
          className={`wavy-ring ring-mid ${isPlaying ? 'playing' : ''}`}
          style={{ opacity: isPlaying ? 0.85 : 0.35 }}
        />
        <path
          d={wavyPath3}
          stroke="#2563eb"
          strokeWidth="0.8"
          fill="none"
          filter="url(#neonGlowBlue)"
          className={`wavy-ring ring-slow ${isPlaying ? 'playing' : ''}`}
          style={{ opacity: isPlaying ? 0.75 : 0.3 }}
        />

        {/* Central Cover / Vinyl Label */}
        <g className={`center-vinyl ${isPlaying ? 'spinning' : ''}`} style={{ transformOrigin: '60px 60px' }}>
          <circle cx="60" cy="60" r="30" fill="var(--bg)" stroke="var(--card-border)" strokeWidth="1.5" />
          <circle cx="60" cy="60" r="29" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.4" />
          {currentTrack?.thumbnail ? (
            <image
              href={currentTrack.thumbnail}
              x="32"
              y="32"
              width="56"
              height="56"
              clipPath="url(#centerCircleClip)"
              preserveAspectRatio="xMidYMid slice"
            />
          ) : (
            <circle cx="60" cy="60" r="28" fill="#111827" />
          )}
          <circle cx="60" cy="60" r="4" fill="var(--card-bg)" stroke="var(--accent)" strokeWidth="1" />
          <circle cx="60" cy="60" r="1.5" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
}

export default function OrbitMusicPlayer({
  viewMode = "music",
  onViewModeChange,
  currentTrack = {
    title: "Lofi Hip Hop Radio",
    artist: "Lofi Girl • Chill Beats",
    thumbnail: ""
  },
  isPlaying = true,
  volume = 80,
  isMuted = false,
  currentTime = 0,
  duration = 0,
  isShuffle = false,
  onToggleShuffle = () => {},
  onTogglePlay = () => {},
  onNextTrack = () => {},
  onPrevTrack = () => {},
  onVolumeChange = () => {},
  onToggleMute = () => {},
  onSeek = () => {}
}) {


  return (
    <div style={styles.container}>
      {/* Top Header Mode Switcher */}
      <div style={styles.topBar}>
        <div style={styles.tabGroup}>
          <button
            onClick={() => onViewModeChange && onViewModeChange("music")}
            style={{
              ...styles.tabBtn,
              ...(viewMode === "music" ? styles.tabBtnActive : {})
            }}
          >
            <Music size={12} />
            <span>Player</span>
          </button>
          <button
            onClick={() => onViewModeChange && onViewModeChange("visuals")}
            style={{
              ...styles.tabBtn,
              ...(viewMode === "visuals" ? styles.tabBtnActive : {})
            }}
          >
            <Sparkles size={12} />
            <span>Visuals</span>
          </button>
        </div>

        {viewMode === "music" && (
          <div style={styles.audioStatusBadge}>
            <span
              className={isPlaying ? "orange-pulse-dot" : ""}
              style={{
                width: "6px",
                height: "6px",
                backgroundColor: isPlaying ? "var(--accent)" : "var(--muted)",
                boxShadow: isPlaying ? "0 0 0 0 rgba(16, 185, 129, 0.7)" : "none"
              }}
            />
            <span style={styles.audioStatusText}>
              {isPlaying ? "LIVE AUDIO" : "PAUSED"}
            </span>
          </div>
        )}
      </div>

      {viewMode === "music" ? (
        <div style={styles.playerBody}>
          {/* Circular Equalizer Visualizer */}
          <CircularEqualizer isPlaying={isPlaying} currentTrack={currentTrack} />

          {/* Track Meta Information */}
          <div style={styles.trackInfo}>
            <div style={styles.trackTitle} title={currentTrack?.title || "No track selected"}>
              {currentTrack?.title || "No track selected"}
            </div>
            <div style={styles.trackArtist} title={currentTrack?.artist || "ORBIT Stream Engine"}>
              {currentTrack?.artist || "ORBIT Stream Engine"}
            </div>
          </div>

          {/* Interactive Seek Timeline Bar */}
          <div style={styles.timelineRow}>
            <span style={styles.timeLabel}>{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration > 0 ? duration : 100}
              value={currentTime}
              onChange={e => onSeek && onSeek(Number(e.target.value))}
              style={styles.timelineSlider}
              title={`Seek: ${formatTime(currentTime)} / ${formatTime(duration)}`}
            />
            <span style={styles.timeLabel}>{duration > 0 ? formatTime(duration) : "--:--"}</span>
          </div>

          {/* Audio Playback Controls */}
          <div style={styles.controlsRow}>
            {/* Shuffle Toggle Button */}
            <button
              onClick={onToggleShuffle}
              style={{
                ...styles.controlBtn,
                color: isShuffle ? "var(--accent)" : "var(--text)"
              }}
              title="Shuffle"
            >
              <Shuffle size={13} style={{ opacity: isShuffle ? 1 : 0.6 }} />
            </button>

            {/* Previous Track */}
            <button onClick={onPrevTrack} style={styles.controlBtn} title="Previous">
              <SkipBack size={16} />
            </button>

            {/* Play / Pause Primary Button */}
            <button
              onClick={onTogglePlay}
              style={styles.playPauseBtn}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={18} fill="#fff" /> : <Play size={18} fill="#fff" style={{ marginLeft: "2px" }} />}
            </button>

            {/* Next Track */}
            <button onClick={onNextTrack} style={styles.controlBtn} title="Next">
              <SkipForward size={16} />
            </button>

            {/* Volume Control */}
            <div style={styles.volumeGroup}>
              <button onClick={onToggleMute} style={styles.muteBtn} title={isMuted ? "Unmute" : "Mute"}>
                {isMuted || volume === 0 ? <VolumeX size={14} color="var(--muted)" /> : <Volume2 size={14} color="var(--accent)" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={e => onVolumeChange(Number(e.target.value))}
                style={styles.volumeSlider}
                title={`Volume: ${isMuted ? 0 : volume}%`}
              />
            </div>
          </div>

          {/* Compact Helper Hint */}
          <div style={styles.controllerFooter}>
            <Radio size={11} color="var(--accent)" />
            <span>Search & choose videos/songs from &quot;YouTube&quot; tab</span>
          </div>
        </div>
      ) : (
        /* Visuals Mode */
        <div style={styles.visualsContent}>
          <OrbitAnimation />
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    height: "100%",
    minHeight: "270px",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--card-bg)",
    overflow: "hidden",
    position: "relative"
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.4rem 0.6rem",
    borderBottom: "1px solid var(--card-border)",
    backgroundColor: "var(--bg)"
  },
  tabGroup: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    backgroundColor: "var(--card-bg)",
    padding: "0.15rem",
    borderRadius: "6px",
    border: "1px solid var(--card-border)"
  },
  tabBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    padding: "0.2rem 0.5rem",
    fontSize: "0.7rem",
    fontWeight: "600",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "transparent",
    color: "var(--muted)",
    cursor: "pointer",
    transition: "all 0.15s ease"
  },
  tabBtnActive: {
    backgroundColor: "var(--bg)",
    color: "var(--accent)",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
  },
  audioStatusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    padding: "0.15rem 0.45rem",
    borderRadius: "12px"
  },
  audioStatusText: {
    fontSize: "0.62rem",
    fontWeight: "800",
    color: "var(--accent)",
    letterSpacing: "0.08em"
  },
  playerBody: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "0.6rem 0.6rem",
    gap: "0.5rem",
    justifyContent: "space-between",
    overflow: "hidden"
  },
  discSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.2rem 0"
  },
  circularSvg: {
    width: "120px",
    height: "120px",
    display: "block"
  },
  trackInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "0.1rem",
    overflow: "hidden"
  },
  trackTitle: {
    fontFamily: "var(--font-outfit), sans-serif",
    fontSize: "0.82rem",
    fontWeight: "700",
    color: "var(--text)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    width: "100%"
  },
  trackArtist: {
    fontSize: "0.68rem",
    color: "var(--muted)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    width: "100%"
  },
  timelineRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.45rem",
    width: "100%",
    padding: "0 0.2rem"
  },
  timeLabel: {
    fontSize: "0.62rem",
    fontWeight: "700",
    color: "var(--muted)",
    minWidth: "28px"
  },
  timelineSlider: {
    flex: 1,
    height: "3.5px",
    accentColor: "var(--accent)",
    cursor: "pointer"
  },
  controlsRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    paddingTop: "0.25rem",
    borderTop: "1px solid var(--card-border)"
  },
  controlBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.25rem",
    borderRadius: "6px",
    transition: "transform 0.15s ease"
  },
  playPauseBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "var(--accent)",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 10px rgba(16, 185, 129, 0.4)",
    transition: "transform 0.15s ease"
  },
  volumeGroup: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    marginLeft: "0.25rem"
  },
  muteBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: 0
  },
  volumeSlider: {
    width: "50px",
    height: "4px",
    accentColor: "var(--accent)",
    cursor: "pointer"
  },
  controllerFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.3rem",
    fontSize: "0.6rem",
    color: "var(--muted)",
    textAlign: "center"
  },
  visualsContent: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }
};
