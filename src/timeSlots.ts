import { todayISO } from './dates';

export type TimeSlot = {
  value: string;
  label: string;
};

function formatHour12(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

function slotLabel(startHour: number): string {
  const endHour = (startHour + 1) % 24;
  return `${formatHour12(startHour)} – ${formatHour12(endHour)}`;
}

function toValue(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function getHourlySlots(): TimeSlot[] {
  return Array.from({ length: 24 }, (_, hour) => ({
    value: toValue(hour),
    label: slotLabel(hour),
  }));
}

/** For today, exclude the in-progress hour (e.g. at 1:43 PM hide 1–2 PM, start at 2–3 PM). */
function isSlotAvailable(dateISO: string, slot: TimeSlot): boolean {
  if (dateISO !== todayISO()) return true;

  const startHour = Number(slot.value.slice(0, 2));
  return startHour > new Date().getHours();
}

export function getAvailableSlots(dateISO: string): TimeSlot[] {
  return getHourlySlots().filter((slot) => isSlotAvailable(dateISO, slot));
}

export function getSlotLabel(value: string): string {
  const hour = Number(value.slice(0, 2));
  return slotLabel(hour);
}

export function firstAvailableSlot(dateISO: string): string | null {
  const slots = getAvailableSlots(dateISO);
  return slots[0]?.value ?? null;
}
