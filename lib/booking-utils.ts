// Utility functions for booking status and date management

import { Item } from "./database";

/**
 * Check if an item has any booked dates
 */
export function isItemBooked(item: Item | any): boolean {
  return item.bookedDates && Array.isArray(item.bookedDates) && item.bookedDates.length > 0;
}

/**
 * Get the count of booked dates for an item
 */
export function getBookedDatesCount(item: Item | any): number {
  return item.bookedDates ? item.bookedDates.length : 0;
}

/**
 * Format booking status for display
 */
export function getBookingStatusText(item: Item | any): string {
  const count = getBookedDatesCount(item);
  return count > 0 ? `BOOKED (${count} date${count > 1 ? 's' : ''})` : '';
}

/**
 * Get formatted booked dates for display
 */
export function getFormattedBookedDates(item: Item | any): string[] {
  if (!item.bookedDates || !Array.isArray(item.bookedDates)) {
    return [];
  }
  
  return item.bookedDates
    .map((date: string) => {
      try {
        return new Date(date).toLocaleDateString('en-IN', {
          weekday: 'short',
          year: 'numeric',
          month: 'short', 
          day: 'numeric'
        });
      } catch {
        return date; // Return original if parsing fails
      }
    })
    .sort();
}

/**
 * Check if a specific date is booked
 */
export function isDateBooked(item: Item | any, date: string): boolean {
  return item.bookedDates ? item.bookedDates.includes(date) : false;
}
