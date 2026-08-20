"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Plus, Trash2, Info, Filter, Check, Copy, AlertTriangle, ChevronUp, ChevronDown, X } from "lucide-react";
import OrbitMusicPlayer from "./OrbitMusicPlayer";

const CopyButton = ({ text, size = 14 }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} style={{background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center'}} title="Copy">
      {copied ? <Check size={size} color="#2ecc71" /> : <Copy size={size} color="var(--muted)" />}
    </button>
  );
};

const toDateInput = (ddmmyyyy) => {
  if (!ddmmyyyy) return "";
  const parts = ddmmyyyy.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return "";
};

const fromDateInput = (yyyymmdd) => {
  if (!ddmmyyyy) return "";
  const parts = yyyymmdd.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return "";
};

export default function ColumnCard({ 
  columnKey, 
  title, 
  items, 
  onAddItems, 
  onDeleteItems, 
  onEditItem, 
  aiDate, 
  onUpdateAiDate, 
  isReadOnly, 
  searchQuery = "",
  currentUser = "",
  selectedDate = "",
  musicProps = {}
}) {
  const [inputValue, setInputValue] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  
  const [editDateValue, setEditDateValue] = useState(aiDate || "");
  const [showTooltip, setShowTooltip] = useState(false);
  const [inputCategories, setInputCategories] = useState([]);
  const listRef = useRef(null);
  const itemRefs = useRef({});

  // Orange Highlight & Navigation State
  const storageKey = useMemo(() => {
    const u = currentUser || "user";
    const d = (selectedDate || "date").replace(/\//g, "-");
    return `orbit_orange_${u}_${d}_${columnKey}`;
  }, [currentUser, selectedDate, columnKey]);

  const [orangeIndices, setOrangeIndices] = useState([]);
  const [isOrangeWidgetExpanded, setIsOrangeWidgetExpanded] = useState(false);
  const [currentOrangePos, setCurrentOrangePos] = useState(0);

  // Load orange indices from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setOrangeIndices(parsed);
          }
        } else {
          setOrangeIndices([]);
        }
      } catch (e) {
        setOrangeIndices([]);
      }
    }
  }, [storageKey]);

  const saveOrangeIndices = (newIndices) => {
    setOrangeIndices(newIndices);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(storageKey, JSON.stringify(newIndices));
      } catch (e) {}
    }
  };

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [items]);

  useEffect(() => {
    if (aiDate !== undefined) {
      setEditDateValue(aiDate);
    }
  }, [aiDate]);

  const isAiCount = columnKey === 'aiCount';

  // AI Count Column Toggle State
  const [isAiEnabled, setIsAiEnabled] = useState(true);

  useEffect(() => {
    if (isAiCount && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("orbit_ai_count_enabled");
        if (saved !== null) {
          setIsAiEnabled(saved === "true");
        }
      } catch (e) {}
    }
  }, [isAiCount]);

  const toggleAiEnabled = () => {
    setIsAiEnabled(prev => {
      const next = !prev;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("orbit_ai_count_enabled", String(next));
        } catch (e) {}
      }
      return next;
    });
  };

  const submitDirectly = (val) => {
    if (isReadOnly || !val.trim()) return;
    
    const newItems = val
      .split(/,+/)
      .map(i => i.trim().replace(/^\+\s*/, ''))
      .filter(i => i);
      
    if (newItems.length > 0) {
      onAddItems(newItems, isAiCount ? { categories: inputCategories } : undefined);
    }
    setInputValue("");
    setInputCategories([]);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    submitDirectly(inputValue);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('Text');
    if (!pastedText) return;
    
    const inputEle = e.target;
    const start = inputEle.selectionStart || 0;
    const end = inputEle.selectionEnd || 0;
    
    const newVal = inputValue.substring(0, start) + pastedText + inputValue.substring(end);
    
    if (isAiCount) {
      setInputValue(newVal);
    } else {
      submitDirectly(newVal);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  const toggleSelection = (index) => {
    setSelectedItems(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} item(s)?`)) {
      onDeleteItems(selectedItems);
      
      // Clean up orange indices after deletion
      const remainingOrange = orangeIndices
        .filter(idx => !selectedItems.includes(idx))
        .map(idx => {
          const deletedBefore = selectedItems.filter(dIdx => dIdx < idx).length;
          return idx - deletedBefore;
        });
      saveOrangeIndices(remainingOrange);
      
      setSelectedItems([]);
    }
  };

  const handleToggleOrange = () => {
    if (selectedItems.length === 0) return;
    
    const allSelectedAreOrange = selectedItems.every(idx => orangeIndices.includes(idx));
    let nextOrange;
    
    if (allSelectedAreOrange) {
      // Unmark selected items
      nextOrange = orangeIndices.filter(idx => !selectedItems.includes(idx));
    } else {
      // Mark selected items as orange
      nextOrange = Array.from(new Set([...orangeIndices, ...selectedItems]));
    }
    
    saveOrangeIndices(nextOrange);
    setSelectedItems([]);
  };

  // Valid orange indices within current item range
  const validOrangeIndices = useMemo(() => {
    return orangeIndices.filter(idx => idx < items.length).sort((a, b) => a - b);
  }, [orangeIndices, items.length]);

  const scrollToOrange = (targetOriginalIndex) => {
    const el = itemRefs.current[targetOriginalIndex];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.remove('flash-focus');
      // trigger reflow
      void el.offsetWidth;
      el.classList.add('flash-focus');
      setTimeout(() => {
        if (el) el.classList.remove('flash-focus');
      }, 1800);
    }
  };

  const handleNextOrange = (e) => {
    if (e) e.stopPropagation();
    if (validOrangeIndices.length === 0) return;
    const nextPos = (currentOrangePos + 1) % validOrangeIndices.length;
    setCurrentOrangePos(nextPos);
    scrollToOrange(validOrangeIndices[nextPos]);
  };

  const handlePrevOrange = (e) => {
    if (e) e.stopPropagation();
    if (validOrangeIndices.length === 0) return;
    const prevPos = (currentOrangePos - 1 + validOrangeIndices.length) % validOrangeIndices.length;
    setCurrentOrangePos(prevPos);
    scrollToOrange(validOrangeIndices[prevPos]);
  };

  const filteredItems = useMemo(() => {
    let withIndexes = items.map((item, originalIndex) => ({ item, originalIndex }));
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      withIndexes = withIndexes.filter(({ item }) => {
        const id = typeof item === 'object' ? item.id : item;
        return String(id).toLowerCase().includes(q);
      });
    }

    if (!isAiCount || activeFilter === "All") return withIndexes;
    return withIndexes.filter(({ item }) => typeof item === 'object' && item.categories.includes(activeFilter));
  }, [items, activeFilter, isAiCount, searchQuery]);

  const textToCopy = useMemo(() => {
    if (selectedItems.length > 0) {
      return filteredItems
        .filter(({ originalIndex }) => selectedItems.includes(originalIndex))
        .map(({ item }) => (typeof item === 'object' ? item.id : item))
        .join(', ');
    }
    return filteredItems.map(i => (typeof i.item === 'object' ? i.item.id : i.item)).join(', ');
  }, [selectedItems, filteredItems]);

  const handleDateBlur = () => {
    if (editDateValue !== aiDate && onUpdateAiDate) {
      onUpdateAiDate(editDateValue);
    }
  };

  const toggleInputCategory = (cat) => {
    setInputCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  if (isAiCount && !isAiEnabled) {
    return (
      <div style={{ ...styles.card, opacity: isReadOnly ? 0.7 : 1 }}>
        <div style={styles.header}>
          <div style={styles.titleContainer}>
            <h3 className="column-label" style={{ ...styles.title, opacity: 0.6 }}>{title}</h3>
            <span style={styles.offBadge}>OFF</span>
          </div>
          <div style={styles.headerActions}>
            <div
              onClick={toggleAiEnabled}
              title="Turn AI Count ON"
              style={styles.toggleSwitch}
            >
              <div
                style={{
                  ...styles.toggleThumb,
                  transform: "translateX(0px)"
                }}
              />
            </div>
          </div>
        </div>
        <div style={styles.emptyCardBody}>
          <OrbitMusicPlayer {...musicProps} />
        </div>
      </div>
    );
  }

  return (
    <div style={{...styles.card, opacity: isReadOnly ? 0.7 : 1 }}>
      {aiDate !== undefined && (
        <div style={styles.dateHeader}>
          <input
            type="date"
            value={toDateInput(editDateValue)}
            onClick={(e) => e.target.showPicker && e.target.showPicker()}
            onChange={(e) => {
              const newDate = fromDateInput(e.target.value);
              setEditDateValue(newDate);
            }}
            onBlur={handleDateBlur}
            style={{...styles.dateInput, colorScheme: 'dark'}}
            disabled={isReadOnly}
          />
        </div>
      )}
      <div style={styles.header}>
        <div style={styles.titleContainer}>
          <h3 className="column-label" style={styles.title}>{title}</h3>
          
          {/* Orange Blinking Dot & Expanded Navigation Widget */}
          {validOrangeIndices.length > 0 && selectedItems.length === 0 && (
            <>
              {!isOrangeWidgetExpanded ? (
                <button
                  onClick={() => {
                    setIsOrangeWidgetExpanded(true);
                    scrollToOrange(validOrangeIndices[0]);
                    setCurrentOrangePos(0);
                  }}
                  style={styles.orangeDotBtn}
                  title={`${validOrangeIndices.length} orange marked item(s). Click to navigate.`}
                >
                  <span className="orange-pulse-dot" />
                </button>
              ) : (
                <div style={styles.orangeNavPill}>
                  <span className="orange-pulse-dot" style={{ animation: 'none', width: '6px', height: '6px' }} />
                  <span style={styles.orangeNavText}>
                    {validOrangeIndices.length}
                  </span>
                  <div style={styles.orangeNavArrows}>
                    <button 
                      onClick={handlePrevOrange} 
                      style={styles.orangeArrowBtn} 
                      title="Previous orange number"
                    >
                      <ChevronUp size={13} color="#f97316" />
                    </button>
                    <button 
                      onClick={handleNextOrange} 
                      style={styles.orangeArrowBtn} 
                      title="Next orange number"
                    >
                      <ChevronDown size={13} color="#f97316" />
                    </button>
                  </div>
                  <button 
                    onClick={() => setIsOrangeWidgetExpanded(false)} 
                    style={styles.orangeCloseBtn} 
                    title="Close"
                  >
                    <X size={11} color="var(--muted)" />
                  </button>
                </div>
              )}
            </>
          )}

          {isAiCount && (
            <div 
              style={styles.legendContainer}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <Info size={16} color="var(--muted)" style={{cursor: 'pointer'}} />
              {showTooltip && (
                <div style={styles.tooltip}>
                  <div style={styles.tooltipRow}><span style={{...styles.dot, backgroundColor: "#ef4444"}}/> Category Issues</div>
                  <div style={styles.tooltipRow}><span style={{...styles.dot, backgroundColor: "#eab308"}}/> QC Issues</div>
                  <div style={styles.tooltipRow}><span style={{...styles.dot, backgroundColor: "#22c55e"}}/> Ongoing Issues</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={styles.headerActions}>
          <CopyButton text={textToCopy} size={16} />

          {/* Action Buttons when items are selected */}
          {selectedItems.length > 0 && !isReadOnly && (
            <div style={styles.selectionActions}>
              <button 
                onClick={handleToggleOrange} 
                style={styles.exclamationBtn} 
                title="Mark / Unmark Selected as Orange (Escalated)"
              >
                <AlertTriangle size={15} color="#f97316" />
              </button>
              <button 
                onClick={handleDelete} 
                style={styles.deleteBtn} 
                title="Delete Selected"
              >
                <Trash2 size={15} color="var(--red, #ef4444)" />
              </button>
            </div>
          )}

          <span className="live-counter" style={styles.counter}>{filteredItems.length}</span>

          {/* AI Count Toggle ON/OFF Switch */}
          {isAiCount && (
            <div
              onClick={toggleAiEnabled}
              title="Turn AI Count OFF"
              style={{
                ...styles.toggleSwitch,
                backgroundColor: "var(--accent)"
              }}
            >
              <div
                style={{
                  ...styles.toggleThumb,
                  transform: "translateX(13px)"
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* AI Count Filter Sub-Header Bar */}
      {isAiCount && (
        <div style={styles.filterBar}>
          <button
            onClick={() => setActiveFilter("All")}
            style={{
              ...styles.filterPill,
              ...(activeFilter === "All" ? styles.filterPillActive : {})
            }}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter("Category Issues Found")}
            style={{
              ...styles.filterPill,
              ...(activeFilter === "Category Issues Found" ? styles.filterPillActiveRed : {})
            }}
          >
            🔴 Cat
          </button>
          <button
            onClick={() => setActiveFilter("QC Issues Found")}
            style={{
              ...styles.filterPill,
              ...(activeFilter === "QC Issues Found" ? styles.filterPillActiveYellow : {})
            }}
          >
            🟡 QC
          </button>
          <button
            onClick={() => setActiveFilter("Ongoing Issues Resolved")}
            style={{
              ...styles.filterPill,
              ...(activeFilter === "Ongoing Issues Resolved" ? styles.filterPillActiveGreen : {})
            }}
          >
            🟢 Ongoing
          </button>
        </div>
      )}

      <div style={styles.listContainer} ref={listRef}>
        {filteredItems.map(({ item: itemObj, originalIndex }) => {
          const isObj = typeof itemObj === 'object';
          const id = isObj ? itemObj.id : itemObj;
          const categories = isObj ? itemObj.categories : [];
          const isOrange = orangeIndices.includes(originalIndex);

          return (
            <div 
              key={originalIndex} 
              ref={el => { itemRefs.current[originalIndex] = el; }}
              style={styles.listItem}
              className={isOrange ? "orange-cell-active" : ""}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                {!isReadOnly && (
                  <input 
                    type="checkbox" 
                    checked={selectedItems.includes(originalIndex)}
                    onChange={() => toggleSelection(originalIndex)}
                    style={styles.checkbox}
                  />
                )}
                {editingIndex === originalIndex ? (
                  <input 
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => {
                      if (editValue.trim() !== id) {
                        const cleaned = editValue.trim().replace(/^\+\s*/, '');
                        if (cleaned && onEditItem) onEditItem(originalIndex, cleaned);
                      }
                      setEditingIndex(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.target.blur();
                      if (e.key === 'Escape') setEditingIndex(null);
                    }}
                    autoFocus
                    style={{ ...styles.input, padding: '0.2rem 0.4rem', flex: 1, margin: 0, height: 'auto', fontSize: '0.9rem' }}
                  />
                ) : (
                  <>
                    <span 
                      style={{ 
                        wordBreak: 'break-all', 
                        cursor: isReadOnly ? 'default' : 'pointer', 
                        flex: 1,
                        color: isOrange ? "#ea580c" : "inherit",
                        fontWeight: isOrange ? "600" : "500"
                      }}
                      onClick={() => {
                        if (isReadOnly) return;
                        setEditingIndex(originalIndex);
                        setEditValue(id);
                      }}
                      title={isReadOnly ? "" : "Click to edit"}
                    >
                      {id}
                    </span>
                    {isOrange && (
                      <span title="Escalated / Marked Orange" style={{ display: 'flex', alignItems: 'center' }}>
                        <AlertTriangle size={13} color="#f97316" />
                      </span>
                    )}
                    <CopyButton text={id} />
                  </>
                )}
              </div>
              
              {categories && categories.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {categories.map((cat, i) => {
                    let color = "transparent";
                    if (cat === "Category Issues Found") color = "#ef4444"; // red
                    if (cat === "QC Issues Found") color = "#eab308"; // yellow
                    if (cat === "Ongoing Issues Resolved") color = "#22c55e"; // green
                    return (
                      <span 
                        key={i} 
                        title={cat}
                        style={{
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: color,
                          display: 'inline-block'
                        }} 
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isReadOnly && (
        <div style={styles.inputArea}>
          {isAiCount && (
            <div style={styles.inputCategories}>
              <label style={styles.inputCatLabel}>
                <input type="checkbox" checked={inputCategories.includes("Category Issues Found")} onChange={() => toggleInputCategory("Category Issues Found")} /> 🔴
              </label>
              <label style={styles.inputCatLabel}>
                <input type="checkbox" checked={inputCategories.includes("QC Issues Found")} onChange={() => toggleInputCategory("QC Issues Found")} /> 🟡
              </label>
              <label style={styles.inputCatLabel}>
                <input type="checkbox" checked={inputCategories.includes("Ongoing Issues Resolved")} onChange={() => toggleInputCategory("Ongoing Issues Resolved")} /> 🟢
              </label>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Paste IDs & Enter"
              style={{ ...styles.input, flex: 1 }}
            />
            {inputValue.trim().length > 0 && (
              <button onClick={() => handleSubmit()} style={styles.tickBtn} title="Submit">
                <Check size={16} color="#2ecc71" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    transition: "all 0.2s ease"
  },
  dateHeader: {
    backgroundColor: "var(--bg)",
    padding: "0.25rem",
    borderBottom: "1px solid var(--card-border)",
    display: "flex",
    justifyContent: "center"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem",
    borderBottom: "1px solid var(--card-border)",
    backgroundColor: "var(--bg2)"
  },
  titleContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    flexWrap: "nowrap"
  },
  title: {
    margin: 0
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem"
  },
  actionBtn: {
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.25rem",
    borderRadius: "6px",
    transition: "all 0.2s ease"
  },
  counter: {
    margin: 0,
    color: "var(--text)"
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem"
  },
  selectionActions: {
    display: "flex",
    alignItems: "center",
    gap: "0.65rem",
    backgroundColor: "rgba(249, 115, 22, 0.08)",
    padding: "0.2rem 0.55rem",
    borderRadius: "6px",
    border: "1px solid rgba(249, 115, 22, 0.25)"
  },
  filterBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.3rem 0.5rem",
    backgroundColor: "var(--bg)",
    borderBottom: "1px solid var(--card-border)",
    gap: "0.25rem"
  },
  filterPill: {
    flex: 1,
    padding: "0.22rem 0.35rem",
    fontSize: "0.72rem",
    fontWeight: "600",
    borderRadius: "4px",
    border: "1px solid transparent",
    backgroundColor: "transparent",
    color: "var(--muted)",
    cursor: "pointer",
    textAlign: "center",
    transition: "all 0.15s ease",
    whiteSpace: "nowrap"
  },
  filterPillActive: {
    backgroundColor: "var(--card-bg)",
    color: "var(--text)",
    border: "1px solid var(--card-border)",
    boxShadow: "0 1px 2px rgba(0,0,0,0.08)"
  },
  filterPillActiveRed: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    color: "#ef4444",
    border: "1px solid rgba(239, 68, 68, 0.3)"
  },
  filterPillActiveYellow: {
    backgroundColor: "rgba(234, 179, 8, 0.12)",
    color: "#eab308",
    border: "1px solid rgba(234, 179, 8, 0.3)"
  },
  filterPillActiveGreen: {
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    color: "#22c55e",
    border: "1px solid rgba(34, 197, 94, 0.3)"
  },
  deleteBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.25rem",
    borderRadius: "4px",
    transition: "all 0.2s ease"
  },
  exclamationBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.25rem",
    borderRadius: "4px",
    transition: "all 0.2s ease"
  },
  orangeDotBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2px",
    marginLeft: "2px"
  },
  orangeNavPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    border: "1px solid rgba(249, 115, 22, 0.4)",
    borderRadius: "12px",
    padding: "0.15rem 0.45rem",
    fontSize: "0.72rem",
    fontWeight: "700",
    color: "#ea580c",
    marginLeft: "2px",
    animation: "fadeIn 0.2s ease-out"
  },
  orangeNavText: {
    color: "#ea580c",
    fontWeight: "700",
    fontSize: "0.72rem"
  },
  orangeNavArrows: {
    display: "inline-flex",
    alignItems: "center",
    gap: "1px"
  },
  orangeArrowBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1px",
    borderRadius: "3px",
    transition: "background 0.15s"
  },
  orangeCloseBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1px",
    marginLeft: "1px"
  },
  listContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "0.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem"
  },
  listItem: {
    padding: "0.4rem 0.6rem",
    fontSize: "0.85rem",
    color: "var(--text)",
    borderBottom: "1px solid var(--card-border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    transition: "all 0.2s ease",
    borderRadius: "4px"
  },
  checkbox: {
    cursor: "pointer",
    accentColor: "var(--accent)"
  },
  inputArea: {
    padding: "0.75rem",
    borderTop: "1px solid var(--card-border)",
    backgroundColor: "var(--bg)",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  inputCategories: {
    display: "flex",
    gap: "0.5rem",
    justifyContent: "center",
    marginBottom: "0.25rem"
  },
  inputCatLabel: {
    fontSize: "0.75rem",
    color: "var(--muted)",
    display: "flex",
    alignItems: "center",
    gap: "0.2rem",
    cursor: "pointer",
    transition: "color 0.2s ease"
  },
  input: {
    width: "100%",
    padding: "0.5rem 0.6rem",
    borderRadius: "6px",
    border: "1px solid var(--card-border)",
    backgroundColor: "var(--bg2)",
    color: "var(--text)",
    fontSize: "0.85rem",
    transition: "all 0.2s ease"
  },
  legendContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  tooltip: {
    position: "absolute",
    top: "100%",
    left: "50%",
    transform: "translateX(-50%)",
    marginTop: "0.5rem",
    backgroundColor: "var(--card-bg)",
    backdropFilter: "blur(8px)",
    border: "1px solid var(--card-border)",
    padding: "0.75rem",
    borderRadius: "8px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
    zIndex: 10,
    width: "150px",
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem"
  },
  tooltipRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.75rem",
    color: "var(--text)"
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    display: "inline-block"
  },
  tickBtn: {
    background: "rgba(46, 204, 113, 0.1)",
    border: "1px solid rgba(46, 204, 113, 0.3)",
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background 0.2s"
  },
  dateInput: {
    backgroundColor: "transparent",
    border: "none",
    textAlign: "center",
    color: "var(--muted)",
    fontWeight: "600",
    fontSize: "0.75rem",
    width: "100%",
    outline: "none"
  },
  toggleSwitch: {
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    width: "28px",
    height: "15px",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: "10px",
    padding: "1.5px",
    transition: "all 0.2s ease",
    flexShrink: 0
  },
  toggleThumb: {
    width: "12px",
    height: "12px",
    backgroundColor: "#fff",
    borderRadius: "50%",
    transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 1px 2px rgba(0,0,0,0.3)"
  },
  offBadge: {
    fontSize: "0.68rem",
    fontWeight: "700",
    color: "var(--muted)",
    backgroundColor: "var(--bg)",
    border: "1px solid var(--card-border)",
    padding: "0.1rem 0.35rem",
    borderRadius: "4px",
    letterSpacing: "0.05em"
  },
  emptyCardBody: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "var(--card-bg)"
  }
};
