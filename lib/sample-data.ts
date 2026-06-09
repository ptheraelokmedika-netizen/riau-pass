import type {
  ActivityLog,
  Booth,
  CommitteeMember,
  EventSettings,
  FileRequirement,
  Invoice,
  Participant,
  Payment,
  Vendor,
  VendorBenefit
} from "./types";

export const eventSettings: EventSettings = {
  id: "pass-riau-2026",
  name: "PASS RIAU 2026",
  year: 2026,
  fullTitle: "The First Riau PERDESTI Aesthetic Summit & Symposium 2026",
  dateRange: "14-16 Agustus 2026",
  symposium: "Symposium & Exhibition: 14-15 Agustus 2026, Hotel Grand Elite Pekanbaru",
  workshop: "Workshop: 16 Agustus 2026, Universitas Abdurrab",
  exhibition: "Exhibition: 14-15 Agustus 2026, Hotel Grand Elite Pekanbaru",
  bankAccount: "BANK BNI 2056245056 a/n ISAM PERDESTI CABANG RIAU",
  contactPerson: "dr. Moriza Lesmana, M.Biomed (AAM)",
  email: "sekretariat@passriau.id",
  instagram: "@passriau",
  secretariat: "Sekretariat PERDESTI Riau, Pekanbaru",
  invoicePrefix: "INV/PASS-RIAU/2026",
  receiptPrefix: "RCT/PASS-RIAU/2026",
  agreementPrefix: "SPK/PASS-RIAU/2026",
  footerDisclaimer: "Dokumen ini sah diterbitkan oleh Panitia PASS RIAU dan digunakan untuk kebutuhan administrasi acara.",
  defaultTerms: "DP minimal 50% saat konfirmasi. Pelunasan paling lambat 30 Juli 2026.",
  defaultDpPercentage: 50,
  finalPaymentDeadline: "2026-07-30",
  logos: [
    { name: "PASS RIAU", purpose: "Main event logo", showOnInvoice: true, showOnReceipt: true, showOnAgreement: true, order: 1, size: "large" },
    { name: "PERDESTI", purpose: "Organization logo", showOnInvoice: true, showOnReceipt: true, showOnAgreement: true, order: 2, size: "medium" },
    { name: "Kemenkes", purpose: "Partner logo", showOnInvoice: true, showOnReceipt: true, showOnAgreement: true, order: 3, size: "medium" },
    { name: "Universitas Abdurrab", purpose: "Workshop partner", showOnInvoice: false, showOnReceipt: true, showOnAgreement: true, order: 4, size: "medium" },
    { name: "Partner Sponsor", purpose: "Additional placeholder", showOnInvoice: false, showOnReceipt: false, showOnAgreement: true, order: 5, size: "small" }
  ]
};

eventSettings.title = eventSettings.fullTitle;
eventSettings.bank = eventSettings.bankAccount;
eventSettings.contact = eventSettings.contactPerson;
eventSettings.dpPercentage = eventSettings.defaultDpPercentage;
eventSettings.finalDeadline = eventSettings.finalPaymentDeadline;
eventSettings.disclaimer = eventSettings.footerDisclaimer;
eventSettings.paymentTerms = eventSettings.defaultTerms;
eventSettings.stampLabel = "Stempel Resmi PERDESTI / PASS";
eventSettings.showStampOnInvoice = true;
eventSettings.showStampOnReceipt = true;
eventSettings.showStampOnAgreement = true;
eventSettings.showStampOnFormalDocuments = true;
eventSettings.promoName = "5 Peserta Dokter Free 1";
eventSettings.promoType = "Group Registration";
eventSettings.promoStartDate = "2026-01-01";
eventSettings.promoEndDate = "2026-06-30";
eventSettings.promoCategories = "Member PERDESTI, Non-member PERDESTI, Dokter Umum";
eventSettings.promoMinimumPaidCount = 5;
eventSettings.promoFreeCount = 1;
eventSettings.promoActive = true;
eventSettings.promoNotes = "Promo group registration 5 peserta dokter berbayar mendapatkan 1 peserta free. Berlaku hingga 30 Juni 2026.";

export const committeeMembers: CommitteeMember[] = [
  { id: "cm-1", name: "dr. Maya Pratiwi, Sp.D.V.E", role: "Ketua Panitia", whatsapp: "081276540001", email: "maya@passriau.id", active: true, accessRole: "Owner" },
  { id: "cm-2", name: "dr. Moriza Lesmana, M.Biomed (AAM)", role: "Finance/Bendahara", whatsapp: "081276540002", email: "finance@passriau.id", active: true, accessRole: "Finance/Bendahara" },
  { id: "cm-3", name: "Rina Anggraini", role: "Sponsorship", whatsapp: "081276540003", email: "sponsor@passriau.id", active: true, accessRole: "Sponsorship" },
  { id: "cm-4", name: "Fahri Ramadhan", role: "Registration", whatsapp: "081276540004", email: "registrasi@passriau.id", active: true, accessRole: "Registration" },
  { id: "cm-5", name: "Dewi Lestari", role: "Booth Manager", whatsapp: "081276540005", email: "booth@passriau.id", active: true, accessRole: "Booth Manager" }
];

export const vendors: Vendor[] = [
  {
    id: "ven-1",
    company: "PT Dermavita Estetika",
    pic: "Andini Putri",
    position: "Marketing Manager",
    whatsapp: "081234567001",
    email: "andini@dermavita.co.id",
    packageName: "Platinum",
    packagePrice: 75000000,
    boothNumber: "A01-A02",
    boothSize: "6 x 2 m",
    speakerSlot: true,
    speakerName: "dr. Reza Ardiansyah",
    handler: "Rina Anggraini",
    registeredBy: "Rina Anggraini",
    receivedBy: "dr. Moriza Lesmana, M.Biomed (AAM)",
    dpDeadline: "2026-06-30",
    finalDeadline: "2026-07-30",
    status: "Partially Paid",
    notes: "Menunggu materi pembicara dan final artwork booth."
  },
  {
    id: "ven-2",
    company: "CV Aesthetic Nusantara",
    pic: "Budi Santoso",
    position: "Sales Lead",
    whatsapp: "081234567002",
    email: "budi@aestheticnusantara.id",
    packageName: "Gold",
    packagePrice: 50000000,
    boothNumber: "B03",
    boothSize: "3 x 2 m",
    speakerSlot: true,
    handler: "Rina Anggraini",
    registeredBy: "Rina Anggraini",
    receivedBy: "dr. Moriza Lesmana, M.Biomed (AAM)",
    dpDeadline: "2026-06-25",
    finalDeadline: "2026-07-30",
    status: "Booked",
    notes: "Invoice sudah dikirim, follow-up DP minggu ini."
  },
  {
    id: "ven-3",
    company: "PT Klinik SkinLab",
    pic: "Clara Wijaya",
    position: "Partnership Officer",
    whatsapp: "081234567003",
    email: "clara@skinlab.id",
    packageName: "Silver",
    packagePrice: 30000000,
    boothNumber: "C01",
    boothSize: "3 x 2 m",
    speakerSlot: false,
    handler: "Rina Anggraini",
    registeredBy: "Rina Anggraini",
    receivedBy: "dr. Moriza Lesmana, M.Biomed (AAM)",
    dpDeadline: "2026-07-05",
    finalDeadline: "2026-07-30",
    status: "Fully Paid",
    notes: "File lengkap dan booth sudah dikunci."
  }
];

vendors.forEach((vendor) => {
  vendor.price = vendor.packagePrice;
});

export const booths: Booth[] = [
  { id: "booth-1", number: "A01-A02", size: "6 x 2 m", area: "Ballroom Utama", status: "DP Paid", vendorId: "ven-1", electricityNote: "450W + request tambahan" },
  { id: "booth-2", number: "B03", size: "3 x 2 m", area: "Foyer", status: "Booked", vendorId: "ven-2", holdExpiry: "2026-06-25", electricityNote: "450W" },
  { id: "booth-3", number: "C01", size: "3 x 2 m", area: "Foyer", status: "Paid", vendorId: "ven-3", electricityNote: "450W" },
  { id: "booth-4", number: "C02", size: "3 x 2 m", area: "Foyer", status: "Available", electricityNote: "450W" },
  { id: "booth-5", number: "D01", size: "3 x 2 m", area: "Koridor Workshop", status: "Hold", holdExpiry: "2026-06-20", electricityNote: "450W" }
];

booths.forEach((booth) => {
  booth.electricity = booth.electricityNote;
});

export const vendorBenefits: VendorBenefit[] = [
  { id: "ben-1", vendorId: "ven-1", name: "Booth Exhibition 6 x 2 m", description: "Area booth platinum di ballroom utama", quantity: 1, dueDate: "2026-08-13", responsible: "Dewi Lestari", status: "Completed", notes: "Nomor booth A01-A02" },
  { id: "ben-2", vendorId: "ven-1", name: "Speaker slot 20 menit", description: "Sesi simposium untuk sponsor platinum", quantity: 1, dueDate: "2026-07-20", responsible: "Rina Anggraini", status: "In Progress", notes: "Menunggu topik final" },
  { id: "ben-3", vendorId: "ven-2", name: "Brochure in kit", description: "Brosur dimasukkan ke seminar kit", quantity: 300, dueDate: "2026-08-01", responsible: "Documentation", status: "Pending", notes: "Belum dikirim" },
  { id: "ben-4", vendorId: "ven-3", name: "Video promotion 60 seconds", description: "Ditayangkan saat jeda sesi", quantity: 1, dueDate: "2026-07-25", responsible: "Documentation", status: "Completed", notes: "File approved" }
];

export const fileRequirements: FileRequirement[] = [
  { id: "file-1", vendorId: "ven-1", name: "Company logo", required: true, uploaded: true, dueDate: "2026-06-20", status: "Approved", reviewedBy: "Rina Anggraini", notes: "Logo PNG high-res" },
  { id: "file-2", vendorId: "ven-1", name: "Speaker material", required: true, uploaded: false, dueDate: "2026-07-20", status: "Missing", notes: "Butuh follow-up" },
  { id: "file-3", vendorId: "ven-2", name: "Payment proof", required: true, uploaded: false, dueDate: "2026-06-25", status: "Missing", notes: "Menunggu DP" },
  { id: "file-4", vendorId: "ven-2", name: "Brochure for kit", required: true, uploaded: true, dueDate: "2026-08-01", status: "Under Review", reviewedBy: "Rina Anggraini", notes: "Cek ukuran file" },
  { id: "file-5", vendorId: "ven-3", name: "Signed sponsor agreement", required: true, uploaded: true, dueDate: "2026-07-15", status: "Approved", reviewedBy: "dr. Moriza Lesmana, M.Biomed (AAM)", notes: "Sudah arsip" }
];

export const participants: Participant[] = [
  { id: "par-1", fullName: "dr. Annisa Putri", title: "dr.", institution: "RS Awal Bros", whatsapp: "081300001001", email: "annisa@example.com", category: "Member PERDESTI", perdestiMember: true, symposium: true, workshop: true, workshopType: "Hands-on Filler", pricingType: "Early bird", paymentStatus: "Sudah Lunas", badgeStatus: "Belum Cetak", certificateStatus: "Belum Terbit", attendanceStatus: "Belum Hadir" },
  { id: "par-2", fullName: "dr. Kevin Hartono", title: "dr.", institution: "Klinik Pekanbaru Skin", whatsapp: "081300001002", email: "kevin@example.com", category: "Dokter Umum", perdestiMember: false, symposium: true, workshop: false, workshopType: "-", pricingType: "Regular", paymentStatus: "Belum Lunas", badgeStatus: "Belum Cetak", certificateStatus: "Belum Terbit", attendanceStatus: "Belum Hadir" },
  { id: "par-3", fullName: "Nadia Salsabila", title: "Koas", institution: "Universitas Abdurrab", whatsapp: "081300001003", email: "nadia@example.com", category: "Internship / Koas / Mahasiswa", perdestiMember: false, symposium: true, workshop: false, workshopType: "-", pricingType: "Group", paymentStatus: "DP Paid", badgeStatus: "Belum Cetak", certificateStatus: "Belum Terbit", attendanceStatus: "Belum Hadir" }
];

participants.forEach((participant, index) => {
  if (participant.pricingType === "Group") {
    participant.groupReference = "GRP-PASS-2026-001";
    participant.promoRole = index === 2 ? "Free" : "Paid";
  }
});

export const invoices: Invoice[] = [
  {
    id: "inv-1",
    number: "INV/PASS-RIAU/2026/001",
    type: "Vendor sponsorship",
    billTo: "PT Dermavita Estetika",
    picContact: "Andini Putri",
    invoiceDate: "2026-06-10",
    dueDate: "2026-07-30",
    items: [{ description: "Paket Sponsor Platinum PASS RIAU 2026", qty: 1, unitPrice: 75000000, discount: 0 }],
    dpPaid: 37500000,
    lastPaymentDate: "2026-06-18",
    status: "Partially Paid",
    registeredBy: "Rina Anggraini",
    receivedBy: "dr. Moriza Lesmana, M.Biomed (AAM)",
    handledBy: "Rina Anggraini",
    notes: "Termasuk booth A01-A02 dan benefit platinum.",
    vendorId: "ven-1"
  },
  {
    id: "inv-2",
    number: "INV/PASS-RIAU/2026/002",
    type: "Vendor sponsorship",
    billTo: "CV Aesthetic Nusantara",
    picContact: "Budi Santoso",
    invoiceDate: "2026-06-12",
    dueDate: "2026-06-25",
    items: [{ description: "Paket Sponsor Gold PASS RIAU 2026", qty: 1, unitPrice: 50000000, discount: 0 }],
    dpPaid: 0,
    status: "Sent",
    registeredBy: "Rina Anggraini",
    receivedBy: "dr. Moriza Lesmana, M.Biomed (AAM)",
    handledBy: "Rina Anggraini",
    notes: "Follow-up bukti DP.",
    vendorId: "ven-2"
  }
];

invoices.forEach((invoice) => {
  invoice.date = invoice.invoiceDate;
  invoice.contact = invoice.picContact;
  invoice.benefits = vendorBenefits.filter((benefit) => benefit.vendorId === invoice.vendorId).map((benefit) => benefit.name);
});

export const payments: Payment[] = [
  { id: "pay-1", invoiceId: "inv-1", date: "2026-06-18", amount: 37500000, method: "Transfer Bank", receivingBank: "Bank Mandiri", senderName: "PT Dermavita Estetika", receivedBy: "dr. Moriza Lesmana, M.Biomed (AAM)", verifiedBy: "dr. Moriza Lesmana, M.Biomed (AAM)", verificationStatus: "Verified", notes: "DP 50%" },
  { id: "pay-2", invoiceId: "inv-2", date: "2026-06-20", amount: 25000000, method: "Transfer Bank", receivingBank: "Bank Mandiri", senderName: "CV Aesthetic Nusantara", receivedBy: "dr. Moriza Lesmana, M.Biomed (AAM)", verificationStatus: "Pending", notes: "Menunggu verifikasi bukti transfer" }
];

payments.forEach((payment) => {
  payment.sender = payment.senderName;
  payment.bank = payment.receivingBank;
  payment.targetType = "Vendor / Sponsor";
  payment.linkedEntityId = invoices.find((invoice) => invoice.id === payment.invoiceId)?.vendorId;
  payment.linkedEntityName = payment.senderName;
  payment.specialAgreement = payment.notes;
});

export const activityLogs: ActivityLog[] = [
  { id: "log-1", user: "Rina Anggraini", action: "Created vendor", entityType: "Vendor", entityName: "PT Dermavita Estetika", timestamp: "2026-06-10T09:00:00+07:00", notes: "Sponsor platinum masuk pipeline" },
  { id: "log-2", user: "dr. Moriza Lesmana, M.Biomed (AAM)", action: "Verified payment", entityType: "Payment", entityName: "INV/PASS-RIAU/2026/001", timestamp: "2026-06-18T15:20:00+07:00", notes: "DP terverifikasi" },
  { id: "log-3", user: "Dewi Lestari", action: "Assigned booth", entityType: "Booth", entityName: "A01-A02", timestamp: "2026-06-18T16:10:00+07:00", notes: "Booth platinum dikunci" }
];

export const sponsorPackages = [
  { name: "Silver", price: 30000000, benefits: ["Booth Exhibition 3 x 2 m", "Complimentary badge 1 pax", "Lunch & hospitality 1 pax", "Video promotion 60 seconds", "Electricity 450W"] },
  { name: "Gold", price: 50000000, benefits: ["Booth Exhibition 3 x 2 m", "Speaker slot 20 minutes", "Complimentary badge 2 pax", "Lunch & hospitality 2 pax", "Video promotion 60 seconds", "Brochure in kit", "Electricity 450W"] },
  { name: "Platinum", price: 75000000, benefits: ["Booth Exhibition 6 x 2 m", "Speaker slot 20 minutes", "Complimentary badge 3 pax", "Lunch & hospitality 3 pax", "Video promotion 60 seconds", "Brochure in kit", "Priority booth selection", "Electricity 450W"] }
];

export const logos = eventSettings.logos;
export const committee = committeeMembers;
export const benefits = vendorBenefits;
