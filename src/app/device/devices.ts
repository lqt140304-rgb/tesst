/** "Xem như máy tính / điện thoại": screen sizes the demo can be previewed at, and the remembered choice. */
export type DeviceKind = 'pc' | 'mobile';
export type DevicePreset = { id: string; kind: DeviceKind; width: number; height: number; label: string };
export type DeviceMode = { kind: 'auto' } | { kind: DeviceKind; presetId: string };
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export const DEVICE_PRESETS: DevicePreset[] = [
  { id: 'pc-1920x1080', kind: 'pc', width: 1920, height: 1080, label: '1920 × 1080 · Full HD' },
  { id: 'pc-1440x900', kind: 'pc', width: 1440, height: 900, label: '1440 × 900 · laptop' },
  { id: 'pc-1366x768', kind: 'pc', width: 1366, height: 768, label: '1366 × 768 · laptop nhỏ' },
  { id: 'pc-1280x720', kind: 'pc', width: 1280, height: 720, label: '1280 × 720 · màn hình nhỏ' },
  { id: 'm-430x932', kind: 'mobile', width: 430, height: 932, label: '430 × 932 · iPhone cỡ lớn' },
  { id: 'm-390x844', kind: 'mobile', width: 390, height: 844, label: '390 × 844 · iPhone thường' },
  { id: 'm-360x800', kind: 'mobile', width: 360, height: 800, label: '360 × 800 · Android phổ biến' },
  { id: 'm-320x568', kind: 'mobile', width: 320, height: 568, label: '320 × 568 · cỡ nhỏ nhất' },
];

export const DEFAULT_PRESET: Record<DeviceKind, string> = { pc: 'pc-1440x900', mobile: 'm-390x844' };
/** The preview iframe's window name: the app inside knows it is a preview, whatever hosts the page (an Artifact is itself framed). */
export const FRAME_NAME = 'leson-device-frame';
const KEY = 'leson:device';
const MIN_SCALE = 0.2;

export const presetOf = (id: string): DevicePreset | undefined => DEVICE_PRESETS.find((p) => p.id === id);

export function readMode(store: StorageLike | null): DeviceMode {
  try {
    const p = presetOf(store?.getItem(KEY) ?? '');
    return p ? { kind: p.kind, presetId: p.id } : { kind: 'auto' };
  } catch {
    return { kind: 'auto' };
  }
}

export function writeMode(store: StorageLike | null, mode: DeviceMode): void {
  try { store?.setItem(KEY, mode.kind === 'auto' ? 'auto' : mode.presetId); } catch { /* storage blocked: the choice lasts until reload */ }
}

/** Shrink the frame to fit the free area; never enlarge. */
export function fitScale(avail: { width: number; height: number }, size: { width: number; height: number }): number {
  const s = Math.min(1, avail.width / size.width, avail.height / size.height);
  return Math.max(MIN_SCALE, Number.isFinite(s) ? s : MIN_SCALE);
}

/** True inside the preview frame: the controls live outside, so the app hides its own. */
export const isDeviceFrame = (): boolean => { try { return window.name === FRAME_NAME; } catch { return false; } };

export const browserStore = (): StorageLike | null => { try { return window.localStorage; } catch { return null; } };
