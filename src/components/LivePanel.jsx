import React, { useEffect, useRef, useState } from "react";
import { ref, set, onChildAdded, onValue, remove, push, off } from "firebase/database";
import { rtdb } from "../firebase.js";
import api from "../api.js";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function LivePanel() {
  const [isLive,      setIsLive]      = useState(false);
  const [sessionId,   setSessionId]   = useState(null);
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [status,      setStatus]      = useState("idle");
  const [error,       setError]       = useState("");
  const [history,     setHistory]     = useState([]);

  const localVideoRef = useRef(null);
  const streamRef     = useRef(null);
  const peerConnsRef  = useRef({});

  // Load past sessions
  useEffect(() => {
    api.get("/live/history").then(({ data }) => setHistory(data.data || [])).catch(() => {});
  }, [isLive]);

  // Listen to viewer count in Firebase
  useEffect(() => {
    const countRef = ref(rtdb, "live/status/viewerCount");
    const unsub = onValue(countRef, (snap) => {
      if (snap.exists()) setViewerCount(snap.val() || 0);
    });
    return () => off(countRef, "value", unsub);
  }, []);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    Object.values(peerConnsRef.current).forEach((pc) => pc.close());
    peerConnsRef.current = {};
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  };

  const createPeerConnection = (viewerUID) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnsRef.current[viewerUID] = pc;

    // Add all local tracks to this viewer's peer connection
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, streamRef.current);
      });
    }

    // Send our ICE candidates to Firebase for this viewer
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        push(ref(rtdb, `live/viewers/${viewerUID}/adminCandidates`), e.candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
        pc.close();
        delete peerConnsRef.current[viewerUID];
      }
    };

    return pc;
  };

  const handleNewViewer = async (viewerUID) => {
    if (peerConnsRef.current[viewerUID]) return; // already handling this viewer
    try {
      const pc = createPeerConnection(viewerUID);

      // Create and set local offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to viewer via Firebase
      await set(ref(rtdb, `live/viewers/${viewerUID}/offer`), {
        type: offer.type,
        sdp:  offer.sdp,
      });

      // Listen for viewer's answer
      const answerRef = ref(rtdb, `live/viewers/${viewerUID}/answer`);
      onValue(answerRef, async (snap) => {
        if (snap.exists() && !pc.remoteDescription) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(snap.val()));
          } catch (err) {
            console.error("setRemoteDescription error:", err);
          }
        }
      });

      // Listen for viewer's ICE candidates
      onChildAdded(ref(rtdb, `live/viewers/${viewerUID}/viewerCandidates`), (snap) => {
        if (snap.exists() && pc.remoteDescription) {
          pc.addIceCandidate(new RTCIceCandidate(snap.val())).catch(console.error);
        }
      });
    } catch (err) {
      console.error("handleNewViewer error:", err);
    }
  };

  const handleGoLive = async () => {
    if (!title.trim()) { setError("Live ka title zaroori hai."); return; }
    setError("");
    setStatus("starting");

    try {
      // Get camera + mic
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      // Tell backend to start session (saves to MongoDB + sets Firebase status)
      const { data } = await api.post("/live/start", {
        title: title.trim(),
        description: description.trim(),
      });
      setSessionId(data.session._id);
      setIsLive(true);
      setStatus("live");

      // Listen for new viewers joining via Firebase
      onChildAdded(ref(rtdb, "live/viewers"), (snap) => {
        const viewerUID = snap.key;
        if (viewerUID) handleNewViewer(viewerUID);
      });
    } catch (err) {
      setStatus("idle");
      setError("Camera/server error: " + err.message);
      stopStream();
    }
  };

  const handleEndLive = async () => {
    setStatus("ending");
    try { await api.post("/live/end", { sessionId }); } catch {}
    stopStream();
    setIsLive(false);
    setSessionId(null);
    setViewerCount(0);
    setStatus("idle");
  };

  const fmt = (iso) => new Date(iso).toLocaleString();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Live Streaming</h1>
          <p>WebRTC + Firebase — camera on karein aur sab users ko live broadcast karein</p>
        </div>
        {isLive && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--danger)", display: "inline-block" }} />
            <span style={{ fontWeight: 700, color: "var(--danger)" }}>LIVE</span>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>

        {/* ── Video Preview ── */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ position: "relative", background: "#0a0c1a", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <video ref={localVideoRef} autoPlay muted playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover", display: isLive ? "block" : "none" }} />
            {!isLive && (
              <div style={{ color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 10 }}>📹</div>
                <div style={{ fontSize: 14 }}>Live shuru karne ke baad yahan camera dikhega</div>
              </div>
            )}
            {isLive && (
              <>
                <div style={{ position: "absolute", top: 14, left: 14, background: "var(--danger)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
                  LIVE
                </div>
                <div style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 12, padding: "4px 12px", borderRadius: 6 }}>
                  👁 {viewerCount} viewer{viewerCount !== 1 ? "s" : ""}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Controls ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
              {isLive ? "Live chal raha hai" : "Live shuru karein"}
            </div>

            {error && <div className="error-banner" style={{ marginBottom: 12 }}>{error}</div>}

            {!isLive ? (
              <>
                <div className="field">
                  <label>Title</label>
                  <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Aaj ka topic…" />
                </div>
                <div className="field">
                  <label>Description <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
                  <textarea className="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Is session mein kya discuss hoga…" />
                </div>
                <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}
                  onClick={handleGoLive} disabled={status === "starting"}>
                  {status === "starting" ? "Camera on ho raha hai…" : "🔴 Go Live"}
                </button>
              </>
            ) : (
              <>
                <div style={{ padding: "12px 14px", background: "var(--success-soft)", borderRadius: 8, marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, color: "var(--success)" }}>✓ Aap live hain!</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{title}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "var(--paper)", borderRadius: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 14 }}>Viewers</span>
                  <span style={{ fontWeight: 800, fontSize: 22 }}>{viewerCount}</span>
                </div>
                <button className="btn" style={{ width: "100%", justifyContent: "center", background: "var(--danger)", color: "#fff" }}
                  onClick={handleEndLive} disabled={status === "ending"}>
                  {status === "ending" ? "Band ho raha hai…" : "⏹ Live Band Karein"}
                </button>
              </>
            )}
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>Tips</div>
            {["Browser camera permission allow karein", "Achhi roshni mein baith karein", "Strong WiFi use karein", "Background shor kam karein"].map((t, i) => (
              <div key={i} style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 5 }}>• {t}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── History ── */}
      {history.length > 0 && (
        <div className="card" style={{ marginTop: 28 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", fontWeight: 700 }}>Past Sessions</div>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Started</th>
                <th>Ended</th>
              </tr>
            </thead>
            <tbody>
              {history.map((s) => (
                <tr key={s._id}>
                  <td><div className="q-text">{s.title}</div><div className="a-text">{s.description}</div></td>
                  <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{fmt(s.createdAt)}</td>
                  <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{s.endedAt ? fmt(s.endedAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
