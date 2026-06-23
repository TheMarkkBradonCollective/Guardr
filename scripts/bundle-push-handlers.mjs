import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['api/_push/handlers.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'api/push/push-handlers.cjs',
  packages: 'external',
});

await esbuild.build({
  entryPoints: ['api/_push/missedCheckins.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'api/push/push-missed-checkins.cjs',
  packages: 'external',
});

console.log('Bundled push handlers for Vercel');
