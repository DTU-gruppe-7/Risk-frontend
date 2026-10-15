import { queryOptions, type QueryKey } from '@tanstack/react-query'
import { api, type RequestOptions } from '../client'

/** Builds typed query options for a GET endpoint. The result can be passed to
 *  useQuery, prefetchQuery, and gives a typed queryKey for setQueryData.
 */
export function apiQuery<TData, Tkey extends QueryKey = QueryKey>(
  queryKey: Tkey,
  path: string,
  options?: Omit<RequestOptions, 'signal'>,
) {
  return queryOptions({
    queryKey,
    //TanStack provides the signal and aborts it when the query is no longer needed.
    queryFn: ({ signal }) => api.get<TData>(path, { ...options, signal }),
  })
}
