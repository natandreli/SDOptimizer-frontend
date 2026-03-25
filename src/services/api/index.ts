import axios from 'axios'
import { API_URL } from '@/config'
import qs from 'qs'

export const apiFetcher = axios.create({
  baseURL: API_URL + '/api',
  withCredentials: true,
  paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
})

/**
 * Check if the API is healthy.
 */
export async function checkApiHealth(): Promise<{ status: string; service?: string }> {
  const response = await apiFetcher.get('/health')
  return response.data
}
