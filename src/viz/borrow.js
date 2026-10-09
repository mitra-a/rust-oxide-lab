// Lab Borrow Checker: susun urutan operasi pada `s` dan lihat apakah kompiler menerima.
// Mensimulasikan Non-Lexical Lifetimes (NLL): sebuah borrow hidup dari dibuat
// sampai pemakaian terakhirnya, bukan sampai akhir scope.
import { highlight, esc } from "../highlight.js";

const PRESETS = {
  "Banyak &T sekaligus": [
    { t: "borrow", ref: "r1", kind: "shared" },
    { t: "borrow", ref: "r2", kind: "shared" },
    { t: "use", ref: "r1" },
    { t: "use", ref: "r2" },
  ],
  "&mut saat &T masih dipakai": [
    { t: "borrow", ref: "r1", kind: "shared" },
    { t: "borrow", ref: "m1", kind: "mut" },
    { t: "use", ref: "m1" },
    { t: "use", ref: "r1" },
  ],
  "NLL: &T selesai lebih dulu": [
    { t: "borrow", ref: "r1", kind: "shared" },
    { t: "use", ref: "r1" },
    { t: "borrow", ref: "m1", kind: "mut" },
    { t: "use", ref: "m1" },
  ],
  "Dua &mut bersamaan": [
    { t: "borrow", ref: "m1", kind: "mut" },
    { t: "borrow", ref: "m2", kind: "mut" },
    { t: "use", ref: "m1" },
    { t: "use", ref: "m2" },
  ],
  "Ubah s saat dipinjam": [
    { t: "borrow", ref: "r1", kind: "shared" },
    { t: "write" },
    { t: "use", ref: "r1" },
  ],
};

function lineFor(op, refs) {
  switch (op.t) {
    case "borrow":
      return op.kind === "mut" ? `let ${op.ref} = &mut s;` : `let ${op.ref} = &s;`;
    case "use":
      return refs[op.ref] === "mut"
        ? `${op.ref}.push('!');`
        : `println!("{}", ${op.ref});`;
    case "read":
      return `println!("{}", s);`;
    case "write":
      return `s.push_str("?");`;
  }
}

export function analyze(ops) {
  const refs = {};
  const created = {};
  const lastUse = {};
  ops.forEach((op, j) => {
    if (op.t === "borrow") {
      refs[op.ref] = op.kind;
      created[op.ref] = j;
      lastUse[op.ref] = j;
    } else if (op.t === "use") lastUse[op.ref] = j;
  });
  // Aktif pada indeks j: dibuat sebelum j dan masih dipakai pada/ setelah j.
  const liveAt = (name, j) => created[name] < j && lastUse[name] >= j;
  const errors = [];
  ops.forEach((op, j) => {
    const others = Object.keys(refs).filter((n) => n !== op.ref && liveAt(n, j));
    let culprit = null;
    let code = null;
    let msg = null;
    if (op.t === "borrow" && op.kind === "mut" && others.length) {
      culprit = others[0];
      code = refs[culprit] === "mut" ? "E0499" : "E0502";
      msg =
        refs[culprit] === "mut"
          ? "cannot borrow `s` as mutable more than once at a time"
          : "cannot borrow `s` as mutable because it is also borrowed as immutable";
    } else if (op.t === "borrow" && op.kind === "shared") {
      culprit = others.find((n) => refs[n] === "mut");
      if (culprit) {
        code = "E0502";
        msg = "cannot borrow `s` as immutable because it is also borrowed as mutable";
      }
    } else if (op.t === "read") {
      culprit = others.find((n) => refs[n] === "mut");
      if (culprit) {
        code = "E0502";
        msg = "cannot borrow `s` as immutable because it is also borrowed as mutable";
      }
    } else if (op.t === "write" && others.length) {
      culprit = others[0];
      code = refs[culprit] === "mut" ? "E0499" : "E0502";
      msg =
        refs[culprit] === "mut"
          ? "cannot borrow `s` as mutable more than once at a time"
          : "cannot borrow `s` as mutable because it is also borrowed as immutable";
    }
    if (culprit) errors.push({ at: j, culprit, code, msg, firstAt: created[culprit], usedAt: lastUse[culprit] });
  });
  return { refs, created, lastUse, errors };
}

export function borrowLab() {
  const root = document.createElement("div");
  root.className = "viz viz-borrow";
  let ops = PRESETS["&mut saat &T masih dipakai"].slice();
  let counter = { shared: 1, mut: 1 };

  root.innerHTML = `
    <div class="viz-head">
      <span class="viz-tag">Lab</span>
      <span class="viz-title">Borrow Checker</span>
      <div class="viz-legend">
        <span><i class="lg lg-ref"></i>&amp;T hidup</span>
        <span><i class="lg lg-mut"></i>&amp;mut T hidup</span>
      </div>
    </div>
    <div class="bl-presets" role="group" aria-label="Skenario contoh"></div>
    <div class="bl-table"></div>
    <div class="bl-verdict" aria-live="polite"></div>
    <div class="bl-tools">
      <div class="bl-group"><span>Pinjam</span>
        <button class="chip" data-add="shared">+ let r = &amp;s</button>
        <button class="chip" data-add="mut">+ let m = &amp;mut s</button>
      </div>
      <div class="bl-group"><span>Pakai</span><span class="bl-uses"></span></div>
      <div class="bl-group"><span>Pemilik</span>
        <button class="chip" data-add="read">+ baca s</button>
        <button class="chip" data-add="write">+ ubah s</button>
      </div>
      <div class="bl-group">
        <button class="chip chip-quiet" data-act="undo">Hapus baris terakhir</button>
        <button class="chip chip-quiet" data-act="clear">Kosongkan</button>
      </div>
    </div>`;

  const presets = root.querySelector(".bl-presets");
  for (const name of Object.keys(PRESETS)) {
    const b = document.createElement("button");
    b.className = "chip chip-preset";
    b.textContent = name;
    b.onclick = () => {
      ops = PRESETS[name].map((o) => ({ ...o }));
      syncCounters();
      render();
    };
    presets.append(b);
  }

  function syncCounters() {
    counter = { shared: 1, mut: 1 };
    for (const o of ops) {
      if (o.t !== "borrow") continue;
      const n = Number(o.ref.slice(1));
      counter[o.kind] = Math.max(counter[o.kind], n + 1);
    }
  }
  syncCounters();

  root.querySelectorAll("[data-add]").forEach((b) => {
    b.onclick = () => {
      const k = b.dataset.add;
      if (k === "shared" || k === "mut") {
        const name = (k === "mut" ? "m" : "r") + counter[k]++;
        ops.push({ t: "borrow", ref: name, kind: k });
      } else ops.push({ t: k });
      render();
    };
  });
  root.querySelector('[data-act="undo"]').onclick = () => {
    ops.pop();
    syncCounters();
    render();
  };
  root.querySelector('[data-act="clear"]').onclick = () => {
    ops = [];
    syncCounters();
    render();
  };

  function render() {
    const a = analyze(ops);
    const names = Object.keys(a.refs);
    const errRows = new Map(a.errors.map((e) => [e.at, e]));
    const full = ["let mut s = String::from(\"hi\");", ...ops.map((o) => lineFor(o, a.refs))];
    let html = `<div class="bl-row bl-header" style="--lanes:${names.length}">
      <span></span><span>kode</span>${names.map((n) => `<span class="lane-h k-${a.refs[n]}">${n}</span>`).join("")}</div>`;
    full.forEach((line, idx) => {
      const j = idx - 1;
      const err = errRows.get(j);
      html += `<div class="bl-row${err ? " err" : ""}" style="--lanes:${names.length}">
        <span class="bl-ln">${idx + 1}</span>
        <code class="bl-code">${highlight(line)}</code>
        ${names
          .map((n) => {
            const c = a.created[n];
            const u = a.lastUse[n];
            if (j < c || j > u || j < 0) return `<span class="lane"></span>`;
            const pos = j === c && j === u ? "solo" : j === c ? "start" : j === u ? "end" : "mid";
            return `<span class="lane"><i class="bar k-${a.refs[n]} ${pos}${err && err.culprit === n ? " hot" : ""}"></i></span>`;
          })
          .join("")}
      </div>`;
    });
    root.querySelector(".bl-table").innerHTML = html;

    const v = root.querySelector(".bl-verdict");
    if (!a.errors.length) {
      v.className = "bl-verdict ok";
      v.innerHTML = `<span class="diag-ok">✓ Compiling playground … Finished</span>
        <p>Kode diterima. ${ops.length ? "Setiap saat hanya ada <b>banyak &amp;T</b> atau <b>satu &amp;mut T</b>, tidak keduanya." : "Tambahkan operasi di bawah untuk mulai bereksperimen."}</p>`;
    } else {
      const e = a.errors[0];
      v.className = "bl-verdict bad";
      const kindWord = a.refs[e.culprit] === "mut" ? "mutable" : "immutable";
      v.innerHTML = `<pre class="diag"><span class="d-err">error[${e.code}]</span><span class="d-b">: ${esc(e.msg)}</span>
<span class="d-arrow"> --&gt;</span> src/main.rs:${e.at + 2}
<span class="d-arrow">  |</span>
<span class="d-arrow">${String(e.firstAt + 2).padStart(2)}|</span> ${esc(full[e.firstAt + 1])}
<span class="d-arrow">  |</span> <span class="d-note">-------- ${kindWord} borrow occurs here (${e.culprit})</span>
<span class="d-arrow">${String(e.at + 2).padStart(2)}|</span> ${esc(full[e.at + 1])}
<span class="d-arrow">  |</span> <span class="d-err">^^^^^^^^ konflik terjadi di sini</span>
<span class="d-arrow">${String(e.usedAt + 2).padStart(2)}|</span> ${esc(full[e.usedAt + 1])}
<span class="d-arrow">  |</span> <span class="d-note">-------- ${kindWord} borrow later used here</span></pre>
        <p>Pinjaman <code>${e.culprit}</code> masih hidup sampai baris ${e.usedAt + 2}. Pindahkan pemakaian <code>${e.culprit}</code> ke sebelum baris ${e.at + 2}, atau hapus salah satunya.</p>`;
    }

    const uses = root.querySelector(".bl-uses");
    uses.innerHTML = names.length
      ? names.map((n) => `<button class="chip k-${a.refs[n]}" data-use="${n}">+ pakai ${n}</button>`).join("")
      : `<em class="muted">buat pinjaman dulu</em>`;
    uses.querySelectorAll("[data-use]").forEach((b) => {
      b.onclick = () => {
        ops.push({ t: "use", ref: b.dataset.use });
        render();
      };
    });
  }
  render();
  return root;
}
