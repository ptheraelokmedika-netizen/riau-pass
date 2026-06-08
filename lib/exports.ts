"use client";

import { eventSettings, invoices, payments, vendors, participants, booths, vendorBenefits, fileRequirements, activityLogs } from "@/lib/sample-data";
import { rupiah } from "@/lib/utils";
import type { Invoice, Payment, Vendor } from "@/lib/types";

function totalInvoice(invoice: Invoice) {
  return invoice.items.reduce((sum, item) => sum + item.qty * item.unitPrice - item.discount, 0);
}

export async function exportWorkbook() {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  const sheets = {
    Vendors: vendors,
    Participants: participants,
    Invoices: invoices.map((invoice) => ({
      number: invoice.number,
      billTo: invoice.billTo,
      status: invoice.status,
      total: totalInvoice(invoice),
      dpPaid: invoice.dpPaid,
      remaining: totalInvoice(invoice) - invoice.dpPaid
    })),
    Payments: payments,
    Booths: booths,
    "Benefit Checklist": vendorBenefits,
    "File Requirements": fileRequirements,
    "Activity Log": activityLogs
  };

  Object.entries(sheets).forEach(([name, rows]) => {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), name.slice(0, 31));
  });

  XLSX.writeFile(workbook, "PASS-RIAU-2026-report.xlsx");
}

export function exportCsv(rows: Record<string, unknown>[], filename: string) {
  const headers = Object.keys(rows[0] ?? {});
  const csv = [headers.join(","), ...rows.map((row) => headers.map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function downloadInvoicePdf(invoice: Invoice) {
  const { jsPDF } = await import("jspdf");
  await import("jspdf-autotable");
  const doc = new jsPDF();
  const total = totalInvoice(invoice);
  const remaining = total - invoice.dpPaid;

  doc.setFillColor(7, 93, 84);
  doc.rect(0, 0, 210, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("PASS RIAU Event Manager", 14, 14);
  doc.setFontSize(10);
  doc.text(eventSettings.fullTitle, 14, 22);
  doc.setTextColor(31, 41, 51);
  doc.setFontSize(18);
  doc.text("INVOICE", 14, 45);
  doc.setFontSize(10);
  doc.text(`Nomor: ${invoice.number}`, 14, 54);
  doc.text(`Tanggal: ${invoice.invoiceDate}`, 14, 60);
  doc.text(`Jatuh tempo: ${invoice.dueDate}`, 14, 66);
  doc.text(`Ditagihkan kepada: ${invoice.billTo}`, 110, 54);
  doc.text(`Kontak: ${invoice.picContact}`, 110, 60);

  (doc as unknown as { autoTable: (options: unknown) => void }).autoTable({
    startY: 78,
    head: [["Deskripsi", "Qty", "Harga", "Diskon", "Total"]],
    body: invoice.items.map((item) => [item.description, item.qty, rupiah(item.unitPrice), rupiah(item.discount), rupiah(item.qty * item.unitPrice - item.discount)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [7, 93, 84] }
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  doc.setFontSize(11);
  doc.text(`Total invoice: ${rupiah(total)}`, 130, finalY);
  doc.text(`DP sudah dibayar: ${rupiah(invoice.dpPaid)}`, 130, finalY + 7);
  doc.text(`Sisa tagihan: ${rupiah(remaining)}`, 130, finalY + 14);
  doc.text(`Bank: ${eventSettings.bankAccount}`, 14, finalY + 28);
  doc.text(`Terms: ${eventSettings.defaultTerms}`, 14, finalY + 36, { maxWidth: 180 });
  const invoiceBenefits = vendorBenefits.filter((benefit) => benefit.vendorId === invoice.vendorId).map((benefit) => benefit.name);
  if (invoiceBenefits.length) {
    doc.text("Benefit termasuk:", 14, finalY + 52);
    doc.text(invoiceBenefits.map((benefit) => `- ${benefit}`).join("\n"), 18, finalY + 59);
  }
  doc.setFontSize(8);
  doc.text(eventSettings.footerDisclaimer, 14, 286, { maxWidth: 180 });
  doc.save(`${invoice.number.replaceAll("/", "-")}.pdf`);
}

export async function downloadReceiptPdf(payment: Payment, invoice: Invoice) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  doc.setFillColor(7, 93, 84);
  doc.rect(0, 0, 210, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("RECEIPT / BUKTI PEMBAYARAN", 14, 18);
  doc.setTextColor(31, 41, 51);
  doc.setFontSize(11);
  const lines = [
    `Receipt: RCT/PASS-RIAU/2026/${payment.id.toUpperCase()}`,
    `Invoice: ${invoice.number}`,
    `Pembayar: ${payment.senderName}`,
    `Tanggal: ${payment.date}`,
    `Jumlah: ${rupiah(payment.amount)}`,
    `Metode: ${payment.method}`,
    `Bank diterima: ${payment.receivingBank}`,
    `Status verifikasi: ${payment.verificationStatus}`,
    `Diterima oleh: ${payment.receivedBy}`,
    `Diverifikasi oleh: ${payment.verifiedBy ?? "-"}`
  ];
  doc.text(lines, 14, 48);
  doc.text(eventSettings.footerDisclaimer, 14, 286, { maxWidth: 180 });
  doc.save(`Receipt-${payment.id}.pdf`);
}

export async function downloadAgreementPdf(vendor: Vendor) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  doc.setFontSize(15);
  doc.setTextColor(7, 93, 84);
  doc.text("SURAT PERNYATAAN KESANGGUPAN BERPARTISIPASI", 14, 24);
  doc.setTextColor(31, 41, 51);
  doc.setFontSize(11);
  doc.text(
    [
      `Nomor: ${eventSettings.agreementPrefix}/${vendor.id.toUpperCase()}`,
      "",
      `Yang bertanda tangan di bawah ini mewakili ${vendor.company}, menyatakan bersedia berpartisipasi dalam ${eventSettings.name} - ${eventSettings.fullTitle}.`,
      `Paket sponsorship/booth: ${vendor.packageName}`,
      `Booth: ${vendor.boothNumber || "-"} (${vendor.boothSize || "-"})`,
      `Nilai kesepakatan: ${rupiah(vendor.packagePrice)}`,
      `Batas pembayaran DP: ${vendor.dpDeadline}`,
      `Batas pelunasan: ${vendor.finalDeadline}`,
      `Rekening tujuan: ${eventSettings.bankAccount}`,
      "",
      "Dengan ini perusahaan setuju mengikuti ketentuan administrasi, jadwal pembayaran, serta kelengkapan dokumen yang dibutuhkan oleh panitia.",
      "",
      "Pekanbaru, .................... 2026",
      "",
      "Perwakilan Perusahaan,                                Panitia PASS RIAU",
      "",
      "",
      `${vendor.pic}                                           ${eventSettings.contactPerson}`
    ],
    14,
    40,
    { maxWidth: 180 }
  );
  doc.setFontSize(8);
  doc.text(eventSettings.footerDisclaimer, 14, 286, { maxWidth: 180 });
  doc.save(`Surat-Kesanggupan-${vendor.company}.pdf`);
}
