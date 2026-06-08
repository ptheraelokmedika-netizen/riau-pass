"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Archive,
  BadgeCheck,
  Banknote,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  FileArchive,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  MessageCircle,
  Printer,
  ReceiptText,
  Settings,
  ShieldCheck,
  Store,
  Upload,
  Users,
  WalletCards
} from "lucide-react";
import { Badge, Button, Card, EmptyState, Field, Input, Select, Table, Td, Textarea, Th } from "@/components/ui";
import { activityLogs, booths, committeeMembers, eventSettings, fileRequirements, invoices, participants, payments, sponsorPackages, vendorBenefits, vendors } from "@/lib/sample-data";
import { rupiah, waUrl } from "@/lib/utils";
import { downloadAgreementPdf, downloadInvoicePdf, downloadReceiptPdf, exportCsv, exportWorkbook } from "@/lib/exports";
import type { Benefit, Booth, FileRequirement, Invoice, Vendor, VendorBenefit } from "@/lib/types";

const modules = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "event", label: "Event Settings", icon: CalendarDays },
  { id: "committee", label: "Panitia", icon: ShieldCheck },
  { id: "vendors", label: "Vendor & Sponsor", icon: Building2 },
  { id: "participants", label: "Peserta", icon: Users },
  { id: "groups", label: "Group Registration", icon: Users },
  { id: "booths", label: "Booth", icon: Store },
  { id: "benefits", label: "Checklist Benefit", icon: ClipboardCheck },
  { id: "files", label: "Kelengkapan File", icon: FileCheck2 },
  { id: "invoices", label: "Invoice", icon: FileText },
  { id: "payments", label: "Pembayaran", icon: WalletCards },
  { id: "archive", label: "Arsip Dokumen", icon: Archive },
  { id: "agreement", label: "Surat Sponsor", icon: ReceiptText },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "activity", label: "Activity Log", icon: Activity },
  { id: "reports", label: "Reports", icon: FileSpreadsheet },
  { id: "settings", label: "Settings", icon: Settings }
];

const toneMap: Record<string, "emerald" | "gold" | "blue" | "red" | "gray"> = {
  Completed: "emerald",
  Approved: "emerald",
  Verified: "emerald",
  Paid: "emerald",
  "fully paid": "emerald",
  "Fully Paid": "emerald",
  "Sudah Lunas": "emerald",
  Pending: "gold",
  "In Progress": "blue",
  Submitted: "blue",
  "Under Review": "blue",
  Sent: "blue",
  Hold: "gold",
  Booked: "blue",
  Missing: "red",
  Overdue: "red",
  Rejected: "red",
  Cancelled: "red",
  "Belum Lunas": "red",
  Available: "emerald"
};

function invoiceTotal(invoice: Invoice) {
  return invoice.items.reduce((sum, item) => sum + item.qty * item.unitPrice - item.discount, 0);
}

function statusTone(status: string) {
  return toneMap[status] ?? "gray";
}

function metricData() {
  const totalInvoices = invoices.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
  const paid = payments.filter((payment) => payment.verificationStatus === "Verified").reduce((sum, payment) => sum + payment.amount, 0);
  const outstanding = totalInvoices - paid;
  return [
    { label: "Total vendor", value: vendors.length, icon: Building2 },
    { label: "Total peserta", value: participants.length, icon: Users },
    { label: "Booth booked", value: booths.filter((booth) => booth.status !== "Available" && booth.status !== "Cancelled").length, icon: Store },
    { label: "Total invoice", value: invoices.length, icon: FileText },
    { label: "Total DP paid", value: rupiah(paid), icon: Banknote },
    { label: "Outstanding balance", value: rupiah(outstanding), icon: Bell },
    { label: "Vendor kurang file", value: new Set(fileRequirements.filter((file) => file.status === "Missing").map((file) => file.vendorId)).size, icon: Upload },
    { label: "Bukti transfer pending", value: payments.filter((payment) => payment.verificationStatus === "Pending").length, icon: BadgeCheck }
  ];
}

export default function Home() {
  const [activeModule, setActiveModule] = useState("dashboard");
  const [activeEvent, setActiveEvent] = useState(eventSettings.name);
  const [vendorFilter, setVendorFilter] = useState("");
  const selectedVendor = vendors[0];
  const selectedInvoice = invoices[0];
  const selectedPayment = payments[0];
  const metrics = useMemo(metricData, []);
  const filteredVendors = vendors.filter((vendor) => vendor.company.toLowerCase().includes(vendorFilter.toLowerCase()));

  return (
    <main className="min-h-screen bg-ivory">
      <header className="border-b border-emeraldDeep/10 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-champagne">{eventSettings.name}</p>
            <h1 className="text-2xl font-bold text-emeraldDeep sm:text-3xl">PASS RIAU Event Manager</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">{eventSettings.fullTitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={activeEvent} onChange={(event) => setActiveEvent(event.target.value)} aria-label="Pilih event">
              <option>PASS RIAU 2026</option>
              <option>PASS RIAU 2027</option>
              <option>PASS RIAU 2028</option>
            </Select>
            <Button onClick={() => exportWorkbook()}>
              <Download size={16} /> Export Excel
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[260px_1fr]">
        <aside className="no-print">
          <nav className="sticky top-4 grid gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-soft">
            {modules.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition ${activeModule === item.id ? "bg-emeraldDeep text-white" : "text-slate-700 hover:bg-emeraldSoft"}`}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="grid gap-5">
          {activeModule === "dashboard" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <Card key={metric.label}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-slate-500">{metric.label}</p>
                          <p className="mt-2 text-2xl font-bold text-slate-900">{metric.value}</p>
                        </div>
                        <div className="rounded-md bg-emeraldSoft p-2 text-emeraldDeep">
                          <Icon size={20} />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
              <div className="grid gap-5 xl:grid-cols-2">
                <Card>
                  <SectionTitle title="Perhatian Hari Ini" subtitle="Hal yang perlu follow-up oleh panitia." />
                  <div className="mt-4 grid gap-3">
                    <AlertLine label="Invoice overdue" value={invoices.filter((invoice) => invoice.status === "Overdue").length} />
                    <AlertLine label="Vendor incomplete benefit" value={vendorsWithIncompleteBenefits().length} />
                    <AlertLine label="File pending review" value={fileRequirements.filter((file) => file.status === "Under Review").length} />
                    <AlertLine label="Upcoming payment deadlines" value={invoices.filter((invoice) => invoice.status !== "Paid").length} />
                  </div>
                </Card>
                <Card>
                  <SectionTitle title="Status Booth" subtitle="Ketersediaan booth untuk tim sponsorship." />
                  <div className="mt-4 grid gap-3">
                    {["Available", "Hold", "Booked", "DP Paid", "Paid"].map((status) => (
                      <div key={status} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                        <span>{status}</span>
                        <Badge tone={statusTone(status)}>{booths.filter((booth) => booth.status === status).length}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
              <ActivityPanel />
            </>
          )}

          {activeModule === "event" && (
            <Card>
              <SectionTitle title="Event Settings" subtitle="Kelola tahun event, rekening, branding dokumen, tanda tangan, dan aturan pembayaran." />
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Nama event"><Input defaultValue={eventSettings.name} /></Field>
                <Field label="Tahun event"><Input defaultValue={eventSettings.year} type="number" /></Field>
                <Field label="Judul lengkap"><Input defaultValue={eventSettings.fullTitle} /></Field>
                <Field label="Symposium & Exhibition"><Input defaultValue={eventSettings.symposium} /></Field>
                <Field label="Workshop"><Input defaultValue={eventSettings.workshop} /></Field>
                <Field label="Rekening bank"><Input defaultValue={eventSettings.bankAccount} /></Field>
                <Field label="Contact person"><Input defaultValue={eventSettings.contactPerson} /></Field>
                <Field label="Email"><Input defaultValue={eventSettings.email} /></Field>
                <Field label="Instagram"><Input defaultValue={eventSettings.instagram} /></Field>
                <Field label="Prefix invoice"><Input defaultValue={eventSettings.invoicePrefix} /></Field>
                <Field label="Default DP percentage"><Input defaultValue={eventSettings.defaultDpPercentage} type="number" /></Field>
                <Field label="Final payment deadline"><Input defaultValue={eventSettings.finalPaymentDeadline} type="date" /></Field>
                <Field label="Footer disclaimer"><Textarea defaultValue={eventSettings.footerDisclaimer} /></Field>
                <Field label="Upload layout ballroom / PDF"><Input type="file" /></Field>
              </div>
              <h3 className="mt-8 font-semibold text-emeraldDeep">Logo dokumen</h3>
              <Table>
                <thead><tr><Th>Logo</Th><Th>Invoice</Th><Th>Receipt</Th><Th>Surat Sponsor</Th><Th>Formal</Th><Th>Urutan</Th><Th>Ukuran</Th></tr></thead>
                <tbody>
                  {eventSettings.logos.map((logo) => (
                    <tr key={logo.name}>
                      <Td>{logo.name}</Td>
                      <Td><input type="checkbox" defaultChecked={logo.showOnInvoice} /></Td>
                      <Td><input type="checkbox" defaultChecked={logo.showOnReceipt} /></Td>
                      <Td><input type="checkbox" defaultChecked={logo.showOnAgreement} /></Td>
                      <Td><input type="checkbox" defaultChecked={logo.showOnAgreement} /></Td>
                      <Td><Input defaultValue={logo.order} type="number" /></Td>
                      <Td><Select defaultValue={logo.size}><option>small</option><option>medium</option><option>large</option></Select></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}

          {activeModule === "committee" && (
            <Card>
              <SectionTitle title="Committee Directory / Panitia" subtitle="Nama panitia ini bisa dipilih sebagai registered by, received by, verified by, handled by, dan follow-up by." />
              <Table>
                <thead><tr><Th>Nama</Th><Th>Role</Th><Th>WhatsApp</Th><Th>Email</Th><Th>Status</Th></tr></thead>
                <tbody>
                  {committeeMembers.map((member) => (
                    <tr key={member.id}><Td>{member.name}</Td><Td>{member.role}</Td><Td>{member.whatsapp}</Td><Td>{member.email}</Td><Td><Badge tone={member.active ? "emerald" : "gray"}>{member.active ? "Aktif" : "Nonaktif"}</Badge></Td></tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}

          {activeModule === "vendors" && (
            <Card>
              <SectionTitle title="Vendor & Sponsor Registration" subtitle="Registrasi sponsor, paket, booth, speaker, deadline pembayaran, dan PIC panitia." />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Input placeholder="Cari nama perusahaan..." value={vendorFilter} onChange={(event) => setVendorFilter(event.target.value)} />
                <Button onClick={() => exportCsv(vendors as unknown as Record<string, unknown>[], "vendors.csv")}><Download size={16} /> CSV Vendor</Button>
              </div>
              <VendorForm />
              <VendorTable vendors={filteredVendors} />
            </Card>
          )}

          {activeModule === "participants" && (
            <Card>
              <SectionTitle title="Participant / Customer Registration" subtitle="Data peserta symposium, workshop, badge, certificate, dan attendance." />
              <Table>
                <thead><tr><Th>Nama</Th><Th>Institusi</Th><Th>Kategori</Th><Th>Symposium</Th><Th>Workshop</Th><Th>Pembayaran</Th><Th>Badge</Th><Th>Sertifikat</Th></tr></thead>
                <tbody>
                  {participants.map((participant) => (
                    <tr key={participant.id}>
                      <Td><strong>{participant.fullName}</strong><br /><span className="text-xs text-slate-500">{participant.title}</span></Td>
                      <Td>{participant.institution}</Td><Td>{participant.category}</Td><Td>{participant.symposium ? "Ya" : "Tidak"}</Td><Td>{participant.workshop ? participant.workshopType : "Tidak"}</Td>
                      <Td><Badge tone={statusTone(participant.paymentStatus)}>{participant.paymentStatus}</Badge></Td><Td>{participant.badgeStatus}</Td><Td>{participant.certificateStatus}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}

          {activeModule === "groups" && (
            <Card>
              <SectionTitle title="Group Registration" subtitle="Mendukung paket seperti register 5 get 1 free dan invoice group." />
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Group coordinator"><Input defaultValue="Tim Klinik Cantika" /></Field>
                <Field label="Paid participant count"><Input type="number" defaultValue={5} /></Field>
                <Field label="Free participant count"><Input type="number" defaultValue={1} /></Field>
                <Field label="Coordinator WhatsApp"><Input defaultValue="081288800003" /></Field>
                <Field label="Invoice group"><Input defaultValue="INV/PASS-RIAU/2026/GRP-001" /></Field>
                <Field label="Payment status"><Select defaultValue="Belum Lunas"><option>Belum Lunas</option><option>DP</option><option>Sudah Lunas</option></Select></Field>
              </div>
            </Card>
          )}

          {activeModule === "booths" && (
            <Card>
              <SectionTitle title="Booth Management" subtitle="Status booth, hold expiry, assigned vendor, dan pencegahan double booking." />
              <Table>
                <thead><tr><Th>Booth</Th><Th>Ukuran</Th><Th>Area</Th><Th>Status</Th><Th>Vendor</Th><Th>Hold Expiry</Th><Th>Electricity</Th></tr></thead>
                <tbody>
                  {booths.map((booth) => <BoothRow key={booth.id} booth={booth} />)}
                </tbody>
              </Table>
            </Card>
          )}

          {activeModule === "benefits" && (
            <ChecklistPanel title="Benefit Checklist per Vendor" rows={vendorBenefits} kind="benefit" />
          )}

          {activeModule === "files" && (
            <ChecklistPanel title="File Requirement Tracker" rows={fileRequirements} kind="file" />
          )}

          {activeModule === "invoices" && (
            <Card>
              <SectionTitle title="Invoice Generator" subtitle="Invoice vendor, booth, peserta, workshop, group, dan custom invoice dengan PDF profesional." />
              <Table>
                <thead><tr><Th>Nomor</Th><Th>Bill To</Th><Th>Due Date</Th><Th>Total</Th><Th>DP Paid</Th><Th>Status</Th><Th>Aksi</Th></tr></thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <Td>{invoice.number}<br /><span className="text-xs text-slate-500">{invoice.type}</span></Td>
                      <Td>{invoice.billTo}</Td><Td>{invoice.dueDate}</Td><Td>{rupiah(invoiceTotal(invoice))}</Td><Td>{rupiah(invoice.dpPaid)}</Td><Td><Badge tone={statusTone(invoice.status)}>{invoice.status}</Badge></Td>
                      <Td><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => downloadInvoicePdf(invoice)}><Download size={15} /> PDF</Button><Button variant="ghost" onClick={() => window.print()}><Printer size={15} /></Button></div></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}

          {activeModule === "payments" && (
            <Card>
              <SectionTitle title="Payment / Receipt / Bukti Transfer" subtitle="Alur upload bukti transfer, verifikasi Bendahara, update invoice, dan receipt PDF." />
              <Table>
                <thead><tr><Th>Invoice</Th><Th>Tanggal</Th><Th>Jumlah</Th><Th>Pengirim</Th><Th>Received By</Th><Th>Status</Th><Th>Aksi</Th></tr></thead>
                <tbody>
                  {payments.map((payment) => {
                    const invoice = invoices.find((item) => item.id === payment.invoiceId) ?? invoices[0];
                    return (
                      <tr key={payment.id}>
                        <Td>{invoice.number}</Td><Td>{payment.date}</Td><Td>{rupiah(payment.amount)}</Td><Td>{payment.senderName}</Td><Td>{payment.receivedBy}</Td><Td><Badge tone={statusTone(payment.verificationStatus)}>{payment.verificationStatus}</Badge></Td>
                        <Td><Button variant="outline" onClick={() => downloadReceiptPdf(payment, invoice)}><ReceiptText size={15} /> Receipt</Button></Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card>
          )}

          {activeModule === "archive" && (
            <Card>
              <SectionTitle title="Document Archive" subtitle="Invoice PDF, receipt, bukti transfer, logo, CV speaker, materi, agreement, layout, dan signature." />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {["Invoice PDF", "Receipt PDF", "Payment Proof", "Vendor Logo", "Speaker CV", "Speaker Material", "Brochure", "Sponsor Agreement", "Booth Layout"].map((name) => (
                  <div key={name} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3"><FileArchive className="text-emeraldDeep" size={20} /><span className="font-medium">{name}</span></div>
                    <Badge tone="blue">Uploaded</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeModule === "agreement" && (
            <Card>
              <SectionTitle title="Template Surat Kesanggupan Sponsor" subtitle="Surat pernyataan partisipasi sponsor dengan detail paket, booth, nilai, rekening, dan tanda tangan." />
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <p className="text-center text-lg font-bold text-emeraldDeep">SURAT PERNYATAAN KESANGGUPAN BERPARTISIPASI</p>
                <p className="mt-5 text-sm leading-7">Yang bertanda tangan di bawah ini mewakili <strong>{selectedVendor.company}</strong>, menyatakan bersedia berpartisipasi dalam <strong>{eventSettings.name}</strong> pada {eventSettings.symposium}. Paket: <strong>{selectedVendor.packageName}</strong>, booth <strong>{selectedVendor.boothNumber}</strong>, nilai kesepakatan <strong>{rupiah(selectedVendor.packagePrice)}</strong>.</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2"><div>Perwakilan Perusahaan<br /><br /><br />{selectedVendor.pic}</div><div>Panitia PASS RIAU<br /><br /><br />{eventSettings.contactPerson}</div></div>
              </div>
              <div className="mt-4 flex gap-2"><Button onClick={() => downloadAgreementPdf(selectedVendor)}><Download size={16} /> Download PDF</Button><Button variant="outline" onClick={() => window.print()}><Printer size={16} /> Print</Button></div>
            </Card>
          )}

          {activeModule === "whatsapp" && <WhatsAppPanel vendor={selectedVendor} invoice={selectedInvoice} payment={selectedPayment} />}

          {activeModule === "activity" && <ActivityPanel />}

          {activeModule === "reports" && (
            <Card>
              <SectionTitle title="Reports" subtitle="Filter laporan per event, tanggal, status, handler, vendor, peserta, pembayaran, dan booth." />
              <div className="mb-4 grid gap-3 md:grid-cols-4">
                <Field label="Event"><Select defaultValue={activeEvent}><option>PASS RIAU 2026</option><option>PASS RIAU 2027</option></Select></Field>
                <Field label="Date range"><Input type="date" defaultValue="2026-06-01" /></Field>
                <Field label="Status"><Select><option>Semua</option><option>Belum Lunas</option><option>Sudah Lunas</option><option>Menunggu Verifikasi</option></Select></Field>
                <Field label="Committee handler"><Select><option>Semua panitia</option>{committeeMembers.map((member) => <option key={member.id}>{member.name}</option>)}</Select></Field>
              </div>
              <div className="flex flex-wrap gap-2"><Button onClick={() => exportWorkbook()}><FileSpreadsheet size={16} /> Export Excel</Button><Button variant="outline" onClick={() => exportCsv(invoices as unknown as Record<string, unknown>[], "invoice-report.csv")}><Download size={16} /> Export CSV</Button><Button variant="outline" onClick={() => downloadInvoicePdf(selectedInvoice)}><FileText size={16} /> Export PDF</Button></div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {["Vendor payment report", "Participant registration report", "Outstanding invoice report", "Booth occupancy report", "Sponsorship benefit checklist", "File requirement report", "Payment received report", "Payment verification report", "Committee handler report", "Activity log report", "Sponsor agreement report"].map((report) => <div key={report} className="rounded-md border border-slate-200 bg-slate-50 p-3 font-medium">{report}</div>)}
              </div>
            </Card>
          )}

          {activeModule === "settings" && (
            <Card>
              <SectionTitle title="Settings" subtitle="Supabase Auth, role access, storage bucket, dan preferensi umum sistem." />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Default role pengguna baru"><Select><option>Viewer</option><option>Registration</option><option>Sponsorship</option><option>Finance/Bendahara</option></Select></Field>
                <Field label="Mode verifikasi pembayaran"><Select><option>Owner dan Finance saja</option><option>Owner saja</option></Select></Field>
                <Field label="Bucket event logos"><Input defaultValue="event-logos" /></Field>
                <Field label="Bucket payment proofs"><Input defaultValue="payment-proofs" /></Field>
              </div>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-emeraldDeep">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
    </div>
  );
}

function AlertLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2">
      <span className="text-sm text-slate-700">{label}</span>
      <Badge tone={value > 0 ? "gold" : "emerald"}>{value}</Badge>
    </div>
  );
}

function vendorsWithIncompleteBenefits() {
  return vendors.filter((vendor) => vendorBenefits.some((benefit) => benefit.vendorId === vendor.id && !["Completed", "Not Applicable"].includes(benefit.status)));
}

function VendorForm() {
  return (
    <details className="my-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <summary className="cursor-pointer font-semibold text-emeraldDeep">Tambah / edit vendor</summary>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Field label="Company name"><Input placeholder="Nama perusahaan" /></Field>
        <Field label="PIC name"><Input placeholder="Nama PIC" /></Field>
        <Field label="WhatsApp"><Input placeholder="08..." /></Field>
        <Field label="Sponsor package"><Select>{sponsorPackages.map((pack) => <option key={pack.name}>{pack.name}</option>)}<option>Custom</option></Select></Field>
        <Field label="Package price"><Input type="number" placeholder="0" /></Field>
        <Field label="Booth number"><Select><option>Pilih booth</option>{booths.map((booth) => <option key={booth.id} disabled={booth.status !== "Available"}>{booth.number} - {booth.status}</option>)}</Select></Field>
        <Field label="Speaker slot"><Select><option>Ya</option><option>Tidak</option></Select></Field>
        <Field label="Registered by"><Select>{committeeMembers.map((member) => <option key={member.id}>{member.name}</option>)}</Select></Field>
        <Field label="Status"><Select><option>lead</option><option>booked</option><option>DP paid</option><option>partially paid</option><option>fully paid</option><option>cancelled</option></Select></Field>
      </div>
    </details>
  );
}

function VendorTable({ vendors: rows }: { vendors: Vendor[] }) {
  if (!rows.length) return <EmptyState title="Vendor tidak ditemukan" body="Ubah kata kunci pencarian atau tambah vendor baru." />;
  return (
    <Table>
      <thead><tr><Th>Company</Th><Th>PIC</Th><Th>Paket</Th><Th>Booth</Th><Th>Deadline</Th><Th>Handler</Th><Th>Status</Th></tr></thead>
      <tbody>
        {rows.map((vendor) => (
          <tr key={vendor.id}>
            <Td><strong>{vendor.company}</strong><br /><span className="text-xs text-slate-500">{vendor.email}</span></Td>
            <Td>{vendor.pic}<br /><span className="text-xs text-slate-500">{vendor.whatsapp}</span></Td>
            <Td>{vendor.packageName}<br /><span className="text-xs">{rupiah(vendor.packagePrice)}</span></Td>
            <Td>{vendor.boothNumber}<br /><span className="text-xs text-slate-500">{vendor.boothSize}</span></Td>
            <Td>DP {vendor.dpDeadline}<br />Final {vendor.finalDeadline}</Td>
            <Td>{vendor.handler}</Td>
            <Td><Badge tone={statusTone(vendor.status)}>{vendor.status}</Badge></Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function BoothRow({ booth }: { booth: Booth }) {
  const vendor = vendors.find((item) => item.id === booth.vendorId);
  return <tr><Td>{booth.number}</Td><Td>{booth.size}</Td><Td>{booth.area}</Td><Td><Badge tone={statusTone(booth.status)}>{booth.status}</Badge></Td><Td>{vendor?.company ?? "-"}</Td><Td>{booth.holdExpiry ?? "-"}</Td><Td>{booth.electricity}</Td></tr>;
}

function ChecklistPanel({ title, rows, kind }: { title: string; rows: Benefit[] | FileRequirement[]; kind: "benefit" | "file" }) {
  return (
    <Card>
      <SectionTitle title={title} subtitle={kind === "benefit" ? "Pantau benefit yang promised, pending, delivered, atau not applicable per sponsor." : "Pantau missing file, submitted, under review, approved, rejected, dan overdue."} />
      <Table>
        <thead><tr><Th>Vendor</Th><Th>Nama</Th><Th>Due date</Th><Th>PIC Review/Responsible</Th><Th>Status</Th><Th>Catatan</Th></tr></thead>
        <tbody>
          {rows.map((row) => {
            const vendor = vendors.find((item) => item.id === row.vendorId);
            const pic = kind === "benefit" ? (row as Benefit).responsible : (row as FileRequirement).reviewedBy ?? "-";
            const note = kind === "benefit" ? (row as Benefit).description : (row as FileRequirement).uploaded ? "File sudah diunggah" : "Belum ada file";
            return <tr key={row.id}><Td>{vendor?.company}</Td><Td>{row.name}</Td><Td>{row.dueDate}</Td><Td>{pic}</Td><Td><Badge tone={statusTone(row.status)}>{row.status}</Badge></Td><Td>{note}</Td></tr>;
          })}
        </tbody>
      </Table>
    </Card>
  );
}

function WhatsAppPanel({ vendor, invoice, payment }: { vendor: Vendor; invoice: Invoice; payment: { amount: number } }) {
  const missingFiles = fileRequirements.filter((file) => file.vendorId === vendor.id && file.status === "Missing").map((file) => file.name).join(", ");
  const total = invoiceTotal(invoice);
  const remaining = total - invoice.dpPaid;
  const messages = [
    { title: "Kirim invoice", text: `Selamat siang Bapak/Ibu/Dr./Tim ${vendor.company}, berikut kami kirimkan invoice untuk partisipasi ${vendor.company} pada PASS RIAU ${eventSettings.year}. Mohon dapat dilakukan pembayaran sesuai detail pada invoice. Terima kasih.` },
    { title: "Reminder pembayaran", text: `Selamat siang Bapak/Ibu/Dr./Tim ${vendor.company}, kami ingin mengingatkan bahwa pembayaran untuk invoice ${invoice.number} masih memiliki sisa tagihan sebesar ${rupiah(remaining)}. Mohon konfirmasi apabila sudah melakukan transfer. Terima kasih.` },
    { title: "Kirim receipt", text: `Selamat siang Bapak/Ibu/Dr./Tim ${vendor.company}, pembayaran sebesar ${rupiah(payment.amount)} untuk invoice ${invoice.number} sudah kami terima dan verifikasi. Berikut kami kirimkan bukti pembayaran/receipt. Terima kasih.` },
    { title: "Minta kelengkapan file", text: `Selamat siang Bapak/Ibu/Dr./Tim ${vendor.company}, untuk kebutuhan publikasi dan administrasi PASS RIAU ${eventSettings.year}, mohon dapat mengirimkan file berikut: ${missingFiles || "logo/materi sponsor"}. Terima kasih.` },
    { title: "Konfirmasi booth", text: `Selamat siang Bapak/Ibu/Dr./Tim ${vendor.company}, kami konfirmasi booth ${vendor.boothNumber} untuk ${vendor.company} pada PASS RIAU ${eventSettings.year}. Detail booth tercantum pada dokumen/invoice yang kami kirimkan. Terima kasih.` },
    { title: "Terima kasih full payment", text: `Selamat siang Bapak/Ibu/Dr./Tim ${vendor.company}, terima kasih. Pembayaran partisipasi ${vendor.company} pada PASS RIAU ${eventSettings.year} sudah kami terima penuh. Kami akan melanjutkan koordinasi benefit dan kelengkapan event.` }
  ];

  return (
    <Card>
      <SectionTitle title="WhatsApp-ready Message Generator" subtitle="Teks siap salin, link WhatsApp otomatis bila nomor tersedia, dan aktivitas dapat dicatat." />
      <div className="mt-5 grid gap-4">
        {messages.map((message) => (
          <div key={message.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-emeraldDeep">{message.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{message.text}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(message.text)}><Copy size={15} /> Copy</Button>
                <a href={waUrl(vendor.whatsapp, message.text)} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emeraldDeep px-3 py-2 text-sm font-medium text-white"><MessageCircle size={15} /> WhatsApp</a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ActivityPanel() {
  return (
    <Card>
      <SectionTitle title="Recent Activity Log" subtitle="Melihat siapa mengubah data, kapan, dan catatan perubahan." />
      <Table>
        <thead><tr><Th>Waktu</Th><Th>User</Th><Th>Aksi</Th><Th>Entity</Th><Th>Catatan</Th></tr></thead>
        <tbody>
          {activityLogs.map((activity) => <tr key={activity.id}><Td>{activity.timestamp}</Td><Td>{activity.user}</Td><Td>{activity.action}</Td><Td>{activity.entityName}</Td><Td>{activity.notes}</Td></tr>)}
        </tbody>
      </Table>
    </Card>
  );
}
