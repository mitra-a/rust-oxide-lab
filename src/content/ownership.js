const STR = (len, cap = len) => `ptr · len ${len} · cap ${cap}`;

export default [
  {
    id: "ownership",
    module: "ownership",
    title: "Ownership & Move",
    minutes: 20,
    summary:
      "Konsep terpenting di Rust. Setiap nilai punya tepat satu pemilik, dan saat pemilik keluar dari scope, nilainya dibebaskan. Tanpa garbage collector.",
    goals: ["menjelaskan stack vs heap", "memprediksi kapan nilai di-*move*", "memakai `clone`"],
    blocks: [
      {
        t: "p",
        text: `Di JavaScript, objek hidup di heap dan variabel hanya memegang referensinya. Saat Anda menulis \`const b = a\`, kedua variabel menunjuk objek yang sama, dan garbage collector membersihkannya ketika tidak ada lagi yang menunjuk.

Rust menyelesaikan masalah yang sama dengan tiga aturan yang diperiksa saat kompilasi:

- Setiap nilai punya satu **pemilik** (owner).
- Hanya boleh ada satu pemilik pada satu waktu.
- Saat pemilik keluar dari scope, nilai di-**drop** dan memorinya dibebaskan.`,
      },
      {
        t: "viz",
        kind: "memory",
        title: "Copy vs Move",
        code: `let a = 5;
let b = a;
let s1 = String::from("halo");
let s2 = s1;
let s3 = s2.clone();
// akhir scope: }`,
        steps: [
          {
            line: 1,
            stack: [{ name: "a", type: "i32", value: "5" }],
            heap: [],
            note: "`i32` berukuran tetap (4 byte) dan seluruhnya disimpan di **stack**.",
          },
          {
            line: 2,
            stack: [
              { name: "a", type: "i32", value: "5" },
              { name: "b", type: "i32", value: "5" },
            ],
            heap: [],
            note: "Tipe kecil seperti integer, `bool`, dan `char` mengimplementasikan trait `Copy`. Nilainya disalin bit demi bit, jadi `a` **tetap valid**.",
          },
          {
            line: 3,
            stack: [
              { name: "a", type: "i32", value: "5" },
              { name: "b", type: "i32", value: "5" },
              { name: "s1", type: "String", value: STR(4), ptr: "h1" },
            ],
            heap: [{ id: "h1", label: "buffer teks", cells: ["h", "a", "l", "o"] }],
            note: "`String` bisa tumbuh, jadi isinya disimpan di **heap**. Di stack hanya ada tiga angka: pointer, panjang, dan kapasitas.",
          },
          {
            line: 4,
            stack: [
              { name: "a", type: "i32", value: "5" },
              { name: "b", type: "i32", value: "5" },
              { name: "s1", type: "String", value: STR(4), state: "moved" },
              { name: "s2", type: "String", value: STR(4), ptr: "h1" },
            ],
            heap: [{ id: "h1", label: "buffer teks", cells: ["h", "a", "l", "o"] }],
            note: "**Move**: hanya pointer, len, dan cap yang disalin. Kepemilikan heap pindah ke `s2`, dan `s1` dianggap tidak valid. Memakai `s1` sekarang adalah error E0382. Ini mencegah *double free*.",
          },
          {
            line: 5,
            stack: [
              { name: "a", type: "i32", value: "5" },
              { name: "b", type: "i32", value: "5" },
              { name: "s1", type: "String", value: STR(4), state: "moved" },
              { name: "s2", type: "String", value: STR(4), ptr: "h1" },
              { name: "s3", type: "String", value: STR(4), ptr: "h2" },
            ],
            heap: [
              { id: "h1", label: "buffer teks", cells: ["h", "a", "l", "o"] },
              { id: "h2", label: "salinan", cells: ["h", "a", "l", "o"] },
            ],
            note: "`clone()` membuat salinan penuh di heap. Ini mahal untuk data besar, karena itu Rust membuatnya **eksplisit**.",
          },
          {
            line: 6,
            stack: [
              { name: "a", type: "i32", value: "5", state: "dropped" },
              { name: "b", type: "i32", value: "5", state: "dropped" },
              { name: "s1", type: "String", value: STR(4), state: "moved" },
              { name: "s2", type: "String", value: STR(4), state: "dropped" },
              { name: "s3", type: "String", value: STR(4), state: "dropped" },
            ],
            heap: [
              { id: "h1", label: "buffer teks", cells: ["h", "a", "l", "o"], state: "freed" },
              { id: "h2", label: "salinan", cells: ["h", "a", "l", "o"], state: "freed" },
            ],
            note: "Di akhir scope, Rust memanggil `drop` untuk setiap pemilik dalam urutan terbalik. `s1` dilewati karena sudah tidak memiliki apa-apa. Setiap buffer dibebaskan **tepat satu kali**.",
          },
        ],
      },
      {
        t: "compare",
        js: `const a = { nama: "Ana" };
const b = a;      // b dan a menunjuk objek sama
b.nama = "Budi";
console.log(a.nama); // "Budi" (!)`,
        rust: `let a = String::from("Ana");
let b = a;        // kepemilikan pindah ke b
// println!("{a}"); // error E0382
println!("{b}");`,
        note: "Di JS, dua variabel bisa diam-diam mengubah objek yang sama. Rust menolak keadaan \"dua pemilik\" secara default.",
      },
      { t: "h", text: "Fungsi juga mengambil kepemilikan" },
      {
        t: "code",
        code: `fn cetak_dan_buang(teks: String) {
    println!("menerima: {teks}");
} // teks di-drop di sini

fn buat_salam(nama: &str) -> String {
    format!("Halo, {nama}!") // kepemilikan diserahkan ke pemanggil
}

fn main() {
    let pesan = String::from("rahasia");
    cetak_dan_buang(pesan);
    // println!("{pesan}"); // hapus komentar ini: error, pesan sudah di-move

    let salam = buat_salam("Ferris");
    println!("{salam}");

    let angka = 7;
    let salinan = angka; // i32 adalah Copy, bukan move
    println!("{angka} dan {salinan} keduanya masih valid");
}`,
        note: "Mengoper `String` ke fungsi sama dengan `let teks = pesan;`, yaitu sebuah move. Jika Anda hanya ingin fungsi *melihat* data, pinjamkan dengan referensi `&`. Itulah topik pelajaran berikutnya.",
      },
      {
        t: "quiz",
        kind: "compile",
        q: "Apakah kode ini lolos kompilasi?",
        code: `let v = vec![1, 2, 3];
let w = v;
println!("{}", v.len());`,
        options: ["Ya, mencetak 3", "Tidak, `v` sudah di-move ke `w`", "Tidak, `vec!` harus `mut`"],
        answer: 1,
        explain:
          "`Vec` menyimpan data di heap dan tidak `Copy`, jadi `let w = v;` memindahkan kepemilikan. Perbaiki dengan `let w = v.clone();` atau pakai `&v`.",
      },
      {
        t: "quiz",
        q: "Tipe mana yang **tidak** mengimplementasikan `Copy`?",
        options: ["`u64`", "`(i32, bool)`", "`[char; 3]`", "`String`"],
        answer: 3,
        explain:
          "Tuple dan array yang seluruh elemennya `Copy` juga ikut `Copy`. `String` memiliki memori heap, jadi menyalinnya harus lewat `clone()`.",
      },
      {
        t: "challenge",
        title: "Selamatkan nilai yang di-move",
        task: "Program ini gagal karena `daftar` di-move ke fungsi `total`. Perbaiki **tanpa** mengubah isi fungsi `total`, sehingga output memuat `Total 3 item` lalu `Item: [\"buku\", \"pena\", \"tas\"]`.",
        code: `fn total(items: Vec<String>) -> usize {
    items.len()
}

fn main() {
    let daftar = vec![
        String::from("buku"),
        String::from("pena"),
        String::from("tas"),
    ];
    println!("Total {} item", total(daftar));
    println!("Item: {:?}", daftar);
}`,
        expect: ["Total 3 item", 'Item: ["buku", "pena", "tas"]'],
        hint: "Berikan salinan ke fungsi dengan `daftar.clone()`. Di pelajaran berikutnya Anda akan melihat cara yang lebih efisien: meminjam dengan `&`.",
        solution: `fn total(items: Vec<String>) -> usize {
    items.len()
}

fn main() {
    let daftar = vec![
        String::from("buku"),
        String::from("pena"),
        String::from("tas"),
    ];
    println!("Total {} item", total(daftar.clone()));
    println!("Item: {:?}", daftar);
}`,
      },
    ],
  },

  {
    id: "borrowing",
    module: "ownership",
    title: "Borrowing & Referensi",
    minutes: 22,
    summary:
      "Meminjam nilai tanpa mengambil kepemilikannya. Satu aturan emas: banyak pembaca, **atau** satu penulis, tidak pernah keduanya sekaligus.",
    goals: ["memakai `&T` dan `&mut T`", "memahami aturan borrow", "membaca error E0502 & E0499"],
    blocks: [
      {
        t: "p",
        text: `Referensi \`&s\` adalah pointer ke nilai milik orang lain. Pemegang referensi boleh membaca, tetapi saat referensi selesai dipakai, nilai **tidak** di-drop karena referensi bukan pemiliknya. Untuk mengubah lewat referensi, dibutuhkan \`&mut s\`, dan nilai asalnya juga harus \`mut\`.`,
      },
      {
        t: "viz",
        kind: "memory",
        title: "Pinjam baca, lalu pinjam tulis",
        code: `let mut s = String::from("hi");
let r = &s;
println!("{r}");
let m = &mut s;
m.push_str("!");
println!("{s}");`,
        steps: [
          {
            line: 1,
            stack: [{ name: "s", type: "String", value: STR(2), ptr: "h1" }],
            heap: [{ id: "h1", label: "buffer", cells: ["h", "i"] }],
            note: "`s` memiliki buffer di heap.",
          },
          {
            line: 2,
            stack: [
              { name: "s", type: "String", value: STR(2), ptr: "h1" },
              { name: "r", type: "&String", value: "alamat s", ptr: "s:s", kind: "ref" },
            ],
            heap: [{ id: "h1", label: "buffer", cells: ["h", "i"] }],
            note: "`r` menunjuk **ke `s`**, bukan langsung ke heap. Selama `r` hidup, `s` tidak boleh diubah.",
          },
          {
            line: 3,
            stack: [
              { name: "s", type: "String", value: STR(2), ptr: "h1" },
              { name: "r", type: "&String", value: "alamat s", ptr: "s:s", kind: "ref" },
            ],
            heap: [{ id: "h1", label: "buffer", cells: ["h", "i"] }],
            note: "Ini pemakaian **terakhir** `r`. Berkat *Non-Lexical Lifetimes*, pinjaman `r` berakhir di sini, bukan di akhir blok.",
          },
          {
            line: 4,
            stack: [
              { name: "s", type: "String", value: STR(2), ptr: "h1" },
              { name: "r", type: "&String", value: "alamat s", kind: "ref", state: "dropped", badge: "selesai" },
              { name: "m", type: "&mut String", value: "alamat s", ptr: "s:s", kind: "mut" },
            ],
            heap: [{ id: "h1", label: "buffer", cells: ["h", "i"] }],
            note: "Karena `r` sudah selesai, `&mut s` diizinkan. Selama `m` hidup, tidak ada yang lain boleh membaca atau menulis `s`, termasuk `s` sendiri.",
          },
          {
            line: 5,
            stack: [
              { name: "s", type: "String", value: STR(3, 8), ptr: "h1" },
              { name: "r", type: "&String", value: "alamat s", kind: "ref", state: "dropped", badge: "selesai" },
              { name: "m", type: "&mut String", value: "alamat s", ptr: "s:s", kind: "mut" },
            ],
            heap: [{ id: "h1", label: "buffer (dialokasi ulang)", cells: ["h", "i", "!"] }],
            note: "`push_str` lewat `m` mengubah data milik `s`. Buffer mungkin dipindah ke lokasi heap baru karena kapasitasnya bertambah. Inilah alasan Rust melarang `&T` lain tetap hidup: pointernya bisa *dangling*.",
          },
          {
            line: 6,
            stack: [
              { name: "s", type: "String", value: STR(3, 8), ptr: "h1" },
              { name: "r", type: "&String", value: "alamat s", kind: "ref", state: "dropped", badge: "selesai" },
              { name: "m", type: "&mut String", value: "alamat s", kind: "mut", state: "dropped", badge: "selesai" },
            ],
            heap: [{ id: "h1", label: "buffer", cells: ["h", "i", "!"] }],
            note: "`m` tidak dipakai lagi, jadi `s` bisa dibaca kembali. Output: `hi!`.",
          },
        ],
      },
      { t: "h", text: "Lab: uji aturan peminjaman" },
      {
        t: "p",
        text: "Pilih skenario atau susun sendiri urutan operasinya. Setiap batang di kanan menunjukkan rentang hidup pinjaman, dari dibuat sampai pemakaian terakhir. Jika rentang `&mut` bertabrakan dengan pinjaman lain, kompiler menolak.",
      },
      { t: "viz", kind: "borrow" },
      {
        t: "code",
        code: `fn panjang(teks: &String) -> usize {
    teks.len() // hanya membaca
}

fn tambah_tanda(teks: &mut String) {
    teks.push_str("!!!");
}

fn main() {
    let mut sapaan = String::from("Halo");

    let n = panjang(&sapaan);        // pinjam baca
    println!("'{sapaan}' panjangnya {n}");

    tambah_tanda(&mut sapaan);       // pinjam tulis
    println!("Sekarang: {sapaan}");  // sapaan masih milik main
}`,
      },
      {
        t: "js",
        text: "Bayangkan bug klasik JS: Anda melakukan iterasi atas array sambil menghapus elemennya di tengah loop. Di Rust, itu tidak bisa dikompilasi: loop memegang `&vec`, sedangkan menghapus butuh `&mut vec`.",
      },
      {
        t: "quiz",
        kind: "compile",
        q: "Apakah kode ini lolos kompilasi?",
        code: `let mut angka = vec![1, 2, 3];
let pertama = &angka[0];
angka.push(4);
println!("{pertama}");`,
        options: ["Ya", "Tidak, `push` butuh `&mut` saat `pertama` masih dipakai", "Tidak, indeks harus `usize`"],
        answer: 1,
        explain:
          "`push` bisa memindahkan buffer ke lokasi baru, sehingga `pertama` akan menunjuk memori yang sudah dibebaskan. Kompiler mendeteksinya sebagai E0502. Pindahkan `println!` ke sebelum `push`.",
      },
      {
        t: "challenge",
        title: "Pinjam, jangan ambil",
        task: "Ubah fungsi `hitung_vokal` agar **meminjam** teks, lalu perbaiki pemanggilnya. Output harus memuat `'pemrograman' punya 4 vokal`.",
        code: `fn hitung_vokal(teks: String) -> usize {
    teks.chars().filter(|c| "aiueo".contains(*c)).count()
}

fn main() {
    let kata = String::from("pemrograman");
    let n = hitung_vokal(kata);
    println!("'{}' punya {} vokal", kata, n);
}`,
        expect: ["'pemrograman' punya 4 vokal"],
        hint: "Ganti tipe parameter menjadi `&String` (atau lebih baik `&str`) dan panggil dengan `hitung_vokal(&kata)`.",
        solution: `fn hitung_vokal(teks: &str) -> usize {
    teks.chars().filter(|c| "aiueo".contains(*c)).count()
}

fn main() {
    let kata = String::from("pemrograman");
    let n = hitung_vokal(&kata);
    println!("'{}' punya {} vokal", kata, n);
}`,
      },
    ],
  },

  {
    id: "slices",
    module: "ownership",
    title: "Slice: String vs &str",
    minutes: 15,
    summary:
      "Kenapa Rust punya dua jenis string, dan bagaimana slice memberi Anda \"jendela\" ke sebagian data tanpa menyalinnya.",
    goals: ["memilih `String` atau `&str`", "membuat slice dari string & array"],
    blocks: [
      {
        t: "table",
        head: ["", "`String`", "`&str`"],
        rows: [
          ["Kepemilikan", "memiliki datanya", "meminjam (referensi)"],
          ["Lokasi data", "heap", "di mana saja: heap, binary, stack"],
          ["Bisa diubah", "ya (`push_str`, `insert`)", "tidak"],
          ["Contoh", "`String::from(\"hi\")`, `format!(..)`", "`\"hi\"`, `&s[0..2]`"],
          ["Padanan JS", "string yang Anda bangun", "potongan read-only dari string"],
        ],
      },
      {
        t: "viz",
        kind: "memory",
        title: "Slice menunjuk sebagian buffer",
        code: `let s = String::from("halo dunia");
let depan = &s[0..4];
let belakang = &s[5..];`,
        steps: [
          {
            line: 1,
            stack: [{ name: "s", type: "String", value: STR(10), ptr: "h1" }],
            heap: [{ id: "h1", label: "buffer", cells: ["h", "a", "l", "o", "␣", "d", "u", "n", "i", "a"] }],
            note: "Satu buffer berisi 10 byte.",
          },
          {
            line: 2,
            stack: [
              { name: "s", type: "String", value: STR(10), ptr: "h1" },
              { name: "depan", type: "&str", value: "ptr+0 · len 4", ptr: "h1", kind: "ref" },
            ],
            heap: [{ id: "h1", label: "buffer · depan = [0..4]", cells: ["h", "a", "l", "o", "␣", "d", "u", "n", "i", "a"] }],
            note: "Slice adalah *fat pointer*: alamat awal plus panjang. Tidak ada byte yang disalin.",
          },
          {
            line: 3,
            stack: [
              { name: "s", type: "String", value: STR(10), ptr: "h1" },
              { name: "depan", type: "&str", value: "ptr+0 · len 4", ptr: "h1", kind: "ref" },
              { name: "belakang", type: "&str", value: "ptr+5 · len 5", ptr: "h1", kind: "ref" },
            ],
            heap: [{ id: "h1", label: "buffer · belakang = [5..]", cells: ["h", "a", "l", "o", "␣", "d", "u", "n", "i", "a"] }],
            note: "Kedua slice meminjam `s`. Selama keduanya hidup, `s` tidak boleh diubah atau di-drop.",
          },
        ],
      },
      {
        t: "code",
        code: `// Terima &str agar fungsi bisa dipanggil dengan String maupun literal
fn kata_pertama(teks: &str) -> &str {
    match teks.find(' ') {
        Some(i) => &teks[..i],
        None => teks,
    }
}

fn main() {
    let kalimat = String::from("belajar rust itu seru");
    println!("{}", kata_pertama(&kalimat)); // &String otomatis jadi &str
    println!("{}", kata_pertama("literal juga bisa"));

    // Slice juga berlaku untuk array dan Vec
    let angka = [10, 20, 30, 40, 50];
    let tengah: &[i32] = &angka[1..4];
    println!("{:?}", tengah);

    // Iterasi karakter Unicode dengan aman
    let sapa = "Halo 🦀";
    println!("byte: {}, karakter: {}", sapa.len(), sapa.chars().count());
}`,
      },
      {
        t: "warn",
        text: "Indeks slice string dihitung dalam **byte**, bukan karakter. `&\"🦀\"[0..1]` akan panic karena memotong di tengah karakter UTF-8. Untuk teks berbahasa manusia, pakai `.chars()` atau crate `unicode-segmentation`.",
      },
      {
        t: "tip",
        text: "Aturan praktis: parameter fungsi pakai `&str`, field struct yang menyimpan teks pakai `String`. Untuk koleksi, parameter `&[T]` lebih fleksibel daripada `&Vec<T>`.",
      },
      {
        t: "quiz",
        q: "Signature mana yang paling fleksibel untuk fungsi yang hanya membaca teks?",
        options: ["`fn f(s: String)`", "`fn f(s: &String)`", "`fn f(s: &str)`", "`fn f(s: &mut str)`"],
        answer: 2,
        explain:
          "`&str` menerima literal, slice, dan `&String` (lewat *deref coercion*), tanpa mengambil kepemilikan.",
      },
      {
        t: "challenge",
        title: "Ambil domain email",
        task: "Lengkapi `domain` agar mengembalikan bagian setelah `@`. Output harus `rust-lang.org` lalu `(tidak valid)`.",
        code: `fn domain(email: &str) -> &str {
    match email.find('@') {
        Some(i) => todo!(),
        None => "(tidak valid)",
    }
}

fn main() {
    println!("{}", domain("ferris@rust-lang.org"));
    println!("{}", domain("bukan-email"));
}`,
        expect: ["rust-lang.org\n(tidak valid)"],
        hint: "`i` adalah posisi byte karakter `@`. Bagian setelahnya dimulai dari `i + 1`: `&email[i + 1..]`.",
        solution: `fn domain(email: &str) -> &str {
    match email.find('@') {
        Some(i) => &email[i + 1..],
        None => "(tidak valid)",
    }
}

fn main() {
    println!("{}", domain("ferris@rust-lang.org"));
    println!("{}", domain("bukan-email"));
}`,
      },
    ],
  },
];
