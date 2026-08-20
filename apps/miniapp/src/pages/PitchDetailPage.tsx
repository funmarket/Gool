import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PitchCard } from '../components/venue/PitchCard';
import { getPublicPitch, pitchQueryKeys } from '../features/pitch/api';
import { minorToMajor } from '../lib/format';

export function PitchDetailPage() {
  const { pitchId = '' } = useParams();
  const navigate = useNavigate();
  const pitchQuery = useQuery({
    queryKey: pitchQueryKeys.publicDetail(pitchId),
    queryFn: () => getPublicPitch(pitchId),
    enabled: Boolean(pitchId),
  });

  if (pitchQuery.isPending) {
    return (
      <div className="page-shell vintage-page">
        <div className="vintage-empty h-72 animate-pulse" role="status" aria-live="polite">
          Loading pitch…
        </div>
      </div>
    );
  }

  if (pitchQuery.isError || !pitchQuery.data) {
    return (
      <div className="page-shell vintage-page">
        <div className="vintage-empty" role="alert">
          <strong>Pitch not found.</strong>
          <p className="vintage-copy mt-2">This venue is not available in the public Pitch feed.</p>
          <button type="button" className="ghost-button mt-3" onClick={() => navigate('/pitch')}>
            Back to Pitch
          </button>
        </div>
      </div>
    );
  }

  const pitch = pitchQuery.data;
  const currency = pitch.currency || '';
  const hourlyRate =
    pitch.hourlyRateMinor !== null && currency
      ? minorToMajor(pitch.hourlyRateMinor, currency)
      : 0;

  return (
    <div className="page-shell vintage-page">
      <button type="button" className="ghost-button mb-3" onClick={() => navigate('/pitch')}>
        <ChevronLeft size={18} aria-hidden="true" />
        Back to Pitch
      </button>

      <PitchCard
        id={pitch.id}
        name={pitch.name}
        city={pitch.city || ''}
        houma={pitch.houma || ''}
        pricePerHour={hourlyRate}
        currency={currency}
        photoUrl={pitch.photoUrl}
        address={pitch.fullAddress}
        phone={pitch.publicPhone}
        email={pitch.publicEmail}
        venueType={pitch.venueType}
        description={pitch.description}
        latitude={pitch.latitude}
        longitude={pitch.longitude}
        expanded
      />
    </div>
  );
}
