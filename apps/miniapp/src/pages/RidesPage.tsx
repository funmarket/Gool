import { useQuery } from '@tanstack/react-query';
import { Clock3, MapPin, Plus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RideBallIcon } from '../components/icons/SoccerIcons';
import { get } from '../shared/api/http-client';
import { eventDate, money } from '../lib/format';
import { useCommunity } from '../providers/CommunityProvider';
import type { RideListResponse } from '../types/domain';

export function RidesPage() {
  const { active } = useCommunity();
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ['rides', active?.id],
    queryFn: () => get<RideListResponse>(`/api/v1/rides?communityId=${active?.id}`),
    enabled: Boolean(active),
  });

  return (
    <div className="page-shell">
      <div className="flex items-end justify-between">
        <div>
          <div className="section-kicker">Matchday movement</div>
          <h1 className="section-title">Ride</h1>
          <p className="mt-1 text-sm muted">
            Ride offers and ride requests stay separate until matched.
          </p>
        </div>
        <button className="accent-button p-3" onClick={() => navigate('/rides/new')}>
          <Plus />
        </button>
      </div>

      <div className="mt-6 section-kicker">Available seats</div>
      <div className="mt-3 grid gap-3">
        {query.data?.offers.map((ride) => {
          const used = (ride.matches || [])
            .filter((match) => ['REQUESTED', 'ACCEPTED'].includes(match.status))
            .reduce((sum, match) => sum + match.seats, 0);
          const remaining = Math.max(0, ride.seatsTotal - used);
          return (
            <article key={ride.id} className="surface-card p-4">
              <div className="flex gap-3">
                <span className="icon-well">
                  <RideBallIcon className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="section-kicker">Seats offered</span>
                  <h2 className="mt-1 text-lg font-black">{ride.title}</h2>
                  <div className="mt-3 grid gap-2 text-xs font-bold muted">
                    <span className="flex gap-2">
                      <MapPin size={14} /> {ride.originLabel} → {ride.destinationLabel}
                    </span>
                    <span className="flex gap-2">
                      <Clock3 size={14} /> {eventDate(ride.departureAt)}
                    </span>
                    <span className="flex gap-2">
                      <Users size={14} /> {remaining} seats ·{' '}
                      {ride.costSplitMode === 'FREE'
                        ? 'Free'
                        : `${money(ride.seatPriceMinor, ride.currency)} / seat`}
                    </span>
                  </div>
                </div>
              </div>
              <button
                className="ghost-button mt-4 w-full"
                onClick={() => navigate(`/rides/${ride.id}`)}
              >
                View ride
              </button>
            </article>
          );
        })}
      </div>

      <div className="mt-7 section-kicker">People looking for rides</div>
      <div className="mt-3 grid gap-3">
        {query.data?.requests.map((request) => (
          <article key={request.id} className="surface-card p-4">
            <span className="section-kicker">Ride needed</span>
            <h2 className="mt-1 text-lg font-black">{request.title}</h2>
            <div className="mt-3 grid gap-2 text-xs font-bold muted">
              <span className="flex gap-2">
                <MapPin size={14} /> {request.pickupLabel}
              </span>
              <span className="flex gap-2">
                <Clock3 size={14} /> {eventDate(request.desiredDepartureAt)}
              </span>
              <span className="flex gap-2">
                <Users size={14} /> {request.seatsNeeded} seat{request.seatsNeeded === 1 ? '' : 's'}{' '}
                needed
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
