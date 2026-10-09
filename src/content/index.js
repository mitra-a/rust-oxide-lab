import pondasi from "./pondasi.js";
import ownership from "./ownership.js";
import data from "./data.js";
import error from "./error.js";
import abstraksi from "./abstraksi.js";
import lanjut from "./lanjut.js";

export const MODULES = [
  {
    id: "pondasi",
    title: "Pondasi",
    level: 1,
    levelLabel: "Pemula",
    blurb: "Sintaks dasar, tipe data, fungsi, dan alur kontrol. Banyak yang mirip JavaScript, tapi `let` di sini berarti tidak bisa diubah dan angka punya ukuran pasti.",
  },
  {
    id: "ownership",
    title: "Ownership",
    level: 1,
    levelLabel: "Pemula",
    blurb: "Konsep yang membuat Rust unik: pemilik, move, borrow, dan slice. Bagian ini paling menantang, sekaligus paling penting.",
  },
  {
    id: "data",
    title: "Memodelkan Data",
    level: 2,
    levelLabel: "Menengah",
    blurb: "Struct, enum dengan data, pattern matching, `Option` sebagai pengganti `null`, dan koleksi standar.",
  },
  {
    id: "error",
    title: "Error Handling",
    level: 2,
    levelLabel: "Menengah",
    blurb: "`Result`, operator `?`, dan tipe error sendiri. Tidak ada lagi exception yang tidak terlihat di signature.",
  },
  {
    id: "abstraksi",
    title: "Abstraksi",
    level: 2,
    levelLabel: "Menengah",
    blurb: "Traits, generics, lifetimes, closures, iterators, serta cara mengorganisasi dan menguji proyek dengan Cargo.",
  },
  {
    id: "lanjut",
    title: "Lanjutan",
    level: 3,
    levelLabel: "Lanjut",
    blurb: "Smart pointer, thread, async/await, trait tingkat lanjut, macro, `unsafe`, dan proyek akhir yang menyatukan semuanya.",
  },
];

export const LESSONS = [...pondasi, ...ownership, ...data, ...error, ...abstraksi, ...lanjut];

export const CHEATSHEET = [
  {
    group: "Variabel & tipe",
    rows: [
      ["const x = 1;", "let x = 1;", "immutable secara default", "variabel"],
      ["let x = 1; x++;", "let mut x = 1; x += 1;", "tidak ada `++`", "variabel"],
      ["const MAX = 10;", "const MAX: u32 = 10;", "tipe wajib ditulis", "variabel"],
      ["typeof x", "std::any::type_name_of_val(&x)", "jarang dibutuhkan, tipe diketahui saat kompilasi", "tipe-data"],
      ["Number(\"42\")", "\"42\".parse::<i32>()", "mengembalikan `Result`", "result"],
      ["String(42)", "42.to_string()", "atau `format!(\"{}\", 42)`", "tipe-data"],
      ["x ?? 0", "x.unwrap_or(0)", "untuk `Option`", "option"],
      ["obj?.a?.b", "obj.and_then(|o| o.a).map(|a| a.b)", "atau operator `?` di fungsi yang mengembalikan `Option`", "option"],
    ],
  },
  {
    group: "String",
    rows: [
      ["`Halo ${nama}`", "format!(\"Halo {nama}\")", "menghasilkan `String`", "slices"],
      ["s.length", "s.len()", "dalam **byte**; pakai `s.chars().count()` untuk karakter", "slices"],
      ["s.toUpperCase()", "s.to_uppercase()", "", null],
      ["s.split(\",\")", "s.split(',')", "menghasilkan iterator, bukan array", "iterators"],
      ["s.trim()", "s.trim()", "mengembalikan `&str` tanpa alokasi", "slices"],
      ["s.includes(\"x\")", "s.contains(\"x\")", "", null],
      ["s.slice(0, 3)", "&s[0..3]", "indeks byte, hati-hati dengan UTF-8", "slices"],
    ],
  },
  {
    group: "Array & objek",
    rows: [
      ["const a = [1, 2];", "let a = vec![1, 2];", "`Vec<i32>`", "koleksi"],
      ["a.push(3)", "a.push(3)", "butuh `let mut a`", "koleksi"],
      ["a.map(f)", "a.iter().map(f).collect::<Vec<_>>()", "lazy sampai `collect`", "iterators"],
      ["a.reduce((s, x) => s + x, 0)", "a.iter().sum::<i32>()", "atau `.fold(0, |s, x| s + x)`", "iterators"],
      ["a.find(f)", "a.iter().find(f)", "mengembalikan `Option<&T>`", "iterators"],
      ["const m = new Map();", "let mut m = HashMap::new();", "`use std::collections::HashMap`", "koleksi"],
      ["{ ...obj, a: 1 }", "Struk { a: 1, ..obj }", "struct update syntax", "struct"],
      ["const { a, b } = obj;", "let Struk { a, b, .. } = obj;", "destructuring juga di `match`", "enum-match"],
    ],
  },
  {
    group: "Fungsi & kontrol",
    rows: [
      ["function f(a) { return a * 2; }", "fn f(a: i32) -> i32 { a * 2 }", "ekspresi terakhir = nilai kembalian", "fungsi"],
      ["(x) => x + 1", "|x| x + 1", "closure", "closures"],
      ["c ? a : b", "if c { a } else { b }", "`if` adalah ekspresi", "kontrol"],
      ["switch (x) { ... }", "match x { ... }", "wajib lengkap", "enum-match"],
      ["for (let i = 0; i < n; i++)", "for i in 0..n", "", "kontrol"],
      ["while (true) { ... }", "loop { ... }", "`break nilai` mengembalikan nilai", "kontrol"],
    ],
  },
  {
    group: "Error & async",
    rows: [
      ["throw new Error(\"x\")", "return Err(\"x\".into());", "atau `panic!` untuk bug", "result"],
      ["try { f() } catch (e) {}", "match f() { Ok(v) => .., Err(e) => .. }", "", "result"],
      ["const v = await f(); // rethrow", "let v = f()?;", "`?` meneruskan error", "result"],
      ["async function f() {}", "async fn f() {}", "Future bersifat malas", "async"],
      ["await Promise.all([a, b])", "tokio::join!(a, b)", "", "async"],
      ["class A extends Error {}", "enum MyError { .. } + impl Display", "atau crate `thiserror`", "custom-error"],
    ],
  },
  {
    group: "Kelas & modul",
    rows: [
      ["class User { constructor() {} }", "struct User {} impl User { fn new() -> Self {..} }", "", "struct"],
      ["interface Shape { area(): number }", "trait Shape { fn area(&self) -> f64; }", "", "traits"],
      ["class C implements Shape", "impl Shape for C { .. }", "", "traits"],
      ["export function f() {}", "pub fn f() {}", "privat secara default", "modul"],
      ["import { f } from \"./m.js\";", "mod m; use m::f;", "", "modul"],
      ["npm install pkg", "cargo add pkg", "", "halo-rust"],
    ],
  },
];
