# 🦀 Rust Oxide Lab

Aplikasi belajar Rust interaktif untuk developer JavaScript: 27 pelajaran dari pemula sampai lanjut,
dengan visualisasi memori, lab borrow checker, kuis, dan tantangan kode yang dikompilasi sungguhan.

## Prasyarat

- [Bun](https://bun.sh) (dikembangkan dengan Bun 1.2)
- Opsional: toolchain Rust via [rustup](https://rustup.rs) agar kode dijalankan secara lokal.
  Bila `rustc` belum punya toolchain default, jalankan sekali:

  ```bash
  rustup default stable
  ```

Tidak ada dependensi npm. Cukup clone repo lalu jalankan.

## Menjalankan

```bash
bun run dev      # http://127.0.0.1:4747 (auto-reload saat file berubah)
bun start        # sama, tanpa watch
bun run build    # dist/index.html: satu file statis, bisa dibuka langsung
bun run check    # kompilasi semua contoh & solusi lewat Rust Playground
```

Port bisa diganti: `PORT=5000 bun run dev`.

`bun run check` juga bisa difilter per pelajaran, misalnya `bun run check ownership` hanya memeriksa
pelajaran yang id-nya memuat "ownership". Skrip ini memastikan contoh kode lolos kompilasi, solusi
tantangan menghasilkan output yang diharapkan, dan kode awal tantangan memang belum lulus.

`bun run build` menghasilkan dua file:

| File                  | Isi                                                        |
| --------------------- | ---------------------------------------------------------- |
| `dist/index.html`     | dokumen HTML lengkap, bisa dibuka langsung di browser      |
| `dist/artifact.html`  | isi halaman tanpa `<html>`/`<head>`, untuk dipublikasikan  |

## Tempat kode dijalankan

1. **rustc lokal**: dipakai bila server lokal menemukan `rustc` (endpoint `/api/run`,
   edition 2021, batas waktu kompilasi 20 detik dan eksekusi 5 detik).
2. **Rust Playground** (play.rust-lang.org): dipakai otomatis bila rustc lokal tidak ada,
   dan selalu untuk contoh yang butuh crate eksternal (misalnya Tokio).
3. Jika keduanya tak terjangkau, tombol **Playground ↗** membuka kode di tab baru.

Status runner bisa dicek lewat `GET /api/health`.

## Kurikulum

| Modul              | Level    | Pelajaran                                                                                                      |
| ------------------ | -------- | -------------------------------------------------------------------------------------------------------------- |
| Pondasi            | Pemula   | Halo, Rust · Variabel & Mutabilitas · Tipe Data Dasar · Fungsi & Ekspresi · Alur Kontrol                       |
| Ownership          | Pemula   | Ownership & Move · Borrowing & Referensi · Slice: String vs &str                                               |
| Memodelkan Data    | Menengah | Struct & impl · Enum & Pattern Matching · Option: Selamat Tinggal null · Koleksi: Vec, String, HashMap         |
| Error Handling     | Menengah | Result & Operator ? · Tipe Error Sendiri                                                                       |
| Abstraksi          | Menengah | Traits · Generics · Lifetimes · Closures · Iterators · Modul, Crate & Testing                                  |
| Lanjutan           | Lanjut   | Smart Pointer · Concurrency Tanpa Takut · Async/Await · Trait Lanjutan · Macro · Unsafe & FFI · Proyek Akhir: Mesin Kasir |

Tersedia juga kamus/cheatsheet JS → Rust untuk padanan sintaks yang sering dipakai.

## Struktur

```
server.ts              server Bun: bundle on-the-fly + /api/run (rustc lokal) + /api/health
scripts/build.ts       build satu-file ke dist/
scripts/check-code.ts  verifikasi seluruh kode pelajaran lewat Rust Playground
src/shell.ts           membungkus bundle JS + CSS menjadi satu halaman HTML
src/main.js            shell aplikasi, routing, renderer blok
src/runner.js          menjalankan kode: rustc lokal -> Playground -> tautan manual
src/editor.js          editor kode ringan (textarea + highlight)
src/highlight.js       syntax highlighter Rust & JavaScript
src/format.js          format teks mini untuk konten (`kode`, **tebal**, *miring*, tautan)
src/styles.css         gaya aplikasi
src/content/*.js       kurikulum (6 modul) + kamus JS -> Rust
src/viz/*.js           visualisasi: memori, borrow lab, scope/lifetime, iterator, integer
```

## Menambah pelajaran

Pelajaran didefinisikan sebagai objek di `src/content/<modul>.js` lalu digabung di
`src/content/index.js`. Setelah menambah atau mengubah kode contoh, jalankan
`bun run check <id-pelajaran>` untuk memastikan semuanya masih terkompilasi.

## Penyimpanan

Progres, XP, dan draf kode tersimpan di `localStorage` browser, jadi tidak ada backend atau
database. Menghapus data situs di browser akan mereset progres.
