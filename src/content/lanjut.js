export default [
  {
    id: "smart-pointer",
    module: "lanjut",
    title: "Smart Pointer: Box, Rc, RefCell",
    minutes: 22,
    summary:
      "Saat aturan \"satu pemilik\" terlalu ketat: `Box` untuk data di heap, `Rc` untuk banyak pemilik, `RefCell` untuk mutasi yang dicek saat runtime.",
    goals: ["memilih smart pointer yang tepat", "membaca reference count", "memahami interior mutability"],
    blocks: [
      {
        t: "table",
        head: ["Tipe", "Fungsi", "Padanan mental di JS"],
        rows: [
          ["`Box<T>`", "satu pemilik, data di heap", "objek biasa"],
          ["`Rc<T>`", "banyak pemilik, hanya baca, satu thread", "beberapa variabel menunjuk objek yang sama"],
          ["`RefCell<T>`", "mutasi lewat `&T`, aturan borrow dicek runtime", "objek yang bisa diubah dari mana saja"],
          ["`Rc<RefCell<T>>`", "banyak pemilik **dan** bisa diubah", "objek JS pada umumnya"],
          ["`Arc<Mutex<T>>`", "versi aman untuk banyak thread", "SharedArrayBuffer + Atomics"],
          ["`Weak<T>`", "referensi tanpa kepemilikan", "`WeakRef`"],
        ],
      },
      { t: "h", text: "Box: tipe rekursif dan trait object" },
      {
        t: "code",
        code: `// Tanpa Box, ukuran Daftar tidak terhingga: Daftar berisi Daftar berisi Daftar...
#[derive(Debug)]
enum Daftar {
    Isi(i32, Box<Daftar>),
    Kosong,
}

use Daftar::{Isi, Kosong};

fn jumlah(d: &Daftar) -> i32 {
    match d {
        Isi(n, sisa) => n + jumlah(sisa),
        Kosong => 0,
    }
}

fn main() {
    let d = Isi(1, Box::new(Isi(2, Box::new(Isi(3, Box::new(Kosong))))));
    println!("{:?}", d);
    println!("jumlah = {}", jumlah(&d));

    let besar = Box::new([0u8; 1024]); // 1 KB di heap, hanya pointer di stack
    println!("ukuran Box di stack: {} byte", std::mem::size_of_val(&besar));
}`,
      },
      { t: "h", text: "Rc: banyak pemilik" },
      {
        t: "viz",
        kind: "memory",
        title: "Reference counting",
        code: `let a = Rc::new(vec![1, 2, 3]);
let b = Rc::clone(&a);
{ let c = Rc::clone(&a); }
drop(b);
// akhir scope: a di-drop`,
        steps: [
          {
            line: 1,
            stack: [{ name: "a", type: "Rc<Vec>", value: "ptr", ptr: "h1" }],
            heap: [{ id: "h1", label: "RcBox", rc: 1, cells: ["1", "2", "3"] }],
            note: "`Rc::new` menaruh nilai di heap bersama sebuah penghitung. Satu pemilik: `strong = 1`.",
          },
          {
            line: 2,
            stack: [
              { name: "a", type: "Rc<Vec>", value: "ptr", ptr: "h1" },
              { name: "b", type: "Rc<Vec>", value: "ptr", ptr: "h1" },
            ],
            heap: [{ id: "h1", label: "RcBox", rc: 2, cells: ["1", "2", "3"] }],
            note: "`Rc::clone` **tidak** menyalin vector. Ia hanya menambah penghitung dan mengembalikan pointer baru. Murah.",
          },
          {
            line: 3,
            stack: [
              { name: "a", type: "Rc<Vec>", value: "ptr", ptr: "h1" },
              { name: "b", type: "Rc<Vec>", value: "ptr", ptr: "h1" },
              { name: "c", type: "Rc<Vec>", value: "ptr", ptr: "h1" },
            ],
            heap: [{ id: "h1", label: "RcBox", rc: 3, cells: ["1", "2", "3"] }],
            note: "Tiga pemilik di dalam blok.",
          },
          {
            line: 3,
            stack: [
              { name: "a", type: "Rc<Vec>", value: "ptr", ptr: "h1" },
              { name: "b", type: "Rc<Vec>", value: "ptr", ptr: "h1" },
              { name: "c", type: "Rc<Vec>", value: "ptr", state: "dropped" },
            ],
            heap: [{ id: "h1", label: "RcBox", rc: 2, cells: ["1", "2", "3"] }],
            note: "Di akhir blok, `c` di-drop dan penghitung turun ke 2. Data tetap ada.",
          },
          {
            line: 4,
            stack: [
              { name: "a", type: "Rc<Vec>", value: "ptr", ptr: "h1" },
              { name: "b", type: "Rc<Vec>", value: "ptr", state: "dropped" },
              { name: "c", type: "Rc<Vec>", value: "ptr", state: "dropped" },
            ],
            heap: [{ id: "h1", label: "RcBox", rc: 1, cells: ["1", "2", "3"] }],
            note: "`drop(b)` melepas kepemilikan lebih awal.",
          },
          {
            line: 5,
            stack: [
              { name: "a", type: "Rc<Vec>", value: "ptr", state: "dropped" },
              { name: "b", type: "Rc<Vec>", value: "ptr", state: "dropped" },
              { name: "c", type: "Rc<Vec>", value: "ptr", state: "dropped" },
            ],
            heap: [{ id: "h1", label: "RcBox", rc: 0, cells: ["1", "2", "3"], state: "freed" },
            ],
            note: "Penghitung mencapai 0, jadi vector dibebaskan. Mirip GC, tetapi deterministik dan tanpa jeda. Hati-hati: dua `Rc` yang saling menunjuk tidak akan pernah mencapai 0. Putus siklusnya dengan `Weak`.",
          },
        ],
      },
      { t: "h", text: "RefCell: interior mutability" },
      {
        t: "code",
        code: `use std::cell::RefCell;
use std::rc::Rc;

#[derive(Debug)]
struct Akun {
    nama: String,
    saldo: i64,
}

fn main() {
    // Satu akun dipegang dua "pemilik": aplikasi dan riwayat
    let akun = Rc::new(RefCell::new(Akun { nama: "Joko".into(), saldo: 100 }));
    let aplikasi = Rc::clone(&akun);
    let riwayat = Rc::clone(&akun);

    aplikasi.borrow_mut().saldo += 50;   // pinjam tulis, dicek saat runtime
    riwayat.borrow_mut().saldo -= 30;

    println!("{:?}", akun.borrow());
    println!("jumlah pemilik: {}", Rc::strong_count(&akun));

    // Melanggar aturan borrow saat runtime menghasilkan panic, bukan error kompilasi
    let baca = akun.borrow();
    let coba = akun.try_borrow_mut();
    println!("bisa pinjam tulis saat dibaca? {}", coba.is_ok());
    drop(baca);
}`,
        note: "`RefCell` memindahkan pengecekan borrow dari waktu kompilasi ke runtime. `try_borrow_mut` mengembalikan `Err` alih-alih panic. Gunakan seperlunya; jika desain bisa diubah agar cukup memakai `&mut`, itu lebih baik.",
      },
      {
        t: "quiz",
        q: "Anda membangun graf di mana banyak node menunjuk node yang sama, dan node bisa diubah. Dalam satu thread, tipe apa yang cocok untuk tepi graf?",
        options: ["`Box<Node>`", "`&mut Node`", "`Rc<RefCell<Node>>`", "`Arc<Node>`"],
        answer: 2,
        explain: "`Rc` memberi banyak pemilik dan `RefCell` memberi mutasi. Untuk referensi balik (misalnya anak ke induk), pakai `Weak` agar tidak terjadi siklus.",
      },
    ],
  },

  {
    id: "concurrency",
    module: "lanjut",
    title: "Concurrency Tanpa Takut",
    minutes: 22,
    summary:
      "JavaScript punya satu thread dan event loop. Rust memberi Anda thread sungguhan, dan sistem tipe mencegah data race sejak kompilasi.",
    goals: ["menjalankan thread", "mengirim pesan lewat channel", "berbagi state dengan `Arc<Mutex<T>>`"],
    blocks: [
      {
        t: "p",
        text: `Di Node, paralelisme sejati butuh Worker Threads dan pertukaran data lewat \`postMessage\`. Di Rust, thread adalah thread OS biasa yang berbagi memori. Bahayanya data race, yaitu dua thread menulis data yang sama secara bersamaan. Rust mencegahnya lewat dua trait penanda:

- **Send**: nilai boleh dipindah ke thread lain.
- **Sync**: nilai boleh dirujuk dari banyak thread sekaligus.

\`Rc\` tidak \`Send\`, sehingga mencoba mengirimnya ke thread lain adalah error kompilasi. Versi aman untuk thread adalah \`Arc\` (atomic reference count).`,
      },
      {
        t: "code",
        code: `use std::sync::{mpsc, Arc, Mutex};
use std::thread;
use std::time::Duration;

fn main() {
    // 1. Spawn thread dan tunggu hasilnya
    let handle = thread::spawn(|| {
        let total: u64 = (1..=1_000_000).sum();
        total
    });
    println!("jumlah 1..1jt = {}", handle.join().unwrap());

    // 2. Channel: kirim pesan antar-thread (mirip postMessage)
    let (tx, rx) = mpsc::channel();
    for id in 0..3 {
        let tx = tx.clone();
        thread::spawn(move || {
            thread::sleep(Duration::from_millis(10 * (3 - id)));
            tx.send(format!("pekerja {id} selesai")).unwrap();
        });
    }
    drop(tx); // tutup pengirim asli agar loop di bawah bisa berakhir
    for pesan in rx {
        println!("{pesan}");
    }

    // 3. State bersama: Arc untuk berbagi, Mutex untuk akses bergantian
    let hitung = Arc::new(Mutex::new(0));
    let mut handles = vec![];
    for _ in 0..8 {
        let hitung = Arc::clone(&hitung);
        handles.push(thread::spawn(move || {
            for _ in 0..1000 {
                *hitung.lock().unwrap() += 1;
            }
        }));
    }
    for h in handles {
        h.join().unwrap();
    }
    println!("hitungan akhir: {}", *hitung.lock().unwrap());

    // 4. Scoped thread: boleh meminjam data lokal tanpa Arc
    let data = vec![1, 2, 3, 4, 5, 6];
    let (kiri, kanan) = data.split_at(3);
    thread::scope(|s| {
        s.spawn(|| println!("kiri: {:?}", kiri.iter().sum::<i32>()));
        s.spawn(|| println!("kanan: {:?}", kanan.iter().sum::<i32>()));
    });
}`,
        note: "Urutan baris output pekerja bisa berbeda di setiap eksekusi. Itulah sifat thread. Hitungan akhir selalu 8000 karena `Mutex` menjamin hanya satu thread yang mengubah nilai pada satu waktu.",
      },
      {
        t: "diag",
        title: "mengirim Rc ke thread",
        text: `
error[E0277]: \`Rc<i32>\` cannot be sent between threads safely
   --> src/main.rs:6:24
    |
6   |       let h = thread::spawn(move || {
    |               ------------- ^------
    |               |             |
    |  _____________|_____________within this \`{closure@src/main.rs:6:27}\`
    | |             |
    | |             required by a bound introduced by this call
7   | |         println!("{}", data);
8   | |     });
    | |_____^ \`Rc<i32>\` cannot be sent between threads safely
    |
    = help: within \`{closure@src/main.rs:6:27}\`, the trait \`Send\` is not implemented for \`Rc<i32>\``,
        note: "Di bahasa lain, bug seperti ini baru ketahuan saat program crash secara acak di produksi. Rust menolaknya saat kompilasi.",
      },
      {
        t: "challenge",
        title: "Jumlah paralel",
        task: "Bagi pekerjaan menjumlahkan 1..=100 ke 4 thread. Setiap thread menambahkan hasil parsialnya ke `total` bersama. Output harus `Total: 5050`.",
        code: `use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let total = Arc::new(Mutex::new(0u32));
    let mut handles = Vec::new();

    for i in 0..4u32 {
        let total = Arc::clone(&total);
        handles.push(thread::spawn(move || {
            let mulai = i * 25 + 1;
            let akhir = mulai + 24;
            let parsial: u32 = (mulai..=akhir).sum();
            // tambahkan parsial ke total
        }));
    }

    for h in handles {
        h.join().unwrap();
    }
    println!("Total: {}", total.lock().unwrap());
}`,
        expect: ["Total: 5050"],
        hint: "Kunci mutex lalu tambahkan: `*total.lock().unwrap() += parsial;`",
        solution: `use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let total = Arc::new(Mutex::new(0u32));
    let mut handles = Vec::new();

    for i in 0..4u32 {
        let total = Arc::clone(&total);
        handles.push(thread::spawn(move || {
            let mulai = i * 25 + 1;
            let akhir = mulai + 24;
            let parsial: u32 = (mulai..=akhir).sum();
            *total.lock().unwrap() += parsial;
        }));
    }

    for h in handles {
        h.join().unwrap();
    }
    println!("Total: {}", total.lock().unwrap());
}`,
      },
    ],
  },

  {
    id: "async",
    module: "lanjut",
    title: "Async/Await",
    minutes: 20,
    summary:
      "Sintaksnya mirip JavaScript, tapi cara kerjanya berbeda: Future di Rust bersifat malas, dan runtime-nya (misalnya Tokio) Anda pilih sendiri.",
    goals: ["membedakan Future dan Promise", "menjalankan tugas bersamaan dengan Tokio"],
    blocks: [
      {
        t: "table",
        head: ["", "JavaScript Promise", "Rust Future"],
        rows: [
          ["Mulai dieksekusi", "langsung saat dibuat (*eager*)", "baru saat di-`.await` atau di-spawn (*lazy*)"],
          ["Runtime", "bawaan (event loop)", "pilih sendiri: Tokio, async-std, smol"],
          ["Menjalankan paralel", "`Promise.all([...])`", "`tokio::join!(a, b)` / `JoinSet`"],
          ["Balapan", "`Promise.race`", "`tokio::select!`"],
          ["Error", "`reject` + `try/catch`", "`Result` + `?`"],
          ["Pembatalan", "`AbortController`", "cukup drop Future-nya"],
        ],
      },
      {
        t: "compare",
        js: `async function ambil(id) {
  await sleep(100);
  return \`data-\${id}\`;
}

const p = ambil(1); // sudah berjalan!
const [a, b] = await Promise.all([ambil(2), ambil(3)]);`,
        rust: `async fn ambil(id: u32) -> String {
    sleep(Duration::from_millis(100)).await;
    format!("data-{id}")
}

let f = ambil(1); // belum berjalan sama sekali
let (a, b) = tokio::join!(ambil(2), ambil(3));`,
        note: "`.await` ditulis sebagai *postfix*, sehingga bisa dirangkai: `client.get(url).send().await?.json().await?`.",
      },
      {
        t: "code",
        title: "main.rs · memakai Tokio (via Rust Playground)",
        playground: true,
        code: `use std::time::{Duration, Instant};
use tokio::time::sleep;

async fn unduh(nama: &str, ms: u64) -> String {
    sleep(Duration::from_millis(ms)).await;
    format!("{nama} ({ms} ms)")
}

#[tokio::main]
async fn main() {
    let mulai = Instant::now();

    // Berurutan: total ~600 ms
    let a = unduh("profil", 200).await;
    let b = unduh("pesanan", 400).await;
    println!("berurutan: {a}, {b} -> {:?}", mulai.elapsed().as_millis() / 100 * 100);

    // Bersamaan: total ~400 ms (yang terlama)
    let mulai = Instant::now();
    let (a, b) = tokio::join!(unduh("profil", 200), unduh("pesanan", 400));
    println!("bersamaan: {a}, {b} -> {:?}", mulai.elapsed().as_millis() / 100 * 100);

    // Spawn tugas latar belakang, mirip menjalankan Promise tanpa await
    let tugas = tokio::spawn(async { unduh("notifikasi", 100).await });
    println!("hasil spawn: {}", tugas.await.unwrap());

    // select!: ambil yang pertama selesai, sisanya dibatalkan
    tokio::select! {
        v = unduh("server A", 300) => println!("menang: {v}"),
        v = unduh("server B", 150) => println!("menang: {v}"),
    }
}`,
        note: "Contoh ini butuh crate `tokio`, jadi tombol Jalankan selalu memakai Rust Playground yang sudah menyediakannya. Di proyek sendiri: `cargo add tokio --features full`.",
      },
      {
        t: "warn",
        text: "Jangan memanggil operasi yang memblokir (seperti `std::thread::sleep` atau I/O sinkron yang berat) di dalam fungsi async. Itu menahan seluruh worker thread runtime. Gunakan versi async-nya, atau `tokio::task::spawn_blocking`.",
      },
      {
        t: "quiz",
        q: "Apa yang terjadi pada `let f = kirim_email();` (fungsi async) jika `f` tidak pernah di-`.await`?",
        options: [
          "Email terkirim di latar belakang",
          "Tidak terjadi apa-apa, dan kompiler memberi peringatan bahwa Future tidak dipakai",
          "Program panic",
          "Email terkirim saat program selesai",
        ],
        answer: 1,
        explain: "Future di Rust malas. Tanpa `.await` atau `spawn`, kodenya tidak pernah berjalan. Inilah perbedaan terbesar dengan Promise.",
      },
    ],
  },

  {
    id: "trait-lanjut",
    module: "lanjut",
    title: "Trait Lanjutan",
    minutes: 18,
    summary:
      "Associated type, operator overloading, konversi `From`/`Into`, blanket implementation, dan supertrait. Pola-pola yang membuat API Rust terasa alami.",
    goals: ["meng-overload operator", "memakai associated type", "menulis blanket impl"],
    blocks: [
      {
        t: "code",
        code: `use std::fmt;
use std::ops::{Add, Mul};

#[derive(Debug, Clone, Copy, PartialEq, Default)]
struct Vektor {
    x: f64,
    y: f64,
}

// Operator overloading: v1 + v2
impl Add for Vektor {
    type Output = Vektor; // associated type
    fn add(self, o: Vektor) -> Vektor {
        Vektor { x: self.x + o.x, y: self.y + o.y }
    }
}

// v * 2.0
impl Mul<f64> for Vektor {
    type Output = Vektor;
    fn mul(self, k: f64) -> Vektor {
        Vektor { x: self.x * k, y: self.y * k }
    }
}

// From memberi Into secara gratis
impl From<(f64, f64)> for Vektor {
    fn from((x, y): (f64, f64)) -> Self {
        Vektor { x, y }
    }
}

impl fmt::Display for Vektor {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "⟨{}, {}⟩", self.x, self.y)
    }
}

// Supertrait: siapa pun yang Deskripsi wajib juga Display
trait Deskripsi: fmt::Display {
    fn deskripsi(&self) -> String {
        format!("objek {}", self)
    }
}

// Blanket impl: setiap tipe yang Display otomatis mendapat Deskripsi
impl<T: fmt::Display> Deskripsi for T {}

fn main() {
    let a = Vektor { x: 1.0, y: 2.0 };
    let b: Vektor = (3.0, 4.0).into();
    println!("{}", a + b);
    println!("{}", (a + b) * 2.0);
    println!("{:?}", Vektor::default());

    println!("{}", a.deskripsi());
    println!("{}", 42.deskripsi());      // i32 juga Display!
    println!("{}", "teks".deskripsi());
}`,
      },
      {
        t: "p",
        text: `**Associated type vs generic.** \`Iterator\` memakai \`type Item\` alih-alih \`Iterator<T>\` karena setiap tipe hanya punya satu jenis item. Generic dipakai saat satu tipe bisa mengimplementasikan trait berkali-kali dengan parameter berbeda, seperti \`Mul<f64>\` dan \`Mul<Vektor>\`.

**Orphan rule.** Anda hanya boleh menulis \`impl Trait for Tipe\` jika trait **atau** tipenya didefinisikan di crate Anda. Aturan ini mencegah dua library mengimplementasikan hal yang sama secara bertentangan. Solusi umumnya adalah pola *newtype*: \`struct Daftar(Vec<String>);\`.`,
      },
      {
        t: "quiz",
        q: "Setelah `impl From<(f64, f64)> for Vektor`, mengapa `let v: Vektor = (1.0, 2.0).into();` bisa dipakai?",
        options: [
          "Karena tuple selalu bisa dikonversi otomatis",
          "Karena library standar punya blanket impl: `From<T> for U` memberikan `Into<U> for T`",
          "Karena `#[derive(Default)]`",
          "Tidak bisa, harus `Vektor::from`",
        ],
        answer: 1,
        explain: "Itulah kekuatan blanket impl. Implementasikan `From`, maka `Into` didapat gratis.",
      },
    ],
  },

  {
    id: "macro",
    module: "lanjut",
    title: "Macro",
    minutes: 15,
    summary:
      "Kode yang menulis kode. Anda sudah memakai `println!` dan `vec!`. Sekarang buat macro sendiri dengan `macro_rules!`.",
    goals: ["membaca & menulis `macro_rules!`", "mengenal procedural macro"],
    blocks: [
      {
        t: "p",
        text: `Macro dikembangkan **saat kompilasi**, sebelum pemeriksaan tipe. Gunakan macro jika fungsi biasa tidak cukup: jumlah argumen bervariasi, membuat item seperti struct atau impl, atau DSL kecil. Jika fungsi biasa sudah cukup, pakai fungsi saja karena lebih mudah dibaca dan di-debug.`,
      },
      {
        t: "code",
        code: `use std::collections::HashMap;

// Macro deklaratif: mencocokkan pola token
macro_rules! peta {
    // $( ... ),* = ulangi pola dipisah koma; $(,)? = koma terakhir opsional
    ( $( $k:expr => $v:expr ),* $(,)? ) => {{
        let mut m = HashMap::new();
        $( m.insert($k, $v); )*
        m
    }};
}

// Macro dengan beberapa lengan, mirip match
macro_rules! maks {
    ($x:expr) => { $x };
    ($x:expr, $($sisa:expr),+) => {{
        let a = $x;
        let b = maks!($($sisa),+); // rekursif
        if a > b { a } else { b }
    }};
}

// Macro yang membuat struct beserta method
macro_rules! satuan {
    ($nama:ident, $simbol:literal) => {
        #[derive(Debug, Clone, Copy)]
        struct $nama(f64);
        impl $nama {
            fn tampil(&self) -> String {
                format!("{} {}", self.0, $simbol)
            }
        }
    };
}

satuan!(Meter, "m");
satuan!(Kilogram, "kg");

fn main() {
    let harga = peta! {
        "kopi" => 18_000,
        "teh" => 12_000,
    };
    println!("kopi: {:?}", harga.get("kopi"));

    println!("maks = {}", maks!(3, 17, 8, 12));
    println!("{} dan {}", Meter(4.5).tampil(), Kilogram(70.0).tampil());
}`,
      },
      {
        t: "table",
        head: ["Fragment", "Mencocokkan"],
        rows: [
          ["`$x:expr`", "ekspresi: `1 + 2`, `f(x)`"],
          ["`$n:ident`", "nama/identifier: `Meter`"],
          ["`$t:ty`", "tipe: `Vec<i32>`"],
          ["`$l:literal`", "literal: `\"m\"`, `42`"],
          ["`$b:block`", "blok kode `{ ... }`"],
          ["`$($x:expr),*`", "nol atau lebih, dipisah koma (`+` = satu atau lebih)"],
        ],
      },
      {
        t: "tip",
        text: "**Procedural macro** adalah fungsi Rust yang menerima dan menghasilkan token, dikompilasi di crate terpisah. Contoh yang sering Anda pakai: `#[derive(Serialize)]` dari serde, `#[tokio::main]`, dan `#[derive(Error)]` dari thiserror. Pakai `cargo expand` untuk melihat hasil pengembangan macro apa pun.",
      },
      {
        t: "challenge",
        title: "Macro kuadrat",
        task: "Tulis macro `kuadrat!` yang menerima satu ekspresi dan mengembalikan hasil kuadratnya. Output harus `49` lalu `25`. Perhatikan `kuadrat!(2 + 3)` harus menghasilkan 25, bukan 11.",
        code: `macro_rules! kuadrat {
    // tulis lengan macro di sini
}

fn main() {
    println!("{}", kuadrat!(7));
    println!("{}", kuadrat!(2 + 3));
}`,
        expect: ["49\n25"],
        hint: "`($x:expr) => {{ let v = $x; v * v }};`. Menyimpan ke variabel juga mencegah ekspresi dievaluasi dua kali.",
        solution: `macro_rules! kuadrat {
    ($x:expr) => {{
        let v = $x;
        v * v
    }};
}

fn main() {
    println!("{}", kuadrat!(7));
    println!("{}", kuadrat!(2 + 3));
}`,
      },
    ],
  },

  {
    id: "unsafe",
    module: "lanjut",
    title: "Unsafe & FFI",
    minutes: 14,
    summary:
      "Pintu darurat saat Anda tahu sesuatu yang tidak bisa dibuktikan kompiler. `unsafe` tidak mematikan borrow checker; ia hanya membuka lima kemampuan tambahan.",
    goals: ["mengetahui apa yang diizinkan `unsafe`", "membungkus `unsafe` dalam API aman"],
    blocks: [
      {
        t: "p",
        text: `Di dalam blok \`unsafe\`, Anda boleh:

- Dereferensi raw pointer \`*const T\` / \`*mut T\`.
- Memanggil fungsi \`unsafe\`, termasuk fungsi C lewat FFI.
- Mengakses atau mengubah variabel \`static mut\`.
- Mengimplementasikan trait \`unsafe\` seperti \`Send\` dan \`Sync\`.
- Mengakses field \`union\`.

Semua aturan lain tetap berlaku. Kata \`unsafe\` berarti: "saya, programmer, menjamin invarian di sini". Praktik terbaiknya adalah membungkus \`unsafe\` sekecil mungkin di balik fungsi aman, persis seperti yang dilakukan \`Vec\` dan \`String\` di library standar.`,
      },
      {
        t: "code",
        code: `// API aman yang dibangun di atas unsafe: membagi slice mutable menjadi dua
fn bagi_dua(xs: &mut [i32], tengah: usize) -> (&mut [i32], &mut [i32]) {
    let len = xs.len();
    assert!(tengah <= len); // invarian dijaga sebelum masuk unsafe
    let ptr = xs.as_mut_ptr();
    // Kompiler tidak bisa membuktikan dua bagian ini tidak tumpang tindih,
    // tetapi kita tahu pasti karena rentangnya [0, tengah) dan [tengah, len).
    unsafe {
        (
            std::slice::from_raw_parts_mut(ptr, tengah),
            std::slice::from_raw_parts_mut(ptr.add(tengah), len - tengah),
        )
    }
}

// FFI: memanggil fungsi dari library C standar
extern "C" {
    fn abs(x: i32) -> i32;
}

fn main() {
    let mut data = [1, 2, 3, 4, 5];
    let (kiri, kanan) = bagi_dua(&mut data, 2);
    kiri[0] = 100;
    kanan[0] = 300;
    println!("{:?}", data);

    // Raw pointer boleh dibuat di kode aman, tapi dereferensi butuh unsafe
    let x = 42;
    let p = &x as *const i32;
    println!("nilai lewat raw pointer: {}", unsafe { *p });

    println!("abs dari C: {}", unsafe { abs(-7) });
}`,
        note: "Library standar sudah menyediakan fungsi ini sebagai `slice::split_at_mut`. Untuk memeriksa kode unsafe Anda, jalankan tes dengan `cargo +nightly miri test`.",
      },
      {
        t: "quiz",
        q: "Manakah yang tetap **tidak** diizinkan meskipun berada di dalam blok `unsafe`?",
        options: [
          "Dereferensi raw pointer",
          "Memanggil fungsi C",
          "Memiliki dua `&mut` aktif ke variabel yang sama lewat referensi biasa",
          "Mengubah `static mut`",
        ],
        answer: 2,
        explain: "Borrow checker tetap bekerja untuk referensi biasa di dalam `unsafe`. Hanya raw pointer yang lolos dari pengecekannya.",
      },
    ],
  },

  {
    id: "proyek",
    module: "lanjut",
    title: "Proyek Akhir: Mesin Kasir",
    minutes: 30,
    summary:
      "Gabungkan semua yang sudah dipelajari: enum perintah, parsing dengan `Result`, trait, `HashMap`, dan iterator, dalam satu program utuh.",
    goals: ["merancang tipe data untuk domain", "menyatukan error handling", "memperluas program yang sudah ada"],
    blocks: [
      {
        t: "p",
        text: `Program di bawah membaca daftar perintah teks, seolah-olah dari input pengguna, lalu menjalankannya terhadap inventaris toko. Baca kodenya dari atas, lalu kerjakan tantangan di bagian bawah. Perhatikan bagaimana setiap konsep muncul:

- \`enum Perintah\` memodelkan input yang valid (*Enum & Match*).
- \`FromStr\` + \`Result\` + \`?\` untuk parsing (*Error Handling*).
- \`HashMap\` dan rantai iterator untuk laporan (*Koleksi*, *Iterators*).
- \`&mut self\` vs \`&self\` menjaga siapa yang boleh mengubah data (*Borrowing*).`,
      },
      {
        t: "code",
        title: "kasir.rs",
        code: `use std::collections::HashMap;
use std::fmt;
use std::str::FromStr;

#[derive(Debug)]
enum Perintah {
    Tambah { nama: String, harga: u32, stok: u32 },
    Jual { nama: String, jumlah: u32 },
    Laporan,
}

#[derive(Debug)]
enum ErrorKasir {
    PerintahTakDikenal(String),
    ArgumenKurang(&'static str),
    AngkaTidakValid(String),
    BarangTidakAda(String),
    StokKurang { nama: String, sisa: u32 },
}

impl fmt::Display for ErrorKasir {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Self::PerintahTakDikenal(p) => write!(f, "perintah '{p}' tidak dikenal"),
            Self::ArgumenKurang(p) => write!(f, "argumen kurang untuk '{p}'"),
            Self::AngkaTidakValid(s) => write!(f, "'{s}' bukan angka"),
            Self::BarangTidakAda(n) => write!(f, "barang '{n}' tidak ada"),
            Self::StokKurang { nama, sisa } => write!(f, "stok {nama} hanya {sisa}"),
        }
    }
}

fn angka(s: Option<&str>, perintah: &'static str) -> Result<u32, ErrorKasir> {
    let s = s.ok_or(ErrorKasir::ArgumenKurang(perintah))?;
    s.parse().map_err(|_| ErrorKasir::AngkaTidakValid(s.to_string()))
}

impl FromStr for Perintah {
    type Err = ErrorKasir;
    fn from_str(baris: &str) -> Result<Self, Self::Err> {
        let mut bagian = baris.split_whitespace();
        match bagian.next() {
            Some("tambah") => {
                let nama = bagian.next().ok_or(ErrorKasir::ArgumenKurang("tambah"))?.to_string();
                let harga = angka(bagian.next(), "tambah")?;
                let stok = angka(bagian.next(), "tambah")?;
                Ok(Perintah::Tambah { nama, harga, stok })
            }
            Some("jual") => {
                let nama = bagian.next().ok_or(ErrorKasir::ArgumenKurang("jual"))?.to_string();
                let jumlah = angka(bagian.next(), "jual")?;
                Ok(Perintah::Jual { nama, jumlah })
            }
            Some("laporan") => Ok(Perintah::Laporan),
            Some(lain) => Err(ErrorKasir::PerintahTakDikenal(lain.to_string())),
            None => Err(ErrorKasir::PerintahTakDikenal(String::new())),
        }
    }
}

struct Barang {
    harga: u32,
    stok: u32,
}

#[derive(Default)]
struct Toko {
    barang: HashMap<String, Barang>,
    omzet: u64,
}

impl Toko {
    fn jalankan(&mut self, p: Perintah) -> Result<String, ErrorKasir> {
        match p {
            Perintah::Tambah { nama, harga, stok } => {
                let b = self.barang.entry(nama.clone()).or_insert(Barang { harga, stok: 0 });
                b.stok += stok;
                b.harga = harga;
                Ok(format!("+ {nama}: stok {}", b.stok))
            }
            Perintah::Jual { nama, jumlah } => {
                let b = self
                    .barang
                    .get_mut(&nama)
                    .ok_or_else(|| ErrorKasir::BarangTidakAda(nama.clone()))?;
                if b.stok < jumlah {
                    return Err(ErrorKasir::StokKurang { nama, sisa: b.stok });
                }
                b.stok -= jumlah;
                let total = b.harga as u64 * jumlah as u64;
                self.omzet += total;
                Ok(format!("- {jumlah} {nama} = Rp{total}"))
            }
            Perintah::Laporan => Ok(self.laporan()),
        }
    }

    fn laporan(&self) -> String {
        let mut daftar: Vec<_> = self.barang.iter().collect();
        daftar.sort_by_key(|(nama, _)| nama.as_str());
        let baris: Vec<String> = daftar
            .iter()
            .map(|(nama, b)| format!("  {nama:<8} stok {:>3}  @Rp{}", b.stok, b.harga))
            .collect();
        format!("LAPORAN\\n{}\\n  omzet: Rp{}", baris.join("\\n"), self.omzet)
    }
}

fn main() {
    let input = "tambah kopi 18000 20
tambah roti 15000 5
jual kopi 3
jual roti 9
jual teh 1
beli kopi 2
jual kopi dua
laporan";

    let mut toko = Toko::default();
    for (i, baris) in input.lines().enumerate() {
        let hasil = baris.parse::<Perintah>().and_then(|p| toko.jalankan(p));
        match hasil {
            Ok(pesan) => println!("{pesan}"),
            Err(e) => println!("baris {}: error: {e}", i + 1),
        }
    }
}`,
      },
      {
        t: "challenge",
        title: "Tambahkan perintah restok & diskon",
        task: `Perluas mesin kasir dengan perintah \`diskon <nama> <persen>\` yang menurunkan harga barang. Contoh: \`diskon kopi 10\` mengubah harga kopi dari 18000 menjadi 16200, lalu mencetak \`% kopi: Rp16200\`.

Kode di bawah adalah versi ringkas dari mesin kasir. Tambahkan varian enum, parsing, dan penanganannya. Output harus memuat \`% kopi: Rp16200\` dan \`- 2 kopi = Rp32400\`.`,
        code: `use std::collections::HashMap;

enum Perintah {
    Jual { nama: String, jumlah: u32 },
    // tambahkan varian Diskon
}

fn parse(baris: &str) -> Result<Perintah, String> {
    let b: Vec<&str> = baris.split_whitespace().collect();
    match b.as_slice() {
        ["jual", nama, n] => Ok(Perintah::Jual {
            nama: nama.to_string(),
            jumlah: n.parse().map_err(|_| format!("'{n}' bukan angka"))?,
        }),
        // tambahkan pola ["diskon", nama, persen]
        _ => Err(format!("tidak dikenal: {baris}")),
    }
}

fn main() {
    let mut harga: HashMap<String, u32> = HashMap::from([("kopi".to_string(), 18000)]);
    for baris in ["diskon kopi 10", "jual kopi 2"] {
        match parse(baris) {
            Ok(Perintah::Jual { nama, jumlah }) => {
                let h = harga[&nama];
                println!("- {jumlah} {nama} = Rp{}", h * jumlah);
            }
            // tangani Perintah::Diskon di sini
            Err(e) => println!("error: {e}"),
        }
    }
}`,
        expect: ["% kopi: Rp16200", "- 2 kopi = Rp32400"],
        hint: `Langkahnya:

- Tambah varian \`Diskon { nama: String, persen: u32 }\`.
- Tambah lengan \`["diskon", nama, p] => Ok(Perintah::Diskon { ... })\` di \`parse\`.
- Di \`main\`, ambil \`harga.get_mut(&nama)\` lalu \`*h = *h * (100 - persen) / 100\`.`,
        solution: `use std::collections::HashMap;

enum Perintah {
    Jual { nama: String, jumlah: u32 },
    Diskon { nama: String, persen: u32 },
}

fn parse(baris: &str) -> Result<Perintah, String> {
    let b: Vec<&str> = baris.split_whitespace().collect();
    match b.as_slice() {
        ["jual", nama, n] => Ok(Perintah::Jual {
            nama: nama.to_string(),
            jumlah: n.parse().map_err(|_| format!("'{n}' bukan angka"))?,
        }),
        ["diskon", nama, p] => Ok(Perintah::Diskon {
            nama: nama.to_string(),
            persen: p.parse().map_err(|_| format!("'{p}' bukan angka"))?,
        }),
        _ => Err(format!("tidak dikenal: {baris}")),
    }
}

fn main() {
    let mut harga: HashMap<String, u32> = HashMap::from([("kopi".to_string(), 18000)]);
    for baris in ["diskon kopi 10", "jual kopi 2"] {
        match parse(baris) {
            Ok(Perintah::Jual { nama, jumlah }) => {
                let h = harga[&nama];
                println!("- {jumlah} {nama} = Rp{}", h * jumlah);
            }
            Ok(Perintah::Diskon { nama, persen }) => {
                if let Some(h) = harga.get_mut(&nama) {
                    *h = *h * (100 - persen) / 100;
                    println!("% {nama}: Rp{h}");
                }
            }
            Err(e) => println!("error: {e}"),
        }
    }
}`,
      },
      {
        t: "p",
        text: `**Selamat!** Anda sudah menempuh perjalanan dari \`let\` sampai \`unsafe\`. Langkah berikutnya:

- Baca [The Rust Programming Language](https://doc.rust-lang.org/book/) untuk pendalaman tiap topik.
- Latihan kecil di [Rustlings](https://github.com/rust-lang/rustlings) dan [Exercism Rust track](https://exercism.org/tracks/rust).
- Bangun sesuatu yang nyata: CLI dengan \`clap\`, web API dengan \`axum\`, atau WebAssembly dengan \`wasm-bindgen\` yang bisa langsung Anda panggil dari JavaScript.`,
      },
    ],
  },
];
