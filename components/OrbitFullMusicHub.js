"use client";

import { useState, useMemo } from "react";
import { Search, Play, Music, Sparkles, Loader2, Disc3, Radio, Volume2, CheckCircle2, TrendingUp, Tv, ListMusic, Film } from "lucide-react";

const FEATURED_STATIONS = [
  { id: "lofi", label: "🎧 Lofi Chill", title: "Lofi Hip Hop Radio", artist: "Lofi Girl • 24/7 Chill Beats", query: "lofi hip hop radio beats to relax study to", color: "#6366f1" },
  { id: "synth", label: "⚡ Synthwave", title: "Synthwave Radio", artist: "Cyberpunk & Retro Wave", query: "synthwave radio chill beats", color: "#ec4899" },
  { id: "chill", label: "☕ Chillhop", title: "Chillhop Essentials", artist: "Chillhop Music • Study Beats", query: "chillhop music study beats", color: "#f59e0b" },
  { id: "hits", label: "🔥 Top Hits", title: "Global Top Hits 2026", artist: "Billboard & Spotify Charts", query: "global top hits playlist", color: "#ef4444" },
  { id: "ambient", label: "🚀 Space Ambient", title: "Deep Space Ambient", artist: "Cosmic Drone & Soundscapes", query: "deep space ambient chillout", color: "#10b981" },
  { id: "coding", label: "💻 Coding Focus", title: "Focus & Coding Music", artist: "Deep Work • Flow State", query: "coding music focus deep work", color: "#3b82f6" }
];

function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export default function OrbitFullMusicHub({
  currentTrack,
  isPlaying,
  currentTime = 0,
  duration = 0,
  onPlayTrack,
  onPlayStation,
  onPlayPlaylist,
  onSeek
}) {
  const [hubMode, setHubMode] = useState("video"); // 'video' | 'audio'
  const [filterCategory, setFilterCategory] = useState("all"); // 'all' | 'video' | 'playlist'
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedTerm, setSearchedTerm] = useState("");

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    const term = searchQuery.trim();
    setSearchedTerm(term);
    setIsSearching(true);

    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(term)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (err) {
      console.error("YouTube Hub search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredResults = useMemo(() => {
    if (filterCategory === "all") return searchResults;
    if (filterCategory === "playlist") return searchResults.filter(r => r.type === "playlist");
    if (filterCategory === "video") return searchResults.filter(r => r.type === "video");
    return searchResults;
  }, [searchResults, filterCategory]);

  const activeVideoEmbedUrl = useMemo(() => {
    if (!currentTrack) return null;
    if (currentTrack.playlistId) {
      return `https://www.youtube-nocookie.com/embed?listType=playlist&list=${currentTrack.playlistId}&autoplay=1`;
    }
    if (currentTrack.videoId) {
      return `https://www.youtube-nocookie.com/embed/${currentTrack.videoId}?autoplay=1`;
    }
    if (currentTrack.query) {
      const vidMatch = currentTrack.query.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/)|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
      if (vidMatch) return `https://www.youtube-nocookie.com/embed/${vidMatch[1]}?autoplay=1`;
    }
    return null;
  }, [currentTrack]);

  return (
    <div style={styles.container}>
      {/* Header Banner & Sub-Mode Switcher */}
      <div style={styles.banner}>
        <div style={styles.bannerLeft}>
          <div style={styles.modeSwitchGroup}>
            <button
              onClick={() => setHubMode("video")}
              style={{
                ...styles.modeSwitchBtn,
                ...(hubMode === "video" ? styles.modeSwitchBtnActive : {})
              }}
            >
              <Tv size={14} />
              <span>Watch Video</span>
            </button>
            <button
              onClick={() => setHubMode("audio")}
              style={{
                ...styles.modeSwitchBtn,
                ...(hubMode === "audio" ? styles.modeSwitchBtnActive : {})
              }}
            >
              <Music size={14} />
              <span>YT Music (Audio)</span>
            </button>
          </div>
        </div>

        {/* Currently Playing Status Pill & Seek Info */}
        {currentTrack?.title && (
          <div style={styles.nowPlayingPill}>
            <span
              className={isPlaying ? "orange-pulse-dot" : ""}
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: isPlaying ? "var(--accent)" : "var(--muted)",
                boxShadow: isPlaying ? "0 0 0 0 rgba(16, 185, 129, 0.7)" : "none"
              }}
            />
            <Volume2 size={14} color="var(--accent)" />
            <div style={styles.nowPlayingInfo}>
              <span style={styles.nowPlayingLabel}>NOW STREAMING</span>
              <span style={styles.nowPlayingTrack} title={currentTrack.title}>
                {currentTrack.title}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Search Bar */}
      <form onSubmit={handleSearchSubmit} style={styles.searchSection}>
        <div style={styles.searchBar}>
          <Search size={18} color="var(--muted)" style={styles.searchIcon} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search videos, songs, albums, playlists, or paste any YouTube/YT Music link..."
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchBtn} disabled={isSearching}>
            {isSearching ? <Loader2 size={16} className="spin" /> : "Search"}
          </button>
        </div>
      </form>

      {/* Content Body */}
      <div style={styles.contentScroll}>
        {/* VIDEO MODE: Embedded Screen when active */}
        {hubMode === "video" && (
          <div style={styles.videoPlayerSection}>
            {activeVideoEmbedUrl ? (
              <div style={styles.videoFrameContainer}>
                <iframe
                  src={activeVideoEmbedUrl}
                  title="YouTube Video Player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={styles.videoIframe}
                />
              </div>
            ) : (
              <div style={styles.videoPlaceholder}>
                <Film size={36} color="var(--muted)" />
                <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  Search or select any video below to watch it directly in this space.
                </span>
              </div>
            )}

            {/* Interactive Seek Timeline Bar */}
            {duration > 0 && (
              <div style={styles.timelineBar}>
                <span style={styles.timeText}>{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={e => onSeek && onSeek(Number(e.target.value))}
                  style={styles.seekSlider}
                  title={`Seek: ${formatTime(currentTime)} / ${formatTime(duration)}`}
                />
                <span style={styles.timeText}>{formatTime(duration)}</span>
              </div>
            )}
          </div>
        )}

        {/* Search Results Section */}
        {searchedTerm && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h3 style={styles.sectionTitle}>
                  Results for &quot;{searchedTerm}&quot;
                </h3>
                {filteredResults.length > 0 && (
                  <span style={styles.sectionBadge}>{filteredResults.length} found</span>
                )}
              </div>

              {/* Filter Pills */}
              <div style={styles.filterPills}>
                <button
                  onClick={() => setFilterCategory("all")}
                  style={{
                    ...styles.filterPill,
                    ...(filterCategory === "all" ? styles.filterPillActive : {})
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterCategory("playlist")}
                  style={{
                    ...styles.filterPill,
                    ...(filterCategory === "playlist" ? styles.filterPillActive : {})
                  }}
                >
                  📑 Playlists & Albums
                </button>
                <button
                  onClick={() => setFilterCategory("video")}
                  style={{
                    ...styles.filterPill,
                    ...(filterCategory === "video" ? styles.filterPillActive : {})
                  }}
                >
                  🎬 Videos & Songs
                </button>
              </div>
            </div>

            {isSearching ? (
              <div style={styles.loadingBox}>
                <Loader2 size={28} color="var(--accent)" className="spin" />
                <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Finding tracks on YouTube...</span>
              </div>
            ) : filteredResults.length === 0 ? (
              <div style={styles.emptyBox}>
                <Radio size={32} color="var(--muted)" />
                <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>No results found for &quot;{searchedTerm}&quot; in this category.</p>
              </div>
            ) : (
              <div style={styles.resultsGrid}>
                {filteredResults.map((item, idx) => {
                  const isPlaylist = item.type === "playlist";
                  const isCurrent = isPlaylist
                    ? currentTrack?.playlistId === item.playlistId
                    : currentTrack?.videoId === item.videoId;

                  return (
                    <div
                      key={item.playlistId || item.videoId || idx}
                      onClick={() => isPlaylist ? onPlayPlaylist(item) : onPlayTrack(item)}
                      style={{
                        ...styles.trackCard,
                        border: isCurrent ? "1px solid var(--accent)" : "1px solid var(--card-border)",
                        backgroundColor: isCurrent ? "rgba(16, 185, 129, 0.08)" : "var(--card-bg)"
                      }}
                      className="smooth-hover"
                    >
                      <div style={styles.trackThumbWrapper}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.thumbnail || `https://i.ytimg.com/vi/${item.videoId || "default"}/hqdefault.jpg`}
                          alt={item.title}
                          style={styles.trackThumb}
                        />
                        {isPlaylist ? (
                          <span style={styles.playlistBadge}>
                            <ListMusic size={10} />
                            <span>{item.videoCount || "Playlist"}</span>
                          </span>
                        ) : item.duration ? (
                          <span style={styles.durationBadge}>{item.duration}</span>
                        ) : null}

                        <div style={styles.thumbPlayOverlay}>
                          <Play size={20} fill="#fff" color="#fff" />
                        </div>
                      </div>

                      <div style={styles.trackMeta}>
                        <div style={styles.trackTitle} title={item.title}>
                          {item.title}
                        </div>
                        <div style={styles.trackChannel} title={item.channel}>
                          {isPlaylist && "📑 Playlist • "}{item.channel}
                        </div>
                      </div>

                      <button
                        style={{
                          ...styles.playCardBtn,
                          backgroundColor: isCurrent ? "var(--accent)" : "rgba(255,255,255,0.1)",
                          color: isCurrent ? "#fff" : "var(--text)"
                        }}
                        title={isPlaylist ? "Play Playlist" : "Play Track"}
                      >
                        {isCurrent && isPlaying ? <Disc3 size={16} className="spin" /> : <Play size={16} fill="currentColor" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Featured Vibe Stations */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <TrendingUp size={18} color="var(--accent)" />
              <h3 style={styles.sectionTitle}>Featured Vibes & Radio Stations</h3>
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Click any station to stream 24/7</span>
          </div>

          <div style={styles.stationsGrid}>
            {FEATURED_STATIONS.map(st => {
              const isCurrent = currentTrack?.query === st.query;
              return (
                <div
                  key={st.id}
                  onClick={() => onPlayStation(st)}
                  style={{
                    ...styles.stationCard,
                    border: isCurrent ? "1px solid var(--accent)" : "1px solid var(--card-border)"
                  }}
                  className="smooth-hover"
                >
                  <div style={{ ...styles.stationIconBox, backgroundColor: st.color }}>
                    <Sparkles size={20} color="#fff" />
                  </div>
                  <div style={styles.stationInfo}>
                    <div style={styles.stationLabel}>{st.label}</div>
                    <div style={styles.stationSub}>{st.artist}</div>
                  </div>
                  {isCurrent && (
                    <div style={styles.activeCheck}>
                      <CheckCircle2 size={16} color="var(--accent)" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    width: "100%",
    height: "100%",
    minHeight: 0,
    backgroundColor: "var(--bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
  },
  banner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.6rem 1rem",
    backgroundColor: "var(--card-bg)",
    borderBottom: "1px solid var(--card-border)",
    flexWrap: "wrap",
    gap: "0.5rem"
  },
  bannerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  },
  modeSwitchGroup: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "var(--bg)",
    border: "1px solid var(--card-border)",
    padding: "0.15rem",
    borderRadius: "8px",
    gap: "0.2rem"
  },
  modeSwitchBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.3rem 0.65rem",
    fontSize: "0.75rem",
    fontWeight: "700",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "transparent",
    color: "var(--muted)",
    cursor: "pointer",
    transition: "all 0.15s ease"
  },
  modeSwitchBtnActive: {
    backgroundColor: "var(--card-bg)",
    color: "var(--accent)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
  },
  nowPlayingPill: {
    display: "flex",
    alignItems: "center",
    gap: "0.45rem",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    padding: "0.25rem 0.65rem",
    borderRadius: "20px",
    maxWidth: "280px"
  },
  nowPlayingInfo: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  nowPlayingLabel: {
    fontSize: "0.55rem",
    fontWeight: "800",
    letterSpacing: "0.08em",
    color: "var(--accent)"
  },
  nowPlayingTrack: {
    fontSize: "0.7rem",
    fontWeight: "700",
    color: "var(--text)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  searchSection: {
    padding: "0.5rem 1rem",
    backgroundColor: "var(--card-bg)",
    borderBottom: "1px solid var(--card-border)"
  },
  searchBar: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  searchIcon: {
    position: "absolute",
    left: "0.85rem",
    pointerEvents: "none"
  },
  searchInput: {
    width: "100%",
    backgroundColor: "var(--bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "8px",
    padding: "0.55rem 6.5rem 0.55rem 2.4rem",
    fontSize: "0.85rem",
    color: "var(--text)",
    outline: "none"
  },
  searchBtn: {
    position: "absolute",
    right: "0.35rem",
    backgroundColor: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "0.4rem 0.9rem",
    fontSize: "0.78rem",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "70px"
  },
  contentScroll: {
    flex: 1,
    overflowY: "auto",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem"
  },
  videoPlayerSection: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    backgroundColor: "var(--card-bg)",
    padding: "0.75rem",
    borderRadius: "10px",
    border: "1px solid var(--card-border)"
  },
  videoFrameContainer: {
    width: "100%",
    aspectRatio: "16 / 9",
    maxHeight: "360px",
    backgroundColor: "#000",
    borderRadius: "8px",
    overflow: "hidden"
  },
  videoIframe: {
    width: "100%",
    height: "100%",
    border: "none",
    display: "block"
  },
  videoPlaceholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "2rem",
    border: "1px dashed var(--card-border)",
    borderRadius: "8px",
    textAlign: "center"
  },
  timelineBar: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0.2rem 0.4rem"
  },
  timeText: {
    fontSize: "0.72rem",
    fontWeight: "700",
    color: "var(--muted)",
    minWidth: "35px"
  },
  seekSlider: {
    flex: 1,
    height: "4px",
    accentColor: "var(--accent)",
    cursor: "pointer"
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "0.65rem"
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "0.5rem"
  },
  sectionTitle: {
    fontSize: "0.9rem",
    fontWeight: "700",
    color: "var(--text)",
    margin: 0
  },
  sectionBadge: {
    fontSize: "0.68rem",
    fontWeight: "600",
    color: "var(--accent)",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    padding: "0.1rem 0.45rem",
    borderRadius: "8px"
  },
  filterPills: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem"
  },
  filterPill: {
    padding: "0.2rem 0.5rem",
    fontSize: "0.68rem",
    fontWeight: "600",
    borderRadius: "12px",
    border: "1px solid var(--card-border)",
    backgroundColor: "var(--card-bg)",
    color: "var(--muted)",
    cursor: "pointer",
    transition: "all 0.15s ease"
  },
  filterPillActive: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderColor: "var(--accent)",
    color: "var(--accent)",
    fontWeight: "700"
  },
  loadingBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.6rem",
    padding: "2rem"
  },
  emptyBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.4rem",
    padding: "1.5rem",
    textAlign: "center"
  },
  resultsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "0.65rem"
  },
  trackCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.65rem",
    padding: "0.5rem",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.15s ease"
  },
  trackThumbWrapper: {
    position: "relative",
    width: "68px",
    height: "44px",
    borderRadius: "6px",
    overflow: "hidden",
    backgroundColor: "#000",
    flexShrink: 0
  },
  trackThumb: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  playlistBadge: {
    position: "absolute",
    bottom: "2px",
    right: "2px",
    backgroundColor: "rgba(0,0,0,0.85)",
    color: "#38bdf8",
    fontSize: "0.55rem",
    fontWeight: "700",
    padding: "1px 3px",
    borderRadius: "2px",
    display: "flex",
    alignItems: "center",
    gap: "2px"
  },
  durationBadge: {
    position: "absolute",
    bottom: "2px",
    right: "2px",
    backgroundColor: "rgba(0,0,0,0.8)",
    color: "#fff",
    fontSize: "0.55rem",
    fontWeight: "700",
    padding: "1px 3px",
    borderRadius: "2px"
  },
  thumbPlayOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
    transition: "opacity 0.2s"
  },
  trackMeta: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.15rem",
    overflow: "hidden"
  },
  trackTitle: {
    fontSize: "0.78rem",
    fontWeight: "700",
    color: "var(--text)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  trackChannel: {
    fontSize: "0.66rem",
    color: "var(--muted)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  playCardBtn: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    transition: "all 0.15s ease"
  },
  stationsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "0.65rem"
  },
  stationCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0.6rem",
    borderRadius: "8px",
    backgroundColor: "var(--card-bg)",
    cursor: "pointer",
    transition: "all 0.15s ease",
    position: "relative"
  },
  stationIconBox: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  stationInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "0.1rem",
    overflow: "hidden"
  },
  stationLabel: {
    fontSize: "0.78rem",
    fontWeight: "700",
    color: "var(--text)"
  },
  stationSub: {
    fontSize: "0.62rem",
    color: "var(--muted)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  activeCheck: {
    position: "absolute",
    top: "6px",
    right: "6px"
  }
};
