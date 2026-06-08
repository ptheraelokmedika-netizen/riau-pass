import { notFound } from "next/navigation";
import { PrintShell } from "@/components/print-document";
import { eventSettings, vendorBenefits, vendors } from "@/lib/sample-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AgreementPage({ params }: { params: { id: string } }) {
  const vendor = vendors.find((item) => item.id === params.id);
  if (!vendor) notFound();
  const benefits = vendorBenefits.filter((item) => item.vendorId === vendor.id);

  return (
    <PrintShell title="Surat Pernyataan Kesanggupan Berpartisipasi">
      <p className="leading-7">
        Yang bertanda tangan di bawah ini menyatakan bahwa <strong>{vendor.company}</strong>, diwakili oleh <strong>{vendor.pic}</strong> selaku {vendor.position}, bersedia berpartisipasi dalam {eventSettings.fullTitle} pada {eventSettings.dateRange}.
      </p>
      <div className="mt-6 rounded-lg border border-emeraldDeep/15 p-5">
        <p>Paket sponsor: <strong>{vendor.packageName}</strong></p>
        <p>Booth: <strong>{vendor.boothNumber}</strong> ({vendor.boothSize})</p>
        <p>Nilai kesepakatan: <strong>{formatCurrency(vendor.packagePrice)}</strong></p>
        <p>Deadline pembayaran: <strong>{formatDate(vendor.finalDeadline)}</strong></p>
        <p>Rekening tujuan: {eventSettings.bankAccount}</p>
      </div>
      <h2 className="mt-8 text-lg font-bold">Benefit yang Disepakati</h2>
      <ul className="mt-2 grid gap-1 text-sm">{benefits.map((benefit) => <li key={benefit.id}>- {benefit.name}: {benefit.description}</li>)}</ul>
      <div className="mt-12 grid gap-10 md:grid-cols-2">
        <div>
          <p>Pekanbaru, {formatDate(new Date().toISOString())}</p>
          <p className="mt-20 font-bold">{vendor.pic}</p>
          <p>{vendor.position}</p>
        </div>
        <div>
          <p>Mengetahui Panitia</p>
          <p className="mt-20 font-bold">{eventSettings.contactPerson}</p>
          <p>Panitia PASS RIAU</p>
        </div>
      </div>
    </PrintShell>
  );
}
