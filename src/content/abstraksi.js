export default [
  {
    id: "traits",
    module: "abstraksi",
    title: "Traits",
    minutes: 20,
    summary:
      "Trait mendefinisikan perilaku bersama, mirip `interface` di TypeScript. Bedanya, Anda bisa mengimplementasikan trait untuk tipe yang sudah ada, termasuk tipe bawaan.",
    goals: ["mendefinisikan & mengimplementasikan trait", "memakai `impl Trait` dan `dyn Trait`", "mengimplementasikan `Display`"],
    blocks: [
      {
        t: "compare",
        jsTitle: "TypeScript",
        js: `interface Bersuara {
  nama(): string;
  suara(): string;
}

class Kucing implements Bersuara {
  nama() { return "Kucing"; }
  suara() { return "meong"; }
}`,
        rust: `trait Bersuara {
    fn nama(&self) -> String;
    fn suara(&self) -> String;
    // method default, boleh di-override
    fn perkenalan(&self) -> String {
        format!("{} berkata {}", self.nama(), self.suara())
    }
}

struct Kucing;
impl Bersuara for Kucing {
    fn nama(&self) -> String { "Kucing".into() }
    fn suara(&self) -> String { "meong".into() }
}`,
        note: "TypeScript memakai *structural typing*: objek dengan bentuk yang cocok otomatis dianggap memenuhi interface. Rust memakai *nominal typing*: Anda wajib menulis `impl Trait for Tipe` secara eksplisit.",
      },
      {
        t: "code",
        code: `use std::fmt;

trait Bersuara {
    fn nama(&self) -> String;
    fn suara(&self) -> String;
    fn perkenalan(&self) -> String {
        format!("{} berkata {}", self.nama(), self.suara())
    }
}

struct Kucing;
struct Anjing { nama: String }

impl Bersuara for Kucing {
    fn nama(&self) -> String { "Kucing".into() }
    fn suara(&self) -> String { "meong".into() }
}

impl Bersuara for Anjing {
    fn nama(&self) -> String { self.nama.clone() }
    fn suara(&self) -> String { "guk!".into() }
    fn perkenalan(&self) -> String { format!("{} menggonggong: {}", self.nama, self.suara()) }
}

// impl Trait: "tipe apa pun yang Bersuara" (dispatch statis, tanpa biaya runtime)
fn umumkan(h: &impl Bersuara) {
    println!("📣 {}", h.perkenalan());
}

// Trait bawaan Display mengatur tampilan {}
struct Suhu(f64);
impl fmt::Display for Suhu {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{:.1}°C", self.0)
    }
}

// Trait bisa diimplementasikan untuk tipe bawaan!
trait Teriak {
    fn teriak(&self) -> String;
}
impl Teriak for str {
    fn teriak(&self) -> String { self.to_uppercase() + "!" }
}

fn main() {
    umumkan(&Kucing);
    umumkan(&Anjing { nama: "Bleki".into() });

    // dyn Trait: koleksi berisi tipe berbeda (dispatch dinamis lewat vtable)
    let kebun: Vec<Box<dyn Bersuara>> = vec![Box::new(Kucing), Box::new(Anjing { nama: "Moli".into() })];
    for h in &kebun {
        println!("{}", h.suara());
    }

    println!("Suhu ruangan: {}", Suhu(26.456));
    println!("{}", "halo".teriak());
}`,
      },
      {
        t: "table",
        head: ["", "`impl Trait` / generic", "`dyn Trait`"],
        rows: [
          ["Kapan tipe diketahui", "saat kompilasi", "saat runtime"],
          ["Mekanisme", "monomorphization (salinan kode per tipe)", "vtable (pointer ke tabel method)"],
          ["Kecepatan", "paling cepat, bisa di-inline", "ada sedikit biaya pemanggilan tak langsung"],
          ["Koleksi campuran tipe", "tidak bisa", "bisa: `Vec<Box<dyn Trait>>`"],
        ],
      },
      {
        t: "tip",
        text: "Trait bawaan yang paling sering Anda temui: `Debug`, `Clone`, `Copy`, `PartialEq`, `Eq`, `Hash`, `PartialOrd`, `Ord`, `Default`, `Display`, `From`/`Into`, dan `Iterator`. Kebanyakan bisa diturunkan dengan `#[derive(...)]`.",
      },
      {
        t: "quiz",
        q: "Anda ingin menyimpan `Kucing` dan `Anjing` dalam satu `Vec`. Tipe mana yang benar?",
        options: ["`Vec<impl Bersuara>`", "`Vec<Bersuara>`", "`Vec<Box<dyn Bersuara>>`", "`Vec<&Bersuara>`"],
        answer: 2,
        explain: "Ukuran `Kucing` dan `Anjing` berbeda, jadi keduanya harus diletakkan di balik pointer (`Box`, `&`, `Rc`) sebagai *trait object* `dyn Bersuara`.",
      },
      {
        t: "challenge",
        title: "Trait Luas",
        task: "Implementasikan trait `Luas` untuk `Persegi` dan `Lingkaran`, lalu hitung total luas. Output harus memuat `Total: 28.57`.",
        code: `trait Luas {
    fn luas(&self) -> f64;
}

struct Persegi { sisi: f64 }
struct Lingkaran { r: f64 }

// implementasikan Luas untuk keduanya

fn main() {
    let bentuk: Vec<Box<dyn Luas>> = vec![
        Box::new(Persegi { sisi: 4.0 }),
        Box::new(Lingkaran { r: 2.0 }),
    ];
    let total: f64 = bentuk.iter().map(|b| b.luas()).sum();
    println!("Total: {:.2}", total);
}`,
        expect: ["Total: 28.57"],
        hint: "`impl Luas for Persegi { fn luas(&self) -> f64 { self.sisi * self.sisi } }`. Untuk lingkaran pakai `std::f64::consts::PI * self.r * self.r`.",
        solution: `trait Luas {
    fn luas(&self) -> f64;
}

struct Persegi { sisi: f64 }
struct Lingkaran { r: f64 }

impl Luas for Persegi {
    fn luas(&self) -> f64 {
        self.sisi * self.sisi
    }
}

impl Luas for Lingkaran {
    fn luas(&self) -> f64 {
        std::f64::consts::PI * self.r * self.r
    }
}

fn main() {
    let bentuk: Vec<Box<dyn Luas>> = vec![
        Box::new(Persegi { sisi: 4.0 }),
        Box::new(Lingkaran { r: 2.0 }),
    ];
    let total: f64 = bentuk.iter().map(|b| b.luas()).sum();
    println!("Total: {:.2}", total);
}`,
      },
    ],
  },

  {
    id: "generics",
    module: "abstraksi",
    title: "Generics",
    minutes: 16,
    summary:
      "Tulis kode sekali untuk banyak tipe, lalu batasi tipenya dengan *trait bound* agar kompiler tahu operasi apa yang diizinkan.",
    goals: ["menulis fungsi & struct generic", "memakai trait bound dan `where`"],
    blocks: [
      {
        t: "compare",
        jsTitle: "TypeScript",
        js: `function terbesar<T>(xs: T[]): T {
  let max = xs[0];
  for (const x of xs) if (x > max) max = x;
  return max; // > pada T apa pun? TS mengizinkan
}`,
        rust: `fn terbesar<T: PartialOrd + Copy>(xs: &[T]) -> T {
    let mut max = xs[0];
    for &x in xs {
        if x > max { max = x; }
    }
    max
}`,
        note: "Rust menolak `x > max` sampai Anda berjanji bahwa `T` bisa dibandingkan (`PartialOrd`). Bound `Copy` dibutuhkan karena kita menyalin elemen keluar dari slice.",
      },
      {
        t: "code",
        code: `use std::fmt::Display;

fn terbesar<T: PartialOrd + Copy>(xs: &[T]) -> T {
    let mut max = xs[0];
    for &x in xs {
        if x > max {
            max = x;
        }
    }
    max
}

// Struct generic
#[derive(Debug)]
struct Pasangan<T> {
    a: T,
    b: T,
}

impl<T: PartialOrd + Display> Pasangan<T> {
    fn cetak_terbesar(&self) {
        let m = if self.a > self.b { &self.a } else { &self.b };
        println!("yang terbesar: {m}");
    }
}

// where: bound panjang ditulis terpisah supaya rapi
fn laporan<K, V>(judul: K, nilai: &[V]) -> String
where
    K: Display,
    V: Display,
{
    let isi: Vec<String> = nilai.iter().map(|v| v.to_string()).collect();
    format!("{judul}: {}", isi.join(" | "))
}

fn main() {
    println!("{}", terbesar(&[3, 9, 2]));
    println!("{}", terbesar(&[1.5, 0.2]));
    println!("{}", terbesar(&['x', 'b', 'z']));

    let p = Pasangan { a: "apel", b: "zaitun" };
    p.cetak_terbesar();
    println!("{:?}", Pasangan { a: 1, b: 2 });

    println!("{}", laporan("Skor", &[90, 85, 77]));
}`,
      },
      {
        t: "p",
        text: `Generic di Rust dikompilasi lewat **monomorphization**: untuk setiap tipe konkret yang dipakai, kompiler membuat salinan fungsi khusus. \`terbesar::<i32>\` dan \`terbesar::<f64>\` menjadi dua fungsi berbeda di binary. Hasilnya secepat kode yang ditulis manual, tanpa biaya runtime.

Anda sudah memakai generic sejak awal: \`Vec<T>\`, \`Option<T>\`, \`Result<T, E>\`, dan \`HashMap<K, V>\`.`,
      },
      {
        t: "quiz",
        kind: "compile",
        q: "Apakah fungsi ini lolos kompilasi?",
        code: `fn jumlah<T>(a: T, b: T) -> T {
    a + b
}`,
        options: ["Ya", "Tidak, `T` belum dibatasi trait `Add`", "Tidak, generic tidak boleh dipakai di parameter"],
        answer: 1,
        explain: "Kompiler tidak tahu apakah `T` bisa dijumlahkan. Perbaikannya: `fn jumlah<T: std::ops::Add<Output = T>>(a: T, b: T) -> T`.",
      },
      {
        t: "challenge",
        title: "Tumpukan generic",
        task: "Lengkapi `Tumpukan<T>` dengan method `push` dan `pop` (yang mengembalikan `Option<T>`). Output harus `Some(\"c\")`, `Some(\"b\")`, lalu `sisa 1`.",
        code: `struct Tumpukan<T> {
    isi: Vec<T>,
}

impl<T> Tumpukan<T> {
    fn new() -> Self {
        Tumpukan { isi: Vec::new() }
    }
    // tambahkan push dan pop
    fn len(&self) -> usize {
        self.isi.len()
    }
}

fn main() {
    let mut t = Tumpukan::new();
    t.push("a");
    t.push("b");
    t.push("c");
    println!("{:?}", t.pop());
    println!("{:?}", t.pop());
    println!("sisa {}", t.len());
}`,
        expect: ['Some("c")\nSome("b")\nsisa 1'],
        hint: "`fn push(&mut self, x: T) { self.isi.push(x) }` dan `fn pop(&mut self) -> Option<T> { self.isi.pop() }`.",
        solution: `struct Tumpukan<T> {
    isi: Vec<T>,
}

impl<T> Tumpukan<T> {
    fn new() -> Self {
        Tumpukan { isi: Vec::new() }
    }
    fn push(&mut self, x: T) {
        self.isi.push(x);
    }
    fn pop(&mut self) -> Option<T> {
        self.isi.pop()
    }
    fn len(&self) -> usize {
        self.isi.len()
    }
}

fn main() {
    let mut t = Tumpukan::new();
    t.push("a");
    t.push("b");
    t.push("c");
    println!("{:?}", t.pop());
    println!("{:?}", t.pop());
    println!("sisa {}", t.len());
}`,
      },
    ],
  },

  {
    id: "lifetimes",
    module: "abstraksi",
    title: "Lifetimes",
    minutes: 22,
    summary:
      "Lifetime adalah cara kompiler memastikan sebuah referensi tidak pernah hidup lebih lama dari data yang dirujuknya. Biasanya tidak terlihat; sesekali Anda perlu menuliskannya.",
    goals: ["membaca anotasi `'a`", "memperbaiki error E0597", "memahami aturan elision"],
    blocks: [
      {
        t: "p",
        text: `JavaScript tidak punya konsep ini karena garbage collector menjaga objek tetap hidup selama masih ada yang merujuk. Rust tidak punya GC, jadi kompiler harus **membuktikan** bahwa setiap referensi selalu menunjuk data yang masih ada. Bukti itu disebut lifetime.

Anotasi \`'a\` **tidak mengubah** berapa lama data hidup. Ia hanya mendeskripsikan hubungan: "referensi yang dikembalikan hidup paling lama selama input \`'a\`".`,
      },
      {
        t: "viz",
        kind: "scope",
        title: "Rentang hidup data vs referensi",
        variants: [
          {
            label: "Referensi menggantung",
            code: `let r;
{
    let x = 5;
    r = &x;
}
println!("{r}");`,
            bars: [
              { label: "x", from: 3, to: 5, kind: "own" },
              { label: "&x", from: 4, to: 6, kind: "bad" },
            ],
            ok: false,
            verdict: "E0597: `x` does not live long enough. `x` di-drop di baris 5, tetapi `r` masih dipakai di baris 6. Di JS, GC akan menjaga `x` tetap hidup; di Rust, kodenya ditolak.",
          },
          {
            label: "Versi yang benar",
            code: `let x = 5;
let r = &x;
println!("{r}");`,
            bars: [
              { label: "x", from: 1, to: 3, kind: "own" },
              { label: "&x", from: 2, to: 3, kind: "ref" },
            ],
            ok: true,
            verdict: "Rentang `&x` sepenuhnya berada di dalam rentang hidup `x`.",
          },
          {
            label: "terpanjang() salah pakai",
            code: `fn terpanjang<'a>(a: &'a str, b: &'a str) -> &'a str { .. }
let s1 = String::from("panjang sekali");
let hasil;
{
    let s2 = String::from("xyz");
    hasil = terpanjang(&s1, &s2);
}
println!("{hasil}");`,
            bars: [
              { label: "s1", from: 2, to: 8, kind: "own" },
              { label: "s2", from: 5, to: 7, kind: "own" },
              { label: "'a", from: 6, to: 8, kind: "bad" },
            ],
            ok: false,
            verdict: "Signature menyatakan hasil hidup selama `'a`, dan `'a` adalah irisan rentang `s1` dan `s2`. `s2` mati di baris 7, sehingga `hasil` tidak boleh dipakai di baris 8, walaupun saat runtime yang terpilih sebenarnya `s1`. Kompiler hanya melihat signature, bukan isi fungsi.",
          },
          {
            label: "terpanjang() benar",
            code: `fn terpanjang<'a>(a: &'a str, b: &'a str) -> &'a str { .. }
let s1 = String::from("panjang sekali");
{
    let s2 = String::from("xyz");
    let hasil = terpanjang(&s1, &s2);
    println!("{hasil}");
}`,
            bars: [
              { label: "s1", from: 2, to: 7, kind: "own" },
              { label: "s2", from: 4, to: 7, kind: "own" },
              { label: "'a", from: 5, to: 6, kind: "ref" },
            ],
            ok: true,
            verdict: "`hasil` dipakai selagi `s1` dan `s2` masih hidup, jadi `'a` terpenuhi.",
          },
        ],
      },
      {
        t: "code",
        code: `// Tanpa 'a kompiler tidak tahu hasil meminjam dari a atau b
fn terpanjang<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() >= b.len() { a } else { b }
}

// Struct yang menyimpan referensi wajib menulis lifetime
struct Kutipan<'a> {
    teks: &'a str,
}

impl<'a> Kutipan<'a> {
    fn kata_pertama(&self) -> &'a str {
        self.teks.split_whitespace().next().unwrap_or("")
    }
}

fn main() {
    let s1 = String::from("ownership");
    {
        let s2 = String::from("borrow");
        println!("lebih panjang: {}", terpanjang(&s1, &s2));
    }

    let novel = String::from("Panggil aku Ishmael. Beberapa tahun lalu...");
    let k = Kutipan { teks: novel.split('.').next().unwrap() };
    println!("kutipan: '{}', kata pertama: '{}'", k.teks, k.kata_pertama());

    // 'static: hidup sepanjang program (literal string disimpan di binary)
    let s: &'static str = "saya abadi";
    println!("{s}");
}`,
      },
      {
        t: "tip",
        text: `Sebagian besar waktu Anda tidak perlu menulis lifetime berkat **aturan elision**:

- Setiap parameter referensi mendapat lifetime sendiri.
- Jika hanya ada satu input referensi, output memakai lifetime itu.
- Jika ada \`&self\`, output memakai lifetime \`self\`.

Anda hanya perlu menulis \`'a\` saat aturan ini tidak cukup, seperti di \`terpanjang\` yang punya dua input.`,
      },
      {
        t: "quiz",
        q: "Fungsi `fn awal(s: &str) -> &str` tidak menulis lifetime. Kenapa tetap lolos?",
        options: [
          "Karena `&str` selalu `'static`",
          "Aturan elision: hanya satu input referensi, jadi output memakai lifetime-nya",
          "Karena lifetime hanya wajib di struct",
          "Kompiler menunda pengecekan ke runtime",
        ],
        answer: 1,
        explain: "Kompiler menulis ulang menjadi `fn awal<'a>(s: &'a str) -> &'a str` secara otomatis.",
      },
      {
        t: "warn",
        text: "Saat terjebak dengan lifetime, solusi termudah sering kali adalah **memiliki** datanya: simpan `String` alih-alih `&str`, atau `.clone()` sekali. Optimasi dengan referensi bisa dilakukan nanti setelah kode berjalan.",
      },
    ],
  },

  {
    id: "closures",
    module: "abstraksi",
    title: "Closures",
    minutes: 15,
    summary:
      "Fungsi anonim yang menangkap variabel di sekitarnya. Mirip arrow function, tapi Rust mencatat *bagaimana* setiap variabel ditangkap: dipinjam, dipinjam mutable, atau dipindahkan.",
    goals: ["menulis closure", "membedakan `Fn`, `FnMut`, `FnOnce`", "memakai `move`"],
    blocks: [
      {
        t: "compare",
        js: `const pajak = 0.11;
const denganPajak = (h) => h * (1 + pajak);

let hitung = 0;
const tambah = () => { hitung++; };
tambah(); tambah();`,
        rust: `let pajak = 0.11;
let dengan_pajak = |h: f64| h * (1.0 + pajak);

let mut hitung = 0;
let mut tambah = || hitung += 1;
tambah(); tambah();`,
        note: "Closure yang mengubah variabel tangkapannya harus disimpan di variabel `mut`, karena memanggilnya mengubah keadaan.",
      },
      {
        t: "table",
        head: ["Trait", "Cara menangkap", "Bisa dipanggil", "Contoh"],
        rows: [
          ["`Fn`", "pinjam `&`", "berkali-kali", "`|x| x + offset`"],
          ["`FnMut`", "pinjam `&mut`", "berkali-kali, butuh `mut`", "`|| hitung += 1`"],
          ["`FnOnce`", "ambil kepemilikan", "sekali", "`move || drop(data)`"],
        ],
      },
      {
        t: "code",
        code: `// Fungsi yang menerima closure
fn ulangi<F: FnMut(u32)>(n: u32, mut f: F) {
    for i in 0..n {
        f(i);
    }
}

// Fungsi yang mengembalikan closure
fn pengali(faktor: i32) -> impl Fn(i32) -> i32 {
    move |x| x * faktor // move: faktor disalin ke dalam closure
}

fn main() {
    let mut log = Vec::new();
    ulangi(3, |i| log.push(format!("langkah {i}")));
    println!("{:?}", log);

    let kali3 = pengali(3);
    let kali10 = pengali(10);
    println!("{} {}", kali3(7), kali10(7));

    // Closure sebagai nilai, disimpan dalam Vec
    let operasi: Vec<(&str, Box<dyn Fn(f64) -> f64>)> = vec![
        ("kuadrat", Box::new(|x: f64| x * x)),
        ("akar", Box::new(|x: f64| x.sqrt())),
        ("negasi", Box::new(|x: f64| -x)),
    ];
    for (nama, f) in &operasi {
        println!("{nama}(16) = {}", f(16.0));
    }

    // move memindahkan kepemilikan ke closure
    let pesan = String::from("dari thread lain");
    let tugas = move || println!("{pesan}");
    tugas();
    // println!("{pesan}"); // error: pesan sudah dipindah
}`,
      },
      {
        t: "quiz",
        q: "Closure `|| { let v = data; }` yang memindahkan `data` (sebuah `Vec`) keluar dari tangkapannya mengimplementasikan trait apa?",
        options: ["`Fn`", "`FnMut`", "Hanya `FnOnce`", "Tidak ada"],
        answer: 2,
        explain: "Setelah dipanggil sekali, `data` sudah dipindah, jadi closure tidak bisa dipanggil lagi. Closure seperti ini hanya `FnOnce`.",
      },
    ],
  },

  {
    id: "iterators",
    module: "abstraksi",
    title: "Iterators",
    minutes: 18,
    summary:
      "Rantai `map`/`filter` yang terasa seperti JavaScript, tapi malas (lazy), tanpa array perantara, dan dikompilasi menjadi loop secepat tulisan manual.",
    goals: ["merangkai adapter iterator", "memahami sifat lazy", "mengimplementasikan `Iterator` sendiri"],
    blocks: [
      { t: "viz", kind: "iter" },
      {
        t: "p",
        text: `Adapter seperti \`map\`, \`filter\`, dan \`take\` tidak mengerjakan apa pun sampai ada **consumer** yang menarik nilai: \`collect\`, \`sum\`, \`count\`, \`for\`, \`find\`, dan sejenisnya. Jika Anda lupa consumer, kompiler memberi peringatan bahwa iterator tersebut tidak pernah dipakai.`,
      },
      {
        t: "table",
        head: ["JavaScript", "Rust"],
        rows: [
          ["`arr.map(f)`", "`v.iter().map(f).collect::<Vec<_>>()`"],
          ["`arr.filter(f)`", "`.filter(f)`"],
          ["`arr.reduce(f, 0)`", "`.fold(0, f)` atau `.sum()`"],
          ["`arr.find(f)`", "`.find(f)` → `Option`"],
          ["`arr.some(f)` / `every(f)`", "`.any(f)` / `.all(f)`"],
          ["`arr.forEach((x, i) => ..)`", "`for (i, x) in v.iter().enumerate()`"],
          ["`arr.flatMap(f)`", "`.flat_map(f)`"],
          ["`arr.slice(0, n)`", "`.take(n)`"],
          ["(tidak ada)", "`.zip()`, `.chain()`, `.windows(n)`, `.chunks(n)`, `.rev()`"],
        ],
      },
      {
        t: "code",
        code: `#[derive(Debug)]
struct Produk {
    nama: &'static str,
    kategori: &'static str,
    harga: u32,
    stok: u32,
}

fn main() {
    let produk = vec![
        Produk { nama: "Kopi", kategori: "minuman", harga: 18000, stok: 12 },
        Produk { nama: "Teh", kategori: "minuman", harga: 12000, stok: 0 },
        Produk { nama: "Roti", kategori: "makanan", harga: 15000, stok: 5 },
        Produk { nama: "Donat", kategori: "makanan", harga: 9000, stok: 20 },
    ];

    let tersedia: Vec<&str> = produk.iter().filter(|p| p.stok > 0).map(|p| p.nama).collect();
    println!("tersedia: {:?}", tersedia);

    let nilai_stok: u32 = produk.iter().map(|p| p.harga * p.stok).sum();
    println!("nilai stok: Rp{nilai_stok}");

    let termurah = produk.iter().min_by_key(|p| p.harga).unwrap();
    println!("termurah: {}", termurah.nama);

    let (minuman, makanan): (Vec<&Produk>, Vec<&Produk>) =
        produk.iter().partition(|p| p.kategori == "minuman");
    println!("{} minuman, {} makanan", minuman.len(), makanan.len());

    // iter() meminjam, into_iter() mengambil kepemilikan, iter_mut() meminjam mutable
    let selisih: Vec<i32> = [3, 7, 4, 10].windows(2).map(|w| w[1] - w[0]).collect();
    println!("selisih berurutan: {:?}", selisih);

    let gabung: String = ["a", "b", "c"].iter().zip(1..).map(|(h, n)| format!("{h}{n}")).collect::<Vec<_>>().join("-");
    println!("{gabung}");
}`,
      },
      { t: "h", text: "Membuat iterator sendiri" },
      {
        t: "code",
        code: `struct Fibonacci {
    a: u64,
    b: u64,
}

// Cukup implementasikan next(); puluhan method lain didapat gratis
impl Iterator for Fibonacci {
    type Item = u64;
    fn next(&mut self) -> Option<u64> {
        let hasil = self.a;
        self.a = self.b;
        self.b += hasil;
        Some(hasil) // tidak pernah None: iterator tak hingga
    }
}

fn main() {
    let fib = Fibonacci { a: 0, b: 1 };
    let genap: Vec<u64> = fib.filter(|x| x % 2 == 0).take(6).collect();
    println!("6 Fibonacci genap pertama: {:?}", genap);

    let total: u64 = Fibonacci { a: 0, b: 1 }.take_while(|&x| x < 1000).sum();
    println!("jumlah Fibonacci < 1000: {total}");
}`,
        note: "Iterator tak hingga aman dipakai karena sifat lazy. Di JS, padanannya adalah generator `function*`.",
      },
      {
        t: "quiz",
        q: "Apa output `let v: Vec<i32> = (1..=4).map(|x| { println!(\"{x}\"); x }).take(2).collect();`?",
        options: ["Mencetak 1, 2, 3, 4", "Mencetak 1 dan 2", "Tidak mencetak apa pun", "Error kompilasi"],
        answer: 1,
        explain: "`take(2)` berhenti menarik nilai setelah dua elemen, sehingga closure `map` hanya dipanggil dua kali.",
      },
      {
        t: "challenge",
        title: "Statistik kata",
        task: "Dengan rantai iterator, cetak kata terpanjang dan jumlah kata yang lebih dari 4 huruf dari kalimat yang tersedia. Output harus `terpanjang: memastikan` lalu `lebih dari 4 huruf: 3`.",
        code: `fn main() {
    let kalimat = "kompiler rust membantu kita memastikan kode aman";
    let terpanjang = todo!();
    let banyak = todo!();
    println!("terpanjang: {}", terpanjang);
    println!("lebih dari 4 huruf: {}", banyak);
}`,
        expect: ["terpanjang: memastikan", "lebih dari 4 huruf: 3"],
        hint: "`kalimat.split_whitespace().max_by_key(|k| k.len()).unwrap()` dan `.filter(|k| k.len() > 4).count()`.",
        solution: `fn main() {
    let kalimat = "kompiler rust membantu kita memastikan kode aman";
    let terpanjang = kalimat.split_whitespace().max_by_key(|k| k.len()).unwrap();
    let banyak = kalimat.split_whitespace().filter(|k| k.len() > 4).count();
    println!("terpanjang: {}", terpanjang);
    println!("lebih dari 4 huruf: {}", banyak);
}`,
      },
    ],
  },

  {
    id: "modul",
    module: "abstraksi",
    title: "Modul, Crate & Testing",
    minutes: 15,
    summary:
      "Cara mengorganisasi kode Rust: `mod` dan `pub` menggantikan `import`/`export`, Cargo mengurus dependensi, dan tes ditulis bersebelahan dengan kode.",
    goals: ["mengatur visibilitas dengan `pub`", "menambah dependensi", "menulis unit test"],
    blocks: [
      {
        t: "compare",
        jsTitle: "ES Modules",
        js: `// math.js
export function tambah(a, b) { return a + b; }
function rahasia() {} // tidak diekspor

// main.js
import { tambah } from "./math.js";`,
        rustTitle: "Rust",
        rust: `// src/math.rs
pub fn tambah(a: i32, b: i32) -> i32 { a + b }
fn rahasia() {} // privat secara default

// src/main.rs
mod math;           // muat src/math.rs
use math::tambah;`,
        note: "Semua item **privat secara default**. `mod math;` mendeklarasikan modul dari file `math.rs` atau `math/mod.rs`. `use` hanya membuat nama pendek, mirip alias.",
      },
      {
        t: "code",
        code: `// Modul juga bisa ditulis inline dalam satu file
mod toko {
    pub struct Keranjang {
        pub pemilik: String,
        items: Vec<(String, u32)>, // privat: hanya bisa diubah lewat method
    }

    impl Keranjang {
        pub fn new(pemilik: &str) -> Self {
            Self { pemilik: pemilik.into(), items: vec![] }
        }
        pub fn tambah(&mut self, nama: &str, harga: u32) {
            self.items.push((nama.into(), harga));
        }
        pub fn total(&self) -> u32 {
            hitung::jumlah(self.items.iter().map(|(_, h)| *h))
        }
    }

    mod hitung {
        // pub(super): terlihat oleh modul induk saja
        pub(super) fn jumlah(xs: impl Iterator<Item = u32>) -> u32 {
            xs.sum()
        }
    }
}

use toko::Keranjang;

fn main() {
    let mut k = Keranjang::new("Rina");
    k.tambah("buku", 45_000);
    k.tambah("pulpen", 5_000);
    println!("{} belanja Rp{}", k.pemilik, k.total());
    // k.items.clear(); // error: field items privat
}`,
      },
      { t: "h", text: "Cargo.toml dan struktur proyek" },
      {
        t: "code",
        title: "Cargo.toml",
        run: false,
        code: `[package]
name = "kasir"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }

[dev-dependencies]
pretty_assertions = "1"`,
        note: "Struktur standar: `src/main.rs` untuk binary, `src/lib.rs` untuk library, `tests/` untuk integration test, `examples/` untuk contoh, `benches/` untuk benchmark.",
      },
      { t: "h", text: "Unit test bawaan" },
      {
        t: "code",
        title: "src/lib.rs",
        run: false,
        code: `pub fn diskon(harga: u32, persen: u32) -> u32 {
    harga - harga * persen / 100
}

#[cfg(test)] // hanya dikompilasi saat cargo test
mod tests {
    use super::*;

    #[test]
    fn diskon_sepuluh_persen() {
        assert_eq!(diskon(10_000, 10), 9_000);
    }

    #[test]
    fn tanpa_diskon() {
        assert_eq!(diskon(5_000, 0), 5_000);
    }

    #[test]
    #[should_panic]
    fn diskon_lebih_dari_100_persen_panic() {
        diskon(1_000, 150); // overflow pada u32
    }
}`,
        note: "Jalankan dengan `cargo test`. Tidak perlu Jest atau konfigurasi apa pun. Komentar dokumentasi `///` yang berisi contoh kode juga ikut diuji sebagai *doctest*.",
      },
      {
        t: "quiz",
        q: "Sebuah `struct` dideklarasikan `pub struct User { nama: String }` di modul lain. Bisakah Anda menulis `User { nama: ... }` dari `main`?",
        options: [
          "Bisa, karena struct-nya `pub`",
          "Tidak bisa, field `nama` masih privat",
          "Bisa jika memakai `use`",
          "Tidak bisa, struct tidak boleh dibuat di luar modulnya",
        ],
        answer: 1,
        explain: "Visibilitas field terpisah dari visibilitas struct. Tandai `pub nama: String` atau sediakan konstruktor `pub fn new`.",
      },
    ],
  },
];
