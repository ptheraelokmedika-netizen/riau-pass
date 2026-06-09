-- PASS RIAU Event Manager Supabase schema
-- Run this in Supabase SQL Editor before seed.sql.

create extension if not exists "pgcrypto";

create type app_role as enum ('Owner','Ketua Panitia','Sekretaris','Finance/Bendahara','Sponsorship','Registration','Booth Manager','Scientific','Documentation','Viewer');
create type invoice_status as enum ('Draft','Sent','DP Paid','Partially Paid','Paid','Overdue','Cancelled');
create type payment_verification_status as enum ('Pending','Verified','Rejected');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  year int not null,
  full_title text not null,
  event_date_range text,
  symposium_date_venue text,
  workshop_date_venue text,
  exhibition_date_venue text,
  bank_account text,
  contact_person text,
  email text,
  instagram text,
  secretariat_address text,
  invoice_prefix text not null,
  receipt_prefix text not null,
  sponsor_agreement_prefix text not null,
  footer_disclaimer text,
  default_payment_terms text,
  default_due_days int default 7,
  default_dp_percentage numeric default 50,
  final_payment_deadline date,
  layout_file_url text,
  signature_name text,
  signature_role text,
  signature_path text,
  signature_url text,
  signature_image_url text,
  stamp_path text,
  stamp_url text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(year, name)
);

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role app_role not null default 'Viewer',
  committee_member_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_logos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  file_url text,
  logo_path text,
  logo_url text,
  public_url text,
  show_on_invoice boolean default true,
  show_on_receipt boolean default true,
  show_on_sponsor_agreement boolean default true,
  show_on_formal_documents boolean default true,
  logo_order int default 1,
  logo_size text check (logo_size in ('small','medium','large')) default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.committee_members (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  role app_role not null,
  whatsapp text,
  email text,
  active boolean default true,
  signature_image_url text,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles add constraint user_profiles_committee_member_id_fkey
  foreign key (committee_member_id) references public.committee_members(id) on delete set null;

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  company_name text not null,
  pic_name text,
  pic_position text,
  whatsapp text,
  email text,
  address text,
  npwp text,
  sponsor_package text check (sponsor_package in ('Silver','Gold','Platinum','Custom')) default 'Silver',
  package_price numeric not null default 0,
  custom_package_name text,
  booth_number text,
  booth_size text,
  speaker_slot boolean default false,
  speaker_name text,
  speaker_topic text,
  speaker_phone text,
  speaker_email text,
  cv_speaker_url text,
  logo_url text,
  brochure_url text,
  speaker_material_url text,
  video_promotion_url text,
  electricity_requirement text,
  additional_booth_notes text,
  registered_by uuid references public.committee_members(id),
  received_by uuid references public.committee_members(id),
  handled_by uuid references public.committee_members(id),
  registration_date date default current_date,
  dp_deadline date,
  final_payment_deadline date,
  status text check (status in ('lead','booked','DP paid','partially paid','fully paid','cancelled')) default 'lead',
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.booths (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  booth_number text not null,
  booth_size text,
  area_location text,
  status text check (status in ('Available','Hold','Booked','DP Paid','Paid','Cancelled')) default 'Available',
  assigned_vendor_id uuid references public.vendors(id) on delete set null,
  hold_expiry_date date,
  electricity_note text,
  additional_note text,
  layout_file_url text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id, booth_number)
);

create unique index booths_one_active_vendor
  on public.booths(event_id, assigned_vendor_id)
  where assigned_vendor_id is not null and status in ('Hold','Booked','DP Paid','Paid');

create table public.vendor_benefits (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  benefit_name text not null,
  description text,
  quantity text,
  due_date date,
  responsible_committee_member_id uuid references public.committee_members(id),
  status text check (status in ('Not Started','Pending','In Progress','Completed','Not Applicable')) default 'Not Started',
  completion_date date,
  notes text,
  attachment_url text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vendor_file_requirements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  requirement_name text not null,
  required boolean default true,
  file_uploaded boolean default false,
  file_url text,
  upload_link text,
  due_date date,
  status text check (status in ('Missing','Submitted','Under Review','Approved','Rejected','Not Required')) default 'Missing',
  reviewed_by uuid references public.committee_members(id),
  review_date date,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.participant_groups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  group_coordinator text not null,
  coordinator_whatsapp text,
  coordinator_email text,
  paid_participant_count int default 0,
  free_participant_count int default 0,
  invoice_group_id uuid,
  payment_status text,
  registered_by uuid references public.committee_members(id),
  received_by uuid references public.committee_members(id),
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  full_name text not null,
  title_degree text,
  institution text,
  whatsapp text,
  email text,
  participant_category text,
  perdesti_member boolean default false,
  symposium boolean default false,
  workshop boolean default false,
  workshop_type text,
  group_registration_id uuid references public.participant_groups(id) on delete set null,
  registered_by uuid references public.committee_members(id),
  received_by uuid references public.committee_members(id),
  payment_status text,
  badge_status text,
  certificate_status text,
  attendance_status text,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.participant_group_members (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  participant_group_id uuid not null references public.participant_groups(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  is_free_participant boolean default false,
  created_at timestamptz not null default now(),
  unique(participant_group_id, participant_id)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete set null,
  participant_id uuid references public.participants(id) on delete set null,
  participant_group_id uuid references public.participant_groups(id) on delete set null,
  invoice_number text not null unique,
  invoice_type text not null,
  bill_to text not null,
  pic_contact text,
  invoice_date date default current_date,
  due_date date,
  dp_paid numeric default 0,
  last_payment_date date,
  payment_terms text,
  bank_account text,
  registered_by uuid references public.committee_members(id),
  received_by uuid references public.committee_members(id),
  handled_by uuid references public.committee_members(id),
  booth_number text,
  notes text,
  signature_url text,
  footer_disclaimer text,
  status invoice_status default 'Draft',
  archived_pdf_url text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.participant_groups add constraint participant_groups_invoice_group_id_fkey
  foreign key (invoice_group_id) references public.invoices(id) on delete set null;

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  item_description text not null,
  qty numeric not null default 1,
  unit_price numeric not null default 0,
  discount numeric not null default 0,
  created_at timestamptz not null default now()
);

create table public.invoice_benefits (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  vendor_benefit_id uuid references public.vendor_benefits(id) on delete set null,
  benefit_name text not null,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  payment_date date not null,
  amount numeric not null,
  payment_method text,
  receiving_bank text,
  sender_name text,
  proof_of_transfer_url text,
  received_by uuid references public.committee_members(id),
  verified_by uuid references public.committee_members(id),
  verification_status payment_verification_status default 'Pending',
  verification_date date,
  rejection_reason text,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete cascade,
  receipt_number text not null unique,
  archived_pdf_url text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete set null,
  participant_id uuid references public.participants(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  committee_handler_id uuid references public.committee_members(id),
  document_type text not null,
  file_url text,
  status text check (status in ('Draft','Uploaded','Pending Review','Approved','Rejected','Archived')) default 'Uploaded',
  uploaded_by uuid references auth.users(id),
  uploaded_date timestamptz default now(),
  notes text,
  created_at timestamptz not null default now()
);

create table public.sponsor_agreements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  agreement_number text not null unique,
  company_name text not null,
  pic_name text,
  position text,
  address text,
  phone_fax text,
  email text,
  sponsor_package text,
  booth_number text,
  amount_agreed numeric,
  payment_deadline date,
  bank_account_destination text,
  payment_method text,
  benefits_included text,
  notes text,
  city_date text,
  signer_name text,
  signer_position text,
  signature_url text,
  committee_signature_url text,
  archived_pdf_url text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  entity_type text,
  entity_id uuid,
  message_type text not null,
  recipient_phone text,
  message_text text not null,
  copied_at timestamptz,
  sent_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references auth.users(id),
  committee_member_id uuid references public.committee_members(id),
  action_type text not null,
  entity_type text not null,
  entity_id uuid,
  entity_name text,
  old_value jsonb,
  new_value jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create index on public.event_logos(event_id);
create index on public.committee_members(event_id);
create index on public.vendors(event_id);
create index on public.vendors(status);
create index on public.vendor_benefits(event_id, vendor_id);
create index on public.vendor_file_requirements(event_id, vendor_id, status);
create index on public.participants(event_id);
create index on public.participants(payment_status);
create index on public.participant_groups(event_id);
create index on public.booths(event_id, status);
create index on public.invoices(event_id, status);
create index on public.invoices(vendor_id);
create index on public.invoices(participant_id);
create index on public.payments(event_id, invoice_id, verification_status);
create index on public.documents(event_id, document_type, status);
create index on public.sponsor_agreements(event_id, vendor_id);
create index on public.whatsapp_messages(event_id);
create index on public.activity_logs(event_id, created_at desc);

create or replace function public.current_user_role()
returns app_role
language sql
security definer
set search_path = public
as $$
  select coalesce((select role from public.user_profiles where id = auth.uid()), 'Viewer'::app_role);
$$;

create or replace function public.can_write(module text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare role app_role := public.current_user_role();
begin
  if role = 'Owner' then return true; end if;
  if role = 'Finance/Bendahara' and module in ('invoices','payments','receipts','reports','documents') then return true; end if;
  if role = 'Sponsorship' and module in ('vendors','booths','benefits','file_requirements','documents','sponsor_agreements','whatsapp') then return true; end if;
  if role = 'Registration' and module in ('participants','participant_groups','invoices','payments','documents','whatsapp') then return true; end if;
  if role = 'Booth Manager' and module = 'booths' then return true; end if;
  return false;
end;
$$;

alter table public.events enable row level security;
alter table public.event_logos enable row level security;
alter table public.committee_members enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_benefits enable row level security;
alter table public.vendor_file_requirements enable row level security;
alter table public.participants enable row level security;
alter table public.participant_groups enable row level security;
alter table public.participant_group_members enable row level security;
alter table public.booths enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.invoice_benefits enable row level security;
alter table public.payments enable row level security;
alter table public.receipts enable row level security;
alter table public.documents enable row level security;
alter table public.sponsor_agreements enable row level security;
alter table public.whatsapp_messages enable row level security;
alter table public.activity_logs enable row level security;
alter table public.user_profiles enable row level security;

create policy "authenticated read events" on public.events for select to authenticated using (true);
create policy "owner write events" on public.events for all to authenticated using (public.current_user_role() = 'Owner') with check (public.current_user_role() = 'Owner');

create policy "read all profiles" on public.user_profiles for select to authenticated using (true);
create policy "owner manage profiles" on public.user_profiles for all to authenticated using (public.current_user_role() = 'Owner') with check (public.current_user_role() = 'Owner');

create policy "read common tables" on public.event_logos for select to authenticated using (true);
create policy "owner write logos" on public.event_logos for all to authenticated using (public.current_user_role() = 'Owner') with check (public.current_user_role() = 'Owner');

create policy "read committee" on public.committee_members for select to authenticated using (true);
create policy "owner write committee" on public.committee_members for all to authenticated using (public.current_user_role() = 'Owner') with check (public.current_user_role() = 'Owner');

create policy "read vendors" on public.vendors for select to authenticated using (true);
create policy "write vendors" on public.vendors for all to authenticated using (public.can_write('vendors')) with check (public.can_write('vendors'));

create policy "read benefits" on public.vendor_benefits for select to authenticated using (true);
create policy "write benefits" on public.vendor_benefits for all to authenticated using (public.can_write('benefits')) with check (public.can_write('benefits'));

create policy "read file requirements" on public.vendor_file_requirements for select to authenticated using (true);
create policy "write file requirements" on public.vendor_file_requirements for all to authenticated using (public.can_write('file_requirements')) with check (public.can_write('file_requirements'));

create policy "read participants" on public.participants for select to authenticated using (true);
create policy "write participants" on public.participants for all to authenticated using (public.can_write('participants')) with check (public.can_write('participants'));

create policy "read groups" on public.participant_groups for select to authenticated using (true);
create policy "write groups" on public.participant_groups for all to authenticated using (public.can_write('participant_groups')) with check (public.can_write('participant_groups'));
create policy "read group members" on public.participant_group_members for select to authenticated using (true);
create policy "write group members" on public.participant_group_members for all to authenticated using (public.can_write('participant_groups')) with check (public.can_write('participant_groups'));

create policy "read booths" on public.booths for select to authenticated using (true);
create policy "write booths" on public.booths for all to authenticated using (public.can_write('booths')) with check (public.can_write('booths'));

create policy "read invoices" on public.invoices for select to authenticated using (true);
create policy "write invoices" on public.invoices for all to authenticated using (public.can_write('invoices')) with check (public.can_write('invoices'));
create policy "read invoice items" on public.invoice_items for select to authenticated using (true);
create policy "write invoice items" on public.invoice_items for all to authenticated using (public.can_write('invoices')) with check (public.can_write('invoices'));
create policy "read invoice benefits" on public.invoice_benefits for select to authenticated using (true);
create policy "write invoice benefits" on public.invoice_benefits for all to authenticated using (public.can_write('invoices')) with check (public.can_write('invoices'));

create policy "read payments" on public.payments for select to authenticated using (true);
create policy "write payments" on public.payments for all to authenticated using (public.can_write('payments')) with check (public.can_write('payments'));
create policy "read receipts" on public.receipts for select to authenticated using (true);
create policy "write receipts" on public.receipts for all to authenticated using (public.can_write('receipts')) with check (public.can_write('receipts'));

create policy "read documents" on public.documents for select to authenticated using (true);
create policy "write documents" on public.documents for all to authenticated using (public.can_write('documents')) with check (public.can_write('documents'));

create policy "read agreements" on public.sponsor_agreements for select to authenticated using (true);
create policy "write agreements" on public.sponsor_agreements for all to authenticated using (public.can_write('sponsor_agreements')) with check (public.can_write('sponsor_agreements'));

create policy "read whatsapp" on public.whatsapp_messages for select to authenticated using (true);
create policy "write whatsapp" on public.whatsapp_messages for all to authenticated using (public.can_write('whatsapp')) with check (public.can_write('whatsapp'));

create policy "read activity" on public.activity_logs for select to authenticated using (true);
create policy "insert activity" on public.activity_logs for insert to authenticated with check (auth.uid() is not null);

insert into storage.buckets (id, name, public) values
  ('event-logos', 'event-logos', true),
  ('vendor-files', 'vendor-files', false),
  ('payment-proofs', 'payment-proofs', false),
  ('documents', 'documents', false),
  ('signatures', 'signatures', false),
  ('booth-layouts', 'booth-layouts', false)
on conflict (id) do nothing;
