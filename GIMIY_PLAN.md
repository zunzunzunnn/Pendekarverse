# Gimmy : The Little Tarsius — Rencana pengembangan v2

Tanggal: 30 September 2026. Status: prototipe 2.5D telah diimplementasikan pada branch `gimmy-25d`; keputusan banking dan idle telah dikonfirmasi pengguna. Lihat GIMMY_IMPLEMENTATION.md untuk hasil dan batasan aktual.

## 1. Keputusan yang sudah pasti

- Format **2.5D disetujui pengguna**: Gimmy memakai model 3D beranimasi, lingkungan memakai lapisan gambar dengan elemen interaktif yang memiliki kedalaman, dan kamera terarah dengan zoom terbatas.
- Judul resmi: **Gimmy : The Little Tarsius**. Ejaan yang tampil kepada pemain adalah **Gimmy**, walaupun nama file sumber masih menggunakan Gimiy. Nama file asli dipertahankan untuk keterlacakan.
- Pemain menjaga Gimmy tidur melalui lingkungan; tidak mengontrol gerak Gimmy langsung dan tidak ada combat.
- Serangga menjadi sumber Sleep; gangguan lingkungan mengurangi Sleep.
- Kamera melakukan zoom saat Sleep rendah atau Gimmy akan bangun, serta ketika pemain tidak memainkan permainan. Pemicu kondisi terakhir masih perlu dibedakan antara idle input dan berada di menu.
- Dua aset karakter tersedia: versi rig Blender dan versi rig Mixamo dengan animasi. Versi animasi menjadi kandidat runtime utama.
- Bangun tidak memberikan poin. **Sleep Chain adalah sumber poin untuk menaikkan level dan membuka map baru.** Poin kill, poin dari tap, dan reward gagal dihapus dari rancangan.
- Visual dan UI diarahkan mengikuti aset Gimmy yang diberikan: karakter merah-oranye, mata/telinga besar, hutan malam, daun, sarang, kayu, cahaya hangat, dan warna biru malam.

## 2. Sumber yang sudah diperiksa

| Sumber | Tautan | Hasil pemeriksaan |
| --- | --- | --- |
| Dokumen desain terbaru | [Copy of gimiy test game](https://docs.google.com/document/d/1h9IbU8rHNhprR-TffP2Fcx_duVJloeyqfmsAJYDi45A/edit) | Satu tab; konsep gameplay dan tambahan desain UI sampai tujuh layar utama |
| Model | [3D Model](https://drive.google.com/drive/folders/1LcJaAqclgP_AqoVx7AmlT5B_thqwrWcK) | Dua FBX dan satu screenshot Blender |
| Logo | [Logo](https://drive.google.com/drive/folders/1uY9lYS5_lOISw-EzBhxAGd2BS2l2jkgF) | Tiga PNG; ketiganya diperiksa secara visual |
| Komponen UI | [UI](https://drive.google.com/drive/folders/1SPKg5qhaOuKCTicdUI2NZHVpi_wEnTD8) | Ikon/tombol, lima Cozy, Sleep Chain, Bug Guide, Level, dan referensi layout |
| Kartu map | [new map](https://drive.google.com/drive/folders/19o3nnYnd197ED0uqQTsx_6dvTOLjRRmo) | Forest, Rainforest, Village, Tree Canopy, Dream World; kartu Forest diperiksa visual |
| Latar | [Background Map](https://drive.google.com/drive/folders/1QcMZWccfe8SvLzGC3Z62yZ3VQHgNVtms) | Enam JPG: Map 01, 02, 03, 04, 06, 07; Map 01 diperiksa visual |
| Referensi hewan | [Bugs](https://drive.google.com/drive/folders/1IxhGf78aybbQL2m7vSI4sfmXaIry9czR) | Satu contact sheet; diperiksa visual, bukan sprite terpisah |

Inventaris dilakukan pada tanggal di atas, bukan pemantauan otomatis folder. Sebelas file representatif diunduh untuk pemeriksaan lokal; bukan seluruh aset. File rig Blender 176,74 MB belum diunduh atau divalidasi deformasinya. Salinan pemeriksaan berada di `.tools/gimmy-review/` yang diabaikan Git; tidak dipublikasikan.

## 3. Audit karakter dan rencana animasi

### Aset

| File | Ukuran | Peran |
| --- | --- | --- |
| `Gimiy Animated.fbx` | 10.508.636 byte (~10,51 MB) | Kandidat utama: satu geometry, satu skin, skeleton bernama `mixamorig:*`, delapan animation stack terdeteksi |
| `c_Gimiy1.fbx` | 176.737.836 byte (~176,74 MB) | Sumber rig Blender menurut pengguna; digunakan untuk koreksi/aset master bila diperlukan |
| `Screenshot (832).png` | 1920×1080 | Referensi bentuk, proporsi, warna dan wajah karakter dari Blender |

Nama clip berikut ditemukan melalui pembacaan struktur FBX, bukan perkiraan dari nama file:

| Clip asli | Durasi metadata, sekitar | Kandidat penggunaan; wajib validasi playback |
| --- | --- | --- |
| `c_Gimiy\|Idle Sleep` | 6,87 dtk | Variasi tidur |
| `c_Gimiy\|Laying Server` | 1,77 dtk | Kandidat berbaring/transisi; maknanya belum diasumsikan dari nama |
| `c_Gimiy\|Sleep 01` | 17,60 dtk | Tidur panjang |
| `c_Gimiy\|Sleep Idle` | 1,70 dtk | Loop tidur pendek |
| `c_Gimiy\|Sleep Idle 2` | 6,87 dtk | Variasi idle |
| `c_Gimiy\|Sleeping Idle ` | 17,60 dtk | Variasi tidur; spasi akhir dinormalisasi dalam manifest runtime |
| `c_Gimiy\|Wake up 01` | 1,83 dtk | Bangun |
| `c_Gimiy\|Yawn 01` | 8,33 dtk | Menguap di menu/transisi |

Terdeteksi referensi tekstur base color, normal, roughness, dan metallic. Keberhasilan pemuatan semua tekstur, kelopak mata, bentuk wajah, root motion, dan kecocokan clip dengan sarang belum dinyatakan lulus karena belum dilakukan import/playback lengkap.

**Pipeline implementasi:** import kandidat Mixamo → putar semua clip → pilih loop dan pose → cek rig/material/ekspresi → bake/normalisasi scale dan root → ekspor GLB → optimasi tekstur → uji di browser. Konversi dijalankan offline, bukan mengirim FBX master besar ke setiap pemain.

Pengguna menyatakan animasi telah lengkap. Pemeriksaan nama belum menemukan clip yang secara eksplisit bernama makan/sniff/chew atau startled. Tahap validasi perlu memeriksa apakah gerakan itu ada di dalam clip; jangan meminta animasi baru sebelum mengecek. Bila tidak ada, baru rencanakan additive animation atau clip tambahan. Kehadiran nama sleep tidak membuktikan mata sudah tertutup; periksa face rig/blendshape.

Target awal, belum hasil ukur: karakter runtime ≤5 MB, tekstur 1K pada mobile dengan varian 2K bila diperlukan desktop. File 176,74 MB dipertahankan sebagai sumber, bukan payload web.

## 4. Arah visual dan penggunaan aset

Keputusan disetujui: **karakter 3D dalam diorama 2.5D dengan kamera terkendali**, lingkungan bergaya ilustratif dengan material dan lighting lembut. Ini mengikuti model dan UI yang diberikan, sambil mempertahankan haze dan kualitas adaptif yang diminta sebelumnya. Susun foreground, area sarang/karakter, dan background sebagai lapisan kedalaman; gunakan parallax ringan serta batas zoom agar tepi gambar tidak terlihat. Objek yang bisa disentuh memiliki hit area tersendiri yang mengikuti proyeksi kamera.

- Palet utama: biru malam, hijau daun, cokelat kayu, krem, amber; aksen karakter merah-oranye.
- Gimmy dan sarang menjadi pusat komposisi. Ancaman serta makanan tetap terbaca di sekitar karakter.
- Gunakan bentuk tombol kayu/daun, garis melengkung dan sudut lembut. Hindari HUD pertarungan Pendekarverse.
- `Map 01.jpg` (976×1098) memperlihatkan sarang kosong di cabang dengan latar rumah pohon malam. Cocok sebagai referensi komposisi/backplate, bukan bukti adanya map 3D siap pakai.
- Backplate tunggal hanya aman untuk kamera terbatas. Zoom membutuhkan overscan, anchoring karakter, shadow kontak dan uji clipping; latar tidak boleh menampilkan celah atau perspektif yang tidak cocok.
- Referensi utama UI berukuran 1182×1330, dominan portrait. Karena itu, revisi rekomendasi layout menjadi **portrait-first untuk ponsel dengan adaptasi landscape/desktop**; tidak lagi otomatis memaksa landscape seperti prototipe lama. Wajib uji bahwa zona interaksi tetap muat.
- Tinggi/rendah kualitas mengubah resolusi, shadow, partikel dan lapisan efek; aturan Sleep, spawn dan poin harus sama.

### Logo

Ketiga file membawa identitas Gimmy dan subtitle The Little Tarsius. `gimmy logo final.png` dan `gimmy logo final 2.png` berukuran 1920×1080 dengan gaya merah-oranye; `Logo 01 copy.png` berukuran 1365×768 dengan tampilan cokelat berbulu. PNG memiliki kanal alpha, tetapi kualitas tepi dan piksel transparan tetap perlu diuji di latar terang/gelap.

Rekomendasi kandidat utama: `gimmy logo final 2.png`, karena warna dan fitur wajahnya dekat dengan model; nama “final” sendiri bukan bukti persetujuan varian. Pilihan varian tidak perlu menghambat prototipe mekanik. Judul halaman, menu, metadata, dokumentasi, dan hasil permainan menggunakan **Gimmy : The Little Tarsius**; nama repository/URL dibahas terpisah sebelum publikasi.

### Aset UI harus menjadi komponen yang benar-benar berfungsi

- `Sleep Chain.png` (1780×1080) memuat angka `00:32` dalam gambar. Pecah menjadi dekorasi/panel dan teks timer dinamis; jangan menampilkan angka palsu saat sesi berjalan.
- `Play Button.png`, Settings, Info, Collection, dan Bed Upgrade menjadi bahan komponen dengan hit target minimal 48 CSS px, fokus keyboard, dan state disabled/pressed.
- Lima `Cozy` dicatat sebagai kandidat visual Sleep; isi dan mapping masing-masing harus diperiksa sebelum dihubungkan ke state. Nama file saja tidak menetapkan rentang meter.
- Bug Guide/Bug Book merupakan satu fitur dengan pintu masuk yang konsisten, bukan dua koleksi terpisah.
- Kartu map Forest menampilkan `Unlock at Lv. 8`, sementara sumber awal menempatkan Forest sebagai World 1. Level yang tercetak pada aset merupakan referensi visual yang harus diganti menjadi teks dinamis; urutan unlock berasal dari config yang disepakati.
- Layout referensi menampilkan gem, tombol Shop, Missions dan Daily Reward, sedangkan dokumen membatasi UI/currency. Keberadaan ikon tidak otomatis menjadikannya fitur MVP. Jangan memasang tombol yang tidak punya fungsi.
- Contact sheet Bugs memiliki background dan label menyatu. Perlu sprite/cutout/atlas sebelum dipakai di gameplay; bukan animasi siap pakai. Isinya juga mencakup hewan non-serangga, sehingga label dan peran gameplay harus dipilah. Katak tetap gangguan berdasarkan desain; tidak otomatis menjadi makanan karena muncul pada sheet.

## 5. Layar dan perjalanan pemain

**Home → Pre-Sleep → Playing → Wake Up / Result → Again atau Home.** Bug Book, Bed Collection, dan Settings diakses dari Home. Pause membekukan simulasi.

| Layar | Isi yang direncanakan |
| --- | --- |
| Home | Logo resmi, Gimmy sebagai karakter hidup, Play/Sleep sebagai CTA utama, level/progress, map aktif/berikutnya, Collection/Bug Guide, Settings |
| Pre-Sleep | Map aktif, bed terpilih, kualitas grafis, tombol Sleep; tanpa inventori RPG |
| Gameplay | Sleep Meter dan ikon kondisi, pause; Sleep Chain serta progress berikutnya ditampilkan ringkas. Tidak ada HP/hunger/coin/gem yang memenuhi layar |
| Wake Up | Animasi bangun, durasi tidur, bugs eaten, chain tercapai; tidak memberikan poin bangun. Again menjadi tombol utama |
| Result | Ringkasan chain yang berhasil dan progression. Cara memicu “berhasil” pada mode target masih usulan; bukan reward tambahan otomatis |
| Bug Book | Serangga yang ditemukan, manfaat dan risiko; data progres lokal |
| Bed Collection | Bed aktif dan preview; bed lain hanya diaktifkan setelah persyaratan unlock/passive siap |
| Settings/pause | Sound, music, kualitas, reduced motion, bantuan, resume/home. Notifications, pembelian dan Parent section bukan kebutuhan MVP saat ini |

Awake mengakhiri run dan membuka Wake Up Screen menurut desain layar terbaru; tidak otomatis mengembalikan Sleep ke 50 seperti usulan v1. Klik Again memulai sesi bersih. Jika nanti dipilih mode lanjut otomatis, itu harus menjadi keputusan tersendiri dan tidak boleh mencetak poin dari kegagalan.

## 6. Aturan gameplay inti

Interaksi: tap serangga untuk mengarahkan ke zona makan; drag serangga berisik menjauh bila dibutuhkan; drag daun jatuh ke samping; tap ranting pengalih saat katak/burung memberi peringatan. Gimmy makan dan bereaksi otomatis. Tidak ada poin langsung dari tap atau memberi makan; makanan hanya membantu mempertahankan chain.

Usulan balancing awal: Sleep mulai 80, maksimum 100, drain 1/detik. Satu objek hanya memberi efek sekali per kejadian. Nilai dapat diubah setelah playtest.

| Rentang | State | Feedback utama |
| --- | --- | --- |
| 80–100 | Deep Sleep | Napas tenang, gerak sedikit |
| 50–<80 | Cozy Sleep | Loop tidur normal |
| 25–<50 | Light Sleep | Gerak kecil, ekspresi berubah |
| >0–<25 | Restless | Indikator bahaya dan kamera lebih dekat |
| 0 | Awake | Clip bangun, chain berhenti, hasil tanpa reward bangun |

| Objek MVP | Usulan efek |
| --- | --- |
| Ngengat | +10 Sleep; aman |
| Jangkrik | +15 Sleep; −5 sekali bila dibiarkan terlalu lama pada radius noise |
| Kumbang | +20 Sleep; lambat |
| Daun jatuh | −10 jika mengenai Gimmy |
| Katak | −15 bila peringatan suara tidak dialihkan |

Nilai sumber masih bervariasi. Tabel ini adalah satu set usulan playtest, bukan angka final. Zona makan memiliki jeda agar menumpuk serangga berisik mempunyai konsekuensi. Spawn menyediakan waktu peringatan dan jalur yang bisa ditangani pemain; tidak boleh memberi kombinasi mustahil hanya untuk memutus chain.

## 7. Sleep Chain → poin → level → map

**Satu jalur progression:** menjaga tidur → mencapai milestone Sleep Chain → memperoleh poin/XP → naik level → map terbuka. Tidak ada mata uang kedua atau poin farming dari wake/retry.

Pisahkan data:

- `sleepValue`: kondisi saat ini, bukan currency.
- `chainSeconds`: waktu tidur tanpa putus dalam sesi.
- `chainMilestones`: penanda reward milestone agar tidak diberikan dua kali.
- `totalSleepPoints`: progression tersimpan; dikredit langsung setiap milestone dan tetap tersimpan ketika Gimmy bangun.
- `playerLevel` dan `unlockedMaps`: diturunkan dari total poin/config, tidak hanya label gambar.
- `bestChainSeconds`: rekor durasi; terpisah dari poin.

Dokumen terbaru menyebut milestone 30/60/90/120 detik (Cozy, Deep Sleep, Dreaming, Sweet Dream); versi awal menyebut lima milestone mulai 10 detik. Rekomendasi memakai urutan terbaru, menjadikan 10 detik sebagai feedback tutorial tanpa reward tambahan.

| Milestone usulan | Label | Tambahan poin usulan |
| --- | --- | --- |
| 30 detik | Cozy | 10 |
| 60 detik | Deep Sleep | 20 |
| 90 detik | Dreaming | 30 |
| 120 detik | Sweet Dream | 50 |
| Tiap 30 detik selanjutnya | Chain berlanjut | 50; tunduk playtest |

Poin tabel bersifat tambahan, sehingga chain 120 detik bernilai 110 poin, bukan 50 total. Usulan v1 “10 × multiplier tiap detik” ditangguhkan agar tidak tercampur dengan sistem milestone. Multiplier tidak perlu ditampilkan sampai satu formula reward disetujui.

**Keputusan pengguna:** poin milestone langsung disimpan dan tetap tersimpan ketika Gimmy bangun. Bangun memberi nol poin tambahan; hanya chain sesi yang direset. Level dan map unlock tetap tersimpan.

Usulan urutan map: Forest terbuka sejak awal → Rainforest → Village → Tree Canopy → Dream World. Nilai level unlock dibuat data terpisah dan diuji, bukan menyalin angka di gambar. Untuk membuktikan progression, MVP perlu sedikitnya Forest dan satu map berikutnya yang benar-benar dapat dimainkan; tiga map lain bisa tampil sebagai rencana terkunci tanpa klaim kontennya sudah siap.

Bed progression tetap tercatat dari sumber, tetapi menggunakan satu pool progression/achievement yang dirancang setelah jalur level-map stabil. Tidak menambah gem, toko, atau daily reward hanya karena aset tombol tersedia.

## 8. Kamera responsif

Kamera dasar tetap menjaga seluruh zona interaksi. Zoom adalah respons terhadap kondisi, bukan kontrol orbit bebas.

| Pemicu | Usulan respons |
| --- | --- |
| Normal | Komposisi lebar, Gimmy dan makanan/gangguan terlihat |
| Sleep <25 | Dolly/zoom lembut sekitar 10–15%, mulai membaca kegelisahan |
| Sleep <10 | Zoom maksimum sekitar 20%, fokus ekspresi hampir bangun |
| Awake | Close-up pendek mengikuti clip bangun, lalu Wake Up Screen |
| Tidak dimainkan | Setelah 8 detik tanpa tap/drag dalam sesi aktif; kembali saat input, tidak menggeser objek yang sedang di-drag |
| Input kembali | Kembali ke framing interaksi; jika pemain sedang drag, jangan menggeser proyeksi objek yang dipegang |

Angka, threshold dan durasi adalah usulan. Gunakan hysteresis (misalnya zoom keluar setelah Sleep >30) agar kamera tidak bolak-balik di batas meter. Prioritas: Awake > bahaya Sleep > idle. Reduced motion memakai perubahan framing minimal tanpa shake. HUD tidak ikut membesar.

Idle-input telah dipilih. Pemicu 8 detik tanpa interaksi dengan zoom sangat kecil; simulasi tetap berjalan dan bahaya tidak boleh disembunyikan. Tab tersembunyi atau kehilangan fokus tetap auto-pause, terpisah dari idle pemain. Tidak ada zoom idle saat pointer sedang ditahan/drag atau dialog terbuka.

## 9. Tutorial 60 detik dan kesiapan MVP

| Waktu | Skenario |
| --- | --- |
| 0–5 | Gimmy tidur; tujuan ditunjukkan lewat ekspresi dan Sleep Meter |
| 5–12 | Ngengat mendekat; sniff/gerakan kecil mengundang tap, tanpa label TAP HERE permanen |
| 12–22 | Daun jatuh dengan waktu reaksi cukup; pemain drag menjauh |
| 22–35 | Jangkrik berisik; milestone Cozy pertama menunjukkan progress poin |
| 35–47 | Katak dan ranting pengalih mengajarkan timing |
| 47–60 | Kumbang lambat bersama satu daun; milestone berikutnya memberi tujuan pendek |

Guidance bersifat kontekstual dan singkat. Jangan sengaja memaksa Sleep kritis pada onboarding hanya untuk memamerkan zoom. Bila meter rendah secara alami, kamera menunjukkan kegelisahan tanpa menutup makanan. Jadwal bisa menunggu pemain memahami tindakan awal.

**MVP terbaru:** Home/Pre-Sleep/gameplay/Wake Up, ringkasan hasil, Bug Book sederhana, bed awal, Settings; model asli beserta animasi; tiga serangga dan dua gangguan; kamera responsif; Sleep Chain, poin, level dan unlock **map kedua playable**; mouse/touch; kualitas grafis dan rekor lokal. Result dapat memakai komponen bersama Wake Up/ringkasan; target kemenangan, bintang dan bonus tersendiri belum ditentukan.

**Setelah MVP:** lima dunia lengkap, variasi cuaca, semua hewan, enam bed beserta passive, koleksi lebih lengkap. Shop, misi, daily reward, notifications, akun, multiplayer dan monetisasi tidak otomatis masuk scope.

## 10. Tahap pelaksanaan

| Tahap | Hasil | Syarat melanjutkan |
| --- | --- | --- |
| 1. Audit aset runtime | Playback delapan clip, rig/material, ekspor GLB; manifest UI dan varian logo | Tidur/bangun tampil benar, kebutuhan ekspresi diketahui, aset web terukur |
| 2. Identitas dan scene | Judul/logo, Gimmy dalam sarang, Forest, layout portrait/landscape | Komposisi sesuai referensi dan target tap terbaca |
| 3. Core gameplay | Sleep states, serangga, gangguan, tap/drag, tutorial 60 detik | Loop playable, single-effect, pause/reset benar |
| 4. Kamera dan ekspresi | Zoom bahaya, near-wake, awake, serta idle sesuai keputusan | Tidak mengganggu drag, tidak menyembunyikan ancaman |
| 5. Progression | Chain → poin → level; Forest dan Rainforest playable | Reward tidak ganda, unlock benar, banking sesuai jawaban pengguna |
| 6. UI pendukung | Bug Book, bed awal, hasil, Settings; teks UI dinamis | Tidak ada angka gambar yang menyesatkan/tombol kosong |
| 7. QA dan deploy | Test logic, input, perangkat, hasil publikasi | Build dan smoke test berhasil pada URL tujuan yang ditentukan |

Fondasi Three.js/Vite, loading, fixed timestep, audio/settings dan pause dapat dipakai kembali. Ganti combat/AI dunia terbuka dengan SleepSystem, BugSystem, DisturbanceDirector, ChainProgression, CameraDirector, dan MapUnlock. Data Gimmy memiliki namespace storage baru agar tidak membaca rekor Pendekarverse.

Versi Pendekarverse tetap dipertahankan selama planning. Implementasi berikutnya dapat memakai branch terpisah; rename repo/URL dan penggantian game live dilakukan dalam tugas implementasi/publikasi, bukan akibat perubahan judul dokumen ini.

## 11. Pengujian yang direncanakan

- Semua delapan clip bisa dimuat; loop/transisi tidak T-pose, drift, atau menembus sarang; mata/ekspresi tidur terbaca.
- Efek serangga/gangguan sekali per event, kondisi Sleep memiliki batas pasti.
- Awake menghasilkan nol reward baru; poin milestone tetap tersimpan setelah bangun.
- Milestone tepat satu kali, restore/refresh tidak menggandakan XP, level dan map unlock konsisten.
- Map kedua benar-benar punya konten dan pola gangguan yang berbeda, bukan hanya kartu/menu berbeda.
- Kamera normal/low/near-wake/awake/idle mengikuti prioritas, reduced motion, dan hysteresis; drag tetap stabil saat threshold terlewati.
- Rendering 30/60 FPS tidak mengubah timer, drain Sleep, atau reward.
- Pointercancel, blur, pause, restart dan 10 siklus run bersih; storage gagal tidak memutus permainan.
- Home dan gameplay diuji portrait/landscape, safe area, kontras, fokus keyboard dan target sentuh ≥48 px.
- Teks ejaan resmi, timer, level, meter, poin dan unlock dirender dinamis; nilai contoh dalam gambar tidak menjadi state game.
- Target awal 30 FPS mobile / 60 FPS desktop, dengan perangkat dan payload dicatat sebelum sign-off.

## 12. Hal yang masih perlu dipastikan

Kedua pertanyaan sudah dijawab: milestone tetap tersimpan, bangun tanpa bonus; zoom idle berlaku saat tidak ada tap/drag dalam sesi. Pengguna menyatakan tekstur warna tubuh menyusul. Prototipe menggunakan warna material sementara. Threshold level dan reward tetap konfigurasi playtest.

Rencana ini menggantikan v1: tidak lagi menyatakan aset Gimmy belum tersedia, tidak lagi memakai judul kerja lama, tidak lagi menjadikan map unlock fitur jauh setelah prototipe, dan tidak lagi mengusulkan otomatis tidur kembali setelah Awake sebagai default. Dokumen Google dan game live tidak diedit dalam tahap ini.


