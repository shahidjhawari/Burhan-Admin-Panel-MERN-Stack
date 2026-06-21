import React, { useEffect, useState, useCallback } from "react";
import api from "../api.js";
import QuestionForm from "./QuestionForm.jsx";

const PAGE_LIMIT = 10;

export default function QuestionList() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/questions", {
        params: { page, limit: PAGE_LIMIT, search: search || undefined },
      });
      setItems(data.data);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load questions.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this question? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/questions/${id}`);
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete the question.");
    } finally {
      setDeletingId(null);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const onSaved = () => {
    closeForm();
    fetchQuestions();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Questions</h1>
          <p>{total} total entr{total === 1 ? "y" : "ies"} in your knowledge base</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add question
        </button>
      </div>

      <div className="card">
        <div className="toolbar">
          <input
            className="input"
            placeholder="Search questions or answers…"
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
            <div className="big">No questions yet</div>
            <p>Add your first question to get started.</p>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th style={{ width: 56 }}>Image</th>
                  <th>Question / Answer</th>
                  <th>Category</th>
                  <th>Reference</th>
                  <th style={{ width: 110 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item._id}>
                    <td className="row-index">{(page - 1) * PAGE_LIMIT + idx + 1}</td>
                    <td>
                      {item.image ? (
                        <img className="thumb" src={item.image} alt="" />
                      ) : (
                        <div className="thumb" />
                      )}
                    </td>
                    <td className="q-cell">
                      <div className="q-text">{item.question}</div>
                      <div className="a-text">{item.answer}</div>
                    </td>
                    <td>
                      <span className="badge">{item.category || "General"}</span>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: 13, maxWidth: 160 }}>
                      {item.reference || "—"}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>
                          Edit
                        </button>
                        <button
                          className="btn-danger-text btn-sm"
                          onClick={() => handleDelete(item._id)}
                          disabled={deletingId === item._id}
                        >
                          {deletingId === item._id ? "…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      {showForm && <QuestionForm existing={editing} onClose={closeForm} onSaved={onSaved} />}
    </div>
  );
}
