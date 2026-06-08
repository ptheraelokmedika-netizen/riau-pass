import { notFound } from "next/navigation";
import { PrintShell } from "@/components/print-document";
import { invoices, payments } from "@/lib/sample-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ReceiptPage({ params }: { params: { id: string } }) {
  const payment = payments.find((item) => item.id === params.id);
  if (!payment) notFound();
  const invoice = invoices.find((item) => item.id === payment.invoiceId);

  return (
    <PrintShell title={`Receipt RCT-${payment.id.toUpperCase()}`}>
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <p>Invoice terkait: <strong>{invoice?.number}</strong></p>
        <p>Payer: <strong>{payment.senderName}</strong></p>
        <p>Tanggal pembayaran: {formatDate(payment.date)}</p>
        <p>Metode: {payment.method}</p>
        <p>Bank diterima: {payment.receivingBank}</p>
        <p>Status verifikasi: {payment.verificationStatus}</p>
      </div>
      <div className="mt-8 rounded-lg bg-mist p-5">
        <p className="text-sm text-slate-500">Jumlah diterima</p>
        <p className="text-3xl font-bold">{formatCurrency(payment.amount)}</p>
      </div>
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <p>Received by: {payment.receivedBy}</p>
        <p>Verified by: {payment.verifiedBy ?? "Menunggu verifikasi"}</p>
      </div>
    </PrintShell>
  );
}
