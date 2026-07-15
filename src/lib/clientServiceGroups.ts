import { CLIENT_SERVICE_OPTIONS, type ClientServiceGroup } from './clientRequestFlow';

export const CLIENT_SERVICE_GROUPS: ClientServiceGroup[] = [
  {
    label: 'Events & venues',
    serviceIds: [
      'nightclub-bar',
      'event-wedding',
      'event-concert',
      'event-festival',
      'event-corporate',
      'event-private',
      'event-other',
    ],
  },
  {
    label: 'Sites & patrol',
    serviceIds: ['standing-guard', 'patrol', 'construction', 'property', 'fire-watch'],
  },
  {
    label: 'Specialized',
    serviceIds: ['executive-protection', 'custom'],
  },
];

export function clientServiceGroups(): ClientServiceGroup[] {
  const byId = new Map(CLIENT_SERVICE_OPTIONS.map((option) => [option.id, option]));
  return CLIENT_SERVICE_GROUPS.map((group) => ({
    ...group,
    options: group.serviceIds
      .map((id) => byId.get(id))
      .filter((option): option is NonNullable<typeof option> => !!option),
  })).filter((group) => group.options.length > 0);
}
