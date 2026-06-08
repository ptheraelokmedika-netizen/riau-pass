-- PASS RIAU 2026 sample data. Run after schema.sql.

insert into public.events (
  id, name, year, full_title, event_date_range, symposium_date_venue, workshop_date_venue,
  exhibition_date_venue, bank_account, contact_person, email, instagram, secretariat_address,
  invoice_prefix, receipt_prefix, sponsor_agreement_prefix, footer_disclaimer,
  default_payment_terms, default_dp_percentage, final_payment_deadline
) values (
  '00000000-0000-0000-0000-000000202601',
  'PASS RIAU 2026',
  2026,
  'The First Riau PERDESTI Aesthetic Summit & Symposium 2026',
  '14-16 August 2026',
  '14-15 August 2026, Hotel Grand Elite Pekanbaru',
  '16 August 2026, Universitas Abdurrab',
  '14-15 August 2026, Hotel Grand Elite Pekanbaru',
  'Bank Mandiri 123-00-4567890-1 a.n. PASS RIAU PERDESTI',
  'dr. Nadia Putri, Sp.DVE - 0812-7000-2026',
  'secretariat@passriau.id',
  '@passriau',
  'Sekretariat PASS RIAU, Pekanbaru, Riau',
  'INV/PASS-RIAU/2026',
  'RCT/PASS-RIAU/2026',
  'SPK/PASS-RIAU/2026',
  'Dokumen ini diterbitkan oleh Panitia PASS RIAU PERDESTI dan sah setelah pembayaran terverifikasi.',
  'DP minimal 50% dibayarkan maksimal 7 hari setelah invoice diterbitkan. Pelunasan mengikuti tenggat final event.',
  50,
  '2026-07-30'
) on conflict do nothing;

insert into public.event_logos (event_id, name, logo_order, logo_size, show_on_invoice, show_on_receipt, show_on_sponsor_agreement, show_on_formal_documents)
values
  ('00000000-0000-0000-0000-000000202601', 'PASS RIAU logo placeholder', 1, 'large', true, true, true, true),
  ('00000000-0000-0000-0000-000000202601', 'PERDESTI logo placeholder', 2, 'medium', true, true, true, true),
  ('00000000-0000-0000-0000-000000202601', 'Kemenkes logo placeholder', 3, 'medium', true, false, true, true),
  ('00000000-0000-0000-0000-000000202601', 'Universitas Abdurrab logo placeholder', 4, 'medium', false, false, true, true),
  ('00000000-0000-0000-0000-000000202601', 'Partner logo placeholder', 5, 'small', true, true, true, false);

with members as (
  insert into public.committee_members (event_id, name, role, whatsapp, email, active)
  values
    ('00000000-0000-0000-0000-000000202601', 'dr. Andini Rahma, Sp.DVE', 'Owner', '081270001111', 'andini@passriau.id', true),
    ('00000000-0000-0000-0000-000000202601', 'Siti Amalia', 'Finance/Bendahara', '081270003333', 'finance@passriau.id', true),
    ('00000000-0000-0000-0000-000000202601', 'Maya Lestari', 'Sponsorship', '081270004444', 'sponsor@passriau.id', true),
    ('00000000-0000-0000-0000-000000202601', 'Rizky Hidayat', 'Registration', '081270005555', 'registrasi@passriau.id', true),
    ('00000000-0000-0000-0000-000000202601', 'Dian Saputra', 'Booth Manager', '081270006666', 'booth@passriau.id', true)
  returning id, name
),
vendor_rows as (
  insert into public.vendors (event_id, company_name, pic_name, pic_position, whatsapp, email, sponsor_package, package_price, booth_number, booth_size, speaker_slot, speaker_name, speaker_topic, status, notes)
  values
    ('00000000-0000-0000-0000-000000202601', 'PT Dermatech Medika Indonesia', 'Ibu Clara', 'Marketing Manager', '081277700001', 'clara@dermatech.co.id', 'Platinum', 120000000, 'A01-A02', '6 x 2 m', true, 'dr. Keisha Pramudita', 'Combination Therapy in Aesthetic Dermatology', 'partially paid', 'Menunggu materi speaker dan video promosi.'),
    ('00000000-0000-0000-0000-000000202601', 'CV Estetika Nusantara', 'Bapak Hanif', 'Director', '081277700002', 'hanif@estetikanusantara.id', 'Gold', 75000000, 'B03', '3 x 2 m', true, 'dr. Rara Salsabila', 'Regenerative Aesthetics Update', 'booked', 'Invoice sudah dikirim.'),
    ('00000000-0000-0000-0000-000000202601', 'PT Laser Prima Sejahtera', 'Ibu Nabila', 'Brand Lead', '081277700003', 'nabila@laserprima.co.id', 'Silver', 45000000, 'C07', '3 x 2 m', false, null, null, 'DP paid', 'Menunggu brochure kit.')
  returning id, company_name
)
insert into public.booths (event_id, booth_number, booth_size, area_location, status, assigned_vendor_id, hold_expiry_date, electricity_note)
select '00000000-0000-0000-0000-000000202601', 'A01-A02', '6 x 2 m', 'Foyer Utama', 'DP Paid', id, null, '450W + additional request' from vendor_rows where company_name = 'PT Dermatech Medika Indonesia'
union all
select '00000000-0000-0000-0000-000000202601', 'B03', '3 x 2 m', 'Ballroom Left', 'Booked', id, '2026-06-25', '450W' from vendor_rows where company_name = 'CV Estetika Nusantara'
union all
select '00000000-0000-0000-0000-000000202601', 'C07', '3 x 2 m', 'Ballroom Right', 'DP Paid', id, null, '450W' from vendor_rows where company_name = 'PT Laser Prima Sejahtera'
union all
select '00000000-0000-0000-0000-000000202601', 'C08', '3 x 2 m', 'Ballroom Right', 'Available', null, null, '450W'
union all
select '00000000-0000-0000-0000-000000202601', 'D01', '3 x 2 m', 'Pre-function', 'Hold', null, '2026-06-20', '450W';

insert into public.participants (event_id, full_name, title_degree, institution, whatsapp, email, participant_category, perdesti_member, symposium, workshop, workshop_type, payment_status, badge_status, certificate_status, attendance_status)
values
  ('00000000-0000-0000-0000-000000202601', 'dr. Melissa Arum', 'Sp.DVE', 'RS Awal Bros Pekanbaru', '081288800001', 'melissa@example.com', 'Member PERDESTI', true, true, true, 'Hands-on Injectables', 'Sudah Lunas', 'Dicetak', 'Belum', 'Belum Hadir'),
  ('00000000-0000-0000-0000-000000202601', 'dr. Ahmad Fauzi', 'Dokter Umum', 'Klinik Aesthetic Riau', '081288800002', 'ahmad@example.com', 'Dokter Umum', false, true, false, '-', 'DP', 'Belum Dicetak', 'Belum', 'Belum Hadir');

insert into public.invoices (event_id, invoice_number, invoice_type, bill_to, pic_contact, invoice_date, due_date, dp_paid, status, booth_number, payment_terms, bank_account)
values
  ('00000000-0000-0000-0000-000000202601', 'INV/PASS-RIAU/2026/0001', 'Vendor sponsorship', 'PT Dermatech Medika Indonesia', 'Ibu Clara - 081277700001', '2026-06-10', '2026-06-30', 60000000, 'Partially Paid', 'A01-A02', 'DP minimal 50%', 'Bank Mandiri 123-00-4567890-1 a.n. PASS RIAU PERDESTI'),
  ('00000000-0000-0000-0000-000000202601', 'INV/PASS-RIAU/2026/0002', 'Vendor sponsorship', 'CV Estetika Nusantara', 'Bapak Hanif - 081277700002', '2026-06-12', '2026-06-25', 0, 'Sent', 'B03', 'DP minimal 50%', 'Bank Mandiri 123-00-4567890-1 a.n. PASS RIAU PERDESTI');

insert into public.invoice_items (invoice_id, item_description, qty, unit_price, discount)
select id, 'Paket Sponsorship Platinum PASS RIAU 2026', 1, 120000000, 0 from public.invoices where invoice_number = 'INV/PASS-RIAU/2026/0001'
union all
select id, 'Paket Sponsorship Gold PASS RIAU 2026', 1, 75000000, 0 from public.invoices where invoice_number = 'INV/PASS-RIAU/2026/0002';

insert into public.payments (event_id, invoice_id, payment_date, amount, payment_method, receiving_bank, sender_name, verification_status, notes)
select '00000000-0000-0000-0000-000000202601', id, '2026-06-15', 60000000, 'Bank Transfer', 'Mandiri', 'PT Dermatech Medika Indonesia', 'Verified', 'DP 50% sudah masuk.' from public.invoices where invoice_number = 'INV/PASS-RIAU/2026/0001'
union all
select '00000000-0000-0000-0000-000000202601', id, '2026-06-16', 1000000, 'Bank Transfer', 'Mandiri', 'dr. Ahmad Fauzi', 'Pending', 'Menunggu verifikasi mutasi rekening.' from public.invoices where invoice_number = 'INV/PASS-RIAU/2026/0002';

insert into public.activity_logs (event_id, action_type, entity_type, entity_name, notes)
values
  ('00000000-0000-0000-0000-000000202601', 'Created vendor', 'Vendor', 'PT Dermatech Medika Indonesia', 'Paket Platinum, booth A01-A02.'),
  ('00000000-0000-0000-0000-000000202601', 'Verified payment', 'Payment', 'INV/PASS-RIAU/2026/0001', 'DP 50% terverifikasi.'),
  ('00000000-0000-0000-0000-000000202601', 'Created participant', 'Participant', 'dr. Ahmad Fauzi', 'Symposium regular.');
