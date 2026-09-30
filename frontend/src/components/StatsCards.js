import React from "react";

function StatsCards({ scrapes }) {
  const totalScrapes = scrapes.length;
  const successfulScrapes = scrapes.filter((s) => s.status === "success").length;
  const failedScrapes = scrapes.filter((s) => s.status === "failed").length;

  const successRate =
    totalScrapes > 0 ? Math.round((successfulScrapes / totalScrapes) * 100) : 0;

  const totalHeadings = scrapes.reduce(
    (acc, curr) => acc + (curr.headings ? curr.headings.length : 0),
    0
  );

  const totalLinks = scrapes.reduce(
    (acc, curr) => acc + (curr.links ? curr.links.length : 0),
    0
  );

  const totalImages = scrapes.reduce(
    (acc, curr) => acc + (curr.images ? curr.images.length : 0),
    0
  );

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon-wrapper stat-blue">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-label">Total Scraped</span>
          <div className="stat-value">{totalScrapes}</div>
          <span className="stat-subtext">{failedScrapes} failed attempts</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper stat-green">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-label">Success Rate</span>
          <div className="stat-value">{successRate}%</div>
          <span className="stat-subtext">{successfulScrapes} completed</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper stat-purple">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4 7 4 4 20 4 20 7" />
            <line x1="9" y1="20" x2="15" y2="20" />
            <line x1="12" y1="4" x2="12" y2="20" />
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-label">Headings Indexed</span>
          <div className="stat-value">{totalHeadings.toLocaleString()}</div>
          <span className="stat-subtext">H1, H2 & H3 tags parsed</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper stat-amber">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-label">Links & Media</span>
          <div className="stat-value">{(totalLinks + totalImages).toLocaleString()}</div>
          <span className="stat-subtext">{totalLinks} links, {totalImages} images</span>
        </div>
      </div>
    </div>
  );
}

export default StatsCards;
