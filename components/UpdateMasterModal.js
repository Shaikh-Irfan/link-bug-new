import React, { useState } from 'react';
import { X, Save, RefreshCw, AlertTriangle, PlusCircle } from 'lucide-react';

export default function UpdateMasterModal({ isOpen, onClose, metrics, date, onSubmit, isDateMissing, onCreateColumn }) {
  const [additionalWork, setAdditionalWork] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const success = await onSubmit({ ...metrics, additionalWork });
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Update Master Sheet ({date})</h2>
          <button onClick={onClose} style={styles.closeBtn} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        <div style={styles.content}>
          <p style={styles.description}>
            The following metrics have been calculated from today's ATM sheet and Global Tickets:
          </p>

          <div style={styles.metricsList}>
            <div style={styles.metricItem}>
              <span>Chat Count</span>
              <strong>{metrics.chatCount}</strong>
            </div>
            <div style={styles.metricItem}>
              <span>Calls answered</span>
              <strong>{metrics.callsAnswered}</strong>
            </div>
            <div style={styles.metricItem}>
              <span>Calls unanswered</span>
              <strong>{metrics.callsUnanswered}</strong>
            </div>
            <div style={styles.metricItem}>
              <span>New issues checked</span>
              <strong>{metrics.newIssuesChecked}</strong>
            </div>
            <div style={styles.metricItem}>
              <span>Checked issues from other filters</span>
              <strong>{metrics.checkedIssuesOtherFilters}</strong>
            </div>
            <div style={styles.metricItem}>
              <span>Tickets created/updated</span>
              <strong>{metrics.ticketsCreatedUpdated}</strong>
            </div>
            <div style={styles.metricItem}>
              <span>Issues solved</span>
              <strong>{metrics.issuesSolved}</strong>
            </div>
            <div style={styles.metricItem}>
              <span>Tags assigned</span>
              <strong>{metrics.tagsAssigned}</strong>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Additional work</label>
            <textarea
              value={additionalWork}
              onChange={(e) => setAdditionalWork(e.target.value)}
              placeholder="Describe any additional work done today..."
              style={styles.textarea}
              rows={3}
              disabled={isSubmitting}
            />
          </div>
          
          {isDateMissing && (
            <div style={styles.warningBanner}>
              <AlertTriangle size={20} color="#f39c12" />
              <div style={styles.warningText}>
                <strong>Date Column Missing</strong>
                <p>The column for {date} does not exist in the Master Sheet yet.</p>
              </div>
              <button 
                onClick={async () => {
                  setIsSubmitting(true);
                  await onCreateColumn();
                  setIsSubmitting(false);
                }} 
                style={styles.createBtn}
                disabled={isSubmitting}
              >
                <PlusCircle size={16} />
                Add Column
              </button>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn} disabled={isSubmitting}>Cancel</button>
          <button onClick={handleSubmit} style={styles.submitBtn} disabled={isSubmitting || isDateMissing}>
            {isSubmitting ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
            {isSubmitting ? "Updating..." : "Update Master Sheet"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  },
  modal: {
    backgroundColor: 'var(--bg2)',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '500px',
    border: '1px solid var(--card-border)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid var(--card-border)'
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text)'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--muted)',
    cursor: 'pointer',
    padding: '0.25rem'
  },
  content: {
    padding: '1.5rem',
    overflowY: 'auto'
  },
  description: {
    margin: '0 0 1.25rem 0',
    fontSize: '0.9rem',
    color: 'var(--muted)',
    lineHeight: '1.5'
  },
  metricsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    backgroundColor: 'var(--bg)',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid var(--card-border)'
  },
  metricItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.95rem',
    color: 'var(--text)',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid rgba(255,255,255,0.05)'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text)'
  },
  textarea: {
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid var(--card-border)',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
    fontSize: '0.95rem',
    resize: 'vertical',
    outline: 'none',
    fontFamily: 'inherit'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    padding: '1.25rem 1.5rem',
    borderTop: '1px solid var(--card-border)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderBottomLeftRadius: '12px',
    borderBottomRightRadius: '12px'
  },
  cancelBtn: {
    padding: '0.6rem 1.25rem',
    backgroundColor: 'transparent',
    color: 'var(--text)',
    border: '1px solid var(--card-border)',
    borderRadius: '6px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  submitBtn: {
    padding: '0.6rem 1.25rem',
    backgroundColor: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  warningBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
    border: '1px solid #f39c12',
    padding: '1rem',
    borderRadius: '8px',
    marginTop: '1.5rem'
  },
  warningText: {
    flex: 1,
    color: 'var(--text)'
  },
  createBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#f39c12',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    whiteSpace: 'nowrap'
  }
};
