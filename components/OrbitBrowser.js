"use client";

import { useState } from "react";
import { Search, RotateCw, ExternalLink, ArrowLeft, ArrowRight, Bookmark, ShieldCheck, Compass, Lock, Zap, Server } from "lucide-react";

const QUICK_BOOKMARKS = [
  { name: "Google", url: "https://www.google.com/search?igu=1&q=", icon: "🔍", isSearch: true, isProxy: false },
  { name: "DuckDuckGo", url: "https://duckduckgo.com/?q=", icon: "🦆", isSearch: true, isProxy: false },
  { name: "ClickUp", url: "https://app.clickup.com", icon: "⚡", isProxy: false, requiresAuth: true },
  { name: "GitHub", url: "https://github.com", icon: "🐙", isProxy: true, requiresAuth: true },
  { name: "Wikipedia", url: "https://en.wikipedia.org/wiki/Special:Search?search=", icon: "📚", isSearch: true, isProxy: true },
  { name: "Hacker News", url: "https://news.ycombinator.com", icon: "📰", isProxy: true }
];

export default function OrbitBrowser() {
  const [inputUrl, setInputUrl] = useState("https://www.google.com/search?igu=1");
  const [currentUrl, setCurrentUrl] = useState("https://www.google.com/search?igu=1");
  const [useProxy, setUseProxy] = useState(false);
  const [history, setHistory] = useState(["https://www.google.com/search?igu=1"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);

  const isAuthPage = currentUrl.includes("accounts.google.com") ||
    currentUrl.includes("github.com/login") ||
    currentUrl.includes("clickup.com/login") ||
    currentUrl.includes("signin") ||
    currentUrl.includes("auth");

  const navigateTo = (rawUrl, forceProxy = null) => {
    if (!rawUrl || !rawUrl.trim()) return;
    let target = rawUrl.trim();

    // If not a URL, treat as Google Search
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      if (target.includes(".") && !target.includes(" ")) {
        target = "https://" + target;
      } else {
        target = `https://www.google.com/search?igu=1&q=${encodeURIComponent(target)}`;
      }
    }

    setInputUrl(target);
    setCurrentUrl(target);
    if (forceProxy !== null) setUseProxy(forceProxy);

    // Update history
    const nextHist = history.slice(0, historyIndex + 1);
    nextHist.push(target);
    setHistory(nextHist);
    setHistoryIndex(nextHist.length - 1);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    navigateTo(inputUrl);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      const prevUrl = history[prevIdx];
      setInputUrl(prevUrl);
      setCurrentUrl(prevUrl);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      const nextUrl = history[nextIdx];
      setInputUrl(nextUrl);
      setCurrentUrl(nextUrl);
    }
  };

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  const handleBookmarkClick = (bm) => {
    if (bm.isSearch) {
      const searchUrl = bm.url;
      setInputUrl(searchUrl);
      setCurrentUrl(searchUrl);
      setUseProxy(Boolean(bm.isProxy));
    } else {
      navigateTo(bm.url, Boolean(bm.isProxy));
    }
  };

  const handleOpenExternal = (urlToOpen = currentUrl) => {
    if (typeof window !== "undefined") {
      window.open(urlToOpen, "_blank", "noopener,noreferrer");
    }
  };

  // Determine iframe src (either proxy or direct)
  const iframeSrc = useProxy
    ? `/api/browser/proxy?url=${encodeURIComponent(currentUrl)}`
    : currentUrl;

  return (
    <div style={styles.container}>
      {/* Browser Navigation Toolbar */}
      <div style={styles.toolbar}>
        {/* Navigation Buttons */}
        <div style={styles.navControls}>
          <button
            onClick={handleBack}
            disabled={historyIndex === 0}
            style={{
              ...styles.navBtn,
              opacity: historyIndex === 0 ? 0.35 : 1,
              cursor: historyIndex === 0 ? "default" : "pointer"
            }}
            title="Back"
          >
            <ArrowLeft size={15} />
          </button>
          <button
            onClick={handleForward}
            disabled={historyIndex >= history.length - 1}
            style={{
              ...styles.navBtn,
              opacity: historyIndex >= history.length - 1 ? 0.35 : 1,
              cursor: historyIndex >= history.length - 1 ? "default" : "pointer"
            }}
            title="Forward"
          >
            <ArrowRight size={15} />
          </button>
          <button
            onClick={handleRefresh}
            style={styles.navBtn}
            title="Reload Page"
          >
            <RotateCw size={14} />
          </button>
        </div>

        {/* Address & Search Bar */}
        <form onSubmit={handleSearchSubmit} style={styles.addressForm}>
          <div style={styles.addressContainer}>
            <ShieldCheck size={14} color="#10b981" style={styles.sslIcon} />
            <input
              type="text"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              placeholder="Search Google or enter web address (e.g. google.com, github.com)..."
              style={styles.addressInput}
            />
            <button type="submit" style={styles.goBtn} title="Go">
              <Search size={13} />
            </button>
          </div>
        </form>

        {/* Proxy Mode Toggle */}
        <button
          onClick={() => setUseProxy(!useProxy)}
          style={{
            ...styles.proxyToggleBtn,
            backgroundColor: useProxy ? "rgba(16, 185, 129, 0.15)" : "transparent",
            borderColor: useProxy ? "var(--accent)" : "var(--card-border)",
            color: useProxy ? "var(--accent)" : "var(--muted)"
          }}
          title={useProxy ? "Web Proxy: ON (Bypasses iframe security blocks)" : "Web Proxy: OFF"}
        >
          <Server size={13} />
          <span>{useProxy ? "Proxy: ON" : "Proxy: OFF"}</span>
        </button>

        {/* Open in External Window */}
        <button
          onClick={() => handleOpenExternal()}
          style={styles.openExternalBtn}
          title="Open in new window / tab"
        >
          <ExternalLink size={15} />
        </button>
      </div>

      {/* Bookmarks Bar */}
      <div style={styles.bookmarksBar}>
        <div style={styles.bookmarkLabel}>
          <Bookmark size={11} color="var(--muted)" />
          <span>Quick:</span>
        </div>
        <div style={styles.bookmarkList}>
          {QUICK_BOOKMARKS.map((bm, i) => (
            <button
              key={i}
              onClick={() => handleBookmarkClick(bm)}
              style={styles.bookmarkChip}
            >
              <span>{bm.icon}</span>
              <span>{bm.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Auth / Sign-In Helper Banner */}
      {isAuthPage && (
        <div style={styles.authBanner}>
          <div style={styles.authBannerLeft}>
            <Lock size={15} color="#f59e0b" />
            <div>
              <div style={styles.authBannerTitle}>Secure Account Sign-In Detected</div>
              <div style={styles.authBannerSub}>
                Google, GitHub, and ClickUp require top-level authentication for account security.
              </div>
            </div>
          </div>
          <button
            onClick={() => handleOpenExternal()}
            style={styles.authActionBtn}
          >
            <Zap size={13} />
            <span>Open Sign-In in Secure Tab</span>
          </button>
        </div>
      )}

      {/* Browser Viewport */}
      <div style={styles.viewport}>
        <iframe
          key={iframeKey}
          src={iframeSrc}
          title="ORBIT In-App Browser"
          style={styles.iframe}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>

      {/* Browser Footer Status */}
      <div style={styles.browserFooter}>
        <div style={styles.statusIndicator}>
          <Compass size={11} color="var(--accent)" />
          <span style={styles.statusText}>
            ORBIT SECURE BROWSER • {new URL(currentUrl.startsWith("http") ? currentUrl : "https://google.com").hostname}
          </span>
        </div>
        <div style={styles.footerHint}>
          💡 Tip: Use &quot;Proxy: ON&quot; if a website blocks embedded iframes, or click Pop-out to open in a new tab.
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
    backgroundColor: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    backgroundColor: "var(--bg)",
    borderBottom: "1px solid var(--card-border)",
    flexWrap: "wrap"
  },
  navControls: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem"
  },
  navBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text)",
    padding: "0.3rem",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease"
  },
  addressForm: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    minWidth: "220px"
  },
  addressContainer: {
    width: "100%",
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  sslIcon: {
    position: "absolute",
    left: "0.6rem",
    pointerEvents: "none"
  },
  addressInput: {
    width: "100%",
    backgroundColor: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "8px",
    padding: "0.4rem 2rem 0.4rem 2rem",
    fontSize: "0.82rem",
    color: "var(--text)",
    outline: "none",
    transition: "border-color 0.2s"
  },
  goBtn: {
    position: "absolute",
    right: "0.3rem",
    background: "var(--accent)",
    border: "none",
    color: "#fff",
    padding: "0.25rem 0.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  proxyToggleBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.35rem 0.6rem",
    borderRadius: "6px",
    border: "1px solid var(--card-border)",
    fontSize: "0.72rem",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.15s ease"
  },
  openExternalBtn: {
    background: "transparent",
    border: "1px solid var(--card-border)",
    color: "var(--muted)",
    padding: "0.35rem 0.55rem",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.15s ease"
  },
  bookmarksBar: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.25rem 0.75rem",
    backgroundColor: "var(--card-bg)",
    borderBottom: "1px solid var(--card-border)",
    overflowX: "auto"
  },
  bookmarkLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: "0.7rem",
    fontWeight: "700",
    color: "var(--muted)",
    flexShrink: 0
  },
  bookmarkList: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem"
  },
  bookmarkChip: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    padding: "0.15rem 0.45rem",
    fontSize: "0.7rem",
    fontWeight: "600",
    borderRadius: "6px",
    border: "1px solid var(--card-border)",
    backgroundColor: "var(--bg)",
    color: "var(--text)",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.15s ease"
  },
  authBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.5rem 0.75rem",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderBottom: "1px solid rgba(245, 158, 11, 0.25)",
    gap: "0.75rem",
    flexWrap: "wrap"
  },
  authBannerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  },
  authBannerTitle: {
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "#f59e0b"
  },
  authBannerSub: {
    fontSize: "0.68rem",
    color: "var(--muted)"
  },
  authActionBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    backgroundColor: "#f59e0b",
    color: "#000",
    border: "none",
    padding: "0.3rem 0.7rem",
    borderRadius: "6px",
    fontSize: "0.72rem",
    fontWeight: "700",
    cursor: "pointer"
  },
  viewport: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
    position: "relative",
    overflow: "hidden"
  },
  iframe: {
    width: "100%",
    height: "100%",
    border: "none",
    display: "block"
  },
  browserFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.3rem 0.75rem",
    backgroundColor: "var(--bg)",
    borderTop: "1px solid var(--card-border)",
    flexWrap: "wrap",
    gap: "0.5rem"
  },
  statusIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem"
  },
  statusText: {
    fontSize: "0.65rem",
    fontWeight: "700",
    letterSpacing: "0.08em",
    color: "var(--muted)"
  },
  footerHint: {
    fontSize: "0.65rem",
    color: "var(--muted)"
  }
};
