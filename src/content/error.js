export default [
  {
    id: "result",
    module: "error",
    title: "Result & Operator ?",
    minutes: 18,
    summary:
      "Tidak ada `throw` dan `try/catch`. Fungsi yang bisa gagal mengembalikan `Result<T, E>`, dan operator `?` meneruskan error ke pemanggil dalam satu karakter.",
    goals: ["mengembalikan `Result`", "memakai `?`", "membedakan error yang bisa dipulihkan dan `panic!`"],
    blocks: [
      {
        t: "compare",
        js: `function bagi(a, b) {
  if (b === 0) throw new Error("bagi nol");
  return a / b;
}

try {
  console.log(bagi(10, 0));
} catch (e) {
  console.log("Gagal:", e.message);
}`,
        rust: `fn bagi(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        return Err("bagi nol".to_string());
    }
    Ok(a / b)
}

match bagi(10.0, 0.0) {
    Ok(h) => println!("{h}"),
    Err(e) => println!("Gagal: {e}"),
}`,
        note: "Di JS, signature `bagi(a, b)` tidak memberi tahu bahwa fungsi bisa melempar error. Di Rust, kemungkinan gagal tertulis di **tipe kembalian**, jadi pemanggil tidak bisa mengabaikannya tanpa sadar.",
      },
      {
        t: "p",
        text: `\`Result\` adalah enum biasa: \`Ok(T)\` atau \`Err(E)\`. Operator \`?\` di akhir ekspresi artinya: "jika \`Err\`, kembalikan error itu dari fungsi ini sekarang; jika \`Ok\`, ambil isinya". Fungsinya mirip \`await\` yang otomatis melempar ulang error, tapi tetap terlihat di tipe.`,
      },
      {
        t: "code",
        code: `use std::num::ParseIntError;

// Setiap ? bisa keluar lebih awal dengan Err
fn total_belanja(input: &str) -> Result<u32, ParseIntError> {
    let mut total = 0;
    for bagian in input.split(',') {
        let harga: u32 = bagian.trim().parse()?;
        total += harga;
    }
    Ok(total)
}

fn main() {
    match total_belanja("15000, 22000, 8000") {
        Ok(t) => println!("Total: Rp{t}"),
        Err(e) => println!("Error: {e}"),
    }

    match total_belanja("15000, dua ribu") {
        Ok(t) => println!("Total: Rp{t}"),
        Err(e) => println!("Error: {e}"),
    }

    // Kombinator, sama seperti Option
    let n = "42".parse::<i32>().map(|x| x * 2).unwrap_or(-1);
    println!("{n}");

    // .ok() mengubah Result menjadi Option
    let valid: Vec<i32> = ["1", "x", "3"].iter().filter_map(|s| s.parse().ok()).collect();
    println!("{:?}", valid);
}`,
      },
      { t: "h", text: "Kapan memakai panic!" },
      {
        t: "p",
        text: `\`panic!\` menghentikan thread saat terjadi keadaan yang **seharusnya mustahil**, yaitu bug. Contohnya indeks di luar batas atau invarian yang dilanggar. Untuk kegagalan yang wajar terjadi (file tidak ada, input pengguna salah, jaringan putus), kembalikan \`Result\`.`,
      },
      {
        t: "table",
        head: ["Situasi", "Pilihan"],
        rows: [
          ["Input pengguna tidak valid", "`Result`"],
          ["File atau jaringan gagal", "`Result`"],
          ["Bug logika, invarian rusak", "`panic!` / `unreachable!()`"],
          ["Prototipe, tes, contoh singkat", "`.unwrap()` / `.expect(\"...\")`"],
          ["`main` yang ingin memakai `?`", "`fn main() -> Result<(), Box<dyn Error>>`"],
        ],
      },
      {
        t: "quiz",
        q: "Fungsi `f` mengembalikan `Result<i32, String>`. Di dalamnya ada `let x = g()?;`. Agar ini lolos kompilasi, `g()` harus mengembalikan apa?",
        options: [
          "Apa pun, `?` mengubah semua tipe",
          "`Result<T, E>` dengan `E` yang bisa dikonversi ke `String`",
          "Hanya `Option<i32>`",
          "`i32`",
        ],
        answer: 1,
        explain:
          "`?` memanggil `From::from` pada error, sehingga tipe error `g` harus bisa dikonversi ke tipe error `f`. `Option` dengan `?` hanya boleh di fungsi yang juga mengembalikan `Option`.",
      },
      {
        t: "challenge",
        title: "Validasi umur",
        task: "Lengkapi `parse_umur` agar mengembalikan `Err` dengan pesan `umur tidak masuk akal` jika umur lebih dari 150, dan meneruskan error parsing dengan `?`. Output harus memuat `Ok(30)`, `umur tidak masuk akal`, dan `invalid digit`.",
        code: `fn parse_umur(s: &str) -> Result<u8, String> {
    let umur: u8 = s.parse().map_err(|e| format!("{e}"))?;
    // tambahkan pengecekan di sini
    Ok(umur)
}

fn main() {
    println!("{:?}", parse_umur("30"));
    println!("{:?}", parse_umur("200"));
    println!("{:?}", parse_umur("tiga puluh"));
}`,
        expect: ["Ok(30)", "umur tidak masuk akal", "invalid digit"],
        hint: "Tambahkan `if umur > 150 { return Err(\"umur tidak masuk akal\".to_string()); }`.",
        solution: `fn parse_umur(s: &str) -> Result<u8, String> {
    let umur: u8 = s.parse().map_err(|e| format!("{e}"))?;
    if umur > 150 {
        return Err("umur tidak masuk akal".to_string());
    }
    Ok(umur)
}

fn main() {
    println!("{:?}", parse_umur("30"));
    println!("{:?}", parse_umur("200"));
    println!("{:?}", parse_umur("tiga puluh"));
}`,
      },
    ],
  },

  {
    id: "custom-error",
    module: "error",
    title: "Tipe Error Sendiri",
    minutes: 16,
    summary:
      "Aplikasi nyata punya banyak jenis kegagalan. Enum error, trait `Display`, dan `From` membuat `?` bekerja di seluruh kode Anda.",
    goals: ["membuat enum error", "mengimplementasikan `Display` & `From`", "mengenal `Box<dyn Error>`, `thiserror`, `anyhow`"],
    blocks: [
      {
        t: "code",
        code: `use std::fmt;
use std::num::ParseIntError;

#[derive(Debug)]
enum ErrorTransfer {
    FormatSalah(ParseIntError),
    SaldoKurang { butuh: u64, ada: u64 },
    AkunDiblokir,
}

// Display: pesan untuk manusia (dipakai oleh {} )
impl fmt::Display for ErrorTransfer {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Self::FormatSalah(e) => write!(f, "jumlah tidak valid: {e}"),
            Self::SaldoKurang { butuh, ada } => {
                write!(f, "saldo kurang: butuh {butuh}, tersedia {ada}")
            }
            Self::AkunDiblokir => write!(f, "akun diblokir"),
        }
    }
}

impl std::error::Error for ErrorTransfer {}

// From: biarkan ? mengubah ParseIntError menjadi ErrorTransfer otomatis
impl From<ParseIntError> for ErrorTransfer {
    fn from(e: ParseIntError) -> Self {
        Self::FormatSalah(e)
    }
}

fn transfer(saldo: u64, input: &str, diblokir: bool) -> Result<u64, ErrorTransfer> {
    if diblokir {
        return Err(ErrorTransfer::AkunDiblokir);
    }
    let jumlah: u64 = input.parse()?; // ParseIntError -> ErrorTransfer
    if jumlah > saldo {
        return Err(ErrorTransfer::SaldoKurang { butuh: jumlah, ada: saldo });
    }
    Ok(saldo - jumlah)
}

fn main() {
    let kasus = [("50000", false), ("abc", false), ("900000", false), ("10", true)];
    for (input, blok) in kasus {
        match transfer(100_000, input, blok) {
            Ok(sisa) => println!("berhasil, sisa {sisa}"),
            Err(e) => println!("gagal: {e}"),
        }
    }
}`,
      },
      {
        t: "p",
        text: `Menulis \`Display\` dan \`From\` dengan tangan memang panjang. Di proyek nyata, komunitas Rust memakai dua crate:

- **thiserror** untuk library: \`#[derive(Error)]\` dengan atribut \`#[error("saldo kurang: {butuh}")]\` dan \`#[from]\`.
- **anyhow** untuk aplikasi: satu tipe \`anyhow::Result<T>\` yang menampung error apa pun, ditambah \`.context("saat membaca config")\`.`,
      },
      {
        t: "compare",
        jsTitle: "JS: class error",
        js: `class SaldoKurang extends Error {
  constructor(butuh, ada) {
    super(\`saldo kurang: \${butuh}\`);
    this.butuh = butuh;
  }
}
// catch (e) { if (e instanceof SaldoKurang) ... }`,
        rustTitle: "Rust + thiserror",
        rust: `#[derive(Debug, thiserror::Error)]
enum ErrorTransfer {
    #[error("jumlah tidak valid")]
    FormatSalah(#[from] ParseIntError),
    #[error("saldo kurang: {butuh}")]
    SaldoKurang { butuh: u64, ada: u64 },
}`,
        note: "Kode thiserror di atas butuh dependensi `thiserror` di `Cargo.toml`, jadi tidak bisa dijalankan di sini. Rust Playground menyediakan crate populer, termasuk thiserror dan anyhow.",
      },
      {
        t: "code",
        title: "main.rs · Box<dyn Error>",
        code: `use std::error::Error;

// Box<dyn Error> menampung error tipe apa pun yang mengimplementasikan Error
fn baca_port(s: &str) -> Result<u16, Box<dyn Error>> {
    let port: u16 = s.trim().parse()?;
    if port < 1024 {
        return Err(format!("port {port} butuh hak akses root").into());
    }
    Ok(port)
}

fn main() -> Result<(), Box<dyn Error>> {
    println!("port: {}", baca_port("8080")?);
    if let Err(e) = baca_port("80") {
        println!("ditolak: {e}");
    }
    let hasil = baca_port("delapan");
    println!("{:?}", hasil.map_err(|e| e.to_string()));
    Ok(())
}`,
      },
      {
        t: "quiz",
        q: "Mengapa `impl From<ParseIntError> for ErrorTransfer` diperlukan?",
        options: [
          "Agar `ErrorTransfer` bisa dicetak dengan `{}`",
          "Agar operator `?` bisa mengubah `ParseIntError` menjadi `ErrorTransfer` secara otomatis",
          "Agar `ErrorTransfer` bisa di-clone",
          "Tidak diperlukan, hanya gaya penulisan",
        ],
        answer: 1,
        explain: "`?` memanggil `From::from(err)` sebelum mengembalikan error. Tanpa `From`, Anda harus menulis `.map_err(ErrorTransfer::FormatSalah)?` sendiri.",
      },
    ],
  },
];
