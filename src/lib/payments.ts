export {
  computeGuardEarnings,
  computeGuardPay,
  computeGuardPayoutCents,
  computePlatformFee,
  DEFAULT_PLATFORM_FEE_CONFIG,
  describePlatformFeeAtRate,
  feePreviewRates,
  LEGACY_PLATFORM_FEE_PER_HOUR,
  normalizePlatformFeeConfig,
  platformFeeModelLabel,
  resolvePlatformFeePerHour,
  TIERED_PLATFORM_FEE_PRESET,
  type PlatformFeeConfig,
  type PlatformFeeModel,
  type PlatformFeeTier,
} from '../../lib/platformFees';

/** @deprecated Use resolvePlatformFeePerHour() or per-job platformFeePerHour. */
export { LEGACY_PLATFORM_FEE_PER_HOUR as PLATFORM_FEE_PER_HOUR } from '../../lib/platformFees';
