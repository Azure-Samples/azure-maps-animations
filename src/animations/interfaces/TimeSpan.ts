/**
 * Details about a period time.
 */
export interface TimeSpan {
    /** The start of the time span. Can be a number representing a date/time, or a number representing an order. */
    begin: number;
    
    /** The end of the time span. Can be a number representing a date/time, or a number representing an order. */
    end: number;
}