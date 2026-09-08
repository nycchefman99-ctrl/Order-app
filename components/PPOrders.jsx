import React, { useState, useRef, useCallback } from "react";
import { X, FileText, Image as ImageIcon, FileSpreadsheet, Trash2, CheckCircle2, Loader2 } from "lucide-react";

/**
 * PP Orders — order intake popup, filing-cabinet frame
 * ------------------------------------------------------
 * UI ONLY. Wire-up point is marked TODO in handleSubmit(): swap the
 * simulated delay for the real call to your ingest pipeline (Claude API
 * read step, then the Google Apps Script Web App sync to Sheets).
 *
 * Works as a standalone popup on iPad, Android, iPhone, Mac, and Windows.
 * The "Browse files" button is always present (not drag-only), since
 * iPad Safari's native drag behavior isn't fully reliable.
 */

const ACCEPTED_TYPES = [".pdf", ".jpg", ".jpeg", ".png", ".heic", ".csv"];
const GREEN = "#173A2B";
const GREEN_DARK = "#0F281E";
const OFFWHITE = "#F7F5EC";
const INK = "#0A0A0A";
const STEEL = "#9C9C93";

function fileIcon(name) {
  const ext = name.split(".").pop().toLowerCase();
  if (ext === "csv") return FileSpreadsheet;
  if (["jpg", "jpeg", "png", "heic"].includes(ext)) return ImageIcon;
  return FileText;
}

function Rivet({ style }) {
  return (
    <span
      style={{
        position: "absolute",
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 30%, #D9D9D2, ${STEEL} 55%, #5C5C54 100%)`,
        boxShadow: "0 1px 1px rgba(0,0,0,0.5)",
        ...style,
      }}
    />
  );
}

function DrawerStrip({ height = 16 }) {
  return (
    <div
      style={{
        position: "relative",
        height,
        margin: "0 10px 3px",
        background: `linear-gradient(180deg, #1D4433 0%, ${GREEN} 60%, ${GREEN_DARK} 100%)`,
        borderTop: "1px solid #2A5A44",
        borderBottom: `1px solid ${GREEN_DARK}`,
      }}
    >
      <Rivet style={{ left: 6, top: height / 2 - 3.5 }} />
      <Rivet style={{ right: 6, top: height / 2 - 3.5 }} />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
          width: 46,
          height: Math.max(4, height - 10),
          borderRadius: 2,
          background: `linear-gradient(180deg, #C7C7BE, ${STEEL} 45%, #6E6E64 100%)`,
          boxShadow: "0 1px 0 rgba(0,0,0,0.5)",
        }}
      />
    </div>
  );
}

export default function PPOrders({ onClose = () => {} }) {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | sending | done | partial
  const [totalFiled, setTotalFiled] = useState(0);
  const [lastFiledDate, setLastFiledDate] = useState(null);
  const [erroredFiles, setErroredFiles] = useState([]); // { id, name, file, reason, timestamp }
  const inputRef = useRef(null);

  const addFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList).map((f) => ({
      file: f,
      id: `${f.name}-${f.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    }));
    setFiles((prev) => [...prev, ...incoming]);
    setStatus("idle");
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const handleSubmit = async () => {
    if (!files.length) return;
    const batch = files;
    setFiles([]);
    setStatus("sending");

    let successCount = 0;
    const newErrors = [];

    for (const item of batch) {
      try {
        // TODO: replace with the real per-file pipeline call. Catch the
        // actual failure reason from the response (bad scan, unreadable
        // handwriting, wrong format, sheet write failure, etc.) instead
        // of the simulated one below.
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            const simulatedFailure = Math.random() < 0.15;
            simulatedFailure ? reject(new Error("Could not read order details from this file")) : resolve();
          }, 350);
        });
        successCount += 1;
      } catch (err) {
        newErrors.push({
          id: item.id,
          name: item.file.name,
          file: item.file,
          reason: err.message || "Unknown error",
          timestamp: new Date().toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
        });
      }
    }

    if (successCount) {
      setTotalFiled((prev) => prev + successCount);
      setLastFiledDate(
        new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
      );
    }
    if (newErrors.length) {
      setErroredFiles((prev) => [...newErrors, ...prev]);
      setStatus(successCount ? "partial" : "idle");
    } else {
      setStatus("done");
    }
  };

  const retryError = (id) => {
    const item = erroredFiles.find((e) => e.id === id);
    if (!item) return;
    setErroredFiles((prev) => prev.filter((e) => e.id !== id));
    setFiles((prev) => [...prev, { file: item.file, id: `${item.id}-retry-${Date.now()}` }]);
  };

  const dismissError = (id) => setErroredFiles((prev) => prev.filter((e) => e.id !== id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,10,10,0.55)", fontFamily: "Inter, sans-serif" }}
    >
      <div
        className="w-full max-w-md"
        style={{
          background: `linear-gradient(180deg, #1D4433 0%, ${GREEN} 8%, ${GREEN} 92%, ${GREEN_DARK} 100%)`,
          boxShadow: "0 24px 48px rgba(0,0,0,0.5), inset 0 0 0 1px #0A2015",
          maxHeight: "94vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Cabinet carcass corner rivets */}
        <div style={{ position: "relative" }}>
          <Rivet style={{ left: 8, top: 8 }} />
          <Rivet style={{ right: 8, top: 8 }} />
        </div>

        {/* Decorative closed drawers */}
        <div style={{ paddingTop: 6 }}>
          <DrawerStrip height={14} />
          <DrawerStrip height={14} />
        </div>

        {/* Open drawer — the working panel */}
        <div
          style={{
            margin: "3px 10px 10px",
            background: OFFWHITE,
            border: `3px solid ${INK}`,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            boxShadow: "0 4px 10px rgba(0,0,0,0.35)",
          }}
        >
          {/* Drawer front bezel: handle + label plate */}
          <div
            style={{
              position: "relative",
              background: `linear-gradient(180deg, #1D4433 0%, ${GREEN} 70%, ${GREEN_DARK} 100%)`,
              borderBottom: `3px solid ${INK}`,
              padding: "10px 14px 12px",
              flexShrink: 0,
            }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                color: OFFWHITE,
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            {/* Handle bar */}
            <div
              style={{
                width: 64,
                height: 8,
                margin: "0 auto 10px",
                borderRadius: 2,
                background: `linear-gradient(180deg, #E4E4DC, ${STEEL} 45%, #6E6E64 100%)`,
                boxShadow: "0 1px 0 rgba(0,0,0,0.5)",
              }}
            />

            {/* Label plate */}
            <div
              style={{
                background: OFFWHITE,
                border: `2px solid ${INK}`,
                borderRadius: 2,
                padding: "6px 12px",
                display: "inline-block",
                maxWidth: "100%",
              }}
            >
              <div
                style={{
                  color: INK,
                  fontWeight: 800,
                  fontSize: 22,
                  letterSpacing: "0.02em",
                  lineHeight: 1,
                  fontFamily: "'Oswald', 'Inter', sans-serif",
                  textTransform: "uppercase",
                }}
              >
                PP Orders
              </div>
              <div style={{ color: INK, fontWeight: 700, fontSize: 11, marginTop: 3 }}>
                Order intake — Prohibition Pickle
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "16px 16px 14px", overflowY: "auto" }}>
            {/* Filed counter — index-card stamp */}
            <div
              style={{
                display: "flex",
                border: `2px solid ${INK}`,
                borderRadius: 2,
                marginBottom: 16,
                background: "#FFFFFF",
                overflow: "hidden",
              }}
            >
              <div style={{ flex: 1, padding: "8px 12px", borderRight: `2px solid ${INK}` }}>
                <div style={{ color: INK, fontWeight: 700, fontSize: 10, letterSpacing: "0.04em", opacity: 0.6, textTransform: "uppercase" }}>
                  Orders filed
                </div>
                <div style={{ color: INK, fontWeight: 800, fontSize: 20, lineHeight: 1.2, fontFamily: "'Oswald','Inter',sans-serif" }}>
                  {totalFiled}
                </div>
              </div>
              <div style={{ flex: 1, padding: "8px 12px" }}>
                <div style={{ color: INK, fontWeight: 700, fontSize: 10, letterSpacing: "0.04em", opacity: 0.6, textTransform: "uppercase" }}>
                  Last filed
                </div>
                <div style={{ color: INK, fontWeight: 800, fontSize: 14, lineHeight: 1.6 }}>
                  {lastFiledDate || "—"}
                </div>
              </div>
            </div>

            {/* Instructions box */}
            <div
              style={{
                border: `2px solid ${INK}`,
                borderRadius: 2,
                padding: "10px 12px",
                marginBottom: 16,
                background: "#FFFFFF",
              }}
            >
              <p style={{ color: INK, fontWeight: 700, fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                Drop in order PDFs, scanned pages, WhatsApp photos, or a CSV.
                Each one gets read and filed into the order sheet — no typing
                required. Add as many as you need at once.
              </p>
            </div>

            {/* Upload dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${INK}`,
                borderRadius: 2,
                padding: "26px 16px",
                textAlign: "center",
                background: dragActive ? "#EAE7D8" : "#FFFFFF",
                transition: "background 0.15s",
              }}
            >
              <p style={{ color: INK, fontWeight: 800, fontSize: 14, margin: "0 0 10px" }}>
                Drag files here
              </p>
              <button
                onClick={() => inputRef.current?.click()}
                style={{
                  background: GREEN,
                  color: OFFWHITE,
                  fontWeight: 800,
                  fontSize: 13,
                  border: `2px solid ${INK}`,
                  borderRadius: 2,
                  padding: "8px 18px",
                  cursor: "pointer",
                }}
              >
                Browse files
              </button>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept={ACCEPTED_TYPES.join(",")}
                style={{ display: "none" }}
                onChange={(e) => e.target.files?.length && addFiles(e.target.files)}
              />
              <p style={{ color: INK, fontWeight: 700, fontSize: 11, marginTop: 10, opacity: 0.65 }}>
                PDF · JPG · PNG · HEIC · CSV
              </p>
            </div>

            {/* File list — folder tabs */}
            {files.length > 0 && (
              <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {files.map(({ file, id }) => {
                  const Icon = fileIcon(file.name);
                  return (
                    <li
                      key={id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        border: `2px solid ${INK}`,
                        borderRadius: 2,
                        background: "#FFFFFF",
                        padding: "7px 10px",
                      }}
                    >
                      <Icon size={16} color={INK} strokeWidth={2.3} style={{ flexShrink: 0 }} />
                      <span style={{ color: INK, fontWeight: 700, fontSize: 12.5, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeFile(id)}
                        aria-label={`Remove ${file.name}`}
                        style={{ background: "transparent", border: "none", cursor: "pointer", flexShrink: 0, color: "#7A1F16" }}
                      >
                        <Trash2 size={15} strokeWidth={2.3} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {status === "done" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, color: INK, fontWeight: 800, fontSize: 13 }}>
                <CheckCircle2 size={17} strokeWidth={2.5} />
                Filed to the sheet.
              </div>
            )}
            {status === "partial" && (
              <div style={{ marginTop: 14, color: "#7A1F16", fontWeight: 800, fontSize: 13 }}>
                Some orders filed — others need attention below.
              </div>
            )}

            {/* Error report */}
            {erroredFiles.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  border: `2px solid ${INK}`,
                  borderLeft: "8px solid #7A1F16",
                  borderRadius: 2,
                  background: "#FFF8F6",
                }}
              >
                <div style={{ padding: "8px 12px", borderBottom: `2px solid ${INK}` }}>
                  <div style={{ color: "#7A1F16", fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Error report — {erroredFiles.length} not filed
                  </div>
                </div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {erroredFiles.map((e) => (
                    <li
                      key={e.id}
                      style={{
                        padding: "9px 12px",
                        borderBottom: `1px solid rgba(10,10,10,0.15)`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: INK, fontWeight: 800, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {e.name}
                          </div>
                          <div style={{ color: "#7A1F16", fontWeight: 700, fontSize: 11.5, marginTop: 2 }}>
                            {e.reason}
                          </div>
                          <div style={{ color: INK, fontWeight: 600, fontSize: 10.5, opacity: 0.55, marginTop: 2 }}>
                            {e.timestamp}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button
                            onClick={() => retryError(e.id)}
                            style={{
                              background: GREEN,
                              color: OFFWHITE,
                              fontWeight: 800,
                              fontSize: 11,
                              border: `2px solid ${INK}`,
                              borderRadius: 2,
                              padding: "4px 9px",
                              cursor: "pointer",
                            }}
                          >
                            Retry
                          </button>
                          <button
                            onClick={() => dismissError(e.id)}
                            aria-label={`Dismiss ${e.name}`}
                            style={{ background: "transparent", border: "none", cursor: "pointer", color: "#7A1F16" }}
                          >
                            <Trash2 size={15} strokeWidth={2.3} />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Footer — pull handle button */}
          <div style={{ padding: "12px 16px 16px", borderTop: `2px solid ${INK}`, flexShrink: 0, background: "#FFFFFF" }}>
            <button
              onClick={handleSubmit}
              disabled={!files.length || status === "sending"}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: GREEN,
                color: OFFWHITE,
                fontWeight: 800,
                fontSize: 14,
                border: `2px solid ${INK}`,
                borderRadius: 2,
                padding: "11px 0",
                cursor: !files.length || status === "sending" ? "not-allowed" : "pointer",
                opacity: !files.length || status === "sending" ? 0.45 : 1,
              }}
            >
              {status === "sending" ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Filing...
                </>
              ) : (
                `File ${files.length ? `${files.length} item${files.length > 1 ? "s" : ""}` : "orders"} to sheet`
              )}
            </button>
          </div>
        </div>

        <div style={{ position: "relative", height: 10 }}>
          <Rivet style={{ left: 8, bottom: 2 }} />
          <Rivet style={{ right: 8, bottom: 2 }} />
        </div>
      </div>
    </div>
  );
}
