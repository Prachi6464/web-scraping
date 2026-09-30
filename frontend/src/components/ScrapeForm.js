import React, { useState } from "react";

function ScrapeForm({ onScrape, loading }) {
  const [url, setUrl] = useState("");

  const sampleUrls = [
    { label: "Wikipedia (Node.js)", url: "https://en.wikipedia.org/wiki/Node.js" },
    { label: "GitHub (About)", url: "https://github.com/about" },
    { label: "Hacker News", url: "https://news.ycombinator.com" },
    { label: "Example Domain", url: "https://example.com" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim() || loading) return;
    onScrape(url.trim());
  };

  const handleSelectSample = (sampleUrl) => {
    setUrl(sampleUrl);
  };

  return (
    <div className="scraper-box">
      <div className="scraper-box-header">
        <div>
          <h2>Initiate Web Scraping</h2>
          <p>
            Enter any public website URL. Our headless Chromium crawler will render JavaScript, extract
            page headings, hyperlinks, images, and metadata.
          </p>
        </div>
      </div>

      <form className="scrape-form" onSubmit={handleSubmit}>
        <div className="input-group-field">
          <span className="input-prefix-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </span>
          <input
            type="url"
            placeholder="https://example.com or any website URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            required
          />
          {url && !loading && (
            <button
              type="button"
              className="clear-input-btn"
              onClick={() => setUrl("")}
              aria-label="Clear input"
            >
              &times;
            </button>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-scrape" disabled={loading || !url.trim()}>
          {loading ? (
            <>
              <span className="spinner-dots"></span>
              <span>Scraping...</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Extract Data</span>
            </>
          )}
        </button>
      </form>

      {/* College Viva Demo Shortcuts */}
      <div className="sample-links-bar">
        <span className="sample-label">Quick Test URLs:</span>
        <div className="sample-pills">
          {sampleUrls.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              className="sample-pill-btn"
              onClick={() => handleSelectSample(sample.url)}
              disabled={loading}
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="scrape-loading-banner">
          <div className="scrape-loading-spinner"></div>
          <div className="scrape-loading-text">
            <strong>Headless Chromium is rendering page contents...</strong>
            <p>Evaluating DOM trees, executing client-side scripts, and parsing resources.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScrapeForm;
