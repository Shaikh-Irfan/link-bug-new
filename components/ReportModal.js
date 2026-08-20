import { useState, useMemo } from "react";
import { X, Copy, Check, FileText, ArrowLeft } from "lucide-react";

export default function ReportModal({ isOpen, onClose, tickets, selectedDate, uniqueCreators, uniquePriorities, uniqueTags }) {
  const [activeTab, setActiveTab] = useState('today');
  const [copied, setCopied] = useState(false);

  // Overall Tickets filter states
  const [ticketDateMode, setTicketDateMode] = useState("Single");
  const [ticketDateFilter, setTicketDateFilter] = useState("All");
  const [ticketStartDateFilter, setTicketStartDateFilter] = useState("");
  const [ticketEndDateFilter, setTicketEndDateFilter] = useState("");
  const [ticketCreatorFilter, setTicketCreatorFilter] = useState("All");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("All");
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState("All");
  const [ticketTagFilter, setTicketTagFilter] = useState("All");
  const [ticketEscalatedFilter, setTicketEscalatedFilter] = useState("All");
  
  const [generatedReport, setGeneratedReport] = useState(null);

  if (!isOpen) return null;

  const toDateInput = (dStr) => dStr ? dStr.split('/').reverse().join('-') : "";
  const fromDateInput = (dStr) => dStr ? dStr.split('-').reverse().join('/') : "";

  const generateReportText = (filteredTickets, headerTitle) => {
    const totalCount = filteredTickets.length;
    let updateText = `*${headerTitle}*\n*Total Issues: ${totalCount}*\n\n`;
    if (totalCount === 0) {
      updateText += `No tickets found.\n`;
    } else {
      filteredTickets.forEach((t, i) => {
        updateText += `${i + 1}. Name - ${t.title}\n`;
        updateText += `     Ticket link - ${t.clickup_url}\n`;
        updateText += `     Status - ${t.status}\n`;
        
        if (t.priority && t.priority.name) {
          updateText += `     Priority - ${t.priority.name}\n`;
        }
        
        if (t.tags && t.tags.length > 0) {
          const tagsStr = t.tags.map(tag => typeof tag === 'string' ? tag : tag.name).join(', ');
          updateText += `     Tags - ${tagsStr}\n`;
        }
        
        updateText += `\n`;
      });
    }
    return updateText.trimEnd();
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // --- Today's Tickets Logic ---
  const todayTickets = tickets.filter(t => t.date === selectedDate);
  const todayReportText = generateReportText(todayTickets, "Tickets created today");

  // --- Overall Tickets Logic ---
  const handleGenerateOverallReport = () => {
    const filtered = tickets.filter(t => {
      const creatorStr = String(t.created_by || "");
      const dateStr = String(t.date || "");

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
      const matchStatus = ticketStatusFilter === "All" || t.status === ticketStatusFilter;
      const matchPriority = ticketPriorityFilter === "All" || (t.priority && t.priority.name === ticketPriorityFilter);
      const matchTag = ticketTagFilter === "All" || (t.tags && t.tags.some(tag => (typeof tag === 'string' ? tag : tag.name) === ticketTagFilter));
      
      let matchEscalated = true;
      if (ticketEscalatedFilter === "Yes") matchEscalated = t.escalated === true;
      if (ticketEscalatedFilter === "No") matchEscalated = !t.escalated;
      
      return matchDate && matchCreator && matchStatus && matchPriority && matchTag && matchEscalated;
    });

    let header = "Overall Tickets Report";
    if (ticketDateFilter !== "All" && ticketDateMode === "Single") header += ` for ${ticketDateFilter}`;
    if (ticketCreatorFilter !== "All") header += ` by ${ticketCreatorFilter}`;

    setGeneratedReport(generateReportText(filtered, header));
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => { setActiveTab('today'); setGeneratedReport(null); }}
              style={{
                ...styles.tabButton,
                color: activeTab === 'today' ? 'var(--text)' : 'var(--muted)',
                borderBottom: activeTab === 'today' ? '2px solid var(--accent)' : '2px solid transparent'
              }}
            >
              Today's Tickets ({todayTickets.length})
            </button>
            <button
              onClick={() => setActiveTab('overall')}
              style={{
                ...styles.tabButton,
                color: activeTab === 'overall' ? 'var(--text)' : 'var(--muted)',
                borderBottom: activeTab === 'overall' ? '2px solid var(--accent)' : '2px solid transparent'
              }}
            >
              Overall Tickets
            </button>
          </div>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={20} color="var(--text)" />
          </button>
        </div>
        
        <div style={styles.content}>
          {activeTab === 'today' ? (
            <div style={styles.textContainer}>
              <pre style={styles.pre}>{todayReportText}</pre>
              <button onClick={() => handleCopy(todayReportText)} style={styles.copyBtn} title="Copy to clipboard">
                {copied ? <Check size={18} color="#2ecc71" /> : <Copy size={18} color="var(--text)" />}
              </button>
            </div>
          ) : (
            <div>
              {generatedReport ? (
                <div>
                  <button 
                    onClick={() => setGeneratedReport(null)} 
                    style={styles.backBtn}
                  >
                    <ArrowLeft size={16} /> Back to Filters
                  </button>
                  <div style={styles.textContainer}>
                    <pre style={styles.pre}>{generatedReport}</pre>
                    <button onClick={() => handleCopy(generatedReport)} style={styles.copyBtn} title="Copy to clipboard">
                      {copied ? <Check size={18} color="#2ecc71" /> : <Copy size={18} color="var(--text)" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  
                  {/* Filters */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>Select Filters</h3>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setTicketDateMode(ticketDateMode === "Single" ? "Range" : "Single")}
                        style={styles.filterBtn}
                      >
                        {ticketDateMode === "Single" ? "Single Date" : "Date Range"}
                      </button>

                      {ticketDateMode === "Single" ? (
                        <input
                          type={ticketDateFilter === "All" ? "text" : "date"}
                          placeholder="Select Date"
                          value={ticketDateFilter === "All" ? "" : toDateInput(ticketDateFilter)}
                          onFocus={(e) => { e.target.type = 'date'; }}
                          onClick={(e) => { e.target.type = 'date'; try { e.target.showPicker && e.target.showPicker(); } catch(err) {} }}
                          onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                          onChange={(e) => setTicketDateFilter(e.target.value ? fromDateInput(e.target.value) : "All")}
                          style={styles.filterInput}
                        />
                      ) : (
                        <div style={{ display: 'flex' }}>
                          <input
                            type={ticketStartDateFilter ? "date" : "text"}
                            placeholder="From"
                            value={ticketStartDateFilter ? toDateInput(ticketStartDateFilter) : ""}
                            onFocus={(e) => { e.target.type = 'date'; }}
                            onClick={(e) => { e.target.type = 'date'; try { e.target.showPicker && e.target.showPicker(); } catch(err) {} }}
                            onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                            onChange={(e) => setTicketStartDateFilter(fromDateInput(e.target.value))}
                            style={{ ...styles.filterInput, borderRight: 'none', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                          />
                          <input
                            type={ticketEndDateFilter ? "date" : "text"}
                            placeholder="To"
                            value={ticketEndDateFilter ? toDateInput(ticketEndDateFilter) : ""}
                            onFocus={(e) => { e.target.type = 'date'; }}
                            onClick={(e) => { e.target.type = 'date'; try { e.target.showPicker && e.target.showPicker(); } catch(err) {} }}
                            onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                            onChange={(e) => setTicketEndDateFilter(fromDateInput(e.target.value))}
                            style={{ ...styles.filterInput, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                          />
                        </div>
                      )}

                      <select
                        value={ticketCreatorFilter}
                        onChange={(e) => setTicketCreatorFilter(e.target.value)}
                        style={styles.filterInput}
                      >
                        <option value="All">All Creators</option>
                        {uniqueCreators.map(creator => (
                          <option key={creator} value={creator}>{creator}</option>
                        ))}
                      </select>

                      <select
                        value={ticketStatusFilter}
                        onChange={(e) => setTicketStatusFilter(e.target.value)}
                        style={styles.filterInput}
                      >
                        <option value="All">All Statuses</option>
                        <option value="Not Started">Not Started</option>
                        <option value="Active">Active</option>
                        <option value="Done">Done</option>
                      </select>

                      <select
                        value={ticketPriorityFilter}
                        onChange={(e) => setTicketPriorityFilter(e.target.value)}
                        style={styles.filterInput}
                      >
                        <option value="All">All Priorities</option>
                        {(uniquePriorities || []).map(p => <option key={p} value={p}>{p}</option>)}
                      </select>

                      <select
                        value={ticketTagFilter}
                        onChange={(e) => setTicketTagFilter(e.target.value)}
                        style={styles.filterInput}
                      >
                        <option value="All">All Tags</option>
                        {(uniqueTags || []).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>

                      <select
                        value={ticketEscalatedFilter}
                        onChange={(e) => setTicketEscalatedFilter(e.target.value)}
                        style={styles.filterInput}
                      >
                        <option value="All">All Escalated</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>

                  <button onClick={handleGenerateOverallReport} style={styles.generateBtn}>
                    <FileText size={18} />
                    Generate Report
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(9, 9, 11, 0.8)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  },
  modal: {
    backgroundColor: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "600px",
    minHeight: "400px",
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 1.5rem 0",
    borderBottom: "1px solid var(--card-border)",
    backgroundColor: "rgba(255, 255, 255, 0.02)"
  },
  tabButton: {
    background: 'none',
    border: 'none',
    padding: '0.8rem 1rem',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '-1px' // overlap border
  },
  closeButton: {
    padding: "0.4rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    backgroundColor: "var(--bg)",
    border: "1px solid var(--card-border)",
    transition: "all 0.2s ease",
    cursor: "pointer",
    marginBottom: '0.5rem'
  },
  content: {
    padding: "1.5rem",
    maxHeight: "70vh",
    overflowY: "auto"
  },
  textContainer: {
    position: "relative",
    backgroundColor: "var(--bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "12px",
    padding: "1.25rem",
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)"
  },
  pre: {
    margin: 0,
    fontFamily: "var(--font-body), monospace",
    fontSize: "0.95rem",
    color: "var(--text)",
    whiteSpace: "pre-wrap",
    lineHeight: "1.6"
  },
  copyBtn: {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    background: "var(--bg2)",
    border: "1px solid var(--card-border)",
    borderRadius: "8px",
    padding: "0.5rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease"
  },
  filterBtn: {
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
    border: '1px solid var(--card-border)',
    borderRadius: '8px',
    padding: '0.5rem 0.8rem',
    fontSize: '0.9rem',
    cursor: 'pointer',
    colorScheme: 'dark'
  },
  filterInput: {
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
    border: '1px solid var(--card-border)',
    borderRadius: '8px',
    padding: '0.5rem 0.8rem',
    fontSize: '0.9rem',
    colorScheme: 'dark'
  },
  generateBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    width: '100%',
    padding: '0.8rem',
    backgroundColor: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s ease'
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.9rem',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
    border: '1px solid var(--card-border)',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '1rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  }
};
