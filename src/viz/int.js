// Penjelajah tipe integer: rentang, representasi bit, dan perilaku overflow.
const TYPES = {
  u8: { bits: 8, signed: false },
  i8: { bits: 8, signed: true },
  u16: { bits: 16, signed: false },
  i16: { bits: 16, signed: true },
  u32: { bits: 32, signed: false },
  i32: { bits: 32, signed: true },
};

const range = ({ bits, signed }) =>
  signed
    ? [-(1n << BigInt(bits - 1)), (1n << BigInt(bits - 1)) - 1n]
    : [0n, (1n << BigInt(bits)) - 1n];

function wrap(v, t) {
  const m = 1n << BigInt(t.bits);
  let r = ((v % m) + m) % m;
  if (t.signed && r >= m / 2n) r -= m;
  return r;
}

function bitsOf(v, t) {
  const m = 1n << BigInt(t.bits);
  return (((v % m) + m) % m).toString(2).padStart(t.bits, "0");
}

export function intViz() {
  const root = document.createElement("div");
  root.className = "viz viz-int";
  let type = "u8";
  let value = 250n;
  let delta = 10n;

  root.innerHTML = `
    <div class="viz-head">
      <span class="viz-tag">Eksperimen</span>
      <span class="viz-title">Integer punya ukuran pasti</span>
    </div>
    <div class="int-types" role="radiogroup" aria-label="Tipe integer"></div>
    <div class="int-main">
      <label class="int-field" for="int-val">nilai <code>x</code>
        <input id="int-val" type="number" inputmode="numeric">
      </label>
      <label class="int-field" for="int-delta">tambah
        <input id="int-delta" type="number" inputmode="numeric">
      </label>
      <div class="int-range"></div>
    </div>
    <div class="int-bits" aria-label="Representasi bit"></div>
    <div class="int-ops"></div>`;

  const types = root.querySelector(".int-types");
  for (const name of Object.keys(TYPES)) {
    const b = document.createElement("button");
    b.className = "chip chip-preset";
    b.textContent = name;
    b.setAttribute("role", "radio");
    b.onclick = () => {
      type = name;
      const [lo, hi] = range(TYPES[type]);
      if (value > hi) value = hi - 5n;
      if (value < lo) value = lo;
      render();
    };
    types.append(b);
  }
  const vIn = root.querySelector("#int-val");
  const dIn = root.querySelector("#int-delta");
  vIn.oninput = () => {
    try {
      value = BigInt(vIn.value || "0");
    } catch {}
    render(true);
  };
  dIn.oninput = () => {
    try {
      delta = BigInt(dIn.value || "0");
    } catch {}
    render(true);
  };

  function render(fromInput = false) {
    const t = TYPES[type];
    const [lo, hi] = range(t);
    [...types.children].forEach((b) => {
      b.classList.toggle("on", b.textContent === type);
      b.setAttribute("aria-checked", String(b.textContent === type));
    });
    if (!fromInput) {
      vIn.value = String(value);
      dIn.value = String(delta);
    }
    const inRange = value >= lo && value <= hi;
    root.querySelector(".int-range").innerHTML = `<span>rentang <code>${type}</code></span><b>${lo} … ${hi}</b>`;
    const shown = inRange ? value : wrap(value, t);
    root.querySelector(".int-bits").innerHTML = bitsOf(shown, t)
      .split("")
      .map(
        (bit, k) =>
          `<i class="b${bit}${t.signed && k === 0 ? " sign" : ""}${k % 8 === 0 && k ? " gap" : ""}">${bit}</i>`,
      )
      .join("");
    const sum = value + delta;
    const overflow = sum > hi || sum < lo;
    const ops = root.querySelector(".int-ops");
    if (!inRange) {
      ops.innerHTML = `<div class="int-op bad"><code>let x: ${type} = ${value};</code><span>error: literal out of range for \`${type}\`. Kompiler menolak sebelum program jalan.</span></div>`;
      return;
    }
    const sat = sum > hi ? hi : sum < lo ? lo : sum;
    ops.innerHTML = `
      <div class="int-op ${overflow ? "bad" : "ok"}"><code>x + ${delta}</code><span>${overflow ? "panic: attempt to add with overflow (mode debug)" : String(sum)}</span></div>
      <div class="int-op"><code>x.checked_add(${delta})</code><span>${overflow ? "None" : `Some(${sum})`}</span></div>
      <div class="int-op"><code>x.wrapping_add(${delta})</code><span>${wrap(sum, t)}</span></div>
      <div class="int-op"><code>x.saturating_add(${delta})</code><span>${sat}</span></div>
      <p class="int-js">Di JavaScript, <code>${value} + ${delta}</code> selalu <code>${sum}</code> karena semua angka adalah <code>f64</code>. Rust memaksa Anda memilih perilaku overflow secara eksplisit.</p>`;
  }
  render();
  return root;
}
