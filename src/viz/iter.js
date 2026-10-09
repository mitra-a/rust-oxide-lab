// Iterator malas (Rust) vs array eager (JavaScript).
// Data yang sama melewati filter -> map -> ambil 2, lalu kita hitung kerja closure.
const DATA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const isEven = (x) => x % 2 === 0;
const sq = (x) => x * x;

function rustEvents() {
  const ev = [];
  const out = [];
  for (const x of DATA) {
    ev.push({ stage: 0, x, pass: isEven(x), label: `filter(${x})` });
    if (!isEven(x)) continue;
    ev.push({ stage: 1, x: sq(x), label: `map(${x}) = ${sq(x)}` });
    out.push(sq(x));
    ev.push({ stage: 2, x: sq(x), label: `take: ${out.length}/2` });
    if (out.length === 2) break;
  }
  return ev;
}

function jsEvents() {
  const ev = [];
  const f = [];
  for (const x of DATA) {
    ev.push({ stage: 0, x, pass: isEven(x), label: `filter(${x})` });
    if (isEven(x)) f.push(x);
  }
  const m = [];
  for (const x of f) {
    ev.push({ stage: 1, x: sq(x), label: `map(${x}) = ${sq(x)}` });
    m.push(sq(x));
  }
  m.slice(0, 2).forEach((x, k) => ev.push({ stage: 2, x, label: `slice: ${k + 1}/2` }));
  return ev;
}

export function iterViz() {
  const root = document.createElement("div");
  root.className = "viz viz-iter";
  let mode = "rust";
  let events = rustEvents();
  let i = 0;
  let timer = null;

  root.innerHTML = `
    <div class="viz-head">
      <span class="viz-tag">Visualisasi</span>
      <span class="viz-title">Iterator malas vs array eager</span>
    </div>
    <div class="it-tabs" role="tablist">
      <button class="chip chip-preset on" data-mode="rust">Rust: .iter().filter().map().take(2)</button>
      <button class="chip chip-preset" data-mode="js">JS: .filter().map().slice(0, 2)</button>
    </div>
    <div class="it-source"><span class="it-chip">sumber</span><span class="it-items"></span></div>
    <div class="it-stages">
      <div class="it-stage"><h5>filter(|x| x % 2 == 0)</h5><div class="it-out" data-s="0"></div></div>
      <div class="it-stage"><h5>map(|x| x * x)</h5><div class="it-out" data-s="1"></div></div>
      <div class="it-stage"><h5 class="it-take">take(2)</h5><div class="it-out" data-s="2"></div></div>
    </div>
    <div class="it-stats">
      <div><b class="it-n0">0</b><span>panggilan filter</span></div>
      <div><b class="it-n1">0</b><span>panggilan map</span></div>
      <div><b class="it-n2">0</b><span>array perantara</span></div>
    </div>
    <div class="viz-note it-note" aria-live="polite"></div>
    <div class="viz-controls">
      <button class="btn btn-ghost" data-act="reset">↺ Ulang</button>
      <button class="btn btn-ghost" data-act="step">Satu langkah</button>
      <button class="btn btn-primary" data-act="play">▶ Jalankan</button>
    </div>`;

  const q = (s) => root.querySelector(s);
  root.querySelectorAll("[data-mode]").forEach((b) => {
    b.onclick = () => {
      mode = b.dataset.mode;
      root.querySelectorAll("[data-mode]").forEach((x) => x.classList.toggle("on", x === b));
      q(".it-take").textContent = mode === "rust" ? "take(2)" : "slice(0, 2)";
      reset();
    };
  });

  function reset() {
    stop();
    events = mode === "rust" ? rustEvents() : jsEvents();
    i = 0;
    paint();
  }
  function stop() {
    clearInterval(timer);
    timer = null;
    q('[data-act="play"]').textContent = "▶ Jalankan";
  }
  function step() {
    if (i >= events.length) return stop();
    i++;
    paint();
    if (i >= events.length) stop();
  }
  q('[data-act="reset"]').onclick = reset;
  q('[data-act="step"]').onclick = () => {
    stop();
    step();
  };
  q('[data-act="play"]').onclick = () => {
    if (timer) return stop();
    if (i >= events.length) reset();
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    timer = setInterval(step, reduce ? 120 : 420);
    q('[data-act="play"]').textContent = "❚❚ Jeda";
  };

  function paint() {
    const done = events.slice(0, i);
    const cur = done[done.length - 1];
    const touched = new Set(done.filter((e) => e.stage === 0).map((e) => e.x));
    q(".it-items").innerHTML = DATA.map(
      (x) =>
        `<i class="${touched.has(x) ? "seen" : ""}${cur && cur.stage === 0 && cur.x === x ? " cur" : ""}">${x}</i>`,
    ).join("");
    for (let s = 0; s < 3; s++) {
      const items = done.filter((e) => e.stage === s);
      q(`[data-s="${s}"]`).innerHTML = items
        .map((e, k) => {
          const isCur = e === cur;
          if (s === 0) return `<i class="${e.pass ? "pass" : "drop"}${isCur ? " cur" : ""}">${e.x}</i>`;
          return `<i class="pass${isCur ? " cur" : ""}">${e.x}</i>`;
        })
        .join("");
    }
    q(".it-n0").textContent = done.filter((e) => e.stage === 0).length;
    q(".it-n1").textContent = done.filter((e) => e.stage === 1).length;
    const stageReached = Math.max(-1, ...done.map((e) => e.stage));
    q(".it-n2").textContent = mode === "rust" ? 0 : Math.max(0, Math.min(2, stageReached + 1));
    let note;
    if (!cur) {
      note =
        mode === "rust"
          ? "Iterator Rust bersifat **malas**: setiap elemen berjalan melewati seluruh rantai satu per satu. Tekan Jalankan."
          : "Method array JavaScript bersifat **eager**: setiap tahap memproses semua elemen dan membuat array baru. Tekan Jalankan.";
    } else if (i >= events.length) {
      note =
        mode === "rust"
          ? "Selesai setelah elemen ke-4. `take(2)` sudah penuh, jadi 6 elemen sisanya **tidak pernah disentuh**. Tidak ada array perantara."
          : "Selesai. Semua 10 elemen difilter dan 5 elemen di-map, padahal hanya 2 hasil yang dipakai. Dua array perantara dibuat.";
    } else note = `Langkah ${i}: \`${cur.label}\`${cur.stage === 0 ? (cur.pass ? " → lolos" : " → dibuang") : ""}`;
    q(".it-note").innerHTML = note
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  }
  paint();
  return root;
}
