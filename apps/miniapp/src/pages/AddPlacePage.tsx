import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { placeCategories } from '@hooma/contracts';
import { useNavigate } from 'react-router-dom';
import { notify, requestTelegramLocation } from '../lib/telegram';
import { post } from '../shared/api/http-client';
import { useCommunity } from '../providers/CommunityProvider';
import type { Place } from '../types/domain';

type MenuDraft = { name: string; priceLabel: string };

const emptyMenu: MenuDraft[] = [
  { name: '', priceLabel: '' },
  { name: '', priceLabel: '' },
  { name: '', priceLabel: '' },
];

export function AddPlacePage() {
  const { active } = useCommunity();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [category, setCategory] =
    useState<(typeof placeCategories)[number]>('Sports cafe & lounge');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [houma, setHouma] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [contactName, setContactName] = useState('');
  const [claimNote, setClaimNote] = useState('');
  const [menuItems, setMenuItems] = useState<MenuDraft[]>(emptyMenu);

  const canSubmit = Boolean(
    active &&
    name.trim().length >= 2 &&
    address.trim().length >= 2 &&
    latitude &&
    longitude &&
    photoUrl.trim() &&
    (phone.trim() || email.trim()),
  );

  const create = useMutation({
    mutationFn: () =>
      post<Place>('/api/v1/watch/places', {
        communityId: active?.id,
        name: name.trim(),
        category: category.trim(),
        description: description.trim() || undefined,
        address: address.trim(),
        city: city.trim() || undefined,
        houma: houma.trim() || undefined,
        latitude: Number(latitude),
        longitude: Number(longitude),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        photoUrl: photoUrl.trim(),
        makeFanHub: true,
        menuItems: menuItems
          .filter((item) => item.name.trim())
          .map((item) => ({
            name: item.name.trim(),
            priceLabel: item.priceLabel.trim() || undefined,
          })),
        ownerClaim: {
          businessName: name.trim(),
          contactName: contactName.trim() || undefined,
          contactPhone: phone.trim() || undefined,
          contactEmail: email.trim() || undefined,
          note: claimNote.trim() || undefined,
        },
      }),
    onSuccess: (place) => {
      notify('success');
      navigate('/watch/places', { state: { createdPlaceId: place.id } });
    },
    onError: () => notify('error'),
  });

  const handleCurrentLocation = async () => {
    try {
      const location = await requestTelegramLocation();
      setLatitude(String(location.latitude));
      setLongitude(String(location.longitude));
      notify('success');
    } catch {
      notify('error');
    }
  };

  const updateMenu = (index: number, field: keyof MenuDraft, value: string) => {
    setMenuItems((items) =>
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    );
  };

  return (
    <div className="page-shell vintage-page">
      <div className="section-kicker">Business owner</div>
      <h1 className="section-title">Add a Place</h1>
      <div className="surface-card mt-5 p-4">
        <div className="grid gap-3">
          <label className="text-xs font-black">
            Business name
            <input
              className="hooma-input mt-1"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="text-xs font-black">
            Type
            <select
              className="hooma-input mt-1"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as (typeof placeCategories)[number])
              }
            >
              {placeCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-black">
            Photo URL *
            <input
              className="hooma-input mt-1"
              value={photoUrl}
              onChange={(event) => setPhotoUrl(event.target.value)}
              placeholder="https://..."
            />
          </label>
          <label className="text-xs font-black">
            About
            <textarea
              className="hooma-input mt-1 min-h-24"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <label className="text-xs font-black">
            Address
            <input
              className="hooma-input mt-1"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-black">
              City
              <input
                className="hooma-input mt-1"
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            </label>
            <label className="text-xs font-black">
              Houma
              <input
                className="hooma-input mt-1"
                value={houma}
                onChange={(event) => setHouma(event.target.value)}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-black">
              Latitude
              <input
                className="hooma-input mt-1"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
              />
            </label>
            <label className="text-xs font-black">
              Longitude
              <input
                className="hooma-input mt-1"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
              />
            </label>
          </div>
          <button
            type="button"
            className="ghost-button"
            onClick={() => void handleCurrentLocation()}
          >
            Use current location
          </button>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-black">
              Phone *
              <input
                className="hooma-input mt-1"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>
            <label className="text-xs font-black">
              Email *
              <input
                className="hooma-input mt-1"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
          </div>
          <p className="text-xs leading-5 muted">
            Provide at least one public contact method: phone or email.
          </p>
          <label className="text-xs font-black">
            Website
            <input
              className="hooma-input mt-1"
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
            />
          </label>
          <div className="grid gap-2">
            <div className="text-xs font-black">Menu preview</div>
            {menuItems.map((item, index) => (
              <div key={index} className="grid grid-cols-[1fr_96px] gap-2">
                <input
                  className="hooma-input"
                  value={item.name}
                  onChange={(event) => updateMenu(index, 'name', event.target.value)}
                  placeholder="Item"
                />
                <input
                  className="hooma-input"
                  value={item.priceLabel}
                  onChange={(event) => updateMenu(index, 'priceLabel', event.target.value)}
                  placeholder="Price"
                />
              </div>
            ))}
          </div>
          <label className="text-xs font-black">
            Owner/contact name
            <input
              className="hooma-input mt-1"
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
            />
          </label>
          <label className="text-xs font-black">
            Claim note
            <textarea
              className="hooma-input mt-1 min-h-20"
              value={claimNote}
              onChange={(event) => setClaimNote(event.target.value)}
            />
          </label>
          <button
            className="accent-button mt-2 w-full"
            disabled={!canSubmit || create.isPending}
            onClick={() => create.mutate()}
          >
            Add place
          </button>
        </div>
      </div>
    </div>
  );
}
