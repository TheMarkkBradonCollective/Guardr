/**
 * Writes db/neon-schema.sql from supabase/complete_schema_setup.sql
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { toPlainNeonSchema } from '../lib/db/plainNeonSchema.ts';

const sourcePath = resolve(process.cwd(), 'docs/legacy/complete_schema_setup.sql');
const outPath = resolve(process.cwd(), 'db/neon-schema.sql');
const sql = toPlainNeonSchema(readFileSync(sourcePath, 'utf8'));
writeFileSync(outPath, sql, 'utf8');
console.log(`Wrote ${outPath} (${sql.length} bytes)`);
