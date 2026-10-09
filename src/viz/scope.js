// Visualisasi lifetime: batang di samping kode menunjukkan berapa lama
// setiap nilai hidup dan berapa lama referensi dipakai.
import { highlight, esc } from "../highlight.js";
import { inline } from "../format.js";

/*
variants: [{
  label, code,
  bars: [{ label, from, to, kind: "own"|"ref"|"mut"|"bad" }],
  ok: boolean, verdict: string
}]
*/
export function scopeViz({ title, variants }) {
  const root = document.createElement("div");
  root.className = "viz viz-scope";
  root.innerHTML = `
    <div class="viz-head">
      <span class="viz-tag">Visualisasi</span>
      <span class="viz-title">${esc(title ?? "Lifetime")}</span>
    </div>
    <div class="sc-tabs" role="tablist"></div>
    <div class="sc-body"></div>
    <div class="sc-verdict" aria-live="polite"></div>`;
  const tabs = root.querySelector(".sc-tabs");
  variants.forEach((v, k) => {
    const b = document.createElement("button");
    b.className = "chip chip-preset";
    b.setAttribute("role", "tab");
    b.textContent = v.label;
    b.onclick = () => show(k);
    tabs.append(b);
  });

  function show(k) {
    const v = variants[k];
    [...tabs.children].forEach((b, n) => {
      b.classList.toggle("on", n === k);
      b.setAttribute("aria-selected", String(n === k));
    });
    const lines = highlight(v.code.trim()).split("\n");
    const lanes = v.bars.length;
    let html = `<div class="sc-row sc-header" style="--lanes:${lanes}"><span></span><span></span>${v.bars
      .map((b) => `<span class="lane-h k-${b.kind}">${esc(b.label)}</span>`)
      .join("")}</div>`;
    lines.forEach((l, n) => {
      const ln = n + 1;
      html += `<div class="sc-row" style="--lanes:${lanes}"><span class="bl-ln">${ln}</span><code class="bl-code">${l || " "}</code>${v.bars
        .map((b) => {
          if (ln < b.from || ln > b.to) return `<span class="lane"></span>`;
          const pos = b.from === b.to ? "solo" : ln === b.from ? "start" : ln === b.to ? "end" : "mid";
          return `<span class="lane"><i class="bar k-${b.kind} ${pos}"></i></span>`;
        })
        .join("")}</div>`;
    });
    root.querySelector(".sc-body").innerHTML = html;
    const vd = root.querySelector(".sc-verdict");
    vd.className = `sc-verdict ${v.ok ? "ok" : "bad"}`;
    vd.innerHTML = `<b>${v.ok ? "✓ Diterima kompiler" : "✗ Ditolak kompiler"}</b> ${inline(v.verdict)}`;
  }
  show(0);
  return root;
}
