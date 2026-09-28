"use client";
import { useState, useRef } from "react";

// Single source of truth for colors. Replace with the shop's exact hex values.
const PALETTE = {
  cream: "#F5EBDD",
  sand: "#E6D5BC",
  terracotta: "#C4704F",
  moonBlue: "#8FA7C4",
  sage: "#A3B39A",
  dustyRose: "#D4A5A5",
};

export default function CandleLabelEditor() {
  const [mode, setMode] = useState("edit"); // "edit" | "preview"
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState(null);
  const fileRef = useRef(null);

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photo) URL.revokeObjectURL(photo);
    setPhoto(URL.createObjectURL(file));
  };

  const Label = ({ editable }) => (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: PALETTE.cream,
        border: `2px solid ${PALETTE.terracotta}`,
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      {/* Message: left */}
      <div style={{ flex: 1, padding: 12, display: "flex", alignItems: "center" }}>
        {editable ? (
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message..."
            maxLength={120}
            style={{
              width: "100%",
              height: "100%",
              resize: "none",
              border: "none",
              outline: "none",
              background: "transparent",
              color: PALETTE.terracotta,
              fontFamily: "Georgia, serif",
              fontSize: 15,
              textAlign: "center",
            }}
          />
        ) : (
          <p
            style={{
              width: "100%",
              margin: 0,
              color: PALETTE.terracotta,
              fontFamily: "Georgia, serif",
              fontSize: 15,
              textAlign: "center",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {message || "Your message"}
          </p>
        )}
      </div>

      {/* Photo: right */}
      <div
        onClick={editable ? () => fileRef.current?.click() : undefined}
        style={{
          width: "42%",
          background: PALETTE.sand,
          cursor: editable ? "pointer" : "default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: PALETTE.terracotta,
          fontSize: 13,
          textAlign: "center",
        }}
      >
        {photo ? (
          <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : editable ? (
          "+ Add photo"
        ) : null}
      </div>
    </div>
  );

  const Jar = ({ editable }) => (
    <div style={{ position: "relative", width: 260, height: 320, margin: "0 auto" }}>
      {/* lid */}
      <div
        style={{
          position: "absolute", top: 0, left: 20, right: 20, height: 28,
          background: PALETTE.terracotta, borderRadius: "6px 6px 0 0",
        }}
      />
      {/* jar body */}
      <div
        style={{
          position: "absolute", top: 28, bottom: 0, left: 0, right: 0,
          background: PALETTE.moonBlue, borderRadius: "0 0 24px 24px",
          overflow: "hidden",
        }}
      >
        {/* label placeholder sits on the jar */}
        <div style={{ position: "absolute", top: 70, left: 14, right: 14, height: 120 }}>
          <Label editable={editable} />
        </div>
        {/* cylinder shading so the label reads as wrapped around the jar */}
        <div
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background:
              "linear-gradient(90deg, rgba(0,0,0,.22) 0%, rgba(0,0,0,0) 22%, rgba(255,255,255,.18) 50%, rgba(0,0,0,0) 78%, rgba(0,0,0,.22) 100%)",
          }}
        />
      </div>
    </div>
  );

  return (
    <div style={{ background: PALETTE.cream, padding: 24, borderRadius: 12, textAlign: "center" }}>
      <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} hidden />

      {mode === "edit" ? (
        <>
          <Jar editable />
          <button
            onClick={() => setMode("preview")}
            style={{
              marginTop: 24, padding: "12px 28px", border: "none", borderRadius: 999,
              background: PALETTE.terracotta, color: PALETTE.cream, fontSize: 16, cursor: "pointer",
            }}
          >
            Preview my candle
          </button>
        </>
      ) : (
        <>
          {/* Candle alone, no editing UI */}
          <Jar editable={false} />
          <button
            onClick={() => setMode("edit")}
            style={{
              marginTop: 24, padding: "12px 28px", borderRadius: 999,
              border: `2px solid ${PALETTE.terracotta}`, background: "transparent",
              color: PALETTE.terracotta, fontSize: 16, cursor: "pointer",
            }}
          >
            Back to editing
          </button>
        </>
      )}
    </div>
  );
}