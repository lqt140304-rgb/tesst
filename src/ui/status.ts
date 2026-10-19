import {
  APPOINTMENT_STATUS_LABEL, GENERAL_STATUS_LABEL, INTERNAL_STATUS_LABEL, PAYMENT_STATE_LABEL, REQUEST_STATUS_LABEL,
  type AppointmentStatus, type GeneralStatus, type InternalStatus, type PaymentState, type RequestStatus,
} from '../data/contracts/enums';
import type { IconName } from './icons/names';

export type Tone = 'plum' | 'orange' | 'teal' | 'rose' | 'honey' | 'grey' | 'outline' | 'flag' | 'internal';
export type Pill = { label: string; tone: Tone; icon: IconName | null };

const REQUEST: Record<RequestStatus, [Tone, IconName]> = {
  pending: ['plum', 'clock'], contacting: ['orange', 'phone-outgoing'], confirmed: ['teal', 'calendar-check'],
  unreachable: ['rose', 'phone-missed'], cancelled: ['grey', 'circle-x'], rejected: ['outline', 'circle-minus'],
};
const PAYMENT: Record<PaymentState, [Tone, IconName]> = { unpaid: ['orange', 'clock'], partial: ['honey', 'circle-half'], paid: ['teal', 'circle-check'] };
const APPOINTMENT: Record<AppointmentStatus, [Tone, IconName]> = { scheduled: ['plum', 'calendar-check'], cancelled: ['grey', 'circle-x'] };
const INTERNAL: Record<InternalStatus, [Tone, IconName]> = { stable: ['teal', 'circle-check'], watch: ['orange', 'eye'], critical: ['rose', 'triangle-alert'] };
const GENERAL: Record<GeneralStatus, [Tone, IconName]> = {
  stable: ['teal', 'circle-check'], recovering: ['teal', 'heart'], watch: ['plum', 'eye'], ready_home: ['outline', 'door-open'], want_to_talk: ['orange', 'phone'],
};

type Kind =
  | ['request', RequestStatus] | ['payment', PaymentState] | ['appointment', AppointmentStatus] | ['internal', InternalStatus]
  | ['general', GeneralStatus] | ['expiry', number] | ['flag', 'resubmit'] | ['share', 'draft' | 'shared' | 'unshared' | 'withdrawn']
  | ['link', 'linked' | 'unlinked'] | ['visibility', 'customer' | 'internal'] | ['invoice', 'draft' | 'voided'];

export function statusPill(...[kind, value]: Kind): Pill {
  switch (kind) {
    case 'request': return { label: REQUEST_STATUS_LABEL[value], tone: REQUEST[value][0], icon: REQUEST[value][1] };
    case 'payment': return { label: PAYMENT_STATE_LABEL[value], tone: PAYMENT[value][0], icon: PAYMENT[value][1] };
    case 'appointment': return { label: APPOINTMENT_STATUS_LABEL[value], tone: APPOINTMENT[value][0], icon: APPOINTMENT[value][1] };
    case 'internal': return { label: INTERNAL_STATUS_LABEL[value], tone: INTERNAL[value][0], icon: INTERNAL[value][1] };
    case 'general': return { label: GENERAL_STATUS_LABEL[value], tone: GENERAL[value][0], icon: GENERAL[value][1] };
    case 'expiry': return { label: `Còn ${value} ngày`, tone: value <= 3 ? 'rose' : value <= 14 ? 'orange' : 'grey', icon: 'hourglass' };
    case 'flag': return { label: 'Khách vừa gửi lại — cần gọi lại', tone: 'flag', icon: 'phone-redo' };
    case 'share':
      if (value === 'shared') return { label: 'Đã chia sẻ', tone: 'teal', icon: 'send' };
      if (value === 'draft') return { label: 'Bản nháp', tone: 'outline', icon: 'file-pen' };
      return { label: value === 'withdrawn' ? 'Đã thu hồi' : 'Ngừng chia sẻ', tone: 'grey', icon: 'eye-off' };
    case 'link': return value === 'linked' ? { label: 'Đã liên kết', tone: 'teal', icon: 'link-2' } : { label: 'Chưa liên kết', tone: 'outline', icon: 'unlink' };
    case 'visibility': return value === 'customer' ? { label: 'Khách sẽ thấy', tone: 'teal', icon: 'eye' } : { label: 'Nội bộ · khách không thấy', tone: 'internal', icon: 'lock' };
    case 'invoice': return value === 'draft' ? { label: 'Nháp', tone: 'outline', icon: 'file-pen' } : { label: 'Đã hủy', tone: 'grey', icon: 'file-x' };
  }
}
