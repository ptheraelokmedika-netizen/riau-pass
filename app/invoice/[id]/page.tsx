import { notFound } from "next/navigation";
import { PrintShell } from "@/components/print-document";
import { eventSettings, invoices, vendorBenefits, vendors } from "@/lib/sample-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function InvoicePage({ params }: { params: { id: string } }) {
  const invoice = invoices.find((item) => item.id === params.id || item.number.endsWith(params.id));
  if (!invoice) notFound();
  const total = invoice.items.reduce((sum, item) => sum + item.qty * item.unitPrice - item.discount, 0);
  const vendor = vendors.find((item) => item.id === invoice.vendorId);
  const benefits = vendorBenefits.filter((item) => item.vendorId === invoice.vendorId);

  return (
    <PrintShell title={`Invoice ${invoice.number}`}>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <p className="text-sm text-slate-500">Bill To</p>
          <p className="text-lg font-bold">{invoice.billTo}</p>
          <p className="text-sm">{invoice.picContact}</p>
        </div>
        <div className="text-left md:text-right">
          <p>Tanggal invoice: {formatDate(invoice.invoiceDate)}</p>
          <p>Jatuh tempo: {formatDate(invoice.dueDate)}</p>
          <p>Status: {invoice.status}</p>
        </div>
      </div>
      <table className="mt-8 w-full border-collapse text-sm">
        <thead><tr className="bg-mist"><th className="border p-3 text-left">Item</th><th className="border p-3">Qty</th><th className="border p-3 text-right">Harga</th><th className="border p-3 text-right">Total</th></tr></thead>
        <tbody>{invoice.items.map((item) => <tr key={item.description}><td className="border p-3">{item.description}</td><td className="border p-3 text-center">{item.qty}</td><td className="border p-3 text-right">{formatCurrency(item.unitPrice)}</td><td className="border p-3 text-right">{formatCurrency(item.qty * item.unitPrice - item.discount)}</td></tr>)}</tbody>
      </table>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <p className="font-bold">Detail booth dan benefit</p>
          <p className="text-sm">Booth: {vendor?.boothNumber ?? "-"} ({vendor?.boothSize ?? "-"})</p>
          <ul className="mt-2 text-sm">{benefits.map((benefit) => <li key={benefit.id}>- {benefit.name}</li>)}</ul>
        </div>
        <div className="rounded-lg bg-mist p-4">
          <p>Total: <strong>{formatCurrency(total)}</strong></p>
          <p>DP dibayar: <strong>{formatCurrency(invoice.dpPaid)}</strong></p>
          <p>Sisa tagihan: <strong>{formatCurrency(total - invoice.dpPaid)}</strong></p>
          <p className="mt-3 text-sm">Rekening: {eventSettings.bankAccount}</p>
        </div>
      </div>
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <p>Registered by: {invoice.registeredBy}</p>
        <p>Received by: {invoice.receivedBy}</p>
      </div>
    </PrintShell>
  );
}
