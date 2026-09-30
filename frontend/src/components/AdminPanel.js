import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const ADMIN_URL = (process.env.REACT_APP_API_BASE || "http://localhost:5000/api/scrape").replace(
  /\/scrape$/,
  "/admin"
);

function AdminPanel({ isOpen, onClose, onNotify }) {
  const [activeTab, setActiveTab] = useState("master");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter for Master Data
  const [userSearch, setUserSearch] = useState("");

  // Search & Filter for Tasks
  const [taskSearch, setTaskSearch] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("all");

  // Selected user drill-down state (Viewing specific user's scrapes)
  const [selectedUserScrapes, setSelectedUserScrapes] = useState(null);
  const [drillDownLoading, setDrillDownLoading] = useState(false);

  // Edit Task Modal State
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStatus, setEditStatus] = useState("success");
  const [editPriority, setEditPriority] = useState("normal");
  const [editNotes, setEditNotes] = useState("");
  const [savingTask, setSavingTask] = useState(false);

  // Fetch admin stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${ADMIN_URL}/stats`);
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load stats:", err.message);
    }
  }, []);

  // Fetch users with full master scraping numbers
  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${ADMIN_URL}/users`);
      setUsers(res.data);
    } catch (err) {
      if (onNotify) onNotify("Failed to retrieve user accounts.", "error");
    }
  }, [onNotify]);

  // Fetch all tasks
  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get(`${ADMIN_URL}/tasks`);
      setTasks(res.data);
    } catch (err) {
      if (onNotify) onNotify("Failed to retrieve system tasks.", "error");
    }
  }, [onNotify]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchUsers(), fetchTasks()]);
    setLoading(false);
  }, [fetchStats, fetchUsers, fetchTasks]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  if (!isOpen) return null;

  // Open Edit Task Dialog
  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setEditTitle(task.title || "");
    setEditStatus(task.status || "success");
    setEditPriority(task.priority || "normal");
    setEditNotes(task.notes || "");
  };

  // Submit Task Updates
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;

    setSavingTask(true);
    try {
      const res = await axios.put(`${ADMIN_URL}/tasks/${editingTask._id}`, {
        title: editTitle,
        status: editStatus,
        priority: editPriority,
        notes: editNotes,
      });

      setTasks((prev) =>
        prev.map((t) => (t._id === editingTask._id ? res.data.task : t))
      );

      // If user drill down is open, update there too
      if (selectedUserScrapes) {
        setSelectedUserScrapes((prev) => ({
          ...prev,
          scrapes: prev.scrapes.map((s) => (s._id === editingTask._id ? res.data.task : s)),
        }));
      }

      setEditingTask(null);
      fetchStats();
      fetchUsers();
      if (onNotify) onNotify("Task updated successfully by Administrator!", "success");
    } catch (err) {
      if (onNotify) onNotify("Failed to update task.", "error");
    } finally {
      setSavingTask(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await axios.delete(`${ADMIN_URL}/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      if (selectedUserScrapes) {
        setSelectedUserScrapes((prev) => ({
          ...prev,
          scrapes: prev.scrapes.filter((s) => s._id !== taskId),
        }));
      }
      fetchStats();
      fetchUsers();
      if (onNotify) onNotify("Task deleted successfully.", "success");
    } catch (err) {
      if (onNotify) onNotify("Failed to delete task.", "error");
    }
  };

  // Delete User Account
  const handleDeleteUser = async (userId, userEmail) => {
    if (userEmail === "admin@college.edu") {
      alert("Cannot delete the primary administrator account.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete user "${userEmail}" and all their tasks?`
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${ADMIN_URL}/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      fetchTasks();
      fetchStats();
      if (onNotify) onNotify(`User "${userEmail}" deleted successfully.`, "success");
    } catch (err) {
      if (onNotify) onNotify(err.response?.data?.message || "Failed to delete user.", "error");
    }
  };

  // View specific user's scraping records (Drill-down)
  const handleInspectUserScrapes = async (userId) => {
    setDrillDownLoading(true);
    try {
      const res = await axios.get(`${ADMIN_URL}/users/${userId}/scrapes`);
      setSelectedUserScrapes(res.data);
    } catch (err) {
      if (onNotify) onNotify("Failed to load user's scrapes.", "error");
    } finally {
      setDrillDownLoading(false);
    }
  };

  // Export Master Data as CSV
  const handleExportMasterCSV = () => {
    if (!users.length) return;

    const headers = [
      "Name",
      "Email",
      "Role",
      "Total Scrapes",
      "Successful Scrapes",
      "Failed Scrapes",
      "Extracted Links",
      "Extracted Images",
      "Last Scraped At",
      "Registered Date",
    ];

    const rows = users.map((u) => [
      `"${(u.name || "").replace(/"/g, '""')}"`,
      `"${(u.email || "").replace(/"/g, '""')}"`,
      u.role || "user",
      u.totalScrapes || 0,
      u.successfulScrapes || 0,
      u.failedScrapes || 0,
      u.totalLinks || 0,
      u.totalImages || 0,
      u.lastScrapedAt ? `"${new Date(u.lastScrapedAt).toLocaleString()}"` : `"Never"`,
      `"${new Date(u.createdAt).toLocaleString()}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `master_users_scraping_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onNotify) onNotify("Master Data CSV report downloaded!", "success");
  };

  // Filter users for Master Data
  const filteredUsers = users.filter((u) => {
    const term = userSearch.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term))
    );
  });

  // Filter tasks list
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      (t.title && t.title.toLowerCase().includes(taskSearch.toLowerCase())) ||
      (t.url && t.url.toLowerCase().includes(taskSearch.toLowerCase())) ||
      (t.user?.email && t.user.email.toLowerCase().includes(taskSearch.toLowerCase())) ||
      (t.notes && t.notes.toLowerCase().includes(taskSearch.toLowerCase()));

    const matchesStatus =
      taskStatusFilter === "all" ? true : t.status === taskStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-modal-header">
          <div className="admin-header-title-wrap">
            <div className="admin-badge-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h2>Administrator Master Control Panel</h2>
              <p>Master Data: User scraping metrics, account management, and task updates</p>
            </div>
          </div>
          <button className="icon-close-btn" onClick={onClose} aria-label="Close admin modal">
            &times;
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="admin-tabs-bar">
          <button
            className={`admin-tab-item ${activeTab === "master" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("master");
              setSelectedUserScrapes(null);
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Master Data (Users & Scraping Numbers)</span>
          </button>

          <button
            className={`admin-tab-item ${activeTab === "tasks" ? "active" : ""}`}
            onClick={() => setActiveTab("tasks")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span>All Tasks & Updates ({tasks.length})</span>
          </button>

          <button
            className={`admin-tab-item ${activeTab === "stats" ? "active" : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>System Analytics</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="admin-modal-body">
          {loading ? (
            <div className="admin-loading-wrap">
              <div className="scrape-loading-spinner"></div>
              <span>Loading administrative master records...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: MASTER DATA (ALL USERS & THEIR SCRAPING NUMBERS) */}
              {activeTab === "master" && (
                <div className="admin-pane">
                  {/* Master Data Header Toolbar */}
                  <div className="admin-toolbar">
                    <div className="table-search-input">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                    </div>

                    <div className="export-actions" style={{ marginLeft: "auto" }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={handleExportMasterCSV}
                        title="Export complete master users report to CSV"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>Export Master CSV</span>
                      </button>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={loadData}
                        title="Reload all master data"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>

                  {/* MASTER USERS & SCRAPING NUMBERS TABLE */}
                  <div className="responsive-table-wrapper">
                    <table className="modern-table admin-table">
                      <thead>
                        <tr>
                          <th>User Profile</th>
                          <th>Role</th>
                          <th>Total Scrapes</th>
                          <th>Success / Failed</th>
                          <th>Extracted Assets</th>
                          <th>Last Activity</th>
                          <th>Joined Date</th>
                          <th className="actions-header">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => (
                          <tr key={u._id}>
                            <td>
                              <div className="user-profile-widget" style={{ border: "none", padding: 0 }}>
                                <div
                                  className={`user-avatar ${u.role === "admin" ? "user-avatar-admin" : ""}`}
                                  style={{ width: 28, height: 28, fontSize: "0.75rem" }}
                                >
                                  {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                                </div>
                                <div className="user-meta">
                                  <strong className="user-name">{u.name}</strong>
                                  <span className="user-email">{u.email}</span>
                                </div>
                              </div>
                            </td>

                            <td>
                              <span
                                className={`badge-pill ${
                                  u.role === "admin" ? "badge-success" : "badge-academic"
                                }`}
                              >
                                {u.role === "admin" ? "Admin" : "Student / User"}
                              </span>
                            </td>

                            <td>
                              <span className="summary-chip" style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                                {u.totalScrapes || 0} Scrapes
                              </span>
                            </td>

                            <td>
                              <div style={{ display: "flex", gap: 6, fontSize: "0.78rem" }}>
                                <span style={{ color: "#065f46", fontWeight: 600 }}>
                                  ✓ {u.successfulScrapes || 0}
                                </span>
                                <span style={{ color: "#991b1b", fontWeight: 600 }}>
                                  ✗ {u.failedScrapes || 0}
                                </span>
                              </div>
                            </td>

                            <td>
                              <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                                <div><strong>{u.totalLinks || 0}</strong> Links</div>
                                <div><strong>{u.totalImages || 0}</strong> Images</div>
                              </div>
                            </td>

                            <td>
                              <span style={{ fontSize: "0.78rem" }}>
                                {u.lastScrapedAt
                                  ? new Date(u.lastScrapedAt).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "No scrapes yet"}
                              </span>
                            </td>

                            <td>
                              <span style={{ fontSize: "0.78rem" }}>
                                {new Date(u.createdAt).toLocaleDateString()}
                              </span>
                            </td>

                            <td className="col-actions">
                              <div className="action-buttons-group">
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleInspectUserScrapes(u._id)}
                                  title="View all individual scrapes by this user"
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                  </svg>
                                  <span>View Scrapes</span>
                                </button>

                                {u.email !== "admin@college.edu" && (
                                  <button
                                    className="btn btn-danger-outline btn-sm"
                                    onClick={() => handleDeleteUser(u._id, u.email)}
                                    title="Delete this user account"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* USER SCRAPES DRILL-DOWN SUBPANEL */}
                  {drillDownLoading && (
                    <div className="admin-loading-wrap" style={{ padding: "20px 0" }}>
                      <div className="scrape-loading-spinner"></div>
                      <span>Loading user's individual scrapes...</span>
                    </div>
                  )}

                  {selectedUserScrapes && !drillDownLoading && (
                    <div className="user-drilldown-card">
                      <div className="user-drilldown-header">
                        <div>
                          <h4>
                            Individual Scrapes by: <strong>{selectedUserScrapes.user.name}</strong> ({selectedUserScrapes.user.email})
                          </h4>
                          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            Total Records: {selectedUserScrapes.scrapes.length}
                          </p>
                        </div>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedUserScrapes(null)}
                        >
                          Close User Scrapes
                        </button>
                      </div>

                      {!selectedUserScrapes.scrapes.length ? (
                        <p style={{ padding: 16, color: "var(--text-muted)", fontSize: "0.85rem" }}>
                          This user has not performed any web scraping tasks yet.
                        </p>
                      ) : (
                        <div className="responsive-table-wrapper">
                          <table className="modern-table admin-table">
                            <thead>
                              <tr>
                                <th>Target Page & URL</th>
                                <th>Status</th>
                                <th>Headings</th>
                                <th>Links</th>
                                <th>Images</th>
                                <th>Scraped Date</th>
                                <th className="actions-header">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedUserScrapes.scrapes.map((s) => (
                                <tr key={s._id}>
                                  <td className="col-title-url">
                                    <div className="title-text">{s.title || "Untitled"}</div>
                                    <a
                                      href={s.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="url-subtext"
                                    >
                                      {s.url}
                                    </a>
                                  </td>
                                  <td>
                                    <span className={`badge-pill badge-${s.status}`}>
                                      <span className="badge-dot"></span>
                                      {s.status}
                                    </span>
                                  </td>
                                  <td>{s.headings ? s.headings.length : 0}</td>
                                  <td>{s.links ? s.links.length : 0}</td>
                                  <td>{s.images ? s.images.length : 0}</td>
                                  <td>{new Date(s.createdAt).toLocaleString()}</td>
                                  <td className="col-actions">
                                    <div className="action-buttons-group">
                                      <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleOpenEdit(s)}
                                        title="Update task status or notes"
                                      >
                                        Update
                                      </button>
                                      <button
                                        className="btn btn-danger-outline btn-sm"
                                        onClick={() => handleDeleteTask(s._id)}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MANAGE ALL TASKS */}
              {activeTab === "tasks" && (
                <div className="admin-pane">
                  <div className="admin-toolbar">
                    <div className="table-search-input">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search tasks by title, URL, or owner..."
                        value={taskSearch}
                        onChange={(e) => setTaskSearch(e.target.value)}
                      />
                    </div>

                    <div className="table-filter-select">
                      <select
                        value={taskStatusFilter}
                        onChange={(e) => setTaskStatusFilter(e.target.value)}
                      >
                        <option value="all">All Statuses</option>
                        <option value="success">Success</option>
                        <option value="failed">Failed</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In-Progress</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={fetchTasks}
                      title="Reload tasks"
                      style={{ marginLeft: "auto" }}
                    >
                      Refresh Tasks
                    </button>
                  </div>

                  {!filteredTasks.length ? (
                    <div className="table-empty-state">
                      <p>No tasks found matching your criteria.</p>
                    </div>
                  ) : (
                    <div className="responsive-table-wrapper">
                      <table className="modern-table admin-table">
                        <thead>
                          <tr>
                            <th>Task Title & URL</th>
                            <th>Owner / Creator</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Admin Notes</th>
                            <th className="actions-header">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTasks.map((task) => (
                            <tr key={task._id}>
                              <td className="col-title-url">
                                <div className="title-text" title={task.title}>
                                  {task.title || "Untitled Webpage"}
                                </div>
                                <span className="url-subtext" title={task.url}>
                                  {task.url}
                                </span>
                              </td>

                              <td>
                                {task.user ? (
                                  <div className="user-pill-tag">
                                    <strong>{task.user.name}</strong>
                                    <span className="text-muted">{task.user.email}</span>
                                  </div>
                                ) : (
                                  <span className="guest-badge-tag">Guest Visitor</span>
                                )}
                              </td>

                              <td>
                                <span className={`badge-pill badge-${task.status}`}>
                                  <span className="badge-dot"></span>
                                  {task.status}
                                </span>
                              </td>

                              <td>
                                <span className={`priority-tag priority-${task.priority || "normal"}`}>
                                  {task.priority || "normal"}
                                </span>
                              </td>

                              <td style={{ maxWidth: 180 }}>
                                <span className="admin-notes-preview" title={task.notes}>
                                  {task.notes || <span className="text-muted italic">No notes</span>}
                                </span>
                              </td>

                              <td className="col-actions">
                                <div className="action-buttons-group">
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleOpenEdit(task)}
                                    title="Update task details and status"
                                  >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                    <span>Update</span>
                                  </button>
                                  <button
                                    className="btn btn-danger-outline btn-sm"
                                    onClick={() => handleDeleteTask(task._id)}
                                    title="Delete task"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SYSTEM ANALYTICS */}
              {activeTab === "stats" && stats && (
                <div className="admin-pane">
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon-wrapper stat-purple">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </div>
                      <div className="stat-content">
                        <span className="stat-label">Total Users</span>
                        <div className="stat-value">{stats.totalUsers}</div>
                        <span className="stat-subtext">Registered student accounts</span>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon-wrapper stat-blue">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 11 12 14 22 4" />
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                      </div>
                      <div className="stat-content">
                        <span className="stat-label">Total Tasks</span>
                        <div className="stat-value">{stats.totalTasks}</div>
                        <span className="stat-subtext">System-wide crawl jobs</span>
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
                        <span className="stat-label">Completed Tasks</span>
                        <div className="stat-value">{stats.successfulTasks}</div>
                        <span className="stat-subtext">Cleanly extracted</span>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon-wrapper stat-amber">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      </div>
                      <div className="stat-content">
                        <span className="stat-label">Active Guest Items</span>
                        <div className="stat-value">{stats.activeGuestTasks}</div>
                        <span className="stat-subtext">1-hour auto-expiring</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="admin-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close Portal
          </button>
        </div>

        {/* SUB-MODAL: UPDATE TASK */}
        {editingTask && (
          <div className="submodal-backdrop" onClick={() => setEditingTask(null)}>
            <div className="task-edit-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="task-edit-header">
                <h3>Update Scraping Task</h3>
                <button className="icon-close-btn" onClick={() => setEditingTask(null)}>
                  &times;
                </button>
              </div>

              <form onSubmit={handleSaveTask} className="task-edit-form">
                <div className="form-group">
                  <label>Target URL</label>
                  <input
                    type="text"
                    value={editingTask.url}
                    disabled
                    style={{ background: "#f1f5f9", cursor: "not-allowed" }}
                  />
                </div>

                <div className="form-group">
                  <label>Task Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Task Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <option value="success">Success / Completed</option>
                      <option value="failed">Failed</option>
                      <option value="pending">Pending</option>
                      <option value="in-progress">In-Progress</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Administrator Notes / Review Comments</label>
                  <textarea
                    rows="3"
                    placeholder="Enter review notes, issues found, or status remarks..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  ></textarea>
                </div>

                <div className="task-edit-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditingTask(null)}
                    disabled={savingTask}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingTask}
                  >
                    {savingTask ? "Saving Updates..." : "Save Task Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
