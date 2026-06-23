import { useState } from "react";
import { ArrowRight, Lock, Mail, Eye, EyeOff, UserPlus, LogIn } from "lucide-react";
import { LanguageKey } from "../samples";

const LANGS: { key: LanguageKey; label: string }[] = [
  { key: "PYTHON", label: "Python" }, { key: "JS", label: "JavaScript" },
  { key: "TS", label: "TypeScript" }, { key: "JAVA", label: "Java" },
  { key: "C++", label: "C++" }, { key: "RUST", label: "Rust" },
  { key: "GO", label: "Go" }, { key: "RUBY", label: "Ruby" },
  { key: "PHP", label: "PHP" }, { key: "SWIFT", label: "Swift" },
];

interface Props {
  onLogin: (email: string, lang: string) => void;
  onSwitch: (v: "landing" | "login" | "signup") => void;
  view: "login" | "signup";
}

export default function AuthPages({ onLogin, onSwitch, view }: Props) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [lang, setLang] = useState<LanguageKey>("PYTHON");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr(null);
    if (!email || !pw) return setErr("Fill in all fields.");
    if (view === "signup" && pw !== pw2) return setErr("Passwords don't match.");
    if (pw.length < 6) return setErr("Password must be 6+ chars.");
    setBusy(true);
    try {
      const ep = view === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const body = view === "signup" ? { email, password: pw, preferredLanguage: lang } : { email, password: pw };
      const r = await fetch(ep, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Auth failed");
      localStorage.setItem("cf_token", d.token);
      localStorage.setItem("cf_user", JSON.stringify({ email: d.email, preferredLanguage: d.preferredLanguage }));
      onLogin(d.email, d.preferredLanguage);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full px-4 md:px-12 py-4 flex items-center justify-between border-b-3 border-primary bg-[#faf7f2]">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSwitch("landing")}>
          <div className="w-8 h-8 bg-primary-container neo-brutal-border flex items-center justify-center font-display font-black text-lg">C</div>
          <span className="text-2xl font-display font-black tracking-tighter uppercase">CodeFlow</span>
        </div>
        <button onClick={() => onSwitch(view === "login" ? "signup" : "login")} className="px-4 py-2 border-2 border-primary bg-stone-50 font-display font-bold text-xs uppercase hover:bg-primary-container transition-all">
          {view === "login" ? "Create Account" : "Sign In"}
        </button>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="auth-animate w-full max-w-md">
          <div className="h-2 bg-primary-container border-3 border-primary border-b-0" />
          <div className="border-3 border-primary bg-stone-50 neo-brutal-shadow p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary-container neo-brutal-border flex items-center justify-center">
                {view === "login" ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
              </div>
              <div>
                <h1 className="font-display font-black text-2xl uppercase">{view === "login" ? "Welcome Back" : "Create Account"}</h1>
                <p className="font-body text-xs text-stone-500">{view === "login" ? "Sign in to workspace" : "Join CodeFlow"}</p>
              </div>
            </div>
            {err && <div className="mb-4 p-3 border-2 border-[#e63b2e] bg-[#ffdad6] text-[#93000a] text-xs font-bold uppercase">{err}</div>}
            <div className="space-y-4">
              <div>
                <label className="font-display font-bold text-[10px] uppercase tracking-wider text-stone-500 block mb-1">Email</label>
                <div className="flex border-3 border-primary bg-white">
                  <div className="px-3 flex items-center bg-stone-100 border-r-2 border-primary"><Mail className="w-4 h-4 text-stone-400" /></div>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="flex-1 px-4 py-3 text-sm focus:outline-none" onKeyDown={e => e.key === "Enter" && submit()} />
                </div>
              </div>
              <div>
                <label className="font-display font-bold text-[10px] uppercase tracking-wider text-stone-500 block mb-1">Password</label>
                <div className="flex border-3 border-primary bg-white">
                  <div className="px-3 flex items-center bg-stone-100 border-r-2 border-primary"><Lock className="w-4 h-4 text-stone-400" /></div>
                  <input type={showPw ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••" className="flex-1 px-4 py-3 text-sm focus:outline-none" onKeyDown={e => e.key === "Enter" && submit()} />
                  <button onClick={() => setShowPw(!showPw)} className="px-3 bg-stone-100 border-l-2 border-primary">{showPw ? <EyeOff className="w-4 h-4 text-stone-400" /> : <Eye className="w-4 h-4 text-stone-400" />}</button>
                </div>
              </div>
              {view === "signup" && <>
                <div>
                  <label className="font-display font-bold text-[10px] uppercase tracking-wider text-stone-500 block mb-1">Confirm Password</label>
                  <div className="flex border-3 border-primary bg-white">
                    <div className="px-3 flex items-center bg-stone-100 border-r-2 border-primary"><Lock className="w-4 h-4 text-stone-400" /></div>
                    <input type={showPw ? "text" : "password"} value={pw2} onChange={e => setPw2(e.target.value)} placeholder="••••••" className="flex-1 px-4 py-3 text-sm focus:outline-none" onKeyDown={e => e.key === "Enter" && submit()} />
                  </div>
                </div>
                <div>
                  <label className="font-display font-bold text-[10px] uppercase tracking-wider text-stone-500 block mb-1">Preferred Language</label>
                  <div className="border-3 border-primary bg-white">
                    <select value={lang} onChange={e => setLang(e.target.value as LanguageKey)} className="w-full px-4 py-3 text-sm focus:outline-none bg-white">
                      {LANGS.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
                    </select>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">Personalizes your workspace</p>
                </div>
              </>}
            </div>
            <button onClick={submit} disabled={busy} className={`mt-6 w-full py-4 font-display font-black text-sm uppercase border-3 border-primary flex items-center justify-center gap-2 transition-all ${busy ? "bg-stone-300 text-stone-500" : "bg-primary-container text-primary neo-brutal-shadow"}`}>
              {busy ? "Processing..." : view === "login" ? "Sign In" : "Create Account"}
              {!busy && <ArrowRight className="w-5 h-5 stroke-[3px]" />}
            </button>
            <p className="mt-4 text-center">
              <button onClick={() => { setErr(null); onSwitch(view === "login" ? "signup" : "login"); }} className="text-xs text-stone-500 hover:text-tertiary underline">
                {view === "login" ? "No account? Sign up" : "Have an account? Sign in"}
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
