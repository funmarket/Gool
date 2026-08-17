import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, LocateFixed, Ticket } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { post } from '../shared/api/http-client';
import { requestTelegramLocation, notify } from '../lib/telegram';
type Result = {
  unlockedDeals: Array<{
    id: string;
    title: string;
    description?: string | null;
    redemptionCode?: string | null;
  }>;
};
export function CheckInPage() {
  const { eventId = '' } = useParams();
  const m = useMutation({
    mutationFn: async () => {
      const l = await requestTelegramLocation();
      return post<Result>(`/api/v1/watch/events/${eventId}/check-in`, {
        latitude: l.latitude,
        longitude: l.longitude,
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
              m.data.unlockedDeals.map((d) => (
                <div className="surface-card p-4" key={d.id}>
                  <Ticket style={{ color: 'var(--accent)' }} />
                  <div className="mt-2 font-black">{d.title}</div>
                  <div className="text-sm muted">{d.description}</div>
                  {d.redemptionCode && (
                    <div
                      className="mt-3 rounded-xl border border-dashed p-3 text-center font-mono font-black"
                      style={{ borderColor: 'var(--accent)' }}
                    >
                      {d.redemptionCode}
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
