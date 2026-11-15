import type { VercelRequest, VercelResponse } from '../types.ts';
import { describeNeonConfig } from '../../db/databaseUrl.ts';
import { APK_VERSION_CODE, APP_VERSION } from '../../appVersion.generated.ts';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    status: 'ok',
    version: APP_VERSION,
    apkVersion: APP_VERSION,
    apkVersionCode: APK_VERSION_CODE,
    neonDatabase: describeNeonConfig(),
  });
}
