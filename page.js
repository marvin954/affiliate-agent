"use client";
import { useState } from "react";

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

export default function Home() {
  const [niche, setNiche] = useState("all");
  const [commType, setCommType] = useState("both");
  const [sortBy, setSortBy] = useState("commission");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | running | done | error
  const [log, setLog] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [searchCount, setSearchCount] = useState(0);
  const [saved, setSaved] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

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
            if (data.type === "status") {
              addLog(data.message);
            } else if (data.type === "results") {
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

  const toggle = (name) =>
    setSaved((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]));

  const displayed =
    activeTab === "saved" ? programs.filter((p) => saved.includes(p.name)) : programs;

  const high = displayed.filter((p) => p.type === "high");
  const standard = displayed.filter((p) => p.type !== "high");
  const showHigh = commType !== "standard";
  const showStd = commType !== "high";

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, sans-serif" }}>
      {/* NAV */}
      <div style={{ background: "#1a5dc8", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 22 }}>💰</span>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>Affiliate Research Agent</div>
          <div style={{ color: "#93c5fd", fontSize: 12 }}>Live web search — finds real current offers every time</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {status === "done" && (
            <span style={{ fontSize: 12, background: "#22c55e", color: "#fff", padding: "3px 10px", borderRadius: 99, fontWeight: 600 }}>
              ✓ {programs.length} programs found
            </span>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>
        {/* SEARCH PANEL */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 14, textTransform: "uppercase", letterSpacing: ".05em" }}>
            🔎 Research Parameters
          </div>

          {/* keyword row */}
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

          {/* filter row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[
              { label: "Niche", val: niche, set: setNiche, opts: NICHES },
              { label: "Commission type", val: commType, set: setCommType, opts: TYPES },
              { label: "Sort results by", val: sortBy, set: setSortBy, opts: SORTS },
            ].map((f) => (
              <div key={f.label}>
                <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5 }}>
                  {f.label}
                </div>
                <select
                  value={f.val}
                  onChange={(e) => f.set(e.target.value)}
                  style={{ width: "100%", fontSize: 13, padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 7, background: "#fff", color: "#111", cursor: "pointer", height: 38 }}
                >
                  {f.opts.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* SEARCH BUTTON */}
          <button
            onClick={runResearch}
            disabled={status === "running"}
            style={{
              width: "100%", padding: "13px 0", fontSize: 15, fontWeight: 700,
              background: status === "running" ? "#93c5fd" : "#1a5dc8",
              color: "#fff", border: "none", borderRadius: 8, cursor: status === "running" ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background .15s",
            }}
          >
            {status === "running" ? (
              <>
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
                Searching the web for live affiliate programs…
              </>
            ) : (
              <>🔍 Search for Affiliate Programs</>
            )}
          </button>
        </div>

        {/* LOG / STATUS */}
        {log.length > 0 && (
          <div style={{ background: "#0f172a", borderRadius: 10, padding: "14px 16px", marginBottom: 20, fontFamily: "monospace" }}>
            {log.map((l, i) => (
              <div key={i} style={{ fontSize: 13, color: i === log.length - 1 ? "#86efac" : "#94a3b8", marginBottom: 3 }}>
                {l}
              </div>
            ))}
          </div>
        )}

        {/* RESULTS */}
        {programs.length > 0 && (
          <>
            {/* tabs + count */}
            <div style={{ display: "flex", alignItems: "center", borderBottom: "2px solid #e5e7eb", marginBottom: 16 }}>
              {[["all", `All Results (${programs.length})`], ["saved", `Saved (${saved.length})`]].map(([k, label]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  style={{ fontSize: 13, fontWeight: 700, padding: "8px 18px", border: "none", background: "none", cursor: "pointer",
                    color: activeTab === k ? "#1a5dc8" : "#9ca3af",
                    borderBottom: `2px solid ${activeTab === k ? "#1a5dc8" : "transparent"}`, marginBottom: -2 }}>
                  {label}
                </button>
              ))}
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af", paddingBottom: 4 }}>
                {searchCount} web searches performed
              </span>
            </div>

            {displayed.length === 0 && (
              <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🔖</div>
                <p>No saved programs yet — click 🔖 on any card</p>
              </div>
            )}

            {showHigh && high.length > 0 && <SectionHead label="High-ticket programs" emoji="💎" sub={`${high.length} programs · $500+ per conversion`} color="#7c3aed" />}
            {showHigh && high.map((p) => <ProgramCard key={p.name} p={p} saved={saved.includes(p.name)} onToggle={toggle} />)}

            {showStd && standard.length > 0 && <SectionHead label="Standard commission programs" emoji="🏷️" sub={`${standard.length} programs · recurring & per-sale`} color="#059669" />}
            {showStd && standard.map((p) => <ProgramCard key={p.name} p={p} saved={saved.includes(p.name)} onToggle={toggle} />)}
          </>
        )}

        {/* IDLE STATE */}
        {status === "idle" && programs.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#9ca3af" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🤖</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Ready to research</p>
            <p style={{ fontSize: 14 }}>Set your filters above and click Search — the agent will<br />scan the web for real, current affiliate programs right now.</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
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

function ProgramCard({ p, saved, onToggle }) {
  const isHigh = p.type === "high";
  const accent = isHigh ? "#7c3aed" : "#059669";
  const accentBg = isHigh ? "#f3f0ff" : "#ecfdf5";

  return (
    <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", marginBottom: 12, transition: "border-color .2s, box-shadow .2s" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${accentBg}`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}>

      {/* header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 9, background: accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
          {isHigh ? "💎" : "💵"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 2 }}>{p.name}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{p.company} · via {p.network}</div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, fontWeight: 700, background: accentBg, color: accent }}>
            {isHigh ? "💎 High-ticket" : "✅ Standard"}
          </span>
          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: "#eff6ff", color: "#1d4ed8", fontWeight: 600 }}>
            {p.niche}
          </span>
          <button onClick={() => onToggle(p.name)} title={saved ? "Remove" : "Save"}
            style={{ border: `1.5px solid ${saved ? "#fbbf24" : "#e5e7eb"}`, background: saved ? "#fffbeb" : "#fafafa", borderRadius: 7, cursor: "pointer", fontSize: 15, padding: "4px 8px", lineHeight: 1 }}>
            🔖
          </button>
        </div>
      </div>

      {/* stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
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

      {/* tags */}
      {p.tags && p.tags.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {p.tags.map((t) => (
            <span key={t} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#f3f4f6", color: "#6b7280", fontWeight: 500 }}>
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* description */}
      <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.7, margin: "0 0 14px" }}>{p.description}</p>

      {/* action links */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a href={p.joinUrl} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 13, padding: "8px 16px", borderRadius: 7, background: accent, color: "#fff", textDecoration: "none", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = ".85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
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
      </div>
    </div>
  );
}
