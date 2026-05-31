// Apply SQL migrations in supabase/migrations/ to the database in SUPABASE_DB_URL.
// Run from the project root:  node scripts/db-apply.mjs
// Migrations are written idempotent, so re-running is safe.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Minimal .env reader (no extra deps).
const env = Object.fromEntries(
	readFileSync(join(root, '.env'), 'utf8')
		.split('\n')
		.map((l) => l.trim())
		.filter((l) => l && !l.startsWith('#') && l.includes('='))
		.map((l) => {
			const i = l.indexOf('=');
			return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
		})
);

const connectionString = env.SUPABASE_DB_URL;
if (!connectionString) {
	console.error('SUPABASE_DB_URL is missing from .env');
	process.exit(1);
}

const dir = join(root, 'supabase', 'migrations');
const files = readdirSync(dir)
	.filter((f) => f.endsWith('.sql'))
	.sort();

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
	await client.connect();
	console.log('connected:', connectionString.replace(/:[^:@/]+@/, ':****@'));
	for (const f of files) {
		const sql = readFileSync(join(dir, f), 'utf8');
		console.log(`\n── applying ${f} ──`);
		await client.query(sql);
		console.log(`✓ ${f}`);
	}

	const { rows } = await client.query(
		`select table_name from information_schema.tables
		 where table_schema = 'public' order by table_name`
	);
	console.log('\npublic tables:', rows.map((r) => r.table_name).join(', '));
} catch (err) {
	console.error('\n✗ migration failed:', err.message);
	process.exitCode = 1;
} finally {
	await client.end();
}
