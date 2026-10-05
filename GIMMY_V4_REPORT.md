# Gimmy 0.4.0 — integrasi aset

5 Oktober 2026. Implementasi berdasarkan GIMMY_ASSET_INTEGRATION_PLAN.md.

## Hasil audit dan pilihan teknis

- Lima GLB memiliki rig `c_Gimiy` dengan 41 joint dan satu clip Sleep 01. Mesh bed dan karakter terpisah tetapi keduanya skinned. Sumber membawa albedo tubuh, normal, metallic/roughness dan mata. GLB belum menyediakan lima kondisi tidur atau kelopak tertutup yang tampak pada rangkaian PNG.
- Sleep 01–05 dan JSON ngengat/kecoak adalah proyek sprite berisi PNG base64, bukan Lottie atau clip skeletal. Seluruh sumber berhasil diunduh. Sleep 02/04/05 melampaui batas connector 256 MiB sehingga memakai jalur unduhan resmi Drive.
- Preview awal/tengah/akhir menunjukkan 01 tenang berbaring, 02 mengantuk, 03 mulai terganggu, 04 gelisah/marah, 05 bangun. Pemetaan ke Deep/Cozy/Light/Restless/Awake mengikuti visual ini.
- Tampilan menggunakan bed 3D dan karakter 2D animasi yang disediakan, sesuai format 2.5D. Mesh karakter duplikat dilepas dari salinan GLB runtime; skeleton dan bed dipertahankan. Sumber Drive tidak diubah. Ini bukan retarget lima JSON ke skeleton 3D.
- Figma meminta login dan frame desain tidak terbaca. Hierarki/artwork/font UI yang telah disetujui tetap menjadi acuan.

## Diterapkan

- Lima bed dengan thumbnail hasil render sumber, unlock berbasis poin, preview/pakai di Home, pilihan tersimpan dan pemulihan jika load gagal. Daun default.
- Lima background baru dan pilihan map visual, unlock 0/40/100/180/280 poin. Semua memakai tantangan yang sama; hak RainForest legacy dipertahankan. Poin tidak dibelanjakan.
- Animasi Sleep Meter: 80/50/25/0 sebagai batas kondisi, margin pemulihan 3 poin untuk menghindari perubahan bolak-balik, Awake segera pada nol. Loop tidur, ekspresi bangun sekali, pause, dan preferensi gerakan minimum.
- Atlas tidur Ringan berukuran 192×108 per frame pada 8 FPS; kualitas lain 384×216 per frame pada 12 FPS. Dua atlas tidur terakhir disimpan dalam cache, bukan semua sekaligus. Source tidak menetapkan FPS playback; timing runtime adalah keputusan implementasi, perlu playtest.
- Frame statis sumber tampil dulu saat state baru dimuat dan menjadi fallback bila atlas gagal. Reduced motion memakai frame statis.
- Sembilan PNG bug dalam Bug Guide. Ngengat, kumbang dan jangkrik menggunakan artwork baru; kecoak aktif sebagai makanan +10 Sleep. Nilai lama +10/+20/+15 dipertahankan. Jangkrik tetap berisiko suara −8 jika terlambat.
- Ngengat/kecoak animasi pada Seimbang/Tinggi, PNG dengan gerak sederhana pada Ringan. Feedback makanan menuju karakter; efek Sleep dan koleksi dibayar sekali saat event input, tanpa menunggu animasi.
- Lima bug lain ditandai belum tersedia, tidak mempunyai klaim efek/unlock palsu. Skin dan obstacle cuaca tetap tahap berikutnya sesuai rencana.
- Save v3 migrasi v1/v2, validasi pilihan terkunci/tidak dikenal, fallback save lama saat save baru rusak. XP, receipt, setting dan koleksi dipertahankan.
- Countdown 120/90/60/30/30, ambang level 0/40/100/180/280, reward milestone dan prioritas fatal dipertahankan.
- Test command dibatasi pada folder tests agar file test Node bawaan pada proyek terpisah `expression-shelf` tidak dianggap suite Vitest. Folder tersebut tidak diubah atau dimasukkan rilis.

## Ukuran runtime

| Aset | Ukuran |
|---|---:|
| Bed Daun | 0.58 MB |
| Bed Ranting | 3.86 MB |
| Bed Goa | 0.59 MB |
| Bed Kasur | 0.62 MB |
| Bed Hamok | 0.69 MB |
| Background per map | 0.15–0.20 MB |
| Atlas tidur Ringan per kondisi | 0.36–0.95 MB |
| Atlas tidur normal per kondisi | 1.34–3.72 MB |
| Atlas ngengat/kecoak normal | 0.38 / 0.24 MB |

Hanya bed aktif dan animasi yang diperlukan dimuat. Frame statis kecil, thumbnail dan UI terpisah. Ranting paling besar karena geometry; tetap di bawah target bed 6 MB. Aset mentah tidak diterbitkan.

## Verifikasi

- 32 unit tests: aturan/countdown lama, kondisi tidur/hysteresis, unlock, migrasi/save rusak, pilihan invalid dan receipt.
- 66 browser checks lama: input sentuh, pause, kamera, lima countdown sukses, poin gagal tetap tersimpan, restart dan layout.
- 47 browser checks aset: semua bed/map, reload pilihan, lima kondisi/ekspresi, kecoak dengan sentuhan, viewport 360×640/390×844/844×390/1440×900, gagal load/retry, empat bed/map terkunci bagi pemain baru, mobile mengambil atlas Ringan.
- Sepuluh pergantian bed menjaga geometry aktif ≤1 dan texture aktif ≤4 menurut renderer.info.memory. Ini memverifikasi resource GPU terkelola, bukan sertifikasi seluruh heap atau perangkat fisik.
- Screenshot Home/bed/gameplay ditinjau; karakter berada pada tempat tidur, Play tidak bertumpuk dengan My Bed pada viewport yang diuji.
- Build TypeScript/Vite produksi dan smoke test live diperiksa saat rilis.

## Batas

Belum ada playtest manusia untuk balancing, pengukuran FPS perangkat fisik, atau audit layout Figma. Timing frame dan penempatan 2D/3D dapat disempurnakan lewat feedback pengguna. Tidak mengklaim animasi makan skeletal; reaksi menggunakan gerak makanan dan perubahan kondisi tidur. Map berbeda baru mengubah latar, bukan obstacle atau aturan. Artwork daun/katak masih sementara. Semua aset sumber tetap di Drive.
