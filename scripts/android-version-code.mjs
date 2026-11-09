/**
 * Android versionCode shared by every Guardr role APK.
 *
 * Phones already have the customer beta 1.0.131 (versionCode 231). The old
 * scheme major*100 + minor*10 + patch turns 1.1.0 into 110, and Android
 * refuses that as a downgrade. major*1000 + minor*100 + patch turns
 * 1.1.0-cf-beta into 1100, which is above 231 for every role.
 */
export const INSTALLED_CUSTOMER_BETA_VERSION_CODE = 231;

export function androidVersionCode(version) {
  const numeric = String(version || '0').split('-')[0];
  const parts = numeric.split('.').map((part) => Number.parseInt(part, 10) || 0);
  return parts[0] * 1000 + (parts[1] || 0) * 100 + (parts[2] || 0);
}
