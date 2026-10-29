import { activityDateKey, activityTime } from './activity-date.util';

/**
 * Calendar days (YYYY-MM-DD) a package item occupies:
 * - activity item: its activity date (read "as typed", no timezone shift);
 * - accommodation item: every night of the stay, check-in inclusive and
 *   check-out exclusive (same as accommodation bookings); a stay without a
 *   check-out (or checking out the same day) marks the check-in day.
 * Items saved before item dates existed return [].
 */
export function packageItemDays(item: any): string[] {
  const activityDay = activityDateKey(item?.activity_date ?? item?.activityDate);
  const checkIn = activityDateKey(item?.check_in_date ?? item?.checkInDate);
  const checkOut = activityDateKey(item?.check_out_date ?? item?.checkOutDate);
  const type = String(item?.product_type ?? item?.productType ?? '').toLowerCase();

  if (type !== 'accommodation' && activityDay) {
    return [activityDay];
  }
  if (!checkIn) {
    return activityDay ? [activityDay] : [];
  }
  if (!checkOut || checkOut <= checkIn) {
    return [checkIn];
  }

  const days: string[] = [];
  // Walk the dates in UTC so no local timezone can shift a day.
  for (
    let t = Date.parse(`${checkIn}T00:00:00Z`);
    t < Date.parse(`${checkOut}T00:00:00Z`);
    t += 24 * 60 * 60 * 1000
  ) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}

/** All calendar days of a package's items, sorted, without repeats. */
export function packageDays(items: any[] | undefined | null): string[] {
  const days = new Set<string>();
  (Array.isArray(items) ? items : []).forEach((item) =>
    packageItemDays(item).forEach((day) => days.add(day)),
  );
  return [...days].sort();
}

/** "Aktiviti/Activity", "Penginapan/Accommodation" or "" (older items). */
export function packageItemTypeLabel(item: any): string {
  const type = String(item?.product_type ?? item?.productType ?? '').toLowerCase();
  if (type === 'activity') return 'Aktiviti/Activity';
  if (type === 'accommodation') return 'Penginapan/Accommodation';
  return '';
}

/**
 * When the customer comes, as on the receipt PDFs:
 *   activity      → { main: '29-10-2026, 03:23 PM', sub: '' }
 *   accommodation → { main: '31-10-2026 – 01-11-2026', sub: '1 malam/night' }
 *   no dates      → { main: '-', sub: '' }
 */
export function packageItemWhen(item: any): { main: string; sub: string } {
  const dmy = (key: string) => key.split('-').reverse().join('-');
  const type = String(item?.product_type ?? item?.productType ?? '').toLowerCase();
  const checkIn = activityDateKey(item?.check_in_date ?? item?.checkInDate);
  const checkOut = activityDateKey(item?.check_out_date ?? item?.checkOutDate);

  if (type === 'accommodation' || (!type && checkIn)) {
    if (!checkIn) return { main: '-', sub: '' };
    if (!checkOut) return { main: dmy(checkIn), sub: '' };
    const nights = Math.round(
      (Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86400000,
    );
    return {
      main: `${dmy(checkIn)} – ${dmy(checkOut)}`,
      sub: `${nights} malam/night${nights === 1 ? '' : 's'}`,
    };
  }

  const raw = item?.activity_date ?? item?.activityDate;
  const day = activityDateKey(raw);
  if (!day) return { main: '-', sub: '' };
  const time = activityTime(raw);
  let timeText = '';
  if (time) {
    const [h, m] = time.split(':').map(Number);
    timeText = `, ${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  }
  return { main: `${dmy(day)}${timeText}`, sub: '' };
}
