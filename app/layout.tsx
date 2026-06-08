import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PASS RIAU Event Manager",
  description: "Sistem manajemen event, sponsor, invoice, pembayaran, dan laporan PASS RIAU."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
