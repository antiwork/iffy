import { parseAsString, UrlKeys } from 'nuqs'
 
export const trendsFiltersSearchParams = {
  timeRange: parseAsString.withDefault("24h"),
  flaggedFilter: parseAsString.withDefault("all")
}

export const trendsFiltersUrlKeys: UrlKeys<typeof trendsFiltersSearchParams> = {
    timeRange: 'range',
    flaggedFilter: 'filter'
  }