import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import StatsCards from "./components/StatsCards";
import ScrapeForm from "./components/ScrapeForm";
import ResultsTable from "./components/ResultsTable";
import DetailModal from "./components/DetailModal";
import AuthModal from "./components/AuthModal";
import AdminPanel from "./components/AdminPanel";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api/scrape";

function MainDashboard() {
  const { user, isAdmin } = useAuth();
  const [scrapes, setScrapes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast notification helper
  const addToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const fetchScrapes = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshLoading(true);
    try {
      const res = await axios.get(API_BASE);
      setScrapes(res.data);
    } catch (err) {
      addToast(
        err.response?.data?.message || "Failed to load scrape records from database.",
        "error"
      );
    } finally {
      if (!isSilent) setRefreshLoading(false);
    }
  }, [addToast]);

  // Re-fetch scrapes whenever user logs in or logs out
  useEffect(() => {
    fetchScrapes(true);
  }, [user, fetchScrapes]);

  const handleScrape = async (url) => {
    setLoading(true);
    try {
      const res = await axios.post(API_BASE, { url });
      setScrapes((prev) => [res.data, ...prev]);
      if (user) {
        addToast("Webpage crawled and permanently saved to your account!", "success");
      } else {
        addToast(
          "Webpage crawled! (Guest record: will auto-delete in 1 hour)",
          "info"
        );
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Scraping failed. The target website might be unreachable or blocking automated requests.";
      addToast(msg, "error");
      fetchScrapes(true);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/${id}`);
      setSelected(res.data);
    } catch (err) {
      addToast("Failed to fetch detailed records for this entry.", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this scrape record?")) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/${id}`);
      setScrapes((prev) => prev.filter((s) => s._id !== id));
      addToast("Scrape record deleted successfully.", "success");
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to delete record. Please check permissions.";
      addToast(msg, "error");
    }
  };

  return (
    <div className="app-root">
      <Navbar
        onOpenAuth={() => setAuthModalOpen(true)}
        onRefresh={() => fetchScrapes(false)}
        refreshLoading={refreshLoading}
        onOpenAdmin={() => setAdminModalOpen(true)}
      />

      <main className="main-layout">
        {/* Workspace Storage Policy Banner */}
        {user ? (
          <div className="storage-banner banner-authenticated">
            <div className="banner-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="banner-content">
              <strong>{isAdmin ? "Administrator Workspace" : "Private Account Workspace"}:</strong>{" "}
              {isAdmin
                ? "You have administrator privileges. You can manage student accounts and update tasks from the Admin Portal above."
                : "You are viewing your personal scraping records. All data is saved permanently to your profile."}
            </div>
            {isAdmin && (
              <button
                className="btn btn-admin-accent btn-sm"
                onClick={() => setAdminModalOpen(true)}
              >
                Open Admin Portal
              </button>
            )}
          </div>
        ) : (
          <div className="storage-banner banner-guest">
            <div className="banner-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="banner-content">
              <strong>Guest Mode Active:</strong> You can scrape any website without logging in. Guest data is temporary and will <strong>automatically be deleted after 1 hour</strong>.
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setAuthModalOpen(true)}
            >
              Sign In to Save Permanently
            </button>
          </div>
        )}

        <section className="hero-header">
          <h1 className="hero-title">Web Scraping & Analytics Dashboard</h1>
          <p className="hero-subtitle">
            Extract, inspect, and export structured DOM elements, headings, hyperlinks, and images from any webpage.
          </p>
        </section>

        <StatsCards scrapes={scrapes} />

        <ScrapeForm onScrape={handleScrape} loading={loading} />

        <ResultsTable
          scrapes={scrapes}
          onView={handleView}
          onDelete={handleDelete}
          onNotify={addToast}
          isUserLoggedIn={Boolean(user)}
        />
      </main>

      <DetailModal
        scrape={selected}
        onClose={() => setSelected(null)}
        onNotify={addToast}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Admin Control Center Modal */}
      {isAdmin && (
        <AdminPanel
          isOpen={adminModalOpen}
          onClose={() => {
            setAdminModalOpen(false);
            fetchScrapes(true);
          }}
          onNotify={addToast}
        />
      )}

      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item toast-${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainDashboard />
    </AuthProvider>
  );
}

export default App;
