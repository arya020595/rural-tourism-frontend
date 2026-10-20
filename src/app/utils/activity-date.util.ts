/**
 * activity_date is the Malaysia date/time the operator picked, stored by the
 * backend "as typed" in the UTC fields (e.g. 4 Jan 6:54 PM is
 * "2026-01-04T18:54:00.000Z"). Read the date and time straight from the
 * string — `new Date(...)` would convert it to Malaysia time and move evening
 * bookings to the next day.
 */

/** YYYY-MM-DD of an activity_date, or '' if it has none. */
export function activityDateKey(value: unknown): string {
  const match = String(value ?? '').trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

/**
 * HH:mm of an activity_date, or undefined when there is no time (midnight
 * means "no time picked"). A bare "14:30" is returned as-is.
 */
export function activityTime(value: unknown): string | undefined {
  const raw = String(value ?? '').trim();
  const match = raw.match(/[T\s](\d{2}):(\d{2})/);
  if (match) {
    const [, hours, minutes] = match;
    return hours === '00' && minutes === '00' ? undefined : `${hours}:${minutes}`;
  }
  const timeOnly = raw.match(/^(\d{1,2}):(\d{2})/);
  return timeOnly ? `${timeOnly[1].padStart(2, '0')}:${timeOnly[2]}` : undefined;
}
