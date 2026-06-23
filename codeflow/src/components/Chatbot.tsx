import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Globe, Sparkles, Minimize2, Camera, Loader2 } from "lucide-react";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
  image?: string; // base64 screenshot thumbnail
}

export default function Chatbot({ darkMode }: { darkMode: boolean }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { id: "welcome", role: "assistant", text: "Hi! I'm CodeFlow AI. Ask me anything about programming, algorithms, or get help with your code. I can also search the web for you!\n\n📸 Click the camera icon to capture & analyze your current screen!", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMsg = { id: "u-" + Date.now(), role: "user", text: input, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMsgs(p => [...p, userMsg]);
    const txt = input;
    setInput("");
    setLoading(true);
    try {
      const endpoint = webSearch ? "/api/web-search" : "/api/global-chat";
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: txt, history: msgs.slice(-8).map(m => ({ role: m.role, text: m.text })) })
      });
      const d = await r.json();
      setMsgs(p => [...p, { id: "a-" + Date.now(), role: "assistant", text: d.text || "I couldn't generate a response.", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    } catch {
      setMsgs(p => [...p, { id: "a-err-" + Date.now(), role: "assistant", text: "Connection error. Please check your network and try again.", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    } finally {
      setLoading(false);
    }
  };

  // Screenshot capture using Canvas API
  const captureScreen = useCallback(async () => {
    if (capturing || loading) return;
    setCapturing(true);

    try {
      // Dynamically import html2canvas
      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default;

      // Hide the chatbot temporarily for clean capture
      const chatPanel = chatPanelRef.current;
      const floatingBtn = document.querySelector('[data-chatbot-fab]') as HTMLElement;
      
      if (chatPanel) chatPanel.style.visibility = "hidden";
      if (floatingBtn) floatingBtn.style.visibility = "hidden";

      // Small delay to let the browser paint without the chatbot
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture the entire viewport
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 0.75, // Reduced scale for performance while maintaining quality
        logging: false,
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight,
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
        x: window.scrollX,
        y: window.scrollY,
      });

      // Restore chatbot visibility
      if (chatPanel) chatPanel.style.visibility = "visible";
      if (floatingBtn) floatingBtn.style.visibility = "visible";

      // Convert to base64 JPEG (smaller than PNG)
      const base64Image = canvas.toDataURL("image/jpeg", 0.7);
      
      // Create a smaller thumbnail for the chat message display
      const thumbCanvas = document.createElement("canvas");
      const thumbCtx = thumbCanvas.getContext("2d");
      const thumbWidth = 300;
      const thumbHeight = Math.round((canvas.height / canvas.width) * thumbWidth);
      thumbCanvas.width = thumbWidth;
      thumbCanvas.height = thumbHeight;
      if (thumbCtx) {
        thumbCtx.drawImage(canvas, 0, 0, thumbWidth, thumbHeight);
      }
      const thumbnailBase64 = thumbCanvas.toDataURL("image/jpeg", 0.6);

      // Add user message with screenshot
      const userMsg: ChatMsg = {
        id: "u-ss-" + Date.now(),
        role: "user",
        text: "📸 Captured current screen for analysis",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        image: thumbnailBase64,
      };
      setMsgs(p => [...p, userMsg]);
      setLoading(true);

      // Send to backend for Gemini Vision analysis
      const r = await fetch("/api/analyze-screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          history: msgs.slice(-4).map(m => ({ role: m.role, text: m.text })),
        }),
      });

      const d = await r.json();
      setMsgs(p => [
        ...p,
        {
          id: "a-ss-" + Date.now(),
          role: "assistant",
          text: d.text || "I couldn't analyze the screenshot. Please try again.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      console.error("Screenshot capture failed:", err);
      setMsgs(p => [
        ...p,
        {
          id: "a-ss-err-" + Date.now(),
          role: "assistant",
          text: "⚠ Screenshot capture failed. Make sure html2canvas is available and try again.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setCapturing(false);
      setLoading(false);
    }
  }, [capturing, loading, msgs]);

  const dc = darkMode;

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          data-chatbot-fab
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #0055ff 100%)",
            border: "3px solid #1a1a1a",
            boxShadow: "4px 4px 0px 0px #1a1a1a"
          }}
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div
          ref={chatPanelRef}
          className="fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden transition-all"
          style={{
            width: "400px",
            height: "560px",
            border: "3px solid #1a1a1a",
            boxShadow: "6px 6px 0px 0px #1a1a1a",
            borderRadius: "0px",
            background: dc ? "#1e1e2e" : "#faf7f2",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #0055ff 100%)",
              borderBottom: "3px solid #1a1a1a",
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 border-2 border-white/40 flex items-center justify-center rounded-none">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-white font-black text-sm uppercase tracking-wider" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>CodeFlow AI</span>
                <span className="block text-white/70 text-[9px] uppercase tracking-wider font-bold">Gemini Powered · Vision</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/20 text-white transition-colors rounded-none">
                <Minimize2 className="w-4 h-4" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/20 text-white transition-colors rounded-none">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: dc ? "#16161e" : "#f0ede6" }}>
            {msgs.map(m => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[85%] p-3 text-xs leading-relaxed font-semibold"
                  style={{
                    border: "2px solid #1a1a1a",
                    boxShadow: "2px 2px 0px 0px #1a1a1a",
                    ...(m.role === "user"
                      ? { background: "#1a1a1a", color: dc ? "#e2e8f0" : "#faf7f2", fontFamily: "monospace" }
                      : { background: dc ? "#2a2a3e" : "#fff", color: dc ? "#e2e8f0" : "#1a1a1a" }),
                  }}
                >
                  {/* Screenshot thumbnail */}
                  {m.image && (
                    <div className="mb-2 border border-white/20 overflow-hidden" style={{ borderRadius: "0px" }}>
                      <img
                        src={m.image}
                        alt="Screen capture"
                        className="w-full h-auto block"
                        style={{ imageRendering: "auto", maxHeight: "150px", objectFit: "cover" }}
                      />
                      <div className="px-2 py-1 text-[9px] uppercase font-bold tracking-wider" style={{ background: "rgba(139, 92, 246, 0.3)", color: "#e2e8f0" }}>
                        📸 Screen Capture
                      </div>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  <div className="text-[9px] mt-1.5 opacity-50 uppercase tracking-wider" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{m.time}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="p-3 text-xs" style={{ border: "2px solid #1a1a1a", background: dc ? "#2a2a3e" : "#fff", color: dc ? "#a0a0b0" : "#888" }}>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#8b5cf6", borderTopColor: "transparent" }} />
                    <span className="uppercase font-bold text-[10px] tracking-wider" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {capturing ? "Analyzing screenshot..." : "Thinking..."}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Action Bar: Web Search + Screenshot */}
          <div className="px-4 py-2 flex items-center gap-2 shrink-0" style={{ borderTop: `2px solid ${dc ? "#333" : "#d6d1c9"}`, background: dc ? "#1e1e2e" : "#f5f0e8" }}>
            <button
              onClick={() => setWebSearch(!webSearch)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider transition-all"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                border: "2px solid #1a1a1a",
                background: webSearch ? "#0055ff" : (dc ? "#2a2a3e" : "#f5f0e8"),
                color: webSearch ? "#fff" : (dc ? "#a0a0b0" : "#666"),
                boxShadow: webSearch ? "2px 2px 0px 0px #1a1a1a" : "none",
              }}
            >
              <Globe className="w-3 h-3" />
              Web {webSearch ? "ON" : "OFF"}
            </button>

            {/* Screenshot Capture Button */}
            <button
              onClick={captureScreen}
              disabled={capturing || loading}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider transition-all"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                border: "2px solid #1a1a1a",
                background: capturing ? "#8b5cf6" : (dc ? "#2a2a3e" : "#f5f0e8"),
                color: capturing ? "#fff" : (dc ? "#a0a0b0" : "#666"),
                boxShadow: capturing ? "2px 2px 0px 0px #1a1a1a" : "none",
                opacity: (capturing || loading) ? 0.6 : 1,
              }}
            >
              {capturing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
              {capturing ? "..." : "Screen"}
            </button>

            <span className="text-[9px] opacity-50 font-medium flex-1 text-right" style={{ color: dc ? "#888" : "#888" }}>
              {capturing ? "Capturing screen..." : webSearch ? "Web search on" : "AI · Vision"}
            </span>
          </div>

          {/* Input */}
          <div className="flex shrink-0" style={{ borderTop: "3px solid #1a1a1a" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask anything..."
              className="flex-1 px-4 py-3 text-xs font-semibold focus:outline-none"
              style={{ background: dc ? "#1e1e2e" : "#fff", color: dc ? "#e2e8f0" : "#1a1a1a", caretColor: "#8b5cf6" }}
            />
            <button
              onClick={send}
              disabled={loading}
              className="px-4 flex items-center justify-center transition-all hover:opacity-80"
              style={{ background: "#1a1a1a", borderLeft: "3px solid #1a1a1a" }}
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
