/**
 * Menyamakan database dengan src/lib/db/schema.ts secara ADITIF saja.
 *
 * Kenapa bukan `drizzle-kit push`? Di repo ini push ingin men-drop & membuat ulang
 * constraint komposit lama (gagal karena dipakai FK lain) dan bisa menanyakan
 * "rename atau kolom baru?" secara interaktif. Script ini membandingkan snapshot
 * schema.ts (generateDrizzleJson) dengan katalog Postgres lalu HANYA menambahkan:
 *   enum/nilai enum, tabel, kolom, unique/check/foreign key, dan index yang belum ada.
 * Tidak ada yang di-drop, di-rename, atau diubah tipenya.
 *
 * Pemakaian (dari apps/web):
 *   npm run db:sync              # dry-run: tampilkan rencana
 *   npm run db:sync -- --apply   # terapkan
 */
import postgres from 'postgres';
import { generateDrizzleJson } from 'drizzle-kit/api';
import * as schema from '../src/lib/db/schema';

const APPLY = process.argv.includes('--apply');
const SCHEMA = 'public';
const PG_MAX_IDENT = 63;

type Column = {
  name: string;
  type: string;
  typeSchema?: string;
  primaryKey: boolean;
  notNull: boolean;
  default?: string | number | boolean;
};
type Index = {
  name: string;
  columns: { expression: string; isExpression: boolean; asc: boolean; nulls: string }[];
  isUnique: boolean;
  where?: string;
  method: string;
};
type ForeignKey = {
  name: string;
  tableTo: string;
  schemaTo?: string;
  columnsFrom: string[];
  columnsTo: string[];
  onDelete?: string;
  onUpdate?: string;
};
type Table = {
  name: string;
  schema: string;
  columns: Record<string, Column>;
  indexes: Record<string, Index>;
  foreignKeys: Record<string, ForeignKey>;
  uniqueConstraints: Record<string, { name: string; columns: string[]; nullsNotDistinct: boolean }>;
  checkConstraints: Record<string, { name: string; value: string }>;
  isRLSEnabled?: boolean;
};
type Snapshot = { tables: Record<string, Table>; enums: Record<string, { name: string; schema: string; values: string[] }> };

type Step = { kind: string; sql: string; note?: string };

const q = (ident: string) => `"${ident.replace(/"/g, '""')}"`;
const trunc = (name: string) => name.slice(0, PG_MAX_IDENT);

function columnType(c: Column): string {
  return c.typeSchema && c.typeSchema !== SCHEMA ? `${q(c.typeSchema)}.${q(c.type)}` : /^[a-z_]+$/.test(c.type) && !isBuiltin(c.type) ? q(c.type) : c.type;
}
function isBuiltin(type: string) {
  return ['uuid', 'text', 'jsonb', 'json', 'integer', 'boolean', 'bigint', 'smallint', 'date', 'real'].includes(type);
}
function columnDefinition(c: Column, opts: { forceNullable?: boolean } = {}): string {
  let sql = `${q(c.name)} ${columnType(c)}`;
  if (c.primaryKey) sql += ' PRIMARY KEY';
  if (c.default !== undefined) sql += ` DEFAULT ${String(c.default)}`;
  if (c.notNull && !c.primaryKey && !opts.forceNullable) sql += ' NOT NULL';
  return sql;
}
function indexSql(table: string, idx: Index): string {
  const cols = idx.columns
    .map((c) => {
      let s = c.isExpression ? c.expression : q(c.expression);
      if (!c.asc) s += ' DESC';
      const defaultNulls = c.asc ? 'last' : 'first';
      if (c.nulls && c.nulls !== defaultNulls) s += ` NULLS ${c.nulls.toUpperCase()}`;
      return s;
    })
    .join(', ');
  return `CREATE ${idx.isUnique ? 'UNIQUE ' : ''}INDEX IF NOT EXISTS ${q(idx.name)} ON ${q(SCHEMA)}.${q(table)} USING ${idx.method || 'btree'} (${cols})${idx.where ? ` WHERE ${idx.where}` : ''}`;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL belum diset (cek apps/web/.env.local).');
    process.exit(1);
  }
  const sql = postgres(databaseUrl, { max: 1, prepare: false, onnotice: () => undefined });

  try {
    const desired = generateDrizzleJson(schema as Record<string, unknown>) as unknown as Snapshot;

    // --- Kondisi database saat ini -------------------------------------------------
    const tableRows = await sql<{ table_name: string }[]>`
      select table_name from information_schema.tables where table_schema = ${SCHEMA} and table_type = 'BASE TABLE'`;
    const existingTables = new Set(tableRows.map((r) => r.table_name));

    const columnRows = await sql<{ table_name: string; column_name: string }[]>`
      select table_name, column_name from information_schema.columns where table_schema = ${SCHEMA}`;
    const existingColumns = new Set(columnRows.map((r) => `${r.table_name}.${r.column_name}`));

    const indexRows = await sql<{ indexname: string }[]>`select indexname from pg_indexes where schemaname = ${SCHEMA}`;
    const existingIndexes = new Set(indexRows.map((r) => r.indexname));

    const constraintRows = await sql<{ conname: string }[]>`
      select c.conname from pg_constraint c join pg_namespace n on n.oid = c.connamespace where n.nspname = ${SCHEMA}`;
    const existingConstraints = new Set(constraintRows.map((r) => r.conname));

    const enumRows = await sql<{ typname: string; enumlabel: string | null }[]>`
      select t.typname, e.enumlabel from pg_type t
      join pg_namespace n on n.oid = t.typnamespace
      left join pg_enum e on e.enumtypid = t.oid
      where n.nspname = ${SCHEMA} and t.typtype = 'e'`;
    const existingEnums = new Map<string, Set<string>>();
    for (const r of enumRows) {
      if (!existingEnums.has(r.typname)) existingEnums.set(r.typname, new Set());
      if (r.enumlabel) existingEnums.get(r.typname)!.add(r.enumlabel);
    }

    const rowCounts = new Map<string, number>();
    async function hasRows(table: string) {
      if (!rowCounts.has(table)) {
        const [r] = await sql.unsafe(`select exists (select 1 from ${q(SCHEMA)}.${q(table)}) as has`);
        rowCounts.set(table, r.has ? 1 : 0);
      }
      return rowCounts.get(table)! > 0;
    }

    // --- Rencana perubahan (urutan penting) ------------------------------------------
    const steps: Step[] = [];
    const warnings: string[] = [];

    for (const e of Object.values(desired.enums)) {
      if (e.schema !== SCHEMA) continue;
      const have = existingEnums.get(e.name);
      if (!have) {
        steps.push({ kind: 'CREATE TYPE', sql: `CREATE TYPE ${q(e.name)} AS ENUM (${e.values.map((v) => `'${v.replace(/'/g, "''")}'`).join(', ')})` });
      } else {
        for (const v of e.values) {
          if (!have.has(v)) steps.push({ kind: 'ADD ENUM VALUE', sql: `ALTER TYPE ${q(e.name)} ADD VALUE IF NOT EXISTS '${v.replace(/'/g, "''")}'` });
        }
      }
    }

    const tables = Object.values(desired.tables).filter((t) => t.schema === SCHEMA || !t.schema);
    const newTables = new Set<string>();

    for (const t of tables) {
      if (existingTables.has(t.name)) continue;
      newTables.add(t.name);
      const cols = Object.values(t.columns).map((c) => columnDefinition(c)).join(',\n  ');
      steps.push({ kind: 'CREATE TABLE', sql: `CREATE TABLE IF NOT EXISTS ${q(SCHEMA)}.${q(t.name)} (\n  ${cols}\n)` });
      if (t.isRLSEnabled) steps.push({ kind: 'ENABLE RLS', sql: `ALTER TABLE ${q(SCHEMA)}.${q(t.name)} ENABLE ROW LEVEL SECURITY` });
    }

    for (const t of tables) {
      if (newTables.has(t.name)) continue;
      for (const c of Object.values(t.columns)) {
        if (existingColumns.has(`${t.name}.${c.name}`)) continue;
        // NOT NULL tanpa default tidak bisa ditambahkan ke tabel berisi data.
        const mustRelax = c.notNull && c.default === undefined && !c.primaryKey && (await hasRows(t.name));
        if (mustRelax) {
          warnings.push(`${t.name}.${c.name} ditambahkan NULLABLE (schema: NOT NULL tanpa default, tabel sudah berisi data). Isi nilainya lalu set NOT NULL manual.`);
        }
        steps.push({
          kind: 'ADD COLUMN',
          sql: `ALTER TABLE ${q(SCHEMA)}.${q(t.name)} ADD COLUMN IF NOT EXISTS ${columnDefinition(c, { forceNullable: mustRelax })}`,
        });
      }
    }

    for (const t of tables) {
      for (const u of Object.values(t.uniqueConstraints)) {
        if (existingConstraints.has(trunc(u.name)) || existingIndexes.has(trunc(u.name))) continue;
        steps.push({
          kind: 'ADD UNIQUE',
          sql: `ALTER TABLE ${q(SCHEMA)}.${q(t.name)} ADD CONSTRAINT ${q(u.name)} UNIQUE${u.nullsNotDistinct ? ' NULLS NOT DISTINCT' : ''} (${u.columns.map(q).join(', ')})`,
        });
      }
    }
    for (const t of tables) {
      for (const ck of Object.values(t.checkConstraints)) {
        if (existingConstraints.has(trunc(ck.name))) continue;
        steps.push({ kind: 'ADD CHECK', sql: `ALTER TABLE ${q(SCHEMA)}.${q(t.name)} ADD CONSTRAINT ${q(ck.name)} CHECK (${ck.value})` });
      }
    }
    for (const t of tables) {
      for (const fk of Object.values(t.foreignKeys)) {
        if (existingConstraints.has(trunc(fk.name))) continue;
        const target = `${q(fk.schemaTo || SCHEMA)}.${q(fk.tableTo)}`;
        steps.push({
          kind: 'ADD FOREIGN KEY',
          sql:
            `ALTER TABLE ${q(SCHEMA)}.${q(t.name)} ADD CONSTRAINT ${q(fk.name)} FOREIGN KEY (${fk.columnsFrom.map(q).join(', ')}) ` +
            `REFERENCES ${target} (${fk.columnsTo.map(q).join(', ')}) ON DELETE ${(fk.onDelete || 'no action').toUpperCase()} ON UPDATE ${(fk.onUpdate || 'no action').toUpperCase()}`,
        });
      }
    }
    for (const t of tables) {
      for (const idx of Object.values(t.indexes)) {
        if (existingIndexes.has(trunc(idx.name))) continue;
        steps.push({ kind: 'CREATE INDEX', sql: indexSql(t.name, idx) });
      }
    }

    // --- Output / eksekusi ------------------------------------------------------------
    if (steps.length === 0) {
      console.log('✅ Database sudah memuat semua tabel, kolom, constraint, dan index dari schema.ts.');
      return;
    }

    console.log(`\n📋 ${steps.length} perubahan aditif${APPLY ? '' : ' (dry-run)'}:`);
    for (const s of steps) console.log(`  [${s.kind}] ${s.sql.replace(/\s+/g, ' ').slice(0, 200)}`);
    for (const w of warnings) console.log(`  ⚠️  ${w}`);

    if (!APPLY) {
      console.log('\nTidak ada yang diubah. Jalankan `npm run db:sync -- --apply` untuk menerapkan.');
      return;
    }

    // Tiap langkah dijalankan terpisah: satu kegagalan (mis. data lama melanggar
    // constraint baru) tidak membatalkan kolom/tabel lain yang sudah aman ditambahkan.
    let ok = 0;
    const failed: { step: Step; error: string }[] = [];
    for (const step of steps) {
      try {
        await sql.unsafe(step.sql);
        ok += 1;
      } catch (error) {
        failed.push({ step, error: error instanceof Error ? error.message : String(error) });
      }
    }
    console.log(`\n✅ ${ok} diterapkan${failed.length ? `, ❌ ${failed.length} gagal:` : '.'}`);
    for (const f of failed) console.log(`  [${f.step.kind}] ${f.step.sql.replace(/\s+/g, ' ').slice(0, 160)}\n    → ${f.error}`);
    if (failed.length) process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error('❌ Sinkronisasi gagal:', error);
  process.exitCode = 1;
});
