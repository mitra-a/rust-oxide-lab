export default [
  {
    id: "struct",
    module: "data",
    title: "Struct & impl",
    minutes: 16,
    summary:
      "Struct adalah bentuk data bernama, mirip objek JS dengan bentuk yang dikunci. Perilakunya ditulis terpisah di blok `impl`.",
    goals: ["mendefinisikan struct", "menulis method & associated function", "memakai `#[derive]`"],
    blocks: [
      {
        t: "compare",
        js: `class Persegi {
  constructor(lebar, tinggi) {
    this.lebar = lebar;
    this.tinggi = tinggi;
  }
  luas() { return this.lebar * this.tinggi; }
  static kotak(sisi) { return new Persegi(sisi, sisi); }
}`,
        rust: `struct Persegi {
    lebar: u32,
    tinggi: u32,
}

impl Persegi {
    fn luas(&self) -> u32 { self.lebar * self.tinggi }
    fn kotak(sisi: u32) -> Self {
        Persegi { lebar: sisi, tinggi: sisi }
    }
}`,
        note: "Tidak ada `class`, `new`, maupun `this` implisit. Method menerima `self` secara eksplisit. Fungsi tanpa `self` (seperti `kotak`) dipanggil dengan `Persegi::kotak(3)`, setara dengan method `static`.",
      },
      {
        t: "table",
        head: ["Parameter pertama", "Arti", "Dipakai untuk"],
        rows: [
          ["`&self`", "pinjam baca", "getter, perhitungan"],
          ["`&mut self`", "pinjam tulis", "mengubah field"],
          ["`self`", "ambil kepemilikan", "mengubah ke bentuk lain, *builder*"],
          ["(tidak ada)", "associated function", "konstruktor seperti `new`"],
        ],
      },
      {
        t: "code",
        code: `#[derive(Debug, Clone, PartialEq)]
struct Akun {
    pemilik: String,
    saldo: i64,
    aktif: bool,
}

impl Akun {
    // Konvensi: konstruktor dinamai new
    fn new(pemilik: &str) -> Self {
        Self { pemilik: pemilik.to_string(), saldo: 0, aktif: true }
    }

    fn setor(&mut self, jumlah: i64) {
        self.saldo += jumlah;
    }

    fn ringkasan(&self) -> String {
        format!("{}: Rp{}", self.pemilik, self.saldo)
    }
}

fn main() {
    let mut akun = Akun::new("Sari");
    akun.setor(150_000);
    println!("{}", akun.ringkasan());

    // Struct update syntax, mirip { ...akun, pemilik: "Dewi" } di JS
    let kembar = Akun { pemilik: String::from("Dewi"), ..akun.clone() };
    println!("{:?}", kembar);
    println!("{:#?}", akun); // pretty print
    println!("sama? {}", akun == kembar);
}`,
        note: "`#[derive(Debug)]` membuat kompiler menulis implementasi trait untuk Anda. `Debug` memungkinkan `{:?}`, `Clone` memberi `.clone()`, `PartialEq` memberi `==`.",
      },
      {
        t: "tip",
        text: "Ada juga **tuple struct** `struct Meter(f64);` dan **unit struct** `struct Penanda;`. Tuple struct sering dipakai sebagai *newtype* agar `Meter` dan `Detik` tidak tertukar meskipun keduanya `f64`.",
      },
      {
        t: "quiz",
        q: "Method yang mengubah field struct harus menerima parameter apa?",
        options: ["`self`", "`&self`", "`&mut self`", "`mut self: &Self`"],
        answer: 2,
        explain: "`&mut self` meminjam struct secara mutable. Pemanggilnya juga harus memegang variabel `let mut`.",
      },
      {
        t: "challenge",
        title: "Counter",
        task: "Implementasikan method `naik` dan `reset` pada `Counter`. Output harus `3` lalu `0`.",
        code: `struct Counter {
    nilai: u32,
}

impl Counter {
    fn new() -> Self {
        Counter { nilai: 0 }
    }
    // tambahkan fn naik dan fn reset di sini
}

fn main() {
    let mut c = Counter::new();
    c.naik();
    c.naik();
    c.naik();
    println!("{}", c.nilai);
    c.reset();
    println!("{}", c.nilai);
}`,
        expect: ["3\n0"],
        hint: "Keduanya butuh `&mut self`. Contoh: `fn naik(&mut self) { self.nilai += 1; }`",
        solution: `struct Counter {
    nilai: u32,
}

impl Counter {
    fn new() -> Self {
        Counter { nilai: 0 }
    }
    fn naik(&mut self) {
        self.nilai += 1;
    }
    fn reset(&mut self) {
        self.nilai = 0;
    }
}

fn main() {
    let mut c = Counter::new();
    c.naik();
    c.naik();
    c.naik();
    println!("{}", c.nilai);
    c.reset();
    println!("{}", c.nilai);
}`,
      },
    ],
  },

  {
    id: "enum-match",
    module: "data",
    title: "Enum & Pattern Matching",
    minutes: 20,
    summary:
      "Enum Rust bisa membawa data di setiap variannya. Ditambah `match` yang wajib lengkap, ini menjadi alat paling ekspresif untuk memodelkan keadaan.",
    goals: ["mendefinisikan enum dengan data", "menulis `match` yang lengkap", "memakai `if let`"],
    blocks: [
      {
        t: "p",
        text: `Jika Anda pernah memakai TypeScript, enum Rust sama dengan *discriminated union*. Bedanya, di Rust kompiler **memaksa** Anda menangani setiap varian. Tambahkan varian baru, dan setiap \`match\` yang belum menanganinya akan error. Refactor jadi jauh lebih aman.`,
      },
      {
        t: "compare",
        jsTitle: "TypeScript",
        js: `type Bentuk =
  | { kind: "lingkaran"; r: number }
  | { kind: "persegi"; s: number };

function luas(b: Bentuk) {
  switch (b.kind) {
    case "lingkaran": return Math.PI * b.r ** 2;
    case "persegi": return b.s * b.s;
  }
}`,
        rust: `enum Bentuk {
    Lingkaran { r: f64 },
    Persegi(f64),
}

fn luas(b: &Bentuk) -> f64 {
    match b {
        Bentuk::Lingkaran { r } => std::f64::consts::PI * r * r,
        Bentuk::Persegi(s) => s * s,
    }
}`,
      },
      {
        t: "code",
        code: `#[derive(Debug)]
enum Status {
    Menunggu,
    Dikirim { kurir: String, resi: String },
    Diterima(u32), // hari pengiriman
    Dibatalkan(String),
}

fn jelaskan(s: &Status) -> String {
    match s {
        Status::Menunggu => "Pesanan sedang diproses".to_string(),
        Status::Dikirim { kurir, resi } => format!("Dikirim via {kurir}, resi {resi}"),
        // guard: kondisi tambahan dengan if
        Status::Diterima(hari) if *hari <= 2 => format!("Tiba kilat dalam {hari} hari"),
        Status::Diterima(hari) => format!("Tiba dalam {hari} hari"),
        Status::Dibatalkan(alasan) => format!("Batal: {alasan}"),
    }
}

fn main() {
    let daftar = vec![
        Status::Menunggu,
        Status::Dikirim { kurir: "JNE".into(), resi: "JX123".into() },
        Status::Diterima(1),
        Status::Diterima(5),
        Status::Dibatalkan("stok habis".into()),
    ];
    for s in &daftar {
        println!("{}", jelaskan(s));
    }

    // match juga bekerja untuk angka, range, dan tuple
    let titik = (0, 7);
    let posisi = match titik {
        (0, 0) => "pusat",
        (0, _) => "di sumbu Y",
        (_, 0) => "di sumbu X",
        _ => "di tempat lain",
    };
    println!("titik {:?} {posisi}", titik);

    // if let: saat hanya peduli satu pola
    if let Status::Dikirim { resi, .. } = &daftar[1] {
        println!("Lacak resi: {resi}");
    }
}`,
      },
      {
        t: "diag",
        title: "jika satu varian lupa ditangani",
        text: `
error[E0004]: non-exhaustive patterns: \`&Status::Dibatalkan(_)\` not covered
 --> src/main.rs:10:11
   |
10 |     match s {
   |           ^ pattern \`&Status::Dibatalkan(_)\` not covered
   |
help: ensure that all possible cases are being handled by adding a match arm with a wildcard pattern or an explicit pattern
   |
15 ~         Status::Diterima(hari) => format!("Tiba dalam {hari} hari"),
16 ~         &Status::Dibatalkan(_) => todo!(),
   |`,
      },
      {
        t: "quiz",
        q: "Apa fungsi pola `_` di dalam `match`?",
        options: [
          "Menandai variabel yang tidak boleh dipakai",
          "Mencocokkan nilai apa pun tanpa mengikatnya ke variabel",
          "Menghentikan pencocokan lebih awal",
          "Hanya mencocokkan nilai kosong `()`",
        ],
        answer: 1,
        explain: "`_` adalah wildcard, setara `default:` di `switch`. Letakkan di akhir karena lengan `match` dicek dari atas.",
      },
      {
        t: "challenge",
        title: "Lampu lalu lintas",
        task: "Lengkapi `match` di method `berikutnya` sehingga Merah → Hijau → Kuning → Merah. Output harus lima baris: `Merah`, `Hijau`, `Kuning`, `Merah`, `Hijau`.",
        code: `#[derive(Debug, Clone, Copy)]
enum Lampu {
    Merah,
    Kuning,
    Hijau,
}

impl Lampu {
    fn berikutnya(self) -> Lampu {
        match self {
            Lampu::Merah => Lampu::Hijau,
        }
    }
}

fn main() {
    let mut l = Lampu::Merah;
    for _ in 0..4 {
        println!("{:?}", l);
        l = l.berikutnya();
    }
    println!("{:?}", l);
}`,
        expect: ["Merah\nHijau\nKuning\nMerah\nHijau"],
        hint: "Tambahkan lengan `Lampu::Hijau => Lampu::Kuning` dan `Lampu::Kuning => Lampu::Merah`. Kompiler sudah memberi tahu varian mana yang belum ditangani.",
        solution: `#[derive(Debug, Clone, Copy)]
enum Lampu {
    Merah,
    Kuning,
    Hijau,
}

impl Lampu {
    fn berikutnya(self) -> Lampu {
        match self {
            Lampu::Merah => Lampu::Hijau,
            Lampu::Hijau => Lampu::Kuning,
            Lampu::Kuning => Lampu::Merah,
        }
    }
}

fn main() {
    let mut l = Lampu::Merah;
    for _ in 0..4 {
        println!("{:?}", l);
        l = l.berikutnya();
    }
    println!("{:?}", l);
}`,
      },
    ],
  },

  {
    id: "option",
    module: "data",
    title: "Option: Selamat Tinggal null",
    minutes: 14,
    summary:
      "Rust tidak punya `null` atau `undefined`. Ketiadaan nilai dimodelkan dengan `Option<T>`, dan kompiler memastikan Anda mengeceknya.",
    goals: ["memakai `Some` / `None`", "menggabungkan `Option` dengan method kombinator"],
    blocks: [
      {
        t: "p",
        text: `\`TypeError: Cannot read properties of undefined\` adalah salah satu error paling umum di JavaScript. Di Rust, nilai yang mungkin tidak ada bertipe \`Option<T>\`, yaitu enum biasa dengan dua varian: \`Some(T)\` dan \`None\`. Anda tidak bisa memakai \`Option<i32>\` seolah-olah \`i32\`; kompiler memaksa Anda membukanya terlebih dahulu.`,
      },
      {
        t: "compare",
        js: `const user = users.find(u => u.id === 7);
console.log(user.name); // bisa crash

// optional chaining & nullish coalescing
const kota = user?.alamat?.kota ?? "-";`,
        rust: `let user = users.iter().find(|u| u.id == 7);
// user.name -> error: user adalah Option<&User>

let kota = user
    .and_then(|u| u.alamat.as_ref())
    .map(|a| a.kota.as_str())
    .unwrap_or("-");`,
        note: "`?.` setara `and_then` / `map`, dan `??` setara `unwrap_or`. Bedanya, di Rust Anda **tidak bisa lupa**.",
      },
      {
        t: "code",
        code: `fn cari_harga(produk: &str) -> Option<u32> {
    match produk {
        "kopi" => Some(18_000),
        "teh" => Some(12_000),
        _ => None,
    }
}

fn main() {
    // 1. match
    match cari_harga("kopi") {
        Some(h) => println!("Kopi: Rp{h}"),
        None => println!("Tidak dijual"),
    }

    // 2. if let
    if let Some(h) = cari_harga("teh") {
        println!("Teh: Rp{h}");
    }

    // 3. kombinator
    let diskon = cari_harga("kopi").map(|h| h * 90 / 100);
    println!("Kopi diskon: {:?}", diskon);
    println!("Jus: Rp{}", cari_harga("jus").unwrap_or(0));

    // 4. let-else: keluar lebih awal jika None
    let Some(harga) = cari_harga("teh") else {
        println!("berhenti");
        return;
    };
    println!("Dua teh: Rp{}", harga * 2);

    // Method koleksi yang sering mengembalikan Option
    let angka = vec![4, 8, 15];
    println!("{:?} {:?} {:?}", angka.first(), angka.get(9), angka.iter().max());
}`,
      },
      {
        t: "warn",
        text: "`.unwrap()` dan `.expect(\"pesan\")` membuka `Option` dan akan **panic** bila nilainya `None`. Boleh dipakai di prototipe, tes, atau saat Anda yakin nilainya pasti ada. Di kode produksi, lebih baik tangani kasus `None`.",
      },
      {
        t: "quiz",
        q: "Apa hasil `Some(5).map(|x| x * 2).unwrap_or(0)`?",
        options: ["`Some(10)`", "`10`", "`0`", "`5`"],
        answer: 1,
        explain: "`map` mengubah `Some(5)` menjadi `Some(10)`, lalu `unwrap_or` membukanya menjadi `10`.",
      },
      {
        t: "challenge",
        title: "Nama panggilan",
        task: "Lengkapi `sapa` agar memakai nama panggilan jika ada, atau nama lengkap jika tidak. Output: `Halo, Budi!` lalu `Halo, Siti Aminah!`.",
        code: `struct Orang {
    nama: String,
    panggilan: Option<String>,
}

fn sapa(o: &Orang) -> String {
    let nama = todo!();
    format!("Halo, {nama}!")
}

fn main() {
    let a = Orang { nama: "Budi Santoso".into(), panggilan: Some("Budi".into()) };
    let b = Orang { nama: "Siti Aminah".into(), panggilan: None };
    println!("{}", sapa(&a));
    println!("{}", sapa(&b));
}`,
        expect: ["Halo, Budi!\nHalo, Siti Aminah!"],
        hint: "Pakai `o.panggilan.as_deref().unwrap_or(&o.nama)`. `as_deref` mengubah `&Option<String>` menjadi `Option<&str>`. Atau tulis dengan `match`.",
        solution: `struct Orang {
    nama: String,
    panggilan: Option<String>,
}

fn sapa(o: &Orang) -> String {
    let nama = o.panggilan.as_deref().unwrap_or(&o.nama);
    format!("Halo, {nama}!")
}

fn main() {
    let a = Orang { nama: "Budi Santoso".into(), panggilan: Some("Budi".into()) };
    let b = Orang { nama: "Siti Aminah".into(), panggilan: None };
    println!("{}", sapa(&a));
    println!("{}", sapa(&b));
}`,
      },
    ],
  },

  {
    id: "koleksi",
    module: "data",
    title: "Koleksi: Vec, String, HashMap",
    minutes: 18,
    summary:
      "Padanan `Array`, string builder, dan `Map` di JavaScript, ditambah aturan ownership yang membuatnya aman.",
    goals: ["mengelola `Vec<T>`", "memakai `HashMap` dan entry API", "membangun `String`"],
    blocks: [
      {
        t: "table",
        head: ["JavaScript", "Rust", "Catatan"],
        rows: [
          ["`[]` / `Array`", "`Vec<T>` / `vec![]`", "satu tipe elemen"],
          ["`arr.push(x)`", "`v.push(x)`", "butuh `let mut v`"],
          ["`arr.pop()`", "`v.pop()`", "mengembalikan `Option<T>`"],
          ["`arr[i]`", "`v[i]` atau `v.get(i)`", "`v[i]` panic jika di luar batas"],
          ["`new Map()`", "`HashMap::new()`", "`use std::collections::HashMap`"],
          ["`new Set()`", "`HashSet::new()`", "elemen unik"],
          ["`str + str`", "`format!` / `push_str`", "`String + &str` juga bisa"],
        ],
      },
      {
        t: "code",
        code: `use std::collections::HashMap;

fn main() {
    // ---- Vec ----
    let mut nilai = vec![70, 85, 90];
    nilai.push(65);
    nilai.sort();
    nilai.retain(|&n| n >= 70);           // seperti filter, tapi in-place
    println!("nilai: {:?}, terakhir: {:?}", nilai, nilai.last());

    for n in nilai.iter_mut() {           // pinjam mutable tiap elemen
        *n += 5;
    }
    println!("setelah bonus: {:?}", nilai);

    // ---- String ----
    let mut log = String::new();
    log.push_str("mulai");
    log += " -> proses";                  // String += &str
    let lengkap = format!("{log} -> {}", "selesai");
    println!("{lengkap}");
    println!("{:?}", "a,b,,c".split(',').collect::<Vec<_>>());

    // ---- HashMap ----
    let teks = "satu dua tiga dua tiga tiga";
    let mut frekuensi: HashMap<&str, u32> = HashMap::new();
    for kata in teks.split_whitespace() {
        // entry API: ambil nilai, atau sisipkan 0 jika belum ada
        *frekuensi.entry(kata).or_insert(0) += 1;
    }
    let mut urut: Vec<_> = frekuensi.iter().collect();
    urut.sort_by(|a, b| b.1.cmp(a.1));
    println!("{:?}", urut);

    if let Some(n) = frekuensi.get("dua") {
        println!("'dua' muncul {n} kali");
    }
}`,
        note: "`*frekuensi.entry(kata).or_insert(0) += 1` mungkin pola paling sering ditulis di Rust. Di JS padanannya `map.set(k, (map.get(k) ?? 0) + 1)`.",
      },
      {
        t: "js",
        text: "Urutan iterasi `HashMap` tidak dijamin, berbeda dengan `Map` di JS yang mengikuti urutan penyisipan. Jika butuh urutan terurut berdasarkan kunci, pakai `BTreeMap`.",
      },
      {
        t: "quiz",
        q: "Apa yang terjadi saat menjalankan `let v = vec![1, 2, 3]; let x = v[10];`?",
        options: ["`x` bernilai `undefined`", "`x` bernilai `0`", "Program panic: index out of bounds", "Vec otomatis membesar"],
        answer: 2,
        explain: "Pengindeksan dengan `[]` memeriksa batas dan panic jika keluar batas. Gunakan `v.get(10)` untuk mendapatkan `None`.",
      },
      {
        t: "challenge",
        title: "Kelompokkan berdasarkan huruf awal",
        task: "Kelompokkan nama berdasarkan huruf pertamanya memakai `BTreeMap<char, Vec<&str>>` (terurut otomatis). Output harus memuat `'A': [\"Ana\", \"Agus\"]` dan `'B': [\"Budi\"]`.",
        code: `use std::collections::BTreeMap;

fn main() {
    let nama = ["Ana", "Budi", "Agus", "Citra"];
    let mut grup: BTreeMap<char, Vec<&str>> = BTreeMap::new();
    for n in nama {
        let huruf = n.chars().next().unwrap();
        // sisipkan n ke grup[huruf]
    }
    println!("{:?}", grup);
}`,
        expect: ["'A': [\"Ana\", \"Agus\"]", "'B': [\"Budi\"]"],
        hint: "Entry API juga bekerja untuk Vec: `grup.entry(huruf).or_default().push(n);`",
        solution: `use std::collections::BTreeMap;

fn main() {
    let nama = ["Ana", "Budi", "Agus", "Citra"];
    let mut grup: BTreeMap<char, Vec<&str>> = BTreeMap::new();
    for n in nama {
        let huruf = n.chars().next().unwrap();
        grup.entry(huruf).or_default().push(n);
    }
    println!("{:?}", grup);
}`,
      },
    ],
  },
];
