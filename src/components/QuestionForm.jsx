import React, { useState } from "react";
import api from "../api.js";

// ─── tiny helpers ───────────────────────────────────────────────────────────

const newItem = (type = "text") => ({ type, value: "", file: null, preview: "", publicId: "" });

const YoutubeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF0000">
    <path d="M21.8 8.001S21.6 6.4 20.9 5.7c-.7-.8-1.5-.8-1.9-.8C16.2 4.8 12 4.8 12 4.8s-4.2 0-7 .1c-.4.1-1.2.1-1.9.8-.7.7-.9 2.3-.9 2.3S2 9.7 2 11.4v1.5c0 1.7.2 3.4.2 3.4s.2 1.6.9 2.3c.7.8 1.6.7 2 .8 1.5.1 6.4.2 7.9.2 0 0 4.2 0 7-.1.4-.1 1.2-.1 1.9-.8.7-.7.9-2.3.9-2.3s.2-1.7.2-3.4v-1.5c0-1.7-.2-3.4-.2-3.4zM9.7 14.8V9.2l5.5 2.8-5.5 2.8z"/>
  </svg>
);

const PdfIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--danger)">
    <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5z"/>
  </svg>
);

// ─── sub-components ─────────────────────────────────────────────────────────

const EvidenceSection = ({ label, items, setItems, prefix }) => {
  const addItem = (type) =>
    setItems((prev) => [...prev, newItem(type)]);

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, patch) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const handleFile = (idx, file) => {
    if (!file) return;
    updateItem(idx, {
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
      value: file.name,
    });
  };

  return (
    <div className="evidence-section">
      <div className="evidence-header">
        <span className="ev-label">{label}</span>
        <div className="ev-add-row">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => addItem("text")}>+ Text</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => addItem("url")}>+ URL</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => addItem("image")}>+ Image</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => addItem("pdf")}>+ PDF</button>
        </div>
      </div>

      {items.length === 0 && (
        <p className="ev-empty">No items yet — click a button above to add one.</p>
      )}

      {items.map((item, idx) => (
        <div key={idx} className="ev-item">
          <span className="ev-type-badge">{item.type}</span>

          {item.type === "text" && (
            <textarea
              className="textarea"
              rows={3}
              value={item.value}
              onChange={(e) => updateItem(idx, { value: e.target.value })}
              placeholder="Type the text here…"
            />
          )}

          {item.type === "url" && (
            <input
              className="input"
              value={item.value}
              onChange={(e) => updateItem(idx, { value: e.target.value })}
              placeholder="https://example.com/article"
            />
          )}

          {(item.type === "image" || item.type === "pdf") && (
            <div className="ev-file-row">
              {item.type === "image" && item.preview ? (
                <img src={item.preview} alt="" className="ev-thumb" />
              ) : item.type === "image" && item.value ? (
                <img src={item.value} alt="" className="ev-thumb" />
              ) : item.type === "pdf" && item.value ? (
                <div className="ev-pdf-chip"><PdfIcon />{item.file ? item.file.name : "PDF uploaded"}</div>
              ) : null}
              <div>
                <input
                  type="file"
                  accept={item.type === "image" ? "image/*" : "application/pdf"}
                  onChange={(e) => handleFile(idx, e.target.files[0])}
                />
                <div className="helper-text">
                  {item.type === "image" ? "JPG, PNG or WEBP — max 20 MB" : "PDF file — max 20 MB"}
                </div>
              </div>
            </div>
          )}

          <button type="button" className="ev-remove" onClick={() => removeItem(idx)} title="Remove">✕</button>
        </div>
      ))}
    </div>
  );
};

// ─── main form ───────────────────────────────────────────────────────────────

export default function QuestionForm({ existing, onClose, onSaved }) {
  const isEdit = Boolean(existing);

  const parseExistingItems = (arr = []) =>
    arr.map((it) => ({ ...it, file: null, preview: "" }));

  const [question, setQuestion] = useState(existing?.question || "");
  const [answer, setAnswer] = useState(existing?.answer || "");
  const [category, setCategory] = useState(existing?.category || "General");
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(existing?.image || "");
  const [proofs, setProofs] = useState(parseExistingItems(existing?.scientificProofs));
  const [ahadees, setAhadees] = useState(parseExistingItems(existing?.ahadees));
  const [youtubeVideos, setYoutubeVideos] = useState(existing?.youtubeVideos || []);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleMainImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMainImageFile(file);
    setMainImagePreview(URL.createObjectURL(file));
  };

  const addYoutube = () => setYoutubeVideos((v) => [...v, ""]);
  const updateYoutube = (idx, val) =>
    setYoutubeVideos((v) => v.map((u, i) => (i === idx ? val : u)));
  const removeYoutube = (idx) =>
    setYoutubeVideos((v) => v.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!question.trim() || !answer.trim()) {
      setError("Question and answer are required.");
      return;
    }

    const fd = new FormData();
    fd.append("question", question);
    fd.append("answer", answer);
    fd.append("category", category);
    if (mainImageFile) fd.append("image", mainImageFile);

    // Build metadata arrays (without the File objects — those go as separate FormData entries)
    const proofsData = proofs.map((it) => ({
      type: it.type,
      value: it.file ? "" : it.value || "",
      publicId: it.file ? "" : it.publicId || "",
    }));
    const ahadeesData = ahadees.map((it) => ({
      type: it.type,
      value: it.file ? "" : it.value || "",
      publicId: it.file ? "" : it.publicId || "",
    }));
    fd.append("scientificProofs", JSON.stringify(proofsData));
    fd.append("ahadees", JSON.stringify(ahadeesData));
    fd.append("youtubeVideos", JSON.stringify(youtubeVideos.filter(Boolean)));

    // Attach actual files with index-based field names
    proofs.forEach((it, idx) => { if (it.file) fd.append(`proof_${idx}`, it.file); });
    ahadees.forEach((it, idx) => { if (it.file) fd.append(`hadees_${idx}`, it.file); });

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/admin/questions/${existing._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/admin/questions", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-head">
          <h2>{isEdit ? "Edit question" : "Add new question"}</h2>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>

          {/* ── Core fields ── */}
          <div className="field">
            <label>Question</label>
            <textarea className="textarea" rows={3} value={question}
              onChange={(e) => setQuestion(e.target.value)} placeholder="Type the question…" required />
          </div>

          <div className="field">
            <label>Answer</label>
            <textarea className="textarea" rows={5} value={answer}
              onChange={(e) => setAnswer(e.target.value)} placeholder="Type the answer…" required />
          </div>

          <div className="form-row">
            <div className="field">
              <label>Category</label>
              <input className="input" value={category}
                onChange={(e) => setCategory(e.target.value)} placeholder="General" />
            </div>
            <div className="field">
              <label>Question image (optional)</label>
              <div className="image-drop">
                {mainImagePreview
                  ? <img src={mainImagePreview} alt="preview" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }} />
                  : <div className="placeholder" style={{ width: 56, height: 56 }}>No img</div>
                }
                <input type="file" accept="image/*" onChange={handleMainImage} />
              </div>
            </div>
          </div>

          {/* ── Scientific Proofs ── */}
          <div className="field">
            <label>Scientific Proofs</label>
            <EvidenceSection label="" items={proofs} setItems={setProofs} prefix="proof" />
          </div>

          {/* ── Ahadees ── */}
          <div className="field">
            <label>Ahadees</label>
            <EvidenceSection label="" items={ahadees} setItems={setAhadees} prefix="hadees" />
          </div>

          {/* ── YouTube Videos ── */}
          <div className="field">
            <div className="evidence-header">
              <label>YouTube Videos</label>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addYoutube}>
                <YoutubeIcon /> Add video
              </button>
            </div>
            {youtubeVideos.length === 0 && (
              <p className="ev-empty">No videos yet — click "Add video" to add a YouTube URL.</p>
            )}
            {youtubeVideos.map((url, idx) => (
              <div key={idx} className="yt-row">
                <input className="input" value={url}
                  onChange={(e) => updateYoutube(idx, e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..." />
                <button type="button" className="ev-remove" onClick={() => removeYoutube(idx)}>✕</button>
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save changes" : "Add question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
