# Hasil validasi prototipe

Tanggal: 29 September 2026. Lingkungan: Windows, Chrome desktop terpasang, browser automation headless, viewport desktop 1440×900 dan emulasi touch landscape 844×390 (DPR 2).

## Lulus

- TypeScript dan build Vite produksi.
- 7 unit tests: hit window, jarak/arah/overlap vertikal, cap spawn, collision, serangan terhalang, A* memutari bangunan, collision kamera.
- Browser: seleksi karakter/kualitas, mulai, skip intro, single-hit damage, recovery, tiga pukulan per kill, skor sekali, cleanup corpse.
- Kecepatan berjalan 3,5 meter/detik, normalisasi diagonal, larangan double jump, landing.
- Pause membekukan timer/HP/spawn dan membersihkan input; kematian menghentikan sesi dan perubahan skor.
- 10 siklus reset dengan HP/skor/musuh/input kembali ke awal, lalu cleanup objek sesi.
- Mouse drag tidak menyerang; tombol keyboard pause dan resume.
- Pengaturan reduced motion dapat diubah dan disimpan.
- Emulasi multi-touch: analog bergerak dan tombol pukul bersamaan, release tidak menyisakan input.
- Rotasi ke portrait mem-pause; kembali landscape dapat dilanjutkan.
- Tidak ada uncaught JavaScript errors dalam skenario di atas.
- Audit paket: 0 vulnerabilities setelah pembaruan dependensi.

## Pengukuran terbatas

Model runtime 3.476.304 byte, turun dari sumber 19.692.992 byte. Build JS sekitar 644 kB (170 kB gzip), ditambah stylesheet dan font lokal. Salah satu sampel desktop medium menunjukkan sekitar 75 FPS / 185 draw calls. Angka ini hanya snapshot lingkungan pengujian, bukan jaminan performa perangkat target, frame-time p95, atau hasil soak 10 menit.

## Belum sign-off

- Android/iPhone fisik, Safari iOS/macOS, integrated GPU tertentu, uji jaringan cold cache 20 Mbps.
- Playtest usability 4 dari 5 pemain dan keseimbangan sesi 3–10 menit.
- Animasi Mixamo final, kualitas silat artistik, variasi suara/ambience rekaman, kualitas aset lingkungan final semi-realistis.
- Tidak ada klaim seluruh acceptance P0 PRD sudah final. Ini build prototipe playable dengan batasan produksi yang dicatat.
