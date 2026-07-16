const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidCalendarDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function relativeFrom(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return toDateInputValue(date);
}
