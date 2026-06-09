import type { ActivityLog, Booth, CommitteeMember, EventSettings, FileRequirement, Invoice, Participant, Payment, Vendor, VendorBenefit } from "@/lib/types";
import { supabase } from "./supabase";

type AppDataShape = {
  event: EventSettings;
  committee: CommitteeMember[];
  vendors: Vendor[];
  participants: Participant[];
  booths: Booth[];
  benefits: VendorBenefit[];
  files: FileRequirement[];
  invoices: Invoice[];
  payments: Payment[];
  documents: Array<Record<string, unknown>>;
  logs: ActivityLog[];
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value?: string) {
  return Boolean(value && uuidPattern.test(value));
}

function toUiVendorStatus(value: unknown): Vendor["status"] {
  const status = String(value ?? "").toLowerCase();
  if (status === "lead") return "Lead";
  if (status === "booked") return "Booked";
  if (status === "dp paid") return "DP Paid";
  if (status === "partially paid") return "Partially Paid";
  if (status === "fully paid") return "Fully Paid";
  if (status === "cancelled") return "Cancelled";
  return "Lead";
}

function toDbVendorStatus(value: unknown) {
  const status = String(value ?? "").toLowerCase();
  if (status === "dp paid") return "DP paid";
  if (status === "partially paid") return "partially paid";
  if (status === "fully paid") return "fully paid";
  if (status === "booked") return "booked";
  if (status === "cancelled") return "cancelled";
  return "lead";
}

function row<T>(value: unknown) {
  return value as T;
}

function firstEvent(fallback: EventSettings, eventRow?: Record<string, unknown>, logos: Record<string, unknown>[] = []): EventSettings {
  if (!eventRow) return { ...fallback, logos: [] };
  return {
    ...fallback,
    id: String(eventRow.id),
    name: String(eventRow.event_name ?? fallback.name),
    year: Number(eventRow.event_year ?? fallback.year),
    fullTitle: String(eventRow.full_title ?? fallback.fullTitle),
    dateRange: String(eventRow.date_range ?? fallback.dateRange),
    symposium: String(eventRow.symposium_date_venue ?? fallback.symposium),
    workshop: String(eventRow.workshop_date_venue ?? fallback.workshop),
    exhibition: String(eventRow.exhibition_date_venue ?? fallback.exhibition),
    bankAccount: String(eventRow.bank_account ?? fallback.bankAccount),
    contactPerson: String(eventRow.contact_person ?? fallback.contactPerson),
    email: String(eventRow.email ?? fallback.email),
    instagram: String(eventRow.instagram ?? fallback.instagram),
    secretariat: String(eventRow.secretariat_address ?? fallback.secretariat),
    invoicePrefix: String(eventRow.invoice_prefix ?? fallback.invoicePrefix),
    receiptPrefix: String(eventRow.receipt_prefix ?? fallback.receiptPrefix),
    agreementPrefix: String(eventRow.agreement_prefix ?? fallback.agreementPrefix),
    footerDisclaimer: String(eventRow.footer_disclaimer ?? fallback.footerDisclaimer),
    defaultTerms: String(eventRow.default_payment_terms ?? fallback.defaultTerms),
    defaultDpPercentage: Number(eventRow.default_dp_percentage ?? fallback.defaultDpPercentage),
    finalPaymentDeadline: String(eventRow.default_final_payment_deadline ?? fallback.finalPaymentDeadline),
    logos: logos.map((logo) => ({
      name: String(logo.logo_name ?? "Logo"),
      purpose: String(logo.logo_name ?? "Logo"),
      showOnInvoice: Boolean(logo.show_on_invoice),
      showOnReceipt: Boolean(logo.show_on_receipt),
      showOnAgreement: Boolean(logo.show_on_agreement),
      showOnFormalDocuments: Boolean(logo.show_on_formal_documents),
      order: Number(logo.logo_order ?? 1),
      size: (logo.logo_size as "small" | "medium" | "large") ?? "medium",
      storagePath: String(logo.file_path ?? ""),
      publicUrl: String(logo.public_url ?? "")
    }))
  };
}

export async function fetchSupabaseAppData(fallbackEvent: EventSettings): Promise<AppDataShape> {
  if (!supabase) throw new Error("Supabase client is not configured.");

  const { data: eventRows, error: eventError } = await supabase.from("events").select("*").order("event_year", { ascending: false }).limit(1);
  if (eventError) throw eventError;
  const eventRow = row<Record<string, unknown>[] | null>(eventRows)?.[0];
  const eventId = eventRow?.id ? String(eventRow.id) : "";

  const [logos, committee, vendors, participants, booths, benefits, files, invoices, invoiceItems, payments, documents, logs] = await Promise.all([
    eventId ? supabase.from("event_logos").select("*").eq("event_id", eventId) : Promise.resolve({ data: [], error: null }),
    eventId ? supabase.from("committee_members").select("*").eq("event_id", eventId) : Promise.resolve({ data: [], error: null }),
    eventId ? supabase.from("vendors").select("*").eq("event_id", eventId) : Promise.resolve({ data: [], error: null }),
    eventId ? supabase.from("participants").select("*").eq("event_id", eventId) : Promise.resolve({ data: [], error: null }),
    eventId ? supabase.from("booths").select("*").eq("event_id", eventId) : Promise.resolve({ data: [], error: null }),
    eventId ? supabase.from("vendor_benefits").select("*").eq("event_id", eventId) : Promise.resolve({ data: [], error: null }),
    eventId ? supabase.from("vendor_file_requirements").select("*").eq("event_id", eventId) : Promise.resolve({ data: [], error: null }),
    eventId ? supabase.from("invoices").select("*").eq("event_id", eventId) : Promise.resolve({ data: [], error: null }),
    eventId ? supabase.from("invoice_items").select("*").eq("event_id", eventId) : Promise.resolve({ data: [], error: null }),
    eventId ? supabase.from("payments").select("*").eq("event_id", eventId) : Promise.resolve({ data: [], error: null }),
    eventId ? supabase.from("documents").select("*").eq("event_id", eventId) : Promise.resolve({ data: [], error: null }),
    eventId ? supabase.from("activity_logs").select("*").eq("event_id", eventId).order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null })
  ]);

  for (const result of [logos, committee, vendors, participants, booths, benefits, files, invoices, invoiceItems, payments, documents, logs]) {
    if (result.error) throw result.error;
  }

  const invoiceItemRows = row<Record<string, unknown>[]>(invoiceItems.data ?? []);

  return {
    event: firstEvent(fallbackEvent, eventRow, row<Record<string, unknown>[]>(logos.data ?? [])),
    committee: row<Record<string, unknown>[]>(committee.data ?? []).map((item) => ({
      id: String(item.id),
      name: String(item.name ?? ""),
      role: String(item.role ?? ""),
      whatsapp: String(item.whatsapp ?? ""),
      email: String(item.email ?? ""),
      active: Boolean(item.active),
      accessRole: String(item.user_access_role ?? item.role ?? "Viewer")
    })),
    vendors: row<Record<string, unknown>[]>(vendors.data ?? []).map((item) => ({
      id: String(item.id),
      company: String(item.company_name ?? ""),
      pic: String(item.pic_name ?? ""),
      position: String(item.pic_position ?? ""),
      whatsapp: String(item.whatsapp ?? ""),
      email: String(item.email ?? ""),
      packageName: String(item.sponsor_package ?? "Custom") as Vendor["packageName"],
      packagePrice: Number(item.package_price ?? 0),
      boothNumber: String(item.booth_number ?? ""),
      boothSize: String(item.booth_size ?? ""),
      speakerSlot: Boolean(item.speaker_slot),
      speakerName: String(item.speaker_name ?? ""),
      handler: "",
      registeredBy: "",
      receivedBy: "",
      dpDeadline: String(item.dp_deadline ?? ""),
      finalDeadline: String(item.final_payment_deadline ?? ""),
      status: toUiVendorStatus(item.status),
      notes: String(item.notes ?? ""),
      price: Number(item.package_price ?? 0)
    })),
    participants: row<Record<string, unknown>[]>(participants.data ?? []).map((item) => ({
      id: String(item.id),
      fullName: String(item.full_name ?? ""),
      title: String(item.title_degree ?? ""),
      institution: String(item.institution ?? ""),
      whatsapp: String(item.whatsapp ?? ""),
      email: String(item.email ?? ""),
      category: String(item.participant_category ?? ""),
      perdestiMember: Boolean(item.perdesti_member),
      symposium: Boolean(item.symposium),
      workshop: Boolean(item.workshop),
      workshopType: String(item.workshop_type ?? ""),
      pricingType: String(item.pricing_type ?? ""),
      paymentStatus: String(item.payment_status ?? ""),
      badgeStatus: String(item.badge_status ?? ""),
      certificateStatus: String(item.certificate_status ?? ""),
      attendanceStatus: String(item.attendance_status ?? ""),
      groupReference: String(item.group_registration_id ?? "")
    })),
    booths: row<Record<string, unknown>[]>(booths.data ?? []).map((item) => ({
      id: String(item.id),
      number: String(item.booth_number ?? ""),
      size: String(item.booth_size ?? ""),
      area: String(item.area_location ?? ""),
      status: String(item.status ?? "Available") as Booth["status"],
      vendorId: String(item.assigned_vendor_id ?? "") || undefined,
      holdExpiry: String(item.hold_expiry_date ?? "") || undefined,
      electricityNote: String(item.electricity_note ?? ""),
      electricity: String(item.electricity_note ?? "")
    })),
    benefits: row<Record<string, unknown>[]>(benefits.data ?? []).map((item) => ({
      id: String(item.id),
      vendorId: String(item.vendor_id ?? ""),
      name: String(item.benefit_name ?? ""),
      description: String(item.description ?? ""),
      quantity: Number(item.quantity ?? 1),
      dueDate: String(item.due_date ?? ""),
      responsible: "",
      status: String(item.status ?? "Pending") as VendorBenefit["status"],
      notes: String(item.notes ?? "")
    })),
    files: row<Record<string, unknown>[]>(files.data ?? []).map((item) => ({
      id: String(item.id),
      vendorId: String(item.vendor_id ?? ""),
      name: String(item.requirement_name ?? ""),
      required: Boolean(item.required),
      uploaded: Boolean(item.file_uploaded),
      dueDate: String(item.due_date ?? ""),
      status: String(item.status ?? "Missing") as FileRequirement["status"],
      reviewedBy: String(item.reviewed_by ?? ""),
      notes: String(item.notes ?? "")
    })),
    invoices: row<Record<string, unknown>[]>(invoices.data ?? []).map((item) => {
      const items = invoiceItemRows.filter((invoiceItem) => invoiceItem.invoice_id === item.id);
      return {
        id: String(item.id),
        number: String(item.invoice_number ?? ""),
        type: String(item.invoice_type ?? ""),
        targetType: String(item.invoice_type ?? "") as Invoice["targetType"],
        targetName: String(item.bill_to ?? ""),
        paymentStatus: "Unpaid",
        verificationStatus: "No Payment",
        billTo: String(item.bill_to ?? ""),
        picContact: String(item.pic_contact ?? ""),
        invoiceDate: String(item.invoice_date ?? ""),
        dueDate: String(item.due_date ?? ""),
        items: items.length ? items.map((invoiceItem) => ({ description: String(invoiceItem.item_description ?? ""), qty: Number(invoiceItem.qty ?? 1), unitPrice: Number(invoiceItem.unit_price ?? 0), discount: Number(invoiceItem.discount ?? 0) })) : [{ description: "Invoice item", qty: 1, unitPrice: 0, discount: 0 }],
        dpPaid: Number(item.dp_paid ?? 0),
        lastPaymentDate: String(item.last_payment_date ?? ""),
        status: (String(item.status ?? "Draft") === "Cancelled" ? "Cancelled" : String(item.status ?? "Draft") === "Sent" ? "Sent" : "Draft") as Invoice["status"],
        registeredBy: "",
        receivedBy: "",
        handledBy: "",
        notes: String(item.notes ?? ""),
        vendorId: String(item.vendor_id ?? "") || undefined
      };
    }),
    payments: row<Record<string, unknown>[]>(payments.data ?? []).map((item) => ({
      id: String(item.id),
      invoiceId: String(item.invoice_id ?? ""),
      date: String(item.payment_date ?? ""),
      amount: Number(item.amount ?? 0),
      method: String(item.payment_method ?? ""),
      receivingBank: String(item.receiving_bank ?? ""),
      senderName: String(item.sender_name ?? ""),
      receivedBy: "",
      verifiedBy: String(item.verified_by ?? ""),
      verificationStatus: String(item.verification_status ?? "Pending") as Payment["verificationStatus"],
      notes: String(item.notes ?? "")
    })),
    documents: row<Record<string, unknown>[]>(documents.data ?? []).map((item) => ({
      id: String(item.id),
      name: String(item.document_name ?? ""),
      type: String(item.document_type ?? ""),
      relatedName: "",
      status: String(item.status ?? "Uploaded"),
      createdAt: String(item.created_at ?? item.uploaded_date ?? ""),
      notes: String(item.notes ?? ""),
      storagePath: String(item.file_path ?? ""),
      publicUrl: String(item.public_url ?? "")
    })),
    logs: row<Record<string, unknown>[]>(logs.data ?? []).map((item) => ({
      id: String(item.id),
      user: "",
      action: String(item.action_type ?? ""),
      entityType: String(item.entity_type ?? ""),
      entityName: String(item.entity_name ?? ""),
      timestamp: String(item.created_at ?? ""),
      notes: String(item.notes ?? "")
    }))
  };
}

async function ensureEventId(event: EventSettings) {
  if (!supabase) throw new Error("Supabase client is not configured.");
  if (isUuid(event.id)) return event.id;
  const { data, error } = await supabase.from("events").insert({
    event_name: event.name,
    event_year: event.year,
    full_title: event.fullTitle,
    date_range: event.dateRange,
    bank_account: event.bankAccount,
    contact_person: event.contactPerson,
    invoice_prefix: event.invoicePrefix,
    receipt_prefix: event.receiptPrefix,
    agreement_prefix: event.agreementPrefix,
    footer_disclaimer: event.footerDisclaimer,
    default_payment_terms: event.defaultTerms,
    default_dp_percentage: event.defaultDpPercentage,
    default_final_payment_deadline: event.finalPaymentDeadline
  }).select("id").single();
  if (error) throw error;
  return String(data.id);
}

export async function upsertSupabaseRecord(key: string, record: Record<string, unknown>, event: EventSettings) {
  if (!supabase) return record;
  const eventId = await ensureEventId(event);
  const id = isUuid(String(record.id ?? "")) ? String(record.id) : undefined;
  if (key === "vendors") {
    const payload = {
      ...(id ? { id } : {}),
      event_id: eventId,
      company_name: record.company,
      pic_name: record.pic,
      pic_position: record.position,
      whatsapp: record.whatsapp,
      email: record.email,
      sponsor_package: record.packageName,
      package_price: record.packagePrice,
      booth_number: record.boothNumber,
      booth_size: record.boothSize,
      speaker_slot: record.speakerSlot,
      dp_deadline: record.dpDeadline || null,
      final_payment_deadline: record.finalDeadline || null,
      status: toDbVendorStatus(record.status),
      notes: record.notes
    };
    const { data, error } = await supabase.from("vendors").upsert(payload).select("id").single();
    if (error) throw error;
    return { ...record, id: String(data.id), demo: false };
  }
  if (key === "participants") {
    const payload = {
      ...(id ? { id } : {}),
      event_id: eventId,
      full_name: record.fullName,
      title_degree: record.title,
      institution: record.institution,
      whatsapp: record.whatsapp,
      email: record.email,
      participant_category: record.category,
      perdesti_member: record.perdestiMember,
      symposium: record.symposium,
      workshop: record.workshop,
      workshop_type: record.workshopType,
      pricing_type: record.pricingType,
      payment_status: record.paymentStatus,
      badge_status: record.badgeStatus,
      certificate_status: record.certificateStatus,
      attendance_status: record.attendanceStatus
    };
    const { data, error } = await supabase.from("participants").upsert(payload).select("id").single();
    if (error) throw error;
    return { ...record, id: String(data.id), demo: false };
  }
  if (key === "booths") {
    const payload = {
      ...(id ? { id } : {}),
      event_id: eventId,
      booth_number: record.number,
      booth_size: record.size,
      area_location: record.area,
      status: record.status,
      assigned_vendor_id: isUuid(String(record.vendorId ?? "")) ? record.vendorId : null,
      hold_expiry_date: record.holdExpiry || null,
      electricity_note: record.electricityNote
    };
    const { data, error } = await supabase.from("booths").upsert(payload).select("id").single();
    if (error) throw error;
    return { ...record, id: String(data.id), demo: false };
  }
  if (key === "invoices") {
    const payload = {
      ...(id ? { id } : {}),
      event_id: eventId,
      invoice_number: record.number,
      invoice_type: record.targetType ?? record.type,
      vendor_id: isUuid(String(record.vendorId ?? "")) ? record.vendorId : null,
      bill_to: record.billTo,
      pic_contact: record.picContact,
      invoice_date: record.invoiceDate,
      due_date: record.dueDate || null,
      dp_paid: record.dpPaid ?? 0,
      notes: record.notes,
      status: record.status
    };
    const { data, error } = await supabase.from("invoices").upsert(payload).select("id").single();
    if (error) throw error;
    const invoiceId = String(data.id);
    await supabase.from("invoice_items").delete().eq("invoice_id", invoiceId);
    const items = (record.items as Array<{ description: string; qty: number; unitPrice: number; discount: number }> | undefined) ?? [];
    if (items.length) {
      const { error: itemError } = await supabase.from("invoice_items").insert(items.map((item) => ({
        event_id: eventId,
        invoice_id: invoiceId,
        item_description: item.description,
        qty: item.qty,
        unit_price: item.unitPrice,
        discount: item.discount
      })));
      if (itemError) throw itemError;
    }
    return { ...record, id: invoiceId, demo: false };
  }
  if (key === "payments") {
    const payload = {
      ...(id ? { id } : {}),
      event_id: eventId,
      invoice_id: isUuid(String(record.invoiceId ?? "")) ? record.invoiceId : null,
      payment_date: record.date,
      amount: record.amount,
      payment_method: record.method,
      receiving_bank: record.receivingBank,
      sender_name: record.senderName,
      verification_status: record.verificationStatus,
      notes: record.notes
    };
    const { data, error } = await supabase.from("payments").upsert(payload).select("id").single();
    if (error) throw error;
    return { ...record, id: String(data.id), demo: false };
  }
  return record;
}

export async function deleteSupabaseRecord(key: string, id: string) {
  if (!supabase || !isUuid(id)) return;
  const table = {
    vendors: "vendors",
    participants: "participants",
    booths: "booths",
    invoices: "invoices",
    payments: "payments"
  }[key as "vendors" | "participants" | "booths" | "invoices" | "payments"];
  if (!table) return;
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

export async function clearSupabaseDemoRecords() {
  if (!supabase) return;
  await Promise.all([
    supabase.from("vendors").delete().ilike("company_name", "%Dermavita%"),
    supabase.from("vendors").delete().ilike("company_name", "%Aesthetic Nusantara%"),
    supabase.from("vendors").delete().ilike("company_name", "%SkinLab%"),
    supabase.from("participants").delete().in("email", ["annisa@example.com", "kevin@example.com", "nadia@example.com"]),
    supabase.from("documents").delete().ilike("document_name", "%Demo%")
  ]);
}
