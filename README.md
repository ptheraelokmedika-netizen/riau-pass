# PASS RIAU Event Manager

Sistem web untuk membantu panitia mengelola event tahunan seperti PASS RIAU 2026, PASS RIAU 2027, dan seterusnya. Aplikasi ini dibuat untuk kebutuhan registrasi peserta, sponsor/vendor, booth, invoice, pembayaran, receipt, arsip dokumen, WhatsApp message, dan laporan.

## Yang Sudah Ada

- Dashboard ringkas untuk panitia non-teknis.
- Event Settings multi-year, tidak dikunci hanya untuk 2026.
- Data panitia dan role akses.
- Vendor & sponsor, benefit checklist, dan file requirement tracker.
- Peserta, booth, invoice, pembayaran, receipt, arsip dokumen, WhatsApp text, activity log, dan laporan.
- Export CSV, Excel `.xlsx`, dan PDF sederhana dari layar utama.
- Halaman cetak invoice, receipt, dan surat kesanggupan sponsor.
- Supabase SQL schema dengan tabel, relasi, index, RLS policy, dan storage bucket.
- Seed data PASS RIAU 2026.
- Siap deploy ke Vercel.

## 1. Install

Buka terminal di folder ini:

```bash
D:\Projects\riau-pass
```

Lalu jalankan:

```bash
npm install
```

## 2. Jalankan Aplikasi

```bash
npm run dev
```

Biasanya aplikasi bisa dibuka di:

```bash
http://localhost:3000
```

## 3. Test Build

Sebelum deploy, jalankan:

```bash
npm run build
```

Jika berhasil, aplikasi siap untuk Vercel.

## 4. Membuat Project Supabase

1. Buka [supabase.com](https://supabase.com).
2. Login atau buat akun.
3. Klik **New project**.
4. Isi nama project, password database, dan region.
5. Tunggu sampai project selesai dibuat.

## 5. Membuat Tabel Supabase

1. Masuk ke project Supabase.
2. Buka menu **SQL Editor**.
3. Klik **New query**.
4. Buka file `supabase/schema.sql`.
5. Copy seluruh isi file tersebut ke SQL Editor.
6. Klik **Run**.

Untuk menambahkan contoh data PASS RIAU 2026:

1. Buka file `supabase/seed.sql`.
2. Copy seluruh isi file tersebut ke SQL Editor.
3. Klik **Run**.

## 6. Menghubungkan Supabase ke Aplikasi

1. Di Supabase, buka **Project Settings**.
2. Buka **API**.
3. Copy:
   - Project URL
   - anon public key
4. Di folder aplikasi, buat file baru bernama `.env.local`.
5. Isi seperti ini:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Catatan penting: jangan masukkan service role key ke frontend.

## 7. Storage Bucket Supabase

File `supabase/schema.sql` sudah menyiapkan bucket:

- `event-logos`
- `vendor-files`
- `payment-proofs`
- `documents`
- `signatures`
- `booth-layouts`

Gunakan bucket ini untuk logo event, file sponsor, bukti transfer, dokumen PDF, tanda tangan, dan layout booth.

## 8. Deploy ke Vercel

1. Upload project ini ke GitHub.
2. Buka [vercel.com](https://vercel.com).
3. Klik **Add New Project**.
4. Pilih repository `riau-pass`.
5. Pada bagian **Environment Variables**, tambahkan:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

6. Klik **Deploy**.

## 9. Role Akses

Role yang disiapkan:

- Owner: akses semua modul.
- Finance/Bendahara: invoice, pembayaran, receipt, laporan.
- Sponsorship: vendor, sponsor, booth, benefit checklist, file requirements.
- Registration: peserta dan group registration.
- Booth Manager: booth management.
- Viewer: hanya baca.

## 10. Halaman Dokumen

Contoh halaman dokumen:

- `/invoice/inv-1`
- `/receipt/pay-1`
- `/agreement/ven-1`

Gunakan tombol print browser untuk mencetak atau menyimpan sebagai PDF.

## 11. Pengembangan Berikutnya

Versi awal ini sudah build-ready dan Supabase-ready. Tahap berikutnya yang disarankan:

- Hubungkan semua tabel ke Supabase secara live.
- Tambahkan login Supabase Auth.
- Tambahkan form create/edit/delete untuk setiap modul.
- Tambahkan upload file langsung ke Supabase Storage.
- Tambahkan audit log otomatis setiap perubahan data.
