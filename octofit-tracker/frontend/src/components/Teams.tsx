import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = {
  name: string;
  mascot?: string;
  members?: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch(() => setError('Unable to load teams'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard title="Teams" description="Manage teams and members.">
      {loading && <p role="status">Loading teams...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && teams.length === 0 && <p>No teams</p>}
      {!loading && !error && teams.length > 0 && (
        <ul className="list-group">
          {teams.map((team, index) => (
            <li className="list-group-item" key={`${team.name}-${index}`}>
              <strong>{team.name}</strong>
              {team.mascot ? ` - ${team.mascot}` : ''}
              {team.members?.length ? ` (${team.members.length} members)` : ' (0 members)'}
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
