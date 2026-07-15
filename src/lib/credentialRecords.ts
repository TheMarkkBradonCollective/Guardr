export type CredentialRecordStatus = 'verified' | 'pending' | 'rejected';

export interface CredentialRecordImage {
  id: string;
  label: string;
  url: string;
}

export interface CredentialRecordDetail {
  label: string;
  value: string;
}

export interface CredentialRecordDisplayItem {
  id: string;
  recordedAt: string;
  label: string;
  status: CredentialRecordStatus;
  thumbnailUrl?: string;
  note?: string;
  number?: string;
  isCurrentOnFile?: boolean;
  isPendingReview?: boolean;
  details?: CredentialRecordDetail[];
  images?: CredentialRecordImage[];
}

export function credentialRecordThumbnail(item: CredentialRecordDisplayItem): string | undefined {
  return item.thumbnailUrl ?? item.images?.[0]?.url;
}

export function credentialRecordImages(item: CredentialRecordDisplayItem): CredentialRecordImage[] {
  if (item.images?.length) return item.images;
  if (item.thumbnailUrl) {
    return [{ id: `${item.id}-image`, label: item.label, url: item.thumbnailUrl }];
  }
  return [];
}
