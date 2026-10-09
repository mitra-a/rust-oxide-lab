// Membungkus bundle JS + CSS menjadi satu halaman HTML mandiri.
// `full: true` menghasilkan dokumen lengkap (untuk server lokal / dist),
// `full: false` hanya isi halaman (untuk dipublikasikan sebagai Artifact).

export async function bundle(): Promise<{ js: string; css: string }> {
  const result = await Bun.build({
    entrypoints: [new URL("./main.js", import.meta.url).pathname],
    target: "browser",
    minify: true,
  });
  if (!result.success) {
    throw new Error(result.logs.map((l) => String(l)).join("\n"));
  }
  const js = await result.outputs[0].text();
  const css = await Bun.file(new URL("./styles.css", import.meta.url).pathname).text();
  return { js, css };
}

const FONTS =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;600&display=swap";

export function renderPage({ js, css, full }: { js: string; css: string; full: boolean }) {
  const safeJs = js.replace(/<\/script/gi, "<\\/script");
  const body = `<title>Rust Oxide Lab</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<style>${css}</style>
<div id="app"></div>
<script>${safeJs}</script>`;
  if (!full) return body;
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
</head>
<body>
${body}
</body>
</html>`;
}
