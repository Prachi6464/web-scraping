import React, { useState } from "react";

function ResultsTable({ scrapes, onView, onDelete, onNotify, isUserLoggedIn }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredScrapes = scrapes.filter((item) => {
    const matchesSearch =
      (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.url && item.url.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ? true : item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate time remaining before auto-deletion
  const getExpiryLabel = (expireAt) => {
    if (!expireAt) return null;
    const diffMs = new Date(expireAt).getTime() - Date.now();
    if (diffMs <= 0) return "Expiring now";
    const minutes = Math.floor(diffMs / (1000 * 60));
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      return `Expires in ~${hours}h`;
    }
    return `Expires in ~${minutes}m`;
  };

  // Export filtered data as CSV
  const handleExportCSV = () => {
    if (!filteredScrapes.length) return;

    const headers = [
      "Title",
      "URL",
      "Status",
      "Retention Policy",
      "Headings Count",
      "Links Count",
      "Images Count",
      "Scraped At",
    ];
    const rows = filteredScrapes.map((s) => [
      `"${(s.title || "Untitled").replace(/"/g, '""')}"`,
      `"${s.url.replace(/"/g, '""')}"`,
      s.status,
      s.expireAt ? `"Guest (1h Auto-delete)"` : `"Permanent (Saved to Account)"`,
      s.headings ? s.headings.length : 0,
      s.links ? s.links.length : 0,
      s.images ? s.images.length : 0,
      `"${new Date(s.createdAt).toLocaleString()}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `scraped_data_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onNotify) onNotify("CSV file downloaded successfully!", "success");
  };

  // Export filtered data as JSON
  const handleExportJSON = () => {
    if (!filteredScrapes.length) return;

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(filteredScrapes, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `scraped_data_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (onNotify) onNotify("JSON file downloaded successfully!", "success");
  };

  return (
    <div className="table-card">
      <div className="table-card-header">
        <div className="table-header-info">
          <h3>
            {isUserLoggedIn ? "My Saved Scrapes" : "Guest Scrape Session"}
          </h3>
          <span className="table-count-badge">
            {filteredScrapes.length} of {scrapes.length} records
          </span>
        </div>

        <div className="table-toolbar">
          <div className="table-search-input">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by title or URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchTerm("")}
              >
                &times;
              </button>
            )}
          </div>

          <div className="table-filter-select">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter records by status"
            >
              <option value="all">All Status</option>
              <option value="success">Success Only</option>
              <option value="failed">Failed Only</option>
            </select>
          </div>

          <div className="export-actions">
            <button
              className="btn btn-outline btn-sm"
              onClick={handleExportCSV}
              disabled={!filteredScrapes.length}
              title="Download results as CSV"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>CSV</span>
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleExportJSON}
              disabled={!filteredScrapes.length}
              title="Download results as JSON"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {!scrapes.length ? (
        <div className="table-empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <h4>
            {isUserLoggedIn ? "No Scrapes Saved Yet" : "No Active Guest Scrapes"}
          </h4>
          <p>
            {isUserLoggedIn
              ? "You haven't scraped any URLs yet. Enter a website URL above to save it permanently to your account."
              : "Submit a website URL to test. Guest scrapes are automatically cleaned up after 1 hour."}
          </p>
        </div>
      ) : !filteredScrapes.length ? (
        <div className="table-empty-state">
          <h4>No Matches Found</h4>
          <p>Try adjusting your search keywords or status filter.</p>
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 12 }}
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="responsive-table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Page Title & URL</th>
                <th>Status</th>
                <th>Storage Retention</th>
                <th>Extracted Elements</th>
                <th>Scraped Date</th>
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredScrapes.map((s) => {
                const expiryText = getExpiryLabel(s.expireAt);

                return (
                  <tr key={s._id}>
                    <td className="col-title-url">
                      <div className="title-text" title={s.title}>
                        {s.title || "Untitled Webpage"}
                      </div>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="url-subtext"
                        title={s.url}
                      >
                        <span>{s.url}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    </td>

                    <td>
                      <span className={`badge-pill badge-${s.status}`}>
                        <span className="badge-dot"></span>
                        {s.status === "success" ? "Completed" : "Failed"}
                      </span>
                    </td>

                    <td>
                      {s.expireAt ? (
                        <span className="badge-retention badge-expiry" title="Automatic 1-hour guest TTL deletion">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>{expiryText || "Expires in 1h"}</span>
                        </span>
                      ) : (
                        <span className="badge-retention badge-permanent" title="Permanently saved to user account">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                          <span>Permanent</span>
                        </span>
                      )}
                    </td>

                    <td>
                      {s.status === "success" ? (
                        <div className="elements-summary">
                          <span className="summary-chip" title="Extracted Headings">
                            <strong>{s.headings ? s.headings.length : 0}</strong> Headings
                          </span>
                          <span className="summary-chip" title="Extracted Links">
                            <strong>{s.links ? s.links.length : 0}</strong> Links
                          </span>
                          <span className="summary-chip" title="Extracted Images">
                            <strong>{s.images ? s.images.length : 0}</strong> Images
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted error-label" title={s.errorMessage}>
                          {s.errorMessage || "Crawler error"}
                        </span>
                      )}
                    </td>

                    <td className="col-timestamp">
                      <div className="timestamp-date">
                        {new Date(s.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="timestamp-time">
                        {new Date(s.createdAt).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    <td className="col-actions">
                      <div className="action-buttons-group">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onView(s._id)}
                          title="View scraped elements in detail"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          <span>Details</span>
                        </button>
                        <button
                          className="btn btn-danger-outline btn-sm"
                          onClick={() => onDelete(s._id)}
                          title="Delete this record"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ResultsTable;
