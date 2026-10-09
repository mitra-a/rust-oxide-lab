// Membuat versi statis satu-file:
//   dist/index.html     -> buka langsung di browser (runner memakai Rust Playground)
//   dist/artifact.html  -> isi halaman tanpa <html>/<head>, untuk dipublikasikan
import { bundle, renderPage } from "../src/shell.ts";

const { js, css } = await bundle();
await Bun.write("dist/index.html", renderPage({ js, css, full: true }));
await Bun.write("dist/artifact.html", renderPage({ js, css, full: false }));
const kb = (Bun.file("dist/index.html").size / 1024).toFixed(1);
console.log(`dist/index.html (${kb} KB) dan dist/artifact.html siap.`);
