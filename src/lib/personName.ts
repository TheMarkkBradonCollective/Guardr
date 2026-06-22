export interface PersonNameParts {
  firstName: string;
  middleName?: string;
  lastName: string;
}

export function formatPersonName(parts: PersonNameParts): string {
  return [parts.firstName, parts.middleName, parts.lastName].filter(Boolean).join(' ').trim();
}

/** Split a legacy full name into first / middle / last. */
export function parsePersonName(fullName: string): PersonNameParts {
  const tokens = fullName.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { firstName: '', lastName: '' };
  if (tokens.length === 1) return { firstName: tokens[0], lastName: '' };
  if (tokens.length === 2) return { firstName: tokens[0], lastName: tokens[1] };
  return {
    firstName: tokens[0],
    middleName: tokens.slice(1, -1).join(' '),
    lastName: tokens[tokens.length - 1],
  };
}

export function resolvePersonNameParts(
  row: Partial<PersonNameParts> & { name?: string }
): PersonNameParts & { name: string } {
  const firstName = row.firstName?.trim() ?? '';
  const middleName = row.middleName?.trim() ?? '';
  const lastName = row.lastName?.trim() ?? '';

  if (firstName || middleName || lastName) {
    const parts = {
      firstName,
      middleName: middleName || undefined,
      lastName,
    };
    return { ...parts, name: formatPersonName(parts) };
  }

  const parsed = parsePersonName(row.name ?? '');
  return { ...parsed, name: formatPersonName(parsed) };
}

export function personNameFromPayload(parts: PersonNameParts): PersonNameParts & { name: string } {
  const normalized = {
    firstName: parts.firstName.trim(),
    middleName: parts.middleName?.trim() || undefined,
    lastName: parts.lastName.trim(),
  };
  return { ...normalized, name: formatPersonName(normalized) };
}
