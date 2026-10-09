// Visualisasi Stack & Heap langkah demi langkah.
// Setiap langkah: baris kode aktif, isi stack, isi heap, dan catatan.
import { highlight, esc } from "../highlight.js";
import { inline } from "../format.js";

/*
step = {
  line: number (1-based),
  stack: [{ name, type?, value?, ptr?: heapId | "s:name", kind?: "own"|"ref"|"mut", state?: "live"|"moved"|"dropped" }],
  heap:  [{ id, label, cells?: string[], rc?: number, state?: "live"|"freed" }],
  note: string
}
*/
export function memoryViz({ title, code, steps }) {
  const root = document.createElement("div");
  root.className = "viz viz-memory";
  root.innerHTML = `
    <div class="viz-head">
      <span class="viz-tag">Visualisasi</span>
      <span class="viz-title">${esc(title ?? "Stack & Heap")}</span>
      <div class="viz-legend">
        <span><i class="lg lg-own"></i>pemilik</span>
        <span><i class="lg lg-ref"></i>&amp;T</span>
        <span><i class="lg lg-mut"></i>&amp;mut T</span>
      </div>
    </div>
    <div class="mem-grid">
      <pre class="mem-code"></pre>
      <div class="mem-board">
        <div class="mem-col"><div class="mem-label">Stack</div><div class="mem-stack"></div></div>
        <div class="mem-col"><div class="mem-label">Heap</div><div class="mem-heap"></div></div>
        <svg class="mem-arrows" aria-hidden="true"></svg>
      </div>
    </div>
    <div class="viz-note" aria-live="polite"></div>
    <div class="viz-controls">
      <button class="btn btn-ghost" data-act="prev" aria-label="Langkah sebelumnya">← Mundur</button>
      <div class="viz-dots"></div>
      <button class="btn btn-primary" data-act="next">Lanjut →</button>
    </div>`;

  const codeEl = root.querySelector(".mem-code");
  const stackEl = root.querySelector(".mem-stack");
  const heapEl = root.querySelector(".mem-heap");
  const svg = root.querySelector(".mem-arrows");
  const board = root.querySelector(".mem-board");
  const noteEl = root.querySelector(".viz-note");
  const dots = root.querySelector(".viz-dots");
  const lines = highlight(code.trim()).split("\n");
  let i = 0;

  steps.forEach((_, k) => {
    const d = document.createElement("button");
    d.className = "dot";
    d.setAttribute("aria-label", `Langkah ${k + 1}`);
    d.onclick = () => go(k);
    dots.append(d);
  });

  function go(k) {
    i = Math.max(0, Math.min(steps.length - 1, k));
    render();
  }

  root.querySelector('[data-act="prev"]').onclick = () => go(i - 1);
  root.querySelector('[data-act="next"]').onclick = () => go(i + 1 >= steps.length ? 0 : i + 1);

  function render() {
    const s = steps[i];
    codeEl.innerHTML = lines
      .map(
        (l, n) =>
          `<span class="ln${n + 1 === s.line ? " active" : ""}${n + 1 < s.line ? " done" : ""}"><b>${n + 1}</b>${l || " "}</span>`,
      )
      .join("");
    stackEl.innerHTML = s.stack.length
      ? s.stack
          .map(
            (v) => `
        <div class="slot k-${v.kind ?? "own"} st-${v.state ?? "live"}" data-name="${esc(v.name)}">
          <span class="slot-name">${esc(v.name)}${v.type ? `<em>: ${esc(v.type)}</em>` : ""}</span>
          <span class="slot-val">${v.ptr ? '<i class="ptr-dot"></i>' : ""}${esc(v.value ?? "")}</span>
          ${v.badge || v.state === "moved" || v.state === "dropped" ? `<span class="slot-badge">${esc(v.badge ?? (v.state === "moved" ? "dipindah" : "drop"))}</span>` : ""}
        </div>`,
          )
          .join("")
      : '<div class="mem-empty">kosong</div>';
    heapEl.innerHTML = s.heap.length
      ? s.heap
          .map(
            (h) => `
        <div class="hcell st-${h.state ?? "live"}" data-id="${esc(h.id)}">
          <span class="h-label">${esc(h.label)}${h.rc != null ? `<em class="rc">strong = ${h.rc}</em>` : ""}</span>
          ${h.cells ? `<span class="h-cells">${h.cells.map((c) => `<i>${esc(c)}</i>`).join("")}</span>` : ""}
          ${h.state === "freed" ? '<span class="slot-badge">dibebaskan</span>' : ""}
        </div>`,
          )
          .join("")
      : '<div class="mem-empty">kosong</div>';
    noteEl.innerHTML = inline(s.note ?? "");
    [...dots.children].forEach((d, k) => d.classList.toggle("on", k === i));
    root.querySelector('[data-act="prev"]').disabled = i === 0;
    root.querySelector('[data-act="next"]').textContent =
      i === steps.length - 1 ? "↺ Ulangi" : "Lanjut →";
    requestAnimationFrame(drawArrows);
  }

  function drawArrows() {
    const s = steps[i];
    const b = board.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${b.width} ${b.height}`);
    svg.setAttribute("width", b.width);
    svg.setAttribute("height", b.height);
    let paths = `<defs>
      ${["own", "ref", "mut"]
        .map(
          (k) =>
            `<marker id="ah-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="ah ah-${k}"/></marker>`,
        )
        .join("")}</defs>`;
    for (const v of s.stack) {
      if (!v.ptr || v.state === "moved" || v.state === "dropped") continue;
      const from = stackEl.querySelector(`[data-name="${CSS.escape(v.name)}"] .ptr-dot`);
      const to = v.ptr.startsWith("s:")
        ? stackEl.querySelector(`[data-name="${CSS.escape(v.ptr.slice(2))}"]`)
        : heapEl.querySelector(`[data-id="${CSS.escape(v.ptr)}"]`);
      if (!from || !to) continue;
      const f = from.getBoundingClientRect();
      const t = to.getBoundingClientRect();
      const x1 = f.left + f.width / 2 - b.left;
      const y1 = f.top + f.height / 2 - b.top;
      const kind = v.kind ?? "own";
      let d;
      if (v.ptr.startsWith("s:")) {
        // Referensi ke slot stack lain: panah melengkung ke sisi kanan slot tujuan.
        const x2 = t.right - b.left + 2;
        const y2 = t.top + t.height / 2 - b.top;
        const out = Math.max(x1, x2) + 28;
        d = `M${x1},${y1} C${out},${y1} ${out},${y2} ${x2},${y2}`;
      } else {
        const x2 = t.left - b.left - 2;
        const y2 = t.top + Math.min(22, t.height / 2) - b.top;
        const mx = (x1 + x2) / 2;
        d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
      }
      paths += `<path d="${d}" class="arrow a-${kind}" marker-end="url(#ah-${kind})"/>`;
    }
    svg.innerHTML = paths;
  }

  const ro = new ResizeObserver(() => drawArrows());
  ro.observe(board);
  render();
  return root;
}
