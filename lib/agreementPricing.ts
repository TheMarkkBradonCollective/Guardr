import {
  computeJobBilling,
  normalizeAgreementFeeConfig,
  type AgreementPlatformFeeConfig,
  type PlatformFeeConfig,
} from './platformFees';

export type PricingMode = 'standard' | 'open_contract';

export type PriceOfferParty = 'client' | 'guard';

export type PriceOfferStatus = 'pending' | 'accepted' | 'superseded' | 'withdrawn';

export interface PriceNegotiationOffer {
  id: string;
  offeredBy: PriceOfferParty;
  offeredByUserId: string;
  hourlyRate: number;
  agreementFeeConfig?: AgreementPlatformFeeConfig;
  message?: string;
  createdAt: string;
  status: PriceOfferStatus;
}

export interface GuardPriceNegotiation {
  guardId: string;
  offers: PriceNegotiationOffer[];
  status: 'negotiating' | 'agreed';
  agreedOfferId?: string;
  agreedAt?: string;
}

export interface OpeningPriceOffer {
  hourlyRate: number;
  agreementFeeConfig?: AgreementPlatformFeeConfig;
  message?: string;
}

export function isOpenContractPricing(
  pricingMode?: PricingMode | null
): pricingMode is 'open_contract' {
  return pricingMode === 'open_contract';
}

export function createPriceOffer(input: {
  offeredBy: PriceOfferParty;
  offeredByUserId: string;
  hourlyRate: number;
  agreementFeeConfig?: AgreementPlatformFeeConfig;
  message?: string;
}): PriceNegotiationOffer {
  return {
    id: `offer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    offeredBy: input.offeredBy,
    offeredByUserId: input.offeredByUserId,
    hourlyRate: Math.max(0, input.hourlyRate),
    agreementFeeConfig: normalizeAgreementFeeConfig(input.agreementFeeConfig),
    message: input.message?.trim() || undefined,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
}

export function getGuardNegotiation(
  negotiations: GuardPriceNegotiation[] | undefined,
  guardId: string
): GuardPriceNegotiation | undefined {
  return negotiations?.find((n) => n.guardId === guardId);
}

export function getActivePriceOffer(
  negotiation: GuardPriceNegotiation | undefined
): PriceNegotiationOffer | undefined {
  if (!negotiation) return undefined;
  const pending = [...negotiation.offers]
    .reverse()
    .find((o) => o.status === 'pending');
  return pending;
}

export function getAgreedPriceOffer(
  negotiation: GuardPriceNegotiation | undefined
): PriceNegotiationOffer | undefined {
  if (!negotiation?.agreedOfferId) return undefined;
  return negotiation.offers.find((o) => o.id === negotiation.agreedOfferId);
}

export function supersedePendingOffers(offers: PriceNegotiationOffer[]): PriceNegotiationOffer[] {
  return offers.map((o) =>
    o.status === 'pending' ? { ...o, status: 'superseded' as const } : o
  );
}

export function appendGuardPriceOffer(
  negotiations: GuardPriceNegotiation[] | undefined,
  guardId: string,
  offer: PriceNegotiationOffer
): GuardPriceNegotiation[] {
  const existing = getGuardNegotiation(negotiations, guardId);
  const base: GuardPriceNegotiation = existing ?? {
    guardId,
    offers: [],
    status: 'negotiating',
  };
  const nextOffers = [...supersedePendingOffers(base.offers), offer];
  const next: GuardPriceNegotiation = {
    ...base,
    offers: nextOffers,
    status: 'negotiating',
    agreedOfferId: undefined,
    agreedAt: undefined,
  };
  const others = (negotiations ?? []).filter((n) => n.guardId !== guardId);
  return [...others, next];
}

export function acceptGuardPriceOffer(
  negotiations: GuardPriceNegotiation[] | undefined,
  guardId: string,
  offerId: string
): { negotiations: GuardPriceNegotiation[]; offer?: PriceNegotiationOffer } {
  const existing = getGuardNegotiation(negotiations, guardId);
  if (!existing) return { negotiations: negotiations ?? [] };
  const offer = existing.offers.find((o) => o.id === offerId && o.status === 'pending');
  if (!offer) return { negotiations: negotiations ?? [] };

  const agreedAt = new Date().toISOString();
  const nextOffers = existing.offers.map((o) => {
    if (o.id === offerId) return { ...o, status: 'accepted' as const };
    if (o.status === 'pending') return { ...o, status: 'superseded' as const };
    return o;
  });
  const next: GuardPriceNegotiation = {
    ...existing,
    offers: nextOffers,
    status: 'agreed',
    agreedOfferId: offerId,
    agreedAt,
  };
  const others = (negotiations ?? []).filter((n) => n.guardId !== guardId);
  return { negotiations: [...others, next], offer };
}

export function applyAgreedOfferToJobBilling(input: {
  offer: PriceNegotiationOffer;
  durationHours: number;
  guardsNeeded: number;
  globalFeeConfig: PlatformFeeConfig;
}): {
  hourlyRate: number;
  guardPay: number;
  platformFeePerHour: number;
  estimatedPayout: number;
  agreementFeeConfig?: AgreementPlatformFeeConfig;
} {
  return computeJobBilling(
    input.offer.hourlyRate,
    input.durationHours,
    input.guardsNeeded,
    input.globalFeeConfig,
    input.offer.agreementFeeConfig
  );
}

export function pricingModeLabel(mode?: PricingMode): string {
  return mode === 'open_contract' ? 'Open contract' : 'Standard rate';
}

export function describeAgreementFee(
  agreement?: AgreementPlatformFeeConfig | null
): string {
  const normalized = normalizeAgreementFeeConfig(agreement);
  if (!normalized) return 'Platform default fee';
  if (normalized.model === 'flat') {
    return `$${normalized.flatFeePerHour ?? 0}/hr flat platform fee`;
  }
  return `${Math.round((normalized.percentRate ?? 0) * 1000) / 10}% platform fee`;
}
