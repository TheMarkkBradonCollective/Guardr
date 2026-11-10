/**
 * Playwright preview: build the site and serve it with the local Worker.
 *
 * Unauthenticated e2e leaves the Worker unbound to a database.
 * QA_E2E_AUTH=1 writes a temporary env file outside the repo so Wrangler binds
 * DATABASE_URL and JWT_SECRET for the QA Neon branch, then deletes that file.
 *
 * VITE_APP_URL and VITE_SUPABASE_* are cleared so the preview calls its own
 * origin instead of a remote Worker or a dead Supabase host.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const auth = process.env.QA_E2E_AUTH === '1';
const env = { ...process.env };
delete env.VITE_APP_URL;
delete env.VITE_SUPABASE_URL;
delete env.VITE_SUPABASE_ANON_KEY;

let envDir = null;

function cleanup() {
  if (!envDir) return;
  rmSync(envDir, { recursive: true, force: true });
  envDir = null;
}

let envFile = null;
if (auth) {
  const databaseUrl = process.env.QA_DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error('QA_E2E_AUTH=1 requires QA_DATABASE_URL (pooled Neon URL for the QA branch).');
    process.exit(2);
  }
  const jwt = process.env.QA_JWT_SECRET?.trim() || 'qa-e2e-local-jwt';
  envDir = mkdtempSync(path.join(tmpdir(), 'guardr-qa-e2e-'));
  envFile = path.join(envDir, 'worker.env');
  writeFileSync(
    envFile,
    `DATABASE_URL=${JSON.stringify(databaseUrl)}\nJWT_SECRET=${JSON.stringify(jwt)}\n`,
    { mode: 0o600 }
  );
  console.log('QA auth e2e: Worker will use the QA database binding.');
}

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { env, stdio: 'inherit' });
    const forward = (signal) => {
      child.kill(signal);
    };
    process.on('SIGINT', forward);
    process.on('SIGTERM', forward);
    child.on('exit', (code, signal) => {
      process.off('SIGINT', forward);
      process.off('SIGTERM', forward);
      resolve(code ?? (signal ? 1 : 0));
    });
  });
}

process.on('exit', cleanup);

const buildCode = await run('npm', ['run', 'build']);
if (buildCode !== 0) {
  cleanup();
  process.exit(buildCode);
}

const previewArgs = ['wrangler', 'dev', '--port', '4173'];
if (envFile) previewArgs.push('--env-file', envFile);
const previewCode = await run('npx', previewArgs);
cleanup();
process.exit(previewCode);
