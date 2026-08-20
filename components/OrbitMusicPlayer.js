"use client";

import { useMemo } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Sparkles, Music, Disc3, Radio } from "lucide-react";
import OrbitAnimation from "./OrbitAnimation";

function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
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
  onTogglePlay = () => {},
  onNextTrack = () => {},
  onPrevTrack = () => {},
  onVolumeChange = () => {},
  onToggleMute = () => {},
  onSeek = () => {}
}) {
  // Equalizer bar animation delays
  const equalizerBars = useMemo(() => [
    { delay: "0s" },
    { delay: "0.15s" },
    { delay: "0.3s" },
    { delay: "0.1s" },
    { delay: "0.25s" },
    { delay: "0.05s" },
    { delay: "0.2s" },
    { delay: "0.35s" },
    { delay: "0.18s" },
    { delay: "0.08s" },
  ], []);

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
          {/* Audio Visualizer & Rotating Vinyl Disc */}
          <div style={styles.discSection}>
            {/* Spinning Vinyl Disc */}
            <div
              className={`vinyl-record ${isPlaying ? "spinning" : "paused"}`}
              style={styles.vinylDisc}
            >
              <div style={styles.vinylGrooves}>
                <div style={styles.vinylCenterLabel}>
                  {currentTrack?.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentTrack.thumbnail}
                      alt="Cover"
                      style={styles.centerThumb}
                    />
                  ) : (
                    <Disc3 size={20} color="var(--accent)" />
                  )}
                </div>
              </div>
            </div>

            {/* Neon Sound Wave Equalizer Bars */}
            <div style={styles.equalizerContainer}>
              {equalizerBars.map((bar, idx) => (
                <div
                  key={idx}
                  className={`equalizer-bar ${isPlaying ? "active" : ""}`}
                  style={{
                    animationDelay: bar.delay,
                    height: isPlaying ? undefined : "25%"
                  }}
                />
              ))}
            </div>
          </div>

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
    gap: "1.1rem",
    padding: "0.3rem 0"
  },
  vinylDisc: {
    width: "62px",
    height: "62px",
    borderRadius: "50%",
    backgroundColor: "#111827",
    border: "2px solid #374151",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
    flexShrink: 0
  },
  vinylGrooves: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    border: "1px dashed rgba(255,255,255,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  vinylCenterLabel: {
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    backgroundColor: "var(--bg)",
    border: "1.5px solid var(--accent)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  centerThumb: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  equalizerContainer: {
    display: "flex",
    alignItems: "flex-end",
    gap: "3.5px",
    height: "32px",
    padding: "2px 0"
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
