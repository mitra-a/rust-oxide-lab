import { MODULES, LESSONS, CHEATSHEET } from "./content/index.js";
import { highlight, esc } from "./highlight.js";
import { inline, blockText } from "./format.js";
import { createEditor } from "./editor.js";
import { runRust, detectRunner, runnerState, playgroundUrl } from "./runner.js";
import { memoryViz } from "./viz/memory.js";
import { borrowLab } from "./viz/borrow.js";
import { scopeViz } from "./viz/scope.js";
import { iterViz } from "./viz/iter.js";
import { intViz } from "./viz/int.js";

// ---------- Penyimpanan progres (per browser) ----------
const KEY = "oxide-lab-v1";
const store = (() => {
  let data = { done: {}, quiz: {}, challenge: {}, drafts: {}, theme: null };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = { ...data, ...JSON.parse(raw) };
  } catch {}
  return {
    data,
    save() {
      try {
        localStorage.setItem(KEY, JSON.stringify(data));
      } catch {}
    },
  };
})();

const XP = { lesson: 20, quiz: 10, challenge: 30 };
function totalXp() {
  const d = store.data;
  return (
    Object.keys(d.done).length * XP.lesson +
    Object.values(d.quiz).filter((q) => q.correct).length * XP.quiz +
    Object.keys(d.challenge).length * XP.challenge
  );
}

// ---------- Tema ----------
function applyTheme() {
  const t = store.data.theme;
  if (t) document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}
applyTheme();

// ---------- Kerangka ----------
const app = document.getElementById("app");
app.innerHTML = `
  <header class="topbar">
    <button class="icon-btn menu-btn" aria-label="Buka daftar materi" aria-expanded="false">☰</button>
    <a class="brand" href="#home"><span class="brand-mark" aria-hidden="true">Rs</span><span>Oxide Lab</span></a>
    <nav class="top-nav">
      <a href="#home" data-nav="home">Peta Belajar</a>
      <a href="#cheatsheet" data-nav="cheatsheet">JS → Rust</a>
    </nav>
    <div class="top-right">
      <span class="runner-chip" title="Tempat kode Anda dijalankan"><i></i><span>memeriksa…</span></span>
      <span class="xp-chip" title="Poin pengalaman"><b class="xp-n">0</b> XP</span>
      <button class="icon-btn theme-btn" aria-label="Ganti tema"></button>
    </div>
  </header>
  <div class="layout">
    <aside class="sidebar" aria-label="Daftar materi"></aside>
    <div class="scrim" hidden></div>
    <main class="main" id="main" tabindex="-1"></main>
  </div>`;

const sidebar = app.querySelector(".sidebar");
const main = app.querySelector(".main");
const scrim = app.querySelector(".scrim");
const menuBtn = app.querySelector(".menu-btn");

function setMenu(open) {
  sidebar.classList.toggle("open", open);
  scrim.hidden = !open;
  menuBtn.setAttribute("aria-expanded", String(open));
}
menuBtn.onclick = () => setMenu(!sidebar.classList.contains("open"));
scrim.onclick = () => setMenu(false);

const themeBtn = app.querySelector(".theme-btn");
function paintThemeBtn() {
  const t = store.data.theme;
  themeBtn.textContent = t === "dark" ? "☾" : t === "light" ? "☀" : "◐";
  themeBtn.title = t === "dark" ? "Tema: gelap" : t === "light" ? "Tema: terang" : "Tema: ikuti sistem";
}
themeBtn.onclick = () => {
  const order = [null, "light", "dark"];
  store.data.theme = order[(order.indexOf(store.data.theme) + 1) % 3];
  store.save();
  applyTheme();
  paintThemeBtn();
};
paintThemeBtn();

function paintRunner() {
  const chip = app.querySelector(".runner-chip");
  const m = runnerState.mode;
  chip.dataset.mode = m;
  chip.querySelector("span").textContent =
    m === "local"
      ? `rustc lokal`
      : m === "playground"
        ? "Rust Playground"
        : m === "offline"
          ? "offline · buka di Playground"
          : "memeriksa…";
  chip.title =
    m === "local"
      ? `Kode dikompilasi oleh ${runnerState.version} di komputer Anda`
      : m === "playground"
        ? "Kode dikirim ke play.rust-lang.org untuk dikompilasi"
        : m === "offline"
          ? "Runner tidak terjangkau. Tombol Playground membuka kode di tab baru."
          : "";
}
runnerState.listeners.add(paintRunner);
detectRunner();

function paintXp() {
  app.querySelector(".xp-n").textContent = totalXp();
}

// ---------- Sidebar ----------
function renderSidebar(currentId) {
  const done = store.data.done;
  const total = LESSONS.length;
  const finished = LESSONS.filter((l) => done[l.id]).length;
  sidebar.innerHTML = `
    <div class="sb-progress">
      <div class="sb-progress-top"><span>Progres</span><b>${finished}/${total} pelajaran</b></div>
      <div class="meter"><i style="width:${(finished / total) * 100}%"></i></div>
    </div>
    ${MODULES.map((m) => {
      const ls = LESSONS.filter((l) => l.module === m.id);
      const d = ls.filter((l) => done[l.id]).length;
      return `<section class="sb-mod">
        <h3><span class="lvl lvl-${m.level}">${m.levelLabel}</span>${esc(m.title)}<em>${d}/${ls.length}</em></h3>
        <ol>${ls
          .map(
            (l) => `<li><a href="#${l.id}" class="${l.id === currentId ? "cur" : ""}${done[l.id] ? " done" : ""}">
              <span class="tick" aria-hidden="true">${done[l.id] ? "✓" : ""}</span>${esc(l.title)}</a></li>`,
          )
          .join("")}</ol>
      </section>`;
    }).join("")}
    <a class="sb-cheat" href="#cheatsheet">Kamus JS → Rust</a>`;
  sidebar.querySelectorAll("a").forEach((a) => (a.onclick = () => setMenu(false)));
  paintXp();
}

// ---------- Blok konten ----------
function codeBlock(b, key) {
  const el = document.createElement("div");
  el.className = "code-card";
  const runnable = b.run !== false && /fn main\s*\(/.test(b.code);
  const original = b.code.trim();
  const draft = store.data.drafts[key];
  el.innerHTML = `
    <div class="code-bar">
      <span class="code-title">${esc(b.title ?? "main.rs")}</span>
      ${runnable ? `<span class="code-hint">bisa diedit · Ctrl/⌘ + Enter</span>` : ""}
      <div class="code-actions">
        <button class="mini" data-act="copy">Salin</button>
        ${draft != null && draft !== original ? `<button class="mini" data-act="reset">Kembalikan</button>` : ""}
        ${runnable ? `<a class="mini" data-act="pg" target="_blank" rel="noopener">Playground ↗</a><button class="btn btn-run" data-act="run">▶ Jalankan</button>` : ""}
      </div>
    </div>`;
  const ed = createEditor(draft ?? original, {
    onChange: (v) => {
      store.data.drafts[key] = v;
      store.save();
      pg && (pg.href = playgroundUrl(v));
    },
  });
  el.append(ed.el);
  const out = document.createElement("div");
  out.className = "run-out";
  out.hidden = true;
  el.append(out);
  if (b.note) {
    const n = document.createElement("div");
    n.className = "code-note";
    n.innerHTML = inline(b.note);
    el.append(n);
  }
  const pg = el.querySelector('[data-act="pg"]');
  if (pg) pg.href = playgroundUrl(ed.value);
  el.querySelector('[data-act="copy"]').onclick = async (e) => {
    try {
      await navigator.clipboard.writeText(ed.value);
      e.target.textContent = "Tersalin";
    } catch {
      ed.textarea.select();
      e.target.textContent = "Teks dipilih";
    }
    setTimeout(() => (e.target.textContent = "Salin"), 1400);
  };
  const resetBtn = el.querySelector('[data-act="reset"]');
  if (resetBtn)
    resetBtn.onclick = () => {
      ed.value = original;
      delete store.data.drafts[key];
      store.save();
      resetBtn.remove();
      if (pg) pg.href = playgroundUrl(original);
    };
  const runBtn = el.querySelector('[data-act="run"]');
  const doRun = async () => {
    if (!runBtn) return;
    runBtn.disabled = true;
    runBtn.textContent = "Mengompilasi…";
    out.hidden = false;
    out.innerHTML = `<div class="run-wait"><i></i>Mengompilasi dengan ${runnerState.mode === "local" ? "rustc lokal" : "Rust Playground"}…</div>`;
    const r = await runRust(ed.value, { preferPlayground: b.playground });
    runBtn.disabled = false;
    runBtn.textContent = "▶ Jalankan";
    out.innerHTML = renderRunResult(r, ed.value);
  };
  if (runBtn) runBtn.onclick = doRun;
  ed.textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      doRun();
    }
  });
  return { el, editor: ed, out };
}

function renderRunResult(r, code) {
  if (r.offline) {
    return `<div class="run-offline">Runner tidak bisa dijangkau dari halaman ini.
      <a class="btn btn-ghost" href="${playgroundUrl(code)}" target="_blank" rel="noopener">Buka di Rust Playground ↗</a></div>`;
  }
  const parts = [];
  if (r.stderr && r.stderr.trim()) parts.push(`<pre class="diag">${colorDiag(r.stderr)}</pre>`);
  if (r.stdout) parts.push(`<pre class="stdout">${esc(r.stdout)}</pre>`);
  if (!parts.length) parts.push(`<pre class="stdout muted">(tidak ada output)</pre>`);
  return `<div class="run-meta"><span class="${r.success ? "ok" : "bad"}">${r.success ? "✓ berhasil" : "✗ gagal"}</span><span>via ${esc(r.via ?? "")}</span></div>${parts.join("")}`;
}

function colorDiag(text) {
  return esc(text)
    .split("\n")
    .map((l) =>
      l
        .replace(/^(error(\[E\d+\])?)(:.*)$/, '<span class="d-err">$1</span><span class="d-b">$3</span>')
        .replace(/^(warning(\[[\w-]+\])?)(:.*)$/, '<span class="d-warn">$1</span><span class="d-b">$3</span>')
        .replace(/^(\s*-->)(.*)$/, '<span class="d-arrow">$1</span>$2')
        .replace(/^(\s*\d*\s*\|)/, '<span class="d-arrow">$1</span>')
        .replace(/(\^[\^~]*)(.*)$/, '<span class="d-err">$1$2</span>')
        .replace(/^(\s*=\s*)(help|note)(:)/, '<span class="d-arrow">$1</span><span class="d-help">$2</span>$3')
        .replace(/^(help|note)(:)/, '<span class="d-help">$1</span>$2')
        .replace(/^(thread '.*' panicked.*)$/, '<span class="d-err">$1</span>'),
    )
    .join("\n");
}

function compareBlock(b) {
  const el = document.createElement("div");
  el.className = "compare";
  el.innerHTML = `
    <div class="cmp-side cmp-js">
      <div class="cmp-label"><span class="lang lang-js">JS</span>${esc(b.jsTitle ?? "JavaScript")}</div>
      <pre><code>${highlight(b.js.trim(), "js")}</code></pre>
    </div>
    <div class="cmp-side cmp-rs">
      <div class="cmp-label"><span class="lang lang-rs">RS</span>${esc(b.rustTitle ?? "Rust")}</div>
      <pre><code>${highlight(b.rust.trim())}</code></pre>
    </div>
    ${b.note ? `<div class="cmp-note">${inline(b.note)}</div>` : ""}`;
  return el;
}

function quizBlock(b, key) {
  const el = document.createElement("div");
  el.className = "quiz";
  const saved = store.data.quiz[key];
  el.innerHTML = `
    <div class="quiz-tag">${b.kind === "compile" ? "Apakah ini lolos kompiler?" : "Cek pemahaman"}</div>
    <div class="quiz-q">${inline(b.q)}</div>
    ${b.code ? `<pre class="quiz-code"><code>${highlight(b.code.trim())}</code></pre>` : ""}
    <div class="quiz-opts" role="group"></div>
    <div class="quiz-explain" hidden></div>`;
  const opts = el.querySelector(".quiz-opts");
  const exp = el.querySelector(".quiz-explain");
  b.options.forEach((o, i) => {
    const btn = document.createElement("button");
    btn.className = "opt";
    btn.innerHTML = `<span class="opt-key">${String.fromCharCode(65 + i)}</span><span>${inline(o)}</span>`;
    btn.onclick = () => choose(i, true);
    opts.append(btn);
  });
  function choose(i, fresh) {
    const correct = i === b.answer;
    [...opts.children].forEach((btn, k) => {
      btn.classList.toggle("right", k === b.answer && correct);
      btn.classList.toggle("wrong", k === i && !correct);
      btn.classList.toggle("picked", k === i);
    });
    exp.hidden = false;
    exp.className = `quiz-explain ${correct ? "ok" : "bad"}`;
    exp.innerHTML = `<b>${correct ? "Benar." : "Belum tepat, coba lagi."}</b> ${correct ? inline(b.explain) : b.wrongHint ? inline(b.wrongHint) : ""}`;
    if (fresh) {
      const prev = store.data.quiz[key];
      store.data.quiz[key] = { pick: i, correct: correct || !!prev?.correct };
      store.save();
      paintXp();
      if (correct && !prev?.correct) floatXp(el, XP.quiz);
    }
  }
  if (saved && saved.correct) choose(b.answer, false);
  return el;
}

function challengeBlock(b, key) {
  const el = document.createElement("div");
  el.className = "challenge";
  const solved = !!store.data.challenge[key];
  el.innerHTML = `
    <div class="ch-head">
      <span class="ch-tag">Tantangan</span>
      <h4>${esc(b.title)}</h4>
      <span class="ch-state ${solved ? "on" : ""}">${solved ? "✓ selesai" : `+${XP.challenge} XP`}</span>
    </div>
    <div class="ch-task">${blockText(b.task)}</div>`;
  const cb = codeBlock({ code: b.code, title: "tantangan.rs" }, key);
  el.append(cb.el);
  const runBtn = cb.el.querySelector('[data-act="run"]');
  if (runBtn) runBtn.textContent = "▶ Periksa";
  // Ganti handler run: jalankan lalu cocokkan output.
  const check = async () => {
    runBtn.disabled = true;
    runBtn.textContent = "Memeriksa…";
    cb.out.hidden = false;
    cb.out.innerHTML = `<div class="run-wait"><i></i>Mengompilasi…</div>`;
    const r = await runRust(cb.editor.value);
    runBtn.disabled = false;
    runBtn.textContent = "▶ Periksa";
    let verdict = "";
    if (!r.offline) {
      const pass = r.success && b.expect.every((x) => r.stdout.includes(x));
      verdict = pass
        ? `<div class="ch-verdict ok">✓ Lulus! Output sesuai harapan.</div>`
        : `<div class="ch-verdict bad">${r.success ? "Program berjalan, tetapi output belum sesuai. Diharapkan memuat: " + b.expect.map((x) => `<code>${esc(x)}</code>`).join(", ") : "Kode belum lolos kompiler. Baca pesan error di bawah, kompiler biasanya memberi petunjuk."}</div>`;
      if (pass && !store.data.challenge[key]) {
        store.data.challenge[key] = true;
        store.save();
        paintXp();
        floatXp(el, XP.challenge);
        const st = el.querySelector(".ch-state");
        st.classList.add("on");
        st.textContent = "✓ selesai";
      }
    }
    cb.out.innerHTML = verdict + renderRunResult(r, cb.editor.value);
  };
  if (runBtn) {
    runBtn.onclick = check;
  }
  cb.editor.textarea.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.stopImmediatePropagation();
        e.preventDefault();
        check();
      }
    },
    true,
  );
  const foot = document.createElement("div");
  foot.className = "ch-foot";
  foot.innerHTML = `
    <details><summary>Petunjuk</summary><div>${blockText(b.hint)}</div></details>
    <details><summary>Lihat solusi</summary><pre><code>${highlight(b.solution.trim())}</code></pre>
      <button class="mini" data-act="use">Pakai solusi di editor</button></details>`;
  foot.querySelector('[data-act="use"]').onclick = () => {
    cb.editor.value = b.solution.trim();
    store.data.drafts[key] = cb.editor.value;
    store.save();
  };
  el.append(foot);
  return el;
}

function floatXp(anchor, n) {
  const f = document.createElement("span");
  f.className = "xp-float";
  f.textContent = `+${n} XP`;
  anchor.append(f);
  setTimeout(() => f.remove(), 1400);
}

function diagBlock(b) {
  const el = document.createElement("div");
  el.className = "diag-card";
  el.innerHTML = `<div class="diag-bar"><span>$ cargo build</span>${b.title ? `<em>${esc(b.title)}</em>` : ""}</div><pre class="diag">${colorDiag(b.text.replace(/^\n/, "").trimEnd())}</pre>${b.note ? `<div class="code-note">${inline(b.note)}</div>` : ""}`;
  return el;
}

function tableBlock(b) {
  const el = document.createElement("div");
  el.className = "table-wrap";
  el.innerHTML = `<table><thead><tr>${b.head.map((h) => `<th>${inline(h)}</th>`).join("")}</tr></thead><tbody>${b.rows
    .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
  return el;
}

function renderBlock(b, key) {
  switch (b.t) {
    case "p": {
      const d = document.createElement("div");
      d.className = "prose";
      d.innerHTML = blockText(b.text);
      return d;
    }
    case "h": {
      const h = document.createElement("h2");
      h.className = "sec-h";
      h.id = key;
      h.innerHTML = inline(b.text);
      return h;
    }
    case "code":
      return codeBlock(b, key).el;
    case "compare":
      return compareBlock(b);
    case "tip":
    case "warn":
    case "js": {
      const d = document.createElement("aside");
      d.className = `callout c-${b.t}`;
      const label = { tip: "Tips", warn: "Hati-hati", js: "Dari sisi JavaScript" }[b.t];
      d.innerHTML = `<span class="c-label">${label}</span><div>${blockText(b.text)}</div>`;
      return d;
    }
    case "diag":
      return diagBlock(b);
    case "quiz":
      return quizBlock(b, key);
    case "challenge":
      return challengeBlock(b, key);
    case "table":
      return tableBlock(b);
    case "viz": {
      const make = { memory: memoryViz, borrow: borrowLab, scope: scopeViz, iter: iterViz, int: intViz }[b.kind];
      return make(b);
    }
  }
  const d = document.createElement("div");
  d.textContent = `[blok tidak dikenal: ${b.t}]`;
  return d;
}

// ---------- Halaman ----------
function renderLesson(lesson) {
  const idx = LESSONS.indexOf(lesson);
  const mod = MODULES.find((m) => m.id === lesson.module);
  const prev = LESSONS[idx - 1];
  const next = LESSONS[idx + 1];
  const done = !!store.data.done[lesson.id];
  main.innerHTML = `
    <article class="lesson">
      <header class="lesson-head">
        <div class="crumbs"><span class="lvl lvl-${mod.level}">${mod.levelLabel}</span><span>${esc(mod.title)}</span><span>·</span><span>Pelajaran ${idx + 1} dari ${LESSONS.length}</span></div>
        <h1>${esc(lesson.title)}</h1>
        <p class="lede">${inline(lesson.summary)}</p>
        <div class="lesson-meta">
          <span>± ${lesson.minutes} menit</span>
          ${lesson.goals ? `<span>Anda akan bisa: ${lesson.goals.map(inline).join(" · ")}</span>` : ""}
        </div>
      </header>
      <div class="lesson-body"></div>
      <footer class="lesson-foot">
        <button class="btn ${done ? "btn-ghost" : "btn-primary"} btn-done">${done ? "✓ Sudah selesai" : `Tandai selesai · +${XP.lesson} XP`}</button>
        <div class="pager">
          ${prev ? `<a class="pg-link" href="#${prev.id}"><small>← Sebelumnya</small>${esc(prev.title)}</a>` : "<span></span>"}
          ${next ? `<a class="pg-link pg-next" href="#${next.id}"><small>Berikutnya →</small>${esc(next.title)}</a>` : `<a class="pg-link pg-next" href="#home"><small>Selesai →</small>Kembali ke Peta Belajar</a>`}
        </div>
      </footer>
    </article>`;
  const body = main.querySelector(".lesson-body");
  lesson.blocks.forEach((b, k) => body.append(renderBlock(b, `${lesson.id}:${k}`)));
  const doneBtn = main.querySelector(".btn-done");
  doneBtn.onclick = () => {
    if (store.data.done[lesson.id]) {
      delete store.data.done[lesson.id];
    } else {
      store.data.done[lesson.id] = Date.now();
      floatXp(doneBtn.parentElement, XP.lesson);
    }
    store.save();
    const d = !!store.data.done[lesson.id];
    doneBtn.className = `btn ${d ? "btn-ghost" : "btn-primary"} btn-done`;
    doneBtn.textContent = d ? "✓ Sudah selesai" : `Tandai selesai · +${XP.lesson} XP`;
    renderSidebar(lesson.id);
  };
  renderSidebar(lesson.id);
}

const HERO_BAD = `let nama = String::from("Ferris");
let salinan = nama;
println!("Halo, {nama}!");`;
const HERO_GOOD = `let nama = String::from("Ferris");
let salinan = nama.clone();
println!("Halo, {nama}!");`;

function renderHome() {
  const done = store.data.done;
  const nextLesson = LESSONS.find((l) => !done[l.id]) ?? LESSONS[0];
  const started = Object.keys(done).length > 0;
  main.innerHTML = `
    <section class="hero">
      <div class="hero-text">
        <p class="eyebrow">Kurikulum Rust untuk developer JavaScript</p>
        <h1>Kompiler Rust akan sering menolak kode Anda. <span>Di situlah Anda belajar.</span></h1>
        <p class="lede">${LESSONS.length} pelajaran interaktif dari <code>let</code> sampai <code>unsafe</code>. Setiap konsep dibandingkan dengan JavaScript yang sudah Anda kenal, lalu dicoba langsung dengan kompiler sungguhan.</p>
        <div class="hero-cta">
          <a class="btn btn-primary btn-lg" href="#${nextLesson.id}">${started ? "Lanjutkan" : "Mulai belajar"}: ${esc(nextLesson.title)} →</a>
          <a class="btn btn-ghost btn-lg" href="#cheatsheet">Kamus JS → Rust</a>
        </div>
      </div>
      <div class="hero-demo" aria-label="Contoh pesan error kompiler Rust">
        <div class="diag-bar"><span>src/main.rs</span><em class="hero-state">ditolak</em></div>
        <pre class="hero-code"><code></code></pre>
        <pre class="diag hero-diag"></pre>
        <button class="btn btn-run hero-fix">Terapkan saran kompiler</button>
      </div>
    </section>

    <section class="home-sec">
      <div class="sec-intro">
        <h2>Peta belajar</h2>
        <p>Urutannya disusun supaya setiap modul memakai konsep dari modul sebelumnya. Ownership adalah gerbang utamanya; setelah lewat sana, sisanya akan terasa jauh lebih masuk akal.</p>
      </div>
      <ol class="track">
        ${MODULES.map((m, mi) => {
          const ls = LESSONS.filter((l) => l.module === m.id);
          const d = ls.filter((l) => done[l.id]).length;
          const pct = Math.round((d / ls.length) * 100);
          return `<li class="station ${d === ls.length ? "complete" : d ? "partial" : ""}">
            <div class="st-marker"><span>${mi + 1}</span></div>
            <div class="st-card">
              <div class="st-top"><span class="lvl lvl-${m.level}">${m.levelLabel}</span><span class="st-pct">${pct}%</span></div>
              <h3>${esc(m.title)}</h3>
              <p>${inline(m.blurb)}</p>
              <div class="st-lessons">${ls.map((l) => `<a href="#${l.id}" class="${done[l.id] ? "done" : ""}">${done[l.id] ? "✓ " : ""}${esc(l.title)}</a>`).join("")}</div>
            </div>
          </li>`;
        }).join("")}
      </ol>
    </section>

    <section class="home-sec home-grid">
      <div class="feat"><h3>Kode yang benar-benar jalan</h3><p>Setiap contoh bisa diedit dan dikompilasi. Saat server lokal punya <code>rustc</code>, kode dikompilasi di komputer Anda; jika tidak, lewat Rust Playground.</p></div>
      <div class="feat"><h3>Lihat memori bergerak</h3><p>Stack, heap, move, dan borrow digambar langkah demi langkah. Ada juga lab borrow checker untuk bereksperimen dengan aturan peminjaman.</p></div>
      <div class="feat"><h3>Selalu dibandingkan dengan JS</h3><p>Promise vs Future, <code>null</code> vs <code>Option</code>, <code>try/catch</code> vs <code>Result</code>. Anda belajar dari apa yang sudah dikuasai.</p></div>
    </section>`;

  // Demo hero: error E0382 lalu perbaikan dengan .clone()
  const codeEl = main.querySelector(".hero-code code");
  const diagEl = main.querySelector(".hero-diag");
  const state = main.querySelector(".hero-state");
  const fix = main.querySelector(".hero-fix");
  let fixed = false;
  const paint = () => {
    codeEl.innerHTML = highlight(fixed ? HERO_GOOD : HERO_BAD);
    state.textContent = fixed ? "lolos" : "ditolak";
    state.className = `hero-state ${fixed ? "ok" : "bad"}`;
    diagEl.innerHTML = fixed
      ? `<span class="d-ok">   Compiling oxide-lab v0.1.0\n    Finished dev [unoptimized]</span>\n     Running \`target/debug/oxide-lab\`\nHalo, Ferris!`
      : colorDiag(`error[E0382]: borrow of moved value: \`nama\`
 --> src/main.rs:3:17
  |
1 | let nama = String::from("Ferris");
  |     ---- move occurs because \`nama\` has type \`String\`
2 | let salinan = nama;
  |               ---- value moved here
3 | println!("Halo, {nama}!");
  |                 ^^^^^^ value borrowed here after move
  |
help: consider cloning the value
  |
2 | let salinan = nama.clone();
  |                   ++++++++`);
    fix.textContent = fixed ? "↺ Kembalikan error" : "Terapkan saran kompiler";
  };
  fix.onclick = () => {
    fixed = !fixed;
    paint();
  };
  paint();
  renderSidebar(null);
}

function renderCheatsheet() {
  main.innerHTML = `
    <article class="lesson cheat">
      <header class="lesson-head">
        <div class="crumbs"><span>Referensi</span></div>
        <h1>Kamus JS → Rust</h1>
        <p class="lede">Padanan cepat untuk pola yang sering Anda tulis di JavaScript. Padanan ini tidak selalu satu banding satu; tautan di kolom kanan membawa Anda ke pelajaran yang menjelaskan bedanya.</p>
      </header>
      <div class="cheat-groups"></div>
    </article>`;
  const wrap = main.querySelector(".cheat-groups");
  for (const g of CHEATSHEET) {
    const sec = document.createElement("section");
    sec.className = "cheat-sec";
    sec.innerHTML = `<h2 class="sec-h">${esc(g.group)}</h2>
      <div class="table-wrap"><table class="cheat-table"><thead><tr><th>JavaScript</th><th>Rust</th><th>Catatan</th></tr></thead><tbody>
      ${g.rows
        .map(
          (r) => `<tr><td><code class="hl">${highlight(r[0], "js")}</code></td><td><code class="hl">${highlight(r[1])}</code></td><td>${inline(r[2])}${r[3] ? ` <a href="#${r[3]}">Pelajari →</a>` : ""}</td></tr>`,
        )
        .join("")}
      </tbody></table></div>`;
    wrap.append(sec);
  }
  renderSidebar(null);
}

function route() {
  const id = location.hash.slice(1) || "home";
  app.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("on", a.dataset.nav === id));
  const lesson = LESSONS.find((l) => l.id === id);
  if (lesson) renderLesson(lesson);
  else if (id === "cheatsheet") renderCheatsheet();
  else renderHome();
  main.scrollTop = 0;
  window.scrollTo(0, 0);
  setMenu(false);
}
window.addEventListener("hashchange", route);
route();
