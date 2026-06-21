import React, { useState } from "react";
import api from "../api.js";

export default function QuestionForm({ existing, onClose, onSaved }) {
  const [question, setQuestion] = useState(existing?.question || "");
  const [answer, setAnswer] = useState(existing?.answer || "");
  const [reference, setReference] = useState(existing?.reference || "");
  const [category, setCategory] = useState(existing?.category || "General");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(existing?.image || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(existing);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!question.trim() || !answer.trim()) {
      setError("Question and answer are required.");
      return;
    }

    const formData = new FormData();
    formData.append("question", question);
    formData.append("answer", answer);
    formData.append("reference", reference);
    formData.append("category", category);
    if (imageFile) formData.append("image", imageFile);

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/admin/questions/${existing._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/admin/questions", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save the question. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h2>{isEdit ? "Edit question" : "Add new question"}</h2>
          <button className="close-x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="question">Question</label>
            <textarea
              id="question"
              className="textarea"
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type the question here…"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="answer">Answer</label>
            <textarea
              id="answer"
              className="textarea"
              rows={5}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type the answer here…"
              required
            />
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="reference">Reference</label>
              <input
                id="reference"
                className="input"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Source, book, page, URL…"
              />
            </div>
            <div className="field">
              <label htmlFor="category">Category</label>
              <input
                id="category"
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="General"
              />
            </div>
          </div>

          <div className="field">
            <label>Image (optional)</label>
            <div className="image-drop">
              {preview ? (
                <img src={preview} alt="Preview" />
              ) : (
                <div className="placeholder">No image</div>
              )}
              <div>
                <input type="file" accept="image/*" onChange={handleImageChange} />
                <div className="helper-text">JPG, PNG, GIF or WEBP. Max 5 MB.</div>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save changes" : "Add question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
