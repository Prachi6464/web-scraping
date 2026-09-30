import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

function AuthModal({ isOpen, onClose }) {
  const { login, register, authError, clearError } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  if (!isOpen) return null;

  const handleTabSwitch = (toRegister) => {
    setIsRegister(toRegister);
    setLocalError("");
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!email.trim() || !password.trim()) {
      setLocalError("Please fill out all required fields.");
      return;
    }

    if (isRegister && !name.trim()) {
      setLocalError("Please enter your full name.");
      return;
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    let result;
    if (isRegister) {
      result = await register(name.trim(), email.trim(), password);
    } else {
      result = await login(email.trim(), password);
    }
    setSubmitting(false);

    if (result?.success) {
      setName("");
      setEmail("");
      setPassword("");
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-card" onClick={(e) => e.stopPropagation()}>
        <div className="auth-card-header">
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab-btn ${!isRegister ? "active" : ""}`}
              onClick={() => handleTabSwitch(false)}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${isRegister ? "active" : ""}`}
              onClick={() => handleTabSwitch(true)}
            >
              Create Account
            </button>
          </div>
          <button className="icon-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        <div className="auth-card-body">
          <div className="auth-welcome-text">
            <h3>{isRegister ? "Join DataCrawl" : "Welcome Back"}</h3>
            <p>
              {isRegister
                ? "Create an account to keep track of your scraped web data and analytics."
                : "Sign in with your email and password to access your dashboard."}
            </p>
          </div>

          {(localError || authError) && (
            <div className="alert-box alert-error">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{localError || authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {isRegister && (
              <div className="form-group">
                <label htmlFor="reg-name">Full Name</label>
                <div className="input-with-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    id="reg-name"
                    type="text"
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    disabled={submitting}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="auth-email">Email Address</label>
              <div className="input-with-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  id="auth-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="auth-password">Password</label>
              <div className="input-with-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isRegister ? "Minimum 6 characters" : "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? (
                <span className="btn-spinner-wrap">
                  <span className="spinner-dots"></span>
                  Processing...
                </span>
              ) : isRegister ? (
                "Create Free Account"
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
