/**
 * Money inputs (RM): digits with at most one decimal point and 2 decimals,
 * e.g. "3.50". Used for Total, Deposit and package item prices.
 */

/** Strip anything that isn't a valid RM amount-in-progress. */
export function sanitizeMoney(raw: string | null | undefined): string {
  let value = String(raw ?? '').replace(/[^\d.]/g, '');
  const firstDot = value.indexOf('.');
  if (firstDot === -1) return value;

  const whole = value.slice(0, firstDot);
  const decimals = value.slice(firstDot + 1).replace(/\./g, '').slice(0, 2);
  value = `${whole || '0'}.${decimals}`;
  return value;
}

/** Show an amount with exactly 2 decimals ("300.5" -> "300.50"); '' if empty. */
export function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : '';
}

const CONTROL_KEYS = [
  'Backspace',
  'Delete',
  'ArrowLeft',
  'ArrowRight',
  'Tab',
  'Home',
  'End',
];

/** Keydown guard: allow digits, one '.', editing keys and copy/paste shortcuts. */
export function blockNonMoneyKey(event: KeyboardEvent): void {
  const isShortcut =
    (event.ctrlKey || event.metaKey) &&
    ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase());
  if (CONTROL_KEYS.includes(event.key) || isShortcut) return;

  if (/^\d$/.test(event.key)) return;

  const current = (event.target as HTMLInputElement | null)?.value ?? '';
  if (event.key === '.' && !current.includes('.')) return;

  event.preventDefault();
}
