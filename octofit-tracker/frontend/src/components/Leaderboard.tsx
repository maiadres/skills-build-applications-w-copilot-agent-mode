import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => setLeaderboard(data.leaderboard))
      .catch(() => setError('Unable to load leaderboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      {loading && <p role="status">Loading leaderboard...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && leaderboard.length === 0 && <p>No leaderboard scores</p>}
      {!loading && !error && leaderboard.length > 0 && (
        <ol className="list-group list-group-numbered">
          {leaderboard.map((entry) => (
            <li className="list-group-item d-flex justify-content-between" key={`${entry.rank}-${entry.teamName}`}>
              <strong>{entry.teamName}</strong>
              <span>{entry.totalPoints} points</span>
            </li>
          ))}
        </ol>
      )}
    </CapabilityCard>
  );
}
