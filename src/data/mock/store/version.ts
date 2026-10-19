import { ConflictError } from '../../contracts/errors';

export function checkVersion(row: { version: number }, expected: number | undefined): void {
  if (expected !== undefined && row.version !== expected) throw new ConflictError();
}

export function bump(row: { version: number }): void {
  row.version += 1;
}
