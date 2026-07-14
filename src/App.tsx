import { useState } from 'react';
import './App.css';
import { AddressInput } from './components/AddressInput';
import { DirectionsPanel } from './components/DirectionsPanel';
import { MapView } from './components/MapView';
import { getDirections, reverseGeocode } from './api/client';
import type { DirectionsResponse, GeocodingProvider, LocationPoint } from './types';

const GEOCODING_PROVIDERS: { value: GeocodingProvider; label: string }[] = [
  { value: 'postgis', label: 'PostGIS (trigram search)' },
  { value: 'photon', label: 'Photon' },
  { value: 'nominatim', label: 'Nominatim' },
];

function App() {
  const [origin, setOrigin] = useState<LocationPoint | null>(null);
  const [destination, setDestination] = useState<LocationPoint | null>(null);
  const [directions, setDirections] = useState<DirectionsResponse | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [provider, setProvider] = useState<GeocodingProvider>('postgis');

  function useMyLocation() {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by this browser.');
      return;
    }
    setIsLoadingLocation(true);
    setErrorMessage(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const result = await reverseGeocode(latitude, longitude);
          setOrigin({ lat: result.lat, lon: result.lon, label: result.displayName });
        } catch (error) {
          console.error('Reverse geocode failed', error);
          setOrigin({ lat: latitude, lon: longitude, label: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` });
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation failed', error);
        setErrorMessage('Could not determine your location.');
        setIsLoadingLocation(false);
      },
    );
  }

  async function handleGetDirections() {
    if (!origin || !destination) {
      setErrorMessage('Choose both an origin and a destination first.');
      return;
    }
    setErrorMessage(null);
    setIsLoadingDirections(true);
    try {
      const result = await getDirections(origin.lat, origin.lon, destination.lat, destination.lon);
      setDirections(result);
    } catch (error) {
      console.error('Directions request failed', error);
      setErrorMessage('Could not calculate directions between those locations.');
    } finally {
      setIsLoadingDirections(false);
    }
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h1>Directions</h1>
        <div className="provider-select">
          <label htmlFor="geocoding-provider">Geocoding provider</label>
          <select
            id="geocoding-provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value as GeocodingProvider)}
          >
            {GEOCODING_PROVIDERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <AddressInput label="Origin" placeholder="Enter starting address" value={origin} onChange={setOrigin} provider={provider} />
        <button type="button" className="secondary-button" onClick={useMyLocation} disabled={isLoadingLocation}>
          {isLoadingLocation ? 'Locating…' : 'Use my location'}
        </button>
        <AddressInput label="Destination" placeholder="Enter destination address" value={destination} onChange={setDestination} provider={provider} />
        <button type="button" className="primary-button" onClick={handleGetDirections} disabled={isLoadingDirections}>
          {isLoadingDirections ? 'Calculating…' : 'Get Directions'}
        </button>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        <DirectionsPanel directions={directions} />
      </aside>
      <main className="map-container">
        <MapView origin={origin} destination={destination} route={directions?.geometry ?? null} />
      </main>
    </div>
  );
}

export default App;
