import { describe, expect, it } from 'vitest';
import { nextPriceCode } from './price-codes';

describe('price codes', () => {
  it('continues the prefix of the category', () => {
    expect(nextPriceCode('exam', ['KB01', 'KB09', 'SP07'])).toBe('KB10');
    expect(nextPriceCode('spa', ['KB01', 'SP07'])).toBe('SP08');
    expect(nextPriceCode('supply', [])).toBe('VT01');
    expect(nextPriceCode('inpatient', ['LT04'])).toBe('LT05');
    expect(nextPriceCode('medicine', ['TH99'])).toBe('TH100');
  });
});
