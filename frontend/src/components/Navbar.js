import React from "react";
import { useAuth } from "../context/AuthContext";

function Navbar({ onOpenAuth, onRefresh, refreshLoading, onOpenAdmin }) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="brand-section">
          <div className="brand-logo">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <div className="brand-title-wrap">
              <span className="brand-title">DataCrawl</span>
              <span className="badge-academic">MERN Project</span>
              {isAdmin && <span className="badge-admin-tag">Admin</span>}
            </div>
            <p className="brand-tagline">Automated Headless Web Scraper & Metadata Extractor</p>
          </div>
        </div>

        <div className="header-actions">
          {isAdmin && (
            <button
              className="btn btn-admin-accent btn-sm"
              onClick={onOpenAdmin}
              title="Open Admin Portal to view users and update tasks"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Admin Portal</span>
            </button>
          )}

          <button
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            disabled={refreshLoading}
            title="Refresh Scrape Records"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={refreshLoading ? "spin-animation" : ""}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>{refreshLoading ? "Syncing..." : "Sync"}</span>
          </button>

          {user ? (
            <div className="user-profile-widget">
              <div className={`user-avatar ${isAdmin ? "user-avatar-admin" : ""}`} title={user.name}>
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="user-meta">
                <span className="user-name">
                  {user.name} {isAdmin ? "(Admin)" : ""}
                </span>
                <span className="user-email">{user.email}</span>
              </div>
              <button
                className="btn btn-danger-outline btn-sm"
                onClick={logout}
                title="Log out from session"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Login / Register</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
