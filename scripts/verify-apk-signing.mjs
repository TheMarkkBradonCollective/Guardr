#!/usr/bin/env node
/**
 * Confirm an APK was signed with the existing upload keystore.
 * Prints only a match/mismatch. Never prints passwords or the keystore.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

function readProps(propsPath) {
  const props = {};
  for (const line of readFileSync(propsPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    props[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return props;
}

function certificateSha256(args, secret) {
  const result = spawnSync('keytool', args, { encoding: 'utf8' });
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  const redacted = secret ? output.split(secret).join('[redacted]') : output;
  if (result.status !== 0) {
    console.error(redacted);
    process.exit(result.status || 1);
  }
  const match = output.match(/SHA256:\s*([0-9A-Fa-f:]+)/);
  if (!match) {
    console.error('keytool did not print a SHA256 certificate fingerprint');
    process.exit(1);
  }
  return match[1].toUpperCase();
}

const apk = process.argv[2];
if (!apk) {
  console.error('Usage: node scripts/verify-apk-signing.mjs <apk>');
  process.exit(1);
}

const propsPath = path.resolve('android/keystore.properties');
if (!existsSync(propsPath)) {
  console.error('android/keystore.properties is missing. Refusing to publish an APK signed with a new key.');
  process.exit(1);
}

const props = readProps(propsPath);
if (!props.storeFile || !props.storePassword || !props.keyAlias) {
  console.error('android/keystore.properties is incomplete. Refusing to publish.');
  process.exit(1);
}

const storePath = path.resolve('android', props.storeFile);
const apkSha = certificateSha256(['-printcert', '-jarfile', apk], props.storePassword);
const storeSha = certificateSha256(
  ['-list', '-v', '-keystore', storePath, '-storepass', props.storePassword, '-alias', props.keyAlias],
  props.storePassword,
);

if (apkSha !== storeSha) {
  console.error(`${path.basename(apk)} certificate does not match the existing upload keystore.`);
  process.exit(1);
}

console.log(`${path.basename(apk)} is signed with the existing upload keystore.`);
