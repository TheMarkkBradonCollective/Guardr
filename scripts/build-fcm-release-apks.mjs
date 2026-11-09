#!/usr/bin/env node
/**
 * Build unsigned sideload release APKs for com.tmbcworks.guardr and
 * com.tmbcworks.guardr.messenger (debug-signed; no Play upload keystore).
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { GRADLE, prepareAndroidWebBuild, ROOT, run } from './build-android-common.mjs';
import { generateAndroidIcons, withRoleBuildPatches, writeNativeProductAppJs } from './android-role-build.mjs';

const OUT = path.join(ROOT, 'public/download');
const GRADLE_OUT = path.join(ROOT, 'android/app/build/outputs/apk/sideload/release/app-sideload-release.apk');

await mkdir(OUT, { recursive: true });

await prepareAndroidWebBuild({ playStoreBuild: false, runParityAudit: true, removePublicApk: true });

console.log('\n→ Assembling Guardr (com.tmbcworks.guardr)…');
await writeNativeProductAppJs('');
generateAndroidIcons('');
run(GRADLE, ['assembleSideloadRelease'], { cwd: path.join(ROOT, 'android') });
if (!existsSync(GRADLE_OUT)) {
  console.error(`✗ Missing Gradle output: ${GRADLE_OUT}`);
  process.exit(1);
}
await copyFile(GRADLE_OUT, path.join(OUT, 'guardr-release-unsigned.apk'));
await copyFile(GRADLE_OUT, path.join(OUT, 'guardr.apk'));

console.log('\n→ Assembling Messenger (com.tmbcworks.guardr.messenger)…');
await withRoleBuildPatches('messenger', async () => {
  run(GRADLE, ['assembleSideloadRelease', '-PguardrProductApp=messenger'], {
    cwd: path.join(ROOT, 'android'),
  });
});
if (!existsSync(GRADLE_OUT)) {
  console.error(`✗ Missing Gradle output: ${GRADLE_OUT}`);
  process.exit(1);
}
await copyFile(GRADLE_OUT, path.join(OUT, 'guardr-messenger-release-unsigned.apk'));

console.log('\n✓ Artifacts:');
console.log(`  ${path.join(OUT, 'guardr-release-unsigned.apk')}`);
console.log(`  ${path.join(OUT, 'guardr-messenger-release-unsigned.apk')}`);
