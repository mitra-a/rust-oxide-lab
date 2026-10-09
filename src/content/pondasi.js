export default [
  {
    id: "halo-rust",
    module: "pondasi",
    title: "Halo, Rust",
    minutes: 10,
    summary:
      "Apa yang membuat Rust berbeda dari JavaScript, bagaimana Cargo menggantikan npm, dan cara membaca pesan error pertama Anda.",
    goals: ["menjalankan program Rust", "memakai `cargo`", "membaca diagnosa `rustc`"],
    blocks: [
      {
        t: "p",
        text: `JavaScript dijalankan oleh *runtime* (V8 di Node atau browser) yang mengurus memori untuk Anda lewat garbage collector. Rust dikompilasi langsung menjadi kode mesin, tanpa garbage collector, dan tetap aman dari bug memori. Rahasianya ada di kompiler: aturan **ownership** diperiksa saat kompilasi, sehingga banyak bug yang di JavaScript baru muncul saat runtime sudah ditolak sebelum program sempat berjalan.

Konsekuensinya, Anda akan lebih sering "berdebat" dengan kompiler. Itu normal. Pesan error Rust termasuk yang paling membantu di dunia pemrograman, dan sering langsung memberi tahu cara memperbaikinya.`,
      },
      {
        t: "compare",
        jsTitle: "index.js",
        rustTitle: "src/main.rs",
        js: `// Tidak perlu fungsi main.
console.log("Halo, dunia!");

const nama = "Ferris";
console.log(\`Halo, \${nama}!\`);`,
        rust: `// Program selalu mulai dari fn main.
fn main() {
    println!("Halo, dunia!");

    let nama = "Ferris";
    println!("Halo, {nama}!");
}`,
        note: "`println!` diakhiri tanda seru karena ia adalah **macro**, bukan fungsi biasa. Macro dikembangkan saat kompilasi, sehingga format string `{nama}` diperiksa tipenya oleh kompiler.",
      },
      {
        t: "code",
        title: "main.rs · coba ubah lalu jalankan",
        code: `fn main() {
    let bahasa = "Rust";
    let tahun = 2015;
    println!("Halo dari {bahasa}!");
    println!("Versi 1.0 dirilis tahun {tahun}.");
    // {:?} mencetak dalam format debug, berguna untuk struktur data
    println!("{:?}", (bahasa, tahun));
}`,
      },
      { t: "h", text: "Cargo: npm-nya Rust" },
      {
        t: "table",
        head: ["Kebutuhan", "Node.js", "Rust"],
        rows: [
          ["Buat proyek", "`npm init`", "`cargo new nama_app`"],
          ["File manifest", "`package.json`", "`Cargo.toml`"],
          ["Lockfile", "`package-lock.json`", "`Cargo.lock`"],
          ["Tambah dependensi", "`npm install chalk`", "`cargo add colored`"],
          ["Jalankan", "`node index.js`", "`cargo run`"],
          ["Build produksi", "bundler", "`cargo build --release`"],
          ["Tes", "jest / vitest", "`cargo test` (bawaan)"],
          ["Registry", "npmjs.com", "crates.io"],
          ["Formatter / linter", "prettier / eslint", "`cargo fmt` / `cargo clippy`"],
        ],
      },
      {
        t: "tip",
        text: `Pasang Rust lewat [rustup.rs](https://rustup.rs). Jika aplikasi ini dijalankan dengan \`bun run dev\` dan \`rustc\` tersedia, tombol **Jalankan** memakai kompiler di komputer Anda. Jika tidak, kode dikirim ke Rust Playground.`,
      },
      { t: "h", text: "Membaca pesan error" },
      {
        t: "p",
        text: "Biasakan membaca error dari atas ke bawah: kode error, pesan singkat, lokasi file, potongan kode dengan penanda `^^^`, lalu bagian `help` yang sering berisi perbaikan siap pakai.",
      },
      {
        t: "diag",
        title: "contoh",
        text: `
error[E0425]: cannot find value \`nmaa\` in this scope
 --> src/main.rs:3:20
  |
3 |     println!("{}", nmaa);
  |                    ^^^^ help: a local variable with a similar name exists: \`nama\`

For more information about this error, try \`rustc --explain E0425\`.`,
        note: "Setiap kode error punya penjelasan panjang. Jalankan `rustc --explain E0425` di terminal untuk membacanya.",
      },
      {
        t: "quiz",
        q: "Kenapa `println!` ditulis dengan tanda seru?",
        options: [
          "Karena fungsi itu bisa melempar error",
          "Karena ia adalah macro yang dikembangkan saat kompilasi",
          "Karena ia mencetak ke stderr",
          "Itu hanya konvensi penamaan, sama seperti fungsi biasa",
        ],
        answer: 1,
        explain:
          "Semua pemanggilan yang diakhiri `!` adalah macro. Macro bisa menerima jumlah argumen bervariasi dan memeriksa format string saat kompilasi.",
      },
      {
        t: "challenge",
        title: "Perkenalan pertama",
        task: "Perbaiki program supaya mencetak `Saya belajar Rust hari ke-1`. Ada dua kesalahan kecil. Baca pesan error dari kompiler.",
        code: `fn main() {
    let hari = 1
    println!("Saya belajar Rust hari ke-{}", hri);
}`,
        expect: ["Saya belajar Rust hari ke-1"],
        hint: "Pernyataan `let` di Rust harus diakhiri titik koma. Lalu cek ejaan nama variabel di dalam `println!`.",
        solution: `fn main() {
    let hari = 1;
    println!("Saya belajar Rust hari ke-{}", hari);
}`,
      },
    ],
  },

  {
    id: "variabel",
    module: "pondasi",
    title: "Variabel & Mutabilitas",
    minutes: 12,
    summary:
      "Di Rust, `let` berarti tidak bisa diubah, mirip `const` di JavaScript. Anda harus meminta izin dengan `mut` untuk mengubah nilai.",
    goals: ["membedakan `let`, `let mut`, dan `const`", "memakai shadowing"],
    blocks: [
      {
        t: "compare",
        js: `const skor = 10;
// skor = 20; // TypeError saat runtime

let nyawa = 3;
nyawa -= 1; // boleh`,
        rust: `let skor = 10;
// skor = 20; // error saat kompilasi

let mut nyawa = 3;
nyawa -= 1; // boleh, karena mut`,
        note: "Perhatikan jebakannya: `let` di JS bisa diubah, `let` di Rust **tidak**. Default immutable membuat kode lebih mudah dipahami karena Anda tahu nilai yang tidak bertanda `mut` tidak akan berubah.",
      },
      {
        t: "code",
        code: `fn main() {
    let mut nyawa = 3;
    println!("Nyawa awal: {nyawa}");

    nyawa -= 1;
    println!("Terkena musuh! Nyawa: {nyawa}");

    // Coba hapus kata mut di baris kedua lalu jalankan lagi.
}`,
      },
      {
        t: "diag",
        title: "jika mut dihapus",
        text: `
error[E0384]: cannot assign twice to immutable variable \`nyawa\`
 --> src/main.rs:5:5
  |
2 |     let nyawa = 3;
  |         ----- first assignment to \`nyawa\`
...
5 |     nyawa -= 1;
  |     ^^^^^^^^^^ cannot assign twice to immutable variable
  |
help: consider making this binding mutable
  |
2 |     let mut nyawa = 3;
  |         +++`,
      },
      { t: "h", text: "const di Rust lebih ketat" },
      {
        t: "p",
        text: `\`const\` di Rust adalah konstanta waktu kompilasi. Nilainya harus bisa dihitung saat kompilasi, tipenya wajib ditulis, dan namanya ditulis \`SCREAMING_SNAKE_CASE\`. Ia bisa diletakkan di luar fungsi, seperti konfigurasi global.`,
      },
      {
        t: "code",
        code: `const MAKS_PEMAIN: u32 = 4;
const DETIK_PER_JAM: u32 = 60 * 60;

fn main() {
    println!("Maksimal {MAKS_PEMAIN} pemain");
    println!("Satu jam = {DETIK_PER_JAM} detik");
}`,
      },
      { t: "h", text: "Shadowing: deklarasi ulang dengan nama sama" },
      {
        t: "p",
        text: `Rust mengizinkan \`let\` ulang dengan nama yang sama. Variabel baru "membayangi" yang lama. Bedanya dengan \`mut\`: shadowing membuat variabel baru, jadi **tipenya boleh berubah**. Pola ini sering dipakai untuk mengubah input mentah menjadi bentuk yang sudah diproses.`,
      },
      {
        t: "code",
        code: `fn main() {
    let input = "  42  ";        // &str
    let input = input.trim();    // masih &str, tanpa spasi
    let input: i32 = input.parse().expect("bukan angka");  // sekarang i32
    println!("Dua kali lipat: {}", input * 2);

    let x = 5;
    {
        let x = x * 10; // hanya berlaku di blok ini
        println!("di dalam blok: {x}");
    }
    println!("di luar blok: {x}");
}`,
      },
      {
        t: "js",
        text: "Di JavaScript, `let input = ...` dua kali di scope yang sama adalah `SyntaxError`. Di Rust itu sah dan idiomatis.",
      },
      {
        t: "quiz",
        kind: "compile",
        q: "Apakah kode ini lolos kompilasi?",
        code: `let jumlah = "10";
let jumlah: u32 = jumlah.parse().unwrap();
let mut total = jumlah;
total += 5;`,
        options: ["Ya, lolos", "Tidak, `jumlah` tidak bisa berubah tipe", "Tidak, `total` harus `const`"],
        answer: 0,
        explain:
          "Baris kedua adalah shadowing yang membuat variabel baru bertipe `u32`. `total` ditandai `mut`, jadi `+= 5` sah.",
      },
      {
        t: "challenge",
        title: "Hitung mundur",
        task: "Lengkapi program agar mencetak `3`, `2`, `1`, lalu `Meluncur!`. Anda hanya perlu memperbaiki deklarasi variabel.",
        code: `fn main() {
    let hitung = 3;
    while hitung > 0 {
        println!("{hitung}");
        hitung -= 1;
    }
    println!("Meluncur!");
}`,
        expect: ["3\n2\n1\nMeluncur!"],
        hint: "Variabel yang diubah di dalam loop harus dideklarasikan dengan `let mut`.",
        solution: `fn main() {
    let mut hitung = 3;
    while hitung > 0 {
        println!("{hitung}");
        hitung -= 1;
    }
    println!("Meluncur!");
}`,
      },
    ],
  },

  {
    id: "tipe-data",
    module: "pondasi",
    title: "Tipe Data Dasar",
    minutes: 15,
    summary:
      "JavaScript punya satu tipe `number`. Rust punya 12 tipe integer, 2 tipe float, `bool`, `char`, tuple, dan array berukuran tetap.",
    goals: ["memilih tipe integer", "menangani overflow", "memakai tuple & array"],
    blocks: [
      {
        t: "table",
        head: ["Kategori", "Tipe", "Catatan"],
        rows: [
          ["Integer bertanda", "`i8` `i16` `i32` `i64` `i128` `isize`", "default `i32`"],
          ["Integer tak bertanda", "`u8` `u16` `u32` `u64` `u128` `usize`", "`usize` untuk indeks & panjang"],
          ["Float", "`f32` `f64`", "default `f64`, sama dengan `number` JS"],
          ["Boolean", "`bool`", "`true` / `false`"],
          ["Karakter", "`char`", "4 byte, satu Unicode scalar: `'🦀'`"],
          ["Tuple", "`(i32, &str, bool)`", "campuran tipe, panjang tetap"],
          ["Array", "`[u8; 4]`", "tipe sama, panjang tetap, di stack"],
        ],
      },
      {
        t: "viz",
        kind: "int",
      },
      {
        t: "p",
        text: `Ubah tipe ke \`i8\` lalu isi nilai \`127\`. Bit paling kiri (bertanda ungu) adalah bit tanda; inilah alasan rentang \`i8\` adalah \`-128 … 127\`. Dalam mode debug, overflow membuat program **panic**. Dalam mode release, nilainya *wrap*. Karena itu, jika overflow memang mungkin terjadi, pakai method eksplisit seperti \`checked_add\`.`,
      },
      { t: "h", text: "Tidak ada konversi otomatis" },
      {
        t: "compare",
        js: `const a = 5;
const b = 2.5;
console.log(a + b);   // 7.5
console.log("5" * 2); // 10 (!)`,
        rust: `let a: i32 = 5;
let b: f64 = 2.5;
// a + b  -> error: tidak bisa i32 + f64
println!("{}", a as f64 + b); // 7.5
// "5" * 2 -> error tipe`,
        note: "Konversi numerik selalu eksplisit dengan `as` (bisa memotong nilai) atau `From`/`TryFrom` (aman). Tidak ada lagi kejutan seperti `\"5\" * 2`.",
      },
      {
        t: "code",
        code: `fn main() {
    let besar: i32 = 300;
    let kecil = besar as u8;          // dipotong: 300 mod 256 = 44
    println!("300 as u8 = {kecil}");

    // TryFrom menolak nilai yang tidak muat
    let aman = u8::try_from(besar);
    println!("u8::try_from(300) = {:?}", aman);

    let pi = 3.99_f64;
    println!("3.99 as i32 = {}", pi as i32); // dibulatkan ke bawah
    println!("satu juta: {}", 1_000_000);    // _ sebagai pemisah ribuan
}`,
      },
      { t: "h", text: "Tuple dan array" },
      {
        t: "code",
        code: `fn main() {
    // Tuple: seperti array JS campuran, tapi panjang dan tipe tetap
    let pemain: (&str, u32, bool) = ("Ana", 1200, true);
    let (nama, skor, aktif) = pemain;           // destructuring
    println!("{nama} punya {skor} poin, aktif: {aktif}");
    println!("akses dengan indeks: {}", pemain.0);

    // Array: panjang adalah bagian dari tipe
    let rgb: [u8; 3] = [255, 128, 0];
    let nol = [0; 5];                           // [0, 0, 0, 0, 0]
    println!("{:?} panjang {}", rgb, rgb.len());
    println!("{:?}", nol);

    let karakter = '🦀';
    println!("{karakter} memakai {} byte di UTF-8", karakter.len_utf8());
}`,
      },
      {
        t: "warn",
        text: "Mengakses `rgb[10]` tidak menghasilkan `undefined` seperti di JS. Jika indeks diketahui saat kompilasi, kompiler menolaknya. Jika baru diketahui saat runtime, program **panic**. Gunakan `rgb.get(10)` yang mengembalikan `Option` bila indeks bisa tidak valid.",
      },
      {
        t: "quiz",
        q: "Tipe apa yang tepat untuk menyimpan indeks atau panjang sebuah koleksi?",
        options: ["`i32`", "`u8`", "`usize`", "`f64`"],
        answer: 2,
        explain:
          "`usize` berukuran sesuai arsitektur (64 bit di mesin 64-bit) dan dipakai oleh `len()` serta pengindeksan.",
      },
      {
        t: "challenge",
        title: "Rata-rata nilai",
        task: "Hitung rata-rata dari array nilai ujian. Program harus mencetak `Rata-rata: 82.5`. Saat ini kode gagal dikompilasi karena mencampur integer dan float.",
        code: `fn main() {
    let nilai: [u32; 4] = [80, 90, 75, 85];
    let total: u32 = nilai.iter().sum();
    let rata = total / nilai.len();
    println!("Rata-rata: {}", rata);
}`,
        expect: ["Rata-rata: 82.5"],
        hint: "Ubah kedua operand menjadi `f64` dengan `as f64` sebelum membagi. `nilai.len()` bertipe `usize`.",
        solution: `fn main() {
    let nilai: [u32; 4] = [80, 90, 75, 85];
    let total: u32 = nilai.iter().sum();
    let rata = total as f64 / nilai.len() as f64;
    println!("Rata-rata: {}", rata);
}`,
      },
    ],
  },

  {
    id: "fungsi",
    module: "pondasi",
    title: "Fungsi & Ekspresi",
    minutes: 12,
    summary:
      "Hampir semua hal di Rust adalah ekspresi yang menghasilkan nilai, termasuk blok `{}` dan `if`. Baris terakhir tanpa titik koma menjadi nilai kembalian.",
    goals: ["menulis fungsi bertipe", "memahami ekspresi vs pernyataan"],
    blocks: [
      {
        t: "compare",
        js: `function luas(p, l) {
  return p * l;
}

const kuadrat = (x) => x * x;`,
        rust: `fn luas(p: f64, l: f64) -> f64 {
    p * l   // tanpa ; = nilai kembalian
}

let kuadrat = |x: i32| x * x; // closure`,
        note: "Tipe parameter **wajib** ditulis dan tipe kembalian ditulis setelah `->`. Di dalam fungsi, Rust bisa menebak tipe variabel lokal.",
      },
      {
        t: "p",
        text: `Aturannya sederhana: **pernyataan** (statement) diakhiri \`;\` dan tidak menghasilkan nilai. **Ekspresi** menghasilkan nilai. Baris terakhir sebuah blok tanpa titik koma adalah nilai blok tersebut. \`return\` tetap ada untuk keluar lebih awal.`,
      },
      {
        t: "code",
        code: `fn suhu_ke_fahrenheit(c: f64) -> f64 {
    c * 9.0 / 5.0 + 32.0
}

fn kategori(nilai: u32) -> &'static str {
    if nilai >= 90 {
        return "Istimewa"; // keluar lebih awal
    }
    if nilai >= 70 { "Lulus" } else { "Remedial" }
}

fn main() {
    println!("30°C = {}°F", suhu_ke_fahrenheit(30.0));

    // Blok juga ekspresi
    let diskon = {
        let harga = 200_000;
        let persen = 15;
        harga * persen / 100
    };
    println!("Diskon: Rp{diskon}");

    for n in [95, 72, 40] {
        println!("{n} -> {}", kategori(n));
    }
}`,
      },
      {
        t: "diag",
        title: "jebakan titik koma",
        text: `
error[E0308]: mismatched types
 --> src/main.rs:1:24
  |
1 | fn dobel(x: i32) -> i32 {
  |    -----            ^^^ expected \`i32\`, found \`()\`
  |    |
  |    implicitly returns \`()\` as its body has no tail or \`return\` expression
2 |     x * 2;
  |          - help: remove this semicolon to return this value`,
        note: "`()` dibaca *unit*, tipe kosong yang mirip `undefined`. Titik koma mengubah ekspresi `x * 2` menjadi pernyataan sehingga fungsi mengembalikan `()`.",
      },
      {
        t: "js",
        text: "Rust tidak punya parameter default, parameter opsional, atau overloading. Polanya diganti dengan `Option<T>`, builder pattern, atau beberapa fungsi bernama berbeda. Untuk mengembalikan beberapa nilai, kembalikan tuple: `fn bagi(a: i32, b: i32) -> (i32, i32)`.",
      },
      {
        t: "quiz",
        q: "Apa nilai `hasil` setelah kode berikut?",
        code: `let hasil = {
    let a = 3;
    let b = 4;
    a * b;
};`,
        options: ["`12`", "`()`", "Error kompilasi karena blok kosong", "`7`"],
        answer: 1,
        explain:
          "Ada titik koma setelah `a * b`, jadi blok tidak punya ekspresi akhir dan bernilai `()`. Kompiler akan memberi peringatan jika Anda memakai `hasil` sebagai angka.",
      },
      {
        t: "challenge",
        title: "Fungsi BMI",
        task: "Tulis badan fungsi `bmi` yang menghitung `berat / (tinggi * tinggi)`. Output yang diharapkan memuat `BMI: 22.9`.",
        code: `fn bmi(berat_kg: f64, tinggi_m: f64) -> f64 {
    // tulis ekspresinya di sini
}

fn main() {
    let nilai = bmi(70.0, 1.75);
    println!("BMI: {:.1}", nilai); // {:.1} = satu angka di belakang koma
}`,
        expect: ["BMI: 22.9"],
        hint: "Cukup satu baris: `berat_kg / (tinggi_m * tinggi_m)` tanpa titik koma.",
        solution: `fn bmi(berat_kg: f64, tinggi_m: f64) -> f64 {
    berat_kg / (tinggi_m * tinggi_m)
}

fn main() {
    let nilai = bmi(70.0, 1.75);
    println!("BMI: {:.1}", nilai);
}`,
      },
    ],
  },

  {
    id: "kontrol",
    module: "pondasi",
    title: "Alur Kontrol",
    minutes: 14,
    summary:
      "`if` sebagai ekspresi, `loop` yang bisa mengembalikan nilai, `for` di atas range, dan label untuk keluar dari loop bersarang.",
    goals: ["memakai `if` sebagai ternary", "memilih `loop`, `while`, atau `for`"],
    blocks: [
      {
        t: "compare",
        js: `const status = umur >= 17 ? "dewasa" : "anak";

if (nilai) { /* truthy */ }

for (let i = 0; i < 5; i++) {}
for (const x of arr) {}`,
        rust: `let status = if umur >= 17 { "dewasa" } else { "anak" };

if nilai != 0 { /* harus bool */ }

for i in 0..5 {}      // 0,1,2,3,4
for x in &arr {}`,
        note: "Rust tidak punya *truthy/falsy*. Kondisi `if` harus bertipe `bool`. Tidak ada operator ternary karena `if` sudah berupa ekspresi.",
      },
      {
        t: "code",
        code: `fn main() {
    // Range: 1..=5 termasuk 5, .rev() membalik urutan
    for n in (1..=5).rev() {
        print!("{n} ");
    }
    println!();

    // loop bisa mengembalikan nilai lewat break
    let mut tebakan = 1;
    let ketemu = loop {
        if tebakan * tebakan > 50 {
            break tebakan;
        }
        tebakan += 1;
    };
    println!("Bilangan pertama yang kuadratnya > 50: {ketemu}");

    // Label untuk keluar dari loop bersarang
    'luar: for baris in 1..=3 {
        for kolom in 1..=3 {
            if baris * kolom == 4 {
                println!("berhenti di ({baris}, {kolom})");
                break 'luar;
            }
        }
    }

    // enumerate memberi indeks, seperti arr.forEach((x, i) => ...)
    let buah = ["apel", "mangga", "jeruk"];
    for (i, b) in buah.iter().enumerate() {
        println!("{i}: {b}");
    }
}`,
      },
      {
        t: "tip",
        text: "`match` adalah bentuk alur kontrol paling kuat di Rust. Ia mirip `switch`, tapi wajib menangani semua kemungkinan dan bisa membongkar data. Anda akan mempelajarinya di modul Memodelkan Data.",
      },
      {
        t: "quiz",
        q: "Berapa kali isi loop `for i in 2..6` dijalankan?",
        options: ["3 kali", "4 kali", "5 kali", "6 kali"],
        answer: 1,
        explain: "`2..6` adalah range setengah terbuka: 2, 3, 4, 5. Pakai `2..=6` jika ingin menyertakan 6.",
      },
      {
        t: "challenge",
        title: "FizzBuzz",
        task: "Cetak angka 1 sampai 15. Untuk kelipatan 3 cetak `Fizz`, kelipatan 5 cetak `Buzz`, kelipatan keduanya cetak `FizzBuzz`. Baris terakhir harus `FizzBuzz`.",
        code: `fn main() {
    for n in 1..15 {
        let teks = if n % 3 == 0 {
            "Fizz".to_string()
        } else if n % 5 == 0 {
            "Buzz".to_string()
        } else {
            n.to_string()
        };
        println!("{teks}");
    }
}`,
        expect: ["Fizz\n4\nBuzz\nFizz\n7", "14\nFizzBuzz"],
        hint: "Ada dua masalah. Range `1..15` tidak menyertakan 15, dan kasus kelipatan 15 harus dicek **sebelum** kelipatan 3.",
        solution: `fn main() {
    for n in 1..=15 {
        let teks = if n % 15 == 0 {
            "FizzBuzz".to_string()
        } else if n % 3 == 0 {
            "Fizz".to_string()
        } else if n % 5 == 0 {
            "Buzz".to_string()
        } else {
            n.to_string()
        };
        println!("{teks}");
    }
}`,
      },
    ],
  },
];
