"use client";

import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/types";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("rounded-lg border border-slate-200 bg-white p-5 shadow-soft", className)}>{children}</section>;
}

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "ghost" | "danger" }) {
  const variants = {
    primary: "bg-emeraldDeep text-white hover:bg-emeraldDeep/90",
    outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
    ghost: "text-slate-700 hover:bg-slate-100",
    danger: "bg-red-600 text-white hover:bg-red-700"
  };
  return (
    <button
      className={cn("inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60", variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emeraldDeep focus:ring-2 focus:ring-emeraldDeep/15" {...props} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emeraldDeep focus:ring-2 focus:ring-emeraldDeep/15" {...props} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emeraldDeep focus:ring-2 focus:ring-emeraldDeep/15" {...props} />;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: StatusTone }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    gold: "bg-amber-50 text-amber-700 ring-amber-200",
    blue: "bg-sky-50 text-sky-700 ring-sky-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    gray: "bg-slate-100 text-slate-700 ring-slate-200"
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", tones[tone])}>{children}</span>;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </div>
  );
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[760px] border-collapse bg-white text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children }: { children: React.ReactNode }) {
  return <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</th>;
}

export function Td({ children }: { children: React.ReactNode }) {
  return <td className="border-b border-slate-100 px-4 py-3 align-top text-slate-700">{children}</td>;
}
