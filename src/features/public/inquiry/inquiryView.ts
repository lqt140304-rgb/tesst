import { OUT_OF_HOURS_SLOT, type TimeSlot } from '@/data/contracts/enums';
import { slotsOn } from '@/data/rules/booking';

/** Same limits as the data layer (name 1–60, message 1–500, product name 60). */
export const INQUIRY_MAX = { name: 60, text: 500, about: 60 } as const;

export const SLOT_DROPPED_MSG = 'Khung giờ đã được bỏ chọn vì ngày này Lê Sơn làm đến 19:00.';

export type SlotView = { slots: TimeSlot[]; outOfHours: boolean; holidayNote: string | null; slotDropped: boolean };

/** What the booking form shows for the chosen day and slot: the slots on offer, whether the choice is "outside hours", the holiday note, and whether the chosen slot no longer fits. */
export function slotView(slot: string, date: string, holidays: readonly string[]): SlotView {
  const slots = slotsOn(date, holidays);
  const holiday = holidays.includes(date);
  return {
    slots,
    outOfHours: slot === OUT_OF_HOURS_SLOT,
    holidayNote: holiday ? 'Ngày này Lê Sơn làm đến 19:00.' : null,
    slotDropped: slot !== '' && slot !== OUT_OF_HOURS_SLOT && !(slots as readonly string[]).includes(slot),
  };
}

/** "x/max" of the trimmed text, shown under a box. */
export const counter = (text: string, max: number): string => `${text.trim().length}/${max}`;
