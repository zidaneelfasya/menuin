/**
 * Parsing laporan settlement DOKU (CSV dari dashboard) — murni, tanpa I/O.
 *
 * Format kolom laporan DOKU bisa berbeda antar produk/versi, jadi kolom dikenali
 * dari nama header (beberapa alias), bukan dari posisi. Baris dicocokkan ke
 * payment_attempts lewat nomor invoice (invoice_number / partnerReferenceNo).
 */

/** Parser CSV RFC 4180 sederhana: kutip ganda, kutip ter-escape (""), baris baru di dalam kutip. */
export function parseCsv(text: string, delimiter?: string): string[][] {
  const input = text.replace(/^﻿/, '');
  const delim = delimiter ?? detectDelimiter(input);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === delim) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && input[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const counts = [',', ';', '\t'].map((d) => ({ d, n: firstLine.split(d).length - 1 }));
  counts.sort((a, b) => b.n - a.n);
  return counts[0].n > 0 ? counts[0].d : ',';
}

const normalizeHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');

const COLUMN_ALIASES = {
  invoice: ['invoicenumber', 'invoiceno', 'invoice', 'partnerreferenceno', 'orderid', 'merchantorderid', 'transactionreference', 'referencenumber'],
  amount: ['amount', 'grossamount', 'transactionamount', 'totalamount', 'nominal', 'paidamount'],
  fee: ['fee', 'feeamount', 'mdr', 'mdramount', 'totalfee', 'merchantfee', 'servicefee', 'transactionfee'],
  net: ['netamount', 'net', 'nettamount', 'settlementamount', 'settledamount', 'amounttosettle'],
  settledAt: ['settlementdate', 'settledat', 'settledate', 'tanggalsettlement', 'payoutdate'],
} as const;

export type SettlementColumns = { [K in keyof typeof COLUMN_ALIASES]: number | null };

export function detectColumns(header: string[]): SettlementColumns {
  const normalized = header.map(normalizeHeader);
  const find = (aliases: readonly string[]) => {
    for (const alias of aliases) {
      const idx = normalized.indexOf(alias);
      if (idx !== -1) return idx;
    }
    return null;
  };
  return {
    invoice: find(COLUMN_ALIASES.invoice),
    amount: find(COLUMN_ALIASES.amount),
    fee: find(COLUMN_ALIASES.fee),
    net: find(COLUMN_ALIASES.net),
    settledAt: find(COLUMN_ALIASES.settledAt),
  };
}

/**
 * Nominal rupiah dari berbagai format: "55500", "55.500", "55,500.00", "Rp 55.500,00", "(389)".
 * Bila "." dan "," sama-sama ada, yang terakhir adalah pemisah desimal. Bila hanya satu,
 * dianggap pemisah ribuan jika diikuti tepat kelompok 3 digit; selain itu desimal.
 */
export function parseRupiah(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  let s = String(raw).trim();
  if (!s) return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/rp|idr/gi, '').replace(/\s/g, '');
  if (s.startsWith('-')) {
    negative = true;
    s = s.slice(1);
  }
  if (!/^[\d.,]+$/.test(s)) return null;

  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  let normalized: string;
  if (lastDot !== -1 && lastComma !== -1) {
    const decimalSep = lastDot > lastComma ? '.' : ',';
    const thousandSep = decimalSep === '.' ? ',' : '.';
    normalized = s.split(thousandSep).join('').replace(decimalSep, '.');
  } else if (lastDot !== -1 || lastComma !== -1) {
    const sep = lastDot !== -1 ? '.' : ',';
    const parts = s.split(sep);
    const looksLikeThousands = parts.length > 1 && parts.slice(1).every((p) => p.length === 3) && parts[0].length >= 1;
    normalized = looksLikeThousands ? parts.join('') : s.replace(sep, '.');
    if (!looksLikeThousands && parts.length > 2) return null;
  } else {
    normalized = s;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return Math.round(negative ? -value : value);
}

export type SettlementRow = {
  line: number;
  invoiceNumber: string;
  amount: number | null;
  fee: number;
  net: number;
  settledAt: Date | null;
};

export type SettlementRowError = { line: number; invoiceNumber: string | null; reason: string };

export type ParsedSettlement = {
  rows: SettlementRow[];
  errors: SettlementRowError[];
  columns: SettlementColumns;
};

function parseDate(raw: string | undefined): Date | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();
  // dd/mm/yyyy atau dd-mm-yyyy (format umum laporan Indonesia), opsional dengan jam.
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (dmy) {
    const [, d, m, y, hh = '0', mm = '0', ss = '0'] = dmy;
    const date = new Date(Date.UTC(+y, +m - 1, +d, +hh - 7, +mm, +ss)); // WIB
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(s);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const SETTLEMENT_MAX_ROWS = 5000;

/** Mengubah CSV settlement menjadi baris tervalidasi. Tidak menyentuh DB. */
export function parseSettlementCsv(text: string): ParsedSettlement {
  const table = parseCsv(text);
  const empty: SettlementColumns = { invoice: null, amount: null, fee: null, net: null, settledAt: null };
  if (table.length === 0) {
    return { rows: [], errors: [{ line: 0, invoiceNumber: null, reason: 'File kosong' }], columns: empty };
  }

  const columns = detectColumns(table[0]);
  if (columns.invoice === null) {
    return { rows: [], errors: [{ line: 1, invoiceNumber: null, reason: 'Kolom nomor invoice tidak ditemukan' }], columns };
  }
  if (columns.fee === null && (columns.net === null || columns.amount === null)) {
    return {
      rows: [],
      errors: [{ line: 1, invoiceNumber: null, reason: 'Butuh kolom fee, atau kolom amount + net amount' }],
      columns,
    };
  }

  const rows: SettlementRow[] = [];
  const errors: SettlementRowError[] = [];
  const seen = new Set<string>();
  const body = table.slice(1, SETTLEMENT_MAX_ROWS + 1);
  if (table.length - 1 > SETTLEMENT_MAX_ROWS) {
    errors.push({ line: 0, invoiceNumber: null, reason: `Maksimal ${SETTLEMENT_MAX_ROWS} baris per file` });
  }

  body.forEach((cells, idx) => {
    const line = idx + 2;
    const invoiceNumber = (cells[columns.invoice!] ?? '').trim();
    if (!invoiceNumber) return errors.push({ line, invoiceNumber: null, reason: 'Nomor invoice kosong' });
    if (invoiceNumber.length > 64) return errors.push({ line, invoiceNumber, reason: 'Nomor invoice tidak valid' });
    if (seen.has(invoiceNumber)) return errors.push({ line, invoiceNumber, reason: 'Invoice duplikat di file' });

    const amount = columns.amount !== null ? parseRupiah(cells[columns.amount]) : null;
    const rawFee = columns.fee !== null ? parseRupiah(cells[columns.fee]) : null;
    const rawNet = columns.net !== null ? parseRupiah(cells[columns.net]) : null;

    let fee: number | null = rawFee !== null ? Math.abs(rawFee) : null;
    let net: number | null = rawNet;
    if (fee === null && amount !== null && net !== null) fee = amount - net;
    if (net === null && amount !== null && fee !== null) net = amount - fee;
    if (fee === null || net === null) return errors.push({ line, invoiceNumber, reason: 'Fee/net tidak bisa dibaca' });
    if (fee < 0 || net < 0) return errors.push({ line, invoiceNumber, reason: 'Fee/net bernilai negatif' });
    if (amount !== null && fee + net !== amount) {
      return errors.push({ line, invoiceNumber, reason: `Fee (${fee}) + net (${net}) ≠ amount (${amount})` });
    }

    seen.add(invoiceNumber);
    rows.push({
      line,
      invoiceNumber,
      amount,
      fee,
      net,
      settledAt: columns.settledAt !== null ? parseDate(cells[columns.settledAt]) : null,
    });
  });

  return { rows, errors, columns };
}
