import { startOfISOWeek, endOfISOWeek, addWeeks, parseISO, getISOWeek } from 'date-fns';

/**
 * Get start and end dates for an ISO 8601 week
 * @param year - Year (e.g., 2026)
 * @param week - ISO week number (1-52 or 1-53)
 * @returns Object with start (Monday) and end (Sunday) dates
 */
export function getISOWeekDates(year: number, week: number): { start: Date; end: Date } {
  // Get first day of the year
  const firstDayOfYear = parseISO(`${year}-01-01`);
  
  // Find the start of the first ISO week (may be in previous year)
  const firstISOWeekStart = startOfISOWeek(firstDayOfYear);
  
  // Calculate the start of the desired week
  const desiredWeekStart = addWeeks(firstISOWeekStart, week - 1);
  
  // Calculate the end of the desired week (Sunday)
  const desiredWeekEnd = endOfISOWeek(desiredWeekStart);
  
  return { start: desiredWeekStart, end: desiredWeekEnd };
}

/**
 * Get ISO week number from a date
 * @param date - Date object
 * @returns ISO week number (1-52 or 1-53)
 */
export function getISOWeekNumber(date: Date): number {
  return getISOWeek(date);
}

/**
 * Validate if a week number is valid for a given year
 * @param year - Year to check
 * @param week - Week number to validate
 * @returns true if week is valid (1-52 or 1-53 depending on year)
 */
export function isValidISOWeek(year: number, week: number): boolean {
  const maxWeeks = getISOWeek(parseISO(`${year}-12-31`));
  return week >= 1 && week <= maxWeeks;
}
