import {
  Activity, ArrowLeft, ArrowRight, ArrowUpRight, Banknote, Bone, CalendarCheck, CalendarDays, CalendarPlus, ChartColumn, Check,
  ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CircleCheck, CircleMinus, CircleUserRound, CircleX, ClipboardList, Clock, Copy,
  DoorOpen, EllipsisVertical, ExternalLink, Eye, EyeOff, FilePen, FileX, Filter, Footprints, Grid2x2, Heart, Hourglass, House,
  HouseHeart, Image, Inbox, Info, Landmark, LayoutDashboard, Link2, List, Lock, LogIn, LogOut, Mail, MapPin, Maximize, Menu,
  MessageCircle, Moon, Navigation, NotebookPen, Pause, Pencil, Phone, PhoneMissed, PhoneOutgoing, Play, Plus, Printer, QrCode,
  Receipt, RefreshCw, RotateCcw, Search, Send, Settings, ShieldUser, Smile, Tags, Thermometer, Trash2, TriangleAlert, Unlink,
  UserRound, UsersRound, Utensils, Video, VolumeX, X, type LucideIcon,
} from 'lucide-react';
import { APPROVED, CUSTOM } from './custom';
import type { IconName } from './names';

const LUCIDE: Record<string, LucideIcon> = {
  menu: Menu, x: X, 'chevron-down': ChevronDown, 'chevron-up': ChevronUp, 'chevron-left': ChevronLeft, 'chevron-right': ChevronRight,
  'arrow-right': ArrowRight, 'arrow-left': ArrowLeft, 'arrow-up-right': ArrowUpRight, house: House, 'house-heart': HouseHeart,
  'layout-dashboard': LayoutDashboard, inbox: Inbox, 'calendar-days': CalendarDays, 'calendar-check': CalendarCheck, 'users-round': UsersRound,
  receipt: Receipt, tags: Tags, 'chart-column': ChartColumn, 'link-2': Link2, unlink: Unlink, 'circle-user-round': CircleUserRound,
  search: Search, plus: Plus, 'ellipsis-vertical': EllipsisVertical, 'log-in': LogIn, 'log-out': LogOut, 'shield-user': ShieldUser,
  'rotate-ccw': RotateCcw, clock: Clock, phone: Phone, 'phone-outgoing': PhoneOutgoing, 'phone-missed': PhoneMissed, 'circle-x': CircleX,
  'circle-minus': CircleMinus, 'circle-check': CircleCheck, check: Check, eye: Eye, 'eye-off': EyeOff, lock: Lock, send: Send,
  'file-pen': FilePen, 'file-x': FileX, banknote: Banknote, landmark: Landmark, 'qr-code': QrCode, 'triangle-alert': TriangleAlert,
  heart: Heart, 'door-open': DoorOpen, hourglass: Hourglass, 'volume-x': VolumeX, play: Play, pause: Pause, maximize: Maximize,
  'map-pin': MapPin, mail: Mail, printer: Printer, copy: Copy, info: Info, 'message-circle': MessageCircle, moon: Moon, utensils: Utensils,
  smile: Smile, footprints: Footprints, bone: Bone, 'user-round': UserRound, settings: Settings, 'trash-2': Trash2, pencil: Pencil,
  'calendar-plus': CalendarPlus, 'clipboard-list': ClipboardList, activity: Activity, thermometer: Thermometer, 'notebook-pen': NotebookPen,
  video: Video, image: Image, 'external-link': ExternalLink, navigation: Navigation, 'refresh-cw': RefreshCw, filter: Filter, list: List,
  'grid-2x2': Grid2x2,
};

/** Optical stroke per render size (proposal-visual.md §5.3), in 24-unit space. */
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
  const L = LUCIDE[name];
  if (L) return <L size={size} strokeWidth={sw} className={className} {...a11y} />;
  const body = APPROVED[name] ?? CUSTOM[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} data-icon={name} {...a11y}>
      {body}
    </svg>
  );
}

export const hasIcon = (name: string) => !!(LUCIDE[name] ?? APPROVED[name] ?? CUSTOM[name]);
