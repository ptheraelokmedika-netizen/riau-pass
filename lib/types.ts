export type StatusTone = "emerald" | "gold" | "blue" | "red" | "gray";

export type EventLogo = {
  id?: string;
  name: string;
  purpose: string;
  showOnInvoice: boolean;
  showOnReceipt: boolean;
  showOnAgreement: boolean;
  order: number;
  size: "small" | "medium" | "large";
  showOnFormalDocuments?: boolean;
  storagePath?: string;
  publicUrl?: string;
};

export type EventSettings = {
  id: string;
  name: string;
  year: number;
  fullTitle: string;
  dateRange: string;
  symposium: string;
  workshop: string;
  exhibition: string;
  bankAccount: string;
  contactPerson: string;
  email: string;
  instagram: string;
  secretariat: string;
  invoicePrefix: string;
  receiptPrefix: string;
  agreementPrefix: string;
  footerDisclaimer: string;
  defaultTerms: string;
  defaultDpPercentage: number;
  finalPaymentDeadline: string;
  logos: EventLogo[];
  title?: string;
  bank?: string;
  contact?: string;
  dpPercentage?: number;
  finalDeadline?: string;
  disclaimer?: string;
  paymentTerms?: string;
  stampLabel?: string;
  stampPath?: string;
  stampUrl?: string;
  signatureLabel?: string;
  signaturePath?: string;
  signatureUrl?: string;
  showStampOnInvoice?: boolean;
  showStampOnReceipt?: boolean;
  showStampOnAgreement?: boolean;
  showStampOnFormalDocuments?: boolean;
  promoName?: string;
  promoType?: string;
  promoStartDate?: string;
  promoEndDate?: string;
  promoCategories?: string;
  promoMinimumPaidCount?: number;
  promoFreeCount?: number;
  promoActive?: boolean;
  promoNotes?: string;
};

export type CommitteeMember = {
  id: string;
  name: string;
  role: string;
  whatsapp: string;
  email: string;
  active: boolean;
  accessRole: string;
};

export type Vendor = {
  id: string;
  company: string;
  pic: string;
  position: string;
  whatsapp: string;
  email: string;
  packageName: "Silver" | "Gold" | "Platinum" | "Custom";
  packagePrice: number;
  customPackage?: string;
  boothNumber: string;
  boothSize: string;
  speakerSlot: boolean;
  speakerName?: string;
  handler: string;
  registeredBy: string;
  receivedBy: string;
  dpDeadline: string;
  finalDeadline: string;
  status: "Lead" | "Booked" | "DP Paid" | "Partially Paid" | "Fully Paid" | "Cancelled";
  notes: string;
  price?: number;
};

export type Benefit = {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  quantity: number;
  dueDate: string;
  responsible: string;
  status: "Not Started" | "Pending" | "In Progress" | "Completed" | "Not Applicable";
  notes: string;
};

export type VendorBenefit = Benefit;

export type FileRequirement = {
  id: string;
  vendorId: string;
  name: string;
  required: boolean;
  uploaded: boolean;
  dueDate: string;
  status: "Missing" | "Submitted" | "Under Review" | "Approved" | "Rejected" | "Not Required";
  reviewedBy?: string;
  notes: string;
};

export type Participant = {
  id: string;
  fullName: string;
  title: string;
  institution: string;
  whatsapp: string;
  email: string;
  category: string;
  perdestiMember: boolean;
  symposium: boolean;
  workshop: boolean;
  workshopType: string;
  pricingType: string;
  paymentStatus: string;
  badgeStatus: string;
  certificateStatus: string;
  attendanceStatus: string;
  groupReference?: string;
  promoRole?: "Paid" | "Free";
  invoiceId?: string;
};

export type Booth = {
  id: string;
  number: string;
  size: string;
  area: string;
  status: "Available" | "Hold" | "Booked" | "DP Paid" | "Paid" | "Cancelled";
  vendorId?: string;
  holdExpiry?: string;
  electricityNote: string;
  electricity?: string;
};

export type Invoice = {
  id: string;
  number: string;
  type: string;
  targetType?: "Vendor / Sponsor" | "Participant" | "Group Registration" | "Symposium Only" | "Workshop Only" | "Booth Only" | "Custom / Other";
  paymentStatus?: "Unpaid" | "DP Paid" | "Partially Paid" | "Paid" | "Overdue";
  verificationStatus?: "No Payment" | "Pending Verification" | "Verified" | "Rejected";
  targetId?: string;
  targetName?: string;
  category?: string;
  registrationType?: string;
  pricePeriod?: string;
  promoDeduction?: number;
  specialNotes?: string;
  billTo: string;
  picContact: string;
  invoiceDate: string;
  dueDate: string;
  items: { description: string; qty: number; unitPrice: number; discount: number }[];
  dpPaid: number;
  lastPaymentDate?: string;
  status: "Draft" | "Sent" | "DP Paid" | "Partially Paid" | "Paid" | "Overdue" | "Cancelled";
  registeredBy: string;
  receivedBy: string;
  handledBy: string;
  notes: string;
  vendorId?: string;
  date?: string;
  contact?: string;
  benefits?: string[];
};

export type Payment = {
  id: string;
  invoiceId: string;
  date: string;
  amount: number;
  method: string;
  receivingBank: string;
  senderName: string;
  receivedBy: string;
  verifiedBy?: string;
  verificationStatus: "Pending" | "Verified" | "Rejected";
  notes: string;
  sender?: string;
  bank?: string;
  targetType?: "Vendor / Sponsor" | "Participant" | "Group Registration" | "Custom / Other";
  linkedEntityId?: string;
  linkedEntityName?: string;
  linkedAgreementId?: string;
  linkedBoothId?: string;
  specialAgreement?: string;
};

export type ActivityLog = {
  id: string;
  user: string;
  action: string;
  entityType: string;
  entityName: string;
  timestamp: string;
  notes: string;
};
