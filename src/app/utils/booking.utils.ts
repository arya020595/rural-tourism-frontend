/**
 * Booking Filter Utility
 * Single Responsibility: Filter and transform booking data
 * Open/Closed Principle: Easy to extend with new filter strategies
 */

export class BookingFilter {
  /**
   * Filter bookings by allowed statuses
   * @param bookings - Array of booking objects
   * @param allowedStatuses - Array of allowed status strings (default: ['booked'])
   */
  static filterByStatus(
    bookings: any[],
    allowedStatuses: string[] = ['booked'],
  ): any[] {
    return bookings.filter((booking) => {
      const status = (booking.status || '').trim().toLowerCase();
      return allowedStatuses.includes(status);
    });
  }

  /**
   * Exclude bookings with specific statuses
   * @param bookings - Array of booking objects
   * @param excludedStatuses - Array of statuses to exclude
   */
  static excludeStatuses(
    bookings: any[],
    excludedStatuses: string[] = ['paid', 'cancelled'],
  ): any[] {
    return bookings.filter((booking) => {
      const status = (booking.status || '').trim().toLowerCase();
      return !excludedStatuses.includes(status);
    });
  }

  /**
   * Get unpaid bookings (status: booked, pending)
   * Combines filtering logic for reusability
   */
  static getUnpaidBookings(bookings: any[]): any[] {
    const allowedStatuses = ['booked', 'pending'];
    const excludedStatuses = ['paid', 'cancelled', 'completed'];

    return bookings.filter((booking) => {
      const status = (booking.status || '').trim().toLowerCase();
      return (
        allowedStatuses.includes(status) && !excludedStatuses.includes(status)
      );
    });
  }
}

/**
 * Tourist Option Mapper
 * Single Responsibility: Transform booking data to tourist options
 * Interface Segregation: Only exposes necessary transformation logic
 */
export class TouristOptionMapper {
  /**
   * Map booking to tourist option format
   * @param booking - Raw booking object
   */
  static mapToOption(booking: any): any {
    return {
      user_id: booking.tourist_user_id,
      booking_id: booking.id,
      name: booking.contact_name || 'Unknown',
      activity_name: booking.activity_name || booking.activityName,
      activity_id: booking.activity_id || '',
      location: booking.location || '',
      date: booking.date || '',
      citizenship: booking.citizenship || booking.nationality || '',
      total_price: booking.total_price || '',
      operator_name: booking.operatorName || booking.operator_name || '',
      displayText: this.buildDisplayText(booking),
    };
  }

  /**
   * Build display text for dropdown
   * @param booking - Booking object
   */
  private static buildDisplayText(booking: any): string {
    const name = booking.contact_name || 'Unknown';
    const activity =
      booking.activity_name || booking.activityName || 'No Activity';
    const date = booking.date || '';
    return `${name} - ${activity} (${date})`;
  }

  /**
   * Map array of bookings to tourist options
   * @param bookings - Array of booking objects
   */
  static mapToOptions(bookings: any[]): any[] {
    return bookings.map((b) => this.mapToOption(b));
  }
}

/**
 * Accommodation Tourist Option Mapper
 * Single Responsibility: Transform accommodation booking data to tourist options
 * Interface Segregation: Only exposes necessary transformation logic
 */
export class AccommodationTouristOptionMapper {
  /**
   * Map accommodation booking to tourist option format
   * @param booking - Raw accommodation booking object
   */
  static mapToOption(booking: any): any {
    return {
      user_id: booking.tourist_user_id,
      booking_id: booking.id,
      name: booking.contact_name || 'Unknown',
      accommodation_name: booking.accommodation_name || 'Unknown',
      accommodation_id: booking.accommodation_id || '',
      check_in: booking.check_in || '',
      check_out: booking.check_out || '',
      total_no_of_nights: booking.total_no_of_nights || 1,
      no_of_pax: booking.no_of_pax || 1,
      location: booking.location || '',
      citizenship: booking.citizenship || booking.nationality || '',
      total_price: booking.total_price || '',
      operator_name: booking.operatorName || booking.operator_name || '',
      displayText: this.buildDisplayText(booking),
    };
  }

  /**
   * Build display text for dropdown
   * @param booking - Accommodation booking object
   */
  private static buildDisplayText(booking: any): string {
    const name = booking.contact_name || 'Unknown';
    const accommodation = booking.accommodation_name || 'No Accommodation';
    const checkIn = booking.check_in || '';
    return `${name} - ${accommodation} (${checkIn})`;
  }

  /**
   * Map array of accommodation bookings to tourist options
   * @param bookings - Array of accommodation booking objects
   */
  static mapToOptions(bookings: any[]): any[] {
    return bookings.map((b) => this.mapToOption(b));
  }
}
