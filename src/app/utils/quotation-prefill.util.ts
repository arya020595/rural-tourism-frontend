import { firstValueFrom } from 'rxjs';
import { BookingDetail } from '../booking-home/booking-home.models';
import { QuotationConvertMode } from '../quotation/quotation.models';
import { QuotationService } from '../services/quotation.service';
import { mapBookingToDetail } from './booking-detail.mapper';

/** A quotation being converted, as the Add Booking / E-Receipt pages use it. */
export interface QuotationPrefill {
  quotationId: number;
  quotationNo: string;
  bookingType: 'activity' | 'accommodation' | 'package';
  /** Fills the booking form in add mode (deposit left empty; operator name = Prepared By). */
  prefill: BookingDetail;
}

/**
 * Loads GET /api/quotations/:id/booking-draft and maps it like a saved
 * booking. Needs the network; the booking itself is then submitted through the
 * normal offline queue with quotation_id.
 */
export async function loadQuotationPrefill(
  quotationService: QuotationService,
  quotationId: number,
  mode: QuotationConvertMode,
): Promise<QuotationPrefill> {
  const draft = await firstValueFrom(quotationService.getBookingDraft(quotationId, mode));
  const prefill = mapBookingToDetail(draft);
  prefill.id = undefined;
  prefill.totalDeposit = undefined;
  return {
    quotationId: Number(draft.quotation_id),
    quotationNo: String(draft.quotation_no || ''),
    bookingType: draft.booking_type,
    prefill,
  };
}
