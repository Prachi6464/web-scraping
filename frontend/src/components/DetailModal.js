import React, { useState, useEffect, useCallback } from "react";

function DetailModal({ scrape, onClose, onNotify }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [linksFilter, setLinksFilter] = useState("");
  const [copiedLink, setCopiedLink] = useState("");

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!scrape) return null;

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(text);
    setTimeout(() => setCopiedLink(""), 2000);
    if (onNotify) onNotify(`${label || "Content"} copied to clipboard!`, "info");
  };

  const filteredLinks = (scrape.links || []).filter((l) =>
    l.toLowerCase().includes(linksFilter.toLowerCase())
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="detail-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="detail-modal-header">
          <div className="header-meta">
            <span className={`badge-pill badge-${scrape.status}`}>
              {scrape.status === "success" ? "Scrape Succeeded" : "Scrape Failed"}
            </span>
            {scrape.expireAt ? (
              <span className="badge-retention badge-expiry">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Guest • 1h Auto-Delete</span>
              </span>
            ) : (
              <span className="badge-retention badge-permanent">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Permanent Account Storage</span>
              </span>
            )}
            <span className="timestamp-badge">
              {new Date(scrape.createdAt).toLocaleString()}
            </span>
          </div>
          <button className="icon-close-btn" onClick={onClose} aria-label="Close dialog">
            &times;
          </button>
        </div>

        <div className="detail-title-banner">
          <h2 className="modal-page-title">{scrape.title || "Untitled Page"}</h2>
          <div className="modal-url-row">
            <a
              href={scrape.url}
              target="_blank"
              rel="noopener noreferrer"
              className="modal-external-link"
            >
              <span>{scrape.url}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
            <button
              className="btn-copy-sm"
              onClick={() => copyToClipboard(scrape.url, "URL")}
              title="Copy URL"
            >
              {copiedLink === scrape.url ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="detail-tabs">
          <button
            className={`detail-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`detail-tab-btn ${activeTab === "headings" ? "active" : ""}`}
            onClick={() => setActiveTab("headings")}
          >
            Headings ({scrape.headings?.length || 0})
          </button>
          <button
            className={`detail-tab-btn ${activeTab === "links" ? "active" : ""}`}
            onClick={() => setActiveTab("links")}
          >
            Links ({scrape.links?.length || 0})
          </button>
          <button
            className={`detail-tab-btn ${activeTab === "images" ? "active" : ""}`}
            onClick={() => setActiveTab("images")}
          >
            Images ({scrape.images?.length || 0})
          </button>
          <button
            className={`detail-tab-btn ${activeTab === "json" ? "active" : ""}`}
            onClick={() => setActiveTab("json")}
          >
            Raw JSON
          </button>
        </div>

        <div className="detail-modal-body">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="tab-pane">
              {scrape.status === "failed" ? (
                <div className="alert-box alert-error">
                  <strong>Scraping Failure Error:</strong>
                  <p>{scrape.errorMessage || "Unknown scraper error occurred."}</p>
                </div>
              ) : (
                <>
                  <div className="overview-section">
                    <h4>Meta Description</h4>
                    <p className="description-text">
                      {scrape.description || (
                        <span className="text-muted italic">
                          No meta description or open-graph description found on this webpage.
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="overview-stats-grid">
                    <div className="overview-stat-box">
                      <span className="stat-number">{scrape.headings?.length || 0}</span>
                      <span className="stat-desc">Headings Extracted</span>
                    </div>
                    <div className="overview-stat-box">
                      <span className="stat-number">{scrape.links?.length || 0}</span>
                      <span className="stat-desc">Hyperlinks Discovered</span>
                    </div>
                    <div className="overview-stat-box">
                      <span className="stat-number">{scrape.images?.length || 0}</span>
                      <span className="stat-desc">Media Images Found</span>
                    </div>
                  </div>

                  <div className="overview-section">
                    <h4>Document & Retention Details</h4>
                    <ul className="summary-checklist">
                      <li>Render engine: <strong>Chromium Headless</strong> via Puppeteer</li>
                      <li>Client-side JavaScript evaluation: <strong>Enabled</strong></li>
                      <li>
                        Retention Policy:{" "}
                        {scrape.expireAt ? (
                          <strong style={{ color: "#d97706" }}>
                            Temporary Guest Pass (Auto-deletes at {new Date(scrape.expireAt).toLocaleTimeString()})
                          </strong>
                        ) : (
                          <strong style={{ color: "#10b981" }}>
                            Permanent (Linked to User Account)
                          </strong>
                        )}
                      </li>
                      <li>Scrape ID: <code>{scrape._id}</code></li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: HEADINGS */}
          {activeTab === "headings" && (
            <div className="tab-pane">
              {!scrape.headings?.length ? (
                <p className="empty-tab-text">No H1, H2, or H3 headings detected on this webpage.</p>
              ) : (
                <div className="headings-list">
                  {scrape.headings.map((heading, idx) => (
                    <div key={idx} className="heading-item">
                      <span className="heading-index">#{idx + 1}</span>
                      <span className="heading-content">{heading}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LINKS */}
          {activeTab === "links" && (
            <div className="tab-pane">
              {!scrape.links?.length ? (
                <p className="empty-tab-text">No hyperlinks found on this webpage.</p>
              ) : (
                <>
                  <div className="tab-filter-bar">
                    <input
                      type="text"
                      placeholder="Filter links..."
                      value={linksFilter}
                      onChange={(e) => setLinksFilter(e.target.value)}
                    />
                    <span className="filter-count">
                      Showing {filteredLinks.length} of {scrape.links.length}
                    </span>
                  </div>

                  <div className="links-list">
                    {filteredLinks.map((link, idx) => (
                      <div key={idx} className="link-item-row">
                        <span className="link-index">{idx + 1}.</span>
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-url-text"
                          title={link}
                        >
                          {link}
                        </a>
                        <div className="link-item-actions">
                          <button
                            className="btn-copy-sm"
                            onClick={() => copyToClipboard(link, "Link")}
                          >
                            {copiedLink === link ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 4: IMAGES */}
          {activeTab === "images" && (
            <div className="tab-pane">
              {!scrape.images?.length ? (
                <p className="empty-tab-text">No image sources found on this webpage.</p>
              ) : (
                <div className="images-grid">
                  {scrape.images.map((src, idx) => (
                    <div key={idx} className="image-card">
                      <div className="image-thumbnail-wrap">
                        <img
                          src={src}
                          alt={`Scraped asset ${idx + 1}`}
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%23ccc'><rect width='100' height='100' fill='%23eee'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='12'>Image Preview</text></svg>";
                          }}
                        />
                      </div>
                      <div className="image-card-footer">
                        <span className="image-url-preview" title={src}>
                          {src.split("/").pop() || "Image"}
                        </span>
                        <a
                          href={src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-link-icon"
                          title="Open original image"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: RAW JSON */}
          {activeTab === "json" && (
            <div className="tab-pane">
              <div className="json-toolbar">
                <span>Raw Record Document (JSON format)</span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    copyToClipboard(JSON.stringify(scrape, null, 2), "Full JSON document")
                  }
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy JSON</span>
                </button>
              </div>
              <pre className="json-pre-viewer">
                {JSON.stringify(scrape, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="detail-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default DetailModal;
