"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

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
  if (!yyyymmdd) return "";
  const parts = yyyymmdd.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return "";
};

export default function AddTicketModal({ isOpen, onClose, onSubmit, currentUser, initialData, selectedDate }) {
  const [clickUpUrl, setClickUpUrl] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Not Started");
  const [ticketDate, setTicketDate] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setClickUpUrl(initialData.clickup_url || "");
        setTitle(initialData.title || "");
        setStatus(initialData.status || "Not Started");
        setTicketDate(initialData.date || selectedDate || "");
        setComment(initialData.comment || "");
      } else {
        setClickUpUrl("");
        setTitle("");
        setStatus("Not Started");
        setTicketDate(selectedDate || "");
        setComment("");
      }
    }
  }, [isOpen, initialData, selectedDate]);

  if (!isOpen) return null;

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setClickUpUrl(url);

    if (!title) {
      const match = url.match(/\/t\/(?:[a-zA-Z0-9]+\/)?([a-zA-Z0-9]+)$/);
      if (match && match[1]) {
        setTitle(`Ticket - ${match[1]}`);
      } else {
        const parts = url.split('/');
        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart.length > 4) {
          setTitle(`Ticket - ${lastPart}`);
        }
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clickUpUrl || !title) return;

    onSubmit({
      id: initialData?.id,
      created_by: initialData ? initialData.created_by : currentUser,
      date: ticketDate,
      title,
      clickup_url: clickUpUrl,
      status,
      comment
    });
    
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 className="section-header" style={{ margin: 0 }}>
            {initialData ? "Edit Ticket" : "Add New Ticket"}
          </h2>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={20} color="var(--text)" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label className="column-label" htmlFor="date">Date</label>
            <input
              id="date"
              type="date"
              required
              value={toDateInput(ticketDate)}
              onChange={(e) => {
                const newDate = fromDateInput(e.target.value);
                setTicketDate(newDate);
              }}
              style={{...styles.input, colorScheme: 'dark'}}
            />
          </div>

          <div style={styles.inputGroup}>
            <label className="column-label" htmlFor="url">ClickUp URL</label>
            <input
              id="url"
              type="text"
              required
              value={clickUpUrl}
              onChange={handleUrlChange}
              placeholder="https://app.clickup.com/t/..."
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label className="column-label" htmlFor="title">Ticket Title</label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ticket Description"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label className="column-label" htmlFor="status">Optional Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={styles.input}
            >
              <option value="Not Started">Not Started</option>
              <option value="Active">Active</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label className="column-label" htmlFor="comment">Comment (Optional)</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add your comment here..."
              style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <button type="submit" style={styles.submitBtn}>
            {initialData ? "Save Changes" : "Create Ticket"}
          </button>
        </form>
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
    maxWidth: "480px",
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
    transition: "all 0.2s ease"
  },
  form: {
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem"
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  input: {
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    border: "1px solid var(--card-border)",
    backgroundColor: "var(--bg)",
    color: "var(--text)",
    transition: "all 0.2s ease"
  },
  submitBtn: {
    marginTop: "0.5rem",
    padding: "0.85rem",
    borderRadius: "8px",
    backgroundColor: "var(--text)",
    color: "var(--bg)",
    fontWeight: "600",
    fontSize: "0.95rem",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px rgba(255,255,255,0.1)"
  }
};
