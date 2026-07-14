import { useEffect, useRef, useState } from 'react';
import { geocode } from '../api/client';
import type { GeocodeResult, GeocodingProvider, LocationPoint } from '../types';

interface AddressInputProps {
  label: string;
  placeholder: string;
  value: LocationPoint | null;
  onChange: (point: LocationPoint | null) => void;
  provider: GeocodingProvider;
}

const DEBOUNCE_MS = 300;

export function AddressInput({ label, placeholder, value, onChange, provider }: AddressInputProps) {
  const [query, setQuery] = useState(value?.label ?? '');
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setQuery(value?.label ?? '');
  }, [value]);

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery);
    onChange(null);
    clearTimeout(debounceRef.current);

    if (nextQuery.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await geocode(nextQuery, provider);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch (error) {
        console.error('Geocode search failed', error);
      }
    }, DEBOUNCE_MS);
  }

  function handleSelect(result: GeocodeResult) {
    setQuery(result.displayName);
    setIsOpen(false);
    onChange({ lat: result.lat, lon: result.lon, label: result.displayName });
  }

  return (
    <div className="address-input">
      <label>{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        onFocus={() => setIsOpen(suggestions.length > 0)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
      />
      {isOpen && (
        <ul className="address-suggestions">
          {suggestions.map((result, index) => (
            <li key={`${result.lat}-${result.lon}-${index}`} onMouseDown={() => handleSelect(result)}>
              {result.displayName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
