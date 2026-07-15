import { Certification } from '../types';
import { certDisplayName } from './certCatalog';

export function credentialMatchesSearch(cert: Certification, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return (
    certDisplayName(cert).toLowerCase().includes(normalized) ||
    (cert.issuer ?? '').toLowerCase().includes(normalized) ||
    (cert.number ?? '').toLowerCase().includes(normalized) ||
    (cert.name ?? '').toLowerCase().includes(normalized) ||
    (cert.state ?? '').toLowerCase().includes(normalized)
  );
}

export function approvalFeedItemMatchesSearch(
  item: { title: string; subtitle: string; statusLabel: string },
  query: string
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return (
    item.title.toLowerCase().includes(normalized) ||
    item.subtitle.toLowerCase().includes(normalized) ||
    item.statusLabel.toLowerCase().includes(normalized)
  );
}
