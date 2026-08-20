import { useState } from "react";
import { X, Copy, Check } from "lucide-react";

export default function TodayUpdateModal({ isOpen, onClose, dailyLogs, tickets, selectedDate, currentUser }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Calculate counts
  const newIssues = dailyLogs.newIssuesChecked?.length || 0;
  const issuesResolved = dailyLogs.issuesResolved?.length || 0;
  const callsAnswered = dailyLogs.callsAnswered?.length || 0;
  const callsUnanswered = dailyLogs.callsUnanswered?.length || 0;
  const checkedFilters = dailyLogs.checkedFilters?.length || 0;
  
  const ticketsCreated = tickets.filter(t => t.date === selectedDate && t.created_by === currentUser).length;
  const chatCount = dailyLogs.chatCountUpdated?.length || 0;
  const tagsAssigned = dailyLogs.tagsAssigned?.length || 0;

  const aiTotal = dailyLogs.aiCount?.length || 0;
  
  let catIssues = 0;
  let qcIssues = 0;
  let ongoingIssues = 0;
  
  if (dailyLogs.aiCount) {
    dailyLogs.aiCount.forEach(item => {
      if (item.categories) {
        if (item.categories.includes("Category Issues Found")) catIssues++;
        if (item.categories.includes("QC Issues Found")) qcIssues++;
        if (item.categories.includes("Ongoing Issues Resolved")) ongoingIssues++;
      }
    });
  }

  const formatNum = (num) => num.toString().padStart(2, '0');

  const updateText = `*Update for Today*
* New issues checked - ${formatNum(newIssues)}
* Issues resolved - ${formatNum(issuesResolved)}
* Calls answered - ${formatNum(callsAnswered)}
* Calls unanswered - ${callsUnanswered}
* Checked issues from other filters - ${formatNum(checkedFilters)}
* Tickets created- ${formatNum(ticketsCreated)}
* Chat count updated - ${chatCount}
* Tags assigned - ${tagsAssigned}

*AI chat scan*
✅ Total AI Chats Scanned: ${formatNum(aiTotal)}
🔴 Category Issues Found: ${formatNum(catIssues)}
🟡 QC Issues Found: ${qcIssues}
🟢 Ongoing Issues Resolved: ${ongoingIssues}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(updateText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 className="section-header" style={{ margin: 0 }}>Today's Update</h2>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={20} color="var(--text)" />
          </button>
        </div>
        
        <div style={styles.content}>
          <div style={styles.textContainer}>
            <pre style={styles.pre}>{updateText}</pre>
            <button 
              onClick={handleCopy} 
              style={styles.copyBtn} 
              title="Copy to clipboard"
            >
              {copied ? <Check size={18} color="#2ecc71" /> : <Copy size={18} color="var(--text)" />}
            </button>
          </div>
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
    maxWidth: "500px",
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.25rem 1.5rem",
    borderBottom: "1px solid var(--card-border)",
    backgroundColor: "rgba(255, 255, 255, 0.02)"
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
    cursor: "pointer"
  },
  content: {
    padding: "1.5rem",
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
  }
};
