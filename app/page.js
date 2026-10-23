"use client";
import { useState, useEffect } from "react";

const NICHES = [
  { value: "all", label: "All niches" },
  { value: "software and SaaS", label: "Software & SaaS" },
  { value: "finance and investing", label: "Finance & Investing" },
  { value: "health and wellness", label: "Health & Wellness" },
  { value: "marketing and business tools", label: "Marketing & Business" },
  { value: "education and online courses", label: "Education & Courses" },
  { value: "ecommerce and dropshipping", label: "E-commerce & Dropshipping" },
  { value: "AI tools", label: "AI Tools" },
  { value: "travel and lifestyle", label: "Travel & Lifestyle" },
  { value: "crypto and web3", label: "Crypto & Web3" },
  { value: "home and garden", label: "Home & Garden" },
];

const TYPES = [
  { value: "both", label: "Both standard & high-ticket" },
  { value: "standard", label: "Standard only" },
  { value: "high", label: "High-ticket only ($500+)" },
];

const SORTS = [
  { value: "commission", label: "Highest commission" },
  { value: "cookie", label: "Cookie duration" },
  { value: "epc", label: "EPC (earnings/click)" },
];

const STAGES = ["researching", "applied", "active", "paused"];
const STAGE_LABELS = {
  researching: "Researching",
  applied: "Applied",
  active: "Active",
  paused: "Paused",
};
const STAGE_COLORS = {
  researching: { bg: "#eff6ff", text: "#1d4ed8" },
  applied: { bg: "#fef3c7", text: "#d97706" },
  active: { bg: "#ecfdf5", text: "#059669" },
  paused: { bg: "#f3f4f6", text: "#6b7280" },
};

function loadLS(key, def) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : def;
  } catch {
    return def;
  }
}

function saveLS(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("research");

  // Research state
  const [niche, setNiche] = useState("all");
  const [commType, setCommType] = useState("both");
  const [sortBy, setSortBy] = useState("commission");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("idle");
  const [log, setLog] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [searchCount, setSearchCount] = useState(0);
  const [saved, setSaved] = useState([]);
  const [resTab, setResTab] = useState("all");

  // Pipeline / analytics state (persisted)
  const [pipeline, setPipeline] = useState({});
  const [pipelineData, setPipelineData] = useState({});
  const [notes, setNotes] = useState({});
  const [targets, setTargets] = useState({});

  // Outreach modal
  const [outreachModal, setOutreachModal] = useState(null); // { program, email, loading }

  useEffect(() => {
    setPipeline(loadLS("aff_pipeline", {}));
    setPipelineData(loadLS("aff_pipeline_data", {}));
    setNotes(loadLS("aff_notes", {}));
    setTargets(loadLS("aff_targets", {}));
  }, []);

  const persistPipeline = (p) => { setPipeline(p); saveLS("aff_pipeline", p); };
  const persistPipelineData = (d) => { setPipelineData(d); saveLS("aff_pipeline_data", d); };
  const persistNotes = (n) => { setNotes(n); saveLS("aff_notes", n); };
  const persistTargets = (t) => { setTargets(t); saveLS("aff_targets", t); };

  const addLog = (msg) => setLog((l) => [...l, msg]);

  const runResearch = async () => {
    setStatus("running");
    setLog([]);
    setPrograms([]);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, commType, sortBy, keyword }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "status") addLog(data.message);
            else if (data.type === "results") {
              setPrograms(data.programs || []);
              setSearchCount(data.searchCount || 0);
              setStatus("done");
            } else if (data.type === "error") {
              addLog("❌ " + data.message);
              setStatus("error");
            }
          } catch {}
        }
      }
      if (status !== "done") setStatus("done");
    } catch (err) {
      addLog("❌ " + err.message);
      setStatus("error");
    }
  };

  const toggleSaved = (name) =>
    setSaved((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]));

  const addToPipeline = (p) => {
    const newPipeline = { ...pipeline, [p.name]: pipeline[p.name] || "researching" };
    const newData = {
      ...pipelineData,
      [p.name]: pipelineData[p.name] || {
        name: p.name, commission: p.commission, type: p.type,
        niche: p.niche, network: p.network, joinUrl: p.joinUrl, stage: "researching",
      },
    };
    persistPipeline(newPipeline);
    persistPipelineData(newData);
  };

  const setStage = (name, stage) => {
    const p = { ...pipeline, [name]: stage };
    persistPipeline(p);
    const d = { ...pipelineData, [name]: { ...pipelineData[name], stage } };
    persistPipelineData(d);
  };

  const removeFromPipeline = (name) => {
    const p = { ...pipeline }; delete p[name];
    const d = { ...pipelineData }; delete d[name];
    const n = { ...notes }; delete n[name];
    const t = { ...targets }; delete t[name];
    persistPipeline(p);
    persistPipelineData(d);
    persistNotes(n);
    persistTargets(t);
  };

  const writeOutreach = async (prog) => {
    setOutreachModal({ program: prog, email: "", loading: true });
    try {
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ program: prog }),
      });
      const data = await res.json();
      setOutreachModal({ program: prog, email: data.email || data.error || "Error generating email.", loading: false });
    } catch (err) {
      setOutreachModal({ program: prog, email: "Error: " + err.message, loading: false });
    }
  };

  const displayed = resTab === "saved" ? programs.filter((p) => saved.includes(p.name)) : programs;
  const high = displayed.filter((p) => p.type === "high");
  const standard = displayed.filter((p) => p.type !== "high");
  const showHigh = commType !== "standard";
  const showStd = commType !== "high";

  const pipelineCount = Object.keys(pipeline).length;

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, sans-serif" }}>
      {/* NAV */}
      <div style={{ background: "#1a5dc8", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 22 }}>💰</span>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>Affiliate Agency</div>
          <div style={{ color: "#93c5fd", fontSize: 12 }}>High-ticket affiliate management platform</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {pipelineCount > 0 && (
            <span style={{ fontSize: 12, background: "rgba(255,255,255,.2)", color: "#fff", padding: "3px 10px", borderRadius: 99, fontWeight: 600 }}>
              {pipelineCount} in pipeline
            </span>
          )}
          {status === "done" && (
            <span style={{ fontSize: 12, background: "#22c55e", color: "#fff", padding: "3px 10px", borderRadius: 99, fontWeight: 600 }}>
              ✓ {programs.length} found
            </span>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
        {/* TAB NAV */}
        <div style={{ display: "flex", borderBottom: "2px solid #e5e7eb", marginBottom: 24 }}>
          {[["research", "🔍 Research"], ["pipeline", `📋 Pipeline${pipelineCount ? ` (${pipelineCount})` : ""}`], ["analytics", "📊 Analytics"]].map(([k, label]) => (
            <button key={k} onClick={() => setActiveTab(k)}
              style={{ fontSize: 14, fontWeight: 700, padding: "10px 20px", border: "none", background: "none", cursor: "pointer",
                color: activeTab === k ? "#1a5dc8" : "#9ca3af",
                borderBottom: `2px solid ${activeTab === k ? "#1a5dc8" : "transparent"}`, marginBottom: -2 }}>
              {label}
            </button>
          ))}
        </div>

        {/* RESEARCH TAB */}
        {activeTab === "research" && (
          <>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 14, textTransform: "uppercase", letterSpacing: ".05em" }}>
                🔎 Research Parameters
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runResearch()}
                  placeholder='Optional keyword — e.g. "recurring SaaS", "weight loss", "crypto trading"'
                  style={{ flex: 1, fontSize: 14, padding: "10px 14px", border: "2px solid #e5e7eb", borderRadius: 8, outline: "none", background: "#fff" }}
                  onFocus={(e) => (e.target.style.borderColor = "#1a5dc8")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "Niche", val: niche, set: setNiche, opts: NICHES },
                  { label: "Commission type", val: commType, set: setCommType, opts: TYPES },
                  { label: "Sort results by", val: sortBy, set: setSortBy, opts: SORTS },
                ].map((f) => (
                  <div key={f.label}>
                    <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5 }}>{f.label}</div>
                    <select value={f.val} onChange={(e) => f.set(e.target.value)}
                      style={{ width: "100%", fontSize: 13, padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 7, background: "#fff", color: "#111", cursor: "pointer", height: 38 }}>
                      {f.opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <button onClick={runResearch} disabled={status === "running"}
                style={{ width: "100%", padding: "13px 0", fontSize: 15, fontWeight: 700,
                  background: status === "running" ? "#93c5fd" : "#1a5dc8",
                  color: "#fff", border: "none", borderRadius: 8, cursor: status === "running" ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {status === "running" ? (
                  <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>Searching the web for live affiliate programs…</>
                ) : <>🔍 Search for Affiliate Programs</>}
              </button>
            </div>

            {log.length > 0 && (
              <div style={{ background: "#0f172a", borderRadius: 10, padding: "14px 16px", marginBottom: 20, fontFamily: "monospace" }}>
                {log.map((l, i) => (
                  <div key={i} style={{ fontSize: 13, color: i === log.length - 1 ? "#86efac" : "#94a3b8", marginBottom: 3 }}>{l}</div>
                ))}
              </div>
            )}

            {programs.length > 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", borderBottom: "2px solid #e5e7eb", marginBottom: 16 }}>
                  {[["all", `All Results (${programs.length})`], ["saved", `Saved (${saved.length})`]].map(([k, label]) => (
                    <button key={k} onClick={() => setResTab(k)}
                      style={{ fontSize: 13, fontWeight: 700, padding: "8px 18px", border: "none", background: "none", cursor: "pointer",
                        color: resTab === k ? "#1a5dc8" : "#9ca3af",
                        borderBottom: `2px solid ${resTab === k ? "#1a5dc8" : "transparent"}`, marginBottom: -2 }}>
                      {label}
                    </button>
                  ))}
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af", paddingBottom: 4 }}>{searchCount} web searches performed</span>
                </div>
                {displayed.length === 0 && (
                  <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🔖</div>
                    <p>No saved programs yet — click 🔖 on any card</p>
                  </div>
                )}
                {showHigh && high.length > 0 && <SectionHead label="High-ticket programs" emoji="💎" sub={`${high.length} programs · $500+ per conversion`} color="#7c3aed" />}
                {showHigh && high.map((p) => (
                  <ProgramCard key={p.name} p={p} saved={saved.includes(p.name)} onToggle={toggleSaved}
                    pipelineStage={pipeline[p.name]} onAddToPipeline={addToPipeline} />
                ))}
                {showStd && standard.length > 0 && <SectionHead label="Standard commission programs" emoji="🏷️" sub={`${standard.length} programs · recurring & per-sale`} color="#059669" />}
                {showStd && standard.map((p) => (
                  <ProgramCard key={p.name} p={p} saved={saved.includes(p.name)} onToggle={toggleSaved}
                    pipelineStage={pipeline[p.name]} onAddToPipeline={addToPipeline} />
                ))}
              </>
            )}

            {status === "idle" && programs.length === 0 && (
              <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#9ca3af" }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>🤖</div>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Ready to research</p>
                <p style={{ fontSize: 14 }}>Set your filters above and click Search — the agent will<br />scan the web for real, current affiliate programs right now.</p>
              </div>
            )}
          </>
        )}

        {/* PIPELINE TAB */}
        {activeTab === "pipeline" && (
          <PipelineTab
            pipeline={pipeline}
            pipelineData={pipelineData}
            notes={notes}
            targets={targets}
            onSetStage={setStage}
            onRemove={removeFromPipeline}
            onUpdateNote={(name, val) => { const n = { ...notes, [name]: val }; persistNotes(n); }}
            onUpdateTarget={(name, val) => { const t = { ...targets, [name]: val }; persistTargets(t); }}
            onWriteOutreach={writeOutreach}
          />
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <AnalyticsTab pipeline={pipeline} pipelineData={pipelineData} targets={targets} />
        )}
      </div>

      {/* OUTREACH MODAL */}
      {outreachModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, maxWidth: 600, width: "100%", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16, flex: 1 }}>✉️ Outreach Email — {outreachModal.program.name}</div>
              <button onClick={() => setOutreachModal(null)} style={{ border: "none", background: "#f3f4f6", borderRadius: 7, cursor: "pointer", padding: "6px 10px", fontSize: 14 }}>✕ Close</button>
            </div>
            {outreachModal.loading ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", gap: 8 }}>
                <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Writing email…
              </div>
            ) : (
              <>
                <textarea readOnly value={outreachModal.email}
                  style={{ flex: 1, resize: "none", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: 14, fontSize: 13, lineHeight: 1.7, fontFamily: "system-ui, sans-serif", color: "#374151", minHeight: 280 }} />
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button onClick={() => { navigator.clipboard.writeText(outreachModal.email); }}
                    style={{ flex: 1, padding: "10px 0", background: "#1a5dc8", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                    📋 Copy to Clipboard
                  </button>
                  <button onClick={() => setOutreachModal(null)}
                    style={{ padding: "10px 18px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 600px) {
          .pipeline-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .filter-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function SectionHead({ label, emoji, sub, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0 12px" }}>
      <span>{emoji}</span>
      <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color }}>{label}</span>
      <span style={{ fontSize: 11, color: "#9ca3af" }}>{sub}</span>
      <div style={{ flex: 1, height: 1, background: "#e5e7eb", marginLeft: 4 }} />
    </div>
  );
}

function ProgramCard({ p, saved, onToggle, pipelineStage, onAddToPipeline }) {
  const isHigh = p.type === "high";
  const accent = isHigh ? "#7c3aed" : "#059669";
  const accentBg = isHigh ? "#f3f0ff" : "#ecfdf5";
  const stageColor = pipelineStage ? STAGE_COLORS[pipelineStage] : null;

  return (
    <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", marginBottom: 12, transition: "border-color .2s, box-shadow .2s" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${accentBg}`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 9, background: accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
          {isHigh ? "💎" : "💵"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 2 }}>{p.name}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{p.company} · via {p.network}</div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {pipelineStage && (
            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, fontWeight: 700, background: stageColor.bg, color: stageColor.text }}>
              {STAGE_LABELS[pipelineStage]}
            </span>
          )}
          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, fontWeight: 700, background: accentBg, color: accent }}>
            {isHigh ? "💎 High-ticket" : "✅ Standard"}
          </span>
          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: "#eff6ff", color: "#1d4ed8", fontWeight: 600 }}>{p.niche}</span>
          <button onClick={() => onToggle(p.name)} title={saved ? "Remove" : "Save"}
            style={{ border: `1.5px solid ${saved ? "#fbbf24" : "#e5e7eb"}`, background: saved ? "#fffbeb" : "#fafafa", borderRadius: 7, cursor: "pointer", fontSize: 15, padding: "4px 8px", lineHeight: 1 }}>
            🔖
          </button>
        </div>
      </div>
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
        {[
          { label: "Commission", val: p.commission, hi: true },
          { label: "Cookie", val: p.cookie },
          { label: "Avg payout", val: p.avgPayout },
          { label: "EPC", val: p.epc },
        ].map((s) => (
          <div key={s.label} style={{ background: "#f9fafb", border: "1px solid #f0f0f0", borderRadius: 7, padding: "8px 10px" }}>
            <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3, fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: s.hi ? accent : "#1f2937", lineHeight: 1.3 }}>{s.val}</div>
          </div>
        ))}
      </div>
      {p.tags && p.tags.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {p.tags.map((t) => <span key={t} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#f3f4f6", color: "#6b7280", fontWeight: 500 }}>#{t}</span>)}
        </div>
      )}
      <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.7, margin: "0 0 14px" }}>{p.description}</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a href={p.joinUrl} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 13, padding: "8px 16px", borderRadius: 7, background: accent, color: "#fff", textDecoration: "none", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
          ✦ Join program ↗
        </a>
        {p.adsUrl && (
          <a href={p.adsUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 13, padding: "8px 14px", borderRadius: 7, border: "1.5px solid #e5e7eb", color: "#374151", textDecoration: "none", background: "#fff", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
            👁 View ads
          </a>
        )}
        {p.networkUrl && (
          <a href={p.networkUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 13, padding: "8px 14px", borderRadius: 7, border: "1.5px solid #e5e7eb", color: "#374151", textDecoration: "none", background: "#fff", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
            🏪 Network page
          </a>
        )}
        <button onClick={() => onAddToPipeline(p)}
          style={{ fontSize: 13, padding: "8px 14px", borderRadius: 7, border: `1.5px solid ${pipelineStage ? "#22c55e" : "#e5e7eb"}`, color: pipelineStage ? "#15803d" : "#374151", background: pipelineStage ? "#f0fdf4" : "#fff", cursor: "pointer", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 5 }}>
          {pipelineStage ? "✓ In Pipeline" : "➕ Add to Pipeline"}
        </button>
      </div>
    </div>
  );
}

function PipelineTab({ pipeline, pipelineData, notes, targets, onSetStage, onRemove, onUpdateNote, onUpdateTarget, onWriteOutreach }) {
  const allNames = Object.keys(pipeline);

  if (allNames.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#9ca3af" }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
        <p style={{ fontSize: 18, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Pipeline is empty</p>
        <p style={{ fontSize: 14 }}>Go to the Research tab, find programs, and click "Add to Pipeline".</p>
      </div>
    );
  }

  return (
    <div className="pipeline-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
      {STAGES.map((stage) => {
        const items = allNames.filter((n) => pipeline[n] === stage);
        const stageColor = STAGE_COLORS[stage];
        return (
          <div key={stage}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "8px 12px", background: stageColor.bg, borderRadius: 9 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: stageColor.text, flex: 1 }}>{STAGE_LABELS[stage]}</span>
              <span style={{ fontSize: 12, background: stageColor.text, color: "#fff", borderRadius: 99, padding: "1px 8px", fontWeight: 700 }}>{items.length}</span>
            </div>
            {items.length === 0 && (
              <div style={{ fontSize: 12, color: "#d1d5db", textAlign: "center", padding: "20px 0", border: "2px dashed #e5e7eb", borderRadius: 8 }}>Empty</div>
            )}
            {items.map((name) => {
              const prog = pipelineData[name] || { name, commission: "—", type: "standard", niche: "—", network: "—" };
              const isHigh = prog.type === "high";
              const accent = isHigh ? "#7c3aed" : "#059669";
              const accentBg = isHigh ? "#f3f0ff" : "#ecfdf5";
              return (
                <div key={name} style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 2, lineHeight: 1.3 }}>{name}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>{prog.niche} · {prog.network}</div>
                    </div>
                    <button onClick={() => onRemove(name)} title="Remove" style={{ border: "none", background: "#fef2f2", color: "#dc2626", borderRadius: 6, cursor: "pointer", fontSize: 12, padding: "3px 7px", flexShrink: 0 }}>✕</button>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: accentBg, color: accent, fontWeight: 700 }}>
                      {isHigh ? "💎 High-ticket" : "✅ Standard"}
                    </span>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#f3f4f6", color: "#374151", fontWeight: 600 }}>{prog.commission}</span>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>Move to stage</div>
                    <select value={pipeline[name]} onChange={(e) => onSetStage(name, e.target.value)}
                      style={{ width: "100%", fontSize: 12, padding: "6px 8px", border: "1.5px solid #e5e7eb", borderRadius: 6, background: "#fff", color: "#111", cursor: "pointer" }}>
                      {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>Monthly target (conversions)</div>
                    <input type="number" min="0" value={targets[name] || ""} onChange={(e) => onUpdateTarget(name, e.target.value)}
                      placeholder="e.g. 5"
                      style={{ width: "100%", fontSize: 12, padding: "6px 8px", border: "1.5px solid #e5e7eb", borderRadius: 6, outline: "none" }} />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>Notes</div>
                    <textarea value={notes[name] || ""} onChange={(e) => onUpdateNote(name, e.target.value)}
                      placeholder="Tracking links, contacts, ideas…"
                      rows={2}
                      style={{ width: "100%", fontSize: 12, padding: "6px 8px", border: "1.5px solid #e5e7eb", borderRadius: 6, resize: "none", fontFamily: "system-ui, sans-serif", outline: "none" }} />
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {prog.joinUrl && (
                      <a href={prog.joinUrl} target="_blank" rel="noopener noreferrer"
                        style={{ flex: 1, fontSize: 11, padding: "7px 0", borderRadius: 6, background: accent, color: "#fff", textDecoration: "none", fontWeight: 700, textAlign: "center" }}>
                        Join ↗
                      </a>
                    )}
                    <button onClick={() => onWriteOutreach(prog)}
                      style={{ flex: 1, fontSize: 11, padding: "7px 0", borderRadius: 6, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer", fontWeight: 600 }}>
                      ✉️ Outreach
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function AnalyticsTab({ pipeline, pipelineData, targets }) {
  const activeNames = Object.keys(pipeline).filter((n) => pipeline[n] === "active");

  const parseCommission = (commStr) => {
    if (!commStr) return null;
    const match = commStr.match(/\$?([\d,]+)/);
    if (match) return parseFloat(match[1].replace(/,/g, ""));
    return null;
  };

  const rows = activeNames.map((name) => {
    const prog = pipelineData[name] || {};
    const target = parseFloat(targets[name]) || 0;
    const commVal = parseCommission(prog.commission);
    const est = commVal && target ? commVal * target : null;
    return { name, commission: prog.commission || "—", target, commVal, est };
  });

  const totalEst = rows.reduce((sum, r) => sum + (r.est || 0), 0);

  if (activeNames.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#9ca3af" }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>📊</div>
        <p style={{ fontSize: 18, fontWeight: 700, color: "#374151", marginBottom: 6 }}>No active programs yet</p>
        <p style={{ fontSize: 14 }}>Move programs to "Active" in the Pipeline tab to see earnings estimates here.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>📊</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>Active Program Earnings Estimates</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["Program", "Commission", "Monthly Target", "Est. Monthly Revenue"].map((h) => (
                <th key={h} style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".05em", padding: "10px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, color: "#111", borderBottom: "1px solid #f3f4f6" }}>{r.name}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#059669", fontWeight: 700, borderBottom: "1px solid #f3f4f6" }}>{r.commission}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f3f4f6" }}>
                  {r.target ? `${r.target} / mo` : <span style={{ color: "#d1d5db" }}>— set in pipeline</span>}
                </td>
                <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 700, color: r.est ? "#1a5dc8" : "#d1d5db", borderBottom: "1px solid #f3f4f6" }}>
                  {r.est ? `$${r.est.toLocaleString()}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "#f0f7ff" }}>
              <td colSpan={3} style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#374151" }}>Total estimated monthly revenue</td>
              <td style={{ padding: "12px 16px", fontSize: 16, fontWeight: 800, color: "#1a5dc8" }}>
                {totalEst > 0 ? `$${totalEst.toLocaleString()}` : "—"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 12, textAlign: "center" }}>
        Estimates based on your targets — actual results vary.
      </p>
    </div>
  );
}
