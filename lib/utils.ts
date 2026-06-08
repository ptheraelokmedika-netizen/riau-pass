import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

export const rupiah = formatCurrency;

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

export function whatsappUrl(phone: string, message: string) {
  const normalized = phone.replace(/[^\d]/g, "").replace(/^0/, "62");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export const waUrl = whatsappUrl;
