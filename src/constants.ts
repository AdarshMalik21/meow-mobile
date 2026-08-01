export const SUPPORT_EMAIL = 'support@zuro.app';
export const SUPPORT_PHONE = '+91 98765 43210';
export const SUPPORT_PHONE_TEL = '+919876543210';

export function formatRupee(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatPricePerSeat(pricePerSeat: number): string {
  return `${formatRupee(pricePerSeat)} per seat`;
}

export function formatBookingTotal(seats: number, pricePerSeat: number): string {
  return `${seats} seat${seats === 1 ? '' : 's'} · ${formatRupee(seats * pricePerSeat)} total`;
}

export function formatSeatsLabel(seats: number): string {
  return `${seats} seat${seats === 1 ? '' : 's'}`;
}

export function trimCity(city: string): string {
  return city.trim().replace(/\s+/g, ' ');
}

export function routeLabel(fromCity: string, toCity: string): string {
  return `${fromCity} → ${toCity}`;
}
