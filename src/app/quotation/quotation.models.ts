/** Sebut Harga / Quotation — mirrors the backend quotation serializer. */

/** sent / cancelled are set by the operator; accepted when converted; expired is computed. */
export type QuotationStatus = 'sent' | 'accepted' | 'expired' | 'cancelled';
export type QuotationListFilter = 'all' | QuotationStatus;
export type QuotationProductType = 'activity' | 'accommodation';
export type QuotationConvertMode = 'booking' | 'receipt';

export interface QuotationItem {
  id?: number;
  sort_order?: number;
  product_type: QuotationProductType;
  company_id: number;
  company_name?: string | null;
  product_id: number | null;
  description?: string;
  amount: string | number;
  activity_date?: string | null;
  check_in_date?: string | null;
  check_out_date?: string | null;
  is_own?: boolean;
}

export interface Quotation {
  id: number;
  quotation_no: string;
  /** Effective status: an open quotation past valid_until is "expired". */
  status: QuotationStatus;
  stored_status: QuotationStatus;
  company_id: number;
  company_name?: string | null;
  customer_name: string;
  phone_number: string;
  email: string | null;
  citizenship: 'domestic' | 'international' | 'both';
  no_of_pax_domestik: number;
  no_of_pax_antarbangsa: number;
  total_pax: number;
  quotation_date: string;
  valid_until: string;
  days_left: number | null;
  notes?: string | null;
  total_amount: string;
  prepared_by_name: string | null;
  booking_id: number | null;
  booking_status: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  cancelled_at: string | null;
  can_edit: boolean;
  can_convert: boolean;
  can_convert_receipt: boolean;
  can_cancel: boolean;
  items?: QuotationItem[];
  created_at: string;
  updated_at: string;
}

export interface QuotationCounts {
  all: number;
  sent: number;
  accepted: number;
  expired: number;
  cancelled: number;
}

export interface QuotationListResponse {
  data: Quotation[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  counts: QuotationCounts;
}

/** Body of POST / PUT /api/quotations. */
export interface QuotationPayload {
  customer_name: string;
  phone_number: string;
  email: string;
  citizenship: string;
  no_of_pax_domestik: number;
  no_of_pax_antarbangsa: number;
  quotation_date: string;
  valid_until: string;
  notes: string;
  prepared_by_name: string;
  items: Array<{
    product_type: QuotationProductType;
    company_id: number;
    product_id: number;
    amount: number;
    activity_date?: string | null;
    check_in_date?: string | null;
    check_out_date?: string | null;
  }>;
}

/** Labels shared by the list chips and the status badge. */
export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  sent: 'Dihantar/Sent',
  accepted: 'Diterima/Accepted',
  expired: 'Tamat/Expired',
  cancelled: 'Dibatalkan/Cancelled',
};

/** Default notes & terms for a new quotation (editable per quotation). */
export const DEFAULT_QUOTATION_NOTES = [
  '1. Harga sah sehingga tarikh sah dan tertakluk kepada kekosongan. / Prices are valid until the valid-until date and subject to availability.',
  '2. Deposit tempahan tidak boleh dipulangkan. / Booking deposits are non-refundable.',
  '3. Penukaran tarikh dibenarkan sekali (1x) sahaja, sekurang-kurangnya 5 hari sebelum tarikh asal. / Date changes are allowed once (1x), at least 5 days before the original date.',
].join('\n');
