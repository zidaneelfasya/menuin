import { describe, expect, it } from 'vitest';
import { estimateGatewayFee, generateInvoiceNumber, toRupiahInteger } from './utils';

describe('generateInvoiceNumber', () => {
  it('is short, uppercase alphanumeric with dashes, and unique', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const inv = generateInvoiceNumber();
      expect(inv).toMatch(/^MNU-[0-9A-Z]+-[0-9A-F]{8}$/);
      expect(inv.length).toBeLessThanOrEqual(64);
      seen.add(inv);
    }
    expect(seen.size).toBe(1000);
  });
});

describe('toRupiahInteger', () => {
  it('rounds decimal strings from the DB', () => {
    expect(toRupiahInteger('55500.00')).toBe(55500);
    expect(toRupiahInteger('10999.50')).toBe(11000);
    expect(toRupiahInteger(null)).toBe(0);
  });

  it('rejects non-numeric values', () => {
    expect(() => toRupiahInteger('abc')).toThrow();
  });
});

describe('estimateGatewayFee', () => {
  it('estimates 0.7% MDR', () => {
    expect(estimateGatewayFee(55500, 0.7)).toEqual({ fee: 389, net: 55111 });
    expect(estimateGatewayFee(0, 0.7)).toEqual({ fee: 0, net: 0 });
  });
});
