# Pendekarverse — Lembah Wening

Prototipe survival third-person 3D berbasis Three.js, TypeScript, dan Vite. Jelajahi desa Nusantara fiksi dan hutan yang tersambung, bertarung dengan tangan kosong, dan kumpulkan skor sampai kalah.

## Bermain

Masuk → pilih Wira/Laras → pilih kualitas visual → Mulai perjalanan. Kedua pilihan memakai model dari `Characters/char test.glb` dengan rona berbeda dan statistik sama.

| Aksi | Desktop | Ponsel landscape |
| --- | --- | --- |
| Gerak | WASD / panah | Analog kiri |
| Pukul | J / klik singkat | Pukul |
| Loncat | Space | Loncat |
| Sprint | Shift | Lari toggle |
| Kamera | Drag kiri / kanan | Swipe di dunia |
| Pusatkan | R | ◎ |
| Pause | P / Esc | Ⅱ |

Pukulan memberikan 25 damage; musuh memiliki 75 HP. Satu musuh bernilai 100 poin. HP pemain 100, tanpa regenerasi. Hindari pukulan dengan bergerak. Ring musuh berdenyut saat bersiap menyerang. Skor terakhir dan rekor disimpan lokal setelah kalah; keluar saat masih hidup membatalkan sesi.

## Menjalankan lokal

Memerlukan Node.js 22.12+.

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5187 --strictPort
```

```sh
npm test
npm run build
npm run preview
```

`tests/gameplay.mjs` menguji game melalui Chrome terpasang; jalankan setelah server lokal aktif pada port 5187. `tests/inspect.mjs` menghasilkan screenshot menu, seleksi, dan arena. State diagnostik hanya ada dalam mode development.

## Keputusan implementasi

- Pertarungan tangan kosong; tidak ada proyektil atau penggunaan senjata.
- Dua varian model pengguna, statistik identik; Wira dan Laras adalah nama sementara.
- Material bertekstur, lighting sore, bayangan, haze, dedaunan alpha-cutout, rumah, pendopo/gazebo, plaza, gerbang terbelah, sumur, sungai dan jembatan.
- Low / medium / high / auto dipilih sebelum mulai. Auto mulai ringan pada touch device dan menggunakan petunjuk jumlah core di desktop; penurunan resolusi dilakukan bila frame rate rendah berkelanjutan. Ini bukan deteksi GPU secara menyeluruh.
- Collision kinematik sederhana dan A* pada graph grid statis. AI memiliki spawn, patrol/idle, chase, wind-up, recovery, hurt dan death.
- Fixed timestep 60 Hz, maksimum 5 substep; pause benar-benar menghentikan simulasi dan membersihkan input.
- Aset GLB asli memiliki rig Mixamo namun tidak berisi animasi. Delapan clip skeletal prototipe dibuat terhadap rig tersebut; belum merupakan animasi silat/Mixamo final.
- Audio disintesis lokal. Efek dan ambience bersifat placeholder, tanpa unduhan audio.
- Aset runtime dioptimalkan menjadi sekitar 3,5 MB. Sumber asli dipertahankan. Jalankan `node scripts/optimize-assets.mjs` untuk membuat ulang aset runtime.

## Deploy

GitHub Actions di `.github/workflows/pages.yml` menjalankan unit tests dan build, lalu mengirim `dist/` ke GitHub Pages setiap push ke `main`. Pages menggunakan source **GitHub Actions**. Base URL relatif mendukung hosting di subfolder repositori.

## Status validasi

Lihat `TEST_REPORT.md`. Prototipe bisa dimainkan; visual, animasi silat final, dan performance sign-off perangkat fisik masih memerlukan tahap produksi. Jangan menganggap emulasi mobile sebagai bukti performa Android/iPhone nyata.

## Aset dan lisensi

- Model karakter: disediakan pengguna; sumber `Characters/char test.glb`. Tidak ada lisensi tambahan yang diklaim untuk model tersebut.
- Geometri dunia dan tekstur prosedural: dibuat untuk proyek ini.
- Font Cormorant Garamond dan Manrope: SIL Open Font License, dibundel melalui Fontsource. Salinan lisensi tersedia di `public/licenses/`.
- Three.js: MIT. Dependensi dan versi tepat tercatat di `package-lock.json`.
