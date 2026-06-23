import { useState, useEffect, useRef } from "react";
import { 
  Play, ArrowRight, ArrowDown, Sparkles, Star, Terminal, Code, GitBranch, Cpu, Layers, 
  Settings, ChevronRight, AlertTriangle, CheckCircle, RefreshCw, FileText, MessageSquare, 
  Plus, Trash2, HelpCircle, Info, CornerDownRight, ExternalLink, RotateCcw,
  Upload, BookOpen, Zap, Shield, Eye, Moon, Sun, Brain, Globe,
  TreePine, ScanSearch, Bot, Lightbulb, PlayCircle, GraduationCap, ChevronDown, Lock, Unlock
} from "lucide-react";
import { CODE_SAMPLES, LanguageKey } from "./samples";
import { 
  CodeFlowAnalysis, ChatMessage, FlowStep, FunctionMetadata, DependencyMetadata, CodeError,
  ASTAnalysis, SecurityAnalysis, AIDetectionResult, SuggestionsAnalysis, ExecutionTrace, TutorExplanation
} from "./types";
import AuthPages from "./components/AuthPages";
import Chatbot from "./components/Chatbot";
import ProjectOverview from "./components/ProjectOverview";
import AlgorithmsSection from "./components/AlgorithmsSection";
import EnhancedTabs from "./components/EnhancedTabs";
import WorkflowGraph, { flowStepsToWorkflow } from "./components/WorkflowGraph";

export default function App() {
  const [viewMode, setViewMode] = useState<"landing" | "login" | "signup" | "workspace" | "overview" | "algorithms">("landing");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('cf_dark') === 'true');
  const [userLang, setUserLang] = useState<string>("PYTHON");
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);
  const [activeLangKey, setActiveLangKey] = useState<LanguageKey>("PYTHON");
  const [code, setCode] = useState(CODE_SAMPLES.PYTHON.code);
  const [analysis, setAnalysis] = useState<CodeFlowAnalysis | null>(CODE_SAMPLES.PYTHON.defaultAnalysis);
  const [selectedStep, setSelectedStep] = useState<number | null>(1);
  const [selectedFunc, setSelectedFunc] = useState<string | null>("quicksort");
  
  // Interactive Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      text: "Hello! I am your CodeFlow AI Companion. I have indexed your static execution flowchart and dependency metrics. Ask me anything. e.g., 'Can we write this iteratively to optimize stack space?'",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // General App State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"complexity" | "flow" | "graph" | "ai" | "dependencies" | "ast" | "security" | "aidetect" | "suggestions" | "execution" | "tutor">("flow");
  const [accentColor, setAccentColor] = useState<"yellow" | "blue" | "red">("yellow");

  // New enhanced analysis states
  const [astData, setAstData] = useState<ASTAnalysis | null>(null);
  const [securityData, setSecurityData] = useState<SecurityAnalysis | null>(null);
  const [aiDetectData, setAiDetectData] = useState<AIDetectionResult | null>(null);
  const [suggestionsData, setSuggestionsData] = useState<SuggestionsAnalysis | null>(null);
  const [executionData, setExecutionData] = useState<ExecutionTrace | null>(null);
  const [tutorData, setTutorData] = useState<TutorExplanation | null>(null);
  const [enhancedLoading, setEnhancedLoading] = useState<string | null>(null); // tracks which enhanced tab is loading

  // Chat scroll container reference
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Dark mode persistence
  useEffect(() => {
    localStorage.setItem('cf_dark', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auto scroll chat thread
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatLoading]);

  // Synchronize code input when changing sample language
  const handleLanguageChange = (key: LanguageKey) => {
    setActiveLangKey(key);
    const sample = CODE_SAMPLES[key];
    setCode(sample.code);
    // Auto populate default sample analysis to keep workflow instantaneous and responsive
    setAnalysis(sample.defaultAnalysis);
    // Reset secondary highlights
    setSelectedStep(1);
    setSelectedFunc(sample.defaultAnalysis?.functions?.[0]?.name || null);
    setErrorMsg(null);

    // Seed chat greeting
    setChatMessages([
      {
        id: "intro-" + key,
        role: "assistant",
        text: `Switched context to ${key}. I have parsed the static call graph and precompiled its execution paths. What part of the logic would you like to review?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Static Program Analysis trigger calling full-stack Gemini API endpoint
  const performAnalysis = async (customCode: string = code) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: customCode,
          language: CODE_SAMPLES[activeLangKey].language
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Static analysis connection timeout.");
      }

      const result: CodeFlowAnalysis = await response.json();
      setAnalysis(result);
      if (result.flowSteps && result.flowSteps.length > 0) {
        setSelectedStep(result.flowSteps[0].step);
      }
      if (result.functions && result.functions.length > 0) {
        setSelectedFunc(result.functions[0].name);
      }
    } catch (err: any) {
      console.warn("Analysis API returned an error, falling back to cached model simulation state", err);
      // Give a highly descriptive but polite Brutalist error banner with self-guided action
      setErrorMsg(err.message || "Unable to reach Gemini API backend.");
    } finally {
      setIsLoading(false);
    }
  };

  // Send message to AI Explainer Conversation proxy endpoint
  const sendChatMessage = async (presetText?: string) => {
    const textToSend = presetText || chatInput;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: "usr-" + Date.now(),
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: textToSend,
          code: code,
          language: CODE_SAMPLES[activeLangKey].language,
          history: chatMessages.slice(-8).map(m => ({ role: m.role, text: m.text }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "No connection response from AI Chat proxy.");
      }

      const resData = await response.json();
      const assistantMsg: ChatMessage = {
        id: "ast-" + Date.now(),
        role: "assistant",
        text: resData.text || "I was unable to compile a dynamic reasoning trace for this snippet.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.warn("Chat failed, executing intelligent fallback", err);
      // Fallback answers locally based on context keys to bypass hard offline environments!
      setTimeout(() => {
        const localExplainers: Record<string, string> = {
          "vulnerabilities": "My static scanner flagged memory/GC and security structures. For instance, in-place recursion poses recursion depth faults. We can harden this via sanitization.",
          "speed": "We can optimization this code from an allocated space complexity down to O(1) in-place operations, eliminating auxiliary array duplication.",
          "line-by-line": "Sure value flow tracing: The control sequence starts by checking boundaries, then splits nodes of the array dynamically into balanced branches prior to recursive merges.",
          "default": "Based on code parameters, the Big O scale holds at standard logarithmic bounds. Let's perform a local cache-optimized loop conversion."
        };

        const matchedKey = Object.keys(localExplainers).find(k => textToSend.toLowerCase().includes(k)) || "default";
        
        const assistantMsg: ChatMessage = {
          id: "ast-fb-" + Date.now(),
          role: "assistant",
          text: `[Offline Fallback Mode]: ${localExplainers[matchedKey]} To execute real live Gemini questions, ensure process.env.GEMINI_API_KEY is configured in Settings > Secrets.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, assistantMsg]);
      }, 800);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Enhanced analysis fetcher - lazy loads data when tab is clicked
  const fetchEnhancedAnalysis = async (tab: string) => {
    const endpointMap: Record<string, string> = {
      ast: "/api/analyze-ast",
      security: "/api/analyze-security",
      aidetect: "/api/detect-ai",
      suggestions: "/api/suggest",
      execution: "/api/trace-execution",
      tutor: "/api/tutor",
    };
    const endpoint = endpointMap[tab];
    if (!endpoint) return;

    setEnhancedLoading(tab);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: CODE_SAMPLES[activeLangKey].language }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Analysis failed.");
      }
      const data = await response.json();
      switch (tab) {
        case "ast": setAstData(data); break;
        case "security": setSecurityData(data); break;
        case "aidetect": setAiDetectData(data); break;
        case "suggestions": setSuggestionsData(data); break;
        case "execution": setExecutionData(data); break;
        case "tutor": setTutorData(data); break;
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Enhanced analysis failed.");
    } finally {
      setEnhancedLoading(null);
    }
  };

  // Handle switching to enhanced tabs - auto-fetch if no data
  const handleTabSwitch = (tab: typeof activeTab) => {
    setActiveTab(tab);
    const enhancedTabs = ["ast", "security", "aidetect", "suggestions", "execution", "tutor"];
    if (enhancedTabs.includes(tab)) {
      const dataMap: Record<string, any> = { ast: astData, security: securityData, aidetect: aiDetectData, suggestions: suggestionsData, execution: executionData, tutor: tutorData };
      if (!dataMap[tab]) {
        fetchEnhancedAnalysis(tab);
      }
    }
  };

  // Navigate to Workspace (auth-gated)
  const handleGetStarted = () => {
    if (!userEmail) {
      setViewMode("signup");
      return;
    }
    setViewMode("workspace");
    if (!analysis) performAnalysis();
  };

  // Auth callback
  const handleAuthSuccess = (email: string, lang: string) => {
    setUserEmail(email);
    setUserLang(lang);
    setViewMode("workspace");
    if (!analysis) performAnalysis();
  };

  // File import handler
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) {
        setCode(text);
        setErrorMsg(null);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Role color helper
  const getRoleColor = (role: string) => {
    const r = role?.toLowerCase();
    if (r === 'init' || r === 'input') return { bg: '#ffcc00', text: '#1a1a1a', stroke: '#ffcc00', pulse: 'pulse-yellow' };
    if (r === 'condition') return { bg: '#e63b2e', text: '#fff', stroke: '#e63b2e', pulse: 'pulse-red' };
    if (r === 'loop') return { bg: '#0055ff', text: '#fff', stroke: '#0055ff', pulse: 'pulse-blue' };
    if (r === 'output') return { bg: '#10b981', text: '#fff', stroke: '#10b981', pulse: 'pulse-green' };
    if (r === 'process') return { bg: '#8b5cf6', text: '#fff', stroke: '#8b5cf6', pulse: 'pulse-purple' };
    if (r === 'error') return { bg: '#e63b2e', text: '#fff', stroke: '#e63b2e', pulse: 'pulse-red' };
    return { bg: '#6b7280', text: '#fff', stroke: '#6b7280', pulse: '' };
  };

  return (
    <div className={`font-sans antialiased min-h-screen bg-background text-primary selection:bg-primary-container selection:text-primary relative pr-2 ${darkMode ? 'dark' : ''}`}>

      {/* VIEW 1: LANDING SCREEN - MATCHES SCREENSHOT THEME */}
      {viewMode === "landing" && (
        <div className="flex flex-col min-h-screen">
          
          {/* Bauhaus Top Navigation Bar */}
          <header className="w-full px-4 md:px-12 py-4 flex items-center justify-between border-b-3 border-primary bg-[#faf7f2] sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-container neo-brutal-border flex items-center justify-center font-display font-black text-lg">
                C
              </div>
              <span className="text-2xl font-display font-black tracking-tighter uppercase">CodeFlow</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8 font-display font-bold text-sm tracking-widest uppercase">
              <a href="#features" className="hover:text-tertiary transition-colors hover:underline decoration-2">Features</a>
              <button onClick={() => setViewMode('overview')} className="hover:text-tertiary transition-colors hover:underline decoration-2">Overview</button>
              <button onClick={() => setViewMode('algorithms')} className="hover:text-tertiary transition-colors hover:underline decoration-2">Algorithms</button>
              <a href="#docs" className="hover:text-tertiary transition-colors hover:underline decoration-2">Docs</a>
            </nav>

            <div className="flex items-center gap-3">
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 border-2 border-primary transition-all hover:bg-stone-200" title="Toggle Dark Mode">
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button onClick={() => setViewMode("login")} className="px-4 py-2 font-display font-bold tracking-wider text-xs uppercase border-2 border-primary hover:bg-stone-200 transition-all">Sign In</button>
              <button onClick={handleGetStarted} className="bg-primary text-on-primary px-5 py-2 font-display font-bold tracking-wider text-xs uppercase neo-brutal-border neo-brutal-shadow-sm hover:bg-primary-container hover:text-primary transition-all">Get Started</button>
            </div>
          </header>

          {/* Hero Main Content */}
          <main className="flex-1 max-w-6xl mx-auto px-6 py-20 flex flex-col items-center justify-center text-center">
            
            {/* Rotate Badge Accent */}
            <div 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-variant border-3 border-primary mb-8 neo-brutal-shadow-sm transform -rotate-1 hover:rotate-1 transition-transform"
             
            >
              <Star className="w-5 h-5 text-tertiary fill-tertiary animate-pulse" />
              <span className="font-display font-bold text-xs uppercase tracking-widest text-[#1a1a1a]">
                ✦ Multi-Language · AST Powered · Real-Time
              </span>
            </div>

            {/* Title Display Header */}
            <h1 className="font-display font-black text-5xl md:text-8xl leading-[0.95] tracking-tight uppercase max-w-4xl mb-8">
              Understand <br/>
              Any Code. <br/>
              <span className="text-tertiary animate-pulse">Instantly.</span>
            </h1>

            {/* Side-bordered descriptive subhead block */}
            <div className="max-w-3xl flex justify-center mb-12">
              <p className="font-body text-lg md:text-2xl text-stone-700 font-medium border-l-6 border-primary pl-6 text-left max-w-2xl leading-relaxed">
                Paste code. Get visual execution flow structures, procedural dependency graphs, and complexity matrices in seconds. Form follows function.
              </p>
            </div>

            {/* Bauhaus Action Handles */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-20 w-full sm:w-auto">
              <button 
                onClick={handleGetStarted}
                className="w-full sm:w-auto px-8 py-5 bg-primary-container text-primary font-display font-black text-xl uppercase tracking-wider neo-brutal-border neo-brutal-shadow transition-all flex items-center justify-center gap-3"
               
              >
                Intelligent Workspace
                <ArrowRight className="w-6 h-6 stroke-[3px]" />
              </button>
              
              <button 
                onClick={() => {
                  setViewMode("workspace");
                  setActiveTab("ai");
                }}
                className="w-full sm:w-auto px-8 py-5 bg-[#faf7f2] text-primary font-display font-bold text-xl uppercase tracking-wider neo-brutal-border hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-3"
               
              >
                <Sparkles className="w-6 h-6 text-tertiary fill-tertiary" />
                Try Code AI Chat
              </button>
            </div>

            {/* Language Chips Marquee Loop (CSS Keyframes) */}
            <div className="w-full max-w-4xl overflow-hidden py-4 border-y-3 border-primary bg-stone-200/40 transform rotate-1 mb-16">
              <div className="marquee-container">
                <div className="marquee-content whitespace-nowrap flex gap-4 pr-4 h-10 items-center">
                  {/* Pair 1 */}
                  {Object.keys(CODE_SAMPLES).map((key) => (
                    <span 
                      key={"m1-" + key} 
                      onClick={() => {
                        handleLanguageChange(key as LanguageKey);
                        setViewMode("workspace");
                      }}
                      className="px-5 py-1.5 border-2 border-primary bg-stone-50 font-display font-black text-xs uppercase hover:bg-primary-container hover:text-primary transition-all shrink-0"
                     
                    >
                      {key}
                    </span>
                  ))}
                  {/* Repeated Pair for Seamless infinite Loop */}
                  {Object.keys(CODE_SAMPLES).map((key) => (
                    <span 
                      key={"m2-" + key} 
                      onClick={() => {
                        handleLanguageChange(key as LanguageKey);
                        setViewMode("workspace");
                      }}
                      className="px-5 py-1.5 border-2 border-primary bg-stone-50 font-display font-black text-xs uppercase hover:bg-primary-container hover:text-primary transition-all shrink-0"
                     
                    >
                      {key}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Scroll Cue Indicator */}
            <div 
              onClick={handleGetStarted}
              className="flex flex-col items-center gap-2 mt-4 group"
             
            >
              <span className="font-display text-xs uppercase tracking-widest font-black group-hover:text-tertiary transition-colors">
                Scroll to Explore
              </span>
              <ArrowDown className="w-5 h-5 animate-bounce stroke-[3px] text-tertiary" />
            </div>

          </main>

          {/* Features Section */}
          <section id="features" className="w-full max-w-5xl mx-auto px-6 py-16">
            <h2 className="font-display font-black text-3xl uppercase text-center mb-10">Platform Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: <Layers className="w-6 h-6" />, title: "Visual Flow", desc: "Colorful execution flowcharts with animated Supabase-style dotted connections showing data flow through your code." },
                { icon: <GitBranch className="w-6 h-6" />, title: "Call Graph", desc: "Interactive dependency graph visualizing function call hierarchies and relationships." },
                { icon: <Cpu className="w-6 h-6" />, title: "Complexity Analysis", desc: "AI-powered Big-O complexity detection with error checking and visual graph plotting." },
                { icon: <MessageSquare className="w-6 h-6" />, title: "AI Chat", desc: "Ask questions about your code and get expert architectural advice powered by Gemini." },
                { icon: <Upload className="w-6 h-6" />, title: "File Import", desc: "Import code directly from your device. Supports Python, JS, Java, C++, and more." },
                { icon: <Shield className="w-6 h-6" />, title: "Error Detection", desc: "Automatically detects syntax errors, logical bugs, and security vulnerabilities in your code." },
              ].map((f, i) => (
                <div key={i} onClick={() => setExpandedFeature(expandedFeature === i ? null : i)}
                  className={`border-3 border-primary p-5 cursor-pointer transition-all hover:-translate-y-1 ${expandedFeature === i ? 'bg-primary-container neo-brutal-shadow' : 'bg-stone-50 shadow-[4px_4px_0px_0px_#1a1a1a]'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-stone-100 border-2 border-primary flex items-center justify-center">{f.icon}</div>
                    <h3 className="font-display font-black text-sm uppercase">{f.title}</h3>
                  </div>
                  {expandedFeature === i && <p className="text-xs text-stone-600 leading-relaxed font-medium feature-expand">{f.desc}</p>}
                </div>
              ))}
            </div>
          </section>

          {/* Docs Section */}
          <section id="docs" className="w-full max-w-5xl mx-auto px-6 py-16">
            <div className="border-3 border-primary bg-stone-50 neo-brutal-shadow">
              <div className="bg-stone-100 border-b-3 border-primary p-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-tertiary" />
                <h2 className="font-display font-black text-lg uppercase">Documentation</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="border-l-4 border-primary-container pl-4">
                  <h3 className="font-display font-bold text-sm uppercase mb-1">Getting Started</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">Paste your code into the editor, select a language, and click "Analyze Code" to generate visual execution flows, dependency graphs, and complexity metrics instantly.</p>
                </div>
                <div className="border-l-4 border-tertiary pl-4">
                  <h3 className="font-display font-bold text-sm uppercase mb-1">Supported Languages</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">CodeFlow supports Python, JavaScript, TypeScript, Java, C++, Rust, Go, Ruby, PHP, and Swift with language-specific static analysis.</p>
                </div>
                <div className="border-l-4 border-secondary pl-4">
                  <h3 className="font-display font-bold text-sm uppercase mb-1">AI-Powered Analysis</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">Powered by Google Gemini, CodeFlow provides intelligent code review, error detection, complexity analysis, and interactive chat for deep code understanding.</p>
                </div>
                <div className="bg-stone-100 border-2 border-dashed border-stone-300 p-4 text-center">
                  <p className="text-xs text-stone-400 font-display font-bold uppercase">More documentation coming soon — check back for API guides, tutorials, and integration docs.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer block */}
          <footer className="w-full py-12 px-8 flex flex-col md:flex-row justify-between items-center gap-6 bg-primary text-stone-200 border-t-3 border-primary">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#ffcc00] text-[#1a1a1a] flex items-center justify-center font-display font-black text-sm">F</div>
              <span className="font-display font-black text-xl text-stone-50 tracking-tighter uppercase">CodeFlow</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 md:gap-8 font-body text-xs uppercase tracking-wider">
              <a href="#" className="text-stone-300 hover:text-primary-container hover:underline transition-colors">Privacy</a>
              <a href="#" className="text-stone-300 hover:text-primary-container hover:underline transition-colors">Security</a>
              <a href="#" className="text-stone-300 hover:text-primary-container hover:underline transition-colors">Changelog</a>
              <a href="#" className="text-stone-300 hover:text-primary-container hover:underline transition-colors">Status</a>
            </div>
            <div className="font-body text-xs text-stone-400 uppercase tracking-wider text-center md:text-right">© 2026 CodeFlow. Form follows function.</div>
          </footer>
        </div>
      )}

      {/* AUTH VIEWS */}
      {(viewMode === "login" || viewMode === "signup") && (
        <AuthPages view={viewMode} onLogin={handleAuthSuccess} onSwitch={(v) => setViewMode(v as any)} />
      )}

      {/* VIEW 2: INTERACTIVE WORKSPACE VIEW */}
      {viewMode === "workspace" && (
        <div className="flex flex-col min-h-screen bg-background">
          
          {/* Workspace Accent Control Top Bar */}
          <header className="w-full px-4 md:px-8 py-3 flex flex-col sm:flex-row items-center justify-between border-b-3 border-primary bg-[#faf7f2] sticky top-0 z-30 gap-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setViewMode("landing")}
                className="px-3.5 py-1.5 border-2 border-primary bg-stone-50 text-xs font-display font-bold uppercase neo-brutal-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
               
              >
                ← Back to Home
              </button>
              <div className="h-5 w-[2px] bg-stone-300 hidden sm:block" />
              <span className="text-lg font-display font-black tracking-tight uppercase flex items-center gap-2">
                <span className="w-5 h-5 bg-[#ffcc00] neo-brutal-border inline-block flex items-center justify-center text-[10px] font-black">CF</span>
                Workspace
              </span>
            </div>

            {/* Workspace Preference Adjusters */}
            <div className="flex items-center gap-4 flex-wrap justify-center font-display font-bold text-xs uppercase">
              {/* Theme color custom accent buttons */}
              <div className="flex items-center gap-1.5 border-2 border-primary p-1 bg-stone-100">
                <span className="text-[10px] px-1 text-stone-500">Accent:</span>
                <button 
                  onClick={() => { setAccentColor("yellow"); }}
                  className={`w-4 h-4 rounded-full bg-[#ffcc00] border border-primary transition-all ${accentColor === "yellow" ? "scale-125 ring-2 ring-primary" : ""}`}
                 
                  title="Bauhaus Yellow"
                />
                <button 
                  onClick={() => { setAccentColor("blue"); }}
                  className={`w-4 h-4 rounded-full bg-[#0055ff] border border-primary transition-all ${accentColor === "blue" ? "scale-125 ring-2 ring-primary" : ""}`}
                 
                  title="Brutalist Blue"
                />
                <button 
                  onClick={() => { setAccentColor("red"); }}
                  className={`w-4 h-4 rounded-full bg-[#e63b2e] border border-primary transition-all ${accentColor === "red" ? "scale-125 ring-2 ring-primary" : ""}`}
                 
                  title="Alert Red"
                />
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`px-3 py-1 border-2 border-primary text-[10px] font-black transition-all flex items-center gap-1 ${darkMode ? "bg-primary text-stone-100" : "bg-stone-50 text-stone-700"}`}
              >
                {darkMode ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                {darkMode ? "LIGHT" : "DARK"}
              </button>

              {/* Nav Links */}
              <button onClick={() => setViewMode('overview')} className="px-3 py-1 border-2 border-primary text-[10px] font-black transition-all bg-stone-50 text-stone-700 hover:bg-primary-container">OVERVIEW</button>
              <button onClick={() => setViewMode('algorithms')} className="px-3 py-1 border-2 border-primary text-[10px] font-black transition-all bg-stone-50 text-stone-700 hover:bg-primary-container flex items-center gap-1"><Brain className="w-3 h-3" /> DSA</button>
            </div>
          </header>

          {/* Interactive Workspace Grid Area */}
          <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* LEFT AREA: Playable Code Editor panel (Span 5) */}
            <section className="lg:col-span-5 flex flex-col gap-4">
              <div className="border-3 border-primary bg-stone-50 neo-brutal-shadow flex-1 flex flex-col min-h-[500px]">
                
                {/* Editor Header: Custom horizontal cards language selector */}
                <div className="bg-stone-100 border-b-3 border-primary p-2 flex flex-col gap-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-black text-xs uppercase tracking-wider flex items-center gap-1.5 text-stone-700">
                      <Terminal className="w-4 h-4" /> Code Source Playground
                    </span>
                    <span className="text-[10px] font-mono text-stone-500 bg-stone-200/60 px-1.5 py-0.5 uppercase">
                      Syntax: {CODE_SAMPLES[activeLangKey].language}
                    </span>
                  </div>

                  {/* Sized Grid of brutal languages buttons */}
                  <div className="grid grid-cols-5 gap-1">
                    {(Object.keys(CODE_SAMPLES) as LanguageKey[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => handleLanguageChange(key)}
                        className={`py-1 text-center font-display font-bold text-[10px] uppercase border-2 border-primary transition-all ${
                          activeLangKey === key 
                            ? "bg-primary-container text-primary font-black scale-[1.03] shadow-sm" 
                            : "bg-stone-50 hover:bg-stone-200 text-stone-700"
                        }`}
                       
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Code writing Area container */}
                <div className="flex-1 relative flex items-stretch">
                  
                  {/* Micro sidebar gutter representing line count numbers */}
                  <div className="bg-stone-200/40 border-r-2 border-stone-200 px-2.5 py-4 font-mono text-xs text-stone-400 text-right select-none flex flex-col gap-1 text-[11px]">
                    {Array.from({ length: Math.max(code.split("\n").length, 12) }).map((_, idx) => (
                      <div key={idx} className="h-6 leading-6">{idx + 1}</div>
                    ))}
                  </div>

                  {/* Code Editor text-area */}
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Paste or write code here... Choose a template above to get started instantly."
                    className="flex-1 p-4 bg-stone-50 font-mono text-xs text-stone-900 leading-6 focus:outline-none resize-none overflow-y-auto block h-full select-text min-h-[300px]"
                    style={{ caretColor: "#1a1a1a" }}
                   
                  />
                </div>

                {/* Editor footer with import + reset + analyze */}
                <div className="border-t-3 border-primary bg-stone-100 p-3.5 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setCode(""); setErrorMsg(null); }}
                      className="px-3 py-3 border-2 border-primary bg-stone-50 text-stone-700 font-display font-bold text-xs uppercase hover:bg-stone-200 transition-all flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>
                    <label className="px-3 py-3 border-2 border-primary bg-stone-50 text-stone-700 font-display font-bold text-xs uppercase hover:bg-stone-200 transition-all cursor-pointer flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" /> Import
                      <input type="file" accept=".py,.js,.ts,.tsx,.java,.cpp,.c,.go,.rs,.rb,.php,.swift,.kt,.cs" onChange={handleFileImport} className="hidden" />
                    </label>
                  </div>
                  <button onClick={() => performAnalysis()} disabled={isLoading}
                    className={`flex-1 py-3 px-5 text-center font-display font-black text-sm uppercase tracking-wider border-2 border-primary transition-all flex items-center justify-center gap-2 ${isLoading ? "bg-stone-300 text-stone-500" : "bg-primary-container text-primary neo-brutal-shadow"}`}>
                    {isLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...</> : <>Analyze Code <ArrowRight className="w-4 h-4 stroke-[2px]" /></>}
                  </button>
                </div>

              </div>

              {/* Offline Warning & Guided Secrets helper block */}
              {errorMsg && (
                <div className="p-4 border-3 border-[#e63b2e] bg-[#ffdad6] text-[#93000a] flex gap-3 neo-brutal-border">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-[#e63b2e]" />
                  <div className="text-xs">
                    <p className="font-display font-black uppercase mb-1">API CONFIGURATION ERROR</p>
                    <p className="font-body text-[11px] leading-relaxed mb-2">
                      {errorMsg} Ensure you configure your <strong className="font-mono">GEMINI_API_KEY</strong> environment variable in AI Studio settings to run custom live dynamic evaluations.
                    </p>
                    <button 
                      onClick={() => {
                        // Reseed prebaked simulated analyzer parameters to keep layout responsive!
                        setErrorMsg(null);
                        setAnalysis(CODE_SAMPLES[activeLangKey].defaultAnalysis);
                      }}
                      className="px-3 py-1 bg-[#faf7f2] border-2 border-primary text-[#1a1a1a] font-display font-bold text-[10px] uppercase hover:bg-[#1a1a1a] hover:text-white transition-all"
                     
                    >
                      Use Simulated Sandbox Flow
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* RIGHT AREA: Visualizers Panel (Span 7) */}
            <section className="lg:col-span-7 flex flex-col gap-4">
              <div className="border-3 border-primary bg-stone-50 neo-brutal-shadow flex-1 flex flex-col min-h-[500px]">
                
                {/* Vis Tab headers list */}
                <div className="bg-stone-100 border-b-3 border-primary flex flex-wrap shrink-0 overflow-x-auto">
                  {([
                    { key: "flow", icon: <Layers className="w-3.5 h-3.5" />, label: "Flow" },
                    { key: "graph", icon: <GitBranch className="w-3.5 h-3.5" />, label: "Call Graph" },
                    { key: "complexity", icon: <Cpu className="w-3.5 h-3.5" />, label: "Complexity" },
                    { key: "dependencies", icon: <FileText className="w-3.5 h-3.5" />, label: "Imports" },
                    { key: "execution", icon: <PlayCircle className="w-3.5 h-3.5" />, label: "Execution" },
                    { key: "ast", icon: <TreePine className="w-3.5 h-3.5" />, label: "AST" },
                    { key: "security", icon: <Shield className="w-3.5 h-3.5" />, label: "Security" },
                    { key: "aidetect", icon: <ScanSearch className="w-3.5 h-3.5" />, label: "AI Detect" },
                    { key: "suggestions", icon: <Lightbulb className="w-3.5 h-3.5" />, label: "Suggestions" },
                    { key: "tutor", icon: <GraduationCap className="w-3.5 h-3.5" />, label: "AI Tutor" },
                    { key: "ai", icon: <MessageSquare className="w-3.5 h-3.5 text-tertiary" />, label: "AI Chat" },
                  ] as { key: typeof activeTab; icon: React.ReactNode; label: string }[]).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => {
                        const enhanced = ["ast", "security", "aidetect", "suggestions", "execution", "tutor"];
                        if (enhanced.includes(tab.key)) handleTabSwitch(tab.key);
                        else setActiveTab(tab.key);
                      }}
                      className={`px-3 py-2.5 text-[10px] font-display font-bold uppercase tracking-wider border-r-2 border-primary transition-all flex items-center gap-1 whitespace-nowrap ${
                        activeTab === tab.key
                          ? "bg-primary text-stone-100 font-extrabold"
                          : "bg-stone-50 hover:bg-stone-200 text-stone-700"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content viewer area */}
                <div className="flex-1 p-5 overflow-y-auto max-h-[640px]">
                  
                  {/* Loader State with randomized program analysis steps */}
                  {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
                      <div className="w-16 h-16 border-4 border-primary border-t-[#ffcc00] animate-spin rounded-full neo-brutal-border" />
                      <div className="space-y-2">
                        <p className="font-display font-black text-xl text-primary animate-pulse uppercase">COMPILING LOGICAL BLUEPRINT</p>
                        <p className="font-body text-xs text-stone-500 max-w-sm font-medium">
                          Tokenizing structural execution components, drawing internal procedural connections, and measuring Halstead load ratios...
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Empty state greeting if nothing loaded */}
                  {!isLoading && !analysis && (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
                      <div className="w-20 h-20 bg-stone-100 border-3 border-dashed border-primary flex items-center justify-center">
                        <Code className="w-10 h-10 text-stone-400" />
                      </div>
                      <div className="space-y-2 max-w-md">
                        <p className="font-display font-black text-lg uppercase">Static Scanner Idle</p>
                        <p className="font-body text-xs text-stone-500 leading-relaxed font-medium">
                          No computed AST compilation parsed in active memory. Select a preset language chip above, or click &quot;Analyze Code&quot; to synthesize logical pathways.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 1: ANIMATED WORKFLOW GRAPH VISUALIZATION */}
                  {!isLoading && analysis && activeTab === "flow" && (() => {
                    const wfData = flowStepsToWorkflow(analysis.flowSteps || [], analysis.functions || []);
                    return (
                      <div style={{ height: 580, borderRadius: 8, overflow: "hidden" }}>
                        <WorkflowGraph
                          nodes={wfData.nodes}
                          edges={wfData.edges}
                          onNodeClick={(node) => {
                            const stepNum = parseInt(node.id.replace('step-', ''));
                            if (!isNaN(stepNum)) setSelectedStep(stepNum);
                          }}
                        />
                      </div>
                    );
                  })()}

                  {/* SUB-TAB 2: FUNCTION CALL GRAPH (INVOCATION DIAGRAM) */}
                  {!isLoading && analysis && activeTab === "graph" && (
                    <div className="space-y-6">
                      
                      <div className="bg-stone-100 p-3 border-2 border-primary flex justify-between items-center text-xs">
                        <span className="font-display font-black uppercase text-stone-700 flex items-center gap-1">
                          <GitBranch className="w-4 h-4 text-tertiary" /> Procedural call hierarchy graph
                        </span>
                        <span className="font-mono text-[10px] text-stone-500">
                          {analysis.functions?.length || 0} nodes mapped
                        </span>
                      </div>

                      {/* Interactive block graph container */}
                      <div className="border-3 border-primary bg-stone-200/40 p-4 min-h-[220px] flex flex-col md:flex-row items-center justify-around gap-6 relative">
                        {/* Interactive Nodes list mapping */}
                        {analysis.functions?.map((func: FunctionMetadata, idx: number) => {
                          const isActive = selectedFunc === func.name;
                          
                          return (
                            <div 
                              key={idx}
                              onClick={() => setSelectedFunc(func.name)}
                              className={`p-4 border-3 border-primary rounded-none text-center relative z-10 transition-all ${
                                isActive 
                                  ? "bg-primary-container text-primary font-black scale-110 shadow-[4px_4px_0px_0px_#1a1a1a]" 
                                  : "bg-stone-50 hover:bg-stone-200 text-stone-700 shadow-[2px_2px_0px_0px_#1a1a1a]"
                              }`}
                              style={{ minWidth: "120px" }}
                             
                            >
                              <div className="font-mono text-[10px] text-stone-500 mb-1 select-none">
                                Lines {func.lineRange}
                              </div>
                              <div className="font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1">
                                <Code className="w-3.5 h-3.5 fill-current/10" />
                                {func.name}
                              </div>

                              {/* Connections count tag */}
                              {func.calls?.length > 0 && (
                                <span className="absolute -top-2.5 -right-2.5 bg-stone-800 text-stone-100 font-mono text-[9px] px-1.5 py-0.5 border-2 border-primary">
                                  Calls: {func.calls.length}
                                </span>
                              )}
                            </div>
                          );
                        })}

                        {/* Interactive SVG background vectors sketching connection channels when multiple blocks exist */}
                        {analysis.functions && analysis.functions.length > 1 && (
                          <div className="absolute inset-0 pointer-events-none opacity-40">
                            <svg className="w-full h-full">
                              <defs>
                                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#1a1a1a"/>
                                </marker>
                              </defs>
                              <line x1="25%" y1="50%" x2="75%" y2="50%" stroke="#1a1a1a" strokeWidth="3" markerEnd="url(#arrow)" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Display Selected Function Metadata Block */}
                      {selectedFunc && (
                        (() => {
                          const funcObj = analysis.functions?.find(f => f.name === selectedFunc);
                          if (!funcObj) return null;
                          return (
                            <div className="border-3 border-primary bg-stone-50 p-4 relative">
                              <span className="absolute top-2 right-2 font-mono text-[10px] bg-[#0055ff]/10 text-[#0055ff] px-2 py-0.5 border border-[#0055ff]">
                                Node Focus
                              </span>

                              <h4 className="font-display font-black text-[#1a1a1a] uppercase text-sm mb-2 flex items-center gap-1">
                                {funcObj.name}() <span className="font-mono text-xs text-stone-400 capitalize">Method summary</span>
                              </h4>
                              
                              <p className="font-body text-xs text-stone-600 leading-relaxed font-semibold mb-4">
                                {funcObj.purpose}
                              </p>

                              <div className="space-y-2">
                                <span className="font-display font-bold uppercase text-[10px] tracking-wider text-stone-400 block">
                                  Outbound Call Interactions:
                                </span>
                                {funcObj.calls && funcObj.calls.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {funcObj.calls.map((call, cidx) => (
                                      <span key={cidx} className="font-mono text-[10px] px-2 py-1 bg-stone-200 border border-primary flex items-center gap-1 uppercase">
                                        <CornerDownRight className="w-3 h-3" />
                                        {call}()
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="font-body text-xs italic text-stone-400 block">
                                    No outbound procedural calls or local helper routines triggered.
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()
                      )}

                    </div>
                  )}

                  {/* SUB-TAB 3: COMPLEXITY + BIG-O GRAPH + ERROR DETECTION */}
                  {!isLoading && analysis && activeTab === "complexity" && (
                    <div className="space-y-6">
                      {/* Error Detection Section */}
                      {analysis.errors && analysis.errors.length > 0 && (
                        <div className="border-3 border-[#e63b2e] bg-[#ffdad6] p-4">
                          <p className="font-display font-black text-sm uppercase text-[#93000a] flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-5 h-5" /> Code Errors Detected ({analysis.errors.length})
                          </p>
                          <div className="space-y-2">
                            {analysis.errors.map((err: CodeError, i: number) => (
                              <div key={i} className={`p-3 border-2 ${err.severity === 'error' ? 'border-[#e63b2e] bg-white' : 'border-[#f59e0b] bg-[#fffbeb]'} flex items-start gap-2`}>
                                <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase ${err.severity === 'error' ? 'bg-[#e63b2e] text-white' : 'bg-[#f59e0b] text-white'}`}>
                                  {err.severity === 'error' ? 'ERR' : 'WARN'}
                                </span>
                                <div>
                                  <span className="font-mono text-[10px] text-stone-500">Line {err.line}:</span>
                                  <p className="text-xs font-semibold text-stone-700">{err.message}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* No errors = success banner */}
                      {(!analysis.errors || analysis.errors.length === 0) && (
                        <div className="border-3 border-[#10b981] bg-[#ecfdf5] p-3 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-[#10b981]" />
                          <span className="font-display font-black text-xs uppercase text-[#065f46]">No errors detected — Code is syntactically correct</span>
                        </div>
                      )}
                      {/* Metrics grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="border-3 border-primary bg-stone-50 p-4 text-center shadow-[3px_3px_0px_0px_#1a1a1a] hover:-translate-y-0.5 transition-all">
                          <span className="font-display font-bold text-[10px] uppercase text-stone-400 block mb-1">Time</span>
                          <span className="font-display font-black text-3xl text-tertiary block">{analysis.complexity?.time || "O(1)"}</span>
                        </div>
                        <div className="border-3 border-primary bg-stone-50 p-4 text-center shadow-[3px_3px_0px_0px_#1a1a1a] hover:-translate-y-0.5 transition-all">
                          <span className="font-display font-bold text-[10px] uppercase text-stone-400 block mb-1">Space</span>
                          <span className="font-display font-black text-3xl text-secondary block">{analysis.complexity?.space || "O(1)"}</span>
                        </div>
                        <div className="border-3 border-primary bg-[#ffcc00]/10 p-4 text-center shadow-[3px_3px_0px_0px_#1a1a1a] hover:-translate-y-0.5 transition-all">
                          <span className="font-display font-bold text-[10px] uppercase text-stone-500 block mb-1">Cognitive</span>
                          <span className="font-display font-black text-3xl block">{analysis.metrics?.cognitiveLoad || 0}<span className="text-xs text-stone-500 font-mono">/100</span></span>
                        </div>
                      </div>
                      {/* Explanation */}
                      <div className="border-3 border-primary bg-[#faf7f2] p-4 text-xs font-semibold text-stone-700 leading-relaxed">
                        <p className="font-display font-black uppercase text-sm mb-2 flex items-center gap-1"><Cpu className="w-4 h-4 text-secondary" /> Analysis</p>
                        <p>{analysis.complexity?.explanation}</p>
                      </div>
                      {/* BIG-O GRAPH VISUALIZATION */}
                      <div className="border-3 border-primary bg-stone-50 p-4">
                        <p className="font-display font-black uppercase text-xs tracking-wider mb-3">Big-O Complexity Graph</p>
                        <div className="w-full bg-stone-100 border-2 border-primary p-2 relative" style={{ height: '220px' }}>
                          <svg viewBox="0 0 300 200" className="w-full h-full">
                            {/* Grid */}
                            {[40, 80, 120, 160].map(y => <line key={`h${y}`} x1="30" y1={y} x2="290" y2={y} stroke="#d6d3d1" strokeWidth="0.5" />)}
                            {[80, 130, 180, 230].map(x => <line key={`v${x}`} x1={x} y1="10" x2={x} y2="190" stroke="#d6d3d1" strokeWidth="0.5" />)}
                            {/* Axes */}
                            <line x1="30" y1="190" x2="290" y2="190" stroke="#1a1a1a" strokeWidth="2" />
                            <line x1="30" y1="10" x2="30" y2="190" stroke="#1a1a1a" strokeWidth="2" />
                            <text x="160" y="200" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1a1a1a">Input Size (n)</text>
                            <text x="12" y="100" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1a1a1a" transform="rotate(-90,12,100)">Operations</text>
                            {/* O(1) */}
                            <line x1="30" y1="170" x2="290" y2="170" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
                            <text x="270" y="167" fontSize="7" fill="#10b981" fontWeight="bold">O(1)</text>
                            {/* O(log n) */}
                            <path d="M30,170 Q100,100 290,60" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
                            <text x="260" y="55" fontSize="7" fill="#8b5cf6" fontWeight="bold">O(log n)</text>
                            {/* O(n) */}
                            <line x1="30" y1="170" x2="290" y2="30" stroke="#0055ff" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
                            <text x="270" y="27" fontSize="7" fill="#0055ff" fontWeight="bold">O(n)</text>
                            {/* O(n log n) */}
                            <path d="M30,170 Q120,120 200,60 T290,15" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
                            <text x="250" y="12" fontSize="7" fill="#f59e0b" fontWeight="bold">O(n log n)</text>
                            {/* O(n²) */}
                            <path d="M30,170 Q80,165 130,140 T200,60 250,20 290,10" fill="none" stroke="#e63b2e" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
                            <text x="270" y="8" fontSize="7" fill="#e63b2e" fontWeight="bold">O(n²)</text>
                            {/* Highlight detected complexity */}
                            {(() => {
                              const t = (analysis.complexity?.time || "").toLowerCase();
                              let path = ""; let color = "#1a1a1a";
                              if (t.includes("1") && !t.includes("n")) { path = "M30,170 L290,170"; color = "#10b981"; }
                              else if (t.includes("log") && !t.includes("n log")) { path = "M30,170 Q100,100 290,60"; color = "#8b5cf6"; }
                              else if (t.includes("n log") || t.includes("n*log")) { path = "M30,170 Q120,120 200,60 T290,15"; color = "#f59e0b"; }
                              else if (t.includes("n^2") || t.includes("n²") || t.includes("n2")) { path = "M30,170 Q80,165 130,140 T200,60 250,20 290,10"; color = "#e63b2e"; }
                              else if (t.includes("n")) { path = "M30,170 L290,30"; color = "#0055ff"; }
                              if (!path) return null;
                              return <path d={path} fill="none" stroke={color} strokeWidth="3.5" className="graph-line-highlight" />;
                            })()}
                          </svg>
                          <div className="absolute bottom-2 right-2 bg-white border-2 border-primary px-2 py-1">
                            <span className="font-mono text-[10px] font-bold">Detected: {analysis.complexity?.time}</span>
                          </div>
                        </div>
                      </div>
                      {/* Bottlenecks + Suggestions */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border-3 border-primary bg-stone-50 p-4">
                          <p className="font-display font-black text-xs uppercase text-[#e63b2e] flex items-center gap-1.5 mb-2.5"><AlertTriangle className="w-4 h-4" /> Warnings:</p>
                          <ul className="space-y-2">
                            {analysis.metrics?.potentialBottlenecks?.map((issue: string, i: number) => (
                              <li key={i} className="text-xs text-stone-600 pl-4 relative"><span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-[#e63b2e]" />{issue}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="border-3 border-primary bg-stone-50 p-4">
                          <p className="font-display font-black text-xs uppercase text-tertiary flex items-center gap-1.5 mb-2.5"><CheckCircle className="w-4 h-4" /> Suggestions:</p>
                          <ul className="space-y-2">
                            {analysis.metrics?.suggestions?.map((s: string, i: number) => (
                              <li key={i} className="text-xs text-stone-600 pl-4 relative"><span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-tertiary" />{s}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 4: IMPORTS & DEPENDENCY METADATA */}
                  {!isLoading && analysis && activeTab === "dependencies" && (
                    <div className="space-y-6">
                      
                      <div className="bg-stone-100 p-3 border-2 border-primary flex justify-between items-center text-xs">
                        <span className="font-display font-black uppercase text-stone-700 flex items-center gap-1">
                          <FileText className="w-4 h-4 text-tertiary" /> Package Import Audit
                        </span>
                        <span className="font-mono text-[10px] text-stone-500">
                          {analysis.dependencies?.length || 0} packages detected
                        </span>
                      </div>

                      {analysis.dependencies && analysis.dependencies.length > 0 ? (
                        <div className="border-3 border-primary bg-stone-50 overflow-hidden">
                          <table className="w-full text-left text-xs bg-stone-50 border-collapse">
                            <thead>
                              <tr className="bg-stone-200/50 border-b-2 border-primary font-display font-black uppercase">
                                <th className="p-3">Library / Module</th>
                                <th className="p-3 border-l-2 border-primary">Class Type</th>
                                <th className="p-3 border-l-2 border-primary">Usage Purpose</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analysis.dependencies.map((dep: DependencyMetadata, didx: number) => (
                                <tr key={didx} className="border-b border-stone-200 font-semibold last:border-b-0 leading-relaxed text-stone-600">
                                  <td className="p-3 font-mono text-[11px] text-[#1a1a1a]">{dep.name}</td>
                                  <td className="p-3 border-l-2 border-primary">
                                    <span className={`px-2 py-0.5 border text-[9px] uppercase font-mono ${
                                      dep.type === "internal" ? "bg-stone-100 text-stone-500" : "bg-tertiary/10 text-tertiary border-tertiary"
                                    }`}>
                                      {dep.type}
                                    </span>
                                  </td>
                                  <td className="p-3 border-l-2 border-primary">{dep.purpose}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="border-3 border-primary bg-stone-50 p-6 text-center text-xs text-stone-500 font-semibold italic">
                          No modular imports or external library dependencies detected. This code executes using native structures only.
                        </div>
                      )}

                      <div className="bg-[#faf7f2] border-2 border-stone-300 p-4 text-[11px] font-mono leading-relaxed text-stone-500 flex gap-2">
                        <Info className="w-4 h-4 shrink-0 stroke-[2px] text-stone-400" />
                        <div>
                          System scans local program package boundaries to isolate runtime dependency loads. Standard system imports like &apos;sys&apos;, &apos;math&apos; or &apos;Foundation&apos; are categorized as internal/core modules.
                        </div>
                      </div>

                    </div>
                  )}

                  {/* SUB-TAB 5: INTELLECTUAL AI EXPLATOR PANEL (CHAT ASSISTANT) */}
                  {!isLoading && analysis && activeTab === "ai" && (
                    <div className="flex flex-col gap-4 min-h-[420px]">
                      
                      {/* Live Conversation Scroll Feed */}
                      <div className="flex-1 border-3 border-primary bg-stone-100/30 p-4 rounded-none space-y-4 overflow-y-auto block max-h-[340px]">
                        {chatMessages.map((msg) => (
                          <div 
                            key={msg.id} 
                            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                          >
                            <div className="flex items-center gap-1.5 font-display text-[10px] text-stone-400 uppercase font-black mb-1 select-none">
                              <span>{msg.role === "user" ? "USER CLIENT" : "CODEFLOW AGENT"}</span>
                              <span>·</span>
                              <span>{msg.timestamp}</span>
                            </div>

                            <div 
                              className={`p-3 border-2 border-primary rounded-none selection:bg-stone-900 text-xs leading-relaxed max-w-[85%] ${
                                msg.role === "user" 
                                  ? "bg-primary text-stone-100 font-mono shadow-[2px_2px_0px_0px_rgba(0,85,255,0.4)]" 
                                  : "bg-stone-50 text-[#1a1a1a] shadow-[2px_2px_0px_0px_#1a1a1a] font-semibold"
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        ))}

                        {isChatLoading && (
                          <div className="flex items-center gap-2 text-xs text-stone-400 font-display font-bold uppercase tracking-wider animate-pulse select-none">
                            <span className="w-4 h-4 border-2 border-t-transparent border-primary rounded-full animate-spin" />
                            AI architect is tracing stack pointers...
                          </div>
                        )}

                        <div ref={chatEndRef} />
                      </div>

                      {/* Preset speed instructions buttons */}
                      <div className="space-y-2 shrink-0">
                        <span className="font-display font-bold uppercase text-[9px] tracking-wider text-stone-400 block">
                          Instant Query prompts:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => sendChatMessage("Give me a line-by-line explanation of the code")}
                            className="px-2.5 py-1.5 border border-primary bg-stone-50 font-display font-bold text-[10px] uppercase hover:bg-primary-container hover:text-primary transition-all shrink-0"
                           
                          >
                            Line-by-line Trace
                          </button>
                          <button
                            onClick={() => sendChatMessage("What are the potential security vulnerabilities here?")}
                            className="px-2.5 py-1.5 border border-primary bg-stone-50 font-display font-bold text-[10px] uppercase hover:bg-primary-container hover:text-primary transition-all shrink-0"
                           
                          >
                            Harden Safety
                          </button>
                          <button
                            onClick={() => sendChatMessage("Refactor this code to be faster with minimal auxiliary space")}
                            className="px-2.5 py-1.5 border border-primary bg-stone-50 font-display font-bold text-[10px] uppercase hover:bg-primary-container hover:text-primary transition-all shrink-0"
                           
                          >
                            Optimize Performance
                          </button>
                        </div>
                      </div>

                      {/* Chat interactive inputs controls */}
                      <div className="flex border-3 border-primary shrink-0 bg-stone-50">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              sendChatMessage();
                            }
                          }}
                          placeholder="Ask CodeFlow AI Companion a question about your code..."
                          className="flex-1 px-4 py-3 text-xs focus:outline-none font-semibold"
                          style={{ caretColor: "#1a1a1a" }}
                         
                        />
                        <button
                          onClick={() => sendChatMessage()}
                          className="bg-primary text-stone-100 font-display font-black text-xs uppercase px-5 hover:bg-primary-container hover:text-primary border-l-2 border-primary transition-all shrink-0"
                         
                        >
                          Submit ➔
                        </button>
                      </div>

                    </div>
                  )}

                  {/* ENHANCED GEMINI TABS */}
                  {!isLoading && analysis && (
                    <EnhancedTabs
                      activeTab={activeTab}
                      enhancedLoading={enhancedLoading}
                      astData={astData}
                      securityData={securityData}
                      aiDetectData={aiDetectData}
                      suggestionsData={suggestionsData}
                      executionData={executionData}
                      tutorData={tutorData}
                      onRefresh={(tab) => fetchEnhancedAnalysis(tab)}
                    />
                  )}

                </div>

                {/* Right panel summary card footer */}
                {analysis && (
                  <div className="border-t-3 border-primary bg-stone-100 p-4 shrink-0 flex items-center justify-between gap-4">
                    <div className="text-xs font-semibold leading-relaxed text-stone-500 max-w-[80%]">
                      <span className="font-display font-black uppercase text-stone-700 block">Class Summary:</span>
                      {analysis.summary}
                    </div>
                    <div className="w-10 h-10 bg-[#faf7f2] neo-brutal-border flex items-center justify-center font-black animate-spin text-tertiary select-none">
                      ★
                    </div>
                  </div>
                )}

              </div>
            </section>

          </div>

          {/* Simple workspace persistent layout footer */}
          <footer className="w-full mt-auto py-5 px-6 border-t-3 border-primary bg-primary text-stone-300 text-[10px] uppercase tracking-widest font-display flex flex-col sm:flex-row justify-between items-center gap-3">
            <span>CodeFlow Interactive Workspace 1.2</span>
            <span>All Static AST Trees verified securely server-side.</span>
          </footer>

        </div>
      )}

      {/* PROJECT OVERVIEW VIEW */}
      {viewMode === "overview" && (
        <ProjectOverview darkMode={darkMode} onBack={() => setViewMode("landing")} />
      )}

      {/* ALGORITHMS VIEW */}
      {viewMode === "algorithms" && (
        <AlgorithmsSection darkMode={darkMode} onBack={() => setViewMode("landing")} />
      )}

      {/* GLOBAL CHATBOT */}
      <Chatbot darkMode={darkMode} />

    </div>
  );
}
