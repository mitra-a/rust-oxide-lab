// Memastikan setiap contoh kode yang bisa dijalankan lolos kompilasi, setiap solusi
// tantangan menghasilkan output yang diharapkan, dan kode awal tantangan BELUM lulus.
//   bun run check            -> semua
//   bun run check ownership  -> hanya pelajaran yang id-nya memuat "ownership"
import { LESSONS } from "../src/content/index.js";

const filter = process.argv[2];

async function run(code: string) {
  const r = await fetch("https://play.rust-lang.org/execute", {
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
  });
  return (await r.json()) as { success: boolean; stdout: string; stderr: string };
}

type Job = { label: string; code: string; expect?: string[]; shouldFail?: boolean };
const jobs: Job[] = [];
for (const l of LESSONS as any[]) {
  if (filter && !l.id.includes(filter)) continue;
  l.blocks.forEach((b: any, i: number) => {
    if (b.t === "code" && b.run !== false && /fn main\s*\(/.test(b.code)) {
      jobs.push({ label: `${l.id}#${i} code`, code: b.code });
    }
    if (b.t === "challenge") {
      jobs.push({ label: `${l.id}#${i} solusi`, code: b.solution, expect: b.expect });
      jobs.push({ label: `${l.id}#${i} awal`, code: b.code, expect: b.expect, shouldFail: true });
    }
  });
}

let failed = 0;
const queue = [...jobs];
async function worker() {
  while (queue.length) {
    const j = queue.shift()!;
    const r = await run(j.code);
    const pass = r.success && (j.expect ?? []).every((e) => r.stdout.includes(e));
    const ok = j.shouldFail ? !pass : pass;
    if (!ok) {
      failed++;
      const err = r.stderr
        .split("\n")
        .filter((x) => !/Compiling|Finished|Running/.test(x))
        .slice(0, 25)
        .join("\n");
      console.log(`✗ ${j.label}\n--- stdout ---\n${r.stdout}\n--- stderr ---\n${err}\n`);
    } else console.log(`✓ ${j.label}`);
  }
}
await Promise.all([worker(), worker(), worker()]);
console.log(`\n${jobs.length - failed}/${jobs.length} lolos`);
process.exit(failed ? 1 : 0);
