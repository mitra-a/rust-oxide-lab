// Menjalankan kode Rust. Urutan: rustc lokal (via server Bun) -> Rust Playground.
// Bila keduanya tidak bisa dijangkau, UI menawarkan tautan "Buka di Playground".

const PLAYGROUND = "https://play.rust-lang.org/execute";

export const runnerState = {
  mode: "checking", // "local" | "playground" | "offline" | "checking"
  version: null,
  listeners: new Set(),
};

function setMode(mode, version = null) {
  runnerState.mode = mode;
  runnerState.version = version;
  runnerState.listeners.forEach((fn) => fn(runnerState));
}

export async function detectRunner() {
  try {
    if (location.protocol.startsWith("http")) {
      const r = await fetch("/api/health", { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        if (j.local) return setMode("local", j.version);
      }
    }
  } catch {}
  // Playground: kita anggap tersedia sampai terbukti gagal saat dijalankan.
  setMode("playground");
}

export function playgroundUrl(code) {
  return `https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&code=${encodeURIComponent(code)}`;
}

function cleanPlaygroundStderr(s) {
  return s
    .split("\n")
    .filter(
      (l) => !/^\s*(Compiling playground|Finished `|Running `target|Blocking waiting)/.test(l),
    )
    .join("\n")
    .trim();
}

export async function runRust(code, { preferPlayground = false } = {}) {
  if (runnerState.mode === "local" && !preferPlayground) {
    try {
      const r = await fetch("/api/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (r.ok) {
        const j = await r.json();
        return { ...j, via: "rustc lokal" };
      }
    } catch {}
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 30000);
    const r = await fetch(PLAYGROUND, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channel: "stable",
        mode: "debug",
        edition: "2021",
        crateType: "bin",
        tests: false,
        backtrace: false,
        code,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    if (runnerState.mode === "offline") setMode("playground");
    return {
      success: j.success,
      stdout: j.stdout ?? "",
      stderr: cleanPlaygroundStderr(j.stderr ?? ""),
      via: "Rust Playground",
    };
  } catch (e) {
    if (runnerState.mode !== "local") setMode("offline");
    return { offline: true, error: String(e) };
  }
}
