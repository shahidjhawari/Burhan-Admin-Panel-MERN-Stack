import React, { useEffect, useState, useCallback } from "react";
import api from "../api.js";

const PAGE_LIMIT = 10;

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export default function UserList() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/users", {
        params: { page, limit: PAGE_LIMIT, search: search || undefined },
      });
      setItems(data.data);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user profile? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete this user.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p>{total} registered user{total === 1 ? "" : "s"} and their reading progress</p>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <input
            className="input"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>

        {error && (
          <div style={{ padding: "16px 18px" }}>
            <div className="error-banner" style={{ margin: 0 }}>
              {error}
            </div>
          </div>
        )}

        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="big">No users yet</div>
            <p>Profiles created from the Android app will show up here.</p>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th style={{ width: 160 }}>XP / Level / Title</th>
                  <th>Joined</th>
                  <th style={{ width: 220 }}>Reading progress</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((user) => {
                  const isComplete = user.percentage >= 100;
                  return (
                    <tr key={user._id}>
                      <td>
                        <div className="user-cell">
                          {user.image ? (
                            <img className="avatar" src={user.image} alt="" />
                          ) : (
                            <div className="avatar-fallback">{initials(user.name) || "?"}</div>
                          )}
                          <div>
                            <div className="q-text">{user.name}</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{
                              background: "var(--ink)", color: "#fff",
                              fontSize: 10, fontWeight: 700, padding: "2px 7px",
                              borderRadius: 5, fontFamily: "var(--font-mono)"
                            }}>
                              L{user.level || 1}
                            </span>
                            <span style={{ fontWeight: 700, fontSize: 13 }}>
                              {(user.xp || 0).toLocaleString()} XP
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {user.title || "طالبِ علم"}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="progress-cell">
                          <div className="progress-track">
                            <div
                              className={`progress-fill ${isComplete ? "complete" : ""}`}
                              style={{ width: `${Math.min(100, user.percentage)}%` }}
                            />
                          </div>
                          <span className={`progress-label ${isComplete ? "complete" : ""}`}>
                            {isComplete
                              ? "100% completed 🎉"
                              : `${user.completedCount || user.readCount || 0} of ${user.totalQuestions} (${user.percentage}%)`}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn-danger-text btn-sm"
                          onClick={() => handleDelete(user._id)}
                          disabled={deletingId === user._id}
                        >
                          {deletingId === user._id ? "…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="pagination">
              <span>
                Page {page} of {pages}
              </span>
              <div className="pages">
                <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
