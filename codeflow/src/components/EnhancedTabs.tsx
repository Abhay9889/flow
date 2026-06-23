import { TreePine, Shield, ScanSearch, Lightbulb, PlayCircle, GraduationCap, AlertTriangle, CheckCircle, ChevronDown, ChevronRight, RefreshCw, Lock, Unlock, Code, Zap, BookOpen, Eye } from "lucide-react";
import { useState } from "react";
import { ASTAnalysis, SecurityAnalysis, AIDetectionResult, SuggestionsAnalysis, ExecutionTrace, TutorExplanation } from "../types";

interface Props {
  activeTab: string;
  enhancedLoading: string | null;
  astData: ASTAnalysis | null;
  securityData: SecurityAnalysis | null;
  aiDetectData: AIDetectionResult | null;
  suggestionsData: SuggestionsAnalysis | null;
  executionData: ExecutionTrace | null;
  tutorData: TutorExplanation | null;
  onRefresh: (tab: string) => void;
}

const sevColors: Record<string, string> = {
  critical: "#dc2626", high: "#e63b2e", medium: "#f59e0b", low: "#0055ff", info: "#6b7280",
};
const catColors: Record<string, string> = {
  performance: "#e63b2e", readability: "#0055ff", security: "#dc2626", architecture: "#8b5cf6", style: "#f59e0b", "best-practice": "#10b981",
};
const prioColors: Record<string, string> = { high: "#e63b2e", medium: "#f59e0b", low: "#10b981" };

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-14 h-14 border-4 border-primary border-t-[#ffcc00] animate-spin rounded-full" />
      <p className="font-display font-black text-sm uppercase animate-pulse">{label}</p>
      <p className="text-[10px] text-stone-500 font-medium">Powered by Gemini AI</p>
    </div>
  );
}

function SectionHeader({ icon, title, count, onRefresh }: { icon: React.ReactNode; title: string; count?: string; onRefresh: () => void }) {
  return (
    <div className="bg-stone-100 p-3 border-2 border-primary flex justify-between items-center text-xs">
      <span className="font-display font-black uppercase text-stone-700 flex items-center gap-1.5">{icon} {title}</span>
      <div className="flex items-center gap-2">
        {count && <span className="font-mono text-[10px] text-stone-500">{count}</span>}
        <button onClick={onRefresh} className="p-1 border border-primary bg-stone-50 hover:bg-stone-200 transition-all" title="Refresh"><RefreshCw className="w-3 h-3" /></button>
      </div>
    </div>
  );
}

// Recursive AST tree renderer
function ASTTree({ node, depth = 0 }: { node: any; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const nodeColors = ["#ffcc00", "#0055ff", "#8b5cf6", "#e63b2e", "#10b981", "#f59e0b"];
  const color = nodeColors[depth % nodeColors.length];

  return (
    <div style={{ marginLeft: depth * 16 }}>
      <div
        onClick={() => hasChildren && setOpen(!open)}
        className="flex items-center gap-1.5 py-1 cursor-pointer hover:bg-stone-100 px-2 transition-all rounded-none"
      >
        {hasChildren ? (open ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />) : <span className="w-3" />}
        <span className="w-2 h-2 shrink-0" style={{ backgroundColor: color }} />
        <span className="font-mono text-[10px] font-bold uppercase" style={{ color }}>{node.type}</span>
        <span className="text-[10px] font-semibold text-stone-600 truncate">{node.name}</span>
        <span className="text-[9px] text-stone-400 font-mono ml-auto shrink-0">{node.lineRange}</span>
      </div>
      {open && hasChildren && node.children.map((child: any, i: number) => (
        <ASTTree key={i} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function EnhancedTabs(props: Props) {
  const { activeTab, enhancedLoading, astData, securityData, aiDetectData, suggestionsData, executionData, tutorData, onRefresh } = props;
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null);
  const [expandedExecStep, setExpandedExecStep] = useState<number | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  // AST Tab
  if (activeTab === "ast") {
    if (enhancedLoading === "ast") return <LoadingState label="Parsing AST Structure..." />;
    if (!astData) return <div className="py-16 text-center text-xs text-stone-500 font-semibold">No AST data. Click this tab to analyze.</div>;
    return (
      <div className="space-y-4">
        <SectionHeader icon={<TreePine className="w-4 h-4 text-[#8b5cf6]" />} title="Abstract Syntax Tree" count={`${astData.totalNodes} nodes · Depth ${astData.maxDepth}`} onRefresh={() => onRefresh("ast")} />
        <div className="border-3 border-primary bg-stone-50 p-4 overflow-auto max-h-[350px]">
          <ASTTree node={astData.rootNode} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {astData.nodeTypes?.slice(0, 8).map((nt, i) => (
            <div key={i} className="border-2 border-primary bg-stone-50 p-2 text-center">
              <span className="font-mono text-[10px] font-bold uppercase block text-stone-600">{nt.type}</span>
              <span className="font-display font-black text-lg">{nt.count}</span>
            </div>
          ))}
        </div>
        <div className="border-2 border-primary bg-[#faf7f2] p-3 text-xs font-semibold text-stone-600 leading-relaxed">{astData.summary}</div>
      </div>
    );
  }

  // Security Tab
  if (activeTab === "security") {
    if (enhancedLoading === "security") return <LoadingState label="Scanning Security Vulnerabilities..." />;
    if (!securityData) return <div className="py-16 text-center text-xs text-stone-500 font-semibold">No security data. Click this tab to scan.</div>;
    const scoreColor = securityData.overallScore >= 80 ? "#10b981" : securityData.overallScore >= 50 ? "#f59e0b" : "#e63b2e";
    return (
      <div className="space-y-4">
        <SectionHeader icon={<Shield className="w-4 h-4 text-[#10b981]" />} title="Security Analysis" count={`${securityData.vulnerabilities?.length || 0} issues`} onRefresh={() => onRefresh("security")} />
        <div className="grid grid-cols-2 gap-4">
          <div className="border-3 border-primary bg-stone-50 p-4 text-center">
            <span className="font-display font-bold text-[10px] uppercase text-stone-400 block mb-1">Security Score</span>
            <span className="font-display font-black text-4xl" style={{ color: scoreColor }}>{securityData.overallScore}</span>
            <span className="text-xs text-stone-500 font-mono">/100</span>
          </div>
          <div className="border-3 border-primary bg-stone-50 p-4 text-center flex flex-col justify-center">
            <span className="font-display font-bold text-[10px] uppercase text-stone-400 block mb-1">Risk Level</span>
            <span className="font-display font-black text-xl uppercase" style={{ color: scoreColor }}>{securityData.riskLevel}</span>
            <span className="mt-1">{securityData.overallScore >= 80 ? <Lock className="w-5 h-5 mx-auto text-[#10b981]" /> : <Unlock className="w-5 h-5 mx-auto text-[#e63b2e]" />}</span>
          </div>
        </div>
        {securityData.vulnerabilities?.length > 0 && (
          <div className="space-y-2">
            {securityData.vulnerabilities.map((v, i) => (
              <div key={i} className="border-2 border-primary bg-stone-50 p-3" style={{ borderLeftWidth: "5px", borderLeftColor: sevColors[v.severity] || "#666" }}>
                <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase text-white" style={{ background: sevColors[v.severity] }}>{v.severity}</span>
                    <span className="font-display font-black text-xs uppercase">{v.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {v.cweId && <span className="text-[9px] font-mono text-stone-400 border border-stone-300 px-1">{v.cweId}</span>}
                    <span className="text-[9px] font-mono text-stone-400">Line {v.line}</span>
                  </div>
                </div>
                <p className="text-[11px] text-stone-600 font-semibold mb-1">{v.description}</p>
                <p className="text-[11px] text-[#10b981] font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {v.recommendation}</p>
              </div>
            ))}
          </div>
        )}
        {securityData.bestPractices?.length > 0 && (
          <div className="border-2 border-primary bg-stone-50 p-3">
            <p className="font-display font-black text-xs uppercase mb-2 flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-[#10b981]" /> Best Practices</p>
            <ul className="space-y-1">{securityData.bestPractices.map((bp, i) => (
              <li key={i} className="text-[11px] text-stone-600 pl-3 relative font-medium"><span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-[#10b981]" />{bp}</li>
            ))}</ul>
          </div>
        )}
        <div className="text-xs font-semibold text-stone-500 border-2 border-stone-200 p-2 bg-[#faf7f2]">{securityData.summary}</div>
      </div>
    );
  }

  // AI Detection Tab
  if (activeTab === "aidetect") {
    if (enhancedLoading === "aidetect") return <LoadingState label="Analyzing Code Origin..." />;
    if (!aiDetectData) return <div className="py-16 text-center text-xs text-stone-500 font-semibold">No AI detection data. Click to analyze.</div>;
    const aiColor = aiDetectData.overallScore >= 70 ? "#e63b2e" : aiDetectData.overallScore >= 40 ? "#f59e0b" : "#10b981";
    return (
      <div className="space-y-4">
        <SectionHeader icon={<ScanSearch className="w-4 h-4 text-[#f59e0b]" />} title="AI Code Detection" count={aiDetectData.verdict} onRefresh={() => onRefresh("aidetect")} />
        <div className="border-3 border-primary bg-stone-50 p-5 text-center">
          <div className="relative w-24 h-24 mx-auto mb-3">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e5e5" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={aiColor} strokeWidth="8" strokeDasharray={`${aiDetectData.overallScore * 2.64} 264`} strokeLinecap="butt" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display font-black text-2xl" style={{ color: aiColor }}>{aiDetectData.overallScore}%</span>
            </div>
          </div>
          <span className="font-display font-black text-sm uppercase" style={{ color: aiColor }}>{aiDetectData.verdict}</span>
        </div>
        {aiDetectData.indicators?.length > 0 && (
          <div className="space-y-2">
            {aiDetectData.indicators.map((ind, i) => (
              <div key={i} className="border-2 border-primary bg-stone-50 p-3 flex items-start gap-2">
                <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase text-white shrink-0 ${ind.confidence === "High" ? "bg-[#e63b2e]" : ind.confidence === "Medium" ? "bg-[#f59e0b]" : "bg-[#0055ff]"}`}>{ind.confidence}</span>
                <div>
                  <span className="font-display font-bold text-xs uppercase block">{ind.indicator}</span>
                  <p className="text-[11px] text-stone-600 font-medium">{ind.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {aiDetectData.patterns?.length > 0 && (
          <div className="border-2 border-primary bg-stone-50 p-3">
            <p className="font-display font-black text-xs uppercase mb-2">Observed Patterns</p>
            <div className="flex flex-wrap gap-1.5">{aiDetectData.patterns.map((p, i) => (
              <span key={i} className="px-2 py-1 border border-primary text-[10px] font-bold bg-stone-100">{p}</span>
            ))}</div>
          </div>
        )}
        <div className="text-xs font-semibold text-stone-500 border-2 border-stone-200 p-2 bg-[#faf7f2]">{aiDetectData.summary}</div>
      </div>
    );
  }

  // Suggestions Tab
  if (activeTab === "suggestions") {
    if (enhancedLoading === "suggestions") return <LoadingState label="Generating Improvement Suggestions..." />;
    if (!suggestionsData) return <div className="py-16 text-center text-xs text-stone-500 font-semibold">No suggestions yet. Click to generate.</div>;
    const qColor = suggestionsData.overallQuality >= 80 ? "#10b981" : suggestionsData.overallQuality >= 50 ? "#f59e0b" : "#e63b2e";
    return (
      <div className="space-y-4">
        <SectionHeader icon={<Lightbulb className="w-4 h-4 text-[#ffcc00]" />} title="Code Suggestions" count={`${suggestionsData.suggestions?.length || 0} suggestions · Quality: ${suggestionsData.overallQuality}/100`} onRefresh={() => onRefresh("suggestions")} />
        {suggestionsData.quickWins?.length > 0 && (
          <div className="border-2 border-[#10b981] bg-[#ecfdf5] p-3">
            <p className="font-display font-black text-xs uppercase text-[#065f46] mb-2 flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Quick Wins</p>
            <ul className="space-y-1">{suggestionsData.quickWins.map((qw, i) => (
              <li key={i} className="text-[11px] text-[#065f46] font-semibold pl-3 relative"><span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-[#10b981]" />{qw}</li>
            ))}</ul>
          </div>
        )}
        {suggestionsData.suggestions?.map((s, i) => {
          const isExp = expandedSuggestion === i;
          return (
            <div key={i} className="border-2 border-primary bg-stone-50" style={{ borderLeftWidth: "5px", borderLeftColor: catColors[s.category] || "#666" }}>
              <button onClick={() => setExpandedSuggestion(isExp ? null : i)} className="w-full flex items-center justify-between p-3 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase text-white" style={{ background: prioColors[s.priority] }}>{s.priority}</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase border" style={{ borderColor: catColors[s.category], color: catColors[s.category] }}>{s.category}</span>
                  <span className="font-display font-bold text-xs uppercase">{s.title}</span>
                </div>
                {isExp ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
              </button>
              {isExp && (
                <div className="px-3 pb-3 space-y-2 border-t border-stone-200">
                  <p className="text-[11px] text-stone-600 font-semibold pt-2">{s.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="p-2 bg-[#ffdad6] border border-[#e63b2e]">
                      <span className="text-[9px] font-bold uppercase text-[#e63b2e] block mb-1">Before</span>
                      <pre className="text-[10px] font-mono text-stone-800 whitespace-pre-wrap">{s.currentCode}</pre>
                    </div>
                    <div className="p-2 bg-[#ecfdf5] border border-[#10b981]">
                      <span className="text-[9px] font-bold uppercase text-[#10b981] block mb-1">After</span>
                      <pre className="text-[10px] font-mono text-stone-800 whitespace-pre-wrap">{s.suggestedCode}</pre>
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-500 font-medium italic">Impact: {s.impact}</p>
                </div>
              )}
            </div>
          );
        })}
        <div className="text-xs font-semibold text-stone-500 border-2 border-stone-200 p-2 bg-[#faf7f2]">{suggestionsData.summary}</div>
      </div>
    );
  }

  // Execution Tab
  if (activeTab === "execution") {
    if (enhancedLoading === "execution") return <LoadingState label="Tracing Execution Steps..." />;
    if (!executionData) return <div className="py-16 text-center text-xs text-stone-500 font-semibold">No execution trace. Click to simulate.</div>;
    return (
      <div className="space-y-4">
        <SectionHeader icon={<PlayCircle className="w-4 h-4 text-[#0055ff]" />} title="Execution Trace" count={`${executionData.totalSteps} steps`} onRefresh={() => onRefresh("execution")} />
        <div className="space-y-1.5 max-h-[380px] overflow-y-auto">
          {executionData.steps?.map((step, i) => {
            const isExp = expandedExecStep === i;
            return (
              <div key={i} className="border-2 border-primary bg-stone-50">
                <button onClick={() => setExpandedExecStep(isExp ? null : i)} className="w-full flex items-center justify-between p-2 text-left">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 flex items-center justify-center bg-[#0055ff] text-white font-mono text-[10px] font-bold shrink-0">{step.step}</span>
                    <span className="text-[10px] font-display font-bold uppercase">{step.action}</span>
                    <span className="text-[9px] font-mono text-stone-400">L{step.line}</span>
                  </div>
                  {isExp ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                {isExp && (
                  <div className="px-2 pb-2 space-y-1.5 border-t border-stone-200 pt-2">
                    <p className="text-[11px] text-stone-600 font-semibold">{step.explanation}</p>
                    {step.variables?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {step.variables.map((v, vi) => (
                          <span key={vi} className="px-1.5 py-0.5 bg-stone-100 border border-primary text-[9px] font-mono">
                            <span className="text-[#8b5cf6] font-bold">{v.name}</span> = <span className="text-stone-700">{v.value}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {step.output && <div className="p-1.5 bg-[#1a1a1a] text-[#10b981] font-mono text-[10px]">→ {step.output}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {executionData.finalOutput && (
          <div className="border-2 border-[#10b981] bg-[#ecfdf5] p-3">
            <p className="font-display font-black text-xs uppercase text-[#065f46] mb-1">Final Output</p>
            <pre className="text-[11px] font-mono text-[#065f46] whitespace-pre-wrap">{executionData.finalOutput}</pre>
          </div>
        )}
        <div className="text-xs font-semibold text-stone-500 border-2 border-stone-200 p-2 bg-[#faf7f2]">{executionData.summary}</div>
      </div>
    );
  }

  // Tutor Tab
  if (activeTab === "tutor") {
    if (enhancedLoading === "tutor") return <LoadingState label="Preparing AI Lesson..." />;
    if (!tutorData) return <div className="py-16 text-center text-xs text-stone-500 font-semibold">No tutor data. Click to learn.</div>;
    const diffColor = tutorData.difficulty === "Beginner" ? "#10b981" : tutorData.difficulty === "Intermediate" ? "#f59e0b" : tutorData.difficulty === "Advanced" ? "#e63b2e" : "#8b5cf6";
    return (
      <div className="space-y-4">
        <SectionHeader icon={<GraduationCap className="w-4 h-4 text-[#8b5cf6]" />} title="AI Tutor" count={tutorData.conceptName} onRefresh={() => onRefresh("tutor")} />
        <div className="border-3 border-primary bg-stone-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-display font-black text-lg uppercase">{tutorData.conceptName}</span>
            <span className="px-2 py-0.5 text-[9px] font-bold uppercase text-white" style={{ background: diffColor }}>{tutorData.difficulty}</span>
          </div>
          <p className="text-xs text-stone-600 font-semibold leading-relaxed whitespace-pre-line">{tutorData.explanation}</p>
        </div>
        {tutorData.keyTakeaways?.length > 0 && (
          <div className="border-2 border-[#ffcc00] bg-[#fffbeb] p-3">
            <p className="font-display font-black text-xs uppercase text-stone-700 mb-2 flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-[#ffcc00]" /> Key Takeaways</p>
            <ul className="space-y-1">{tutorData.keyTakeaways.map((kt, i) => (
              <li key={i} className="text-[11px] text-stone-700 font-semibold pl-3 relative"><span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-[#ffcc00]" />{kt}</li>
            ))}</ul>
          </div>
        )}
        {tutorData.codePatterns?.length > 0 && (
          <div className="border-2 border-primary bg-stone-50 p-3">
            <p className="font-display font-black text-xs uppercase mb-2 flex items-center gap-1"><Code className="w-3.5 h-3.5 text-[#0055ff]" /> Code Patterns</p>
            <div className="space-y-2">{tutorData.codePatterns.map((cp, i) => (
              <div key={i} className="p-2 border border-stone-200 bg-stone-100">
                <span className="font-mono text-[10px] font-bold text-[#0055ff] block">{cp.pattern}</span>
                <p className="text-[10px] text-stone-600 font-medium">{cp.description}</p>
              </div>
            ))}</div>
          </div>
        )}
        {tutorData.practiceQuestions?.length > 0 && (
          <div className="border-2 border-primary bg-stone-50 p-3">
            <p className="font-display font-black text-xs uppercase mb-2 flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-[#8b5cf6]" /> Practice Questions</p>
            <div className="space-y-1.5">{tutorData.practiceQuestions.map((pq, i) => (
              <div key={i} className="border border-primary bg-stone-100 p-2">
                <button onClick={() => setExpandedQuestion(expandedQuestion === i ? null : i)} className="w-full text-left flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-700">{pq.question}</span>
                  {expandedQuestion === i ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
                {expandedQuestion === i && <p className="text-[10px] text-[#8b5cf6] font-medium mt-1 pl-2 border-l-2 border-[#8b5cf6]">💡 {pq.hint}</p>}
              </div>
            ))}</div>
          </div>
        )}
        {tutorData.relatedTopics?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tutorData.relatedTopics.map((rt, i) => (
              <span key={i} className="px-2 py-1 border border-primary text-[10px] font-bold bg-stone-50 hover:bg-stone-200 transition-all">{rt}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
