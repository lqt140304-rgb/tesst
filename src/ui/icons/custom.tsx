/* Hand-drawn vet icons (proposal-visual.md §5.2/§5.6): 24-grid, round caps/joins, currentColor; fills only for paw pads and dots. */
import type { ReactNode } from 'react';

const pad = 'M12 14.4c-1.7 0-3 1.2-3 2.5 0 1 .8 1.6 1.8 1.6.5 0 .8-.2 1.2-.2s.7.2 1.2.2c1 0 1.8-.6 1.8-1.6 0-1.3-1.3-2.5-3-2.5z';

/** Approved paths, byte-for-byte from the owner-approved Services icon set (chot-icon-services-v1). */
export const APPROVED: Record<string, ReactNode> = {
  stethoscope: (
    <>
      <path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3" />
      <path d="M9 12.5V17a3 3 0 0 0 3 3h1a3 3 0 0 0 3-3v-2" />
      <circle cx="16" cy="15" r="2" />
    </>
  ),
  scissors: (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </>
  ),
  'house-paw': (
    <>
      <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <g fill="currentColor" stroke="none">
        <circle cx="9.3" cy="12.6" r="1.1" />
        <circle cx="12" cy="11.6" r="1.1" />
        <circle cx="14.7" cy="12.6" r="1.1" />
        <path d={pad} />
      </g>
    </>
  ),
  'heart-pulse': (
    <>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
    </>
  ),
};

export const CUSTOM: Record<string, ReactNode> = {
  paw: (
    <g fill="currentColor" stroke="none">
      <circle cx="7" cy="5" r="2.2" />
      <circle cx="12" cy="3.5" r="2.2" />
      <circle cx="17" cy="5" r="2.2" />
      <circle cx="4" cy="9.5" r="2" />
      <path d="M12 9c-3.2 0-5.8 2.2-5.8 5 0 2.3 2 4.2 4.5 4.5.8.1 1.8.1 2.6 0 2.5-.3 4.5-2.2 4.5-4.5 0-2.8-2.6-5-5.8-5z" />
    </g>
  ),
  'paw-line': (
    <>
      <path d="M8.2 19.6c-1.3-.6-1.9-1.8-1.4-3.1.8-2.2 2.8-4 5.2-4s4.4 1.8 5.2 4c.5 1.3-.1 2.5-1.4 3.1-1.2.5-2.4.1-3.8.1s-2.6.4-3.8-.1z" />
      <ellipse cx="5.6" cy="10.4" rx="1.8" ry="2.3" transform="rotate(-20 5.6 10.4)" />
      <ellipse cx="9.4" cy="6.2" rx="1.8" ry="2.3" transform="rotate(-8 9.4 6.2)" />
      <ellipse cx="14.6" cy="6.2" rx="1.8" ry="2.3" transform="rotate(8 14.6 6.2)" />
      <ellipse cx="18.4" cy="10.4" rx="1.8" ry="2.3" transform="rotate(20 18.4 10.4)" />
    </>
  ),
  'paw-heart': (
    <>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <g fill="currentColor" stroke="none">
        <circle cx="9.6" cy="9.1" r="1" />
        <circle cx="12" cy="8.2" r="1" />
        <circle cx="14.4" cy="9.1" r="1" />
        <path d="M12 10.7c-1.5 0-2.7 1.1-2.7 2.2 0 .9.7 1.4 1.6 1.4.4 0 .7-.2 1.1-.2s.7.2 1.1.2c.9 0 1.6-.5 1.6-1.4 0-1.1-1.2-2.2-2.7-2.2z" />
      </g>
    </>
  ),
  'yarn-ball': (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="M4.6 7.4c3.6.2 7.5 2.4 10 6.6" />
      <path d="M7 3.9c3.8 2.2 6.2 6.6 6.1 11" />
      <path d="M3.2 12.6c3.4-.3 8.7 1.3 12.6 5.4" />
      <path d="M17.6 15.6c1.4 1.6 2.4 3 4.2 3.4" />
    </>
  ),
  ball: (
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M6.6 8.8c2.4-.4 4.2.8 5.4 3.2s3 3.6 5.4 3.2" />
    </>
  ),
  'cat-face': (
    <>
      <path d="M4.2 10.6 4 4l5 3.2a9.2 9.2 0 0 1 6 0L20 4l-.2 6.6c.8 1.2 1.2 2.6 1.2 4 0 4.2-4 6.4-9 6.4s-9-2.2-9-6.4c0-1.4.4-2.8 1.2-4Z" />
      <circle cx="8.8" cy="13.4" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.2" cy="13.4" r="1" fill="currentColor" stroke="none" />
      <path d="M11.2 16.2h1.6L12 17.2Z" fill="currentColor" />
    </>
  ),
  'dog-face': (
    <>
      <path d="M8 4.6c1.2-.4 2.6-.6 4-.6s2.8.2 4 .6c2.4.8 4 3 4 5.4v3.4c0 4.4-3.6 7.6-8 7.6s-8-3.2-8-7.6V10c0-2.4 1.6-4.6 4-5.4Z" />
      <path d="M8 4.6c-2.6.4-4.6 2.6-4.8 5.6-.1 1.6.6 3 1.8 3.6" />
      <path d="M16 4.6c2.6.4 4.6 2.6 4.8 5.6.1 1.6-.6 3-1.8 3.6" />
      <circle cx="9.2" cy="11.6" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.8" cy="11.6" r="1" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="15" rx="1.4" ry="1" fill="currentColor" stroke="none" />
      <path d="M10.2 17.4c.6.6 1.2.8 1.8.4.6.4 1.2.2 1.8-.4" />
    </>
  ),
  kennel: (
    <>
      <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M8.5 22v-4.5a3.5 3.5 0 0 1 7 0V22" />
      <circle cx="12" cy="10.2" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  'kennel-empty': (
    <>
      <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeDasharray="2 3" />
      <path d="M8.5 22v-4.5a3.5 3.5 0 0 1 7 0V22" strokeDasharray="2 3" />
    </>
  ),
  'pet-bowl': (
    <>
      <path d="M3 13h18l-1.6 5.2A2.5 2.5 0 0 1 17 20H7a2.5 2.5 0 0 1-2.4-1.8Z" />
      <path d="M2 13h20" />
      <circle cx="8.5" cy="9.6" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="8.4" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="9.6" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  'e-collar': (
    <>
      <path d="M5 6.5 9.4 9h5.2L19 6.5l1.6 11.2A16 16 0 0 1 12 20a16 16 0 0 1-8.6-2.3Z" />
      <circle cx="12" cy="13.6" r="3" />
      <path d="M10.2 11.1 9.6 9.8M13.8 11.1l.6-1.3" />
    </>
  ),
  'iv-bag': (
    <>
      <path d="M10 3.5h4" />
      <path d="M12 3.5V5" />
      <rect x="7" y="5" width="10" height="11" rx="3" />
      <path d="M12 16v3.2" />
      <circle cx="12" cy="21" r="1" fill="currentColor" stroke="none" />
      <path d="M9.5 9h5M9.5 12h3" />
    </>
  ),
  'phone-redo': (
    <>
      <path d="M12.6 16.9a12.2 12.2 0 0 1-5.4-3.1 12.2 12.2 0 0 1-3.1-5.4 1.4 1.4 0 0 1 .4-1.4l1.5-1.5a1.2 1.2 0 0 1 1.8.1l1.5 2a1.2 1.2 0 0 1-.1 1.6l-.8.8a8.6 8.6 0 0 0 3.6 3.6l.8-.8a1.2 1.2 0 0 1 1.6-.1l2 1.5a1.2 1.2 0 0 1 .1 1.8l-1.5 1.5a1.4 1.4 0 0 1-1.4.4Z" />
      <path d="M20.4 7.6A4 4 0 1 1 17.6 3.2" />
      <path d="M20.6 3.4v4.2h-4.2" />
    </>
  ),
  'circle-half': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor" />
    </>
  ),
  diary: (
    <>
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v16H6.5A1.5 1.5 0 0 0 5 20.5z" />
      <path d="M5 20.5A1.5 1.5 0 0 0 6.5 22H19v-3" />
      <g fill="currentColor" stroke="none">
        <circle cx="10.4" cy="8.6" r=".95" />
        <circle cx="12.2" cy="7.8" r=".95" />
        <circle cx="14" cy="8.6" r=".95" />
        <path d="M12.2 10.1c-1.3 0-2.3.9-2.3 1.9 0 .8.6 1.2 1.4 1.2.4 0 .6-.2.9-.2s.5.2.9.2c.8 0 1.4-.4 1.4-1.2 0-1-1-1.9-2.3-1.9z" />
      </g>
    </>
  ),
  facebook: <path d="M14 8.5V6.8c0-.8.6-1.3 1.3-1.3H17V2.2h-2.6C11.6 2.2 10 4 10 6.6v1.9H7.4v3.4H10V22h4V11.9h2.7l.5-3.4Z" fill="currentColor" stroke="none" />,
};
