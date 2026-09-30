# Gimmy : The Little Tarsius

Prototipe permainan santai 2.5D: jaga tidur Gimmy, beri makan serangga, dan redakan gangguan hutan. Karakter 3D memakai rig dan animasi yang disediakan pengguna; latar serta logo berasal dari folder Drive proyek.

## Bermain

Pilih **Mulai bermimpi**, atur kualitas visual, lalu mulai. Ketuk serangga atau seret ke sarang; seret daun menjauh; ketuk ranting saat katak muncul. Tab/Enter dapat digunakan sebagai alternatif keyboard. Esc menjeda permainan.

Sleep Chain memberi 10, 20, 30, 50 poin pada detik 30, 60, 90, 120; selanjutnya 50 poin per 30 detik. Poin langsung tersimpan di perangkat. Gimmy bangun saat Sleep habis, tanpa bonus maupun pengurangan poin. Setiap 100 poin menaikkan satu level; Rainforest terbuka di Level 2 dengan drain Sleep lebih tinggi dan daun lebih sering.

Kamera mendekat ketika Sleep rendah atau tidak ada input selama 8 detik. Kamera ditahan selama drag. Berpindah tab menjeda sesi. Pengaturan gerakan minimum menonaktifkan zoom.

## Pengembangan

Node.js 22.12+:

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5187
npm test
npm run build
```

Uji browser lokal (Chrome terpasang, server port 5187 aktif):

```sh
node tests/gimmy-gameplay.mjs
```

GitHub Pages memakai workflow `.github/workflows/pages.yml`, build dari `main`. Vite menggunakan base relatif agar bisa dimainkan dari subdirektori repository. Repository tidak diubah namanya.

## Aset dan batasan

Lihat [catatan implementasi](GIMMY_IMPLEMENTATION.md) dan [rencana](GIMIY_PLAN.md). Tekstur warna tubuh final menyusul dari pengguna; warna runtime saat ini sementara. Ekspresi mata tertutup belum terintegrasi dari rig Blender. Gambar Bug Book/gameplay saat ini ikon SVG prototipe, bukan sprite final. Progres disimpan lokal, tanpa akun atau sinkronisasi cloud.

Pendekarverse lama tetap tersedia dalam riwayat Git dan kode lama; dokumentasinya di [PENDEKARVERSE_LEGACY.md](PENDEKARVERSE_LEGACY.md).
