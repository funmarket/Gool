import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, LocateFixed, Ticket } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { checkInToWatchEvent } from '../features/watch/api';
import { requestTelegramLocation, notify } from '../lib/telegram';

export function CheckInPage() {
  const { eventId = '' } = useParams();
  const m = useMutation({
    mutationFn: async () => {
      const location = await requestTelegramLocation();
      return checkInToWatchEvent(eventId, {
        latitude: location.latitude,
        longitude: location.longitude,
      });
    },
    onSuccess: () => notify('success'),
  });
  return (
    <div className="page-shell">
      <div className="section-kicker">Presence unlocks perks</div>
      <h1 className="section-title">Venue check-in</h1>
      <div className="surface-card mt-5 p-6 text-center">
        <LocateFixed size={34} className="mx-auto" style={{ color: 'var(--accent)' }} />
        <h2 className="mt-3 text-xl font-black">Check in near the venue</h2>
        <p className="mt-2 text-sm leading-6 muted">
          HOOMA sends your current coordinates only when you tap. The backend accepts a check-in
          within ~250m.
        </p>
        <button className="accent-button mt-5" onClick={() => m.mutate()} disabled={m.isPending}>
          {m.isPending ? 'Locating…' : 'Check in'}
        </button>
      </div>
      {m.data && (
        <section className="mt-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 style={{ color: 'var(--success)' }} />
            <h2 className="text-lg font-black">Checked in</h2>
          </div>
          <div className="mt-3 grid gap-3">
            {m.data.unlockedDeals.length ? (
              m.data.unlockedDeals.map((deal) => (
                <div className="surface-card p-4" key={deal.id}>
                  <Ticket style={{ color: 'var(--accent)' }} />
                  <div className="mt-2 font-black">{deal.title}</div>
                  <div className="text-sm muted">{deal.description}</div>
                  {deal.redemptionCode && (
                    <div
                      className="mt-3 rounded-xl border border-dashed p-3 text-center font-mono font-black"
                      style={{ borderColor: 'var(--accent)' }}
                    >
                      {deal.redemptionCode}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="surface-card p-4 text-sm muted">
                No venue deals are active for this event yet.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
