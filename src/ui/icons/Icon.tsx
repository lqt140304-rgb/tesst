import {
  ArrowCounterClockwise, ArrowRight, ArrowLeft, ArrowSquareOut, ArrowUpRight, ArrowsClockwise, ArrowsOut, Bank, Bone, CalendarCheck, CalendarDots,
  CalendarPlus, CaretDown, CaretLeft, CaretRight, CaretUp, ChartBar, ChatCircle, Check, CheckCircle, Clock, ClipboardText, Copy, DoorOpen,
  DotsThreeVertical, Envelope, Eye, EyeSlash, FileX, Footprints, ForkKnife, Funnel, Gear, GridFour, Heart, Hourglass, House, HouseLine,
  IdentificationBadge, Image, Info, LinkBreak, LinkSimple, List, ListBullets, Lock, MagnifyingGlass, MapPin, MinusCircle, Money, Moon,
  NavigationArrow, Notebook, NotePencil, PaperPlaneTilt, Pause, PencilSimple, Phone, PhoneOutgoing, PhoneX, Play, Plus, Printer, Pulse, QrCode,
  Receipt, SignIn, SignOut, Smiley, SpeakerSlash, SquaresFour, Tag, Thermometer, Tray, Trash, User, UserCircle, UsersThree, VideoCamera, Warning,
  X, XCircle, type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { APPROVED, CUSTOM } from './custom';
import type { IconName } from './names';

/** App icon name → Phosphor icon, drawn in the duotone weight (owner's choice, 21/10/2026). */
const PHOSPHOR: Record<string, PhosphorIcon> = {
  menu: List, x: X, 'chevron-down': CaretDown, 'chevron-up': CaretUp, 'chevron-left': CaretLeft, 'chevron-right': CaretRight,
  'arrow-right': ArrowRight, 'arrow-left': ArrowLeft, 'arrow-up-right': ArrowUpRight, house: House, 'house-heart': HouseLine,
  'layout-dashboard': SquaresFour, inbox: Tray, 'calendar-days': CalendarDots, 'calendar-check': CalendarCheck, 'users-round': UsersThree,
  receipt: Receipt, tags: Tag, 'chart-column': ChartBar, 'link-2': LinkSimple, unlink: LinkBreak, 'circle-user-round': UserCircle,
  search: MagnifyingGlass, plus: Plus, 'ellipsis-vertical': DotsThreeVertical, 'log-in': SignIn, 'log-out': SignOut, 'shield-user': IdentificationBadge,
  'rotate-ccw': ArrowCounterClockwise, clock: Clock, phone: Phone, 'phone-outgoing': PhoneOutgoing, 'phone-missed': PhoneX, 'circle-x': XCircle,
  'circle-minus': MinusCircle, 'circle-check': CheckCircle, check: Check, eye: Eye, 'eye-off': EyeSlash, lock: Lock, send: PaperPlaneTilt,
  'file-pen': NotePencil, 'file-x': FileX, banknote: Money, landmark: Bank, 'qr-code': QrCode, 'triangle-alert': Warning,
  heart: Heart, 'door-open': DoorOpen, hourglass: Hourglass, 'volume-x': SpeakerSlash, play: Play, pause: Pause, maximize: ArrowsOut,
  'map-pin': MapPin, mail: Envelope, printer: Printer, copy: Copy, info: Info, 'message-circle': ChatCircle, moon: Moon, utensils: ForkKnife,
  smile: Smiley, footprints: Footprints, bone: Bone, 'user-round': User, settings: Gear, 'trash-2': Trash, pencil: PencilSimple,
  'calendar-plus': CalendarPlus, 'clipboard-list': ClipboardText, activity: Pulse, thermometer: Thermometer, 'notebook-pen': Notebook,
  video: VideoCamera, image: Image, 'external-link': ArrowSquareOut, navigation: NavigationArrow, 'refresh-cw': ArrowsClockwise, filter: Funnel, list: ListBullets,
  'grid-2x2': GridFour,
};

/** Optical stroke per render size (proposal-visual.md §5.3), in 24-unit space — for the hand-drawn icons; Phosphor icons are filled shapes. */
export function opticalStroke(size: number): number {
  if (size <= 14) return 2.5;
  if (size <= 16) return 2.25;
  if (size >= 40) return 1.5;
  return 2;
}

type Props = { name: IconName; size?: number; label?: string; className?: string; strokeWidth?: number };

export function Icon({ name, size = 20, label, className, strokeWidth }: Props) {
  const sw = strokeWidth ?? opticalStroke(size);
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const, focusable: 'false' as const };
  const P = PHOSPHOR[name];
  if (P) return <P size={size} weight="duotone" className={className} {...a11y} />;
  const body = APPROVED[name] ?? CUSTOM[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} data-icon={name} {...a11y}>
      {body}
    </svg>
  );
}

export const hasIcon = (name: string) => !!(PHOSPHOR[name] ?? APPROVED[name] ?? CUSTOM[name]);
