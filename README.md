# Gimmy : The Little Tarsius

Game menjaga tidur dalam scene 2.5D. Jaga Sleep di atas nol sampai countdown mencapai 00:00. Karakter memakai rig dan animasi Gimmy; UI dan latar baru berasal dari aset proyek.

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
```

GitHub Pages dibangun dari main melalui `.github/workflows/pages.yml`. Base relatif mendukung URL repository. Diagnostic hooks hanya tersedia saat development.

## UI dan penyimpanan

Header/H1/H2 menggunakan Slackey; body, label dan angka menggunakan Sniglet Regular. Font di-host lokal; lisensi ada di public/gimmy/fonts. Semua tombol utama menggunakan salinan runtime aset PNG pengguna. Poin berada di atas Sleep Chain; Sleep Meter berada di bawah.

Save v1 dibaca dan dimigrasikan ke `gimmy.progress.v2`: XP, koleksi, pengaturan dan rekor lama dipertahankan. Level terbuka dihitung dari poin. Versi challenge ini memakai Forest; status unlock Rainforest lama tetap disimpan untuk integrasi map berikutnya. Tidak ada akun atau sinkronisasi cloud.

Lihat [rencana](GIMMY_IMPROVEMENT_PLAN.md) dan [laporan implementasi](GIMMY_V3_REPORT.md). Tekstur tubuh final dan ekspresi mata tertutup masih menyusul; warna karakter serta ikon obstacle masih aset sementara. Pengujian ponsel menggunakan emulasi, belum performance sign-off perangkat fisik.

Pendekarverse lama tetap tersimpan dalam riwayat Git dan [dokumentasi legacy](PENDEKARVERSE_LEGACY.md).
