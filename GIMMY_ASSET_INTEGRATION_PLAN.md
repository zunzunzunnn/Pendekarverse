# Gimmy — rencana integrasi aset baru

Tanggal: 5 Oktober 2026. Status: diimplementasikan pada 0.4.0; lihat GIMMY_V4_REPORT.md untuk hasil dan batas verifikasi. Baseline: game 0.3.0, commit 501435d. Bagian berikut mempertahankan rencana awal agar keputusan dapat ditelusuri; audit aktual menemukan JSON sprite PNG, satu clip Sleep 01 pada tiap GLB, dan sumber tekstur warna tubuh. Desain Figma meminta login sehingga layout belum diaudit.

## 1. Tujuan dan keputusan tetap

Menerapkan karakter tidur yang lebih ekspresif, bed 3D, ilustrasi/animasi makanan, dan background baru dalam game 2.5D yang sudah dapat dimainkan. Penerapan dilakukan bertahap agar sumber berukuran besar tidak membebani ponsel.

- Judul tetap Gimmy : The Little Tarsius.
- Level tantangan 1–5 berbeda dari lima kondisi tidur. Level ditentukan poin; kondisi tidur ditentukan Sleep Meter.
- Durasi tantangan tetap 120/90/60/30/30 detik. Level 5 lebih sulit daripada Level 4.
- Ambang level tetap 0/40/100/180/280 poin. Empat milestone memberi 5 poin masing-masing; poin tersimpan saat gagal, bangun tidak memberi bonus.
- Target tetap countdown 00:00 dengan Sleep di atas nol. Teks konsep lama tentang bertahan tanpa batas tidak mengganti keputusan countdown pengguna.
- Level sesi tetap terkunci saat sesi mulai. Unlock berikutnya berlaku pada sesi berikutnya.
- Slackey untuk heading, Sniglet Regular untuk body. Kualitas dipilih sebelum mulai; pilihan manual dapat mengganti rekomendasi perangkat.
- Model baru memakai material aslinya jika tersedia dan valid. Jika albedo/kelopak mata belum tersedia, keterbatasan dicatat; tidak menganggap sumber baru otomatis menyelesaikannya.

## 2. Inventaris sumber

| Kelompok | Sumber | Isi dan ukuran sumber | Tindakan |
|---|---|---|---|
| Bed dan karakter | [3D Model/Bed](https://drive.google.com/drive/folders/1lrzSVho0oKL5RLRvZZQqOyT3PILe9iHY) | BED_DAUN 37.1 MB, BED_RANTING 41.7 MB, BED_KASUR 52.6 MB, BED_HAMOK 53.4 MB, BED_GOA 56.4 MB | Audit rig, mesh, material, animasi, pivot, skala, dan ekspresi; buat salinan runtime |
| Kondisi tidur | [json](https://drive.google.com/drive/folders/124AJKATbgfLEY4I8Pw0N7cu-QSx6uv55) | Sleep 01–05 JSON, sekitar 201–399 MB per file | Periksa format sebelum memilih loader/konversi; jangan menganggap JSON adalah Lottie atau clip Three.js |
| Animasi makanan | [json/bugs](https://drive.google.com/drive/folders/1rFSvTF1r1_EL3s2e4IGLx7jvNiF23VtK) | Ngengat 120.6 MB, kecoak 66.7 MB | Audit format, frame, gambar tertanam, transparansi dan lisensi/sumber; optimasi |
| Gambar makanan | [UI/Bugs/PNG Files](https://drive.google.com/drive/folders/1yNLRlXIrzR0CJrGQNo7_ndBGVMx5-qoM) | 9 PNG: kecoa, kumbang, laba-laba, ngengat, rayap, semut, ulat, belalang, jangkrik | Crop hanya margin transparan, pertahankan artwork, WebP; PNG menjadi fallback |
| Latar | [UI/Background Map/Map Background](https://drive.google.com/drive/folders/1DeWK-kx8vwZV0br4odH0aNC03yk8Cfah) | Forest, RainForest, Village, Tree Canopy, Dream World JPG | Audit dimensi, anchor bed, area interaksi dan crop portrait/landscape |
| Desain | [Figma Gimiy](https://www.figma.com/design/HhlFAm0RGdoIJthbxkzCfh/Gimiy-Test?node-id=0-1) | Link dari dokumen Drive | Baca frame aktual saat implementasi; catat perbedaan dengan game dan aturan pengguna |
| Brief | [Copy of gimiy test game](https://docs.google.com/document/d/1h9IbU8rHNhprR-TffP2Fcx_duVJloeyqfmsAJYDi45A/edit) | Ditambah Sleep 01–05, bugs PNG/JSON, bed GLB satu rig; koleksi bug/bed/skin | Gunakan sebagai arahan aset; konflik aturan diselesaikan dengan keputusan pengguna terbaru |

Ukuran memakai MB desimal dari metadata Drive. Sumber tetap utuh di Drive; file mentah disimpan di folder lokal yang diabaikan Git. Hanya hasil runtime yang diterbitkan.

## 3. Audit dan optimasi sebelum integrasi

Mulai dari BED_DAUN dan satu JSON tidur sebagai sampel, lalu audit seluruh file sebelum pemetaan final. Inventaris mencatat hash sumber, nama clip, durasi, loop, skeleton, bone, morph, ukuran tekstur, vertex, draw call dan ukuran hasil.

1. Jika lima GLB membawa karakter yang sama, validasi kesamaan skeleton/bind pose/material terlebih dahulu. Pisahkan karakter bersama dan bed hanya jika hasil visual/animasi tetap benar. Jika tidak memungkinkan, muat satu GLB terpilih, jangan lima sekaligus.
2. Tentukan apakah lima kondisi tidur sudah ada di GLB. Jika lengkap, gunakan clip GLB; JSON menjadi referensi, tidak diunduh saat bermain. Jika belum, periksa format JSON dan konversi kondisi yang hilang ke format yang cocok. Alternatif sprite hanya untuk elemen 2D yang cocok, setelah perbandingan visual.
3. Kompres mesh/tekstur dengan loader pendukung yang diuji di GitHub Pages. Tekstur warna menggunakan sRGB; normal/roughness/metallic memakai ruang warna linear. Uji alpha, rambut, mata dan normal setelah optimasi.
4. JSON bugs dievaluasi untuk animasi runtime ringkas atau atlas frame WebP. Frame rate animasi dapat diturunkan pada kualitas Ringan tanpa mengubah simulasi gameplay. PNG tetap tersedia ketika animasi gagal dimuat.
5. Pisahkan aset awal dan aset opsional. Home hanya memuat Forest, bed terpilih, karakter, UI dan makanan yang dibutuhkan. Bed/map lain dimuat ketika dipilih. Nama file memiliki versi/hash untuk menghindari cache lama.

Target awal, bukan hasil pengukuran: aset awal terkompresi maksimal 10 MB; karakter dan bed aktif maksimal 6 MB; satu background maksimal 500 KB; sprite makanan statis maksimal 100 KB per jenis. Jika target gagal, lakukan pengurangan tekstur/frame/mesh sebelum menerima pengecualian. Sasaran FPS: 30 pada ponsel uji kualitas Ringan, 60 pada desktop uji kualitas Seimbang; sign-off memerlukan perangkat yang benar-benar diuji.

## 4. Kondisi tidur dan animasi

Pemetaan sementara berikut mengikuti label Sleep yang ada. Nomor Sleep 01–05 harus dicocokkan dengan pose sumber; jangan mengasumsikan urutan nomor berarti kedalaman tidur.

| Sleep Meter | Kondisi | Perilaku |
|---|---|---|
| 80–100 | Deep | Loop tidur paling tenang |
| 50–<80 | Cozy | Loop tidur nyaman |
| 25–<50 | Light | Gerak ringan, mulai terganggu |
| >0–<25 | Restless | Loop gelisah, kamera mendekat sesuai aturan lama |
| 0 | Awake | Animasi bangun sekali lalu hasil gagal |

Audit menentukan apakah salah satu dari lima aset adalah Awake atau lima semuanya loop tidur. Jika semuanya tidur, keadaan Awake memakai clip bangun yang sudah tersedia atau fallback pose yang jujur; tidak menggunakan loop tidur sebagai bangun.

Gunakan hysteresis 3 poin di batas loop agar kondisi tidak berkedip saat meter naik/turun kecil. Bangun di nol langsung berlaku tanpa hysteresis. Crossfade sekitar 0.25–0.5 detik; event makan/gangguan memutar reaksi jika clip tersedia kemudian kembali ke kondisi terbaru. Saat fatal, bangun mendapat prioritas atas reaksi makan. Pause menghentikan animasi dan waktu game; resume tidak menggandakan callback. Preferensi kurangi gerakan menahan efek kamera dan gerak dekoratif.

## 5. Bed: preview, koleksi, dan pemilihan

Tambahkan tombol My Bed dengan gaya UI yang konsisten. Pemain melihat nama, preview, status terkunci/terbuka dan tombol Pakai. Preview dan game memakai pivot/scale/camera yang sama agar ukuran Gimmy tidak berubah antartempat tidur.

Usulan unlock memakai poin lifetime yang sama tanpa membelanjakan atau mengurangi poin: Daun 0, Ranting 40, Goa 100, Kasur 180, Hamok 280. Ini angka rancangan untuk penerapan, dapat disesuaikan setelah playtest. Satu bed default Daun; pemilihan disimpan. Bed baru tahap pertama bersifat visual, tanpa bonus Sleep agar balancing Level 1–5 tetap terukur. Bed yang masih memuat menampilkan status dan mencegah Mulai sampai siap; kegagalan load memberi pilihan coba lagi atau gunakan bed yang sudah siap.

Ketika bed 3D mengganti sarang pada gambar lama, audit Forest baru untuk mencegah bed ganda/bertumpuk. Anchor dihitung dari transform cover background. Pemilihan bed dibatasi di luar sesi; tidak mengganti model saat countdown aktif. Saat berganti, hentikan mixer lama dan dispose geometry/material/texture yang tidak lagi dipakai, dengan cache terkontrol untuk resource bersama.

## 6. Bugs dan feedback makan

Tahap pertama: ganti gambar ngengat/kumbang yang sudah menjadi makanan; tambahkan kecoak sebagai makanan setelah label, nilai Sleep dan koleksinya tersedia. Pertahankan nilai makanan lama untuk jenis yang sudah ada. Kecoak diusulkan +10 Sleep, configurable dan diuji lewat playtest.

Jangkrik saat ini adalah gangguan bersuara. PNG baru dapat mengganti ilustrasinya dengan indikator suara yang jelas; jangan sekaligus menjadikannya makanan tanpa aturan interaksi baru. PNG jenis lain ditampilkan sebagai koleksi belum ditemukan sampai masuk roster spawning; tidak muncul acak tanpa fungsi yang ditetapkan.

Tap makanan mengunci target sekali, memutar gerak menuju Gimmy dan feedback +Sleep. Perubahan Sleep mengikuti waktu event simulasi; animasi visual tidak menunda atau menggandakan reward. Jika model punya clip makan, mainkan reaksi singkat. Pada kualitas Ringan gunakan PNG dengan gerak sederhana; kualitas lain dapat memakai animasi ngengat/kecoak teroptimasi. Hit area minimum 48 CSS px, transparansi gambar tidak menentukan ukuran target.

Bug Guide mencatat jumlah ditemukan per jenis dan efek Sleep/noise. Koleksi lama disimpan dan dipetakan berdasarkan ID, bukan nama file. Semut/rayap/ulat/belalang/laba-laba belum memiliki angka balancing yang disetujui; aktivasi dilakukan bertahap sesudah uji roster awal.

## 7. Map dan desain layar

Audit Figma dahulu untuk Home, persiapan, gameplay, hasil, Bug Guide dan My Bed. Pertahankan poin di atas Sleep Chain, Sleep Meter di bawah, tombol artwork dan font yang telah dipilih pengguna. Jika Figma berbeda, catat perbedaannya dalam hasil audit sebelum mengubah hierarki utama.

Forest baru menjadi kandidat latar utama setelah alignment dan keterbacaan objek lolos. Tambahkan galeri lima map dan unlock visual usulan: Forest 0, RainForest 40, Village 100, Tree Canopy 180, Dream World 280 poin. Unlock map terpisah dari level tantangan; map yang dipilih tidak mengubah countdown atau kesulitan pada tahap ini. Legacy entitlement Rainforest dari save lama tetap memberi akses.

Map pertama berganti latar/nuansa pencahayaan tanpa menambah obstacle baru. Hujan, angin, ular, burung dan gangguan Village/Dream World menjadi tahap gameplay berikutnya karena aset perilaku belum diaudit. Untuk efek haze gunakan layer ringan dengan intensitas menurut kualitas; jangan menyatakan pohon/parallax terpisah jika gambar masih flattened.

## 8. Perubahan struktur game dan penyimpanan

- `scene.ts`: pisahkan load karakter/bed, manifest clip tidur, pemilihan kondisi, reaksi, unload dan error handling.
- Modul baru manifest aset: path versi, ukuran, fallback, anchor, thumbnail dan daftar clip tervalidasi; jangan menaruh URL Drive langsung pada runtime.
- Modul baru sleep-state: pemetaan meter dan hysteresis, terpisah dari level tantangan.
- `main.ts`: layar My Bed/map, loading terarah, sinkronisasi animasi dan feedback makanan.
- `director.ts`/konfigurasi bugs: jenis makanan baru dan nilai Sleep terpusat; countdown dan prioritas fatal dipertahankan.
- `rules.ts`/`storage.ts`: migrasi ke v3 dengan selectedBed, selectedMap dan koleksi baru; unlock diturunkan dari poin. XP, receipt milestone, jumlah bug, setting dan entitlement lama tetap utuh. Simpan lama tidak dihapus; fallback jika v3 rusak memakai data valid sebelumnya.
- `style.css`: layar koleksi, preview, loading/error, pilihan kualitas dan layout responsif.

Skin collection dicatat sebagai tahap berikutnya karena paket skin baru belum ditemukan. Tidak menampilkan pembelian atau unlock skin yang asetnya belum tersedia.

## 9. Urutan pengerjaan dan syarat selesai

| Tahap | Hasil | Syarat sebelum lanjut |
|---|---|---|
| A. Audit | Manifest seluruh sumber, preview lima GLB, identifikasi JSON, audit Figma | Rig/clip/material/anchor diketahui; format JSON terbukti |
| B. Optimasi | Satu karakter + Daun + Forest + dua makanan sebagai irisan playable | Budget terukur, load/error/fallback bekerja; game lama masih bisa dimainkan |
| C. Animasi tidur | Pergantian kondisi dan reaksi makan/gangguan/bangun | Batas meter stabil, pause/resume benar, tidak ada animasi berganda |
| D. Bed | Lima bed, preview, unlock dan pilihan tersimpan | Skala seragam, tidak ada bed ganda, pergantian tidak bocor memori |
| E. Bugs | PNG baru, animasi ngengat/kecoak, koleksi | Tap sekali, target jelas, efek dan penyimpanan benar |
| F. Map/UI | Lima map visual, pemilihan, desain mengikuti hasil audit Figma | Crop/anchor portrait dan landscape lolos; label unlock sesuai poin |
| G. Rilis | Build, tes migrasi/gameplay, review visual, push dan deployment | Live diuji kembali; catatan batas nyata dan aset yang belum tersedia |

## 10. Verifikasi yang bermakna

- Unit: batas/hysteresis kondisi tidur, prioritas Awake, unlock bed/map, migrasi v1/v2 ke v3, data rusak, milestone tetap idempotent.
- Browser: load pertama, semua bed/map, makanan tap/keyboard/touch, pause/modal/hidden tab, gagal dengan poin tersimpan, sukses setiap durasi, reload pilihan, offline/load gagal dan retry.
- Visual: 360×640, 390×844, 844×390, 1440×900; karakter dan bed satu anchor, target tidak tertutup, tidak ada overflow, seluruh tombol terbaca.
- Performa: ukur transfer cold load, waktu siap mulai, FPS/frame time dan memori setelah sepuluh pergantian bed/map pada perangkat uji. Bandingkan Ringan/Seimbang/Tinggi; laporkan perangkat dan metode, tidak menyebut uji desktop sebagai uji ponsel fisik.
- Playtest: pemain mencoba Level 1–5 untuk menilai kepadatan target, waktu reaksi dan durasi. Penyesuaian dilakukan pada konfigurasi, bukan pada kecepatan berdasarkan FPS.

## 11. Hal yang diputuskan setelah audit

Format JSON sebenarnya; urutan/arti Sleep 01–05; keberadaan albedo dan kelopak mata di GLB; kemampuan memisahkan karakter bersama; frame Figma yang jadi acuan; kualitas bed/background setelah optimasi. Tidak perlu menghambat audit pertama. Jika satu format/aset tidak cocok, gunakan fallback playable dan dokumentasikan bagian yang masih tertunda.

Prioritas rilis pertama adalah Daun + Forest + kondisi tidur + makanan baru. Koleksi penuh bed/map menyusul pada tahapan yang sama setelah irisan awal terbukti, tanpa memasukkan skin dan mekanik cuaca yang belum siap.
