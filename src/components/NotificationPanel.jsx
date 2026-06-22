import React, { useEffect, useState, useCallback } from "react";
import api from "../api.js";

const PAGE_LIMIT = 15;

const fmt = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function NotificationPanel() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { type: "success"|"error", text }

  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const { data } = await api.get("/notifications", {
        params: { page, limit: PAGE_LIMIT },
      });
      setHistory(data.data);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      /* silent */
    } finally {
      setLoadingHistory(false);
    }
  }, [page]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleSend = async (e) => {
    e.preventDefault();
    setResult(null);
    if (!title.trim() || !message.trim()) {
      setResult({ type: "error", text: "Title aur message dono zaroori hain." });
      return;
    }
    setSending(true);
    try {
      const { data } = await api.post("/notifications/send", {
        title: title.trim(),
        message: message.trim(),
        link: link.trim(),
      });
      const s = data.summary;
      const txt = s.noTokensMessage
        ? s.noTokensMessage
        : `✅ Bhej diya! ${s.successCount} device${s.successCount === 1 ? "" : "s"} ko mila, ${s.failureCount} fail.`;
      setResult({ type: "success", text: txt });
      setTitle("");
      setMessage("");
      setLink("");
      setPage(1);
      fetchHistory();
    } catch (err) {
      setResult({ type: "error", text: err.response?.data?.message || "Kuch masla ho gaya, dobara try karein." });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yeh notification history se hata dein?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/notifications/${id}`);
      fetchHistory();
    } catch {
      alert("Delete nahi ho saka.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>Sab registered users ko push notification bhejein</p>
        </div>
      </div>

      {/* ── Compose box ── */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div style={{ padding: "20px 22px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Naya notification</div>
        </div>
        <form onSubmit={handleSend} style={{ padding: "20px 22px" }}>
          {result && (
            <div className={result.type === "success" ? "success-banner" : "error-banner"}
              style={{ marginBottom: 16 }}>
              {result.text}
            </div>
          )}

          <div className="field">
            <label>Title</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification ka headline…"
              maxLength={100}
              required
            />
            <div className="helper-text">{title.length}/100</div>
          </div>

          <div className="field">
            <label>Message</label>
            <textarea
              className="textarea"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Notification ka mazmoon likhein…"
              maxLength={300}
              required
            />
            <div className="helper-text">{message.length}/300</div>
          </div>

          <div className="field">
            <label>Link <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
            <input
              className="input"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://… ya koi deep link (notification tap karne par khulega)"
            />
            <div className="helper-text">
              Khaali chhod dein agar sirf notification dikhani ho, kuch kholna na ho.
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button className="btn btn-primary" type="submit" disabled={sending}>
              {sending ? "Bhej raha hai…" : "📣 Sab users ko bhejein"}
            </button>
          </div>
        </form>
      </div>

      {/* ── History ── */}
      <div className="card">
        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)", fontWeight: 700, fontSize: 15 }}>
          History <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: 13 }}>({total} total)</span>
        </div>

        {loadingHistory ? (
          <div className="empty-state">Loading…</div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <div className="big">Abhi tak koi notification nahi bheji</div>
            <p>Upar form se pehli notification bhejein.</p>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Title / Message</th>
                  <th>Link</th>
                  <th style={{ width: 130 }}>Devices</th>
                  <th style={{ width: 140 }}>Sent at</th>
                  <th style={{ width: 70 }}></th>
                </tr>
              </thead>
              <tbody>
                {history.map((n) => (
                  <tr key={n._id}>
                    <td>
                      <div className="q-text">{n.title}</div>
                      <div className="a-text">{n.message}</div>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 160 }}>
                      {n.link ? (
                        <a href={n.link} target="_blank" rel="noreferrer"
                          style={{ color: "var(--accent)", wordBreak: "break-all" }}>
                          {n.link}
                        </a>
                      ) : "—"}
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>
                        <span style={{ color: "var(--success)", fontWeight: 700 }}>✓ {n.successCount}</span>
                        {n.failureCount > 0 && (
                          <span style={{ color: "var(--danger)", marginLeft: 8 }}>✗ {n.failureCount}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{n.sentCount} total</div>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmt(n.createdAt)}</td>
                    <td>
                      <button
                        className="btn-danger-text btn-sm"
                        onClick={() => handleDelete(n._id)}
                        disabled={deletingId === n._id}
                      >
                        {deletingId === n._id ? "…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pages > 1 && (
              <div className="pagination">
                <span>Page {page} of {pages}</span>
                <div className="pages">
                  <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </button>
                  <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
