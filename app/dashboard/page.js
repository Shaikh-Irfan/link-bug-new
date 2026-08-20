"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Search, PlusCircle, Calendar, FileText, ExternalLink, Edit2, Copy, Check, Save, Trash2, MessageCircle, Flag, Filter, AlertTriangle, Layout, Moon, Sun, Globe, Music as MusicIcon, Ticket as TicketIcon } from "lucide-react";
import ColumnCard from "@/components/ColumnCard";
import AddTicketModal from "@/components/AddTicketModal";
import TodayUpdateModal from "@/components/TodayUpdateModal";
import ReportModal from "@/components/ReportModal";
import UpdateMasterModal from "@/components/UpdateMasterModal";
import OrbitBrowser from "@/components/OrbitBrowser";
import OrbitFullMusicHub from "@/components/OrbitFullMusicHub";

const YouTubeIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

// 8 Columns definition
const COLUMN_KEYS = [
  "chatCountUpdated", "newIssuesChecked", "checkedFilters",
  "callsAnswered", "callsUnanswered", "issuesResolved",
  "tagsAssigned", "aiCount"
];

const COLUMN_TITLES = {
  chatCountUpdated: "Chat Count Updated",
  newIssuesChecked: "New Issues Checked",
  checkedFilters: "Checked Filters",
  callsAnswered: "Calls Answered",
  callsUnanswered: "Calls Unanswered",
  issuesResolved: "Issues Resolved",
  tagsAssigned: "Tags Assigned",
  aiCount: "AI Count"
};

const TicketItem = ({ ticket, onEdit, onDelete, onEscalate }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const hasComment = Boolean(ticket.comment && ticket.comment.trim() !== "");

  const [dd, mm, yyyy] = (ticket.date || "").split('/');
  let showTagsAndPriority = true;
  if (dd && mm && yyyy) {
    const tDate = new Date(yyyy, parseInt(mm) - 1, dd);
    const cutoffDate = new Date(2026, 5, 1); // June 1, 2026
    if (tDate < cutoffDate) showTagsAndPriority = false;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(ticket.clickup_url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      <div
        style={{...styles.ticketCard, position: 'relative', zIndex: isExpanded ? 10 : 1, border: ticket.escalated ? '1px solid #d97706' : '1px solid var(--card-border)'}}
        className="smooth-hover"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", overflow: "hidden" }}>
          <div style={{ ...styles.ticketHeader, alignItems: "flex-start" }}>
            <span style={{
              marginTop: "0.2rem",
              fontFamily: "var(--font-body), monospace",
              fontWeight: "600",
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--muted)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              {ticket.created_by} • {ticket.date}
              <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEscalate(ticket.id, ticket.escalated);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center",
                    color: ticket.escalated ? '#d97706' : 'var(--muted)',
                    opacity: isHovered || ticket.escalated ? 1 : 0,
                    transition: 'opacity 0.2s, color 0.2s'
                  }}
                  title={ticket.escalated ? "Issue not resolved (Click to remove)" : "Mark issue not resolved"}
                >
                  <AlertTriangle size={14} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Are you sure you want to delete this ticket?")) {
                      onDelete(ticket.id);
                    }
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center"
                  }}
                  title="Delete Ticket"
                >
                  <Trash2 size={12} color="#e74c3c" />
                </button>
              </div>
            </span>
            <span style={{
              ...styles.statusBadge,
              backgroundColor: ticket.status === 'Done' ? 'rgba(5, 150, 105, 0.1)' : ticket.status === 'Active' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(217, 119, 6, 0.1)',
              color: ticket.status === 'Done' ? '#059669' : ticket.status === 'Active' ? '#2563eb' : '#d97706'
            }}>
              {ticket.status}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.25rem" }}>
            <h3 style={styles.ticketTitle}>{ticket.title}</h3>
            <div style={{
              display: "flex",
              flexDirection: "row",
              gap: "0.5rem",
              opacity: isHovered ? 1 : 0,
              pointerEvents: isHovered ? "auto" : "none",
              transition: "opacity 0.2s"
            }}>
              <button onClick={onEdit} style={styles.iconBtn} title="Edit Ticket">
                <Edit2 size={14} color="var(--text)" />
              </button>
              <a href={ticket.clickup_url} target="_blank" rel="noreferrer" style={styles.iconBtn} title="Open Link in New Tab">
                <ExternalLink size={14} color="var(--text)" />
              </a>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
            <span style={{ ...styles.ticketLinkText, color: "var(--muted)" }}>
              {ticket.clickup_url}
            </span>
            <button onClick={handleCopy} style={styles.copyBtn} title="Copy Link">
              {isCopied ? <Check size={12} color="#2ecc71" /> : <Copy size={12} color="var(--muted)" />}
            </button>

            {showTagsAndPriority && ticket.priority && (
              <div title={`Priority: ${ticket.priority.name}`} style={{ display: "flex", alignItems: "center", marginLeft: "0.25rem" }}>
                <Flag size={14} color={ticket.priority.color} fill={ticket.priority.color} />
              </div>
            )}
            
            {showTagsAndPriority && ticket.tags && ticket.tags.length > 0 && (
              <div style={{ display: "flex", gap: "0.25rem", marginLeft: "0.25rem", flexWrap: "wrap" }}>
                {ticket.tags.map((tag, i) => {
                  const isString = typeof tag === 'string';
                  const tagName = isString ? tag : tag.name || "Tag";
                  const tagBg = isString ? 'var(--accent)' : (tag.bg || 'var(--card-border)');
                  
                  let tagFg = isString ? '#FFFFFF' : (tag.fg || 'var(--text)');
                  
                  // ClickUp sometimes returns identical foreground and background colors
                  if (tag.bg && tag.fg && tag.bg.toLowerCase() === tag.fg.toLowerCase()) {
                    const hex = tag.bg.replace('#', '');
                    const r = parseInt(hex.substr(0, 2), 16) || 0;
                    const g = parseInt(hex.substr(2, 2), 16) || 0;
                    const b = parseInt(hex.substr(4, 2), 16) || 0;
                    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
                    tagFg = yiq >= 128 ? '#000000' : '#FFFFFF';
                  }
                  
                  return (
                    <span key={i} style={{
                      backgroundColor: tagBg,
                      color: tagFg,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      display: 'inline-block'
                    }}>
                      {tagName}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Comment Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasComment) setIsExpanded(!isExpanded);
          }}
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            background: hasComment && isExpanded ? 'rgba(52, 152, 219, 0.1)' : 'none',
            border: 'none',
            cursor: hasComment ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            borderRadius: '50%',
            transition: 'all 0.2s',
            opacity: hasComment ? 1 : 0.3
          }}
          title={hasComment ? (isExpanded ? "Hide comment" : "Show comment") : "No comments"}
        >
          <MessageCircle size={16} color={hasComment ? (isExpanded ? '#3498db' : 'var(--text)') : 'var(--muted)'} />
        </button>

        {/* Expanded Comment Section */}
        {isExpanded && hasComment && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderLeft: '3px solid #3498db',
            borderRadius: '0 4px 4px 0',
            fontSize: '0.85rem',
            color: 'var(--muted)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: '1.5'
          }}>
            <strong style={{ color: 'var(--text)' }}>Comment:</strong><br/>
            {ticket.comment}
          </div>
        )}
      </div>

      {isExpanded && (
        <div 
          onClick={() => setIsExpanded(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 5
          }}
        />
      )}
    </>
  );
};

const toDateInput = (ddmmyyyy) => {
  if (!ddmmyyyy || ddmmyyyy === "All") return "";
  const parts = ddmmyyyy.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return "";
};

const fromDateInput = (yyyymmdd) => {
  if (!yyyymmdd) return "";
  const parts = yyyymmdd.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return "";
};

function DashboardContent() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      setCurrentUser(urlParams.get("user") || "Unknown");
    }
  }, []);

  // System Date
  const today = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
  const [selectedDate, setSelectedDate] = useState(today);
  
  const isReadOnly = useMemo(() => {
    if (!selectedDate || !today) return false;
    if (selectedDate === today) return false;
    
    const [sDay, sMonth, sYear] = selectedDate.split('/');
    const sDateObj = new Date(sYear, sMonth - 1, sDay);
    
    const [tDay, tMonth, tYear] = today.split('/');
    const tDateObj = new Date(tYear, tMonth - 1, tDay);
    
    const diffTime = tDateObj.getTime() - sDateObj.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 3;
  }, [selectedDate, today]);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem('orbit_theme');
      if (savedTheme === 'dark') setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('orbit_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('orbit_theme', 'light');
    }
  }, [isDarkMode]);

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState("idle"); // 'idle' | 'syncing' | 'done'
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [dailyLogs, setDailyLogs] = useState({
    chatCountUpdated: [], newIssuesChecked: [], checkedFilters: [],
    callsAnswered: [], callsUnanswered: [], issuesResolved: [],
    tagsAssigned: [], aiCount: []
  });
  const [aiDate, setAiDate] = useState("");

  const [allTickets, setAllTickets] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [ticketDateFilter, setTicketDateFilter] = useState("All");
  const [ticketDateMode, setTicketDateMode] = useState("Single"); // "Single" | "Range"
  const [ticketStartDateFilter, setTicketStartDateFilter] = useState("");
  const [ticketEndDateFilter, setTicketEndDateFilter] = useState("");
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState("All");
  const [ticketTagFilter, setTicketTagFilter] = useState("All");
  const [ticketEscalatedFilter, setTicketEscalatedFilter] = useState("All");
  const [ticketCreatorFilter, setTicketCreatorFilter] = useState("All");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("All");

  const [showDailyTracking, setShowDailyTracking] = useState(true);

  const [tempFilters, setTempFilters] = useState(null);

  const handleOpenFilterMenu = () => {
    setTempFilters({
      ticketDateMode,
      ticketDateFilter,
      ticketStartDateFilter,
      ticketEndDateFilter,
      ticketPriorityFilter,
      ticketTagFilter,
      ticketEscalatedFilter
    });
    setIsFilterMenuOpen(true);
  };

  const handleApplyFilters = () => {
    if (!tempFilters) return;
    setTicketDateMode(tempFilters.ticketDateMode);
    setTicketDateFilter(tempFilters.ticketDateFilter);
    setTicketStartDateFilter(tempFilters.ticketStartDateFilter);
    setTicketEndDateFilter(tempFilters.ticketEndDateFilter);
    setTicketPriorityFilter(tempFilters.ticketPriorityFilter);
    setTicketTagFilter(tempFilters.ticketTagFilter);
    setTicketEscalatedFilter(tempFilters.ticketEscalatedFilter);
    setIsFilterMenuOpen(false);
  };

  const handleCancelFilters = () => {
    setIsFilterMenuOpen(false);
  };

  const [isTicketModalOpen, setTicketModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [isCreatingBlock, setIsCreatingBlock] = useState(false);
  const [isTodayTableMissing, setIsTodayTableMissing] = useState(false);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [isMasterDateMissing, setIsMasterDateMissing] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [atmSearchQuery, setAtmSearchQuery] = useState("");

  // Right Panel Workspace Mode ('tickets' | 'browser' | 'youtube')
  const [rightPanelMode, setRightPanelMode] = useState("tickets");

  // Persistent Global Background Audio State
  const [musicViewMode, setMusicViewMode] = useState("music"); // 'music' | 'visuals'
  const [currentTrack, setCurrentTrack] = useState({
    title: "Lofi Hip Hop Radio",
    artist: "Lofi Girl • Chill Beats",
    thumbnail: "",
    videoId: "jfKfPfyJRdk",
    query: "lofi hip hop radio beats to relax study to"
  });
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(240);
  const audioIframeRef = useRef(null);

  // Playback timer tracker
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentTime(prev => {
        if (duration > 0 && prev >= duration) return 0;
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, duration]);

  // Load saved music state
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedQuery = localStorage.getItem("orbit_music_query");
        const savedTitle = localStorage.getItem("orbit_music_title");
        const savedArtist = localStorage.getItem("orbit_music_artist");
        const savedThumb = localStorage.getItem("orbit_music_thumb");
        if (savedQuery) {
          setCurrentTrack({
            title: savedTitle || "Lofi Hip Hop Radio",
            artist: savedArtist || "Lofi Girl • Chill Beats",
            thumbnail: savedThumb || "",
            query: savedQuery
          });
        }
      } catch (e) {}
    }
  }, []);

  const sendAudioCommand = (func, args = []) => {
    if (audioIframeRef.current && audioIframeRef.current.contentWindow) {
      audioIframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func, args }),
        "*"
      );
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      sendAudioCommand("pauseVideo");
      setIsPlaying(false);
    } else {
      sendAudioCommand("playVideo");
      setIsPlaying(true);
    }
  };

  const handleNextTrack = () => {
    sendAudioCommand("nextVideo");
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handlePrevTrack = () => {
    sendAudioCommand("previousVideo");
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleSeek = (newSec) => {
    setCurrentTime(newSec);
    sendAudioCommand("seekTo", [newSec, true]);
  };

  const handleVolumeChange = (newVal) => {
    setVolume(newVal);
    if (isMuted && newVal > 0) setIsMuted(false);
    sendAudioCommand("setVolume", [newVal]);
    if (newVal === 0) {
      sendAudioCommand("mute");
    } else {
      sendAudioCommand("unMute");
    }
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      sendAudioCommand("unMute");
      sendAudioCommand("setVolume", [volume || 50]);
    } else {
      setIsMuted(true);
      sendAudioCommand("mute");
    }
  };

  const parseDurationSec = (durStr) => {
    if (!durStr) return 210;
    const parts = durStr.split(":").map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 210;
  };

  const handlePlayTrack = (track) => {
    const vidUrl = `https://www.youtube.com/watch?v=${track.videoId}`;
    const durSec = parseDurationSec(track.duration);
    setCurrentTrack({
      title: track.title,
      artist: track.channel || "YouTube Audio",
      thumbnail: track.thumbnail || "",
      videoId: track.videoId,
      query: vidUrl
    });
    setCurrentTime(0);
    setDuration(durSec);
    setIsPlaying(true);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("orbit_music_query", vidUrl);
        localStorage.setItem("orbit_music_title", track.title);
        localStorage.setItem("orbit_music_artist", track.channel || "YouTube Audio");
        if (track.thumbnail) localStorage.setItem("orbit_music_thumb", track.thumbnail);
      } catch (e) {}
    }
  };

  const handlePlayPlaylist = (playlist) => {
    const plUrl = `https://www.youtube.com/playlist?list=${playlist.playlistId}`;
    setCurrentTrack({
      title: playlist.title,
      artist: playlist.channel || "YouTube Playlist",
      thumbnail: playlist.thumbnail || "",
      playlistId: playlist.playlistId,
      query: plUrl
    });
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("orbit_music_query", plUrl);
        localStorage.setItem("orbit_music_title", playlist.title);
        localStorage.setItem("orbit_music_artist", playlist.channel || "YouTube Playlist");
        if (playlist.thumbnail) localStorage.setItem("orbit_music_thumb", playlist.thumbnail);
      } catch (e) {}
    }
  };

  const handlePlayStation = (station) => {
    setCurrentTrack({
      title: station.title,
      artist: station.artist,
      thumbnail: "",
      videoId: "",
      query: station.query
    });
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("orbit_music_query", station.query);
        localStorage.setItem("orbit_music_title", station.title);
        localStorage.setItem("orbit_music_artist", station.artist);
        localStorage.removeItem("orbit_music_thumb");
      } catch (e) {}
    }
  };

  const audioEmbedUrl = useMemo(() => {
    if (currentTrack?.playlistId) {
      return `https://www.youtube-nocookie.com/embed?listType=playlist&list=${currentTrack.playlistId}&autoplay=1&enablejsapi=1`;
    }
    const q = currentTrack?.query || "";
    if (!q || !q.trim()) return null;
    const str = q.trim();

    const listMatch = str.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (listMatch && !str.includes("watch?v=")) {
      return `https://www.youtube-nocookie.com/embed?listType=playlist&list=${listMatch[1]}&autoplay=1&enablejsapi=1`;
    }

    const videoMatch = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/)|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
    if (videoMatch) {
      if (listMatch) {
        return `https://www.youtube-nocookie.com/embed/${videoMatch[1]}?list=${listMatch[1]}&autoplay=1&enablejsapi=1`;
      }
      return `https://www.youtube-nocookie.com/embed/${videoMatch[1]}?autoplay=1&enablejsapi=1`;
    }

    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
      return `https://www.youtube-nocookie.com/embed/${str}?autoplay=1&enablejsapi=1`;
    }

    return `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(str)}&autoplay=1&enablejsapi=1`;
  }, [currentTrack]);

  const musicProps = {
    viewMode: musicViewMode,
    onViewModeChange: setMusicViewMode,
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    onTogglePlay: handleTogglePlay,
    onNextTrack: handleNextTrack,
    onPrevTrack: handlePrevTrack,
    onVolumeChange: handleVolumeChange,
    onToggleMute: handleToggleMute,
    onSeek: handleSeek
  };

  // Fetch Daily Logs
  useEffect(() => {
    if (!currentUser) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    const safetyTimerId = setTimeout(() => setIsLoading(false), 32000);

    async function fetchLogs() {
      try {
        const logsRes = await fetch(`/api/records?user=${currentUser}&date=${encodeURIComponent(selectedDate)}`, { signal: controller.signal });
        if (logsRes.ok) {
          const data = await logsRes.json();

          if (selectedDate === today) {
            if (data.tableExists === false) {
              setIsTodayTableMissing(true);
              if (data.lastAvailableDate) {
                setSelectedDate(data.lastAvailableDate);
                return;
              }
            } else {
              setIsTodayTableMissing(false);
            }
          }

          if (data.records) {
            setDailyLogs(data.records);
            setAiDate(data.records.aiDate || "");
          }
        }
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Failed to fetch daily logs:", error);
      } finally {
        clearTimeout(timeoutId);
        clearTimeout(safetyTimerId);
        setIsLoading(false);
      }
    }
    fetchLogs();
    
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
      clearTimeout(safetyTimerId);
    };
  }, [currentUser, selectedDate, today]);

  // Fetch Global Tickets
  useEffect(() => {
    if (!currentUser) return;

    let pollIntervalId;
    let isMounted = true;

    async function fetchTickets(monthsBack = 2) {
      const controller = new AbortController();
      try {
        const ticketsRes = await fetch('/api/tickets', { signal: controller.signal });
        if (ticketsRes.ok) {
          const data = await ticketsRes.json();
          if (data.tickets && isMounted) {
            setAllTickets(data.tickets);
            
            // Trigger ClickUp sync in the background
            setSyncStatus("syncing");
            fetch('/api/clickup/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tickets: data.tickets, monthsBack })
            })
            .then(res => res.json())
            .then(syncData => {
              if (syncData.tickets && isMounted) setAllTickets(syncData.tickets);
            })
            .catch(err => console.error("Sync error:", err))
            .finally(() => {
              if (isMounted) {
                setSyncStatus("done");
                setTimeout(() => { if (isMounted) setSyncStatus("idle"); }, 5000); // Hide checkmark after 5s
              }
            });
          }
        }
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Failed to fetch global tickets:", error);
      }
    }
    
    // Initial fetch (2 months back on hard refresh)
    fetchTickets(2);

    // Poll every 5 minutes (1 month back to save resources)
    pollIntervalId = setInterval(() => {
      fetchTickets(1);
    }, 5 * 60 * 1000);
    
    return () => {
      isMounted = false;
      clearInterval(pollIntervalId);
    };
  }, [currentUser]);

  // Handlers
  const handleAddItems = async (columnKey, newItems, extraData = {}) => {
    // Optimistic UI update
    setDailyLogs(prev => ({
      ...prev,
      [columnKey]: [...prev[columnKey], ...newItems]
    }));

    // API Call
    try {
      await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: currentUser,
          date: selectedDate,
          columnKey,
          items: newItems,
          ...extraData
        })
      });

      // If we added AI count, re-fetch to get updated structure
      if (columnKey === 'aiCount') {
        const logsRes = await fetch(`/api/records?user=${currentUser}&date=${encodeURIComponent(selectedDate)}`);
        if (logsRes.ok) {
          const data = await logsRes.json();
          if (data.records) {
            setDailyLogs(data.records);
            setAiDate(data.records.aiDate || "");
          }
        }
      }
    } catch (error) {
      console.error("Failed to post records:", error);
    }
  };

  const handleUpdateAiDate = async (newDate) => {
    setAiDate(newDate); // optimistic

    try {
      await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: currentUser,
          date: selectedDate,
          columnKey: 'aiCount',
          action: 'updateAiDate',
          newDate
        })
      });
    } catch (error) {
      console.error("Failed to update AI date:", error);
    }
  };

  const handleCreateNewBlock = async () => {
    setIsCreatingBlock(true);
    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createNewBlock',
          user: currentUser,
          date: today
        })
      });
      const data = await res.json();
      if (data.success && data.newDate) {
        setSelectedDate(data.newDate);
      }
    } catch (e) {
      console.error(e);
    }
    setIsCreatingBlock(false);
  };

  const masterMetrics = useMemo(() => {
    const ticketsCreatedUpdated = allTickets.filter(t => t.created_by === currentUser && t.date === selectedDate).length;
    return {
      chatCount: dailyLogs.chatCountUpdated?.length || 0,
      callsAnswered: dailyLogs.callsAnswered?.length || 0,
      callsUnanswered: dailyLogs.callsUnanswered?.length || 0,
      newIssuesChecked: dailyLogs.newIssuesChecked?.length || 0,
      checkedIssuesOtherFilters: dailyLogs.checkedFilters?.length || 0,
      ticketsCreatedUpdated,
      issuesSolved: dailyLogs.issuesResolved?.length || 0,
      tagsAssigned: dailyLogs.tagsAssigned?.length || 0
    };
  }, [dailyLogs, allTickets, currentUser, selectedDate]);

  const handleUpdateMasterSubmit = async (finalMetrics) => {
    try {
      const res = await fetch('/api/master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: currentUser,
          date: selectedDate,
          metrics: finalMetrics,
          additionalWork: finalMetrics.additionalWork
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.isDateMissing) {
          setIsMasterDateMissing(true);
        } else {
          alert("Error updating master sheet: " + data.error);
        }
        return false;
      } else {
        alert("Master sheet updated successfully!");
        return true;
      }
    } catch (e) {
      console.error(e);
      alert("Failed to update master sheet");
      return false;
    }
  };

  const handleCreateMasterColumn = async () => {
    try {
      const res = await fetch('/api/master/create-column', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Column for ${selectedDate} created successfully!`);
        setIsMasterDateMissing(false);
      } else {
        alert("Error creating column: " + data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to create column.");
    }
  };

  const handleDeleteItems = async (columnKey, indicesToDelete) => {
    // Optimistic UI update
    setDailyLogs(prev => {
      const remainingItems = prev[columnKey].filter((item, idx) => {
        return !indicesToDelete.includes(idx);
      });
      return {
        ...prev,
        [columnKey]: remainingItems
      };
    });

    // API Call
    try {
      await fetch('/api/records', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: currentUser,
          date: selectedDate,
          columnKey,
          indicesToDelete
        })
      });
    } catch (error) {
      console.error("Failed to delete records:", error);
    }
  };

  const handleEditItem = async (columnKey, indexToEdit, newValue) => {
    // Optimistic UI update
    setDailyLogs(prev => {
      const updatedItems = [...prev[columnKey]];
      const oldItem = updatedItems[indexToEdit];
      if (typeof oldItem === 'object') {
        updatedItems[indexToEdit] = { ...oldItem, id: newValue };
      } else {
        updatedItems[indexToEdit] = newValue;
      }
      return {
        ...prev,
        [columnKey]: updatedItems
      };
    });

    // API Call
    try {
      await fetch('/api/records', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: currentUser,
          date: selectedDate,
          columnKey,
          indexToEdit,
          newValue
        })
      });
    } catch (error) {
      console.error("Failed to edit record:", error);
    }
  };

  const handleCreateTicket = async (ticketData) => {
    if (ticketData.id !== undefined) {
      // Editing existing ticket
      try {
        await fetch('/api/tickets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ticketData)
        });

        // Optimistic update
        setAllTickets(prev => prev.map(t => t.id === ticketData.id ? ticketData : t));
        
        // Re-fetch to sync IDs
        const ticketsRes = await fetch('/api/tickets');
        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();
          setAllTickets(ticketsData.tickets);
        }
      } catch (error) {
        console.error("Failed to update ticket:", error);
      }
    } else {
      // Creating new ticket
      const newTicket = {
        id: Date.now(), // optimistic ID
        ...ticketData
      };

      // Optimistic UI update
      setAllTickets(prev => [newTicket, ...prev]);

      // API Call
      try {
        await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTicket)
        });
        
        // Re-fetch to sync IDs
        const ticketsRes = await fetch('/api/tickets');
        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();
          setAllTickets(ticketsData.tickets);
        }
      } catch (error) {
        console.error("Failed to post ticket:", error);
      }
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    // Optimistic delete
    setAllTickets(prev => prev.filter(t => t.id !== ticketId));
    try {
      await fetch(`/api/tickets?id=${ticketId}`, {
        method: 'DELETE'
      });
      
      // Re-fetch to sync IDs
      const ticketsRes = await fetch('/api/tickets');
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        setAllTickets(ticketsData.tickets);
      }
    } catch (e) {
      console.error("Failed to delete ticket:", e);
    }
  };

  const handleEscalateTicket = async (id, currentEscalated) => {
    const newEscalated = !currentEscalated;
    setAllTickets(prev => prev.map(t => t.id === id ? { ...t, escalated: newEscalated } : t));
    
    try {
      const res = await fetch('/api/tickets/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, escalated: newEscalated })
      });
      if (!res.ok) {
        throw new Error("Failed to escalate");
      }
    } catch (error) {
      console.error(error);
      setAllTickets(prev => prev.map(t => t.id === id ? { ...t, escalated: currentEscalated } : t));
      alert("Failed to update ticket escalation status.");
    }
  };

  // Derived unique creators for filter dropdown
  const uniqueCreators = useMemo(() => {
    const creators = new Set(allTickets.map(t => t.created_by).filter(Boolean));
    return Array.from(creators).sort();
  }, [allTickets]);

  const uniquePriorities = useMemo(() => {
    const priorities = new Set(allTickets.map(t => t.priority?.name).filter(Boolean));
    return Array.from(priorities).sort();
  }, [allTickets]);

  const uniqueTags = useMemo(() => {
    const tags = new Set();
    allTickets.forEach(t => {
      if (t.tags) {
        t.tags.forEach(tag => {
          const tagName = typeof tag === 'string' ? tag : tag.name;
          if (tagName) tags.add(tagName);
        });
      }
    });
    return Array.from(tags).sort();
  }, [allTickets]);

  // Derived tickets before applying status filter
  const ticketsBeforeStatusFilter = useMemo(() => {
    return allTickets.filter(t => {
      const titleStr = String(t.title || "");
      const creatorStr = String(t.created_by || "");
      const dateStr = String(t.date || "");

      const matchSearch = titleStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        creatorStr.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchDate = true;
      if (ticketDateMode === "Single") {
        matchDate = ticketDateFilter === "All" || dateStr === ticketDateFilter;
      } else {
        if (ticketStartDateFilter && ticketEndDateFilter) {
          const tDate = new Date(dateStr.split('/').reverse().join('-'));
          const sDate = new Date(ticketStartDateFilter.split('/').reverse().join('-'));
          const eDate = new Date(ticketEndDateFilter.split('/').reverse().join('-'));
          matchDate = tDate >= sDate && tDate <= eDate;
        } else if (ticketStartDateFilter) {
          const tDate = new Date(dateStr.split('/').reverse().join('-'));
          const sDate = new Date(ticketStartDateFilter.split('/').reverse().join('-'));
          matchDate = tDate >= sDate;
        } else if (ticketEndDateFilter) {
          const tDate = new Date(dateStr.split('/').reverse().join('-'));
          const eDate = new Date(ticketEndDateFilter.split('/').reverse().join('-'));
          matchDate = tDate <= eDate;
        }
      }

      const matchCreator = ticketCreatorFilter === "All" || creatorStr === ticketCreatorFilter;
      const matchPriority = ticketPriorityFilter === "All" || (t.priority && t.priority.name === ticketPriorityFilter);
      const matchTag = ticketTagFilter === "All" || (t.tags && t.tags.some(tag => (typeof tag === 'string' ? tag : tag.name) === ticketTagFilter));
      
      let matchEscalated = true;
      if (ticketEscalatedFilter === "Yes") matchEscalated = t.escalated === true;
      if (ticketEscalatedFilter === "No") matchEscalated = !t.escalated;
      
      return matchSearch && matchDate && matchCreator && matchPriority && matchTag && matchEscalated;
    });
  }, [allTickets, searchQuery, ticketDateFilter, ticketCreatorFilter, ticketDateMode, ticketStartDateFilter, ticketEndDateFilter, ticketPriorityFilter, ticketTagFilter, ticketEscalatedFilter]);

  const statusCounts = useMemo(() => {
    const counts = { 'Active': 0, 'Not Started': 0, 'Done': 0 };
    ticketsBeforeStatusFilter.forEach(t => {
      if (counts[t.status] !== undefined) counts[t.status]++;
    });
    return counts;
  }, [ticketsBeforeStatusFilter]);

  const filteredTickets = useMemo(() => {
    return ticketsBeforeStatusFilter.filter(t => ticketStatusFilter === "All" || t.status === ticketStatusFilter);
  }, [ticketsBeforeStatusFilter, ticketStatusFilter]);

  if (isLoading) {
    return (
      <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="orbit-loader">
            <div className="orbit-ring"></div>
            <div className="orbit-satellite"></div>
            <span className="orbit-text">ORBIT</span>
          </div>
          <p style={{ marginTop: '2.5rem', color: 'var(--muted)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.1em' }}>
            INITIATING WORKSPACE...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Top Navigation */}
      <header style={styles.header}>
        <div style={styles.navLeft}>
          <h1 className="page-title orbit-logo-container" style={styles.logo} aria-label="ORBIT">
            <span className="planet-o" aria-hidden="true">O</span>
            <span className="rbit-text" aria-hidden="true">RBIT</span>
          </h1>
        </div>

        <div style={styles.navCenter}>
          <span className="section-header" style={styles.userName}>{currentUser === null ? 'Loading' : currentUser}'s Workspace</span>
        </div>

        <div style={styles.navRight}>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{ ...styles.actionBtn, backgroundColor: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.45rem', borderRadius: '50%' }}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setShowDailyTracking(!showDailyTracking)}
            style={{ ...styles.actionBtn, backgroundColor: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' }}
            title={showDailyTracking ? "Hide Daily Tracking" : "Show Daily Tracking"}
          >
            <Layout size={16} />
            {showDailyTracking ? "Hide Tracking" : "Show Tracking"}
          </button>
          <div style={styles.datePickerContainer}>
            <input
              type="date"
              value={toDateInput(selectedDate)}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
              onChange={(e) => {
                const newDate = fromDateInput(e.target.value);
                if (newDate) setSelectedDate(newDate);
              }}
              style={{ ...styles.dateInput, colorScheme: 'dark' }}
            />
            <button
              onClick={handleCreateNewBlock}
              disabled={isCreatingBlock}
              style={styles.addBlockBtn}
              title="Add Next Date Table"
            >
              {isCreatingBlock ? "..." : "+"}
            </button>
          </div>
          {selectedDate !== today && (
            <button
              onClick={() => setSelectedDate(today)}
              style={styles.actionBtn}
            >
              Back to Today
            </button>
          )}
        </div>
      </header>

      {isTodayTableMissing && (
        <div style={{
          backgroundColor: 'rgba(243, 156, 18, 0.1)',
          borderBottom: '1px solid rgba(243, 156, 18, 0.3)',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#f39c12'
        }}>
          <span style={{ fontWeight: '500' }}>
            Today's ATM Table is not created, Hence Create one
          </span>
          <button 
            onClick={handleCreateNewBlock}
            disabled={isCreatingBlock}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f39c12',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: isCreatingBlock ? 'not-allowed' : 'pointer',
              opacity: isCreatingBlock ? 0.7 : 1
            }}
          >
            {isCreatingBlock ? "Creating..." : "Create Today's Table"}
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main style={{ 
        ...styles.main,
        display: 'flex',
        flexDirection: 'row'
      }}>
        {/* Left Panel: Daily Logs */}
        <section style={{
          flex: showDailyTracking ? "2" : "0.0001",
          minWidth: showDailyTracking ? "60%" : "0",
          borderRight: showDailyTracking ? "1px solid var(--card-border)" : "0px solid transparent",
          display: "flex",
          flexDirection: "column",
          padding: showDailyTracking ? "1.5rem" : "1.5rem 0",
          opacity: showDailyTracking ? 1 : 0,
          overflow: "hidden",
          transition: "flex 0.4s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.4s cubic-bezier(0.4, 0, 0.2, 1), padding 0.4s ease, opacity 0.3s ease, border-width 0.4s ease",
          visibility: showDailyTracking ? "visible" : "hidden"
        }}>
            <div style={{ ...styles.panelHeader, whiteSpace: 'nowrap' }}>
            <h2 className="section-header">Daily Tracking {isReadOnly && "(Read-Only)"}</h2>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: isSearchOpen ? 'var(--bg2)' : 'transparent', borderRadius: '20px', padding: isSearchOpen ? '0.1rem 0.5rem' : '0', transition: 'all 0.3s ease', border: isSearchOpen ? '1px solid var(--card-border)' : '1px solid transparent' }}>
                <button 
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.3rem', color: isSearchOpen ? 'var(--text)' : 'var(--muted)' }}
                  title="Search ATM Sections"
                >
                  <Search size={16} />
                </button>
                {isSearchOpen && (
                  <input 
                    type="text" 
                    placeholder="Search..."
                    value={atmSearchQuery}
                    onChange={(e) => setAtmSearchQuery(e.target.value)}
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', width: '100px', fontSize: '0.85rem' }}
                    autoFocus
                  />
                )}
              </div>
              <a
                href="https://docs.google.com/spreadsheets/d/19PbTrWJ7nQEfzSpRQA6FI89a-bOuNkFDwwuOpaFxJ1s/edit"
                target="_blank"
                rel="noreferrer"
                style={styles.atmSheetBtn}
              >
                ATM sheet
              </a>
              <button
                onClick={() => setIsMasterModalOpen(true)}
                style={{ ...styles.todayUpdateBtn, backgroundColor: 'var(--accent)', color: '#fff' }}
              >
                <Save size={16} /> Update Master Sheet
              </button>
              <button
                onClick={() => setUpdateModalOpen(true)}
                style={styles.todayUpdateBtn}
              >
                <FileText size={16} /> Today's Update
              </button>
            </div>
          </div>

          <div style={styles.columnsGrid}>
            {COLUMN_KEYS.map(key => (
              <ColumnCard
                key={key}
                columnKey={key}
                title={COLUMN_TITLES[key]}
                items={dailyLogs[key]}
                isReadOnly={isReadOnly}
                onAddItems={(items, extraData) => handleAddItems(key, items, extraData)}
                onDeleteItems={(items) => handleDeleteItems(key, items)}
                onEditItem={(index, val) => handleEditItem(key, index, val)}
                aiDate={key === 'aiCount' ? aiDate : undefined}
                onUpdateAiDate={key === 'aiCount' ? handleUpdateAiDate : undefined}
                searchQuery={atmSearchQuery}
                currentUser={currentUser}
                selectedDate={selectedDate}
                musicProps={key === 'aiCount' ? musicProps : undefined}
              />
            ))}
          </div>
        </section>

        {/* Right Panel: Global Tickets / Browser / YT Music */}
        <section style={{ 
          ...styles.rightPanel, 
          flex: 1,
          padding: showDailyTracking ? '1.5rem' : '1.5rem 10vw',
          transition: "padding 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
        }}>
          <div style={styles.panelHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Workspace Mode Tabs */}
              <div style={styles.workspaceTabGroup}>
                <button
                  onClick={() => setRightPanelMode("tickets")}
                  style={{
                    ...styles.workspaceTabBtn,
                    ...(rightPanelMode === "tickets" ? styles.workspaceTabBtnActive : {})
                  }}
                  title="Global Tickets Section"
                >
                  <TicketIcon size={14} />
                  <span>Tickets</span>
                  <span style={styles.workspaceBadge}>{filteredTickets.length}</span>
                </button>

                <button
                  onClick={() => setRightPanelMode("browser")}
                  style={{
                    ...styles.workspaceTabBtn,
                    ...(rightPanelMode === "browser" ? styles.workspaceTabBtnActive : {})
                  }}
                  title="In-App Web Browser"
                >
                  <Globe size={14} />
                  <span>Browser</span>
                </button>

                <button
                  onClick={() => setRightPanelMode("youtube")}
                  style={{
                    ...styles.workspaceTabBtn,
                    ...(rightPanelMode === "youtube" ? styles.workspaceTabBtnActive : {})
                  }}
                  title="YouTube Portal (Watch Videos & YT Music)"
                >
                  <YouTubeIcon size={14} />
                  <span>YouTube</span>
                  {isPlaying && (
                    <span
                      className="orange-pulse-dot"
                      style={{
                        width: "6px",
                        height: "6px",
                        backgroundColor: "var(--accent)",
                        boxShadow: "0 0 0 0 rgba(16, 185, 129, 0.7)",
                        marginLeft: "2px"
                      }}
                    />
                  )}
                </button>
              </div>

              {rightPanelMode === "tickets" && (
                <>
                  {syncStatus === 'syncing' && (
                    <div style={{ marginLeft: '0.25rem', display: 'flex', alignItems: 'center' }}>
                      <div className="spinner-small" title="Syncing with ClickUp"></div>
                    </div>
                  )}
                  {syncStatus === 'done' && (
                    <div style={{ marginLeft: '0.25rem', display: 'flex', alignItems: 'center' }}>
                      <Check size={16} color="#2ecc71" title="Sync Complete" />
                    </div>
                  )}
                </>
              )}
            </div>

            {rightPanelMode === "tickets" && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setReportModalOpen(true)}
                  style={styles.todayUpdateBtn}
                >
                  <FileText size={16} /> Report
                </button>
                <button
                  onClick={() => { setEditingTicket(null); setTicketModalOpen(true); }}
                  style={styles.addTicketBtn}
                >
                  <PlusCircle size={16} /> New Ticket
                </button>
              </div>
            )}
          </div>

          {rightPanelMode === "browser" ? (
            <OrbitBrowser />
          ) : rightPanelMode === "youtube" ? (
            <OrbitFullMusicHub
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              onPlayTrack={handlePlayTrack}
              onPlayStation={handlePlayStation}
              onPlayPlaylist={handlePlayPlaylist}
              onSeek={handleSeek}
            />
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ ...styles.searchBar, marginBottom: 0 }}>
                  <Search size={16} color="var(--muted)" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={styles.searchInput}
                  />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <select
                  value={ticketCreatorFilter}
                  onChange={(e) => setTicketCreatorFilter(e.target.value)}
                  style={{ ...styles.dateFilter, cursor: 'pointer', backgroundColor: 'var(--bg)', colorScheme: 'dark', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '0.4rem 0.6rem' }}
                  title="Filter by creator"
                >
                  <option value="All">All Creators</option>
                  {uniqueCreators.map(creator => (
                    <option key={creator} value={creator}>{creator}</option>
                  ))}
                </select>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={() => setTicketStatusFilter(prev => prev === "Active" ? "All" : "Active")}
                    style={{
                      ...styles.statusFilterBtn,
                      backgroundColor: ticketStatusFilter === "Active" ? 'rgba(52, 152, 219, 0.15)' : 'transparent',
                      border: ticketStatusFilter === "Active" ? '1px solid #3498db' : '1px solid var(--card-border)'
                    }}
                    title="Filter Active"
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3498db', display: 'inline-block' }}></span>
                    Active ({statusCounts['Active']})
                  </button>
                  
                  <button
                    onClick={() => setTicketStatusFilter(prev => prev === "Not Started" ? "All" : "Not Started")}
                    style={{
                      ...styles.statusFilterBtn,
                      backgroundColor: ticketStatusFilter === "Not Started" ? 'rgba(243, 156, 18, 0.15)' : 'transparent',
                      border: ticketStatusFilter === "Not Started" ? '1px solid #f39c12' : '1px solid var(--card-border)'
                    }}
                    title="Filter Not Started"
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f39c12', display: 'inline-block' }}></span>
                    Not Started ({statusCounts['Not Started']})
                  </button>
                  
                  <button
                    onClick={() => setTicketStatusFilter(prev => prev === "Done" ? "All" : "Done")}
                    style={{
                      ...styles.statusFilterBtn,
                      backgroundColor: ticketStatusFilter === "Done" ? 'rgba(46, 204, 113, 0.15)' : 'transparent',
                      border: ticketStatusFilter === "Done" ? '1px solid #2ecc71' : '1px solid var(--card-border)'
                    }}
                    title="Filter Done"
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2ecc71', display: 'inline-block' }}></span>
                    Done ({statusCounts['Done']})
                  </button>
                </div>

                {(ticketDateFilter !== "All" || ticketCreatorFilter !== "All" || ticketStartDateFilter || ticketEndDateFilter || ticketStatusFilter !== "All" || ticketPriorityFilter !== "All" || ticketTagFilter !== "All" || ticketEscalatedFilter !== "All") && (
                  <button
                    onClick={() => {
                      setTicketDateFilter("All");
                      setTicketCreatorFilter("All");
                      setTicketStartDateFilter("");
                      setTicketEndDateFilter("");
                      setTicketStatusFilter("All");
                      setTicketPriorityFilter("All");
                      setTicketTagFilter("All");
                      setTicketEscalatedFilter("All");
                      setSearchQuery("");
                    }}
                    style={{ ...styles.clearFiltersBtn, cursor: 'pointer' }}
                  >
                    Clear Filters
                  </button>
                )}

                <div style={{ position: 'relative', marginLeft: 'auto' }}>
                  <button
                    onClick={handleOpenFilterMenu}
                    style={{
                      ...styles.dateFilter,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      backgroundColor: (ticketPriorityFilter !== "All" || ticketTagFilter !== "All" || ticketEscalatedFilter !== "All" || ticketDateFilter !== "All" || ticketStartDateFilter || ticketEndDateFilter) ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg)',
                      border: (ticketPriorityFilter !== "All" || ticketTagFilter !== "All" || ticketEscalatedFilter !== "All" || ticketDateFilter !== "All" || ticketStartDateFilter || ticketEndDateFilter) ? '1px solid var(--accent)' : '1px solid var(--card-border)',
                      borderRadius: '8px',
                      padding: '0.4rem 0.6rem',
                      color: 'var(--text)'
                    }}
                    title="Advanced Filters"
                  >
                    <Filter size={14} color="var(--accent)" />
                    <span>More Filters</span>
                    {(ticketPriorityFilter !== "All" || ticketTagFilter !== "All" || ticketEscalatedFilter !== "All" || ticketDateFilter !== "All" || ticketStartDateFilter || ticketEndDateFilter) && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent)' }} />
                    )}
                  </button>

                  {isFilterMenuOpen && (
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 5px)',
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '10px',
                      padding: '1rem',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      zIndex: 50,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      minWidth: '280px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)' }}>Date Filter</label>
                          <button
                            onClick={() => setTempFilters({...tempFilters, ticketDateMode: tempFilters.ticketDateMode === "Single" ? "Range" : "Single"})}
                            style={{
                              background: 'rgba(52, 152, 219, 0.1)', border: 'none', color: '#3498db', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', padding: '0.2rem 0.5rem', borderRadius: '4px'
                            }}
                          >
                            Use {tempFilters.ticketDateMode === "Single" ? "Range" : "Single"}
                          </button>
                        </div>
                        {tempFilters.ticketDateMode === "Single" ? (
                          <input
                            type={tempFilters.ticketDateFilter === "All" ? "text" : "date"}
                            placeholder="All dates"
                            value={tempFilters.ticketDateFilter === "All" ? "" : toDateInput(tempFilters.ticketDateFilter)}
                            onFocus={(e) => { e.target.type = 'date'; }}
                            onClick={(e) => { e.target.type = 'date'; try { e.target.showPicker && e.target.showPicker(); } catch(err) {} }}
                            onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                            onChange={(e) => {
                              const newDate = fromDateInput(e.target.value);
                              setTempFilters({...tempFilters, ticketDateFilter: newDate || "All"});
                            }}
                            style={{ ...styles.dateFilter, width: '100%', backgroundColor: 'var(--bg)', colorScheme: 'dark', border: '1px solid var(--card-border)', borderRadius: '6px', padding: '0.5rem 0.6rem' }}
                          />
                        ) : (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                              type={tempFilters.ticketStartDateFilter ? "date" : "text"}
                              placeholder="From"
                              value={tempFilters.ticketStartDateFilter ? toDateInput(tempFilters.ticketStartDateFilter) : ""}
                              onFocus={(e) => { e.target.type = 'date'; }}
                              onClick={(e) => { e.target.type = 'date'; try { e.target.showPicker && e.target.showPicker(); } catch(err) {} }}
                              onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                              onChange={(e) => setTempFilters({...tempFilters, ticketStartDateFilter: fromDateInput(e.target.value)})}
                              style={{ ...styles.dateFilter, width: '50%', backgroundColor: 'var(--bg)', colorScheme: 'dark', border: '1px solid var(--card-border)', borderRadius: '6px', padding: '0.5rem 0.4rem', fontSize: '0.8rem' }}
                            />
                            <input
                              type={tempFilters.ticketEndDateFilter ? "date" : "text"}
                              placeholder="To"
                              value={tempFilters.ticketEndDateFilter ? toDateInput(tempFilters.ticketEndDateFilter) : ""}
                              onFocus={(e) => { e.target.type = 'date'; }}
                              onClick={(e) => { e.target.type = 'date'; try { e.target.showPicker && e.target.showPicker(); } catch(err) {} }}
                              onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                              onChange={(e) => setTempFilters({...tempFilters, ticketEndDateFilter: fromDateInput(e.target.value)})}
                              style={{ ...styles.dateFilter, width: '50%', backgroundColor: 'var(--bg)', colorScheme: 'dark', border: '1px solid var(--card-border)', borderRadius: '6px', padding: '0.5rem 0.4rem', fontSize: '0.8rem' }}
                            />
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)' }}>Priority</label>
                        <select
                          value={tempFilters.ticketPriorityFilter}
                          onChange={(e) => setTempFilters({...tempFilters, ticketPriorityFilter: e.target.value})}
                          style={{ ...styles.dateFilter, backgroundColor: 'var(--bg)', colorScheme: 'dark', border: '1px solid var(--card-border)', borderRadius: '6px', padding: '0.5rem 0.6rem' }}
                        >
                          <option value="All">All Priorities</option>
                          {uniquePriorities.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)' }}>Tag</label>
                        <select
                          value={tempFilters.ticketTagFilter}
                          onChange={(e) => setTempFilters({...tempFilters, ticketTagFilter: e.target.value})}
                          style={{ ...styles.dateFilter, backgroundColor: 'var(--bg)', colorScheme: 'dark', border: '1px solid var(--card-border)', borderRadius: '6px', padding: '0.5rem 0.6rem' }}
                        >
                          <option value="All">All Tags</option>
                          {uniqueTags.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)' }}>Escalation</label>
                        <select
                          value={tempFilters.ticketEscalatedFilter}
                          onChange={(e) => setTempFilters({...tempFilters, ticketEscalatedFilter: e.target.value})}
                          style={{ ...styles.dateFilter, backgroundColor: 'var(--bg)', colorScheme: 'dark', border: '1px solid var(--card-border)', borderRadius: '6px', padding: '0.5rem 0.6rem' }}
                        >
                          <option value="All">All Tickets</option>
                          <option value="Escalated">Escalated Only</option>
                          <option value="Non-Escalated">Non-Escalated Only</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button 
                          onClick={handleCancelFilters}
                          style={{ flex: 1, padding: '0.6rem', backgroundColor: 'var(--bg)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleApplyFilters}
                          style={{ flex: 1, padding: '0.6rem', backgroundColor: 'var(--accent)', border: 'none', borderRadius: '8px', color: 'var(--bg)', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                </div>
              </div>

              <div style={styles.ticketList}>
                {filteredTickets.map(ticket => (
                  <TicketItem
                    key={ticket.id}
                    ticket={ticket}
                    onEdit={() => { setEditingTicket(ticket); setTicketModalOpen(true); }}
                    onDelete={handleDeleteTicket}
                    onEscalate={handleEscalateTicket}
                  />
                ))}
                {filteredTickets.length === 0 && (
                  <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: '2rem' }}>No tickets found.</p>
                )}
              </div>
            </>
          )}
        </section>
      </main>

      {/* Persistent Global Background Audio Engine */}
      <div style={{ position: "absolute", width: "1px", height: "1px", opacity: 0.01, pointerEvents: "none", top: "-9999px", left: "-9999px", overflow: "hidden" }}>
        {audioEmbedUrl && (
          <iframe
            ref={audioIframeRef}
            src={audioEmbedUrl}
            title="Global Audio Engine"
            allow="autoplay; encrypted-media"
            style={{ width: "100px", height: "100px", border: "none" }}
          />
        )}
      </div>

      <AddTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => { setTicketModalOpen(false); setEditingTicket(null); }}
        currentUser={currentUser}
        onSubmit={handleCreateTicket}
        initialData={editingTicket}
        selectedDate={selectedDate}
      />

      <TodayUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        dailyLogs={dailyLogs}
        tickets={allTickets}
        selectedDate={selectedDate}
        currentUser={currentUser}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setReportModalOpen(false)}
        tickets={allTickets}
        selectedDate={selectedDate}
        uniqueCreators={uniqueCreators}
        uniquePriorities={uniquePriorities}
        uniqueTags={uniqueTags}
      />

      <UpdateMasterModal
        isOpen={isMasterModalOpen}
        onClose={() => {
          setIsMasterModalOpen(false);
          setIsMasterDateMissing(false);
        }}
        date={selectedDate}
        metrics={masterMetrics}
        onSubmit={handleUpdateMasterSubmit}
        isDateMissing={isMasterDateMissing}
        onCreateColumn={handleCreateMasterColumn}
      />

    </div>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  header: {
    height: "64px",
    borderBottom: "1px solid var(--card-border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 2rem",
    backgroundColor: "var(--bg2)",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
  },
  navLeft: {
    display: "flex",
    alignItems: "baseline",
    gap: "1.25rem"
  },
  logo: {
    margin: 0,
    letterSpacing: "0.15em",
    fontSize: "2.2rem"
  },
  navCenter: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center"
  },
  userName: {
    color: "var(--accent)",
    margin: 0,
    fontSize: "0.95rem",
    fontWeight: "600"
  },
  atmSheetBtn: {
    padding: "0.4rem 0.8rem",
    backgroundColor: "var(--accent)",
    color: "#ffffff",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "0.85rem",
    border: "1px solid var(--accent)",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center"
  },
  navRight: {
    display: "flex",
    alignItems: "center",
    gap: "1rem"
  },
  datePickerContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "var(--bg)",
    padding: "0.5rem 1rem",
    borderRadius: "10px",
    border: "1px solid var(--card-border)",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)"
  },
  dateInput: {
    background: "none",
    border: "none",
    color: "var(--text)",
    fontSize: "0.95rem",
    width: "115px",
    outline: "none",
    fontWeight: "500"
  },
  addBlockBtn: {
    background: "var(--bg2)",
    border: "1px solid var(--card-border)",
    color: "var(--text)",
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "1.2rem",
    fontWeight: "500",
    marginLeft: "0.5rem",
    transition: "all 0.2s ease"
  },
  actionBtn: {
    padding: "0.5rem 1.25rem",
    backgroundColor: "var(--text)",
    color: "var(--bg)",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "0.9rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  },
  main: {
    flex: 1,
    overflow: "hidden"
  },
  leftPanel: {
    /* Removed static flex */
  },
  rightPanel: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--bg2)",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.25rem"
  },
  todayUpdateBtn: {
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    backgroundColor: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    color: "var(--text)",
    fontWeight: "500",
    fontSize: "0.85rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    transition: "all 0.2s ease"
  },
  columnsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gridTemplateRows: "repeat(2, 1fr)",
    gap: "1rem",
    flex: 1,
    overflow: "hidden"
  },
  addTicketBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "var(--card-border)",
    color: "var(--text)",
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    fontWeight: "500",
    fontSize: "0.85rem",
    transition: "background 0.2s"
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.6rem 1rem",
    backgroundColor: "var(--bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "8px",
    marginBottom: "1rem",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)"
  },
  searchInput: {
    flex: 1,
    backgroundColor: "transparent",
    border: "none",
    color: "var(--text)",
    fontSize: "0.9rem",
    outline: "none"
  },
  dateFilter: {
    backgroundColor: "transparent",
    border: "none",
    color: "var(--text)",
    borderLeft: "1px solid var(--card-border)",
    paddingLeft: "0.75rem",
    outline: "none",
    fontSize: "0.9rem"
  },
  ticketList: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    paddingRight: "0.5rem"
  },
  ticketCard: {
    backgroundColor: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    padding: "1rem",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    transition: "all 0.2s ease"
  },
  ticketHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  statusBadge: {
    padding: "0.25rem 0.6rem",
    borderRadius: "6px",
    fontSize: "0.7rem",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  },
  ticketTitle: {
    margin: 0,
    fontFamily: "var(--font-inter), sans-serif",
    fontSize: "1rem",
    fontWeight: "700",
    color: "var(--text)",
    lineHeight: "1.4"
  },
  ticketLinkText: {
    color: "var(--muted)",
    fontSize: "0.8rem",
    wordBreak: "break-all",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "85%"
  },
  iconBtn: {
    background: "var(--bg)",
    border: "1px solid var(--card-border)",
    width: "30px",
    height: "30px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  copyBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.2rem",
    borderRadius: "4px",
    transition: "all 0.2s ease"
  },
  statusFilterBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.4rem 0.75rem',
    borderRadius: '20px',
    border: '1px solid var(--card-border)',
    color: 'var(--text)',
    fontSize: '0.8rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  workspaceTabGroup: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    backgroundColor: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    padding: "0.2rem",
    borderRadius: "10px"
  },
  workspaceTabBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.4rem 0.8rem",
    fontSize: "0.82rem",
    fontWeight: "700",
    borderRadius: "7px",
    border: "none",
    backgroundColor: "transparent",
    color: "var(--muted)",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  workspaceTabBtnActive: {
    backgroundColor: "var(--bg)",
    color: "var(--accent)",
    boxShadow: "0 1px 4px rgba(0,0,0,0.12)"
  },
  workspaceBadge: {
    backgroundColor: "var(--card-border)",
    color: "var(--text)",
    padding: "0.05rem 0.4rem",
    borderRadius: "10px",
    fontSize: "0.7rem",
    fontWeight: "800"
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: 'var(--bg)',
    position: 'fixed',
    top: 0, left: 0,
    zIndex: 9999
  }
};
