import type { DirectionsResponse, GeocodeResult, GeocodingProvider } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8090';

async function getJson<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const url = new URL(path, API_BASE_URL);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request to ${path} failed: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

/** Forward geocoding: free-text address -> candidate matches, via the chosen provider. */
export function geocode(query: string, provider: GeocodingProvider, limit = 5): Promise<GeocodeResult[]> {
  return getJson<GeocodeResult[]>('/api/geocode', { query, limit, provider });
}

/** Reverse geocoding: coordinates -> nearest known address. */
export function reverseGeocode(lat: number, lon: number): Promise<GeocodeResult> {
  return getJson<GeocodeResult>('/api/reverse-geocode', { lat, lon });
}

export function getDirections(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
  profile: string = 'car',
): Promise<DirectionsResponse> {
  return getJson<DirectionsResponse>('/api/directions', { fromLat, fromLon, toLat, toLon, profile });
}
