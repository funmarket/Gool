import { Building2, MapPin, Plus, Search } from 'lucide-react';

export function PitchPage() {
  return (
    <div className="page-shell vintage-page">
      <section className="border-b vintage-rule pb-5 pt-2">
        <div className="flex items-end justify-between gap-4">
          <div><div className="vintage-kicker">Private football venues</div><h1 className="vintage-display text-[64px] leading-none">Pitch</h1><p className="vintage-copy mt-1 text-sm">Find your pitch. Bring the game.</p></div>
          <button className="vintage-outline-cta" type="button"><Plus size={20} /><span className="hidden sm:inline">Add your place</span></button>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-[1fr_auto_auto] gap-2">
        <label className="vintage-control flex items-center gap-3 px-4"><Search size={19} style={{ color: 'var(--hv-lime)' }} /><input className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Search venues, areas..." aria-label="Search pitches" /></label>
        <button className="vintage-control px-4 font-black" type="button"><MapPin className="mr-1 inline" size={15} />City</button>
        <button className="vintage-control px-4 font-black" type="button">Houma</button>
      </section>

      <section className="mt-7">
        <div className="flex items-center justify-between"><div><div className="vintage-kicker">Places to play</div><h2 className="vintage-section-title mt-1 text-[30px]">Nearby venues</h2></div></div>
        {/* Do not fabricate venue cards. When the local/backend Pitch listing source is connected,
            render real photo + venue name + City/Houma + hourly rate + Address/Houma/Contact.
            Use .vintage-pitch-card for that real data. */}
        <div className="vintage-empty mt-4 p-7 text-center">
          <span className="vintage-icon mx-auto"><Building2 /></span>
          <h3 className="vintage-section-title mt-4 text-[26px]">No pitches listed yet</h3>
          <p className="vintage-copy mx-auto mt-2 max-w-sm text-sm">Football venue owners can add their place so HOOMA users can discover and contact them.</p>
          <button className="vintage-outline-cta mt-5" type="button"><Plus size={19} /> Add your place</button>
        </div>
      </section>
    </div>
  );
}
