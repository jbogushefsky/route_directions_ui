import type { DirectionsResponse } from '../types';

interface DirectionsPanelProps {
  directions: DirectionsResponse | null;
}

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
}

export function DirectionsPanel({ directions }: DirectionsPanelProps) {
  if (!directions) {
    return <div className="directions-panel directions-panel-empty">Enter an origin and destination, then click "Get Directions".</div>;
  }

  return (
    <div className="directions-panel">
      <div className="directions-summary">
        {formatDistance(directions.distanceMeters)} &middot; {formatDuration(directions.durationSeconds)}
      </div>
      <ol className="directions-steps">
        {directions.instructions.map((instruction, index) => (
          <li key={index}>
            <span className="directions-step-text">{instruction.text}</span>
            <span className="directions-step-distance">{formatDistance(instruction.distanceMeters)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
