# route_directions_ui

React frontend for entering an address, getting turn-by-turn directions, and
seeing the route on a map. This is a plain REST client - it has no geodata,
routing, or geocoding logic of its own. All of that lives in the separate
[`route_directions_service`](../route_directions_service) backend.

## Architecture

- **React + TypeScript + Vite** for the app shell.
- **[MapLibre GL JS](https://maplibre.org/)** renders the map (`src/components/MapView.tsx`):
  an [OpenFreeMap](https://openfreemap.org/) hosted style for the basemap
  tiles/labels, with the route line and origin/destination markers drawn as
  GeoJSON layers on top, sourced from the backend's response.
- **`src/api/client.ts`** is the only place that talks to the backend -
  three calls: `geocode`, `reverseGeocode`, `getDirections`, all hitting
  `route_directions_service`'s `/api/*` endpoints.
- **Geocoding provider selector** (`App.tsx`): a dropdown lets the user pick
  which of the backend's three geocoding backends (PostGIS trigram search,
  Photon, Nominatim) handles address autocomplete, so they can be compared
  side by side. This has no effect on routing/directions, only on address
  lookup.
- **"Use my location"** uses the browser Geolocation API, then calls the
  backend's reverse-geocode endpoint to turn coordinates into a readable
  label.

```
┌──────────────────────┐        /api/geocode
│  route_directions_ui │ ─────  /api/reverse-geocode  ──▶  route_directions_service
│  (this repo)          │       /api/directions               (separate repo)
└──────────────────────┘
```

## Geodata

This project doesn't load or store any geodata itself - it just renders
whatever `route_directions_service` returns. Before addresses/directions will
resolve to anything real, the backend needs its OpenStreetMap-derived data
loaded (PostGIS addresses table, GraphHopper routing graph, Nominatim and
Photon indexes). See **`route_directions_service`'s README, "One-time data
setup"** section for those steps - this repo has nothing to do until that's
done.

## Running locally

```bash
npm install
npm run dev
```

Opens on `http://localhost:5173`. By default it talks to a
`route_directions_service` backend at `http://localhost:8090`; override with:

```bash
VITE_API_BASE_URL=http://localhost:8090 npm run dev
```

(see `src/api/client.ts` / `src/vite-env.d.ts`).

## Deployment

This is a static site once built - there's no server-side rendering or
runtime Node process.

```bash
npm run build
```

Produces `dist/`. Two things to get right for a real deployment:

1. **`VITE_API_BASE_URL` must be set at build time**, not runtime - Vite
   inlines `import.meta.env.*` values into the built JS. Point it at the
   publicly reachable URL of your deployed `route_directions_service`:

   ```bash
   VITE_API_BASE_URL=https://api.example.com npm run build
   ```

2. **The backend's CORS must allow this site's origin.** Set
   `route_directions_service`'s `CORS_ALLOWED_ORIGINS` env var to this site's
   deployed origin (e.g. `https://directions.example.com`) - its default
   only allows `http://localhost:*`, so a deployed frontend calling a
   deployed backend will otherwise fail with CORS errors in the browser
   console even though the API works fine via `curl`.

Serve `dist/` from any static host (nginx, S3+CloudFront, Netlify, Vercel,
GitHub Pages, etc.) - it's a client-side-routed SPA with a single entry
point (`index.html`), so the host should fall back to `index.html` for
unknown paths if you ever add client-side routes (currently the app is a
single view, so this doesn't yet matter in practice).
