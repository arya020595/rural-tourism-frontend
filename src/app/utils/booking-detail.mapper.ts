import { BookingDetail } from '../booking-home/booking-home.models';

/**
 * A booking record from the API (GET /api/bookings/:id shape) as the booking
 * forms / detail page use it. Shared by booking-detail, booking-edit and the
 * quotation conversion (Convert to Booking / Receipt).
 */
export function mapBookingToDetail(record: any): BookingDetail {
  const bookingType = String(record?.booking_type || '').toLowerCase();
  const type =
    bookingType === 'accommodation'
      ? 'Accommodation'
      : bookingType === 'package'
        ? 'Package'
        : 'Activity';
  const numericIdValue = Number(
    record?.numeric_id ?? record?.numericId ?? record?.id ?? undefined,
  );

  return {
    id: String(record?.id || ''),
    numericId: Number.isFinite(numericIdValue) ? numericIdValue : undefined,
    displayId: String(
      record?.display_receipt_id ?? record?.legacy_receipt_id ?? record?.id ?? '',
    ),
    isLegacy: Boolean(record?.legacy_receipt_id),
    bookedDate: String(
      record?.activity_date ||
        record?.check_in_date ||
        record?.receipt_created_at ||
        record?.created_at ||
        record?.updated_at ||
        '',
    ).slice(0, 10),
    serviceName:
      type === 'Package'
        ? String(record?.product_name || 'Package')
        : String(record?.product_name || record?.serviceName || ''),
    type,
    status: String(
      record?.status || 'pending',
    ).toLowerCase() as BookingDetail['status'],
    time: formatBookingTime(
      record?.activity_time || record?.time || record?.activity_date,
    ),
    fullName: String(record?.tourist_full_name || ''),
    phone: String(
      record?.phone_number || record?.phone || record?.contact_phone || '',
    ),
    email: String(record?.email || record?.contact_email || ''),
    nationality:
      String(record?.citizenship || '').toLowerCase() === 'international'
        ? 'international'
        : String(record?.citizenship || '').toLowerCase() === 'both'
          ? 'both'
          : 'domestic',
    domesticPax: Number(record?.no_of_pax_domestik || 0),
    internationalPax: Number(record?.no_of_pax_antarbangsa || 0),
    totalAmount: Number(record?.total_price || 0),
    totalDeposit: Number(record?.total_deposit || 0),
    operatorName: String(record?.operator_name || ''),
    activityName:
      type === 'Activity' ? String(record?.product_name || '') : undefined,
    checkInDate:
      type === 'Accommodation'
        ? String(record?.check_in_date || '').slice(0, 10)
        : undefined,
    checkOutDate:
      type === 'Accommodation'
        ? String(record?.check_out_date || '').slice(0, 10)
        : undefined,
    nights:
      type === 'Accommodation'
        ? Number(record?.total_of_night || 0)
        : undefined,
    homestay:
      type === 'Accommodation'
        ? String(record?.product_name || '')
        : undefined,
    packageName:
      type === 'Package'
        ? String(record?.product_name || 'Package')
        : undefined,
    packagePrice:
      type === 'Package' ? Number(record?.total_price || 0) : undefined,
    customerType:
      String(record?.customer_type || record?.customerType || '')
        .toLowerCase()
        .trim() === 'company'
        ? 'company'
        : 'tourist',
    createdAt: record?.created_at || record?.createdAt,
    updatedAt: record?.updated_at || record?.updatedAt,
    package_companies: Array.isArray(record?.package_companies)
      ? record.package_companies
      : [],
    version:
      record?.version !== undefined ? Number(record.version) : undefined,
  };
}

function formatBookingTime(value: any): string | undefined {
  const raw = String(value || '').trim();
  if (!raw) {
    return undefined;
  }

  // Read the literal HH:MM from the string without timezone conversion.
  // The backend stores activity_date as a datetime; when no time was picked
  // it is midnight, and `new Date(...).getHours()` would shift it by the
  // local UTC offset (e.g. 00:00 UTC -> 08:00 in UTC+8). Parsing the raw
  // string avoids that and lets us treat midnight as "no time".
  const match = raw.match(/[T\s](\d{2}):(\d{2})/);
  if (match) {
    const [, hours, minutes] = match;
    if (hours === '00' && minutes === '00') {
      return undefined;
    }
    return `${hours}:${minutes}`;
  }

  // A bare time string (e.g. "14:30") came from a real activity_time field.
  const timeOnly = raw.match(/^(\d{1,2}):(\d{2})/);
  if (timeOnly) {
    return `${timeOnly[1].padStart(2, '0')}:${timeOnly[2]}`;
  }

  return undefined;
}
