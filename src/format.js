// Format teks mini untuk konten pelajaran:
//   `kode`  **tebal**  *miring*  [teks](https://url)
import { esc } from "./highlight.js";

export function inline(s) {
  const parts = String(s).split(/(`[^`]+`)/g);
  return parts
    .map((p) => {
      if (p.startsWith("`") && p.endsWith("`") && p.length > 1) {
        return `<code>${esc(p.slice(1, -1))}</code>`;
      }
      return esc(p)
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|[^*\w])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
        .replace(
          /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
          '<a href="$2" target="_blank" rel="noopener">$1</a>',
        );
    })
    .join("");
}

// Paragraf: baris kosong memisah paragraf, baris diawali "- " menjadi list.
export function blockText(s) {
  return String(s)
    .trim()
    .split(/\n\s*\n/)
    .map((para) => {
      const lines = para.split("\n").map((l) => l.trim());
      if (lines.every((l) => l.startsWith("- "))) {
        return `<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join("")}</ul>`;
      }
      return `<p>${inline(lines.join(" "))}</p>`;
    })
    .join("");
}
