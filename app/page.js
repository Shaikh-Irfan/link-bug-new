"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    if (!user) {
      setError("Please select your name.");
      return;
    }
    if (password !== "Link&Bug") {
      setError("Invalid password.");
      return;
    }
    // Simple state locking by passing user as a query parameter for now
    router.push(`/dashboard?user=${encodeURIComponent(user)}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginCard}>
        <h1 className="page-title" style={styles.title}>Link&Bug</h1>
        <p className="section-header" style={styles.subtitle}>Operations Portal</p>
        
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label className="column-label" htmlFor="userSelect">Operator Name</label>
            <select 
              id="userSelect"
              value={user} 
              onChange={(e) => setUser(e.target.value)}
              style={styles.input}
            >
              <option value="" disabled>Select User</option>
              <option value="Irfan">Irfan</option>
              <option value="Priyal">Priyal</option>
              <option value="Jeffin">Jeffin</option>
              <option value="Sneha">Sneha</option>
              <option value="Payal">Payal</option>
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label className="column-label" htmlFor="passwordInput">Access Code</label>
            <input 
              id="passwordInput"
              type="password" 
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button}>Authenticate</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    width: "100vw",
    backgroundColor: "var(--bg)"
  },
  loginCard: {
    backgroundColor: "var(--card-bg)",
    padding: "3rem",
    borderRadius: "12px",
    border: "1px solid var(--card-border)",
    width: "100%",
    maxWidth: "400px",
    textAlign: "center"
  },
  title: {
    marginBottom: "0.5rem"
  },
  subtitle: {
    color: "var(--muted)",
    marginBottom: "2rem"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem"
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    textAlign: "left",
    gap: "0.5rem"
  },
  input: {
    padding: "0.75rem 1rem",
    borderRadius: "6px",
    border: "1px solid var(--card-border)",
    backgroundColor: "var(--bg)",
    color: "var(--text)",
    fontSize: "1rem"
  },
  button: {
    marginTop: "1rem",
    padding: "0.75rem",
    borderRadius: "6px",
    backgroundColor: "var(--text)",
    color: "var(--bg)",
    fontFamily: "'Inter', sans-serif",
    fontWeight: "600",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "opacity 0.2s"
  },
  error: {
    color: "#ff6b6b",
    fontSize: "0.875rem",
    textAlign: "left",
    marginTop: "-1rem"
  }
};
