import type { RequestSnapshot } from '../contracts/enums';

export type RequestScope = { kind: 'guest' } | { kind: 'account'; accountId: string };

const norm = (v: string | undefined) => (v ?? '').normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();

/** Full-snapshot key: identical after normalisation ⇒ duplicate (never phone alone). */
export function dedupeKey(scope: RequestScope, s: RequestSnapshot): string {
  return [
    scope.kind === 'guest' ? 'guest' : `account:${scope.accountId}`,
    norm(s.contact_name), s.phone_e164, norm(s.pet_name), s.species, norm(s.breed),
    s.service, s.desired_date, norm(s.note), s.account_pet_id ?? '', s.pet_id ?? '',
    // Only when chosen, so keys stored before time slots existed still match.
    ...(s.preferred_slot ? [s.preferred_slot] : []),
  ].join('|');
}
