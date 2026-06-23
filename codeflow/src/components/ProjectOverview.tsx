import { useState } from "react";
import { FileText, Sparkles, RefreshCw, BookOpen, Layers, Code, Zap, ChevronDown, ChevronRight } from "lucide-react";

interface StitchPage {
  title: string;
  content: string;
  icon: string;
  highlights: string[];
}

export default function ProjectOverview({ darkMode, onBack }: { darkMode: boolean; onBack: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [pages, setPages] = useState<StitchPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPage, setExpandedPage] = useState<number | null>(0);
  const dc = darkMode;
  const pageColors = ["#ffcc00", "#0055ff", "#e63b2e", "#10b981", "#8b5cf6", "#f59e0b"];

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true); setError(null); setPages([]);
    try {
      const r = await fetch("/api/generate-overview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || "Failed"); }
      const d = await r.json();
      setPages(d.pages || []); setExpandedPage(0);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const iconMap: Record<string, React.ReactNode> = { overview: <BookOpen className="w-5 h-5" />, architecture: <Layers className="w-5 h-5" />, tech: <Code className="w-5 h-5" />, features: <Zap className="w-5 h-5" />, default: <FileText className="w-5 h-5" /> };
  const getIcon = (icon: string) => iconMap[icon?.toLowerCase()] || iconMap["default"];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: dc ? "#0f0f17" : "#f5f0e8", color: dc ? "#e2e8f0" : "#1a1a1a" }}>
      <header className="w-full px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-30" style={{ borderBottom: "3px solid #1a1a1a", background: dc ? "#1a1a2e" : "#faf7f2" }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="px-3.5 py-1.5 text-xs uppercase font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", border: "2px solid #1a1a1a", background: dc ? "#2a2a3e" : "#f5f0e8", color: dc ? "#e2e8f0" : "#1a1a1a", boxShadow: "3px 3px 0px 0px #1a1a1a" }}>← Back</button>
          <span className="text-lg font-black tracking-tight uppercase flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <span className="w-5 h-5 inline-flex items-center justify-center text-[10px] font-black" style={{ background: "#ffcc00", border: "2px solid #1a1a1a" }}>P</span>
            Project Overview
          </span>
        </div>
      </header>

      <div className="w-full max-w-4xl mx-auto px-6 pt-10 pb-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Generate Project <span style={{ color: "#0055ff" }}>Overview</span>
          </h1>
          <p className="text-sm font-medium max-w-xl mx-auto" style={{ color: dc ? "#888" : "#666" }}>Describe your project idea to generate a comprehensive multi-page overview.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 flex" style={{ border: "3px solid #1a1a1a", background: dc ? "#1e1e2e" : "#fff" }}>
            <div className="px-3 flex items-center" style={{ background: dc ? "#2a2a3e" : "#f0ede6", borderRight: "2px solid #1a1a1a" }}><Sparkles className="w-4 h-4" style={{ color: "#8b5cf6" }} /></div>
            <input value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && generate()} placeholder="e.g. A real-time collaborative code editor..." className="flex-1 px-4 py-3 text-sm font-semibold focus:outline-none" style={{ background: "transparent", color: dc ? "#e2e8f0" : "#1a1a1a", caretColor: "#8b5cf6" }} />
          </div>
          <button onClick={generate} disabled={loading} className="px-6 py-3 font-black text-sm uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif", border: "3px solid #1a1a1a", background: loading ? "#999" : "#ffcc00", color: "#1a1a1a", boxShadow: loading ? "none" : "4px 4px 0px 0px #1a1a1a" }}>
            {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Working...</> : <>Generate <Sparkles className="w-4 h-4" /></>}
          </button>
        </div>
      </div>

      {error && <div className="max-w-4xl mx-auto px-6 mb-4"><div className="p-4 text-xs font-bold uppercase" style={{ border: "2px solid #e63b2e", background: dc ? "#3a1a1a" : "#ffdad6", color: "#e63b2e" }}>⚠ {error}</div></div>}

      {loading && (
        <div className="flex flex-col items-center py-16 gap-4">
          <div className="w-16 h-16 border-4 border-t-[#ffcc00] animate-spin" style={{ borderColor: "#1a1a1a", borderTopColor: "#ffcc00" }} />
          <p className="font-black text-lg uppercase animate-pulse" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Generating Stitch Pages...</p>
        </div>
      )}

      {!loading && pages.length > 0 && (
        <div className="w-full max-w-4xl mx-auto px-6 pb-16 space-y-4">
          <div className="flex items-center justify-between mb-6">
            <span className="font-black text-xs uppercase tracking-widest" style={{ fontFamily: "'Space Grotesk', sans-serif", color: dc ? "#888" : "#666" }}>{pages.length} Pages Generated</span>
            <button onClick={() => { setPages([]); setPrompt(""); }} className="px-3 py-1 text-[10px] uppercase font-bold" style={{ border: "2px solid #1a1a1a", background: dc ? "#2a2a3e" : "#f5f0e8" }}>Reset</button>
          </div>
          {pages.map((page, i) => {
            const color = pageColors[i % pageColors.length];
            const isExp = expandedPage === i;
            return (
              <div key={i} style={{ border: "3px solid #1a1a1a", boxShadow: isExp ? "6px 6px 0px 0px #1a1a1a" : "3px 3px 0px 0px #1a1a1a", background: dc ? "#1e1e2e" : "#fff" }}>
                <button onClick={() => setExpandedPage(isExp ? null : i)} className="w-full flex items-center justify-between p-4 text-left" style={{ borderBottom: isExp ? "3px solid #1a1a1a" : "none" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center" style={{ background: color, border: "2px solid #1a1a1a", color: color === "#ffcc00" ? "#1a1a1a" : "#fff" }}>{getIcon(page.icon)}</div>
                    <div>
                      <span className="font-black text-sm uppercase tracking-wider block" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{page.title}</span>
                      <span className="text-[10px] uppercase font-bold" style={{ color: dc ? "#666" : "#999" }}>Page {i + 1}</span>
                    </div>
                  </div>
                  {isExp ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                {isExp && (
                  <div className="p-6 space-y-4">
                    <div className="text-sm leading-relaxed font-medium whitespace-pre-wrap" style={{ color: dc ? "#ccc" : "#444" }}>{page.content}</div>
                    {page.highlights?.length > 0 && (
                      <div>
                        <span className="font-black text-[10px] uppercase tracking-widest block mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: dc ? "#888" : "#999" }}>Key Highlights</span>
                        <div className="flex flex-wrap gap-2">
                          {page.highlights.map((h, hi) => <span key={hi} className="px-2.5 py-1 text-[10px] uppercase font-bold" style={{ border: "2px solid #1a1a1a", background: `${color}20` }}>{h}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && pages.length === 0 && !error && (
        <div className="flex flex-col items-center py-16 gap-4 text-center">
          <div className="w-20 h-20 flex items-center justify-center" style={{ border: "3px dashed #1a1a1a", opacity: 0.3 }}><FileText className="w-10 h-10" /></div>
          <p className="font-black text-sm uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif", color: dc ? "#666" : "#999" }}>Enter a project idea above</p>
        </div>
      )}
    </div>
  );
}
