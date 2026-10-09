// Server pengembangan lokal untuk Rust Oxide Lab.
//   bun run dev   -> http://127.0.0.1:4747
// Halaman di-bundle ulang setiap kali dimuat, dan endpoint /api/run
// meng-compile kode memakai `rustc` lokal bila toolchain tersedia.

import { bundle, renderPage } from "./src/shell.ts";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PORT = Number(process.env.PORT ?? 4747);

async function exec(cmd: string[], opts: { cwd?: string; timeoutMs: number }) {
  const proc = Bun.spawn(cmd, { cwd: opts.cwd, stdout: "pipe", stderr: "pipe" });
  const timer = setTimeout(() => proc.kill(), opts.timeoutMs);
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  clearTimeout(timer);
  return { stdout, stderr, code, killed: proc.signalCode != null };
}

let rustcVersion: string | null | undefined;
async function detectRustc() {
  if (rustcVersion !== undefined) return rustcVersion;
  try {
    const r = await exec(["rustc", "--version"], { timeoutMs: 5000 });
    rustcVersion = r.code === 0 ? r.stdout.trim() : null;
  } catch {
    rustcVersion = null;
  }
  return rustcVersion;
}

async function runRust(code: string) {
  const dir = await mkdtemp(join(tmpdir(), "oxide-lab-"));
  try {
    await Bun.write(join(dir, "main.rs"), code);
    const compile = await exec(
      ["rustc", "--edition", "2021", "-o", join(dir, "main"), join(dir, "main.rs")],
      { cwd: dir, timeoutMs: 20000 },
    );
    if (compile.code !== 0) {
      return { success: false, stdout: "", stderr: compile.stderr.replaceAll(dir + "/", "") };
    }
    const run = await exec([join(dir, "main")], { cwd: dir, timeoutMs: 5000 });
    let stderr = compile.stderr + run.stderr;
    if (run.killed) stderr += "\n[dihentikan: program berjalan lebih dari 5 detik]";
    return { success: run.code === 0, stdout: run.stdout, stderr };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

Bun.serve({
  port: PORT,
  hostname: "127.0.0.1",
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/api/health") {
      const v = await detectRustc();
      return Response.json({ local: v != null, version: v });
    }
    if (url.pathname === "/api/run" && req.method === "POST") {
      if (!(await detectRustc())) {
        return Response.json({ error: "rustc tidak tersedia" }, { status: 503 });
      }
      const { code } = (await req.json()) as { code: string };
      return Response.json(await runRust(String(code ?? "")));
    }
    if (url.pathname === "/" || url.pathname === "/index.html") {
      try {
        const { js, css } = await bundle();
        return new Response(renderPage({ js, css, full: true }), {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      } catch (e) {
        return new Response(`<pre>${String(e)}</pre>`, {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
    }
    return new Response("Not found", { status: 404 });
  },
});

const v = await detectRustc();
console.log(`\n  🦀 Rust Oxide Lab  ->  http://127.0.0.1:${PORT}`);
console.log(
  v ? `  Runner: ${v} (lokal)` : "  Runner: Rust Playground (rustc lokal tidak ditemukan)",
);
console.log("");
