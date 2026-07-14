import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { LocationPoint, RouteGeometry } from '../types';

const BASEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const ROUTE_SOURCE_ID = 'route';
const ROUTE_LAYER_ID = 'route-line';

interface MapViewProps {
  origin: LocationPoint | null;
  destination: LocationPoint | null;
  route: RouteGeometry | null;
}

export function MapView({ origin, destination, route }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const originMarkerRef = useRef<maplibregl.Marker | null>(null);
  const destinationMarkerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE_URL,
      center: [-111.5, 40],
      zoom: 5,
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.on('load', () => {
      map.addSource(ROUTE_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
      });
      map.addLayer({
        id: ROUTE_LAYER_ID,
        type: 'line',
        source: ROUTE_SOURCE_ID,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#2563eb', 'line-width': 5, 'line-opacity': 0.85 },
      });
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const applyMarkers = () => {
      originMarkerRef.current?.remove();
      destinationMarkerRef.current?.remove();
      if (origin) {
        originMarkerRef.current = new maplibregl.Marker({ color: '#16a34a' })
          .setLngLat([origin.lon, origin.lat])
          .setPopup(new maplibregl.Popup().setText(origin.label))
          .addTo(map);
      }
      if (destination) {
        destinationMarkerRef.current = new maplibregl.Marker({ color: '#dc2626' })
          .setLngLat([destination.lon, destination.lat])
          .setPopup(new maplibregl.Popup().setText(destination.label))
          .addTo(map);
      }
    };

    const applyRoute = () => {
      const source = map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (!source) {
        return;
      }
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: route?.coordinates ?? [] },
      });
    };

    const fitToContent = () => {
      const points: [number, number][] = [];
      if (origin) points.push([origin.lon, origin.lat]);
      if (destination) points.push([destination.lon, destination.lat]);
      if (route) points.push(...route.coordinates);
      if (points.length === 0) {
        return;
      }
      const bounds = points.reduce(
        (acc, point) => acc.extend(point),
        new maplibregl.LngLatBounds(points[0], points[0]),
      );
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 500 });
    };

    if (map.isStyleLoaded()) {
      applyMarkers();
      applyRoute();
      fitToContent();
    } else {
      map.once('load', () => {
        applyMarkers();
        applyRoute();
        fitToContent();
      });
    }
  }, [origin, destination, route]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
