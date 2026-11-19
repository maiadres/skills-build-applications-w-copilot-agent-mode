import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Workout = {
  title: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ suggestions: Workout[] }>('/api/workouts/suggestions/mona%40example.com')
      .then((data) => setSuggestions(data.suggestions))
      .catch(() => setError('Unable to load workout suggestions'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      {loading && <p role="status">Loading workout suggestions...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && suggestions.length === 0 && <p>No workout suggestions</p>}
      {!loading && !error && suggestions.length > 0 && (
        <ul className="list-group">
          {suggestions.map((suggestion, index) => (
            <li className="list-group-item" key={`${suggestion.title}-${index}`}>
              <strong>{suggestion.title}</strong>
              {suggestion.reason ? <p className="mb-0">{suggestion.reason}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
