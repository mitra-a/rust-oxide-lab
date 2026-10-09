// Syntax highlighter ringan untuk Rust dan JavaScript.
// Mengembalikan HTML berisi <span class="t-*"> per token.

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const RUST_KW = new Set(
  "as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while".split(
    " ",
  ),
);
const RUST_PRIM = new Set(
  "i8 i16 i32 i64 i128 isize u8 u16 u32 u64 u128 usize f32 f64 bool char str".split(" "),
);
const JS_KW = new Set(
  "async await break case catch class const continue default delete do else export extends false finally for from function if import in instanceof let new null of return static super switch this throw true try typeof undefined var void while yield".split(
    " ",
  ),
);

const RUST_RE = new RegExp(
  [
    String.raw`(?<comment>\/\/[^\n]*|\/\*[\s\S]*?\*\/)`,
    String.raw`(?<string>b?r#*"[\s\S]*?"#*|b?"(?:\\[\s\S]|[^"\\])*")`,
    String.raw`(?<char>b?'(?:\\.|[^\\'])')`,
    String.raw`(?<lifetime>'[a-zA-Z_]\w*)`,
    String.raw`(?<attr>#!?\[[^\]]*\])`,
    String.raw`(?<number>\b\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?(?:[iuf](?:8|16|32|64|128|size))?\b|\b0x[\da-fA-F_]+\b|\b0b[01_]+\b)`,
    String.raw`(?<macro>\b[a-z_]\w*!)`,
    String.raw`(?<ident>\b[A-Za-z_]\w*\b)`,
  ].join("|"),
  "g",
);

const JS_RE = new RegExp(
  [
    String.raw`(?<comment>\/\/[^\n]*|\/\*[\s\S]*?\*\/)`,
    String.raw`(?<string>"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\x60(?:\\[\s\S]|[^\x60\\])*\x60)`,
    String.raw`(?<number>\b\d[\d_]*(?:\.\d+)?n?\b)`,
    String.raw`(?<ident>\b[A-Za-z_$][\w$]*\b)`,
  ].join("|"),
  "g",
);

export function highlight(code, lang = "rust") {
  const re = lang === "js" || lang === "ts" ? JS_RE : RUST_RE;
  const isRust = re === RUST_RE;
  let out = "";
  let last = 0;
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index));
    last = re.lastIndex;
    const g = m.groups;
    const text = m[0];
    let cls = null;
    if (g.comment) cls = "comment";
    else if (g.string) cls = "string";
    else if (g.char) cls = "string";
    else if (g.lifetime) cls = "lifetime";
    else if (g.attr) cls = "attr";
    else if (g.number) cls = "number";
    else if (g.macro) cls = "macro";
    else if (g.ident) {
      const next = code.slice(last).match(/^\s*(\(|::<)/);
      if (isRust && RUST_KW.has(text)) cls = "kw";
      else if (!isRust && JS_KW.has(text)) cls = "kw";
      else if (isRust && RUST_PRIM.has(text)) cls = "type";
      else if (/^[A-Z]/.test(text)) cls = "type";
      else if (next) cls = "fn";
    }
    out += cls ? `<span class="t-${cls}">${esc(text)}</span>` : esc(text);
  }
  out += esc(code.slice(last));
  return out;
}

export { esc };
