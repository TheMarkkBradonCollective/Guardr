import {
  CITY_STATUS_LABELS,
  type CityMarketStatus,
  type PlatformCity,
} from './platformCities';

export type CityMarketStatusFilter = 'all' | CityMarketStatus | 'recommended';

export type CityMarketSort = 'name-asc' | 'name-desc' | 'status' | 'updated-desc';

const STATUS_SORT_RANK: Record<CityMarketStatus, number> = {
  open: 0,
  waitlist: 1,
  closed: 2,
};

export function matchesCityMarketSearch(city: PlatformCity, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    city.name,
    city.stateCode,
    CITY_STATUS_LABELS[city.status],
    city.status,
    city.waitlistAudience,
    city.recommendOpen ? 'recommended recommend open' : '',
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(q);
}

export function matchesCityMarketStatusFilter(
  city: PlatformCity,
  filter: CityMarketStatusFilter
): boolean {
  if (filter === 'all') return true;
  if (filter === 'recommended') return city.recommendOpen;
  return city.status === filter;
}

export function sortCityMarkets(cities: PlatformCity[], sort: CityMarketSort): PlatformCity[] {
  const rows = [...cities];
  switch (sort) {
    case 'name-desc':
      return rows.sort((a, b) => b.name.localeCompare(a.name));
    case 'status':
      return rows.sort((a, b) => {
        const rank = STATUS_SORT_RANK[a.status] - STATUS_SORT_RANK[b.status];
        if (rank !== 0) return rank;
        return a.name.localeCompare(b.name);
      });
    case 'updated-desc':
      return rows.sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        if (bTime !== aTime) return bTime - aTime;
        return a.name.localeCompare(b.name);
      });
    case 'name-asc':
    default:
      return rows.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export function filterAndSortCityMarkets(
  cities: PlatformCity[],
  options: {
    search?: string;
    statusFilter?: CityMarketStatusFilter;
    sort?: CityMarketSort;
  }
): PlatformCity[] {
  const search = options.search ?? '';
  const statusFilter = options.statusFilter ?? 'all';
  const sort = options.sort ?? 'name-asc';

  return sortCityMarkets(
    cities.filter(
      (city) => matchesCityMarketSearch(city, search) && matchesCityMarketStatusFilter(city, statusFilter)
    ),
    sort
  );
}

export function countCityMarketsByFilter(
  cities: PlatformCity[],
  search = ''
): Record<CityMarketStatusFilter, number> {
  const searched = cities.filter((city) => matchesCityMarketSearch(city, search));
  return {
    all: searched.length,
    open: searched.filter((city) => city.status === 'open').length,
    closed: searched.filter((city) => city.status === 'closed').length,
    waitlist: searched.filter((city) => city.status === 'waitlist').length,
    recommended: searched.filter((city) => city.recommendOpen).length,
  };
}
