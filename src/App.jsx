import { useState, useEffect, useRef } from "react";
import SessionManager from "../components/SessionManager";

// ─── Fake data ────────────────────────────────────────────────────────────────
const FAKE_USERS = [
  { id: 1, name: "Hamza Khan", email: "hamza@college.edu", role: "admin", password: "admin123" },
  { id: 2, name: "Aryan Mehta", email: "aryan@college.edu", role: "student", password: "pass123" },
  { id: 3, name: "Priya Sharma", email: "priya@college.edu", role: "student", password: "pass123" },
];

const ACTIVE_SESSIONS = [
  { id: "s1", user: "Aryan Mehta", container: "coll-env-a3f2", cpu: 34, ram: 512, started: "14:23", status: "running" },
  { id: "s2", user: "Priya Sharma", container: "coll-env-b8c1", cpu: 12, ram: 256, started: "14:31", status: "running" },
  { id: "s3", user: "Ravi Das", container: "coll-env-d9e4", cpu: 78, ram: 1024, started: "13:55", status: "running" },
  { id: "s4", user: "Sneha Rao", container: "coll-env-f2a7", cpu: 5, ram: 128, started: "14:40", status: "idle" },
];

// ─── Terminal lines simulator ─────────────────────────────────────────────────
const BOOT_SEQUENCE = [
  { delay: 0,   text: "[ OK ]  Starting college-platform service...", type: "ok" },
  { delay: 400, text: "[ OK ]  Docker daemon running — 4 containers active", type: "ok" },
  { delay: 700, text: "[ OK ]  PostgreSQL connection established on :5432", type: "ok" },
  { delay: 1000,text: "[ OK ]  FastAPI server listening on 0.0.0.0:8000", type: "ok" },
  { delay: 1300,text: "[ OK ]  Nginx proxy routing /api → :8000", type: "ok" },
  { delay: 1600,text: "[ OK ]  JWT auth module initialized", type: "ok" },
  { delay: 1900,text: "[ OK ]  WebSocket bridge ready on ws://0.0.0.0:8001", type: "ok" },
  { delay: 2200,text: "▶  Platform ready. Welcome, student.", type: "ready" },
];

const TERMINAL_DEMO = [
  { delay: 0,    text: "$ python3", prompt: true },
  { delay: 600,  text: "Python 3.11.4 (college-env) [GCC 11.3.0]", prompt: false },
  { delay: 900,  text: ">>> import numpy as np", prompt: true },
  { delay: 1400, text: ">>> arr = np.random.randn(1000)", prompt: true },
  { delay: 1900, text: ">>> print(arr.mean())", prompt: true },
  { delay: 2300, text: "-0.023417281974", prompt: false },
  { delay: 2700, text: ">>> ", prompt: true },
];

// ─── CSS-in-JS ────────────────────────────────────────────────────────────────
const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #070b0f;
    --surface: #0d1318;
    --surface2: #111920;
    --border: rgba(0,255,170,0.12);
    --border-bright: rgba(0,255,170,0.35);
    --accent: #00ffaa;
    --accent2: #00c8ff;
    --accent3: #ff6b35;
    --warn: #ffcc00;
    --text: #e2eff8;
    --muted: #4a6a7a;
    --font-head: 'Syne', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-mono);
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--surface); }
  ::-webkit-scrollbar-thumb { background: var(--border-bright); border-radius: 2px; }

  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scanline {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(200vh); }
  }
  @keyframes pulse {
    0%,100%{box-shadow:0 0 0 0 rgba(0,255,170,0.4)}
    50%{box-shadow:0 0 0 8px rgba(0,255,170,0)}
  }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes glitch {
    0%,100%{clip-path:inset(0 0 100% 0)}
    10%{clip-path:inset(20% 0 60% 0)}
    20%{clip-path:inset(50% 0 30% 0)}
    30%{clip-path:inset(10% 0 80% 0)}
    40%{clip-path:inset(70% 0 20% 0)}
    50%{clip-path:inset(0 0 0 0)}
  }
`;

// ─── Utilities ────────────────────────────────────────────────────────────────
function useTypingEffect(lines, trigger) {
  const [displayed, setDisplayed] = useState([]);
  useEffect(() => {
    if (!trigger) return;
    setDisplayed([]);
    const timers = lines.map(({ delay, text, type, prompt }) =>
      setTimeout(() => {
        setDisplayed(p => {
          if (p.length > 0 && p[p.length - 1].text === text) return p;
          return [...p, { text, type, prompt }];
        });
      }, delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [trigger]);
  return displayed;
}

function GlowDot({ color = "#00ffaa", size = 8, pulse = false }) {
  return (
    <span style={{
      display: "inline-block",
      width: size, height: size,
      borderRadius: "50%",
      background: color,
      boxShadow: `0 0 ${size}px ${color}`,
      animation: pulse ? "pulse 2s ease infinite" : "none",
      flexShrink: 0,
    }} />
  );
}

function Badge({ label, color = "#00ffaa" }) {
  return (
    <span style={{
      fontSize: 10, fontFamily: "var(--font-mono)",
      padding: "2px 8px", borderRadius: 3,
      border: `1px solid ${color}40`,
      color, background: `${color}15`,
      textTransform: "uppercase", letterSpacing: 1,
    }}>{label}</span>
  );
}

// ─── Loading / Boot screen ────────────────────────────────────────────────────
function BootScreen({ onDone }) {
  const lines = useTypingEffect(BOOT_SEQUENCE, true);
  useEffect(() => {
    if (lines.length >= BOOT_SEQUENCE.length) {
      const t = setTimeout(onDone, 800);
      return () => clearTimeout(t);
    }
  }, [lines.length]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#020508",
      display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center",
      zIndex: 1000, padding: 40,
    }}>
      {/* scanline effect */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: "linear-gradient(transparent, rgba(0,255,170,0.15), transparent)",
        animation: "scanline 3s linear infinite", pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 600, width: "100%" }}>
        <div style={{ marginBottom: 32, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 8,
            background: "linear-gradient(135deg, #00ffaa22, #00c8ff22)",
            border: "1px solid var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
          }}>⬡</div>
          <div>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 800, color: "var(--accent)" }}>
              COLLEGE COMPUTE
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 2 }}>
              PLATFORM BOOTSTRAP — v1.0.0-hackathon
            </div>
          </div>
        </div>

        <div style={{
          background: "#0a0f14", border: "1px solid var(--border)",
          borderRadius: 8, padding: "20px 24px",
          minHeight: 220,
        }}>
          {lines.map((l, i) => (
            <div key={i} style={{
              fontSize: 13, lineHeight: 1.8,
              color: l.type === "ok" ? "#aaccbb" : l.type === "ready" ? "var(--accent)" : "var(--text)",
              fontWeight: l.type === "ready" ? 700 : 400,
              animation: "fadeUp 0.3s ease",
            }}>
              {l.text}
            </div>
          ))}
          {lines.length < BOOT_SEQUENCE.length && (
            <span style={{ color: "var(--accent)", animation: "blink 1s step-end infinite" }}>█</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared input field ───────────────────────────────────────────────────────
function AuthField({ label, value, set, type, placeholder, onEnter }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 1, display: "block", marginBottom: 6 }}>
        {label.toUpperCase()}
      </label>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => set(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onEnter?.()}
        style={{
          width: "100%", padding: "10px 14px",
          background: "#0a0f14", border: "1px solid var(--border)",
          borderRadius: 6, color: "var(--text)", fontSize: 13,
          fontFamily: "var(--font-mono)", outline: "none",
          transition: "border 0.2s",
        }}
        onFocus={e => e.target.style.borderColor = "var(--border-bright)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />
    </div>
  );
}

// ─── Password strength meter ──────────────────────────────────────────────────
function PasswordStrength({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#ff6b6b", "#ffcc00", "#00c8ff", "#00ffaa"];

  if (!password) return null;
  return (
    <div style={{ marginBottom: 16, marginTop: -8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= score ? colors[score] : "var(--border)",
            transition: "background 0.3s",
            boxShadow: i <= score ? `0 0 6px ${colors[score]}` : "none",
          }} />
        ))}
      </div>
      <div style={{ fontSize: 10, color: colors[score], letterSpacing: 0.5 }}>
        {labels[score]}
        {score < 4 && <span style={{ color: "var(--muted)", marginLeft: 6 }}>
          {!checks[0] && "· 8+ chars "}
          {!checks[1] && "· uppercase "}
          {!checks[2] && "· number "}
          {!checks[3] && "· symbol"}
        </span>}
      </div>
    </div>
  );
}

// ─── Login / Sign Up Page ─────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"

  // login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPass, setSignupPass] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(m) {
    setMode(m); setErr(""); setSignupSuccess(false);
    setLoginEmail(""); setLoginPass("");
    setSignupName(""); setSignupEmail(""); setSignupPass(""); setSignupConfirm("");
  }

  function handleLogin() {
    setLoading(true); setErr("");
    setTimeout(() => {
      const user = FAKE_USERS.find(u => u.email === loginEmail && u.password === loginPass);
      if (user) onLogin(user);
      else { setErr("Invalid email or password."); setLoading(false); }
    }, 900);
  }

  function handleSignup() {
    setErr("");
    if (!signupName.trim()) return setErr("Full name is required.");
    if (!signupEmail.includes("@")) return setErr("Enter a valid email address.");
    if (signupPass.length < 8) return setErr("Password must be at least 8 characters.");
    if (signupPass !== signupConfirm) return setErr("Passwords do not match.");
    if (FAKE_USERS.find(u => u.email === signupEmail))
      return setErr("An account with this email already exists.");

    setLoading(true);
    setTimeout(() => {
      const newUser = {
        id: FAKE_USERS.length + 1,
        name: signupName.trim(),
        email: signupEmail.trim(),
        role: "student",
        password: signupPass,
      };
      FAKE_USERS.push(newUser);
      setLoading(false);
      setSignupSuccess(true);
    }, 1000);
  }

  // shared page wrapper
  const pageWrap = (children) => (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at 20% 50%, #001a12 0%, var(--bg) 60%)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />
      <div style={{ width: 420, animation: "fadeUp 0.4s ease", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, margin: "0 auto 14px",
            borderRadius: 14, border: "1px solid var(--accent)",
            background: "linear-gradient(135deg, #00ffaa18, #00c8ff18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, boxShadow: "0 0 40px #00ffaa22",
          }}>⬡</div>
          <h1 style={{ fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>
            College Compute
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 5, letterSpacing: 1 }}>
            SELF-HOSTED · DOCKER · ISOLATED
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: "flex", background: "var(--surface2)",
          border: "1px solid var(--border)", borderRadius: 8,
          padding: 4, marginBottom: 16, gap: 4,
        }}>
          {[["login", "Sign In"], ["signup", "Create Account"]].map(([id, label]) => (
            <button key={id} onClick={() => switchMode(id)} style={{
              flex: 1, padding: "9px 0",
              background: mode === id ? "linear-gradient(135deg, #00ffaa22, #00c8ff22)" : "transparent",
              border: mode === id ? "1px solid var(--border-bright)" : "1px solid transparent",
              borderRadius: 5, color: mode === id ? "var(--accent)" : "var(--muted)",
              fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 12,
              letterSpacing: 0.5, cursor: "pointer", transition: "all 0.2s",
            }}>{label}</button>
          ))}
        </div>

        {children}
      </div>
    </div>
  );

  // ── Sign In ──
  if (mode === "login") return pageWrap(
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 12, padding: 28,
      boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    }}>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20, letterSpacing: 0.5 }}>
        Welcome back — sign in to access your environment
      </p>

      <AuthField label="Email" value={loginEmail} set={setLoginEmail} type="email" placeholder="you@college.edu" onEnter={handleLogin} />
      <AuthField label="Password" value={loginPass} set={setLoginPass} type="password" placeholder="••••••••" onEnter={handleLogin} />

      {err && (
        <div style={{
          fontSize: 12, color: "#ff6b6b", background: "#ff6b6b11",
          border: "1px solid #ff6b6b33", borderRadius: 4,
          padding: "8px 12px", marginBottom: 12,
        }}>{err}</div>
      )}

      <button onClick={handleLogin} disabled={loading} style={{
        width: "100%", padding: "12px",
        background: loading ? "var(--surface2)" : "linear-gradient(135deg, #00ffaa, #00c8ff)",
        color: loading ? "var(--muted)" : "#020508",
        border: "none", borderRadius: 6, cursor: loading ? "default" : "pointer",
        fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14,
        letterSpacing: 1, marginTop: 4, transition: "all 0.2s",
      }}>
        {loading ? "Authenticating..." : "→  SIGN IN"}
      </button>

      <div style={{
        marginTop: 20, padding: "14px", background: "#0a0f14",
        borderRadius: 6, border: "1px solid var(--border)",
      }}>
        <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 8, letterSpacing: 1 }}>DEMO CREDENTIALS</div>
        {[
          { label: "Admin", email: "hamza@college.edu", pass: "admin123" },
          { label: "Student", email: "aryan@college.edu", pass: "pass123" },
        ].map(d => (
          <div key={d.label}
            onClick={() => { setLoginEmail(d.email); setLoginPass(d.pass); }}
            style={{
              fontSize: 11, color: "var(--accent)", cursor: "pointer",
              padding: "4px 0", display: "flex", gap: 8, alignItems: "center",
            }}>
            <Badge label={d.label} color={d.label === "Admin" ? "var(--accent3)" : "var(--accent)"} />
            <span style={{ color: "var(--muted)" }}>{d.email}</span>
          </div>
        ))}
      </div>

      <p style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "var(--muted)" }}>
        No account?{" "}
        <span onClick={() => switchMode("signup")} style={{ color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}>
          Create one
        </span>
      </p>
    </div>
  );

  // ── Sign Up ──
  return pageWrap(
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 12, padding: 28,
      boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    }}>
      {signupSuccess ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "#00ffaa18", border: "2px solid var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, margin: "0 auto 16px",
          }}>✓</div>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 800, color: "var(--accent)", marginBottom: 8 }}>
            Account Created!
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>
            Your student environment is ready. Sign in to launch your container.
          </p>
          <button onClick={() => switchMode("login")} style={{
            padding: "11px 32px",
            background: "linear-gradient(135deg, #00ffaa, #00c8ff)",
            color: "#020508", border: "none", borderRadius: 6,
            fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 13,
            letterSpacing: 1, cursor: "pointer",
          }}>→  GO TO SIGN IN</button>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20, letterSpacing: 0.5 }}>
            Register with your college email to get a personal compute environment
          </p>

          <AuthField label="Full Name" value={signupName} set={setSignupName} type="text" placeholder="Aryan Mehta" onEnter={handleSignup} />
          <AuthField label="College Email" value={signupEmail} set={setSignupEmail} type="email" placeholder="you@college.edu" onEnter={handleSignup} />
          <AuthField label="Password" value={signupPass} set={setSignupPass} type="password" placeholder="Min. 8 characters" onEnter={handleSignup} />
          <PasswordStrength password={signupPass} />
          <AuthField label="Confirm Password" value={signupConfirm} set={setSignupConfirm} type="password" placeholder="Re-enter password" onEnter={handleSignup} />

          {signupPass && signupConfirm && signupPass !== signupConfirm && (
            <div style={{
              fontSize: 11, color: "#ff6b6b", marginTop: -10, marginBottom: 12,
            }}>✗ Passwords don't match</div>
          )}
          {signupPass && signupConfirm && signupPass === signupConfirm && signupConfirm.length > 0 && (
            <div style={{
              fontSize: 11, color: "var(--accent)", marginTop: -10, marginBottom: 12,
            }}>✓ Passwords match</div>
          )}

          {err && (
            <div style={{
              fontSize: 12, color: "#ff6b6b", background: "#ff6b6b11",
              border: "1px solid #ff6b6b33", borderRadius: 4,
              padding: "8px 12px", marginBottom: 12,
            }}>{err}</div>
          )}

          <button onClick={handleSignup} disabled={loading} style={{
            width: "100%", padding: "12px",
            background: loading ? "var(--surface2)" : "linear-gradient(135deg, #00c8ff, #00ffaa)",
            color: loading ? "var(--muted)" : "#020508",
            border: "none", borderRadius: 6, cursor: loading ? "default" : "pointer",
            fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14,
            letterSpacing: 1, marginTop: 4, transition: "all 0.2s",
          }}>
            {loading ? "Creating Account..." : "⬡  CREATE ACCOUNT"}
          </button>

          <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--muted)" }}>
            Already have an account?{" "}
            <span onClick={() => switchMode("login")} style={{ color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}>
              Sign in
            </span>
          </p>
        </>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", icon: "◈", label: "Dashboard" },
  { id: "terminal", icon: "⬡", label: "My Terminal" },
  { id: "resources", icon: "▦", label: "Resources" },
  { id: "admin", icon: "⚙", label: "Admin Panel", adminOnly: true },
];

function Sidebar({ user, active, setActive, onLogout }) {
  return (
    <div style={{
      width: 220, background: "var(--surface)", borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column", height: "100vh",
      position: "sticky", top: 0, flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: "20px 20px 16px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: "linear-gradient(135deg, #00ffaa22, #00c8ff22)",
          border: "1px solid var(--border-bright)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, color: "var(--accent)",
        }}>⬡</div>
        <div>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 800 }}>COLLEGE</div>
          <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 1.5 }}>COMPUTE</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "16px 10px", flex: 1 }}>
        {NAV_ITEMS.filter(n => !n.adminOnly || user.role === "admin").map(item => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px", borderRadius: 7, border: "none",
              background: active === item.id
                ? "linear-gradient(90deg, rgba(0,255,170,0.12), rgba(0,255,170,0.04))"
                : "transparent",
              color: active === item.id ? "var(--accent)" : "var(--muted)",
              borderLeft: active === item.id ? "2px solid var(--accent)" : "2px solid transparent",
              cursor: "pointer", marginBottom: 2,
              fontFamily: "var(--font-mono)", fontSize: 13,
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* User */}
      <div style={{
        padding: "16px 20px", borderTop: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--accent), var(--accent2))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "#020508",
            fontFamily: "var(--font-head)",
          }}>{user.name[0]}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{user.name.split(" ")[0]}</div>
            <div style={{ fontSize: 10, color: "var(--muted)" }}>
              <Badge label={user.role} color={user.role === "admin" ? "var(--accent3)" : "var(--accent)"} />
            </div>
          </div>
        </div>
        <button onClick={onLogout} style={{
          width: "100%", padding: "8px", background: "transparent",
          border: "1px solid var(--border)", borderRadius: 5,
          color: "var(--muted)", fontSize: 11, cursor: "pointer",
          fontFamily: "var(--font-mono)",
          transition: "all 0.15s",
        }}
          onMouseEnter={e => e.target.style.borderColor = "#ff6b6b55"}
          onMouseLeave={e => e.target.style.borderColor = "var(--border)"}
        >
          ← Sign Out
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, accent = "var(--accent)", icon }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 10, padding: "20px 22px",
      position: "relative", overflow: "hidden",
      transition: "border 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = accent + "55"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
    >
      <div style={{
        position: "absolute", right: 18, top: 18, fontSize: 28, opacity: 0.07,
      }}>{icon}</div>
      <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 1, marginBottom: 10 }}>
        {label.toUpperCase()}
      </div>
      <div style={{
        fontFamily: "var(--font-head)", fontSize: 36, fontWeight: 800,
        color: accent, lineHeight: 1,
      }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>{sub}</div>
    </div>
  );
}

function MiniBar({ val, max = 100, color = "var(--accent)" }) {
  return (
    <div style={{ height: 4, background: "var(--surface2)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{
        width: `${(val / max) * 100}%`, height: "100%",
        background: color, borderRadius: 2,
        transition: "width 1s ease",
        boxShadow: `0 0 6px ${color}`,
      }} />
    </div>
  );
}

function Dashboard({ user }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 2000);
    return () => clearInterval(t);
  }, []);

  const cpu = 23 + Math.sin(tick * 0.7) * 15;
  const ram = 42 + Math.cos(tick * 0.5) * 10;
  const net = 8 + Math.abs(Math.sin(tick)) * 20;

  return (
    <div style={{ padding: 32, animation: "fadeUp 0.4s ease" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "var(--font-head)", fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
          Dashboard
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 12 }}>
          College compute platform — live overview
        </p>
      </div>

      {/* Metrics row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16, marginBottom: 28 }}>
        <MetricCard label="Active Containers" value={ACTIVE_SESSIONS.length} sub="4 students online" icon="⬡" />
        <MetricCard label="Server CPU" value={`${cpu.toFixed(0)}%`} sub="college-server-01" accent="var(--accent2)" icon="▣" />
        <MetricCard label="RAM Used" value={`${(ram / 100 * 32).toFixed(1)}G`} sub="of 32GB total" accent="var(--warn)" icon="◈" />
        <MetricCard label="Network I/O" value={`${net.toFixed(0)}MB`} sub="per second" accent="var(--accent3)" icon="≋" />
      </div>

      {/* Active sessions table */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 10, overflow: "hidden", marginBottom: 24,
      }}>
        <div style={{
          padding: "16px 22px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 14, fontWeight: 700 }}>
            Active Sessions
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <GlowDot pulse />
            <span style={{ fontSize: 11, color: "var(--accent)" }}>LIVE</span>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface2)" }}>
              {["Student", "Container ID", "CPU", "RAM", "Started", "Status"].map(h => (
                <th key={h} style={{
                  padding: "10px 16px", textAlign: "left",
                  fontSize: 10, color: "var(--muted)", letterSpacing: 1,
                  fontWeight: 500, borderBottom: "1px solid var(--border)",
                }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACTIVE_SESSIONS.map((s, i) => (
              <tr key={s.id} style={{
                borderBottom: i < ACTIVE_SESSIONS.length - 1 ? "1px solid var(--border)" : "none",
                transition: "background 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "12px 16px", fontSize: 13 }}>{s.user}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                  {s.container}
                </td>
                <td style={{ padding: "12px 16px", width: 120 }}>
                  <div style={{ fontSize: 11, marginBottom: 4, color: s.cpu > 60 ? "var(--accent3)" : "var(--text)" }}>
                    {s.cpu}%
                  </div>
                  <MiniBar val={s.cpu} color={s.cpu > 60 ? "var(--accent3)" : "var(--accent)"} />
                </td>
                <td style={{ padding: "12px 16px", width: 120 }}>
                  <div style={{ fontSize: 11, marginBottom: 4 }}>{s.ram}MB</div>
                  <MiniBar val={s.ram} max={2048} color="var(--accent2)" />
                </td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--muted)" }}>{s.started}</td>
                <td style={{ padding: "12px 16px" }}>
                  <Badge label={s.status} color={s.status === "running" ? "var(--accent)" : "var(--warn)"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Server specs */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 10, padding: "20px 22px",
      }}>
        <div style={{ fontFamily: "var(--font-head)", fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
          Server Hardware
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
          {[
            { label: "CPU", val: "Intel Xeon E5-2680v4" },
            { label: "Cores", val: "28 cores / 56 threads" },
            { label: "RAM", val: "32GB DDR4 ECC" },
            { label: "Storage", val: "2TB NVMe SSD" },
            { label: "Docker", val: "v24.0.5" },
            { label: "OS", val: "Ubuntu 22.04 LTS" },
          ].map(spec => (
            <div key={spec.label} style={{
              padding: "10px 14px", background: "var(--surface2)",
              borderRadius: 6, border: "1px solid var(--border)",
            }}>
              <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 1, marginBottom: 4 }}>
                {spec.label.toUpperCase()}
              </div>
              <div style={{ fontSize: 12 }}>{spec.val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Terminal Page ────────────────────────────────────────────────────────────
function TerminalPage({ user }) {
  const [phase, setPhase] = useState("idle"); // idle | starting | active
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const demoLines = useTypingEffect(TERMINAL_DEMO, phase === "active");

  useEffect(() => {
    if (phase === "active" && demoLines.length > 0) {
      setHistory(demoLines);
    }
  }, [demoLines]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  function startEnv() {
    setPhase("starting");
    setTimeout(() => {
      setPhase("active");
      setHistory([
        { text: "Pulling image: college-env:latest ... done", type: "sys" },
        { text: "Container ID: coll-env-" + Math.random().toString(36).slice(2, 8), type: "sys" },
        { text: "Limits: 1 CPU, 512MB RAM", type: "sys" },
        { text: "Working dir: /home/student", type: "sys" },
        { text: "─".repeat(40), type: "sep" },
        { text: `Welcome, ${user.name.split(" ")[0]}! Type 'help' for available commands.`, type: "info", prompt: false },
      ]);
    }, 2200);
  }

  function handleCommand(e) {
    if (e.key !== "Enter" || !input.trim()) return;
    const cmd = input.trim();
    setInput("");
    const newLines = [{ text: cmd, prompt: true }];

    if (cmd === "help") {
      newLines.push({ text: "Available: python3, pip, numpy, pandas, matplotlib, ls, cat, echo, clear", type: "info" });
    } else if (cmd === "ls") {
      newLines.push({ text: "welcome.txt  data/  notebooks/", type: "info" });
    } else if (cmd === "python3 --version") {
      newLines.push({ text: "Python 3.11.4", type: "info" });
    } else if (cmd === "clear") {
      setHistory([]);
      return;
    } else if (cmd === "exit") {
      setPhase("idle");
      setHistory([]);
      return;
    } else {
      newLines.push({ text: `bash: ${cmd}: command not found`, type: "err" });
    }
    setHistory(p => [...p, ...newLines]);
  }

  return (
    <div style={{ padding: 32, animation: "fadeUp 0.4s ease", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "var(--font-head)", fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
          My Terminal
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 12 }}>
          Isolated Docker container — your personal compute environment
        </p>
      </div>

      {phase === "idle" && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 24,
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            border: "2px solid var(--border-bright)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, color: "var(--accent)",
            boxShadow: "0 0 40px #00ffaa18",
          }}>⬡</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              No Active Environment
            </div>
            <p style={{ color: "var(--muted)", fontSize: 13, maxWidth: 340 }}>
              Click below to spin up your isolated Docker container on the college server.
              Pre-loaded with Python 3.11, numpy, pandas, matplotlib.
            </p>
          </div>
          <button
            onClick={startEnv}
            style={{
              padding: "14px 36px",
              background: "linear-gradient(135deg, #00ffaa, #00c8ff)",
              color: "#020508", border: "none", borderRadius: 8,
              fontFamily: "var(--font-head)", fontWeight: 800,
              fontSize: 14, letterSpacing: 1, cursor: "pointer",
              boxShadow: "0 0 30px #00ffaa33",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => { e.target.style.transform = "scale(1.04)"; e.target.style.boxShadow = "0 0 50px #00ffaa55"; }}
            onMouseLeave={e => { e.target.style.transform = "scale(1)"; e.target.style.boxShadow = "0 0 30px #00ffaa33"; }}
          >
            ▶  START MY ENVIRONMENT
          </button>
        </div>
      )}

      {phase === "starting" && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 20,
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: "50%",
            border: "2px solid var(--accent)",
            borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
          }} />
          <div style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 700 }}>
            Spinning up container...
          </div>
          {["Pulling college-env image", "Allocating CPU + RAM limits", "Mounting filesystem", "Opening shell"].map((s, i) => (
            <div key={i} style={{
              fontSize: 12, color: "var(--muted)",
              animation: `fadeUp 0.4s ease ${i * 0.3}s both`,
            }}>✓ {s}</div>
          ))}
        </div>
      )}

      {phase === "active" && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          background: "#060b0e", border: "1px solid var(--border)",
          borderRadius: 10, overflow: "hidden",
        }}>
          {/* Terminal header */}
          <div style={{
            padding: "10px 16px", background: "#0a1014",
            borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", gap: 8 }}>
              {["#ff5f57", "#ffbd2e", "#28c840"].map(c => (
                <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
              ))}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              {user.name.toLowerCase().replace(" ", ".")}@college-server:/home/student
            </div>
            <button onClick={() => { setPhase("idle"); setHistory([]); }} style={{
              fontSize: 11, color: "var(--accent3)", background: "transparent",
              border: "1px solid var(--accent3)33", borderRadius: 4,
              padding: "3px 10px", cursor: "pointer", fontFamily: "var(--font-mono)",
            }}>STOP</button>
          </div>

          {/* Terminal body */}
          <div
            style={{ flex: 1, overflowY: "auto", padding: "16px 20px", lineHeight: 1.7 }}
            onClick={() => inputRef.current?.focus()}
          >
            {history.map((line, i) => (
              <div key={i} style={{
                fontSize: 13, fontFamily: "var(--font-mono)",
                color: line.type === "err" ? "#ff6b6b"
                  : line.type === "sys" ? "#4a8a6a"
                  : line.type === "info" ? "var(--muted)"
                  : line.type === "sep" ? "var(--border-bright)"
                  : "var(--text)",
              }}>
                {line.prompt && <span style={{ color: "var(--accent)" }}>$ </span>}
                {line.text}
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center" }} ref={bottomRef}>
              <span style={{ color: "var(--accent)", fontSize: 13 }}>$ </span>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleCommand}
                autoFocus
                style={{
                  background: "transparent", border: "none", outline: "none",
                  color: "var(--text)", fontSize: 13, fontFamily: "var(--font-mono)",
                  flex: 1, caretColor: "var(--accent)",
                }}
              />
              <span style={{ color: "var(--accent)", animation: "blink 1s step-end infinite" }}>█</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Resources Page ───────────────────────────────────────────────────────────
function ResourcesPage() {
  const packages = [
    { name: "numpy", ver: "1.25.2", desc: "Numerical computing" },
    { name: "pandas", ver: "2.0.3", desc: "Data manipulation" },
    { name: "matplotlib", ver: "3.7.2", desc: "Visualization" },
    { name: "requests", ver: "2.31.0", desc: "HTTP library" },
    { name: "scikit-learn", ver: "1.3.0", desc: "Machine learning" },
    { name: "jupyter", ver: "1.0.0", desc: "Notebook interface" },
  ];

  return (
    <div style={{ padding: 32, animation: "fadeUp 0.4s ease" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "var(--font-head)", fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
          Resources
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 12 }}>
          Pre-installed packages and environment specifications
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "22px",
        }}>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
            Container Image
          </div>
          {[
            ["Base", "python:3.11-slim"],
            ["Shell", "/bin/bash"],
            ["CPU Limit", "1 core"],
            ["RAM Limit", "512 MB"],
            ["Work Dir", "/home/student"],
            ["Lifetime", "Session only"],
          ].map(([k, v]) => (
            <div key={k} style={{
              display: "flex", justifyContent: "space-between",
              padding: "8px 0", borderBottom: "1px solid var(--border)",
              fontSize: 12,
            }}>
              <span style={{ color: "var(--muted)" }}>{k}</span>
              <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "22px",
        }}>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
            Platform Stack
          </div>
          {[
            ["Backend", "FastAPI + Python"],
            ["Auth", "JWT (PyJWT)"],
            ["Database", "MongoDB"],
            ["Containers", "Docker (docker-py)"],
            ["Terminal", "xterm.js + WebSocket"],
            ["Proxy", "Nginx"],
          ].map(([k, v]) => (
            <div key={k} style={{
              display: "flex", justifyContent: "space-between",
              padding: "8px 0", borderBottom: "1px solid var(--border)",
              fontSize: 12,
            }}>
              <span style={{ color: "var(--muted)" }}>{k}</span>
              <span style={{ color: "var(--accent2)", fontFamily: "var(--font-mono)" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 10, overflow: "hidden",
      }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-head)", fontSize: 14, fontWeight: 700 }}>
          Pre-installed Packages
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 1, background: "var(--border)" }}>
          {packages.map(pkg => (
            <div key={pkg.name} style={{
              padding: "16px 20px", background: "var(--surface)",
              transition: "background 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--surface)"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent)", fontSize: 14 }}>{pkg.name}</span>
                <span style={{ fontSize: 10, color: "var(--muted)" }}>{pkg.ver}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{pkg.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
function AdminPanel() {
  const allUsers = [
    { name: "Hamza Khan", email: "hamza@college.edu", role: "admin", containers: 0, lastSeen: "now" },
    { name: "Aryan Mehta", email: "aryan@college.edu", role: "student", containers: 1, lastSeen: "now" },
    { name: "Priya Sharma", email: "priya@college.edu", role: "student", containers: 1, lastSeen: "now" },
    { name: "Ravi Das", email: "ravi@college.edu", role: "student", containers: 1, lastSeen: "2m ago" },
    { name: "Sneha Rao", email: "sneha@college.edu", role: "student", containers: 1, lastSeen: "5m ago" },
  ];

  return (
    <div style={{ padding: 32, animation: "fadeUp 0.4s ease" }}>
      <div style={{ marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-head)", fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
            Admin Panel
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 12 }}>
            Full platform control — users, containers, resources
          </p>
        </div>
        <Badge label="Admin Access" color="var(--accent3)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Users", val: 5, color: "var(--accent)" },
          { label: "Active Containers", val: 4, color: "var(--accent2)" },
          { label: "Server Load", val: "34%", color: "var(--warn)" },
        ].map(m => (
          <div key={m.label} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "16px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{m.label}</div>
            <div style={{
              fontFamily: "var(--font-head)", fontSize: 28, fontWeight: 800, color: m.color,
            }}>{m.val}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 10, overflow: "hidden", marginBottom: 24,
      }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-head)", fontSize: 14, fontWeight: 700 }}>
          All Users
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface2)" }}>
              {["Name", "Email", "Role", "Active Containers", "Last Seen", "Action"].map(h => (
                <th key={h} style={{
                  padding: "10px 16px", textAlign: "left",
                  fontSize: 10, color: "var(--muted)", letterSpacing: 1,
                  fontWeight: 500, borderBottom: "1px solid var(--border)",
                }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allUsers.map((u, i) => (
              <tr key={u.email} style={{
                borderBottom: i < allUsers.length - 1 ? "1px solid var(--border)" : "none",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "12px 16px", fontSize: 13 }}>{u.name}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--muted)" }}>{u.email}</td>
                <td style={{ padding: "12px 16px" }}>
                  <Badge label={u.role} color={u.role === "admin" ? "var(--accent3)" : "var(--accent)"} />
                </td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: u.containers > 0 ? "var(--accent)" : "var(--muted)" }}>
                  {u.containers} running
                </td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--muted)" }}>{u.lastSeen}</td>
                <td style={{ padding: "12px 16px" }}>
                  {u.containers > 0 && (
                    <button style={{
                      fontSize: 10, color: "var(--accent3)", background: "transparent",
                      border: "1px solid var(--accent3)33", borderRadius: 4,
                      padding: "3px 10px", cursor: "pointer",
                      fontFamily: "var(--font-mono)",
                    }}>Kill</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");

  if (booting) return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <BootScreen onDone={() => setBooting(false)} />
    </>
  );

  if (!user) return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <LoginPage onLogin={u => { setUser(u); setPage("dashboard"); }} />
    </>
  );      

  return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar user={user} active={page} setActive={setPage} onLogout={() => setUser(null)} />
        <main style={{ flex: 1, overflowY: "auto", maxHeight: "100vh" }}>
          {page === "dashboard" && <Dashboard user={user} />}
          {page === "terminal" && <SessionManager />}
          {page === "resources" && <ResourcesPage />}
          {page === "admin" && user.role === "admin" && <AdminPanel />}
        </main>
      </div>
    </>
  );
}