import { describe, expect, it } from 'vitest';
import { detectColumns, parseCsv, parseRupiah, parseSettlementCsv } from './settlement';

describe('parseCsv', () => {
  it('handles quotes, escaped quotes, embedded delimiters/newlines, CRLF and BOM', () => {
    const csv = '﻿a,b,c\r\n"x, y","say ""hi""","multi\nline"\r\n1,2,3\n';
    expect(parseCsv(csv)).toEqual([
      ['a', 'b', 'c'],
      ['x, y', 'say "hi"', 'multi\nline'],
      ['1', '2', '3'],
    ]);
  });

  it('auto-detects semicolon and tab delimiters and skips blank lines', () => {
    expect(parseCsv('a;b\n1;2\n\n')).toEqual([['a', 'b'], ['1', '2']]);
    expect(parseCsv('a\tb\n1\t2')).toEqual([['a', 'b'], ['1', '2']]);
  });
});

describe('parseRupiah', () => {
  it.each([
    ['55500', 55500],
    ['55.500', 55500],
    ['55,500', 55500],
    ['1.234.567', 1234567],
    ['55,500.00', 55500],
    ['55.500,00', 55500],
    ['Rp 55.500', 55500],
    ['IDR 389', 389],
    ['388.5', 389],
    ['388,5', 389],
    ['(389)', -389],
    ['-389', -389],
    ['0', 0],
  ])('%s → %s', (input, expected) => {
    expect(parseRupiah(input)).toBe(expected);
  });

  it.each(['', '  ', 'abc', '12a', '1.2.3', null, undefined])('rejects %s', (input) => {
    expect(parseRupiah(input as string)).toBeNull();
  });
});

describe('detectColumns', () => {
  it('recognises DOKU-style headers regardless of case and punctuation', () => {
    expect(detectColumns(['No', 'Invoice Number', 'Amount', 'Fee Amount', 'Net Amount', 'Settlement Date'])).toEqual({
      invoice: 1, amount: 2, fee: 3, net: 4, settledAt: 5,
    });
    expect(detectColumns(['partnerReferenceNo', 'MDR', 'Settlement_Amount']).invoice).toBe(0);
  });
});

describe('parseSettlementCsv', () => {
  it('parses rows and derives fee from amount - net when no fee column', () => {
    const res = parseSettlementCsv('Invoice Number,Amount,Net Amount,Settlement Date\nMNU-1,"55.500","55.111",02/10/2026\n');
    expect(res.errors).toEqual([]);
    expect(res.rows).toEqual([
      { line: 2, invoiceNumber: 'MNU-1', amount: 55500, fee: 389, net: 55111, settledAt: new Date('2026-10-01T17:00:00Z') },
    ]);
  });

  it('derives net from amount - fee and accepts negative-formatted fee', () => {
    const res = parseSettlementCsv('invoice_number;amount;fee\nQRS-1;10000;(70)\n');
    expect(res.rows[0]).toMatchObject({ invoiceNumber: 'QRS-1', fee: 70, net: 9930 });
  });

  it('reports row-level problems without dropping valid rows', () => {
    const csv = [
      'Invoice Number,Amount,Fee Amount,Net Amount',
      'MNU-1,1000,7,993',
      ',1000,7,993',
      'MNU-1,1000,7,993',
      'MNU-2,1000,7,900',
      'MNU-3,1000,abc,',
      'MNU-4,1000,2000,-1000',
    ].join('\n');
    const res = parseSettlementCsv(csv);
    expect(res.rows.map((r) => r.invoiceNumber)).toEqual(['MNU-1']);
    expect(res.errors.map((e) => [e.line, e.reason])).toEqual([
      [3, 'Nomor invoice kosong'],
      [4, 'Invoice duplikat di file'],
      [5, 'Fee (7) + net (900) ≠ amount (1000)'],
      [6, 'Fee/net tidak bisa dibaca'],
      [7, 'Fee/net bernilai negatif'],
    ]);
  });

  it('rejects files without the required columns', () => {
    expect(parseSettlementCsv('Foo,Bar\n1,2').errors[0].reason).toMatch(/invoice/);
    expect(parseSettlementCsv('Invoice Number,Amount\nMNU-1,1000').errors[0].reason).toMatch(/fee/);
    expect(parseSettlementCsv('').errors[0].reason).toBe('File kosong');
  });
});
