import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../api.js";

const SOCKET_URL = API_BASE_URL;

export default function LivePanel() {
  const [connected, setConnected]   = useState(false);
  const [isLive, setIsLive]         = useState(false);
  const [sessionId, setSessionId]   = useState(null);
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [status, setStatus]         = useState("idle"); // idle | starting | live | ending
  const [error, setError]           = useState("");

  const socketRef    = useRef(null);
  const localVideoRef = useRef(null);
  const streamRef    = useRef(null);
  const peerConnsRef = useRef({}); // viewerSocketId → RTCPeerConnection

  // ── Socket setup ──────────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setError("");
    });
    socket.on("disconnect", () => setConnected(false));

    socket.on("admin:live-confirmed", ({ sessionId }) => {
      setSessionId(sessionId);
      setIsLive(true);
      setStatus("live");
    });

    socket.on("live:ended", () => {
      setIsLive(false);
      setStatus("idle");
      setViewerCount(0);
      setSessionId(null);
      stopStream();
    });

    socket.on("live:viewer-count", ({ count }) => setViewerCount(count));

    // A new viewer joined — send them a WebRTC offer
    socket.on("viewer:joined", async ({ viewerSocketId }) => {
      if (!streamRef.current) return;
      try {
        const pc = createPeerConnection(viewerSocketId, socket);
        streamRef.current.getTracks().forEach(track => pc.addTrack(track, streamRef.current));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("signal:offer", { targetSocketId: viewerSocketId, offer });
      } catch (err) {
        console.error("Offer error:", err);
      }
    });

    // Viewer sent answer
    socket.on("signal:answer", async ({ fromSocketId, answer }) => {
      const pc = peerConnsRef.current[fromSocketId];
      if (pc) {
        try { await pc.setRemoteDescription(new RTCSessionDescription(answer)); }
        catch (err) { console.error("Answer error:", err); }
      }
    });

    // ICE candidate
    socket.on("signal:ice-candidate", ({ fromSocketId, candidate }) => {
      const pc = peerConnsRef.current[fromSocketId];
      if (pc && candidate) {
        pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
      }
    });

    return () => socket.disconnect();
  }, []);

  const createPeerConnection = (viewerSocketId, socket) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });
    peerConnsRef.current[viewerSocketId] = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("signal:ice-candidate", {
          targetSocketId: viewerSocketId,
          candidate: e.candidate,
        });
      }
    };
    pc.onconnectionstatechange = () => {
      if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
        pc.close();
        delete peerConnsRef.current[viewerSocketId];
      }
    };
    return pc;
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    Object.values(peerConnsRef.current).forEach(pc => pc.close());
    peerConnsRef.current = {};
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  };

  const handleGoLive = async () => {
    if (!title.trim()) { setError("Live ka title zaroori hai."); return; }
    setError("");
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      socketRef.current.emit("admin:go-live", { title: title.trim(), description: description.trim() });
    } catch (err) {
      setStatus("idle");
      setError("Camera/microphone access nahi mila: " + err.message);
    }
  };

  const handleEndLive = () => {
    setStatus("ending");
    socketRef.current.emit("admin:end-live");
    stopStream();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Live Streaming</h1>
          <p>Camera on karein aur sab users ko live broadcast karein</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 10, height: 10, borderRadius: "50%",
            background: connected ? "var(--success)" : "var(--danger)",
            display: "inline-block"
          }} />
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {connected ? "Server se connected" : "Connecting…"}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>

        {/* ── Video preview ── */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{
            position: "relative", background: "#0a0c1a",
            aspectRatio: "16/9", display: "flex",
            alignItems: "center", justifyContent: "center"
          }}>
            <video
              ref={localVideoRef}
              autoPlay muted playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover", display: isLive ? "block" : "none" }}
            />
            {!isLive && (
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📹</div>
                <div>Live shuru karne ke baad camera yahan dikhega</div>
              </div>
            )}
            {isLive && (
              <>
                <div style={{
                  position: "absolute", top: 14, left: 14,
                  background: "var(--danger)", color: "#fff",
                  fontSize: 12, fontWeight: 700, padding: "4px 10px",
                  borderRadius: 6, display: "flex", alignItems: "center", gap: 6
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
                  LIVE
                </div>
                <div style={{
                  position: "absolute", top: 14, right: 14,
                  background: "rgba(0,0,0,0.6)", color: "#fff",
                  fontSize: 12, padding: "4px 10px", borderRadius: 6
                }}>
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
                  <input className="input" value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Aaj ka topic…" />
                </div>
                <div className="field">
                  <label>Description <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
                  <textarea className="textarea" rows={3} value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Is session mein kya discuss hoga…" />
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={handleGoLive}
                  disabled={status === "starting" || !connected}
                >
                  {status === "starting" ? "Camera on ho raha hai…" : "🔴 Go Live"}
                </button>
              </>
            ) : (
              <>
                <div style={{ padding: "12px 14px", background: "var(--success-soft)", borderRadius: 8, marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, color: "var(--success)", marginBottom: 4 }}>✓ Aap live hain!</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{title}</div>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", background: "var(--paper)", borderRadius: 8, marginBottom: 14,
                  fontSize: 14
                }}>
                  <span>Viewers</span>
                  <span style={{ fontWeight: 700, fontSize: 20 }}>{viewerCount}</span>
                </div>
                <button
                  className="btn"
                  style={{ width: "100%", justifyContent: "center", background: "var(--danger)", color: "#fff" }}
                  onClick={handleEndLive}
                  disabled={status === "ending"}
                >
                  {status === "ending" ? "Band ho raha hai…" : "⏹ Live Band Karein"}
                </button>
              </>
            )}
          </div>

          {/* Tips */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: "var(--text-muted)" }}>Tips</div>
            {[
              "Browser camera permission allow karein",
              "Achhi roshni mein baith karein",
              "Background mein shor kam karein",
              "Strong WiFi ya ethernet use karein",
            ].map((tip, i) => (
              <div key={i} style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
                • {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
