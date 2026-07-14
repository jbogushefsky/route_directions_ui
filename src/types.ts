export interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
}

export interface RouteInstruction {
  text: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface RouteGeometry {
  type: string;
  coordinates: [number, number][];
}

export interface DirectionsResponse {
  geometry: RouteGeometry;
  instructions: RouteInstruction[];
  distanceMeters: number;
  durationSeconds: number;
}

export interface LocationPoint {
  lat: number;
  lon: number;
  label: string;
}

export type GeocodingProvider = 'postgis' | 'photon' | 'nominatim';
