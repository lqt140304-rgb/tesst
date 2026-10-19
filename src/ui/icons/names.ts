/** Every icon name used in the app (proposal-visual.md §5.5). Lucide 1.59.0 names + custom + approved. */
export const LUCIDE_ICONS = [
  'menu', 'x', 'chevron-down', 'chevron-up', 'chevron-left', 'chevron-right', 'arrow-right', 'arrow-left', 'arrow-up-right',
  'house', 'house-heart', 'layout-dashboard', 'inbox', 'calendar-days', 'calendar-check', 'users-round', 'receipt', 'tags',
  'chart-column', 'link-2', 'unlink', 'circle-user-round', 'search', 'plus', 'ellipsis-vertical', 'log-in', 'log-out',
  'shield-user', 'rotate-ccw', 'clock', 'phone', 'phone-outgoing', 'phone-missed', 'circle-x', 'circle-minus', 'circle-check',
  'check', 'eye', 'eye-off', 'lock', 'send', 'file-pen', 'file-x', 'banknote', 'landmark', 'qr-code', 'triangle-alert',
  'heart', 'door-open', 'hourglass', 'volume-x', 'play', 'pause', 'maximize', 'map-pin', 'mail', 'printer', 'copy',
  'info', 'message-circle', 'moon', 'utensils', 'smile', 'footprints', 'bone', 'user-round',
  'settings', 'trash-2', 'pencil', 'calendar-plus', 'clipboard-list', 'activity', 'thermometer',
  'notebook-pen', 'video', 'image', 'external-link', 'navigation', 'refresh-cw', 'filter', 'list', 'grid-2x2',
] as const;
export const CUSTOM_ICONS = [
  'paw', 'paw-line', 'paw-heart', 'yarn-ball', 'ball', 'cat-face', 'dog-face', 'kennel', 'kennel-empty', 'pet-bowl', 'e-collar',
  'iv-bag', 'phone-redo', 'circle-half', 'diary', 'facebook',
] as const;
export const APPROVED_ICONS = ['stethoscope', 'scissors', 'house-paw', 'heart-pulse'] as const;
export type IconName = (typeof LUCIDE_ICONS)[number] | (typeof CUSTOM_ICONS)[number] | (typeof APPROVED_ICONS)[number];
