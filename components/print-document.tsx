import { eventSettings } from "@/lib/sample-data";

export function PrintShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-4xl bg-white p-8 text-emeraldInk print:p-6">
      <div className="flex items-start justify-between border-b-4 border-champagne pb-5">
        <div>
          <p className="text-sm font-bold uppercase text-champagne">{eventSettings.name}</p>
          <h1 className="mt-1 text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{eventSettings.fullTitle}</p>
        </div>
        <div className="flex gap-2">
          {eventSettings.logos.slice(0, 4).map((logo) => (
            <div key={logo.name} className="flex h-14 w-14 items-center justify-center rounded-md border border-emeraldDeep/15 bg-mist text-center text-[10px] font-bold">
              {logo.name}
            </div>
          ))}
        </div>
      </div>
      <section className="py-8">{children}</section>
      <footer className="mt-10 border-t border-champagne pt-4 text-xs text-slate-500">{eventSettings.footerDisclaimer}</footer>
    </main>
  );
}
