"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Archive,
  BadgeCheck,
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  Edit3,
  Eye,
  FileArchive,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  MessageCircle,
  Plus,
  Printer,
  ReceiptText,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Store,
  Trash2,
  Upload,
  Users,
  WalletCards
} from "lucide-react";
import { Badge, Button, Card, EmptyState, Field, Input, Select, Table, Td, Textarea, Th } from "@/components/ui";
import {
  activityLogs as seedActivity,
  booths as seedBooths,
  committeeMembers as seedCommittee,
  eventSettings as seedEvent,
  fileRequirements as seedFiles,
  invoices as seedInvoices,
  participants as seedParticipants,
  payments as seedPayments,
  vendorBenefits as seedBenefits,
  vendors as seedVendors
} from "@/lib/sample-data";
import { testSupabaseConnection, type SupabaseConnectionStatus } from "@/lib/supabase";
import { clearSupabaseDemoRecords, deleteSupabaseRecord, fetchSupabaseAppData, saveSupabaseEventLogo, saveSupabaseEventSettings, upsertSupabaseRecord } from "@/src/lib/data-service";
import { deleteFile, getPublicUrl, uploadFile } from "@/src/lib/storage";
import { rupiah, waUrl } from "@/lib/utils";
import type { ActivityLog, Booth, CommitteeMember, EventSettings, FileRequirement, Invoice, Participant, Payment, Vendor, VendorBenefit } from "@/lib/types";

type Demo<T> = T & { demo?: boolean };
type DocumentRecord = {
  id: string;
  name: string;
  type: string;
  relatedName: string;
  status: "Draft" | "Uploaded" | "Pending Review" | "Approved" | "Rejected" | "Archived";
  createdAt: string;
  notes: string;
  demo?: boolean;
  bucket?: string;
  storagePath?: string;
  publicUrl?: string;
  uploadedAt?: string;
};
type SponsorLetter = {
  id: string;
  vendorId: string;
  number: string;
  signerName: string;
  signerRole: string;
  committeeSignerName: string;
  committeeSignerRole: string;
  cityDate: string;
  notes: string;
  demo?: boolean;
};
type WhatsAppMessage = {
  id: string;
  type: string;
  recipient: string;
  phone: string;
  text: string;
  demo?: boolean;
};
type AppData = {
  event: EventSettings;
  committee: Demo<CommitteeMember>[];
  vendors: Demo<Vendor>[];
  participants: Demo<Participant>[];
  booths: Demo<Booth>[];
  benefits: Demo<VendorBenefit>[];
  files: Demo<FileRequirement>[];
  invoices: Demo<Invoice>[];
  payments: Demo<Payment>[];
  documents: DocumentRecord[];
  letters: SponsorLetter[];
  messages: WhatsAppMessage[];
  logs: Demo<ActivityLog>[];
};
type ModuleKey = "dashboard" | "event" | "committee" | "vendors" | "participants" | "groups" | "booths" | "benefits" | "files" | "invoices" | "payments" | "archive" | "agreement" | "whatsapp" | "activity" | "reports" | "settings";
type EditableKey = Exclude<ModuleKey, "dashboard" | "event" | "groups" | "reports" | "settings">;
type ModalState = { key: EditableKey; mode: "add" | "edit" | "view"; id?: string } | null;

const STORAGE_KEY = "pass-riau-event-manager:v2";
const activeBoothStatuses = ["Booked", "DP Paid", "Paid"];
const currentUser = "Panitia PASS RIAU";

const modules: { id: ModuleKey; label: string; icon: typeof LayoutDashboard }[] = [
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

const reportOptions = [
  "Vendor payment report",
  "Participant registration report",
  "Outstanding invoice report",
  "Booth occupancy report",
  "Sponsorship benefit checklist report",
  "File requirement report",
  "Payment received report",
  "Payment verification report",
  "Committee handler report",
  "Activity log report",
  "Sponsor agreement report",
  "Promo usage report"
];

const invoiceTargetTypes = ["Vendor / Sponsor", "Participant", "Group Registration", "Symposium Only", "Workshop Only", "Booth Only", "Custom / Other"] as const;

const pricingRules = [
  { category: "Member PERDESTI", product: "Symposium", period: "Early bird", start: "2026-01-01", end: "2026-06-30", price: 1000000, active: true, notes: "Member early bird" },
  { category: "Member PERDESTI", product: "Symposium", period: "Regular", start: "2026-07-01", end: "2026-08-14", price: 1500000, active: true, notes: "Member regular" },
  { category: "Member PERDESTI", product: "Symposium", period: "On-site", start: "2026-08-15", end: "2026-08-16", price: 2000000, active: true, notes: "Member onsite" },
  { category: "Non-member PERDESTI", product: "Symposium", period: "Early bird", start: "2026-01-01", end: "2026-06-30", price: 1500000, active: true, notes: "Non-member early bird" },
  { category: "Non-member PERDESTI", product: "Symposium", period: "Regular", start: "2026-07-01", end: "2026-08-14", price: 2000000, active: true, notes: "Non-member regular" },
  { category: "Non-member PERDESTI", product: "Symposium", period: "On-site", start: "2026-08-15", end: "2026-08-16", price: 2500000, active: true, notes: "Non-member onsite" },
  { category: "Dokter Umum", product: "Symposium", period: "Early bird", start: "2026-01-01", end: "2026-06-30", price: 1500000, active: true, notes: "Dokter umum early bird" },
  { category: "Dokter Umum", product: "Symposium", period: "Regular", start: "2026-07-01", end: "2026-08-14", price: 2000000, active: true, notes: "Dokter umum regular" },
  { category: "Internship / Koas / Mahasiswa", product: "Symposium", period: "All period", start: "2026-01-01", end: "2026-08-16", price: 500000, active: true, notes: "Student price" },
  { category: "Resident / PPDS", product: "Symposium", period: "Regular", start: "2026-01-01", end: "2026-08-16", price: 1000000, active: true, notes: "Resident price" },
  { category: "Workshop Participant", product: "Workshop", period: "Regular", start: "2026-01-01", end: "2026-08-16", price: 2500000, active: true, notes: "Workshop default" },
  { category: "Booth", product: "Booth", period: "Regular", start: "2026-01-01", end: "2026-08-16", price: 15000000, active: true, notes: "Booth only default" },
  { category: "Silver", product: "Sponsor package", period: "Regular", start: "2026-01-01", end: "2026-08-16", price: 20000000, active: true, notes: "Sponsor silver" },
  { category: "Gold", product: "Sponsor package", period: "Regular", start: "2026-01-01", end: "2026-08-16", price: 30000000, active: true, notes: "Sponsor gold" },
  { category: "Platinum", product: "Sponsor package", period: "Regular", start: "2026-01-01", end: "2026-08-16", price: 55000000, active: true, notes: "Sponsor platinum" }
];

function withDemo<T extends { id: string }>(rows: T[]) {
  return rows.map((row) => ({ ...row, demo: true }));
}

function initialData(): AppData {
  const docs: DocumentRecord[] = [
    { id: "doc-1", name: "Invoice INV/PASS-RIAU/2026/001.pdf", type: "Invoice PDF", relatedName: "PT Dermavita Estetika", status: "Archived", createdAt: new Date().toISOString(), notes: "Demo archived invoice", demo: true },
    { id: "doc-2", name: "Logo PT Dermavita.png", type: "Vendor Logo", relatedName: "PT Dermavita Estetika", status: "Approved", createdAt: new Date().toISOString(), notes: "Demo logo metadata", demo: true }
  ];
  return {
    event: {
      ...seedEvent,
      stampLabel: seedEvent.stampLabel ?? "Stempel Resmi PERDESTI / PASS",
      showStampOnInvoice: seedEvent.showStampOnInvoice ?? true,
      showStampOnReceipt: seedEvent.showStampOnReceipt ?? true,
      showStampOnAgreement: seedEvent.showStampOnAgreement ?? true,
      showStampOnFormalDocuments: seedEvent.showStampOnFormalDocuments ?? true,
      promoName: seedEvent.promoName ?? "5 Peserta Dokter Free 1",
      promoType: seedEvent.promoType ?? "Group Registration",
      promoStartDate: seedEvent.promoStartDate ?? "2026-01-01",
      promoEndDate: seedEvent.promoEndDate ?? "2026-06-30",
      promoCategories: seedEvent.promoCategories ?? "Member PERDESTI, Non-member PERDESTI, Dokter Umum",
      promoMinimumPaidCount: seedEvent.promoMinimumPaidCount ?? 5,
      promoFreeCount: seedEvent.promoFreeCount ?? 1,
      promoActive: seedEvent.promoActive ?? true,
      promoNotes: seedEvent.promoNotes ?? "Promo group registration 5 peserta dokter berbayar mendapatkan 1 peserta free. Berlaku hingga 30 Juni 2026.",
      logos: seedEvent.logos.map((logo) => ({ ...logo }))
    },
    committee: withDemo(seedCommittee),
    vendors: withDemo(seedVendors),
    participants: withDemo(seedParticipants),
    booths: withDemo(seedBooths),
    benefits: withDemo(seedBenefits),
    files: withDemo(seedFiles),
    invoices: withDemo(seedInvoices),
    payments: withDemo(seedPayments),
    documents: docs,
    letters: seedVendors.map((vendor, index) => ({
      id: `letter-${index + 1}`,
      vendorId: vendor.id,
      number: `${seedEvent.agreementPrefix}/${String(index + 1).padStart(3, "0")}`,
      signerName: vendor.pic,
      signerRole: vendor.position,
      committeeSignerName: seedEvent.contactPerson,
      committeeSignerRole: "Panitia PASS RIAU",
      cityDate: "Pekanbaru, 20 Juni 2026",
      notes: "Demo surat sponsor",
      demo: true
    })),
    messages: [],
    logs: withDemo(seedActivity)
  };
}

function emptyData(): AppData {
  return {
    event: { ...seedEvent, logos: [] },
    committee: [],
    vendors: [],
    participants: [],
    booths: [],
    benefits: [],
    files: [],
    invoices: [],
    payments: [],
    documents: [],
    letters: [],
    messages: [],
    logs: []
  };
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function invoiceTotal(invoice: Invoice) {
  return invoice.items.reduce((sum, item) => sum + Number(item.qty) * Number(item.unitPrice) - Number(item.discount), 0);
}

function verifiedPaid(invoiceId: string, payments: Payment[]) {
  return payments.filter((payment) => payment.invoiceId === invoiceId && payment.verificationStatus === "Verified").reduce((sum, payment) => sum + Number(payment.amount), 0);
}

function pendingPaid(invoiceId: string, payments: Payment[]) {
  return payments.filter((payment) => payment.invoiceId === invoiceId && payment.verificationStatus === "Pending").reduce((sum, payment) => sum + Number(payment.amount), 0);
}

function findPricing(category: string, product: string, invoiceDate: string) {
  const date = new Date(invoiceDate || todayIdDate());
  return pricingRules.find((rule) => rule.active && rule.category === category && rule.product === product && date >= new Date(rule.start) && date <= new Date(rule.end))
    ?? pricingRules.find((rule) => rule.active && rule.category === category && rule.product === product)
    ?? pricingRules.find((rule) => rule.active && rule.product === product);
}

function derivePaymentStatus(invoice: Invoice, payments: Payment[]) {
  const total = invoiceTotal(invoice);
  const paid = verifiedPaid(invoice.id, payments);
  if (paid >= total && total > 0) return "Paid";
  if (paid > 0 && paid >= total * 0.5) return "Partially Paid";
  if (paid > 0) return "DP Paid";
  if (invoice.dueDate && new Date(invoice.dueDate) < new Date()) return "Overdue";
  return "Unpaid";
}

function deriveVerificationStatus(invoice: Invoice, payments: Payment[]) {
  const related = payments.filter((payment) => payment.invoiceId === invoice.id);
  if (!related.length) return "No Payment";
  if (related.some((payment) => payment.verificationStatus === "Pending")) return "Pending Verification";
  if (related.some((payment) => payment.verificationStatus === "Rejected")) return "Rejected";
  return "Verified";
}

function calcInvoiceStatus(invoice: Invoice, payments: Payment[]) {
  const paid = verifiedPaid(invoice.id, payments);
  const total = invoiceTotal(invoice);
  if (paid >= total && total > 0) return "Paid";
  if (paid > 0 && paid >= total * 0.5) return "Partially Paid";
  if (paid > 0) return "DP Paid";
  return invoice.status === "Sent" ? "Sent" : "Draft";
}

function invoiceTargetLabel(invoice: Invoice) {
  return invoice.targetType ?? (invoice.vendorId ? "Vendor / Sponsor" : "Custom / Other");
}

function invoiceTargetSearch(invoice: Invoice) {
  return `${invoice.number} ${invoice.billTo} ${invoice.targetName ?? ""} ${invoice.category ?? ""} ${invoice.registrationType ?? ""}`.toLowerCase();
}

function tone(status: string) {
  if (["Completed", "Approved", "Verified", "Paid", "Fully Paid", "Sudah Lunas", "Available"].includes(status)) return "emerald" as const;
  if (["Pending", "Hold", "DP Paid", "Partially Paid", "Booked", "Submitted"].includes(status)) return "gold" as const;
  if (["In Progress", "Under Review", "Sent", "Draft", "Uploaded", "Archived"].includes(status)) return "blue" as const;
  if (["Missing", "Rejected", "Cancelled", "Overdue", "Belum Lunas"].includes(status)) return "red" as const;
  return "gray" as const;
}

function cleanRows(rows: Record<string, unknown>[]) {
  return rows.map((row) => {
    const next: Record<string, unknown> = {};
    Object.entries(row).forEach(([key, value]) => {
      next[key] = typeof value === "object" && value !== null ? JSON.stringify(value) : value;
    });
    return next;
  });
}

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function fieldValue(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function todayIdDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function Home() {
  const [data, setData] = useState<AppData>(() => emptyData());
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState<ModuleKey>("dashboard");
  const [modal, setModal] = useState<ModalState>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [toast, setToast] = useState("");
  const [selectedReport, setSelectedReport] = useState(reportOptions[0]);
  const [detailVendorId, setDetailVendorId] = useState<string | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseConnectionStatus>({
    state: "checking",
    message: "Checking Supabase connection..."
  });

  useEffect(() => {
    if (loaded && supabaseStatus.state !== "connected") localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, loaded, supabaseStatus.state]);

  useEffect(() => {
    let active = true;
    testSupabaseConnection().then((status) => {
      if (active) setSupabaseStatus(status);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (supabaseStatus.state === "checking") return;
    if (supabaseStatus.state === "connected") {
      fetchSupabaseAppData(seedEvent)
        .then((supabaseData) => {
          setData((current) => ({
            ...current,
            ...supabaseData,
            documents: supabaseData.documents as DocumentRecord[],
            letters: [],
            messages: []
          }));
          setLoaded(true);
        })
        .catch((error) => {
          setSupabaseStatus({ state: "local", message: "Mode lokal aktif", reason: error instanceof Error ? error.message : "Supabase data fetch failed" });
        });
      return;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    setData(saved ? JSON.parse(saved) as AppData : emptyData());
    setLoaded(true);
  }, [supabaseStatus.state]);

  const log = (action: string, entityType: string, entityName: string, notes = "") => {
    setData((current) => ({
      ...current,
      logs: [
        { id: uid("log"), user: currentUser, action, entityType, entityName, timestamp: new Date().toISOString(), notes },
        ...current.logs
      ]
    }));
  };

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  };

  const saveData = (updater: (current: AppData) => AppData, message: string, action?: [string, string, string, string?]) => {
    setData((current) => updater(current));
    if (action) window.setTimeout(() => log(action[0], action[1], action[2], action[3]), 0);
    notify(message);
  };

  const metrics = useMemo(() => {
    const totalInvoices = data.invoices.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
    const paid = data.payments.filter((payment) => payment.verificationStatus === "Verified").reduce((sum, payment) => sum + Number(payment.amount), 0);
    return [
      { label: "Total vendor", value: data.vendors.length, icon: Building2 },
      { label: "Total peserta", value: data.participants.length, icon: Users },
      { label: "Booth booked", value: data.booths.filter((booth) => booth.status !== "Available" && booth.status !== "Cancelled").length, icon: Store },
      { label: "Total invoice", value: data.invoices.length, icon: FileText },
      { label: "Total verified paid", value: rupiah(paid), icon: Banknote },
      { label: "Outstanding balance", value: rupiah(totalInvoices - paid), icon: BadgeCheck },
      { label: "File missing", value: data.files.filter((file) => file.status === "Missing").length, icon: Upload },
      { label: "Payment pending", value: data.payments.filter((payment) => payment.verificationStatus === "Pending").length, icon: WalletCards }
    ];
  }, [data]);

  const reportRows = useMemo(() => getReportRows(selectedReport, data), [selectedReport, data]);

  const openModal = (key: EditableKey, mode: "add" | "edit" | "view", id?: string) => setModal({ key, mode, id });

  const deleteRecord = async (key: EditableKey, id: string, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus/cancel "${name}"?`)) return;
    try {
      if (supabaseStatus.state === "connected") await deleteSupabaseRecord(key, id);
      saveData((current) => removeByKey(current, key, id), supabaseStatus.state === "connected" ? "Data berhasil dihapus dari Supabase." : "Data berhasil dihapus.", ["Deleted record", key, name]);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal menghapus data Supabase.");
    }
  };

  const archiveDocument = (name: string, type: string, relatedName: string, notes = "") => {
    saveData(
      (current) => ({
        ...current,
        documents: [{ id: uid("doc"), name, type, relatedName, status: "Archived", createdAt: new Date().toISOString(), notes }, ...current.documents]
      }),
      "Dokumen masuk Arsip Dokumen.",
      ["Archived document", "Document", name, notes]
    );
  };

  const verifyPayment = (paymentId: string, accepted: boolean) => {
    const payment = data.payments.find((item) => item.id === paymentId);
    if (!payment) return;
    const reason = accepted ? "" : window.prompt("Alasan reject pembayaran?", "Bukti transfer belum sesuai") ?? "";
    saveData(
      (current) => {
        const payments = current.payments.map((item) =>
          item.id === paymentId
            ? { ...item, verificationStatus: accepted ? "Verified" : "Rejected", verifiedBy: accepted ? data.event.contactPerson : undefined, notes: accepted ? item.notes : `${item.notes} | Rejected: ${reason}` }
            : item
        ) as Demo<Payment>[];
        const invoices = current.invoices.map((invoice) => ({
          ...invoice,
          dpPaid: verifiedPaid(invoice.id, payments),
          status: calcInvoiceStatus(invoice, payments)
        })) as Demo<Invoice>[];
        return { ...current, payments, invoices };
      },
      accepted ? "Pembayaran berhasil diverifikasi." : "Pembayaran ditolak.",
      [accepted ? "Verified payment" : "Rejected payment", "Payment", payment.senderName, reason]
    );
  };

  const markInvoiceSent = (invoiceId: string) => {
    const invoice = data.invoices.find((item) => item.id === invoiceId);
    if (!invoice) return;
    saveData(
      (current) => ({ ...current, invoices: current.invoices.map((item) => (item.id === invoiceId ? { ...item, status: "Sent" } : item)) as Demo<Invoice>[] }),
      "Invoice ditandai sudah dikirim.",
      ["Marked invoice as sent", "Invoice", invoice.number]
    );
  };

  const copyMessage = async (message: string, label: string) => {
    await navigator.clipboard.writeText(message);
    log("Copied WhatsApp message", "WhatsApp", label);
    notify("Pesan WhatsApp berhasil disalin.");
  };

  const saveMessage = (message: WhatsAppMessage) => {
    saveData((current) => ({ ...current, messages: [message, ...current.messages] }), "Pesan tersimpan di log WhatsApp.", ["Saved WhatsApp message", "WhatsApp", message.type]);
  };

  const generatePdf = async (kind: "invoice" | "receipt" | "agreement" | "report" | "benefit", id?: string, archive = false, openPrint = false) => {
    const { jsPDF } = await import("jspdf");
    await import("jspdf-autotable");
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    await drawPdfHeader(doc, data.event, kind === "invoice" ? "INVOICE" : kind === "receipt" ? "BUKTI PEMBAYARAN / RECEIPT" : kind === "agreement" ? "SURAT PERNYATAAN KESANGGUPAN BERPARTISIPASI" : kind === "benefit" ? "VENDOR BENEFIT CHECKLIST" : selectedReport.toUpperCase());

    let filename = "pass-riau-document.pdf";
    let relatedName = data.event.name;

    if (kind === "invoice") {
      const invoice = data.invoices.find((item) => item.id === id) ?? data.invoices[0];
      const vendor = data.vendors.find((item) => item.id === invoice.vendorId);
      relatedName = invoice.billTo;
      filename = `${invoice.number.replaceAll("/", "-")}.pdf`;
      await drawInvoicePdf(doc, data, invoice, vendor);
    }
    if (kind === "receipt") {
      const payment = data.payments.find((item) => item.id === id) ?? data.payments[0];
      const invoice = data.invoices.find((item) => item.id === payment.invoiceId) ?? data.invoices[0];
      relatedName = payment.senderName;
      filename = `Receipt-${payment.id}.pdf`;
      await drawReceiptPdf(doc, data, payment, invoice);
    }
    if (kind === "agreement") {
      const letter = data.letters.find((item) => item.id === id) ?? data.letters[0];
      const vendor = data.vendors.find((item) => item.id === letter.vendorId) ?? data.vendors[0];
      relatedName = vendor.company;
      filename = `Surat-Kesanggupan-${vendor.company}.pdf`;
      await drawAgreementPdf(doc, data, vendor, letter);
    }
    if (kind === "benefit") {
      const vendor = data.vendors.find((item) => item.id === id) ?? data.vendors[0];
      relatedName = vendor.company;
      filename = `Benefit-Checklist-${vendor.company}.pdf`;
      drawBenefitPdf(doc, data, vendor);
    }
    if (kind === "report") {
      filename = `${selectedReport.replaceAll(" ", "-")}.pdf`;
      drawReportPdf(doc, selectedReport, reportRows, data.event);
    }

    drawPdfFooter(doc, data.event);
    if (archive) archiveDocument(filename, `${kind.toUpperCase()} PDF`, relatedName, "Generated from app");
    if (openPrint) {
      doc.autoPrint();
      window.open(doc.output("bloburl"), "_blank");
      return;
    }
    doc.save(filename);
  };

  const exportExcel = async (rows?: Record<string, unknown>[], filename = "PASS-RIAU-report.xlsx") => {
    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();
    if (rows) {
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(cleanRows(rows)), "Report");
    } else {
      const sheets: [string, Record<string, unknown>[]][] = [
        ["Vendors", data.vendors],
        ["Participants", data.participants],
        ["Invoices", data.invoices.map((invoice) => ({ ...invoice, total: invoiceTotal(invoice), verifiedPaid: verifiedPaid(invoice.id, data.payments), pendingPaid: pendingPaid(invoice.id, data.payments) }))],
        ["Payments", data.payments],
        ["Booths", data.booths],
        ["Benefit Checklist", data.benefits],
        ["File Requirements", data.files],
        ["Activity Log", data.logs],
        ["Promo Usage", getReportRows("Promo usage report", data)]
      ];
      sheets.forEach(([name, sheetRows]) => XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(cleanRows(sheetRows)), name.slice(0, 31)));
    }
    XLSX.writeFile(workbook, filename);
    log("Exported report", "Report", filename);
  };

  const exportCsvRows = (rows: Record<string, unknown>[], filename: string) => {
    const clean = cleanRows(rows);
    const headers = Object.keys(clean[0] ?? {});
    const csv = [headers.join(","), ...clean.map((row) => headers.map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    downloadBlob(csv, filename, "text/csv;charset=utf-8");
    log("Exported report", "Report", filename);
  };

  const filtered = (rows: Record<string, unknown>[]) =>
    rows.filter((row) => {
      const text = JSON.stringify(row).toLowerCase();
      const status = String(row.status ?? row.verificationStatus ?? row.paymentStatus ?? "");
      return text.includes(query.toLowerCase()) && (statusFilter === "Semua" || status === statusFilter);
    });

  const selectedVendor = detailVendorId ? data.vendors.find((item) => item.id === detailVendorId) : null;

  return (
    <main className="h-screen overflow-hidden bg-ivory text-slate-800">
      <header className="border-b border-emeraldDeep/10 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-champagne">{data.event.name} <Badge tone={supabaseStatus.state === "connected" ? "emerald" : data.vendors.some((item) => item.demo) ? "blue" : "gold"}>{supabaseStatus.state === "connected" ? "Real Data" : data.vendors.some((item) => item.demo) ? "Demo" : "Local Mode"}</Badge></p>
            <h1 className="text-2xl font-bold text-emeraldDeep sm:text-3xl">PASS RIAU Event Manager</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">{data.event.fullTitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setActive("settings")}><Settings size={16} /> Demo Data</Button>
            <Button onClick={() => exportExcel()}><Download size={16} /> Export Backup Excel</Button>
          </div>
        </div>
      </header>

      <ConnectionBanner status={supabaseStatus} />

      <div className="mx-auto grid h-[calc(100vh-118px)] max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[260px_1fr]">
        <aside className="no-print min-h-0 overflow-y-auto pb-8">
          <nav className="grid gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-soft">
            {modules.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => setActive(item.id)} className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition ${active === item.id ? "bg-emeraldDeep text-white" : "text-slate-700 hover:bg-mist"}`}>
                  <Icon size={18} /> {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-h-0 overflow-y-auto pb-10">
          {active === "dashboard" && (
            <div className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => {
                  const Icon = metric.icon;
                  return <Card key={metric.label}><div className="flex items-start justify-between"><div><p className="text-sm text-slate-500">{metric.label}</p><p className="mt-2 text-2xl font-bold text-emeraldDeep">{metric.value}</p></div><Icon className="text-champagne" size={22} /></div></Card>;
                })}
              </div>
              <div className="grid gap-5 xl:grid-cols-2">
                <Card><SectionTitle title="Follow-up Cepat" subtitle="Data yang perlu perhatian panitia." /><ActionList items={[
                  `${data.files.filter((item) => item.status === "Missing").length} file sponsor masih missing`,
                  `${data.payments.filter((item) => item.verificationStatus === "Pending").length} bukti transfer menunggu verifikasi`,
                  `${data.benefits.filter((item) => !["Completed", "Not Applicable"].includes(item.status)).length} benefit belum selesai`,
                  `${data.booths.filter((item) => item.status === "Available").length} booth masih tersedia`
                ]} /></Card>
                <Card><SectionTitle title="Aktivitas Terbaru" subtitle="Log aksi nyata dari tombol aplikasi." /> <LogTable rows={data.logs.slice(0, 6)} /></Card>
              </div>
            </div>
          )}

          {active === "event" && <EventSettingsPanel data={data} setData={setData} notify={notify} log={log} supabaseStatus={supabaseStatus} />}
          {active === "committee" && <CrudPanel title="Committee / Panitia" subtitle="Tambah, lihat, edit, hapus panitia dan role akses." primary="Tambah Panitia" rows={filtered(data.committee)} columns={["name", "role", "whatsapp", "email", "accessRole"]} getName={(row) => String(row.name)} onAdd={() => openModal("committee", "add")} onView={(id) => openModal("committee", "view", id)} onEdit={(id) => openModal("committee", "edit", id)} onDelete={deleteRecord} moduleKey="committee" />}
          {active === "vendors" && <VendorPanel data={data} filtered={filtered(data.vendors)} query={query} setQuery={setQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} openModal={openModal} deleteRecord={deleteRecord} setDetailVendorId={setDetailVendorId} generatePdf={generatePdf} />}
          {active === "participants" && <CrudPanel title="Peserta / Participants" subtitle="Registrasi peserta individual dan status badge/sertifikat." primary="Tambah Peserta" rows={filtered(data.participants)} columns={["fullName", "institution", "category", "paymentStatus", "badgeStatus"]} getName={(row) => String(row.fullName)} onAdd={() => openModal("participants", "add")} onView={(id) => openModal("participants", "view", id)} onEdit={(id) => openModal("participants", "edit", id)} onDelete={deleteRecord} moduleKey="participants" />}
          {active === "groups" && <GroupPanel data={data} saveData={saveData} />}
          {active === "booths" && <BoothPanel data={data} rows={filtered(data.booths)} openModal={openModal} deleteRecord={deleteRecord} />}
          {active === "benefits" && <BenefitPanel data={data} rows={filtered(data.benefits)} openModal={openModal} deleteRecord={deleteRecord} generatePdf={generatePdf} />}
          {active === "files" && <FilePanel data={data} rows={filtered(data.files)} openModal={openModal} deleteRecord={deleteRecord} saveData={saveData} />}
          {active === "invoices" && <InvoicePanel data={data} rows={filtered(data.invoices)} openModal={openModal} deleteRecord={deleteRecord} generatePdf={generatePdf} archiveDocument={archiveDocument} markSent={markInvoiceSent} copyMessage={copyMessage} saveMessage={saveMessage} />}
          {active === "payments" && <PaymentPanel data={data} rows={filtered(data.payments)} openModal={openModal} deleteRecord={deleteRecord} verifyPayment={verifyPayment} generatePdf={generatePdf} copyMessage={copyMessage} saveMessage={saveMessage} />}
          {active === "archive" && <ArchivePanel rows={filtered(data.documents)} openModal={openModal} deleteRecord={deleteRecord} />}
          {active === "agreement" && <AgreementPanel data={data} rows={filtered(data.letters)} openModal={openModal} deleteRecord={deleteRecord} generatePdf={generatePdf} copyMessage={copyMessage} saveMessage={saveMessage} />}
          {active === "whatsapp" && <WhatsAppPanel data={data} copyMessage={copyMessage} saveMessage={saveMessage} />}
          {active === "activity" && <ActivityPanel rows={filtered(data.logs)} exportCsvRows={exportCsvRows} />}
          {active === "reports" && <ReportsPanel selectedReport={selectedReport} setSelectedReport={setSelectedReport} rows={reportRows} exportCsvRows={exportCsvRows} exportExcel={exportExcel} exportPdf={() => generatePdf("report")} />}
          {active === "settings" && <SettingsPanel data={data} setData={setData} notify={notify} log={log} supabaseStatus={supabaseStatus} exportBackup={() => downloadBlob(JSON.stringify(data, null, 2), "pass-riau-backup.json", "application/json")} />}
        </section>
      </div>

      {selectedVendor && <VendorDetail vendor={selectedVendor} data={data} onClose={() => setDetailVendorId(null)} />}
      {modal && <CrudModal modal={modal} data={data} setData={setData} close={() => setModal(null)} notify={notify} log={log} supabaseStatus={supabaseStatus} />}
      {toast && <div className="fixed bottom-5 right-5 z-50 rounded-lg bg-emeraldDeep px-4 py-3 text-sm font-semibold text-white shadow-soft">{toast}</div>}
    </main>
  );
}

function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-xl font-bold text-emeraldDeep">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>{action}</div>;
}

function ConnectionBanner({ status }: { status: SupabaseConnectionStatus }) {
  if (status.state === "connected") {
    return (
      <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
        <strong>Supabase connected.</strong> Environment variables are present and the `events` table is reachable.
      </div>
    );
  }

  if (status.state === "checking") {
    return (
      <div className="border-b border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-900">
        Checking Supabase connection...
      </div>
    );
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950">
      <strong>Mode lokal aktif.</strong> Hubungkan Supabase untuk sinkronisasi online.
      <span className="ml-2 rounded bg-white/70 px-2 py-0.5 font-mono text-xs">Reason: {status.reason}</span>
    </div>
  );
}

function ActionList({ items }: { items: string[] }) {
  return <div className="grid gap-2">{items.map((item) => <div key={item} className="rounded-md bg-mist p-3 text-sm text-emeraldDeep"><CheckCircle2 className="mr-2 inline text-champagne" size={16} />{item}</div>)}</div>;
}

function Toolbar({ primary, onAdd }: { primary: string; onAdd: () => void }) {
  return <Button onClick={onAdd}><Plus size={16} /> {primary}</Button>;
}

function FilterBar({ query, setQuery, statusFilter, setStatusFilter }: { query: string; setQuery: (value: string) => void; statusFilter: string; setStatusFilter: (value: string) => void }) {
  return <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]"><div className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={16} /><Input className="pl-9" placeholder="Cari data..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Semua</option><option>Missing</option><option>Pending</option><option>Under Review</option><option>Approved</option><option>Verified</option><option>Rejected</option><option>Paid</option><option>Sent</option><option>Available</option><option>Booked</option></Select></div>;
}

function CrudPanel({ title, subtitle, primary, rows, columns, getName, onAdd, onView, onEdit, onDelete, moduleKey }: { title: string; subtitle: string; primary: string; rows: Record<string, unknown>[]; columns: string[]; getName: (row: Record<string, unknown>) => string; onAdd: () => void; onView: (id: string) => void; onEdit: (id: string) => void; onDelete: (key: EditableKey, id: string, name: string) => void; moduleKey: EditableKey }) {
  return <Card><SectionTitle title={title} subtitle={subtitle} action={<Toolbar primary={primary} onAdd={onAdd} />} />{rows.length === 0 ? <EmptyState title="Belum ada data" body="Klik tombol tambah untuk membuat data baru." /> : <Table><thead><tr>{columns.map((col) => <Th key={col}>{col}</Th>)}<Th>Status</Th><Th>Aksi</Th></tr></thead><tbody>{rows.map((row) => <tr key={String(row.id)}>{columns.map((col) => <Td key={col}>{renderCell(row[col])}</Td>)}<Td>{row.demo ? <Badge tone="blue">Demo</Badge> : <Badge tone="emerald">Aktif</Badge>}</Td><Td><RowActions onView={() => onView(String(row.id))} onEdit={() => onEdit(String(row.id))} onDelete={() => onDelete(moduleKey, String(row.id), getName(row))} /></Td></tr>)}</tbody></Table>}</Card>;
}

function RowActions({ onView, onEdit, onDelete, extra }: { onView?: () => void; onEdit?: () => void; onDelete?: () => void; extra?: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1">{onView && <Button variant="ghost" onClick={onView}><Eye size={15} /></Button>}{onEdit && <Button variant="ghost" onClick={onEdit}><Edit3 size={15} /></Button>}{extra}{onDelete && <Button variant="ghost" onClick={onDelete}><Trash2 size={15} /></Button>}</div>;
}

function renderCell(value: unknown) {
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (typeof value === "number" && value > 100000) return rupiah(value);
  if (typeof value === "string" && ["Missing", "Submitted", "Under Review", "Approved", "Rejected", "Pending", "Verified", "Paid", "Sent", "Booked", "Available", "Completed", "In Progress", "DP Paid", "Partially Paid"].includes(value)) return <Badge tone={tone(value)}>{value}</Badge>;
  return String(value ?? "-");
}

function VendorPanel({ data, filtered, query, setQuery, statusFilter, setStatusFilter, openModal, deleteRecord, setDetailVendorId, generatePdf }: { data: AppData; filtered: Record<string, unknown>[]; query: string; setQuery: (value: string) => void; statusFilter: string; setStatusFilter: (value: string) => void; openModal: (key: EditableKey, mode: "add" | "edit" | "view", id?: string) => void; deleteRecord: (key: EditableKey, id: string, name: string) => void; setDetailVendorId: (id: string) => void; generatePdf: (kind: "invoice" | "receipt" | "agreement" | "report" | "benefit", id?: string, archive?: boolean, openPrint?: boolean) => void }) {
  return <Card><SectionTitle title="Vendor & Sponsor" subtitle="CRUD sponsor, detail vendor, benefit, file, invoice, dan surat." action={<Toolbar primary="Tambah Vendor" onAdd={() => openModal("vendors", "add")} />} /><FilterBar query={query} setQuery={setQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />{filtered.length === 0 ? <EmptyState title="Tidak ada vendor" body="Data vendor kosong atau filter terlalu spesifik." /> : <Table><thead><tr><Th>Company</Th><Th>PIC</Th><Th>Paket</Th><Th>Booth</Th><Th>Handler</Th><Th>Status</Th><Th>Aksi</Th></tr></thead><tbody>{filtered.map((row) => { const vendor = row as Vendor & { demo?: boolean }; return <tr key={vendor.id}><Td><button className="font-semibold text-emeraldDeep underline" onClick={() => setDetailVendorId(vendor.id)}>{vendor.company}</button> {vendor.demo && <Badge tone="blue">Demo</Badge>}</Td><Td>{vendor.pic}<br /><span className="text-xs">{vendor.whatsapp}</span></Td><Td>{vendor.packageName}<br />{rupiah(vendor.packagePrice)}</Td><Td>{vendor.boothNumber}</Td><Td>{vendor.handler}</Td><Td><Badge tone={tone(vendor.status)}>{vendor.status}</Badge></Td><Td><RowActions onView={() => openModal("vendors", "view", vendor.id)} onEdit={() => openModal("vendors", "edit", vendor.id)} onDelete={() => deleteRecord("vendors", vendor.id, vendor.company)} extra={<Button variant="ghost" onClick={() => generatePdf("benefit", vendor.id)}><FileText size={15} /></Button>} /></Td></tr>; })}</tbody></Table>}</Card>;
}

function BoothPanel({ data, rows, openModal, deleteRecord }: { data: AppData; rows: Record<string, unknown>[]; openModal: (key: EditableKey, mode: "add" | "edit" | "view", id?: string) => void; deleteRecord: (key: EditableKey, id: string, name: string) => void }) {
  return <Card><SectionTitle title="Booth Status Tracker" subtitle="Double booking dicegah saat simpan. Hold expired terlihat dari tanggal." action={<Toolbar primary="Tambah Booth" onAdd={() => openModal("booths", "add")} />} /><Table><thead><tr><Th>Booth</Th><Th>Size</Th><Th>Area</Th><Th>Status</Th><Th>Vendor</Th><Th>Hold expiry</Th><Th>Electricity</Th><Th>Aksi</Th></tr></thead><tbody>{rows.map((row) => { const booth = row as Booth; const vendor = data.vendors.find((item) => item.id === booth.vendorId); const expired = booth.holdExpiry && new Date(booth.holdExpiry) < new Date(); return <tr key={booth.id}><Td>{booth.number}</Td><Td>{booth.size}</Td><Td>{booth.area}</Td><Td><Badge tone={expired ? "red" : tone(booth.status)}>{expired ? "Hold Expired" : booth.status}</Badge></Td><Td>{vendor?.company ?? "-"}</Td><Td>{booth.holdExpiry ?? "-"}</Td><Td>{booth.electricityNote}</Td><Td><RowActions onView={() => openModal("booths", "view", booth.id)} onEdit={() => openModal("booths", "edit", booth.id)} onDelete={() => deleteRecord("booths", booth.id, booth.number)} /></Td></tr>; })}</tbody></Table></Card>;
}

function BenefitPanel({ data, rows, openModal, deleteRecord, generatePdf }: { data: AppData; rows: Record<string, unknown>[]; openModal: (key: EditableKey, mode: "add" | "edit" | "view", id?: string) => void; deleteRecord: (key: EditableKey, id: string, name: string) => void; generatePdf: (kind: "invoice" | "receipt" | "agreement" | "report" | "benefit", id?: string) => void }) {
  return <Card><SectionTitle title="Checklist Benefit" subtitle="Pantau promised, pending, completed, atau not applicable per sponsor." action={<Toolbar primary="Tambah Benefit" onAdd={() => openModal("benefits", "add")} />} /><Table><thead><tr><Th>Vendor</Th><Th>Benefit</Th><Th>Qty</Th><Th>Due date</Th><Th>PIC</Th><Th>Status</Th><Th>Aksi</Th></tr></thead><tbody>{rows.map((row) => { const benefit = row as VendorBenefit; const vendor = data.vendors.find((item) => item.id === benefit.vendorId); return <tr key={benefit.id}><Td>{vendor?.company}</Td><Td>{benefit.name}<br /><span className="text-xs">{benefit.notes}</span></Td><Td>{benefit.quantity}</Td><Td>{benefit.dueDate}</Td><Td>{benefit.responsible}</Td><Td><Badge tone={tone(benefit.status)}>{benefit.status}</Badge></Td><Td><RowActions onView={() => openModal("benefits", "view", benefit.id)} onEdit={() => openModal("benefits", "edit", benefit.id)} onDelete={() => deleteRecord("benefits", benefit.id, benefit.name)} extra={<Button variant="ghost" onClick={() => generatePdf("benefit", benefit.vendorId)}><Download size={15} /></Button>} /></Td></tr>; })}</tbody></Table></Card>;
}

function FilePanel({ data, rows, openModal, deleteRecord, saveData }: { data: AppData; rows: Record<string, unknown>[]; openModal: (key: EditableKey, mode: "add" | "edit" | "view", id?: string) => void; deleteRecord: (key: EditableKey, id: string, name: string) => void; saveData: (updater: (current: AppData) => AppData, message: string, action?: [string, string, string, string?]) => void }) {
  const patch = (id: string, status: FileRequirement["status"], notes = "") => saveData((current) => ({ ...current, files: current.files.map((item) => item.id === id ? { ...item, status, uploaded: !["Missing", "Rejected"].includes(status), notes: notes || item.notes, reviewedBy: current.event.contactPerson } : item) as Demo<FileRequirement>[] }), `Status file menjadi ${status}.`, ["Updated file requirement", "File Requirement", id, status]);
  return <Card><SectionTitle title="Kelengkapan File" subtitle="Viewable tracker: missing, submitted, review, approve, reject, not required." action={<Toolbar primary="Tambah Requirement" onAdd={() => openModal("files", "add")} />} /><Table><thead><tr><Th>Vendor</Th><Th>File</Th><Th>Required</Th><Th>Uploaded</Th><Th>Due</Th><Th>Status</Th><Th>Reviewed by</Th><Th>Aksi</Th></tr></thead><tbody>{rows.map((row) => { const file = row as FileRequirement; const vendor = data.vendors.find((item) => item.id === file.vendorId); return <tr key={file.id}><Td>{vendor?.company}</Td><Td>{file.name}<br /><span className="text-xs">{file.notes}</span></Td><Td>{file.required ? "Ya" : "Tidak"}</Td><Td>{file.uploaded ? "Ya" : "Belum"}</Td><Td>{file.dueDate}</Td><Td><Badge tone={tone(file.status)}>{file.status}</Badge></Td><Td>{file.reviewedBy ?? "-"}</Td><Td><RowActions onView={() => openModal("files", "view", file.id)} onEdit={() => openModal("files", "edit", file.id)} onDelete={() => deleteRecord("files", file.id, file.name)} extra={<><Button variant="ghost" onClick={() => patch(file.id, "Submitted")}>Submit</Button><Button variant="ghost" onClick={() => patch(file.id, "Approved")}>Approve</Button><Button variant="ghost" onClick={() => patch(file.id, "Rejected", window.prompt("Alasan reject?", "File belum sesuai") ?? "")}>Reject</Button></>} /></Td></tr>; })}</tbody></Table></Card>;
}

function InvoicePanel({ data, rows, openModal, deleteRecord, generatePdf, archiveDocument, markSent, copyMessage, saveMessage }: { data: AppData; rows: Record<string, unknown>[]; openModal: (key: EditableKey, mode: "add" | "edit" | "view", id?: string) => void; deleteRecord: (key: EditableKey, id: string, name: string) => void; generatePdf: (kind: "invoice" | "receipt" | "agreement" | "report" | "benefit", id?: string, archive?: boolean, openPrint?: boolean) => void; archiveDocument: (name: string, type: string, relatedName: string, notes?: string) => void; markSent: (id: string) => void; copyMessage: (message: string, label: string) => Promise<void>; saveMessage: (message: WhatsAppMessage) => void }) {
  const [targetFilter, setTargetFilter] = useState("Semua");
  const [paymentFilter, setPaymentFilter] = useState("Semua");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const invoices = rows.map((row) => row as Invoice).filter((invoice) => {
    const paymentStatus = derivePaymentStatus(invoice, data.payments);
    const date = new Date(invoice.invoiceDate || todayIdDate());
    return (targetFilter === "Semua" || invoiceTargetLabel(invoice) === targetFilter)
      && (paymentFilter === "Semua" || paymentStatus === paymentFilter)
      && (!dateFrom || date >= new Date(dateFrom))
      && (!dateTo || date <= new Date(dateTo))
      && invoiceTargetSearch(invoice).includes(search.toLowerCase());
  });

  const actionButton = (label: string, icon: React.ReactNode, onClick: () => void) => <Button variant="ghost" className="h-8 min-h-8 w-8 px-0" title={label} aria-label={label} onClick={onClick}>{icon}</Button>;

  return (
    <Card>
      <SectionTitle title="Invoice Generator" subtitle="Target type jelas, harga otomatis, status invoice/payment/verifikasi dipisah." action={<Toolbar primary="Buat Invoice" onAdd={() => openModal("invoices", "add")} />} />
      <div className="mb-4 grid gap-2 md:grid-cols-5">
        <div className="relative md:col-span-2"><Search className="absolute left-3 top-3 text-slate-400" size={16} /><Input className="pl-9" placeholder="Cari nomor, vendor, peserta, group..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <Select value={targetFilter} onChange={(event) => setTargetFilter(event.target.value)}><option>Semua</option>{invoiceTargetTypes.map((type) => <option key={type}>{type}</option>)}</Select>
        <Select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}><option>Semua</option><option>Unpaid</option><option>DP Paid</option><option>Partially Paid</option><option>Paid</option><option>Overdue</option></Select>
        <div className="grid grid-cols-2 gap-2"><Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /><Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></div>
      </div>
      {invoices.length === 0 ? <EmptyState title="Tidak ada invoice" body="Klik Buat Invoice atau ubah filter pencarian." /> : (
        <>
          <div className="hidden md:block">
            <Table><thead><tr><Th>Invoice</Th><Th>Target</Th><Th>Total</Th><Th>Paid</Th><Th>Remaining</Th><Th>Invoice</Th><Th>Payment</Th><Th>Verify</Th><Th>Aksi</Th></tr></thead><tbody>{invoices.map((invoice) => { const total = invoiceTotal(invoice); const paid = verifiedPaid(invoice.id, data.payments); const vendor = data.vendors.find((item) => item.id === invoice.vendorId || item.id === invoice.targetId); const message = `Selamat siang Bapak/Ibu/Dr./Tim ${invoice.billTo}, berikut kami kirimkan invoice ${invoice.number} untuk ${invoiceTargetLabel(invoice)} PASS RIAU ${data.event.year}. Total ${rupiah(total)}, sisa ${rupiah(total - paid)}. Terima kasih.`; return <tr key={invoice.id}><Td><span className="font-semibold">{invoice.number}</span><br /><span className="text-xs">{invoice.invoiceDate} / due {invoice.dueDate}</span></Td><Td>{invoiceTargetLabel(invoice)}<br /><span className="text-xs">{invoice.billTo}</span></Td><Td>{rupiah(total)}</Td><Td>{rupiah(paid)}</Td><Td>{rupiah(total - paid)}</Td><Td><Badge tone={tone(invoice.status)}>{invoice.status}</Badge></Td><Td><Badge tone={tone(derivePaymentStatus(invoice, data.payments))}>{derivePaymentStatus(invoice, data.payments)}</Badge></Td><Td><Badge tone={tone(deriveVerificationStatus(invoice, data.payments))}>{deriveVerificationStatus(invoice, data.payments)}</Badge></Td><Td><div className="flex flex-nowrap items-center gap-1">{actionButton("View", <Eye size={15} />, () => openModal("invoices", "view", invoice.id))}{actionButton("Edit", <Edit3 size={15} />, () => openModal("invoices", "edit", invoice.id))}{actionButton("Download PDF", <Download size={15} />, () => generatePdf("invoice", invoice.id))}{actionButton("Print", <Printer size={15} />, () => generatePdf("invoice", invoice.id, false, true))}{actionButton("Archive", <Archive size={15} />, () => { archiveDocument(`${invoice.number.replaceAll("/", "-")}.pdf`, "Invoice PDF", invoice.billTo); generatePdf("invoice", invoice.id, true); })}{actionButton("Mark Sent", <CheckCircle2 size={15} />, () => markSent(invoice.id))}{actionButton("Copy WhatsApp", <Copy size={15} />, () => { copyMessage(message, invoice.number); saveMessage({ id: uid("wa"), type: "Send invoice", recipient: invoice.billTo, phone: vendor?.whatsapp ?? "", text: message }); })}{vendor?.whatsapp && <a title="Open WhatsApp" aria-label="Open WhatsApp" className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100" href={waUrl(vendor.whatsapp, message)} target="_blank" rel="noreferrer"><MessageCircle size={15} /></a>}{actionButton("Delete/Cancel", <Trash2 size={15} />, () => deleteRecord("invoices", invoice.id, invoice.number))}</div></Td></tr>; })}</tbody></Table>
          </div>
          <div className="grid gap-3 md:hidden">{invoices.map((invoice) => { const total = invoiceTotal(invoice); const paid = verifiedPaid(invoice.id, data.payments); return <div key={invoice.id} className="rounded-lg border border-slate-200 bg-white p-3"><div className="flex items-start justify-between gap-2"><div><p className="font-semibold text-emeraldDeep">{invoice.number}</p><p className="text-sm">{invoice.billTo}</p><p className="text-xs text-slate-500">{invoiceTargetLabel(invoice)} | {invoice.invoiceDate}</p></div><Badge tone={tone(derivePaymentStatus(invoice, data.payments))}>{derivePaymentStatus(invoice, data.payments)}</Badge></div><div className="mt-2 grid grid-cols-3 gap-2 text-sm"><p>Total<br /><strong>{rupiah(total)}</strong></p><p>Paid<br /><strong>{rupiah(paid)}</strong></p><p>Sisa<br /><strong>{rupiah(total - paid)}</strong></p></div><div className="mt-2 flex flex-wrap gap-1">{actionButton("View", <Eye size={15} />, () => openModal("invoices", "view", invoice.id))}{actionButton("Edit", <Edit3 size={15} />, () => openModal("invoices", "edit", invoice.id))}{actionButton("Download PDF", <Download size={15} />, () => generatePdf("invoice", invoice.id))}{actionButton("Delete/Cancel", <Trash2 size={15} />, () => deleteRecord("invoices", invoice.id, invoice.number))}</div></div>; })}</div>
        </>
      )}
    </Card>
  );
}

function PaymentPanel({ data, rows, openModal, deleteRecord, verifyPayment, generatePdf, copyMessage, saveMessage }: { data: AppData; rows: Record<string, unknown>[]; openModal: (key: EditableKey, mode: "add" | "edit" | "view", id?: string) => void; deleteRecord: (key: EditableKey, id: string, name: string) => void; verifyPayment: (id: string, accepted: boolean) => void; generatePdf: (kind: "invoice" | "receipt" | "agreement" | "report" | "benefit", id?: string, archive?: boolean, openPrint?: boolean) => void; copyMessage: (message: string, label: string) => Promise<void>; saveMessage: (message: WhatsAppMessage) => void }) {
  return <Card><SectionTitle title="Pembayaran / Receipt / Bukti Transfer" subtitle="Pending payment tidak dihitung lunas sampai diverifikasi. Target pembayaran bisa vendor, peserta, group, atau custom." action={<Toolbar primary="Tambah Pembayaran" onAdd={() => openModal("payments", "add")} />} /><Table><thead><tr><Th>Target</Th><Th>Invoice</Th><Th>Tanggal</Th><Th>Jumlah</Th><Th>Pengirim</Th><Th>Status</Th><Th>Diterima</Th><Th>Aksi</Th></tr></thead><tbody>{rows.map((row) => { const payment = row as Payment; const invoice = data.invoices.find((item) => item.id === payment.invoiceId); const message = `Selamat siang Bapak/Ibu/Dr./Tim ${payment.linkedEntityName ?? payment.senderName}, pembayaran sebesar ${rupiah(payment.amount)} untuk invoice ${invoice?.number ?? "-"} sudah kami terima${payment.verificationStatus === "Verified" ? " dan verifikasi" : " dan sedang menunggu verifikasi"}. Terima kasih.`; return <tr key={payment.id}><Td>{payment.targetType ?? "Vendor / Sponsor"}<br /><span className="text-xs">{payment.linkedEntityName ?? "-"}</span></Td><Td>{invoice?.number}<br /><span className="text-xs">{payment.specialAgreement}</span></Td><Td>{payment.date}</Td><Td>{rupiah(payment.amount)}</Td><Td>{payment.senderName}</Td><Td><Badge tone={tone(payment.verificationStatus)}>{payment.verificationStatus}</Badge></Td><Td>{payment.receivedBy}</Td><Td><RowActions onView={() => openModal("payments", "view", payment.id)} onEdit={() => openModal("payments", "edit", payment.id)} onDelete={() => deleteRecord("payments", payment.id, payment.senderName)} extra={<>{payment.verificationStatus === "Pending" && <><Button variant="ghost" onClick={() => verifyPayment(payment.id, true)}>Verify</Button><Button variant="ghost" onClick={() => verifyPayment(payment.id, false)}>Reject</Button></>}{payment.verificationStatus === "Verified" && <Button variant="ghost" onClick={() => generatePdf("receipt", payment.id, true)}><ReceiptText size={15} /></Button>}<Button variant="ghost" onClick={() => { copyMessage(message, payment.id); saveMessage({ id: uid("wa"), type: "Send receipt", recipient: payment.senderName, phone: "", text: message }); }}><Copy size={15} /></Button></>} /></Td></tr>; })}</tbody></Table></Card>;
}

function ArchivePanel({ rows, openModal, deleteRecord }: { rows: Record<string, unknown>[]; openModal: (key: EditableKey, mode: "add" | "edit" | "view", id?: string) => void; deleteRecord: (key: EditableKey, id: string, name: string) => void }) {
  return <Card><SectionTitle title="Arsip Dokumen" subtitle="Metadata dokumen tersimpan lokal, siap diarahkan ke Supabase Storage." action={<Toolbar primary="Tambah Dokumen" onAdd={() => openModal("archive", "add")} />} /><Table><thead><tr><Th>Nama</Th><Th>Type</Th><Th>Related</Th><Th>Status</Th><Th>Tanggal</Th><Th>Aksi</Th></tr></thead><tbody>{rows.map((row) => { const doc = row as DocumentRecord; return <tr key={doc.id}><Td>{doc.name} {doc.demo && <Badge tone="blue">Demo</Badge>}</Td><Td>{doc.type}</Td><Td>{doc.relatedName}</Td><Td><Badge tone={tone(doc.status)}>{doc.status}</Badge></Td><Td>{new Date(doc.createdAt).toLocaleDateString("id-ID")}</Td><Td><RowActions onView={() => openModal("archive", "view", doc.id)} onEdit={() => openModal("archive", "edit", doc.id)} onDelete={() => deleteRecord("archive", doc.id, doc.name)} extra={<><Button variant="ghost" onClick={() => window.print()}><Printer size={15} /></Button><Button variant="ghost" onClick={() => downloadBlob(`Document archive metadata\n${JSON.stringify(doc, null, 2)}`, `${doc.name}.txt`, "text/plain")}><Download size={15} /></Button></>} /></Td></tr>; })}</tbody></Table></Card>;
}

function AgreementPanel({ data, rows, openModal, deleteRecord, generatePdf, copyMessage, saveMessage }: { data: AppData; rows: Record<string, unknown>[]; openModal: (key: EditableKey, mode: "add" | "edit" | "view", id?: string) => void; deleteRecord: (key: EditableKey, id: string, name: string) => void; generatePdf: (kind: "invoice" | "receipt" | "agreement" | "report" | "benefit", id?: string, archive?: boolean, openPrint?: boolean) => void; copyMessage: (message: string, label: string) => Promise<void>; saveMessage: (message: WhatsAppMessage) => void }) {
  return <Card><SectionTitle title="Surat Kesanggupan Sponsor" subtitle="Formal PDF generator untuk sponsor commitment letter." action={<Toolbar primary="Buat Surat Sponsor" onAdd={() => openModal("agreement", "add")} />} /><Table><thead><tr><Th>Nomor</Th><Th>Vendor</Th><Th>Signer</Th><Th>Tanggal</Th><Th>Status</Th><Th>Aksi</Th></tr></thead><tbody>{rows.map((row) => { const letter = row as SponsorLetter; const vendor = data.vendors.find((item) => item.id === letter.vendorId); const message = `Selamat siang Bapak/Ibu/Dr./Tim ${vendor?.company ?? ""}, berikut kami kirimkan Surat Kesanggupan Berpartisipasi untuk PASS RIAU ${data.event.year}. Mohon dapat dicek dan dikonfirmasi. Terima kasih.`; return <tr key={letter.id}><Td>{letter.number}</Td><Td>{vendor?.company}</Td><Td>{letter.signerName}</Td><Td>{letter.cityDate}</Td><Td><Badge tone={letter.demo ? "blue" : "emerald"}>{letter.demo ? "Demo" : "Aktif"}</Badge></Td><Td><RowActions onView={() => openModal("agreement", "view", letter.id)} onEdit={() => openModal("agreement", "edit", letter.id)} onDelete={() => deleteRecord("agreement", letter.id, letter.number)} extra={<><Button variant="ghost" onClick={() => generatePdf("agreement", letter.id)}><Download size={15} /></Button><Button variant="ghost" onClick={() => generatePdf("agreement", letter.id, true)}><Archive size={15} /></Button><Button variant="ghost" onClick={() => { copyMessage(message, letter.number); saveMessage({ id: uid("wa"), type: "Sponsor agreement", recipient: vendor?.company ?? "", phone: vendor?.whatsapp ?? "", text: message }); }}><Copy size={15} /></Button>{vendor?.whatsapp && <a className="rounded-md px-3 py-2 text-sm hover:bg-slate-100" href={waUrl(vendor.whatsapp, message)} target="_blank" rel="noreferrer">WA</a>}</>} /></Td></tr>; })}</tbody></Table></Card>;
}

function WhatsAppPanel({ data, copyMessage, saveMessage }: { data: AppData; copyMessage: (message: string, label: string) => Promise<void>; saveMessage: (message: WhatsAppMessage) => void }) {
  const vendor = data.vendors[0];
  const invoice = data.invoices.find((item) => item.vendorId === vendor?.id) ?? data.invoices[0];
  const missing = data.files.filter((item) => item.vendorId === vendor?.id && item.status === "Missing").map((item) => item.name).join(", ") || "tidak ada";
  const templates = [
    ["Send invoice", `Selamat siang Bapak/Ibu/Dr./Tim ${vendor?.company}, berikut kami kirimkan invoice ${invoice?.number} untuk partisipasi pada PASS RIAU ${data.event.year}. Total tagihan ${rupiah(invoiceTotal(invoice))}. Terima kasih.`],
    ["Payment reminder", `Selamat siang Bapak/Ibu/Dr./Tim ${vendor?.company}, kami mengingatkan sisa tagihan invoice ${invoice?.number} sebesar ${rupiah(invoiceTotal(invoice) - verifiedPaid(invoice.id, data.payments))}. Mohon konfirmasi apabila sudah transfer. Terima kasih.`],
    ["Request missing files", `Selamat siang Bapak/Ibu/Dr./Tim ${vendor?.company}, untuk kebutuhan publikasi PASS RIAU ${data.event.year}, mohon mengirimkan file berikut: ${missing}. Terima kasih.`],
    ["Booth confirmation", `Selamat siang Bapak/Ibu/Dr./Tim ${vendor?.company}, kami konfirmasi booth ${vendor?.boothNumber} untuk ${vendor?.company} pada PASS RIAU ${data.event.year}. Terima kasih.`],
    ["Thank you full payment", `Selamat siang Bapak/Ibu/Dr./Tim ${vendor?.company}, terima kasih. Pembayaran partisipasi PASS RIAU ${data.event.year} sudah kami terima dengan baik.`]
  ];
  return <Card><SectionTitle title="WhatsApp-ready Messages" subtitle="Copy, open WhatsApp, dan simpan ke activity log." /><div className="grid gap-4">{templates.map(([title, text]) => <div key={title} className="rounded-lg border border-slate-200 p-4"><p className="font-bold">{title}</p><p className="mt-2 text-sm text-slate-600">{text}</p><div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" onClick={() => { copyMessage(text, title); saveMessage({ id: uid("wa"), type: title, recipient: vendor?.company ?? "", phone: vendor?.whatsapp ?? "", text }); }}><Copy size={15} /> Copy</Button>{vendor?.whatsapp && <a className="inline-flex min-h-10 items-center rounded-md bg-emeraldDeep px-3 py-2 text-sm font-medium text-white" href={waUrl(vendor.whatsapp, text)} target="_blank" rel="noreferrer">Open WhatsApp</a>}</div></div>)}</div></Card>;
}

function ActivityPanel({ rows, exportCsvRows }: { rows: Record<string, unknown>[]; exportCsvRows: (rows: Record<string, unknown>[], filename: string) => void }) {
  return <Card><SectionTitle title="Activity Log" subtitle="Semua aksi penting dicatat di sini." action={<Button onClick={() => exportCsvRows(rows, "activity-log.csv")}><Download size={16} /> Export CSV</Button>} /><LogTable rows={rows as ActivityLog[]} /></Card>;
}

function LogTable({ rows }: { rows: ActivityLog[] }) {
  return <Table><thead><tr><Th>Timestamp</Th><Th>User</Th><Th>Action</Th><Th>Entity</Th><Th>Notes</Th></tr></thead><tbody>{rows.map((log) => <tr key={log.id}><Td>{new Date(log.timestamp).toLocaleString("id-ID")}</Td><Td>{log.user}</Td><Td>{log.action}</Td><Td>{log.entityType}: {log.entityName}</Td><Td>{log.notes}</Td></tr>)}</tbody></Table>;
}

function ReportsPanel({ selectedReport, setSelectedReport, rows, exportCsvRows, exportExcel, exportPdf }: { selectedReport: string; setSelectedReport: (value: string) => void; rows: Record<string, unknown>[]; exportCsvRows: (rows: Record<string, unknown>[], filename: string) => void; exportExcel: (rows?: Record<string, unknown>[], filename?: string) => Promise<void>; exportPdf: () => void }) {
  return <Card><SectionTitle title="Reports" subtitle="Klik report, preview tabel, export CSV / Excel / PDF." action={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => exportCsvRows(rows, `${selectedReport}.csv`)}>CSV</Button><Button onClick={() => exportExcel(rows, `${selectedReport}.xlsx`)}>Excel</Button><Button variant="outline" onClick={exportPdf}>PDF</Button></div>} /><div className="mb-5 grid gap-3 md:grid-cols-3">{reportOptions.map((report) => <button key={report} onClick={() => setSelectedReport(report)} className={`rounded-lg border p-4 text-left text-sm font-semibold ${selectedReport === report ? "border-emeraldDeep bg-mist text-emeraldDeep" : "border-slate-200 bg-white"}`}>{report}</button>)}</div><ReportPreview rows={rows} /></Card>;
}

function ReportPreview({ rows }: { rows: Record<string, unknown>[] }) {
  const columns = Object.keys(rows[0] ?? {}).slice(0, 7);
  if (!rows.length) return <EmptyState title="Report kosong" body="Tidak ada data sesuai report/filter." />;
  return <Table><thead><tr>{columns.map((col) => <Th key={col}>{col}</Th>)}</tr></thead><tbody>{rows.slice(0, 20).map((row, index) => <tr key={index}>{columns.map((col) => <Td key={col}>{renderCell(row[col])}</Td>)}</tr>)}</tbody></Table>;
}

function GroupPanel({ data, saveData }: { data: AppData; saveData: (updater: (current: AppData) => AppData, message: string, action?: [string, string, string, string?]) => void }) {
  const grouped = data.participants.filter((item) => item.pricingType === "Group" || item.groupReference);
  const paidCount = grouped.filter((item) => item.promoRole !== "Free").length;
  const configuredMin = data.event.promoMinimumPaidCount ?? 5;
  const configuredFree = data.event.promoFreeCount ?? 1;
  const freeCount = Math.floor(paidCount / configuredMin) * configuredFree;
  const normalUnit = 1500000;
  const normalTotal = (paidCount + freeCount) * normalUnit;
  const finalTotal = paidCount * normalUnit;
  const addGroup = () => {
    const groupReference = `GRP-PASS-${data.event.year}-${String(Date.now()).slice(-4)}`;
    saveData(
      (current) => {
        const paid = Array.from({ length: configuredMin }, (_, index) => ({
          id: uid("par"),
          fullName: `Peserta Group ${index + 1}`,
          title: "dr.",
          institution: "Group Registration",
          whatsapp: "",
          email: "",
          category: "Dokter Umum",
          perdestiMember: false,
          symposium: true,
          workshop: false,
          workshopType: "-",
          pricingType: "Group",
          paymentStatus: "Belum Lunas",
          badgeStatus: "Belum Cetak",
          certificateStatus: "Belum Terbit",
          attendanceStatus: "Belum Hadir",
          groupReference,
          promoRole: "Paid" as const
        }));
        const free = Array.from({ length: configuredFree }, (_, index) => ({
          ...paid[0],
          id: uid("par-free"),
          fullName: `Peserta Free Promo ${index + 1}`,
          promoRole: "Free" as const,
          paymentStatus: "Free Pass"
        }));
        return { ...current, participants: [...paid, ...free, ...current.participants] };
      },
      "Group registration promo dibuat.",
      ["Created group registration", "Group Registration", groupReference, data.event.promoNotes]
    );
  };
  return (
    <Card>
      <SectionTitle title="Group Registration" subtitle="Promo otomatis: 5 peserta dokter berbayar mendapat 1 peserta free hingga 30 Juni 2026." action={<Button onClick={addGroup}><Plus size={16} /> Tambah Group Promo</Button>} />
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Card><p className="text-sm text-slate-500">Paid participants</p><p className="text-2xl font-bold">{paidCount}</p></Card>
        <Card><p className="text-sm text-slate-500">Free promo seats</p><p className="text-2xl font-bold">{freeCount}</p></Card>
        <Card><p className="text-sm text-slate-500">Normal total</p><p className="text-xl font-bold">{rupiah(normalTotal)}</p></Card>
        <Card><p className="text-sm text-slate-500">Final total</p><p className="text-xl font-bold text-emeraldDeep">{rupiah(finalTotal)}</p></Card>
      </div>
      {grouped.length ? <Table><thead><tr><Th>Group Ref</Th><Th>Participant</Th><Th>Category</Th><Th>Paid/Free</Th><Th>Status</Th><Th>Promo Note</Th></tr></thead><tbody>{grouped.map((participant) => <tr key={participant.id}><Td>{participant.groupReference ?? "-"}</Td><Td>{participant.fullName}</Td><Td>{participant.category}</Td><Td><Badge tone={participant.promoRole === "Free" ? "gold" : "emerald"}>{participant.promoRole ?? "Paid"}</Badge></Td><Td>{participant.paymentStatus}</Td><Td>{data.event.promoNotes}</Td></tr>)}</tbody></Table> : <EmptyState title="Belum ada group" body="Klik Tambah Group Promo untuk membuat contoh group yang bisa diedit di modul Peserta." />}
    </Card>
  );
}

function SettingsPanel({ data, setData, notify, log, supabaseStatus, exportBackup }: { data: AppData; setData: (data: AppData) => void; notify: (message: string) => void; log: (action: string, entityType: string, entityName: string, notes?: string) => void; supabaseStatus: SupabaseConnectionStatus; exportBackup: () => void }) {
  const importBackup = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setData(JSON.parse(String(reader.result)) as AppData);
      notify("Backup berhasil diimport.");
      log("Imported backup", "Settings", file.name);
    };
    reader.readAsText(file);
  };
  const clearDemo = async () => {
    if (!confirm("Yakin ingin menghapus data demo?")) return;
    try {
      if (supabaseStatus.state === "connected") await clearSupabaseDemoRecords();
      setData({ ...data, vendors: data.vendors.filter((item) => !item.demo), participants: data.participants.filter((item) => !item.demo), committee: data.committee.filter((item) => !item.demo), booths: data.booths.filter((item) => !item.demo), benefits: data.benefits.filter((item) => !item.demo), files: data.files.filter((item) => !item.demo), invoices: data.invoices.filter((item) => !item.demo), payments: data.payments.filter((item) => !item.demo), documents: data.documents.filter((item) => !item.demo), letters: data.letters.filter((item) => !item.demo), logs: data.logs.filter((item) => !item.demo) });
      notify(supabaseStatus.state === "connected" ? "Demo data dihapus dari Supabase dan tampilan lokal." : "Demo data dihapus.");
      log("Cleared demo data", "Settings", "Demo Data");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal menghapus demo data.");
    }
  };
  return <Card><SectionTitle title="Settings - Demo Data" subtitle="Demo data hanya dimuat jika tombol Load Demo Data diklik." /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><Button onClick={() => { setData(initialData()); notify("PASS RIAU 2026 sample data dimuat di tampilan lokal. Simpan satu per satu untuk menulis ke Supabase."); log("Loaded demo data", "Settings", "PASS RIAU 2026"); }}><Upload size={16} /> Load PASS RIAU 2026 Sample Data</Button><Button variant="outline" onClick={clearDemo}><Trash2 size={16} /> Clear Demo Data</Button><Button variant="outline" onClick={() => { if (confirm("Yakin ingin reset semua data lokal?")) { localStorage.removeItem(STORAGE_KEY); setData(supabaseStatus.state === "connected" ? emptyData() : emptyData()); notify("Semua data lokal direset."); } }}><RotateCcw size={16} /> Reset All Local Data</Button><Button onClick={exportBackup}><Download size={16} /> Export Backup</Button><label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium"><Upload size={16} /> Import Backup<input type="file" accept="application/json" className="hidden" onChange={(event) => importBackup(event.target.files?.[0])} /></label></div><p className="mt-5 rounded-md bg-amber-50 p-3 text-sm text-amber-900">Jika Supabase connected, dashboard dan CRUD utama memakai data Supabase. Demo hanya aktif setelah dimuat manual.</p></Card>;
}

function EventSettingsPanel({ data, setData, notify, log, supabaseStatus }: { data: AppData; setData: (updater: AppData | ((current: AppData) => AppData)) => void; notify: (message: string) => void; log: (action: string, entityType: string, entityName: string, notes?: string) => void; supabaseStatus: SupabaseConnectionStatus }) {
  const logoInputs = useRef<Array<HTMLInputElement | null>>([]);
  const stampInput = useRef<HTMLInputElement | null>(null);
  const signatureInput = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const updateEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextEvent: EventSettings = { ...data.event, name: fieldValue(form.get("name")), year: Number(form.get("year")), fullTitle: fieldValue(form.get("fullTitle")), bankAccount: fieldValue(form.get("bankAccount")), contactPerson: fieldValue(form.get("contactPerson")), footerDisclaimer: fieldValue(form.get("footerDisclaimer")), stampLabel: fieldValue(form.get("stampLabel")), showStampOnInvoice: form.get("showStampOnInvoice") === "on", showStampOnReceipt: form.get("showStampOnReceipt") === "on", showStampOnAgreement: form.get("showStampOnAgreement") === "on", showStampOnFormalDocuments: form.get("showStampOnFormalDocuments") === "on", promoName: fieldValue(form.get("promoName")), promoType: fieldValue(form.get("promoType")), promoStartDate: fieldValue(form.get("promoStartDate")), promoEndDate: fieldValue(form.get("promoEndDate")), promoCategories: fieldValue(form.get("promoCategories")), promoMinimumPaidCount: Number(form.get("promoMinimumPaidCount")), promoFreeCount: Number(form.get("promoFreeCount")), promoActive: form.get("promoActive") === "on", promoNotes: fieldValue(form.get("promoNotes")) };
    try {
      let savedEvent = nextEvent;
      let savedLogos = nextEvent.logos;
      if (supabaseStatus.state === "connected") {
        savedEvent = await saveSupabaseEventSettings(nextEvent);
        savedLogos = await Promise.all(nextEvent.logos.map((logo) => saveSupabaseEventLogo(savedEvent, logo)));
        const reloadedData = await fetchSupabaseAppData(seedEvent);
        setData((current) => ({
          ...current,
          ...reloadedData,
          documents: reloadedData.documents as DocumentRecord[],
          letters: current.letters,
          messages: current.messages
        }));
      } else {
        setData((current) => ({ ...current, event: { ...savedEvent, logos: savedLogos } }));
      }
      notify(supabaseStatus.state === "connected" ? "Event Settings disimpan ke Supabase." : "Event Settings disimpan lokal.");
      log("Updated event settings", "Event", nextEvent.name);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal menyimpan Event Settings.");
    }
  };
  const updateLogo = (index: number, key: string, value: string | boolean | number) => setData((current) => ({ ...current, event: { ...current.event, logos: current.event.logos.map((logo, logoIndex) => logoIndex === index ? { ...logo, [key]: value } : logo) } }));
  const archiveUpload = (document: DocumentRecord & { bucket?: string; storagePath?: string; publicUrl?: string; uploadedAt?: string }) => {
    setData((current) => ({
      ...current,
      documents: [
        document,
        ...current.documents.filter((item) => item.id !== document.id && item.name !== document.name)
      ]
    }));
  };
  const localPreview = (file: File) => URL.createObjectURL(file);
  const uploadLogo = async (index: number, file?: File) => {
    if (!file) return;
    setUploading(`logo-${index}`);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${data.event.year}/logo-${index + 1}-${Date.now()}-${safeName}`;
      let publicUrl = localPreview(file);
      let storagePath = path;
      if (supabaseStatus.state === "connected") {
        await uploadFile("event-logos", path, file);
        publicUrl = getPublicUrl("event-logos", path);
      } else {
        storagePath = `local-preview/${path}`;
        notify(`Mode lokal aktif (${supabaseStatus.state === "local" ? supabaseStatus.reason : "checking"}). File hanya preview lokal.`);
      }
      const nextLogo = { ...(data.event.logos[index] ?? { name: `Logo ${index + 1}`, purpose: `Logo ${index + 1}`, showOnInvoice: true, showOnReceipt: true, showOnAgreement: true, order: index + 1, size: "medium" as const }), storagePath, publicUrl };
      const savedLogo = supabaseStatus.state === "connected" ? await saveSupabaseEventLogo(data.event, nextLogo) : nextLogo;
      setData((current) => ({
        ...current,
        event: {
          ...current.event,
          logos: current.event.logos.map((logo, logoIndex) => logoIndex === index ? savedLogo : logo)
        }
      }));
      archiveUpload({ id: `logo-${index + 1}`, name: data.event.logos[index]?.name ?? `Logo ${index + 1}`, type: "Event Logo", relatedName: data.event.name, status: "Uploaded", createdAt: new Date().toISOString(), notes: `bucket=event-logos; path=${storagePath}`, bucket: "event-logos", storagePath, publicUrl, uploadedAt: new Date().toISOString() });
      log("Uploaded document", "Event Logo", data.event.logos[index]?.name ?? `Logo ${index + 1}`, storagePath);
      notify(supabaseStatus.state === "connected" ? "Logo berhasil diupload ke Supabase Storage." : "Logo disimpan sebagai preview lokal.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Upload logo gagal.");
    } finally {
      setUploading(null);
    }
  };
  const removeLogo = async (index: number) => {
    const logo = data.event.logos[index];
    if (!logo?.storagePath) return;
    if (!confirm(`Hapus logo ${logo.name}?`)) return;
    setUploading(`logo-${index}`);
    try {
      const clearedLogo = { ...logo, storagePath: undefined, publicUrl: undefined };
      if (supabaseStatus.state === "connected" && !logo.storagePath.startsWith("local-preview/")) {
        await deleteFile("event-logos", logo.storagePath);
        await saveSupabaseEventLogo(data.event, clearedLogo);
      }
      setData((current) => ({ ...current, event: { ...current.event, logos: current.event.logos.map((item, logoIndex) => logoIndex === index ? clearedLogo : item) }, documents: current.documents.filter((item) => item.name !== logo.name) }));
      notify("Logo berhasil dihapus.");
      log("Deleted document", "Event Logo", logo.name);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal menghapus logo.");
    } finally {
      setUploading(null);
    }
  };
  const uploadStamp = async (file?: File) => {
    if (!file) return;
    setUploading("stamp");
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${data.event.year}/stamp-${Date.now()}-${safeName}`;
      let publicUrl = localPreview(file);
      let storagePath = path;
      if (supabaseStatus.state === "connected") {
        await uploadFile("stamps", path, file);
        publicUrl = getPublicUrl("stamps", path);
      } else {
        storagePath = `local-preview/${path}`;
        notify(`Mode lokal aktif (${supabaseStatus.state === "local" ? supabaseStatus.reason : "checking"}). Stempel hanya preview lokal.`);
      }
      const nextEvent = { ...data.event, stampPath: storagePath, stampUrl: publicUrl };
      const savedEvent = supabaseStatus.state === "connected" ? await saveSupabaseEventSettings(nextEvent) : nextEvent;
      setData((current) => ({ ...current, event: { ...savedEvent, logos: current.event.logos } }));
      archiveUpload({ id: "official-stamp", name: data.event.stampLabel ?? "Stempel Resmi", type: "Stamp", relatedName: data.event.name, status: "Uploaded", createdAt: new Date().toISOString(), notes: `bucket=stamps; path=${storagePath}`, bucket: "stamps", storagePath, publicUrl, uploadedAt: new Date().toISOString() });
      log("Uploaded document", "Stamp", data.event.stampLabel ?? "Stempel Resmi", storagePath);
      notify(supabaseStatus.state === "connected" ? "Stempel berhasil diupload ke Supabase Storage." : "Stempel disimpan sebagai preview lokal.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Upload stempel gagal.");
    } finally {
      setUploading(null);
    }
  };
  const removeStamp = async () => {
    if (!data.event.stampPath) return;
    if (!confirm("Hapus stempel resmi?")) return;
    setUploading("stamp");
    try {
      const nextEvent = { ...data.event, stampPath: undefined, stampUrl: undefined };
      if (supabaseStatus.state === "connected" && !data.event.stampPath.startsWith("local-preview/")) {
        await deleteFile("stamps", data.event.stampPath);
        await saveSupabaseEventSettings(nextEvent);
      }
      setData((current) => ({ ...current, event: { ...nextEvent, logos: current.event.logos }, documents: current.documents.filter((item) => item.id !== "official-stamp") }));
      notify("Stempel berhasil dihapus.");
      log("Deleted document", "Stamp", data.event.stampLabel ?? "Stempel Resmi");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal menghapus stempel.");
    } finally {
      setUploading(null);
    }
  };
  const uploadSignature = async (file?: File) => {
    if (!file) return;
    setUploading("signature");
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${data.event.year}/signature-${Date.now()}-${safeName}`;
      let publicUrl = localPreview(file);
      let storagePath = path;
      if (supabaseStatus.state === "connected") {
        await uploadFile("signatures", path, file);
        publicUrl = getPublicUrl("signatures", path);
      } else {
        storagePath = `local-preview/${path}`;
        notify(`Mode lokal aktif (${supabaseStatus.state === "local" ? supabaseStatus.reason : "checking"}). Signature hanya preview lokal.`);
      }
      const nextEvent = { ...data.event, signaturePath: storagePath, signatureUrl: publicUrl, signatureLabel: data.event.signatureLabel ?? "Finance/Bendahara Signature" };
      const savedEvent = supabaseStatus.state === "connected" ? await saveSupabaseEventSettings(nextEvent) : nextEvent;
      setData((current) => ({ ...current, event: { ...savedEvent, logos: current.event.logos } }));
      archiveUpload({ id: "finance-signature", name: data.event.signatureLabel ?? "Finance/Bendahara Signature", type: "Signature", relatedName: data.event.name, status: "Uploaded", createdAt: new Date().toISOString(), notes: `bucket=signatures; path=${storagePath}`, bucket: "signatures", storagePath, publicUrl, uploadedAt: new Date().toISOString() });
      log("Uploaded document", "Signature", data.event.signatureLabel ?? "Finance/Bendahara Signature", storagePath);
      notify(supabaseStatus.state === "connected" ? "Signature berhasil diupload ke Supabase Storage." : "Signature disimpan sebagai preview lokal.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Upload signature gagal.");
    } finally {
      setUploading(null);
    }
  };

  return <Card><SectionTitle title="Event Settings" subtitle="Konfigurasi multi-year, logo PDF 4-5 logo, stempel resmi, signature, promo, dan pricing." /><form onSubmit={updateEvent} className="grid gap-4 md:grid-cols-2"><Field label="Nama event"><Input name="name" defaultValue={data.event.name} required /></Field><Field label="Tahun"><Input name="year" type="number" defaultValue={data.event.year} required /></Field><Field label="Judul lengkap"><Input name="fullTitle" defaultValue={data.event.fullTitle} required /></Field><Field label="Rekening bank"><Input name="bankAccount" defaultValue={data.event.bankAccount} /></Field><Field label="Contact person"><Input name="contactPerson" defaultValue={data.event.contactPerson} /></Field><Field label="Label stempel resmi"><Input name="stampLabel" defaultValue={data.event.stampLabel ?? "Stempel Resmi PERDESTI / PASS"} /></Field><div className="md:col-span-2 grid gap-3 rounded-lg border border-slate-200 p-4"><p className="font-semibold text-emeraldDeep">Stempel & Signature</p><div className="grid gap-2 sm:grid-cols-4"><label><input name="showStampOnInvoice" type="checkbox" defaultChecked={data.event.showStampOnInvoice} /> Invoice</label><label><input name="showStampOnReceipt" type="checkbox" defaultChecked={data.event.showStampOnReceipt} /> Receipt</label><label><input name="showStampOnAgreement" type="checkbox" defaultChecked={data.event.showStampOnAgreement} /> Surat Sponsor</label><label><input name="showStampOnFormalDocuments" type="checkbox" defaultChecked={data.event.showStampOnFormalDocuments} /> Formal</label></div><div className="flex flex-wrap gap-4">{data.event.stampUrl ? <img src={data.event.stampUrl} alt="Preview stempel" className="h-20 w-32 rounded-md border object-contain p-2" /> : <div className="flex h-20 w-32 items-center justify-center rounded-md border border-dashed text-xs text-slate-500">Stamp preview</div>}{data.event.signatureUrl ? <img src={data.event.signatureUrl} alt="Preview signature" className="h-20 w-32 rounded-md border object-contain p-2" /> : <div className="flex h-20 w-32 items-center justify-center rounded-md border border-dashed text-xs text-slate-500">Signature preview</div>}</div><div className="flex flex-wrap gap-2"><input ref={stampInput} type="file" accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(event) => uploadStamp(event.target.files?.[0])} /><input ref={signatureInput} type="file" accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(event) => uploadSignature(event.target.files?.[0])} /><Button type="button" variant="outline" disabled={uploading === "stamp"} onClick={() => stampInput.current?.click()}>{uploading === "stamp" ? "Uploading..." : "Upload/Replace Stempel"}</Button><Button type="button" variant="outline" disabled={uploading === "signature"} onClick={() => signatureInput.current?.click()}>{uploading === "signature" ? "Uploading..." : "Upload/Replace Signature"}</Button>{data.event.stampUrl && <Button type="button" variant="outline" onClick={removeStamp}>Remove Stempel</Button>}</div></div><div className="md:col-span-2"><Field label="Disclaimer footer"><Textarea name="footerDisclaimer" defaultValue={data.event.footerDisclaimer} /></Field></div><div className="md:col-span-2 rounded-lg border border-slate-200 p-4"><h3 className="mb-3 text-lg font-bold text-emeraldDeep">Promo Settings</h3><div className="grid gap-4 md:grid-cols-2"><Field label="Promo name"><Input name="promoName" defaultValue={data.event.promoName} /></Field><Field label="Promo type"><Input name="promoType" defaultValue={data.event.promoType} /></Field><Field label="Start date"><Input name="promoStartDate" type="date" defaultValue={data.event.promoStartDate} /></Field><Field label="End date"><Input name="promoEndDate" type="date" defaultValue={data.event.promoEndDate} /></Field><Field label="Applies to categories"><Input name="promoCategories" defaultValue={data.event.promoCategories} /></Field><Field label="Minimum paid count"><Input name="promoMinimumPaidCount" type="number" defaultValue={data.event.promoMinimumPaidCount ?? 5} /></Field><Field label="Free count"><Input name="promoFreeCount" type="number" defaultValue={data.event.promoFreeCount ?? 1} /></Field><label className="flex items-center gap-2 pt-7"><input name="promoActive" type="checkbox" defaultChecked={data.event.promoActive} /> Promo aktif</label><div className="md:col-span-2"><Field label="Promo notes"><Textarea name="promoNotes" defaultValue={data.event.promoNotes} /></Field></div></div></div><div className="sticky bottom-0 z-10 md:col-span-2 border-t border-slate-200 bg-white/95 py-3"><Button type="submit"><Save size={16} /> Save Event Settings</Button></div></form><h3 className="mt-8 text-lg font-bold text-emeraldDeep">Event Pricing Settings</h3><ReportPreview rows={pricingRules.map((rule) => ({ category: rule.category, type: rule.product, period: rule.period, startDate: rule.start, endDate: rule.end, price: rule.price, active: rule.active, notes: rule.notes }))} /><h3 className="mt-8 text-lg font-bold text-emeraldDeep">Logo Dokumen</h3><Table><thead><tr><Th>Preview</Th><Th>Logo</Th><Th>Invoice</Th><Th>Receipt</Th><Th>Surat</Th><Th>Formal</Th><Th>Order</Th><Th>Size</Th><Th>Upload</Th></tr></thead><tbody>{data.event.logos.map((logo, index) => <tr key={`${logo.name}-${index}`}><Td>{logo.publicUrl ? <img src={logo.publicUrl} alt={logo.name} className="h-12 w-20 rounded border object-contain p-1" /> : <div className="flex h-12 w-20 items-center justify-center rounded border border-dashed text-xs text-slate-500">Logo</div>}</Td><Td><Input value={logo.name} onChange={(event) => updateLogo(index, "name", event.target.value)} /><p className="mt-1 max-w-[180px] truncate text-xs text-slate-500">{logo.storagePath ?? "Belum upload"}</p></Td><Td><input type="checkbox" checked={logo.showOnInvoice} onChange={(event) => updateLogo(index, "showOnInvoice", event.target.checked)} /></Td><Td><input type="checkbox" checked={logo.showOnReceipt} onChange={(event) => updateLogo(index, "showOnReceipt", event.target.checked)} /></Td><Td><input type="checkbox" checked={logo.showOnAgreement} onChange={(event) => updateLogo(index, "showOnAgreement", event.target.checked)} /></Td><Td><input type="checkbox" checked={logo.showOnFormalDocuments ?? true} onChange={(event) => updateLogo(index, "showOnFormalDocuments", event.target.checked)} /></Td><Td><Input type="number" value={logo.order} onChange={(event) => updateLogo(index, "order", Number(event.target.value))} /></Td><Td><Select value={logo.size} onChange={(event) => updateLogo(index, "size", event.target.value)}><option>small</option><option>medium</option><option>large</option></Select></Td><Td><div className="flex flex-wrap gap-2"><input ref={(node) => { logoInputs.current[index] = node; }} type="file" accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(event) => uploadLogo(index, event.target.files?.[0])} /><Button type="button" variant="outline" disabled={uploading === `logo-${index}`} onClick={() => logoInputs.current[index]?.click()}>{uploading === `logo-${index}` ? "Uploading..." : "Upload/Replace"}</Button>{logo.publicUrl && <Button type="button" variant="outline" onClick={() => removeLogo(index)}>Remove</Button>}</div></Td></tr>)}</tbody></Table></Card>;
}

function VendorDetail({ vendor, data, onClose }: { vendor: Vendor; data: AppData; onClose: () => void }) {
  const invoices = data.invoices.filter((item) => item.vendorId === vendor.id);
  const payments = data.payments.filter((payment) => invoices.some((invoice) => invoice.id === payment.invoiceId));
  const benefits = data.benefits.filter((item) => item.vendorId === vendor.id);
  const files = data.files.filter((item) => item.vendorId === vendor.id);
  const docs = data.documents.filter((item) => item.relatedName === vendor.company);
  const completed = benefits.filter((item) => ["Completed", "Not Applicable"].includes(item.status)).length;
  const approvedFiles = files.filter((item) => ["Approved", "Not Required"].includes(item.status)).length;
  const invoiceTotalAmount = invoices.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
  const paid = invoices.reduce((sum, invoice) => sum + verifiedPaid(invoice.id, data.payments), 0);
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/40 p-3 sm:p-4">
      <div className="mx-auto max-h-[92vh] max-w-6xl overflow-y-auto rounded-xl bg-white p-4 shadow-soft sm:p-5">
        <SectionTitle title={`Detail Vendor - ${vendor.company}`} subtitle="Overview, invoice, payments, benefits, file requirements, agreement, booth, documents, activity, dan WhatsApp." action={<Button variant="outline" onClick={onClose}>Tutup</Button>} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card><p className="text-sm text-slate-500">Package Summary</p><p className="font-bold">{vendor.packageName}</p><p>{rupiah(vendor.packagePrice)}</p><p>{vendor.boothSize} - {vendor.boothNumber}</p></Card>
          <Card><p className="text-sm text-slate-500">Payment Summary</p><p>Total: {rupiah(invoiceTotalAmount)}</p><p>Paid: {rupiah(paid)}</p><p>Outstanding: {rupiah(invoiceTotalAmount - paid)}</p></Card>
          <Card><p className="text-sm text-slate-500">Benefit Completion</p><p className="text-2xl font-bold">{completed}/{benefits.length}</p><p>{benefits.length ? Math.round((completed / benefits.length) * 100) : 0}% complete</p></Card>
          <Card><p className="text-sm text-slate-500">File Completeness</p><p className="text-2xl font-bold">{approvedFiles}/{files.length}</p><p>{files.filter((item) => item.status === "Missing").length} missing</p></Card>
        </div>
        <div className="mt-5 grid gap-5">
          <Card><SectionTitle title="Overview" /><div className="grid gap-2 text-sm md:grid-cols-2"><p>PIC: {vendor.pic} ({vendor.position})</p><p>WhatsApp: {vendor.whatsapp}</p><p>Email: {vendor.email}</p><p>Handler: {vendor.handler}</p><p>Status: <Badge tone={tone(vendor.status)}>{vendor.status}</Badge></p><p>Agreement note: {vendor.notes}</p></div></Card>
          <Card><SectionTitle title="Invoice" /><ReportPreview rows={invoices.map((invoice) => ({ number: invoice.number, total: invoiceTotal(invoice), paid: verifiedPaid(invoice.id, data.payments), status: invoice.status, dueDate: invoice.dueDate }))} /></Card>
          <Card><SectionTitle title="Payments" /><ReportPreview rows={payments as unknown as Record<string, unknown>[]} /></Card>
          <Card><SectionTitle title="Benefits" /><ReportPreview rows={benefits as unknown as Record<string, unknown>[]} /></Card>
          <Card><SectionTitle title="File Requirements" /><ReportPreview rows={files as unknown as Record<string, unknown>[]} /></Card>
          <Card><SectionTitle title="Agreement / Booth / Documents" /><ReportPreview rows={[{ agreement: data.letters.find((item) => item.vendorId === vendor.id)?.number ?? "-", booth: `${vendor.boothNumber} (${vendor.boothSize})`, documents: docs.length, specialNotes: vendor.notes }]} /></Card>
          <Card><SectionTitle title="Activity Log" /><LogTable rows={data.logs.filter((log) => log.entityName.includes(vendor.company) || log.notes.includes(vendor.company)).slice(0, 8)} /></Card>
          <Card><SectionTitle title="WhatsApp Messages" /><ReportPreview rows={data.messages.filter((message) => message.recipient === vendor.company) as unknown as Record<string, unknown>[]} /></Card>
        </div>
      </div>
    </div>
  );
}

function CrudModal({ modal, data, setData, close, notify, log, supabaseStatus }: { modal: ModalState; data: AppData; setData: (updater: (current: AppData) => AppData) => void; close: () => void; notify: (message: string) => void; log: (action: string, entityType: string, entityName: string, notes?: string) => void; supabaseStatus: SupabaseConnectionStatus }) {
  if (!modal) return null;
  const existing = getExisting(data, modal.key, modal.id);
  const readOnly = modal.mode === "view";
  const title = `${modal.mode === "add" ? "Tambah" : modal.mode === "edit" ? "Edit" : "View"} ${moduleTitle(modal.key)}`;
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (readOnly) return;
    const form = new FormData(event.currentTarget);
    const result = buildRecord(modal.key, form, existing, data);
    if (!result.ok) {
      notify(result.error);
      return;
    }
    try {
      const record = supabaseStatus.state === "connected"
        ? await upsertSupabaseRecord(modal.key, result.record, data.event)
        : result.record;
      setData((current) => upsertByKey(current, modal.key, record));
      notify(supabaseStatus.state === "connected" ? "Data berhasil disimpan ke Supabase." : "Data berhasil disimpan.");
      log(modal.mode === "add" ? "Created record" : "Updated record", modal.key, result.name);
      close();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal menyimpan data Supabase.");
    }
  };
  return <div className="fixed inset-0 z-50 bg-slate-950/40 p-4"><form onSubmit={submit} className="mx-auto max-h-[92vh] max-w-3xl overflow-y-auto rounded-xl bg-white p-5 shadow-soft"><SectionTitle title={title} subtitle={readOnly ? "Mode lihat saja." : "Isi field wajib dengan jelas."} action={<Button type="button" variant="outline" onClick={close}>Tutup</Button>} /><div className="grid gap-4 md:grid-cols-2">{renderFields(modal.key, existing, data, readOnly)}</div><div className="mt-5 flex justify-end gap-2">{!readOnly && <Button type="submit"><Save size={16} /> Simpan</Button>}</div></form></div>;
}

function renderFields(key: EditableKey, existing: Record<string, unknown> | undefined, data: AppData, readOnly: boolean) {
  const common = { disabled: readOnly };
  const vendorOptions = data.vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.company}</option>);
  const invoiceOptions = data.invoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.number}</option>);
  const committeeOptions = data.committee.map((member) => <option key={member.id}>{member.name}</option>);
  if (key === "committee") return <><Field label="Nama"><Input name="name" defaultValue={String(existing?.name ?? "")} required {...common} /></Field><Field label="Role"><Select name="role" defaultValue={String(existing?.role ?? "Viewer")} {...common}>{["Owner", "Ketua Panitia", "Sekretaris", "Finance/Bendahara", "Sponsorship", "Registration", "Booth Manager", "Viewer"].map((item) => <option key={item}>{item}</option>)}</Select></Field><Field label="WhatsApp"><Input name="whatsapp" defaultValue={String(existing?.whatsapp ?? "")} {...common} /></Field><Field label="Email"><Input name="email" defaultValue={String(existing?.email ?? "")} {...common} /></Field><Field label="Access Role"><Input name="accessRole" defaultValue={String(existing?.accessRole ?? "Viewer")} {...common} /></Field></>;
  if (key === "vendors") return <><Field label="Company"><Input name="company" defaultValue={String(existing?.company ?? "")} required {...common} /></Field><Field label="PIC"><Input name="pic" defaultValue={String(existing?.pic ?? "")} required {...common} /></Field><Field label="Position"><Input name="position" defaultValue={String(existing?.position ?? "")} {...common} /></Field><Field label="WhatsApp"><Input name="whatsapp" defaultValue={String(existing?.whatsapp ?? "")} {...common} /></Field><Field label="Email"><Input name="email" defaultValue={String(existing?.email ?? "")} {...common} /></Field><Field label="Package"><Select name="packageName" defaultValue={String(existing?.packageName ?? "Silver")} {...common}><option>Silver</option><option>Gold</option><option>Platinum</option><option>Custom</option></Select></Field><Field label="Package Price"><Input name="packagePrice" type="number" defaultValue={Number(existing?.packagePrice ?? 0)} required {...common} /></Field><Field label="Booth Number"><Input name="boothNumber" defaultValue={String(existing?.boothNumber ?? "")} {...common} /></Field><Field label="Status"><Select name="status" defaultValue={String(existing?.status ?? "Lead")} {...common}>{["Lead", "Booked", "DP Paid", "Partially Paid", "Fully Paid", "Cancelled"].map((item) => <option key={item}>{item}</option>)}</Select></Field><Field label="Handler"><Select name="handler" defaultValue={String(existing?.handler ?? data.committee[0]?.name)} {...common}>{committeeOptions}</Select></Field><div className="md:col-span-2"><Field label="Notes"><Textarea name="notes" defaultValue={String(existing?.notes ?? "")} {...common} /></Field></div></>;
  if (key === "participants") return <><Field label="Nama Lengkap"><Input name="fullName" defaultValue={String(existing?.fullName ?? "")} required {...common} /></Field><Field label="Title"><Input name="title" defaultValue={String(existing?.title ?? "dr.")} {...common} /></Field><Field label="Institution"><Input name="institution" defaultValue={String(existing?.institution ?? "")} {...common} /></Field><Field label="WhatsApp"><Input name="whatsapp" defaultValue={String(existing?.whatsapp ?? "")} {...common} /></Field><Field label="Email"><Input name="email" defaultValue={String(existing?.email ?? "")} {...common} /></Field><Field label="Category"><Input name="category" defaultValue={String(existing?.category ?? "Dokter Umum")} {...common} /></Field><Field label="Payment Status"><Select name="paymentStatus" defaultValue={String(existing?.paymentStatus ?? "Belum Lunas")} {...common}><option>Belum Lunas</option><option>DP Paid</option><option>Sudah Lunas</option></Select></Field><Field label="Pricing Type"><Input name="pricingType" defaultValue={String(existing?.pricingType ?? "Regular")} {...common} /></Field></>;
  if (key === "booths") return <><Field label="Booth Number"><Input name="number" defaultValue={String(existing?.number ?? "")} required {...common} /></Field><Field label="Size"><Input name="size" defaultValue={String(existing?.size ?? "3 x 2 m")} {...common} /></Field><Field label="Area"><Input name="area" defaultValue={String(existing?.area ?? "")} {...common} /></Field><Field label="Status"><Select name="status" defaultValue={String(existing?.status ?? "Available")} {...common}>{["Available", "Hold", "Booked", "DP Paid", "Paid", "Cancelled"].map((item) => <option key={item}>{item}</option>)}</Select></Field><Field label="Assigned Vendor"><Select name="vendorId" defaultValue={String(existing?.vendorId ?? "")} {...common}><option value="">-</option>{vendorOptions}</Select></Field><Field label="Hold Expiry"><Input name="holdExpiry" type="date" defaultValue={String(existing?.holdExpiry ?? "")} {...common} /></Field><div className="md:col-span-2"><Field label="Electricity Note"><Textarea name="electricityNote" defaultValue={String(existing?.electricityNote ?? "450W")} {...common} /></Field></div></>;
  if (key === "benefits") return <><Field label="Vendor"><Select name="vendorId" defaultValue={String(existing?.vendorId ?? data.vendors[0]?.id)} {...common}>{vendorOptions}</Select></Field><Field label="Benefit Name"><Input name="name" defaultValue={String(existing?.name ?? "")} required {...common} /></Field><Field label="Quantity"><Input name="quantity" type="number" defaultValue={Number(existing?.quantity ?? 1)} {...common} /></Field><Field label="Due Date"><Input name="dueDate" type="date" defaultValue={String(existing?.dueDate ?? todayIdDate())} {...common} /></Field><Field label="Responsible"><Select name="responsible" defaultValue={String(existing?.responsible ?? data.committee[0]?.name)} {...common}>{committeeOptions}</Select></Field><Field label="Status"><Select name="status" defaultValue={String(existing?.status ?? "Pending")} {...common}>{["Not Started", "Pending", "In Progress", "Completed", "Not Applicable"].map((item) => <option key={item}>{item}</option>)}</Select></Field><div className="md:col-span-2"><Field label="Description"><Textarea name="description" defaultValue={String(existing?.description ?? "")} {...common} /></Field></div><div className="md:col-span-2"><Field label="Notes"><Textarea name="notes" defaultValue={String(existing?.notes ?? "")} {...common} /></Field></div></>;
  if (key === "files") return <><Field label="Vendor"><Select name="vendorId" defaultValue={String(existing?.vendorId ?? data.vendors[0]?.id)} {...common}>{vendorOptions}</Select></Field><Field label="Requirement Name"><Input name="name" defaultValue={String(existing?.name ?? "")} required {...common} /></Field><Field label="Required"><Select name="required" defaultValue={String(existing?.required ?? true)} {...common}><option value="true">Ya</option><option value="false">Tidak</option></Select></Field><Field label="Uploaded"><Select name="uploaded" defaultValue={String(existing?.uploaded ?? false)} {...common}><option value="false">Belum</option><option value="true">Sudah</option></Select></Field><Field label="Due Date"><Input name="dueDate" type="date" defaultValue={String(existing?.dueDate ?? todayIdDate())} {...common} /></Field><Field label="Status"><Select name="status" defaultValue={String(existing?.status ?? "Missing")} {...common}>{["Missing", "Submitted", "Under Review", "Approved", "Rejected", "Not Required"].map((item) => <option key={item}>{item}</option>)}</Select></Field><div className="md:col-span-2"><Field label="Notes"><Textarea name="notes" defaultValue={String(existing?.notes ?? "")} {...common} /></Field></div></>;
  if (key === "invoices") return <InvoiceWizardFields existing={existing} data={data} readOnly={readOnly} />;
  if (key === "payments") return <><Field label="Billing Target Type"><Select name="targetType" defaultValue={String(existing?.targetType ?? "Vendor / Sponsor")} {...common}><option>Vendor / Sponsor</option><option>Participant</option><option>Group Registration</option><option>Custom / Other</option></Select></Field><Field label="Linked Vendor"><Select name="linkedVendorId" defaultValue={String(existing?.linkedEntityId ?? "")} {...common}><option value="">-</option>{vendorOptions}</Select></Field><Field label="Linked Participant"><Select name="linkedParticipantId" defaultValue={String(existing?.linkedEntityId ?? "")} {...common}><option value="">-</option>{data.participants.map((participant) => <option key={participant.id} value={participant.id}>{participant.fullName}</option>)}</Select></Field><Field label="Manual payer / Custom"><Input name="manualPayer" defaultValue={String(existing?.linkedEntityName ?? existing?.senderName ?? "")} {...common} /></Field><Field label="Linked Invoice"><Select name="invoiceId" defaultValue={String(existing?.invoiceId ?? data.invoices[0]?.id)} {...common}>{invoiceOptions}</Select></Field><Field label="Linked Sponsor Agreement"><Select name="linkedAgreementId" defaultValue={String(existing?.linkedAgreementId ?? "")} {...common}><option value="">-</option>{data.letters.map((letter) => <option key={letter.id} value={letter.id}>{letter.number}</option>)}</Select></Field><Field label="Linked Booth Booking"><Select name="linkedBoothId" defaultValue={String(existing?.linkedBoothId ?? "")} {...common}><option value="">-</option>{data.booths.map((booth) => <option key={booth.id} value={booth.id}>{booth.number}</option>)}</Select></Field><Field label="Payment Date"><Input name="date" type="date" defaultValue={String(existing?.date ?? todayIdDate())} {...common} /></Field><Field label="Amount"><Input name="amount" type="number" defaultValue={Number(existing?.amount ?? 0)} required {...common} /></Field><Field label="Method"><Input name="method" defaultValue={String(existing?.method ?? "Transfer Bank")} {...common} /></Field><Field label="Receiving Bank"><Input name="receivingBank" defaultValue={String(existing?.receivingBank ?? "Bank Mandiri")} {...common} /></Field><Field label="Sender Name"><Input name="senderName" defaultValue={String(existing?.senderName ?? "")} required {...common} /></Field><Field label="Verification Status"><Select name="verificationStatus" defaultValue={String(existing?.verificationStatus ?? "Pending")} {...common}><option>Pending</option><option>Verified</option><option>Rejected</option></Select></Field><Field label="Received By"><Select name="receivedBy" defaultValue={String(existing?.receivedBy ?? data.committee[0]?.name)} {...common}>{committeeOptions}</Select></Field><Field label="Verified By"><Select name="verifiedBy" defaultValue={String(existing?.verifiedBy ?? "")} {...common}><option value="">-</option>{committeeOptions}</Select></Field><div className="md:col-span-2"><Field label="Proof Upload Placeholder / Notes"><Textarea name="notes" defaultValue={String(existing?.notes ?? "")} {...common} /></Field></div><div className="md:col-span-2"><Field label="Special Agreement / Additional Notes"><Textarea name="specialAgreement" defaultValue={String(existing?.specialAgreement ?? "")} {...common} /></Field></div></>;
  if (key === "archive") return <><Field label="Document Name"><Input name="name" defaultValue={String(existing?.name ?? "")} required {...common} /></Field><Field label="Type"><Input name="type" defaultValue={String(existing?.type ?? "Custom Document")} {...common} /></Field><Field label="Related Name"><Input name="relatedName" defaultValue={String(existing?.relatedName ?? "")} {...common} /></Field><Field label="Status"><Select name="status" defaultValue={String(existing?.status ?? "Uploaded")} {...common}>{["Draft", "Uploaded", "Pending Review", "Approved", "Rejected", "Archived"].map((item) => <option key={item}>{item}</option>)}</Select></Field><div className="md:col-span-2"><Field label="Notes"><Textarea name="notes" defaultValue={String(existing?.notes ?? "")} {...common} /></Field></div></>;
  if (key === "agreement") return <><Field label="Vendor"><Select name="vendorId" defaultValue={String(existing?.vendorId ?? data.vendors[0]?.id)} {...common}>{vendorOptions}</Select></Field><Field label="Letter Number"><Input name="number" defaultValue={String(existing?.number ?? `${data.event.agreementPrefix}/${String(data.letters.length + 1).padStart(3, "0")}`)} required {...common} /></Field><Field label="Company Signer"><Input name="signerName" defaultValue={String(existing?.signerName ?? "")} required {...common} /></Field><Field label="Signer Role"><Input name="signerRole" defaultValue={String(existing?.signerRole ?? "")} {...common} /></Field><Field label="Committee Signer"><Input name="committeeSignerName" defaultValue={String(existing?.committeeSignerName ?? data.event.contactPerson)} {...common} /></Field><Field label="Committee Role"><Input name="committeeSignerRole" defaultValue={String(existing?.committeeSignerRole ?? "Panitia PASS RIAU")} {...common} /></Field><Field label="City/date"><Input name="cityDate" defaultValue={String(existing?.cityDate ?? `Pekanbaru, ${todayIdDate()}`)} {...common} /></Field><div className="md:col-span-2"><Field label="Notes"><Textarea name="notes" defaultValue={String(existing?.notes ?? "")} {...common} /></Field></div></>;
  return <><Field label="Recipient"><Input name="recipient" defaultValue={String(existing?.recipient ?? "")} required {...common} /></Field><Field label="Phone"><Input name="phone" defaultValue={String(existing?.phone ?? "")} {...common} /></Field><Field label="Type"><Input name="type" defaultValue={String(existing?.type ?? "Custom Message")} {...common} /></Field><div className="md:col-span-2"><Field label="Message"><Textarea name="text" defaultValue={String(existing?.text ?? "")} required {...common} /></Field></div></>;
}

function getExisting(data: AppData, key: EditableKey, id?: string): Record<string, unknown> | undefined {
  return collection(data, key).find((item) => String(item.id) === id);
}

function InvoiceWizardFields({ existing, data, readOnly }: { existing: Record<string, unknown> | undefined; data: AppData; readOnly: boolean }) {
  const initialItem = (existing?.items as Invoice["items"] | undefined)?.[0];
  const [targetType, setTargetType] = useState(String(existing?.targetType ?? "Vendor / Sponsor"));
  const [vendorId, setVendorId] = useState(String(existing?.vendorId ?? existing?.targetId ?? data.vendors[0]?.id ?? ""));
  const [participantId, setParticipantId] = useState(String(existing?.targetId ?? data.participants[0]?.id ?? ""));
  const [category, setCategory] = useState(String(existing?.category ?? data.vendors.find((vendor) => vendor.id === vendorId)?.packageName ?? "Member PERDESTI"));
  const [registrationType, setRegistrationType] = useState(String(existing?.registrationType ?? (targetType === "Vendor / Sponsor" ? "Sponsor package" : "Symposium")));
  const [invoiceDate, setInvoiceDate] = useState(String(existing?.invoiceDate ?? todayIdDate()));
  const [qty, setQty] = useState(Number(initialItem?.qty ?? 1));
  const [manualUnit, setManualUnit] = useState(Number(initialItem?.unitPrice ?? 0));
  const [discount, setDiscount] = useState(Number(initialItem?.discount ?? existing?.promoDeduction ?? 0));
  const selectedVendor = data.vendors.find((vendor) => vendor.id === vendorId);
  const selectedParticipant = data.participants.find((participant) => participant.id === participantId);
  const product = targetType === "Vendor / Sponsor" ? "Sponsor package" : targetType === "Booth Only" ? "Booth" : registrationType.includes("Workshop") && !registrationType.includes("Symposium") ? "Workshop" : "Symposium";
  const effectiveCategory = targetType === "Vendor / Sponsor" ? category : selectedParticipant?.category ?? category;
  const pricing = findPricing(effectiveCategory, product, invoiceDate);
  const suggestedUnit = selectedVendor && targetType === "Vendor / Sponsor" ? selectedVendor.packagePrice : pricing?.price ?? 0;
  const unitPrice = manualUnit > 0 ? manualUnit : suggestedUnit;
  const paidGroupCount = data.participants.filter((participant) => participant.pricingType === "Group" && participant.promoRole !== "Free").length;
  const freeGroupCount = Math.floor(paidGroupCount / (data.event.promoMinimumPaidCount ?? 5)) * (data.event.promoFreeCount ?? 1);
  const groupDiscount = targetType === "Group Registration" ? freeGroupCount * unitPrice : discount;
  const finalDiscount = targetType === "Group Registration" ? groupDiscount : discount;
  const total = qty * unitPrice - finalDiscount;
  const autoBillTo = targetType === "Vendor / Sponsor" || targetType === "Booth Only" ? selectedVendor?.company : targetType === "Participant" || targetType === "Symposium Only" || targetType === "Workshop Only" ? selectedParticipant?.fullName : "";
  const autoContact = targetType === "Vendor / Sponsor" || targetType === "Booth Only" ? selectedVendor?.pic : selectedParticipant?.whatsapp;
  const disabled = { disabled: readOnly };
  return (
    <>
      <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="font-semibold text-emeraldDeep">1. Invoice Target</p><p className="text-xs text-slate-500">Pilih alur invoice agar field dan harga mengikuti konteks.</p></div>
      <Field label="Invoice Target Type"><Select name="targetType" value={targetType} onChange={(event) => setTargetType(event.target.value)} {...disabled}>{invoiceTargetTypes.map((type) => <option key={type}>{type}</option>)}</Select></Field>
      <Field label="Invoice Number"><Input name="number" defaultValue={String(existing?.number ?? `${data.event.invoicePrefix}/${String(data.invoices.length + 1).padStart(3, "0")}`)} required {...disabled} /></Field>
      {(targetType === "Vendor / Sponsor" || targetType === "Booth Only") && <Field label="Select Vendor"><Select name="vendorId" value={vendorId} onChange={(event) => { setVendorId(event.target.value); const vendor = data.vendors.find((item) => item.id === event.target.value); if (vendor) setCategory(vendor.packageName); }} {...disabled}><option value="">-</option>{data.vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.company}</option>)}</Select></Field>}
      {(targetType === "Participant" || targetType === "Symposium Only" || targetType === "Workshop Only") && <Field label="Select Participant"><Select name="participantId" value={participantId} onChange={(event) => { setParticipantId(event.target.value); const participant = data.participants.find((item) => item.id === event.target.value); if (participant) setCategory(participant.category); }} {...disabled}><option value="">-</option>{data.participants.map((participant) => <option key={participant.id} value={participant.id}>{participant.fullName}</option>)}</Select></Field>}
      <Field label="Manual Bill To / Group Coordinator"><Input name="billTo" defaultValue={String(existing?.billTo ?? autoBillTo ?? "")} placeholder={autoBillTo || "Manual name"} required {...disabled} /></Field>
      <Field label="PIC / Contact"><Input name="picContact" defaultValue={String(existing?.picContact ?? autoContact ?? "")} placeholder={autoContact || "WA/email/contact"} {...disabled} /></Field>

      <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="font-semibold text-emeraldDeep">2. Registration / Package Details</p></div>
      <Field label="Registration / Product Type"><Select name="registrationType" value={registrationType} onChange={(event) => setRegistrationType(event.target.value)} {...disabled}><option>Symposium</option><option>Workshop</option><option>Symposium + Workshop</option><option>Booth</option><option>Sponsor package</option><option>Custom</option></Select></Field>
      <Field label="Category / Package"><Select name="category" value={category} onChange={(event) => setCategory(event.target.value)} {...disabled}><option>Member PERDESTI</option><option>Non-member PERDESTI</option><option>Dokter Umum</option><option>Internship / Koas / Mahasiswa</option><option>Resident / PPDS</option><option>Silver</option><option>Gold</option><option>Platinum</option><option>Custom</option></Select></Field>
      <Field label="Invoice Date"><Input name="invoiceDate" type="date" value={invoiceDate} onChange={(event) => setInvoiceDate(event.target.value)} {...disabled} /></Field>
      <Field label="Price Period"><Input name="pricePeriod" value={pricing?.period ?? "Manual / Custom"} readOnly /></Field>

      <div className="md:col-span-2 rounded-lg border border-champagne/40 bg-champagne/10 p-3 text-sm"><strong>Price preview:</strong> {rupiah(unitPrice)} x {qty} - {rupiah(finalDiscount)} = <strong>{rupiah(total)}</strong><br /><span className="text-xs">{pricing?.notes ?? "Manual override aktif bila Unit Price diisi."}</span>{targetType === "Group Registration" && <span className="block text-xs">Promo 5+1: paid {paidGroupCount}, free {freeGroupCount}, deduction {rupiah(groupDiscount)}.</span>}</div>

      <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="font-semibold text-emeraldDeep">3. Invoice Items</p></div>
      <Field label="Item Description"><Input name="description" defaultValue={String(initialItem?.description ?? `${targetType} - ${registrationType}`)} required {...disabled} /></Field>
      <Field label="Qty"><Input name="qty" type="number" value={qty} onChange={(event) => setQty(Number(event.target.value))} required {...disabled} /></Field>
      <Field label="Unit Price"><Input name="unitPrice" type="number" value={manualUnit || suggestedUnit} onChange={(event) => setManualUnit(Number(event.target.value))} required {...disabled} /></Field>
      <Field label="Discount / Promo Deduction"><Input name="discount" type="number" value={finalDiscount} onChange={(event) => setDiscount(Number(event.target.value))} {...disabled} /></Field>

      <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="font-semibold text-emeraldDeep">4. Payment Terms</p></div>
      <Field label="Due Date"><Input name="dueDate" type="date" defaultValue={String(existing?.dueDate ?? data.event.finalPaymentDeadline)} {...disabled} /></Field>
      <Field label="Invoice Status"><Select name="status" defaultValue={String(existing?.status ?? "Draft")} {...disabled}><option>Draft</option><option>Sent</option><option>Cancelled</option></Select></Field>
      <Field label="Handled By"><Select name="handledBy" defaultValue={String(existing?.handledBy ?? data.committee[0]?.name ?? "")} {...disabled}>{data.committee.map((member) => <option key={member.id}>{member.name}</option>)}</Select></Field>
      <Field label="Bank Account"><Input defaultValue={data.event.bankAccount} disabled /></Field>

      <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="font-semibold text-emeraldDeep">5. Agreement / Benefits</p></div>
      <div className="md:col-span-2"><Field label="Special Notes / Agreement Notes"><Textarea name="specialNotes" defaultValue={String(existing?.specialNotes ?? existing?.notes ?? (targetType === "Group Registration" ? data.event.promoNotes : selectedVendor?.notes ?? ""))} {...disabled} /></Field></div>
    </>
  );
}

function collection(data: AppData, key: EditableKey): Record<string, unknown>[] {
  const map = { committee: data.committee, vendors: data.vendors, participants: data.participants, booths: data.booths, benefits: data.benefits, files: data.files, invoices: data.invoices, payments: data.payments, archive: data.documents, agreement: data.letters, whatsapp: data.messages, activity: data.logs };
  return map[key] as Record<string, unknown>[];
}

function moduleTitle(key: EditableKey) {
  return ({ committee: "Panitia", vendors: "Vendor", participants: "Peserta", booths: "Booth", benefits: "Benefit", files: "Kelengkapan File", invoices: "Invoice", payments: "Pembayaran", archive: "Dokumen", agreement: "Surat Sponsor", whatsapp: "WhatsApp Message", activity: "Activity Log" } as Record<EditableKey, string>)[key];
}

function buildRecord(key: EditableKey, form: FormData, existing: Record<string, unknown> | undefined, data: AppData): { ok: true; record: Record<string, unknown>; name: string } | { ok: false; error: string } {
  const id = String(existing?.id ?? uid(key));
  if (key === "booths") {
    const number = fieldValue(form.get("number"));
    const vendorId = fieldValue(form.get("vendorId"));
    const status = fieldValue(form.get("status"));
    const conflict = data.booths.find((booth) => booth.id !== id && booth.vendorId && vendorId && booth.vendorId !== vendorId && booth.number === number && activeBoothStatuses.includes(booth.status));
    if (conflict && activeBoothStatuses.includes(status)) return { ok: false, error: `Booth ${number} sudah aktif untuk vendor lain. Double booking dicegah.` };
    return { ok: true, name: number, record: { ...existing, id, number, size: fieldValue(form.get("size")), area: fieldValue(form.get("area")), status, vendorId: vendorId || undefined, holdExpiry: fieldValue(form.get("holdExpiry")) || undefined, electricityNote: fieldValue(form.get("electricityNote")), electricity: fieldValue(form.get("electricityNote")), demo: existing?.demo } };
  }
  if (key === "committee") return { ok: true, name: fieldValue(form.get("name")), record: { ...existing, id, name: fieldValue(form.get("name")), role: fieldValue(form.get("role")), whatsapp: fieldValue(form.get("whatsapp")), email: fieldValue(form.get("email")), active: true, accessRole: fieldValue(form.get("accessRole")), demo: existing?.demo } };
  if (key === "vendors") return { ok: true, name: fieldValue(form.get("company")), record: { ...existing, id, company: fieldValue(form.get("company")), pic: fieldValue(form.get("pic")), position: fieldValue(form.get("position")), whatsapp: fieldValue(form.get("whatsapp")), email: fieldValue(form.get("email")), packageName: fieldValue(form.get("packageName")), packagePrice: Number(form.get("packagePrice")), price: Number(form.get("packagePrice")), boothNumber: fieldValue(form.get("boothNumber")), boothSize: "3 x 2 m", speakerSlot: false, handler: fieldValue(form.get("handler")), registeredBy: fieldValue(form.get("handler")), receivedBy: data.event.contactPerson, dpDeadline: data.event.finalPaymentDeadline, finalDeadline: data.event.finalPaymentDeadline, status: fieldValue(form.get("status")), notes: fieldValue(form.get("notes")), demo: existing?.demo } };
  if (key === "participants") return { ok: true, name: fieldValue(form.get("fullName")), record: { ...existing, id, fullName: fieldValue(form.get("fullName")), title: fieldValue(form.get("title")), institution: fieldValue(form.get("institution")), whatsapp: fieldValue(form.get("whatsapp")), email: fieldValue(form.get("email")), category: fieldValue(form.get("category")), perdestiMember: false, symposium: true, workshop: false, workshopType: "-", pricingType: fieldValue(form.get("pricingType")), paymentStatus: fieldValue(form.get("paymentStatus")), badgeStatus: "Belum Cetak", certificateStatus: "Belum Terbit", attendanceStatus: "Belum Hadir", demo: existing?.demo } };
  if (key === "benefits") return { ok: true, name: fieldValue(form.get("name")), record: { ...existing, id, vendorId: fieldValue(form.get("vendorId")), name: fieldValue(form.get("name")), description: fieldValue(form.get("description")), quantity: Number(form.get("quantity")), dueDate: fieldValue(form.get("dueDate")), responsible: fieldValue(form.get("responsible")), status: fieldValue(form.get("status")), notes: fieldValue(form.get("notes")), demo: existing?.demo } };
  if (key === "files") return { ok: true, name: fieldValue(form.get("name")), record: { ...existing, id, vendorId: fieldValue(form.get("vendorId")), name: fieldValue(form.get("name")), required: form.get("required") === "true", uploaded: form.get("uploaded") === "true", dueDate: fieldValue(form.get("dueDate")), status: fieldValue(form.get("status")), reviewedBy: fieldValue(form.get("status")) === "Approved" ? data.event.contactPerson : String(existing?.reviewedBy ?? ""), notes: fieldValue(form.get("notes")), demo: existing?.demo } };
  if (key === "invoices") {
    const targetType = fieldValue(form.get("targetType")) as Invoice["targetType"];
    const invoiceDate = fieldValue(form.get("invoiceDate"));
    const vendor = data.vendors.find((item) => item.id === fieldValue(form.get("vendorId")));
    const participant = data.participants.find((item) => item.id === fieldValue(form.get("participantId")));
    const category = fieldValue(form.get("category"));
    const registrationType = fieldValue(form.get("registrationType"));
    const product = targetType === "Vendor / Sponsor" ? "Sponsor package" : targetType === "Booth Only" ? "Booth" : registrationType.includes("Workshop") && !registrationType.includes("Symposium") ? "Workshop" : "Symposium";
    const pricing = findPricing(category, product, invoiceDate);
    const manualUnit = Number(form.get("unitPrice"));
    const unitPrice = manualUnit > 0 ? manualUnit : pricing?.price ?? vendor?.packagePrice ?? 0;
    const qty = Number(form.get("qty") ?? 1);
    const promoDeduction = Number(form.get("discount") ?? 0);
    const targetId = targetType === "Participant" || targetType === "Symposium Only" || targetType === "Workshop Only" ? participant?.id : vendor?.id;
    const billTo = targetType === "Participant" || targetType === "Symposium Only" || targetType === "Workshop Only" ? participant?.fullName ?? fieldValue(form.get("billTo")) : targetType === "Vendor / Sponsor" || targetType === "Booth Only" ? vendor?.company ?? fieldValue(form.get("billTo")) : fieldValue(form.get("billTo"));
    const picContact = targetType === "Participant" || targetType === "Symposium Only" || targetType === "Workshop Only" ? participant?.whatsapp ?? fieldValue(form.get("picContact")) : vendor?.pic ?? fieldValue(form.get("picContact"));
    const description = fieldValue(form.get("description")) || `${targetType} - ${registrationType}`;
    const notes = targetType === "Group Registration" ? `${fieldValue(form.get("specialNotes"))}\n${data.event.promoNotes ?? ""}` : fieldValue(form.get("specialNotes"));
    return { ok: true, name: fieldValue(form.get("number")), record: { ...existing, id, number: fieldValue(form.get("number")), type: targetType ?? "Custom / Other", targetType, targetId, targetName: billTo, category, registrationType, pricePeriod: pricing?.period ?? fieldValue(form.get("pricePeriod")), promoDeduction, paymentStatus: existing?.paymentStatus ?? "Unpaid", verificationStatus: existing?.verificationStatus ?? "No Payment", billTo, picContact, invoiceDate, dueDate: fieldValue(form.get("dueDate")), items: [{ description, qty, unitPrice, discount: promoDeduction }], dpPaid: verifiedPaid(id, data.payments), status: fieldValue(form.get("status")) as Invoice["status"], registeredBy: currentUser, receivedBy: data.event.contactPerson, handledBy: fieldValue(form.get("handledBy")), notes, specialNotes: notes, vendorId: vendor?.id, demo: existing?.demo } };
  }
  if (key === "payments") {
    const targetType = fieldValue(form.get("targetType")) as Payment["targetType"];
    const linkedEntityId = targetType === "Participant" ? fieldValue(form.get("linkedParticipantId")) : targetType === "Vendor / Sponsor" ? fieldValue(form.get("linkedVendorId")) : "";
    const linkedEntityName = targetType === "Participant"
      ? data.participants.find((participant) => participant.id === linkedEntityId)?.fullName
      : targetType === "Vendor / Sponsor"
        ? data.vendors.find((vendor) => vendor.id === linkedEntityId)?.company
        : fieldValue(form.get("manualPayer"));
    return { ok: true, name: fieldValue(form.get("senderName")), record: { ...existing, id, targetType, linkedEntityId, linkedEntityName, linkedAgreementId: fieldValue(form.get("linkedAgreementId")) || undefined, linkedBoothId: fieldValue(form.get("linkedBoothId")) || undefined, invoiceId: fieldValue(form.get("invoiceId")), date: fieldValue(form.get("date")), amount: Number(form.get("amount")), method: fieldValue(form.get("method")), receivingBank: fieldValue(form.get("receivingBank")), senderName: fieldValue(form.get("senderName")), receivedBy: fieldValue(form.get("receivedBy")), verifiedBy: fieldValue(form.get("verifiedBy")) || undefined, verificationStatus: fieldValue(form.get("verificationStatus")), notes: fieldValue(form.get("notes")), specialAgreement: fieldValue(form.get("specialAgreement")), demo: existing?.demo } };
  }
  if (key === "archive") return { ok: true, name: fieldValue(form.get("name")), record: { ...existing, id, name: fieldValue(form.get("name")), type: fieldValue(form.get("type")), relatedName: fieldValue(form.get("relatedName")), status: fieldValue(form.get("status")), createdAt: String(existing?.createdAt ?? new Date().toISOString()), notes: fieldValue(form.get("notes")), demo: existing?.demo } };
  if (key === "agreement") return { ok: true, name: fieldValue(form.get("number")), record: { ...existing, id, vendorId: fieldValue(form.get("vendorId")), number: fieldValue(form.get("number")), signerName: fieldValue(form.get("signerName")), signerRole: fieldValue(form.get("signerRole")), committeeSignerName: fieldValue(form.get("committeeSignerName")), committeeSignerRole: fieldValue(form.get("committeeSignerRole")), cityDate: fieldValue(form.get("cityDate")), notes: fieldValue(form.get("notes")), demo: existing?.demo } };
  if (key === "whatsapp") return { ok: true, name: fieldValue(form.get("recipient")), record: { ...existing, id, recipient: fieldValue(form.get("recipient")), phone: fieldValue(form.get("phone")), type: fieldValue(form.get("type")), text: fieldValue(form.get("text")), demo: existing?.demo } };
  return { ok: false, error: "Module ini tidak bisa diedit dari modal." };
}

function upsertByKey(data: AppData, key: EditableKey, record: Record<string, unknown>): AppData {
  const upsert = <T extends { id: string }>(rows: T[]) => rows.some((item) => item.id === record.id) ? rows.map((item) => item.id === record.id ? record as T : item) : [record as T, ...rows];
  if (key === "committee") return { ...data, committee: upsert(data.committee) };
  if (key === "vendors") return { ...data, vendors: upsert(data.vendors) };
  if (key === "participants") return { ...data, participants: upsert(data.participants) };
  if (key === "booths") return { ...data, booths: upsert(data.booths) };
  if (key === "benefits") return { ...data, benefits: upsert(data.benefits) };
  if (key === "files") return { ...data, files: upsert(data.files) };
  if (key === "invoices") return { ...data, invoices: upsert(data.invoices) };
  if (key === "payments") return { ...data, payments: upsert(data.payments) };
  if (key === "archive") return { ...data, documents: upsert(data.documents) };
  if (key === "agreement") return { ...data, letters: upsert(data.letters) };
  if (key === "whatsapp") return { ...data, messages: upsert(data.messages) };
  return data;
}

function removeByKey(data: AppData, key: EditableKey, id: string): AppData {
  const remove = <T extends { id: string }>(rows: T[]) => rows.filter((item) => item.id !== id);
  if (key === "committee") return { ...data, committee: remove(data.committee) };
  if (key === "vendors") return { ...data, vendors: remove(data.vendors) };
  if (key === "participants") return { ...data, participants: remove(data.participants) };
  if (key === "booths") return { ...data, booths: remove(data.booths) };
  if (key === "benefits") return { ...data, benefits: remove(data.benefits) };
  if (key === "files") return { ...data, files: remove(data.files) };
  if (key === "invoices") return { ...data, invoices: remove(data.invoices) };
  if (key === "payments") return { ...data, payments: remove(data.payments) };
  if (key === "archive") return { ...data, documents: remove(data.documents) };
  if (key === "agreement") return { ...data, letters: remove(data.letters) };
  if (key === "whatsapp") return { ...data, messages: remove(data.messages) };
  return data;
}

function getReportRows(report: string, data: AppData): Record<string, unknown>[] {
  if (report.includes("Vendor payment")) return data.vendors.map((vendor) => { const invoice = data.invoices.find((item) => item.vendorId === vendor.id); return { vendor: vendor.company, package: vendor.packageName, invoice: invoice?.number ?? "-", total: invoice ? invoiceTotal(invoice) : 0, verifiedPaid: invoice ? verifiedPaid(invoice.id, data.payments) : 0, outstanding: invoice ? invoiceTotal(invoice) - verifiedPaid(invoice.id, data.payments) : 0, status: vendor.status }; });
  if (report.includes("Participant")) return data.participants as unknown as Record<string, unknown>[];
  if (report.includes("Outstanding")) return data.invoices.filter((invoice) => invoiceTotal(invoice) > verifiedPaid(invoice.id, data.payments)).map((invoice) => ({ invoice: invoice.number, billTo: invoice.billTo, total: invoiceTotal(invoice), paid: verifiedPaid(invoice.id, data.payments), remaining: invoiceTotal(invoice) - verifiedPaid(invoice.id, data.payments), dueDate: invoice.dueDate, status: invoice.status }));
  if (report.includes("Booth")) return data.booths.map((booth) => ({ ...booth, vendor: data.vendors.find((vendor) => vendor.id === booth.vendorId)?.company ?? "-" })) as unknown as Record<string, unknown>[];
  if (report.includes("benefit")) return data.benefits.map((benefit) => ({ ...benefit, vendor: data.vendors.find((vendor) => vendor.id === benefit.vendorId)?.company ?? "-" })) as unknown as Record<string, unknown>[];
  if (report.includes("File")) return data.files.map((file) => ({ ...file, vendor: data.vendors.find((vendor) => vendor.id === file.vendorId)?.company ?? "-" })) as unknown as Record<string, unknown>[];
  if (report.includes("Payment received")) return data.payments.filter((payment) => payment.verificationStatus === "Verified") as unknown as Record<string, unknown>[];
  if (report.includes("verification")) return data.payments as unknown as Record<string, unknown>[];
  if (report.includes("Committee")) return data.committee.map((member) => ({ member: member.name, role: member.role, vendorsHandled: data.vendors.filter((vendor) => vendor.handler === member.name).length, paymentsReceived: data.payments.filter((payment) => payment.receivedBy === member.name).length })) as unknown as Record<string, unknown>[];
  if (report.includes("Activity")) return data.logs as unknown as Record<string, unknown>[];
  if (report.includes("Sponsor agreement")) return data.letters.map((letter) => ({ ...letter, vendor: data.vendors.find((vendor) => vendor.id === letter.vendorId)?.company ?? "-" })) as unknown as Record<string, unknown>[];
  if (report.includes("Promo usage")) {
    const grouped = data.participants.filter((participant) => participant.groupReference);
    const paid = grouped.filter((participant) => participant.promoRole !== "Free");
    const free = grouped.filter((participant) => participant.promoRole === "Free");
    return [{
      promoName: data.event.promoName,
      validUntil: data.event.promoEndDate,
      eligibleGroupRegistrations: new Set(grouped.map((participant) => participant.groupReference)).size,
      paidParticipants: paid.length,
      freeParticipants: free.length,
      promoDeduction: free.length * 1500000,
      notes: data.event.promoNotes
    }];
  }
  return [];
}

async function loadImageData(url?: string) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function drawPdfHeader(doc: any, event: EventSettings, title: string) {
  doc.setFillColor(251, 250, 245);
  doc.rect(0, 0, 210, 297, "F");
  doc.setFillColor(7, 94, 84);
  doc.rect(0, 0, 210, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(`${event.name} | ${event.dateRange}`, 14, 12);
  const logos = event.logos.slice().sort((a, b) => a.order - b.order).slice(0, 5);
  for (let index = 0; index < logos.length; index += 1) {
    const logo = logos[index];
    const x = 14 + index * 36;
    doc.setDrawColor(200, 164, 93);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, 28, 28, 16, 2, 2, "FD");
    const imageData = await loadImageData(logo.publicUrl);
    if (imageData) {
      doc.addImage(imageData, x + 2, 30, 24, 12, undefined, "FAST");
    } else {
      doc.setTextColor(7, 94, 84);
      doc.setFontSize(6);
      doc.text(logo.name || "Logo", x + 14, 37, { align: "center", maxWidth: 24 });
    }
  }
  doc.setTextColor(7, 94, 84);
  doc.setFontSize(12);
  doc.text(event.fullTitle, 14, 54, { maxWidth: 182 });
  doc.setDrawColor(200, 164, 93);
  doc.setLineWidth(0.8);
  doc.line(14, 62, 196, 62);
  doc.setFontSize(16);
  doc.text(title, 14, 74);
}

function drawPdfFooter(doc: any, event: EventSettings) {
  doc.setDrawColor(200, 164, 93);
  doc.line(14, 274, 196, 274);
  doc.setTextColor(90, 100, 105);
  doc.setFontSize(8);
  doc.text(`${event.contactPerson} | ${event.email} | ${event.instagram}`, 14, 281);
  doc.text(event.secretariat, 14, 286);
  doc.text(event.footerDisclaimer, 14, 291, { maxWidth: 180 });
}

async function drawStamp(doc: any, event: EventSettings, x: number, y: number, show = true) {
  if (!show) return;
  doc.setDrawColor(200, 164, 93);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, 32, 22, 2, 2, "FD");
  const imageData = await loadImageData(event.stampUrl);
  if (imageData) {
    doc.addImage(imageData, x + 3, y + 2, 26, 18, undefined, "FAST");
    return;
  }
  doc.setTextColor(7, 94, 84);
  doc.setFontSize(7);
  doc.text(event.stampLabel ?? "Stempel Resmi", x + 16, y + 9, { align: "center", maxWidth: 28 });
  doc.text("STAMP", x + 16, y + 17, { align: "center" });
}

async function drawSignature(doc: any, event: EventSettings, x: number, y: number) {
  const imageData = await loadImageData(event.signatureUrl);
  if (imageData) {
    doc.addImage(imageData, x, y, 30, 14, undefined, "FAST");
    return;
  }
  doc.setDrawColor(200, 164, 93);
  doc.roundedRect(x, y, 30, 14, 2, 2);
  doc.setFontSize(6.5);
  doc.setTextColor(90, 100, 105);
  doc.text("signature", x + 15, y + 8, { align: "center" });
}

async function drawInvoicePdf(doc: any, data: AppData, invoice: Invoice, vendor?: Vendor) {
  const total = invoiceTotal(invoice);
  const paid = verifiedPaid(invoice.id, data.payments);
  const paymentStatus = derivePaymentStatus(invoice, data.payments);
  const verificationStatus = deriveVerificationStatus(invoice, data.payments);
  const targetType = invoiceTargetLabel(invoice);
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.5);
  doc.autoTable({ startY: 82, theme: "plain", body: [[`Invoice No\n${invoice.number}\nIssue: ${invoice.invoiceDate}\nDue: ${invoice.dueDate}`, `Bill To\n${invoice.billTo}\nPIC/Contact: ${invoice.picContact || "-"}\nTarget: ${targetType}`, `Status\nInvoice: ${invoice.status}\nPayment: ${paymentStatus}\nVerify: ${verificationStatus}`]], styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [30, 41, 59] }, columnStyles: { 0: { cellWidth: 52, fillColor: [238, 246, 243] }, 1: { cellWidth: 78, fillColor: [255, 255, 255] }, 2: { cellWidth: 52, fillColor: [238, 246, 243] } } });
  const targetSummary = targetType === "Vendor / Sponsor"
    ? `Package: ${vendor?.packageName ?? invoice.category ?? "-"} | Booth: ${vendor?.boothNumber ?? "-"} (${vendor?.boothSize ?? "-"})`
    : targetType === "Group Registration"
      ? `Group invoice | ${invoice.notes?.includes("Promo") ? "Promo applied" : "Promo eligible if 5+1"}`
      : `${invoice.registrationType ?? "-"} | Category: ${invoice.category ?? "-"} | Period: ${invoice.pricePeriod ?? "-"}`;
  doc.autoTable({ startY: doc.lastAutoTable.finalY + 3, theme: "grid", head: [["Event / Package / Registration Summary"]], body: [[`${data.event.name} | ${data.event.dateRange}\n${targetSummary}`]], headStyles: { fillColor: [7, 94, 84], textColor: 255, fontSize: 8 }, styles: { fontSize: 8, cellPadding: 2.5 } });
  doc.autoTable({ startY: doc.lastAutoTable.finalY + 3, theme: "grid", head: [["Item Description", "Qty", "Unit Price", "Discount", "Total"]], body: invoice.items.map((item) => [item.description, item.qty, rupiah(item.unitPrice), rupiah(item.discount), rupiah(item.qty * item.unitPrice - item.discount)]), headStyles: { fillColor: [7, 94, 84], textColor: 255, fontSize: 8 }, styles: { fontSize: 8, cellPadding: 2.2 }, columnStyles: { 0: { cellWidth: 86 }, 4: { halign: "right" } } });
  doc.autoTable({ startY: doc.lastAutoTable.finalY + 3, theme: "grid", body: [["Grand Total", rupiah(total), "Paid", rupiah(paid)], ["Pending", rupiah(pendingPaid(invoice.id, data.payments)), "Remaining", rupiah(total - paid)], ["Bank / Terms", `${data.event.bankAccount}\n${data.event.defaultTerms}`, "Deadline", data.event.finalPaymentDeadline]], styles: { fontSize: 8, cellPadding: 2.4 }, columnStyles: { 0: { fontStyle: "bold", fillColor: [238, 246, 243] }, 2: { fontStyle: "bold", fillColor: [238, 246, 243] } } });
  const benefits = data.benefits.filter((benefit) => benefit.vendorId === invoice.vendorId);
  if (targetType === "Vendor / Sponsor" && benefits.length) doc.autoTable({ startY: doc.lastAutoTable.finalY + 3, theme: "grid", head: [["Key Benefits (max 6)", "Qty", "Status"]], body: benefits.slice(0, 6).map((benefit) => [benefit.name, benefit.quantity, benefit.status]).concat(benefits.length > 6 ? [["Detail benefit lengkap tersedia pada lampiran benefit checklist.", "", ""]] : []), headStyles: { fillColor: [7, 94, 84], textColor: 255, fontSize: 8 }, styles: { fontSize: 7.5, cellPadding: 1.8 } });
  if (targetType === "Group Registration" && invoice.promoDeduction) doc.autoTable({ startY: doc.lastAutoTable.finalY + 3, theme: "grid", body: [["Promo 5 Peserta Dokter Free 1", `Deduction: ${rupiah(invoice.promoDeduction)}`], ["Note", data.event.promoNotes ?? ""]], styles: { fontSize: 7.5, cellPadding: 2 }, columnStyles: { 0: { fontStyle: "bold", fillColor: [238, 246, 243] } } });
  doc.autoTable({ startY: doc.lastAutoTable.finalY + 3, theme: "grid", head: [["Notes / Special Agreement"]], body: [[`${invoice.specialNotes || invoice.notes || vendor?.notes || "-"}`]], headStyles: { fillColor: [200, 164, 93], textColor: 255, fontSize: 8 }, styles: { fontSize: 7.5, cellPadding: 2 } });
  const y = Math.min((doc.lastAutoTable?.finalY ?? 205) + 7, 238);
  doc.setFontSize(7.5);
  doc.text(`Registered by: ${invoice.registeredBy}`, 14, y);
  doc.text(`Received by: ${invoice.receivedBy}`, 14, y + 5);
  doc.text(`Handled by: ${invoice.handledBy}`, 14, y + 10);
  doc.text("Prepared by", 112, y);
  doc.text("Finance/Bendahara", 112, y + 32);
  doc.text("Verified by", 152, y);
  doc.text(data.event.contactPerson, 152, y + 32);
  await drawSignature(doc, data.event, 112, y + 8);
  await drawStamp(doc, data.event, 75, y - 2, data.event.showStampOnInvoice);
}

async function drawReceiptPdf(doc: any, data: AppData, payment: Payment, invoice: Invoice) {
  const remaining = invoiceTotal(invoice) - verifiedPaid(invoice.id, data.payments);
  doc.autoTable({ startY: 84, theme: "grid", head: [["Receipt Detail", "Value"]], body: [["Receipt Number", `${data.event.receiptPrefix}/${payment.id.toUpperCase()}`], ["Invoice", invoice.number], ["Payer", payment.senderName], ["Payment Purpose", invoice.type], ["Amount", rupiah(payment.amount)], ["Payment Date", payment.date], ["Method", payment.method], ["Receiving Bank", payment.receivingBank], ["Payment Label", remaining <= 0 ? "Full Payment" : "DP / Partial Payment"], ["Remaining Balance", rupiah(Math.max(remaining, 0))], ["Verification", payment.verificationStatus], ["Received By", payment.receivedBy], ["Verified By", payment.verifiedBy ?? "-"], ["Notes", payment.notes]], headStyles: { fillColor: [7, 94, 84] }, styles: { fontSize: 9, cellPadding: 3 }, columnStyles: { 0: { fontStyle: "bold", fillColor: [238, 246, 243] } } });
  doc.text("Receipt ini valid setelah verifikasi oleh Finance/Bendahara.", 14, 220);
  doc.text("Bendahara / Finance", 140, 230);
  doc.text("(signature placeholder)", 140, 254);
  await drawStamp(doc, data.event, 92, 226, data.event.showStampOnReceipt);
}

async function drawAgreementPdf(doc: any, data: AppData, vendor: Vendor, letter: SponsorLetter) {
  const benefits = data.benefits.filter((benefit) => benefit.vendorId === vendor.id);
  const files = data.files.filter((file) => file.vendorId === vendor.id && file.required);
  doc.autoTable({ startY: 84, theme: "grid", body: [["Nomor Surat", letter.number], ["Perusahaan", vendor.company], ["PIC", `${vendor.pic} - ${vendor.position}`], ["Kontak", `${vendor.whatsapp} | ${vendor.email}`], ["Paket", vendor.packageName], ["Booth", `${vendor.boothNumber} (${vendor.boothSize})`], ["Nilai Kesepakatan", rupiah(vendor.packagePrice)], ["DP / Final Deadline", `${vendor.dpDeadline} / ${vendor.finalDeadline}`], ["Rekening Tujuan", data.event.bankAccount]], styles: { fontSize: 9 }, columnStyles: { 0: { fontStyle: "bold", fillColor: [238, 246, 243] } } });
  doc.setFontSize(10);
  doc.text(`Dengan ini ${vendor.company} menyatakan bersedia berpartisipasi dalam ${data.event.fullTitle} dan mengikuti ketentuan administrasi, jadwal pembayaran, serta kelengkapan dokumen yang dibutuhkan oleh panitia.`, 14, doc.lastAutoTable.finalY + 10, { maxWidth: 182 });
  doc.autoTable({ startY: doc.lastAutoTable.finalY + 24, theme: "grid", head: [["Benefits Included", "Qty", "Status"]], body: benefits.map((benefit) => [benefit.name, benefit.quantity, benefit.status]), headStyles: { fillColor: [7, 94, 84] }, styles: { fontSize: 8 } });
  doc.autoTable({ startY: doc.lastAutoTable.finalY + 6, theme: "grid", head: [["Required Files", "Status"]], body: files.map((file) => [file.name, file.status]), headStyles: { fillColor: [7, 94, 84] }, styles: { fontSize: 8 } });
  const y = Math.min(doc.lastAutoTable.finalY + 14, 228);
  doc.text(letter.cityDate, 14, y);
  doc.text("Perwakilan Perusahaan", 20, y + 12);
  doc.text("Panitia PASS RIAU", 125, y + 12);
  doc.text(letter.signerName, 20, y + 42);
  doc.text(letter.signerRole, 20, y + 48);
  doc.text(letter.committeeSignerName, 125, y + 42);
  doc.text(letter.committeeSignerRole, 125, y + 48);
  await drawStamp(doc, data.event, 86, y + 18, data.event.showStampOnAgreement);
}

function drawBenefitPdf(doc: any, data: AppData, vendor: Vendor) {
  const rows = data.benefits.filter((benefit) => benefit.vendorId === vendor.id);
  doc.text(`Vendor: ${vendor.company}`, 14, 84);
  doc.autoTable({ startY: 94, theme: "grid", head: [["Benefit", "Description", "Qty", "Due Date", "PIC", "Status", "Notes"]], body: rows.map((benefit) => [benefit.name, benefit.description, benefit.quantity, benefit.dueDate, benefit.responsible, benefit.status, benefit.notes]), headStyles: { fillColor: [7, 94, 84] }, styles: { fontSize: 8 } });
}

function drawReportPdf(doc: any, title: string, rows: Record<string, unknown>[], event: EventSettings) {
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString("id-ID")}`, 14, 84);
  doc.text(`Event: ${event.name}`, 14, 90);
  const columns = Object.keys(rows[0] ?? {}).slice(0, 6);
  doc.autoTable({ startY: 100, theme: "grid", head: [columns], body: rows.map((row) => columns.map((col) => String(row[col] ?? "-"))), headStyles: { fillColor: [7, 94, 84] }, styles: { fontSize: 7 } });
}

