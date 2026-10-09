// Editor kode sederhana: <textarea> transparan di atas <pre> yang diberi highlight.
import { highlight } from "./highlight.js";

export function createEditor(initial, { lang = "rust", onChange } = {}) {
  const wrap = document.createElement("div");
  wrap.className = "editor";
  const pre = document.createElement("pre");
  pre.className = "editor-hl";
  pre.setAttribute("aria-hidden", "true");
  const ta = document.createElement("textarea");
  ta.className = "editor-input";
  ta.spellcheck = false;
  ta.autocapitalize = "off";
  ta.autocomplete = "off";
  ta.setAttribute("aria-label", "Editor kode Rust");
  ta.value = initial;
  wrap.append(pre, ta);

  const render = () => {
    // Spasi ekstra agar baris kosong terakhir tetap punya tinggi.
    pre.innerHTML = highlight(ta.value, lang) + "\n ";
  };
  render();

  ta.addEventListener("input", () => {
    render();
    onChange?.(ta.value);
  });

  ta.addEventListener("keydown", (e) => {
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      insert("    ");
    } else if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) {
      const start = ta.selectionStart;
      const lineStart = ta.value.lastIndexOf("\n", start - 1) + 1;
      const indent = ta.value.slice(lineStart, start).match(/^\s*/)[0];
      const extra = /[{([]\s*$/.test(ta.value.slice(lineStart, start)) ? "    " : "";
      e.preventDefault();
      insert("\n" + indent + extra);
    }
  });

  function insert(text) {
    const { selectionStart: s, selectionEnd: en, value } = ta;
    ta.value = value.slice(0, s) + text + value.slice(en);
    ta.selectionStart = ta.selectionEnd = s + text.length;
    render();
    onChange?.(ta.value);
  }

  return {
    el: wrap,
    textarea: ta,
    get value() {
      return ta.value;
    },
    set value(v) {
      ta.value = v;
      render();
    },
  };
}
