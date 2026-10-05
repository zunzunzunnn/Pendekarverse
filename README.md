# Gimmy : The Little Tarsius

Game menjaga tidur dalam scene 2.5D. Jaga Sleep di atas nol sampai countdown mencapai 00:00. Gimmy memakai rangkaian gambar animasi Sleep 01–05 dari proyek, dipadukan dengan bed 3D dan background pilihan.

## Cara bermain

Pilih **Play**, atur kualitas visual, lalu tunggu cue siap. Ketuk serangga atau seret ke sarang untuk memberi makan. Geser daun menjauh, atau ketuk daun lalu pilih arah buang. Ketuk ranting ketika katak datang. Tab/Enter mendukung keyboard; Esc menjeda.

| Level | Total poin untuk membuka | Durasi |
| --- | ---: | --- |
| 1 | 0 | 02:00 |
| 2 | 40 | 01:30 |
| 3 | 100 | 01:00 |
| 4 | 180 | 00:30 |
| 5 | 280 | 00:30 |

Level 5 memiliki gangguan lebih cepat/rapat daripada Level 4, hingga empat ancaman bersamaan. Seluruh level meningkat intensitasnya menjelang 00:00. Makanan memulihkan Sleep, tidak menambah waktu.

Setiap milestone 25%, 50%, 75%, dan penyelesaian sesi memberi **5 poin**. Poin langsung tersimpan dan tidak hangus saat gagal. Bangun tidak memberi bonus. Terbukanya level baru tidak mengubah durasi atau kesulitan sesi aktif. Level maksimum 5; level lama dapat diulang.

Pengaturan/tab tersembunyi menjeda waktu dan gangguan. Zoom mendekat saat Sleep rendah atau tanpa input selama 8 detik; zoom dikunci ketika drag. Pengaturan gerakan minimum menonaktifkan zoom.

## Menjalankan dan menguji

Node.js 22.12+:

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5187
npm test
npm run build
```

Dengan Chrome terpasang dan server lokal port 5187 aktif:

```sh
node tests/gimmy-gameplay.mjs
node tests/gimmy-assets-gameplay.mjs
```

GitHub Pages dibangun dari main melalui `.github/workflows/pages.yml`. Base relatif mendukung URL repository. Diagnostic hooks hanya tersedia saat development.

## UI dan penyimpanan

Header/H1/H2 menggunakan Slackey; body, label dan angka menggunakan Sniglet Regular. Font di-host lokal; lisensi ada di public/gimmy/fonts. Semua tombol utama menggunakan salinan runtime aset PNG pengguna. Poin berada di atas Sleep Chain; Sleep Meter berada di bawah.

Save v1/v2 dibaca dan dimigrasikan ke `gimmy.progress.v3`: XP, koleksi, pengaturan, receipt milestone dan rekor lama dipertahankan. Pilihan bed/map ikut tersimpan. Jika save baru rusak, game membaca save lama yang valid. Tidak ada akun atau sinkronisasi cloud.

My Bed menyediakan Daun/Ranting/Goa/Kasur/Hamok; dunia menyediakan Forest/RainForest/Village/Tree Canopy/Dream World. Unlock pada 0/40/100/180/280 poin tanpa menghabiskan poin. Bed dan map bersifat visual; tantangan tidak berubah. Hak RainForest lama tetap berlaku. Bug Guide memuat sembilan artwork; makanan aktif ngengat/kumbang/jangkrik/kecoak, lima jenis lain ditandai belum tersedia. Ngengat/kecoak memakai animasi pada kualitas Seimbang/Tinggi; Ringan memakai PNG dan gerak sederhana.

Lihat [rencana integrasi](GIMMY_ASSET_INTEGRATION_PLAN.md) dan [laporan 0.4.0](GIMMY_V4_REPORT.md). Bed dimuat satu per satu; animasi tidur Ringan memakai atlas kecil 8 FPS, kualitas lain atlas 12 FPS. Kurangi gerakan menampilkan pose statis dan menonaktifkan zoom. Gambar statis tetap tampil jika atlas animasi gagal dimuat. Ekspresi tidur/mata tertutup berasal dari aset pengguna. Daun dan katak masih ilustrasi prototype. Pengujian ponsel menggunakan emulasi, belum performance sign-off perangkat fisik. Layout Figma belum diaudit karena meminta login; UI mengikuti desain game sebelumnya.

Pendekarverse lama tetap tersimpan dalam riwayat Git dan [dokumentasi legacy](PENDEKARVERSE_LEGACY.md).
