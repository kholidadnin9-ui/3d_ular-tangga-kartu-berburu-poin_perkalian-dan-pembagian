# Jejak Peradaban Islam — Ular Tangga 3D

Game edukasi berbasis browser menggunakan React, TypeScript, Vite, dan Three.js. Pemain mengambil kartu angka, bergerak di papan ular tangga 100 petak, mengumpulkan poin, memilih bonus bintang, dan menjawab soal matematika.

## Menjalankan di komputer

**Persyaratan:** Node.js 22.12 atau yang lebih baru (Node.js 24 direkomendasikan) dan npm.

```bash
npm ci
npm run dev
```

Buka alamat lokal yang ditampilkan Vite di terminal.

## Membuat build untuk hosting

```bash
npm ci
npm run build
npm run preview
```

Hasil build berada di folder `dist/`. Konfigurasi Vite menggunakan URL relatif dan plugin single-file agar hasilnya dapat dijalankan pada GitHub Pages di root maupun di alamat project repository.

## Hosting otomatis di GitHub Pages

1. Buat repository baru di GitHub.
2. Ekstrak ZIP ini. Masuk ke folder proyek, lalu unggah **seluruh isinya** ke repository. Pastikan folder tersembunyi `.github/workflows` ikut terunggah; cara termudah adalah memakai GitHub Desktop atau Git dari terminal. Jangan unggah folder `node_modules` atau `dist`.
3. Untuk mengirim folder proyek melalui Git, buka terminal di folder proyek lalu jalankan:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPOSITORY.git
   git push -u origin main
   ```

   Ganti `USERNAME` dan `NAMA-REPOSITORY` sesuai akun dan repository Anda. Jika repository sudah memiliki Git, cukup salin file proyek ke folder repository lalu commit dan push.
4. Buka **Settings → Pages** pada repository.
5. Pada **Build and deployment → Source**, pilih **GitHub Actions**.
6. Push perubahan ke branch `main` atau `master`, atau jalankan workflow **Deploy to GitHub Pages** secara manual dari tab **Actions**.
7. Setelah workflow berhasil, game tersedia di alamat `https://USERNAME.github.io/NAMA-REPOSITORY/`.

Workflow `.github/workflows/deploy.yml` akan memasang dependensi, memeriksa TypeScript, membangun aplikasi, lalu menerbitkannya ke GitHub Pages setiap kali ada push ke `main` atau `master`.

## Ringkasan penyempurnaan

- Status setiap soal matematika sekarang diinisialisasi ulang untuk tiap soal baru; timer dan callback dibersihkan ketika modal ditutup.
- Data permainan tersimpan divalidasi sebelum dipulihkan agar save yang rusak tidak merusak permainan.
- Inisialisasi WebGL dan audio dibuat lebih tahan terhadap browser/perangkat yang tidak mendukungnya.
- Objek dan resource 3D dibersihkan saat engine dilepas, dan pengaturan grafis preview dibuat lebih ringan.
- Build menggunakan URL relatif agar aman untuk GitHub Pages project repository, serta tersedia workflow deploy otomatis.

## Catatan penting

- Game berjalan di browser dan memerlukan JavaScript serta dukungan WebGL untuk papan 3D.
- Data permainan dan pengaturan suara disimpan di `localStorage` browser/perangkat masing-masing. Data tidak tersinkron antarperangkat atau antar-pemain.
- Menghapus data situs/browser dapat menghapus progres permainan yang tersimpan.
- Audio baru aktif setelah interaksi pertama karena pembatasan autoplay browser.
- Jika papan 3D tidak tampil, gunakan Chrome atau Edge terbaru dan aktifkan akselerasi hardware.

## Perintah npm

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Menjalankan server pengembangan lokal |
| `npm run typecheck` | Memeriksa tipe TypeScript |
| `npm run build` | Memeriksa TypeScript dan membuat build produksi |
| `npm run preview` | Meninjau build produksi secara lokal |
