import React, { useState, useEffect } from "react";
import api from "../api.js";

// ── helpers ──────────────────────────────────────────────────────────────────

const newItem = (type = "text") => ({ type, value: "", file: null, preview: "", publicId: "", thumbnailUrl: "" });

const pdfThumbUrl = (pdfUrl = "") => {
  if (!pdfUrl) return "";
  try {
    return pdfUrl
      .replace("/upload/", "/upload/pg_1,w_300,h_400,c_fit,q_auto/")
      .replace(/\.pdf$/i, ".jpg");
  } catch { return ""; }
};

const ISLAMIC_CATEGORIES = [
  "General", "Aqeedah", "Salah / Namaz", "Zakat", "Sawm / Roza", "Hajj",
  "Quran", "Hadith", "Fiqh", "Taharah", "Halal & Haram", "Seerah",
  "Akhlaaq", "Dua", "Family", "Business / Finance", "Death & Afterlife",
  "Islamic History", "Comparative Religion", "Other",
];

// ── Chip input (tags / keywords) ─────────────────────────────────────────────

const ChipInput = ({ label, chips, setChips, placeholder }) => {
  const [inputVal, setInputVal] = useState("");

  const addChip = (val) => {
    const v = val.trim().toLowerCase();
    if (v && !chips.includes(v)) setChips([...chips, v]);
    setInputVal("");
  };

  const removeChip = (i) => setChips(chips.filter((_, idx) => idx !== i));

  const handleKey = (e) => {
    if (["Enter", ",", " "].includes(e.key)) {
      e.preventDefault();
      addChip(inputVal);
    }
    if (e.key === "Backspace" && !inputVal && chips.length) {
      removeChip(chips.length - 1);
    }
  };

  return (
    <div className="field">
      <label>{label}</label>
      <div className="chip-input-box">
        {chips.map((chip, i) => (
          <span key={i} className="chip">
            {chip}
            <button type="button" className="chip-x" onClick={() => removeChip(i)}>×</button>
          </span>
        ))}
        <input
          className="chip-input-inner"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => addChip(inputVal)}
          placeholder={chips.length === 0 ? placeholder : ""}
        />
      </div>
      <div className="helper-text">Enter, comma ya space dabayen naya {label.toLowerCase()} add karne ke liye</div>
    </div>
  );
};

// ── Evidence section (proof / ahadees items) ─────────────────────────────────

const PdfIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--danger)">
    <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5z"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF0000">
    <path d="M21.8 8s-.2-1.6-.9-2.3c-.7-.8-1.5-.8-1.9-.8C16.2 4.8 12 4.8 12 4.8s-4.2 0-7 .1c-.4.1-1.2.1-1.9.8-.7.7-.9 2.3-.9 2.3S2 9.7 2 11.4v1.5c0 1.7.2 3.4.2 3.4s.2 1.6.9 2.3c.7.8 1.6.7 2 .8 1.5.1 6.4.2 7.9.2 0 0 4.2 0 7-.1.4-.1 1.2-.1 1.9-.8.7-.7.9-2.3.9-2.3s.2-1.7.2-3.4v-1.5C22 9.7 21.8 8 21.8 8zM9.7 14.8V9.2l5.5 2.8-5.5 2.8z"/>
  </svg>
);

const EvidenceSection = ({ label, items, setItems, prefix }) => {
  const addItem = (type) => setItems((p) => [...p, newItem(type)]);
  const removeItem = (idx) => setItems((p) => p.filter((_, i) => i !== idx));
  const updateItem = (idx, patch) => setItems((p) => p.map((it, i) => i === idx ? { ...it, ...patch } : it));

  const handleFile = (idx, file) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf";
    updateItem(idx, { file, preview: isPdf ? "" : URL.createObjectURL(file), value: file.name });
  };

  return (
    <div className="evidence-section">
      <div className="evidence-header">
        <span className="ev-label">{label}</span>
        <div className="ev-add-row">
          {["text","url","image","pdf"].map(t => (
            <button key={t} type="button" className="btn btn-ghost btn-sm" onClick={() => addItem(t)}>+ {t.toUpperCase()}</button>
          ))}
        </div>
      </div>
      {items.length === 0 && <p className="ev-empty">Koi item nahi — upar se type select karein.</p>}
      {items.map((item, idx) => (
        <div key={idx} className="ev-item">
          <span className="ev-type-badge">{item.type}</span>
          {item.type === "text" && (
            <textarea className="textarea" rows={3} value={item.value}
              onChange={(e) => updateItem(idx, { value: e.target.value })} placeholder="Text yahan likhein…" />
          )}
          {item.type === "url" && (
            <input className="input" value={item.value}
              onChange={(e) => updateItem(idx, { value: e.target.value })} placeholder="https://example.com" />
          )}
          {(item.type === "image" || item.type === "pdf") && (
            <div className="ev-file-row">
              {item.type === "image" && (item.preview || item.value) && (
                <img src={item.preview || item.value} alt="" className="ev-thumb" />
              )}
              {item.type === "pdf" && (
                <div className="ev-pdf-preview">
                  {!item.file && (item.thumbnailUrl || item.value) && (
                    <img src={item.thumbnailUrl || pdfThumbUrl(item.value)} alt="PDF"
                      className="ev-pdf-thumb" onError={(e) => { e.target.style.display = "none"; }} />
                  )}
                  {item.file && (
                    <div className="ev-pdf-uploading">
                      <PdfIcon />
                      <span>{item.file.name}</span>
                      <span className="ev-pdf-hint">Save ke baad thumbnail dikhega</span>
                    </div>
                  )}
                  {!item.file && item.value && (
                    <a href={item.value} target="_blank" rel="noreferrer" className="ev-pdf-link">
                      <PdfIcon /> PDF kholein ↗
                    </a>
                  )}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <input type="file" accept={item.type === "image" ? "image/*" : "application/pdf"}
                  onChange={(e) => handleFile(idx, e.target.files[0])} />
                <div className="helper-text">
                  {item.type === "pdf" ? "PDF — max 20 MB. Thumbnail auto-generate hoga." : "Image — max 20 MB"}
                </div>
              </div>
            </div>
          )}
          <button type="button" className="ev-remove" onClick={() => removeItem(idx)}>✕</button>
        </div>
      ))}
    </div>
  );
};

// ── Main form ────────────────────────────────────────────────────────────────

export default function QuestionForm({ existing, onClose, onSaved }) {
  const isEdit = Boolean(existing);
  const parseItems = (arr = []) => arr.map((it) => ({ ...it, file: null, preview: "" }));

  const [question,    setQuestion]    = useState(existing?.question || "");
  const [answer,      setAnswer]      = useState(existing?.answer || "");
  const [richText,    setRichText]    = useState(existing?.richText || "");
  const [notes,       setNotes]       = useState(existing?.notes || "");
  const [references,  setReferences]  = useState(existing?.references || []);
  const [quotes,      setQuotes]      = useState(existing?.quotes || []);
  const [category,    setCategory]    = useState(existing?.category || "General");
  const [language,    setLanguage]    = useState(existing?.language || "en");
  const [tags,        setTags]        = useState(existing?.tags || []);
  const [keywords,    setKeywords]    = useState(existing?.keywords || []);
  const [mainImgFile, setMainImgFile] = useState(null);
  const [mainImgPrev, setMainImgPrev] = useState(existing?.image || "");
  const [proofs,      setProofs]      = useState(parseItems(existing?.scientificProofs));
  const [ahadees,     setAhadees]     = useState(parseItems(existing?.ahadees));
  const [youtubeVids, setYoutubeVids] = useState(existing?.youtubeVideos || []);

  // Related questions
  const [relatedSearch,   setRelatedSearch]   = useState("");
  const [relatedResults,  setRelatedResults]  = useState([]);
  const [selectedRelated, setSelectedRelated] = useState(
    existing?.relatedQuestions?.map
      ? existing.relatedQuestions.map((r) => (typeof r === "object" ? r : { _id: r, question: r }))
      : []
  );

  const [error, setError]   = useState("");
  const [saving, setSaving] = useState(false);

  // Search for questions to link
  useEffect(() => {
    if (!relatedSearch.trim()) { setRelatedResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get("/questions", { params: { search: relatedSearch, limit: 6 } });
        setRelatedResults(data.data.filter((q) =>
          q._id !== existing?._id &&
          !selectedRelated.some((s) => s._id === q._id)
        ));
      } catch {}
    }, 350);
    return () => clearTimeout(t);
  }, [relatedSearch]);

  const addRelated = (q) => {
    setSelectedRelated((p) => [...p, q]);
    setRelatedResults((p) => p.filter((r) => r._id !== q._id));
    setRelatedSearch("");
  };
  const removeRelated = (id) => setSelectedRelated((p) => p.filter((r) => r._id !== id));

  const handleMainImg = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setMainImgFile(f);
    setMainImgPrev(URL.createObjectURL(f));
  };

  const addYt = () => setYoutubeVids((p) => [...p, ""]);
  const updateYt = (i, v) => setYoutubeVids((p) => p.map((u, j) => j === i ? v : u));
  const removeYt = (i) => setYoutubeVids((p) => p.filter((_, j) => j !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!question.trim() || !answer.trim()) { setError("Question aur answer zaroori hain."); return; }

    const fd = new FormData();
    fd.append("question",  question);
    fd.append("answer",    answer);
    fd.append("richText",  richText);
    fd.append("notes",     notes);
    fd.append("references",JSON.stringify(references.filter(Boolean)));
    fd.append("quotes",    JSON.stringify(quotes.filter((q) => q.text)));
    fd.append("category",  category);
    fd.append("language",  language);
    fd.append("tags",      JSON.stringify(tags));
    fd.append("keywords",  JSON.stringify(keywords));
    fd.append("relatedQuestions", JSON.stringify(selectedRelated.map((r) => r._id)));
    fd.append("youtubeVideos",    JSON.stringify(youtubeVids.filter(Boolean)));

    if (mainImgFile) fd.append("image", mainImgFile);

    const proofsData  = proofs.map((it) => ({ type: it.type, value: it.file ? "" : it.value||"", publicId: it.file ? "" : it.publicId||"", thumbnailUrl: it.file ? "" : it.thumbnailUrl||"" }));
    const ahadeesData = ahadees.map((it) => ({ type: it.type, value: it.file ? "" : it.value||"", publicId: it.file ? "" : it.publicId||"", thumbnailUrl: it.file ? "" : it.thumbnailUrl||"" }));
    fd.append("scientificProofs", JSON.stringify(proofsData));
    fd.append("ahadees",          JSON.stringify(ahadeesData));

    proofs.forEach((it, idx) => { if (it.file) fd.append(`proof_${idx}`, it.file); });
    ahadees.forEach((it, idx) => { if (it.file) fd.append(`hadees_${idx}`, it.file); });

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/admin/questions/${existing._id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post("/admin/questions", fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Save nahi ho saka.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-head">
          <h2>{isEdit ? "Question update karein" : "Naya question add karein"}</h2>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>

          {/* Core */}
          <div className="field">
            <label>Question</label>
            <textarea className="textarea" rows={3} value={question}
              onChange={(e) => setQuestion(e.target.value)} placeholder="Islamic sawaal likhein…" required />
          </div>
          <div className="field">
            <label>Answer <span style={{color:"var(--text-muted)",fontWeight:400}}>(short summary — shown in list)</span></label>
            <textarea className="textarea" rows={5} value={answer}
              onChange={(e) => setAnswer(e.target.value)} placeholder="Jawab likhein…" required />
          </div>

          {/* Rich Text — long form explanation */}
          <div className="field">
            <label>
              Rich Text <span style={{color:"var(--text-muted)",fontWeight:400}}>(optional — full detailed explanation, supports HTML)</span>
            </label>
            <textarea className="textarea" rows={10} value={richText}
              onChange={(e) => setRichText(e.target.value)}
              placeholder="Tafseel se jawab likhein. HTML formatting use kar sakte hain: <b>bold</b>, <i>italic</i>, <br> line break, <ul><li>list</li></ul>"
            />
            <div className="helper-text">{richText.length} characters</div>
          </div>

          {/* References */}
          <div className="field">
            <label>References <span style={{color:"var(--text-muted)",fontWeight:400}}>(sources, books, hadith collections)</span></label>
            {references.map((ref, i) => (
              <div key={i} style={{display:"flex",gap:8,marginBottom:8}}>
                <input className="input" value={ref}
                  onChange={(e) => setReferences((p) => p.map((r,j)=>j===i?e.target.value:r))}
                  placeholder="Sahih Bukhari, Hadith 1082" />
                <button type="button" className="ev-remove" onClick={() => setReferences((p)=>p.filter((_,j)=>j!==i))}>✕</button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReferences((p)=>[...p,""])}>+ Reference add karein</button>
          </div>

          {/* Quotes */}
          <div className="field">
            <label>Quotes / Sayings</label>
            {quotes.map((q, i) => (
              <div key={i} style={{border:"1px solid var(--line)",borderRadius:9,padding:12,marginBottom:8}}>
                <div className="field">
                  <label style={{fontSize:11}}>Quote text</label>
                  <textarea className="textarea" rows={2} value={q.text||""}
                    onChange={(e)=>setQuotes((p)=>p.map((qq,j)=>j===i?{...qq,text:e.target.value}:qq))}
                    placeholder="Hadith ya qawl…" />
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input className="input" value={q.source||""}
                    onChange={(e)=>setQuotes((p)=>p.map((qq,j)=>j===i?{...qq,source:e.target.value}:qq))}
                    placeholder="Maakhaz / Source (e.g. Bukhari)" />
                  <button type="button" className="ev-remove" onClick={() => setQuotes((p)=>p.filter((_,j)=>j!==i))}>✕</button>
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setQuotes((p)=>[...p,{text:"",source:""}])}>+ Quote add karein</button>
          </div>

          {/* Notes */}
          <div className="field">
            <label>Notes <span style={{color:"var(--text-muted)",fontWeight:400}}>(admin notes, footnotes, context)</span></label>
            <textarea className="textarea" rows={3} value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Koi zaroori maloomat ya hawashi…" />
          </div>

          {/* Category + Language + Image */}
          <div className="form-row">
            <div className="field">
              <label>Category</label>
              <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {ISLAMIC_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Language</label>
              <select className="select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="ur">Urdu (اردو)</option>
                <option value="ar">Arabic (عربی)</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Question Image (optional)</label>
            <div className="image-drop">
              {mainImgPrev
                ? <img src={mainImgPrev} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }} />
                : <div className="placeholder" style={{ width: 56, height: 56 }}>No img</div>}
              <input type="file" accept="image/*" onChange={handleMainImg} />
            </div>
          </div>

          {/* Tags */}
          <ChipInput
            label="Tags (Islamic keywords)"
            chips={tags}
            setChips={setTags}
            placeholder="namaz, salah, prayer, ibadah…"
          />

          {/* Keywords */}
          <ChipInput
            label="Keywords (search terms)"
            chips={keywords}
            setChips={setKeywords}
            placeholder="importance, farz, worship, pillars…"
          />

          {/* Scientific Proofs */}
          <div className="field">
            <label>Scientific Proofs</label>
            <EvidenceSection label="" items={proofs} setItems={setProofs} prefix="proof" />
          </div>

          {/* Ahadees */}
          <div className="field">
            <label>Ahadees</label>
            <EvidenceSection label="" items={ahadees} setItems={setAhadees} prefix="hadees" />
          </div>

          {/* YouTube */}
          <div className="field">
            <div className="evidence-header">
              <label>YouTube Videos</label>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addYt}>
                <YoutubeIcon /> + Video add karein
              </button>
            </div>
            {youtubeVids.length === 0 && <p className="ev-empty">Koi video nahi.</p>}
            {youtubeVids.map((url, i) => (
              <div key={i} className="yt-row">
                <input className="input" value={url} onChange={(e) => updateYt(i, e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..." />
                <button type="button" className="ev-remove" onClick={() => removeYt(i)}>✕</button>
              </div>
            ))}
          </div>

          {/* Related Questions */}
          <div className="field">
            <label>Related Questions (manually link karein)</label>
            <input className="input" value={relatedSearch}
              onChange={(e) => setRelatedSearch(e.target.value)}
              placeholder="Question search karein aur select karein…" />

            {relatedResults.length > 0 && (
              <div className="related-dropdown">
                {relatedResults.map((q) => (
                  <div key={q._id} className="related-option" onClick={() => addRelated(q)}>
                    <span className="badge">{q.category}</span>
                    <span>{q.question.slice(0, 80)}{q.question.length > 80 ? "…" : ""}</span>
                  </div>
                ))}
              </div>
            )}

            {selectedRelated.length > 0 && (
              <div className="related-selected">
                {selectedRelated.map((q) => (
                  <div key={q._id} className="related-chip">
                    <span>{typeof q.question === "string" ? q.question.slice(0, 60) + "…" : q._id}</span>
                    <button type="button" className="chip-x" onClick={() => removeRelated(q._id)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Save ho raha hai…" : isEdit ? "Update karein" : "Add karein"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
