# Gimmy : The Little Tarsius — Improvement Plan v3.1

Tanggal: 1 Oktober 2026. Status: diimplementasikan pada versi 0.3.0; lihat GIMMY_V3_REPORT.md untuk cakupan dan verifikasi aktual. Mengacu pada kode prototipe saat ini, arahan pengguna, audit visual aset Drive terbaru, dan referensi desain di bagian 3. Angka balancing adalah usulan untuk playtest, bukan hasil eksperimen pengguna.

## 1. Arah perubahan

Ganti mode bertahan tanpa batas dengan tantangan menjaga tidur hingga countdown mencapai 00:00. Sleep Chain menunjukkan WAKTU TERSISA; Sleep Meter menunjukkan KONDISI TIDUR. Kedua nilai memiliki fungsi berbeda: makanan memulihkan Sleep, tidak menambah waktu.

Keputusan yang sudah pasti:

- Identitas resmi tetap **Gimmy : The Little Tarsius**; karakter 3D, lingkungan 2.5D.
- Durasi Level 1 = 02:00; Level 2 = 01:30; Level 3 = 01:00; Level 4 = 00:30; Level 5 = 00:30. Batas tertinggi Level 5.
- Kesulitan meningkat saat waktu tersisa berkurang: obstacle lebih rapat dan bergerak lebih cepat.
- Jika Sleep habis sebelum tujuan tercapai, Gimmy bangun dan sesi gagal.
- Poin yang sudah tersimpan tidak hangus ketika gagal; bangun tidak memberi bonus.
- Poin tersimpan berada di atas Sleep Chain; Sleep Meter di bawah layar.
- Seluruh UI memakai aset yang ditentukan pengguna. Header/H1/H2 memakai Slackey; body, label, poin dan countdown memakai Sniglet Regular. Tulisan yang sudah menyatu dalam PNG tetap mengikuti artwork.
- Implementasi pertama dituning pada Forest. Level 1–3 dibuat dan diuji lebih dulu; konfigurasi Level 4–5 disiapkan dalam rencana ini dan diaktifkan setelah tuning dasar lulus.

**Keputusan pengguna:** naik level berdasarkan akumulasi poin, maksimal Level 5. Ambang ditetapkan dalam bagian 6. Level 4 dan 5 sama-sama berdurasi 30 detik, tetapi Level 5 memiliki gangguan lebih rapat, cepat, dan kombinasi lebih sulit. Kesuksesan mencapai 00:00 tetap tujuan sesi, bukan syarat tambahan untuk naik level.

## 2. Audit aset dan penempatan GUI

Folder sumber: [UI di Drive](https://drive.google.com/drive/folders/1SPKg5qhaOuKCTicdUI2NZHVpi_wEnTD8). Aset UI dan Sniglet di bawah sudah dibaca/ditinjau pada 1 Oktober 2026. Slackey.zip juga telah diperiksa: Slackey-Regular.ttf dan LICENSE.txt (Apache 2.0). Nama huruf besar-kecil asli dicatat agar tidak salah memilih versi.

| Komponen | Aset yang dipakai | Hasil audit dan rencana |
| --- | --- | --- |
| Mulai bermimpi / Play | `play-button.png` · 1024×466 | Teks Play menyatu dalam gambar. Jadikan gambar di dalam tombol semantik; jangan menumpuk label visual kedua. Tetap membuka pilihan kualitas sebelum mulai. |
| Bug Book | `bug-guide.png` · 1080×1080 | Gunakan versi bernama tepat ini, bukan Bug Guide2. Label Bug Guide/Learn more sudah menyatu. Buka panduan makanan dan gangguan yang diperbarui. |
| Cara bermain | `Info.png` · 720×720 | Ikon buku dan tulisan Info menjadi tombol bantuan. Lingkaran jingga dalam aset bukan indikator pesan baru. |
| Penjaga mimpi / level | `level.png` · 1024×332 | Versi baru berupa portrait kiri dan panel kosong kanan. Gunakan Slackey untuk judul `Gimmy`, Sniglet Regular untuk `Level N / 5`, target durasi, dan progres poin ke level berikutnya; hilangkan label Penjaga Mimpi lama yang tidak cocok dengan panel. |
| Dunia saat ini | `new map/map-forest.png` · 1080×1080 | Kartu Forest tersedia, tetapi masih memuat `NEW WORLD` dan `Unlock at Lv. 8`. Gunakan ilustrasi/bingkainya; perbaiki area teks menjadi `Forest · Aktif`. Tidak boleh menampilkan syarat Lv. 8 pada game maksimal Lv. 5. |
| Sleep Chain | `sleep-chain.png` · 1780×1080 | Versi baru, ID `1Ajnd32FcXSrwXJ5QjU42NvfxaMsZW_wu`, sudah tidak memuat angka timer. Pertahankan judul gambar; letakkan angka countdown di ruang cokelat bawah judul, tanpa menutupi Gimmy kiri atau kunang-kunang kanan. Jangan gunakan versi lama `Sleep Chain.png`. |
| Pengaturan | `Setting.png` · 720×720 | Tombol gambar, label aksesibel Pengaturan. Membuka menu saat gameplay harus menjeda waktu, gerak, dan damage. |
| Poin tersimpan | Komponen baru | Panel kayu gelap ringkas, garis emas hangat, ikon kunang-kunang/berlian dan angka Sniglet. Format `Poin tersimpan 125`; tambahan `+5` muncul singkat ketika milestone dibayar. Di atas Sleep Chain, bukan menempel ke Sleep Meter. |
| Font heading | `Fonts/Slackey.zip` | Header/H1/H2 memakai Slackey. File ditemukan di Drive, ID `1_FcjTm6CSUkwqYbjPWnDDH5XvNLqwXRn`; isi telah diperiksa: Slackey-Regular.ttf dan LICENSE.txt (Apache 2.0). Host lokal dan gunakan font-display: swap. |
| Font body | `Fonts/Sniglet.zip` | Arsip sudah diperiksa: Sniglet-Regular.ttf, Sniglet-ExtraBold.ttf, OFL.txt (SIL OFL 1.1). Gunakan hanya Regular untuk body, label, angka poin dan countdown; ExtraBold tidak dipakai. Simpan lisensi bersama font runtime. |
| Latar/pohon | `Background Map/bg-1/map1.png` · 2096×1098 | Satu gambar landscape tanpa alpha. Pohon, sarang, dan hutan sudah menyatu; bukan layer pohon terpisah. Pakai gambar ini sebagai dasar scene, bukan foto latar versi lama. |

Semua PNG UI memiliki alpha, tetapi margin transparan besar dan tepi gelap perlu diperiksa di latar sebenarnya. Hit area mengikuti artwork terlihat, minimum rancangan 48×48 CSS px; margin transparan tidak boleh membuat tombol terasa kecil. Simpan source asli, buat salinan runtime teroptimasi saat implementasi. Koreksi tulisan kartu Forest dilakukan di salinan UI tanpa mengubah sumber Drive.

### Layout yang direncanakan

**Home desktop:** level di kiri atas, logo di tengah atas, kartu Forest di kanan atas, Settings di pojok aman. Gimmy/sarang menjadi fokus tengah. Play di bawah sarang, Bug Guide dan Info di bawah/samping. Tidak menampilkan HUD countdown aktif sebelum bermain.

**Gameplay desktop:** panel level ringkas kiri atas, Forest kanan atas, Settings/Pause tetap mudah dicapai. Kolom poin → Sleep Chain di sisi kiri di luar lintasan obstacle. Area tengah bebas untuk Gimmy dan interaksi. Sleep Meter berada di bawah tengah dengan safe area; ranting pengalih berada tepat di atasnya.

**Gameplay portrait:** level kiri atas dan pengaturan kanan atas; kartu Forest ringkas pada area header. Poin tersimpan lalu Sleep Chain disusun vertikal di zona atas. Target tinggi gabungan HUD maksimum sekitar 28–30% viewport setelah margin alpha aset dipangkas secara layout. Area bermain di tengah; Sleep Meter 16–24 px di atas safe-area bawah. Ranting tetap terpisah dari meter dan tidak tertutup jari. Countdown terbaca minimal sekitar 28 px, label utama 14–16 px.

**Landscape ponsel:** kolom HUD di kiri, area interaksi di tengah/kanan, meter bawah area permainan. Tidak mengecilkan semua UI dari layout portrait secara seragam.

Koordinat overlay Sleep Chain awal (terhadap PNG asli sebelum pemangkasan): pusat timer sekitar x=60%, y=63%, area teks x=41–75%, y=53–69%. Panel level: teks mulai x≈34%, lebar maksimum 60%; portrait kiri tetap bebas. Nilai ini anchor awal untuk verifikasi visual pada ukuran nyata, bukan posisi pixel final.

### Komposisi scene 2.5D

- Gambar `map1.png` memakai aspect ratio asli; tidak diregangkan. Sarang sekitar x=47%, y=58% menjadi anchor Gimmy. Posisi dan skala model dihitung dari transform gambar, bukan persen viewport yang terpisah.
- Pada portrait gunakan crop dengan focal point sarang; cek kepala, tangan, dan area interaksi tetap masuk layar saat zoom maksimum. Pada desktop manfaatkan lebar landscape baru untuk mengurangi sayap blur lama.
- Karena pohon menyatu dengan latar, tahap pertama tidak menjanjikan parallax pohon independen atau occlusion daun depan yang belum tersedia. Haze dan partikel dapat menjadi lapisan terpisah. Ekstraksi foreground/cutout hanya jika diperlukan setelah komposisi dasar benar.
- Haze ringan, kunang-kunang dekoratif tidak menyerupai obstacle interaktif. Kualitas ringan mengurangi efek visual saja; timer dan pola gameplay sama.
- Zoom low Sleep/idle dari keputusan sebelumnya dipertahankan; tidak diperbesar hanya karena timer hampir habis. Kamera dibekukan selama drag, HUD tidak ikut zoom. Saat ancaman aktif, batasi zoom agar seluruh target tetap terlihat.

## 3. Hasil research dan penerapannya

1. **Pacing yang terbaca.** Presentasi Michael Booth/Valve menjelaskan pengaturan populasi ancaman dengan fase build-up, peak, dan recovery; juga membedakan pacing dari difficulty. Untuk Gimmy, prinsip yang diambil adalah membatasi ancaman aktif dan memberi ruang menyelesaikan interaksi sebelum ancaman berikutnya. Countdown Gimmy tetap menaikkan intensitas secara keseluruhan, bukan menyalin siklus panjang Left 4 Dead. [Sumber primer, hlm. 78–81 dan 91](https://steamcdn-a.akamaihd.net/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf).
2. **Input yang adil.** Game Accessibility Guidelines menyarankan target sentuh besar, alternatif kontrol sederhana, bantuan untuk tuntutan timing presisi, serta latihan. Penerapannya: warning visual sebelum dampak, target minimum rancangan 48 px, alternatif keyboard/ketuk untuk drag, jeda, dan mode latihan tanpa progres. [Sumber](https://gameaccessibilityguidelines.com/full-list/).
3. **Inferensi desain untuk proyek ini:** sisa waktu absolut tidak cocok sebagai satu-satunya pemicu kesulitan, karena durasi level bervariasi dari 120 hingga 30 detik. Gunakan persentase perjalanan sesi. Semua angka durasi reaksi, damage, interval, dan reward di bawah merupakan hipotesis desain Gimmy yang harus diuji, bukan angka yang diklaim dari penelitian tersebut.

## 4. Aturan sesi, sukses, dan gagal

Alur: Home → pilih level yang terbuka → pilih kualitas → cue siap 3–2–1 (di luar durasi) → Playing → Success atau Failed → hasil → mainkan level yang terbuka / ulang / Home. Pilihan level dibatasi akumulasi poin, bukan hasil sukses saja.

- Mulai setiap percobaan: Sleep 80/100, countdown sesuai level, obstacle kosong. Makanan tidak pernah memperpanjang countdown.
- Sukses: waktu tersisa mencapai nol dan Gimmy masih tidur. Hentikan spawn, damage, input gameplay dan countdown; tampilkan `Mimpi terjaga!`.
- Gagal: Sleep mencapai nol sebelum selesai. Hentikan simulasi dan jalankan clip bangun; tampilkan sisa waktu dan penyebab terakhir. Tombol Ulang mengulang level ini.
- Resolusi batas waktu memakai waktu kejadian, bukan urutan frame browser. Damage dengan timestamp ≤ deadline diselesaikan lebih dulu; apabila Sleep menjadi nol tepat pada deadline, hasil Gagal. Damage setelah deadline tidak diterapkan. Hasil hanya diputuskan sekali.
- Countdown tampilan memakai ceil: sisa 0,2 detik tetap `00:01`; `00:00` hanya ditampilkan ketika kondisi akhir benar-benar tercapai.
- Pause, Settings, tutorial awal, tab tersembunyi, dan hilang fokus membekukan seluruh clock. Input tidak memberi poin saat pause/results. Setelah resume ada cue singkat sebelum gameplay berjalan lagi.
- Keluar sesi menyimpan poin milestone yang sudah dibayar tetapi tidak mencatat sukses. Reload tidak memberi reward ganda; percobaan yang belum selesai diulang dengan countdown penuh.
- Level 5 selesai → hasil `Tantangan Level 5 selesai`; pilihan ulang level 5 atau level terdahulu, tanpa Level 6. Label `Semua tantangan selesai` hanya muncul jika kelima level tercatat pernah berhasil, sebab level dapat terbuka lewat poin dari percobaan gagal.

## 5. Kurva tantangan Level 1–5

Semua interval berikut khusus **gangguan berbahaya**, bukan makanan. Kecepatan didefinisikan sebagai persentase lintasan menuju titik dampak per detik sehingga tidak berubah karena resolusi layar. Jenis yang diam seperti katak memakai waktu warning ke dampak. Satu kejadian memberi damage satu kali.

| Level | Durasi | Jarak antar spawn gangguan: awal → akhir | Waktu dari muncul ke dampak: awal → akhir | Maks. gangguan aktif | Pola utama |
| --- | --- | --- | --- | --- | --- |
| 1 | 02:00 | 10 → 6 detik | 6 → 4,5 detik | 2 | Daun tunggal; jangkrik berisik setelah 40% sesi; katak setelah 65% |
| 2 | 01:30 | 8 → 4,5 detik | 5,5 → 4 detik | 2 | Daun dari dua jalur; jangkrik; katak bergiliran |
| 3 | 01:00 | 6 → 3 detik | 4,5 → 3 detik | 3 | Kombinasi daun + katak, paling banyak dua jenis tugas bersamaan |
| 4 | 00:30 | 3,5 → 1,8 detik | 3,5 → 2,2 detik | 3 | Daun ganda dengan jeda, jangkrik/katak di sela; tanpa mekanik baru |
| 5 | 00:30 | 2,5 → 1,2 detik | 3 → 2 detik | 4 | Durasi sama dengan L4; kombinasi daun ganda + jangkrik/katak, lane bergantian, lebih rapat tanpa menumpuk sarang |

Contoh kecepatan efektif akhir: Level 1 = 22,2% lintasan/detik; Level 3 = 33,3%; Level 5 = 50%. Warning termasuk dalam total waktu ke dampak, bukan tambahan tak tercatat. Jarak visual minimum dan deadline disesuaikan bersama agar kecepatan benar-benar terlihat, bukan sekadar timer obstacle dipendekkan.

Formulasi usulan:

- `progress = clamp(1 - remaining / duration, 0, 1)`.
- `intensity = smoothstep(0.15, 0.95, progress)`; transisi terus-menerus, tidak tiba-tiba berpindah kecepatan.
- `spawnInterval = lerp(startInterval, endInterval, intensity)`; variasi terbatas ±10%, tidak boleh melanggar minimum.
- `impactTime = lerp(startImpactTime, endImpactTime, intensity)`.
- Kuota aktif 1 pada fase awal, bertambah bertahap menuju batas tabel. Level 4–5 boleh mulai dengan kuota 2 setelah cue siap.
- State obstacle yang sudah muncul tidak dipercepat mendadak saat threshold berubah. Kecepatan ditetapkan saat spawn; obstacle berikutnya mengikuti intensitas terbaru.

Fase level: 0–20% pengenalan/pemanasan; 20–70% peningkatan; 70–100% puncak. Dalam tiap sesi kepadatan target meningkat, tetapi total obstacle sepanjang sesi tidak harus lebih banyak pada level yang jauh lebih singkat.

Level 1: tutorial terpisah sebelum clock berjalan; gangguan pertama setelah 8 detik. Level 2–3: grace 3 detik. Level 4–5: grace 1 detik setelah cue siap. Hindari tutorial teks baru di dalam sesi 30 detik. L5 akhir memiliki spawn sekitar 50% lebih sering daripada L4 (interval 1,2 vs 1,8 detik), waktu reaksi lebih pendek (2 vs 2,2 detik), dan satu slot ancaman tambahan. Damage tiap jenis tetap sama agar tantangan datang dari kombinasi, bukan hukuman tersembunyi.

### Obstacle dan makanan

| Objek | Peran / interaksi | Efek usulan | Kendali director |
| --- | --- | --- | --- |
| Daun | Geser menjauh dari sarang; alternatif ketuk lalu pilih arah buang | −12 Sleep bila mengenai sarang | Lane kiri/tengah/kanan; tidak spawn tepat di atas jari |
| Jangkrik | Tangkap untuk makanan sebelum suara muncul | +15 jika ditangkap; −8 jika berbunyi | Makanan berisiko, dihitung sebagai gangguan ketika dijadwalkan director; tidak masuk spawn makanan aman |
| Katak | Warning gelembung/suara → ketuk ranting | −18 jika tidak dialihkan | Maksimum satu katak aktif; tombol ranting tidak berpindah saat disentuh |
| Daun ganda | Dua daun dengan jeda minimum 0,6 detik | Masing-masing −12 | Mulai Level 4; memakai dua slot kuota, bukan satu |
| Ngengat | Ketuk/geser ke sarang | +10 Sleep | Makanan aman; tidak memberi damage bila terlewat |
| Kumbang | Ketuk/geser ke sarang, bergerak lebih pelan | +20 Sleep | Makanan aman bernilai tinggi, frekuensi lebih rendah |

Campuran gangguan setelah semua jenis diperkenalkan: L1 70% daun/20% jangkrik/10% katak; L2 55/25/20; L3 50/25/25; L4–5 50/25/25 dengan sebagian daun berupa pasangan terjadwal. Angka bobot diterapkan pada pool valid; pengenalan jenis dan cooldown mengalahkan bobot acak.

Makanan aman: L1 setiap 8 detik; L2 7; L3 6; L4 4,5; L5 3. Maksimum dua makanan aman aktif. Rasio ngengat:kumbang awal 75:25. Masa kesempatan makanan minimum 4 detik; tidak ikut dipercepat agresif bersama gangguan.

Sleep awal 80, maksimum 100. Drain pasif usulan 0,6 per detik pada seluruh level agar kenaikan tantangan terutama berasal dari gangguan. Evaluasi keseimbangan dengan `Sleep akhir = 80 − drain × waktu + makanan diterima − damage`, dibatasi 0–100. Pada Level 4–5, drain pasif total 18: pemain idle harus tetap gagal akibat kombinasi gangguan; jadwal akhir wajib diuji untuk memastikan ini, bukan sekadar mempercepat animasi.

### Batas fairness

- Maksimum satu instruksi drag aktif pada target yang sedang dipegang; tidak mewajibkan multi-touch untuk menyelesaikan kombinasi.
- Pisahkan deadline ancaman sekurangnya 0,65 detik; untuk tutorial L1 1 detik. Jika kuota penuh, tunda/gugurkan spawn tersebut, jangan menabung burst tersembunyi.
- Tidak ada target di bawah HUD, di luar viewport, atau sepenuhnya tertutup model/efek. Area spawn tetap aman pada zoom maksimum.
- Sebelum spawn, cek sisa waktu cukup untuk warning dan dampak. Tidak membuat ancaman yang mustahil terjadi sebelum selesai; kepadatan akhir berasal dari ancaman yang sudah dijadwalkan. Success menyapu sisa dekorasi/objek tanpa damage.
- Hindari hukuman beruntun tanpa kesempatan pulih: setelah dua dampak dalam satu detik, tunda spawn baru 0,8 detik. Ancaman yang sudah terlihat tetap konsisten; tidak mengubah damage diam-diam.
- Gunakan beberapa pola yang teruji dan seeded randomness. L4–5 adalah kombinasi mekanik lama, bukan kejutan aturan baru.
- Mode latihan opsional memperlambat simulasi dan tidak mengubah progres resmi; durasi challenge normal tetap sesuai arahan pengguna.

## 6. Level, poin tersimpan, dan migrasi

Level ditentukan oleh **total poin sepanjang permainan**, bukan jumlah kemenangan. Poin tidak dikonsumsi saat naik level; jika kelak ada pembelian, pisahkan saldo belanja dari total poin progres agar level tidak turun.

| Level terbuka | Total poin minimum | Tambahan dari ambang sebelumnya | Durasi |
| --- | --- | --- | --- |
| 1 | 0 | — | 02:00 |
| 2 | 40 | +40 | 01:30 |
| 3 | 100 | +60 | 01:00 |
| 4 | 180 | +80 | 00:30 |
| 5 | 280 | +100 | 00:30, obstacle lebih sulit |

Ambang awal ini setara dengan 2, 3, 4, lalu 5 sesi sukses jika selalu memainkan level tertinggi dan setiap sesi menghasilkan 20 poin. Akumulasi dari percobaan gagal juga dihitung. Angka ini ditetapkan sebagai baseline implementasi dan dapat dituning lewat playtest; bukan aturan yang sudah diuji pada pemain.

Milestone memakai persentase durasi: 25%, 50%, 75%, 100%; masing-masing +5 poin, total 20 untuk sesi sukses. Milestone terakhir adalah penyelesaian chain, bukan bonus bangun. Tidak ada poin per tap atau bonus ketika bangun.

| Level | Waktu tersisa ketika milestone dibayar |
| --- | --- |
| 1 | 01:30, 01:00, 00:30, 00:00 |
| 2 | 01:07,5; 00:45; 00:22,5; 00:00 |
| 3 | 00:45, 00:30, 00:15, 00:00 |
| 4 | 00:22,5; 00:15; 00:07,5; 00:00 |
| 5 | 00:22,5; 00:15; 00:07,5; 00:00 |

UI tetap MM:SS; milestone pecahan diproses pada clock internal. Gagal setelah milestone kedua menyimpan 10 poin. Milestone bertepatan dengan damage fatal tidak dibayar; reward 100% hanya melalui Success.

Aturan transisi:

- `unlockedLevel` diturunkan dari ambang total poin dan dibatasi 5. `runLevel` disalin saat mulai sesi dan tidak berubah selama sesi tersebut.
- Poin langsung dibayar/disimpan ketika milestone tercapai. Jika ambang terlewati di tengah sesi, level berikutnya terbuka tetapi durasi, kecepatan, dan pola sesi aktif tetap memakai runLevel lama.
- Contoh: total 35 poin, sedang Level 1. Milestone pertama membuat total 40 dan membuka Level 2. Sesi Level 1 tetap berjalan sampai berhasil/gagal/keluar. Di hasil/Home tampil `Level 2 terbuka — target 01:30`; sesi berikutnya dapat memakai Level 2 meskipun sesi tadi gagal.
- Menu menampilkan level tertinggi terbuka dan progres `35/40 poin menuju Level 2`; Level 5 menampilkan `Level maksimum`. Dalam gameplay panel menunjukkan level sesi, agar tidak berbeda dari durasi yang sedang dimainkan.
- Ulang level lama tetap diizinkan; tombol main berikutnya menawarkan level tertinggi yang terbuka. Membuka level tidak otomatis memulai sesi baru.
- Pembayaran dijaga satu kali per kombinasi runId + milestone. Level 5 tetap mengakumulasi poin, tanpa Level 6.

Replay menghasilkan poin baru per run, termasuk pada level lama. Level pendek memberikan poin/menit lebih tinggi; diterima sebagai baseline tanpa leaderboard/keunggulan statistik. Evaluasi kembali ekonomi sebelum menambahkan pembelian map/bed.

Migrasi save v1 → v2 mempertahankan XP lama sebagai totalPoints, jumlah bug, rekor tidur lama, dan pengaturan. Turunkan unlockedLevel langsung dari poin lama; jangan memaksa mulai Level 1 atau menghapus poin. Contoh 110 XP lama → Level 3 terbuka. Rekor lama diberi label mode lama, bukan bukti sukses countdown. Tutorial kontrol dapat ditawarkan terpisah tanpa mereset progression. Simpan completedChallenges sebagai catatan pencapaian saja, bukan gerbang level. Pertahankan unlock Rainforest lama, tetapi tuning challenge versi ini menggunakan Forest.

## 7. Tahap pengembangan

| Tahap | Pekerjaan | Keluaran / syarat selesai |
| --- | --- | --- |
| 1. Aset & layout | Manifest versi gambar, alpha/padding, Slackey + Sniglet Regular lokal, tombol gambar, panel level, map Forest, poin di atas Chain, meter bawah | Preview Home/gameplay pada desktop, portrait, landscape; tulisan Lv.8 sudah dikoreksi |
| 2. Scene baru | Integrasi map1.png, anchor sarang/model, crop responsive, batas zoom, haze | Gimmy tidak bergeser dari sarang saat resize/zoom dan target tidak tertutup |
| 3. Countdown & hasil | Timer presisi, Success/Failed, pause penuh, batas waktu simultan, reward persentase, migrasi save | Uji deterministik timer/reward/migrasi lulus |
| 4. Level 1–3 | LevelConfig, obstacle director, makanan aman, warning, tutorial, pola seeded | Satu sesi lengkap masing-masing level playable; semua tugas dapat diselesaikan dengan satu pointer |
| 5. Tuning Level 1–3 | Playtest mouse/touch, simulasi idle/perfect/miss, ukur beban target | Kesulitan meningkat dan penyebab gagal terbaca; angka tabel diperbarui berdasarkan bukti |
| 6. Level 4–5 | Aktifkan pola cepat/ganda dengan durasi sama 30 detik dan intensitas L5 lebih tinggi | Tidak ada kemenangan idle/forced failure akibat overlap; hasil Level 5 tidak membuat Level 6 |
| 7. Verifikasi rilis | Build, browser, perangkat fisik, aset/jaringan, publikasi dan smoke test | Rilis hanya setelah implementasi diminta; tugas planning ini tidak mengubah live |

Perubahan kode direncanakan pada `src/gimmy/rules.ts` (ganti SleepRun endless), `main.ts` (pisahkan orkestrasi UI dan loop), `scene.ts` (anchor scene), `style.css` (image-based GUI). Tambahkan modul terpisah untuk konfigurasi level, countdown run, obstacle director, dan progress storage. Jangan menambah semua aturan baru ke satu file main.

## 8. Validasi dan kriteria penerimaan

- Countdown tepat 120/90/60/30/30 detik pada 30/60 FPS; timeout browser/hidden tidak memberi catch-up burst. Simulasi berbasis clock aktif/fixed step, bukan pengurangan frame count atau clamp dt yang memperpanjang level pada perangkat lambat.
- Uji tepat sebelum, tepat saat, dan sesudah deadline: fatal damage, input makanan, dan milestone; terminal state hanya sekali.
- Poin tetap setelah gagal/reload/keluar; level terbuka tepat pada ambang 40/100/180/280 poin, termasuk dari sesi gagal; runLevel tidak berubah di tengah sesi; batas level 5; migrasi tidak menghapus data lama.
- Interval, kecepatan, kuota, campuran, dan deadline overlap sesuai konfigurasi. Perfect-input bot dapat menyelesaikan setiap seed; idle bot harus gagal pada semua level dalam kumpulan seed uji. Bot hanya validasi logika, bukan bukti bahwa manusia menikmati/menyelesaikan game.
- Simulasi awal 100 seed per level: tidak ada target di luar layar, overlap mustahil, timer/hasil ganda, atau kemenangan tanpa input. Jadikan hasil ini dasar revisi jumlah gangguan terutama Level 4–5.
- Playtest awal minimal 5 pemain baru di L1–3 dan 5 pemain yang sudah mengenal kontrol di L4–5. Target eksplorasi keberhasilan percobaan awal: L1 80–90%, L2 65–80%, L3 50–65%, L4 35–50%, L5 25–40%; bukan hasil ukur atau sign-off statistik. Catat percobaan ulang dan alasan gagal, jangan mengejar persen semata.
- Ukuran uji: 360×800, 390×844, 844×390, 1366×768, 1920×1080. Minimum font penting terbaca; target ≥48 px; fokus keyboard, alternatif drag, pointercancel, safe areas dan modal pause benar.
- Satu ponsel Android kelas menengah fisik dan desktop diuji sebelum sign-off performa; kualitas rendah menargetkan 30 FPS, desktop 60 FPS. Catat model perangkat, browser, frame time p95 dan input misses. Kualitas grafis tidak mengubah durasi/kurva level.
- PNG tidak terdistorsi, area teks tidak menabrak ilustrasi, countdown tidak bergeser saat digit berubah, tidak ada salinan timer/label yang sudah baked-in.

## 9. Keputusan final dan pekerjaan aset lanjutan

1. Progression berdasarkan poin disetujui; baseline ambang 0/40/100/180/280 ditetapkan untuk implementasi. Menang tidak menjadi syarat tambahan membuka level.
2. Header/H1/H2 memakai Slackey; body, label, poin dan countdown memakai Sniglet Regular. Slackey.zip tersedia pada folder Fonts di Drive.
3. Tekstur tubuh dan kelopak mata final masih menyusul, tidak menghalangi improvement UI/mekanik.
4. Level 5 menjadi 00:30 dengan obstacle lebih sulit daripada Level 4. Durasi final 120/90/60/30/30 detik, maksimum Level 5.
5. Reward, interval, speed dan target keberhasilan tetap parameter playtest. Tidak ada pertanyaan desain yang menghalangi implementasi dasar.

Planning v3.1 menggantikan asumsi progression berbasis kemenangan dan durasi Level 5 selama 15 detik pada v3. Implementasi game mengikuti keputusan ini. Dokumen sumber Drive tetap dipertahankan; laporan hasil ada di GIMMY_V3_REPORT.md.
