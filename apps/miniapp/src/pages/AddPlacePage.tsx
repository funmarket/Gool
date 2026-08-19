import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { placeCategories } from '@hooma/contracts';
import { useNavigate } from 'react-router-dom';
import { notify } from '../lib/telegram';
import { post } from '../shared/api/http-client';
import { useCommunity } from '../providers/CommunityProvider';
import type { Place } from '../types/domain';

type MenuDraft = { name: string; priceLabel: string };
type RequiredField = 'community' | 'name' | 'photoUrl' | 'address' | 'city' | 'houma' | 'phone';
type FieldErrors = Partial<Record<RequiredField, string>>;

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
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [contactName, setContactName] = useState('');
  const [claimNote, setClaimNote] = useState('');
  const [menuItems, setMenuItems] = useState<MenuDraft[]>(emptyMenu);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clearFieldError = (field: RequiredField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const validateRequiredFields = () => {
    const errors: FieldErrors = {};
    if (!active) errors.community = 'Select or create a HOOMA community before adding a Place.';
    if (name.trim().length < 2) errors.name = 'Enter the venue or business name.';
    if (!photoUrl.trim()) errors.photoUrl = 'Add a real venue photo.';
    if (address.trim().length < 2) errors.address = 'Enter the full real address.';
    if (!city.trim()) errors.city = 'Enter the city.';
    if (!houma.trim()) errors.houma = 'Enter the Houma.';
    if (!phone.trim()) errors.phone = 'Enter the public phone number.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const create = useMutation({
    mutationFn: () =>
      post<Place>('/api/v1/watch/places', {
        communityId: active?.id,
        name: name.trim(),
        category: category.trim(),
        description: description.trim() || undefined,
        address: address.trim(),
        city: city.trim(),
        houma: houma.trim(),
        phone: phone.trim(),
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
          contactPhone: phone.trim(),
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

  const handleSubmit = () => {
    if (!validateRequiredFields()) {
      notify('error');
      return;
    }
    create.mutate();
  };

  const updateMenu = (index: number, field: keyof MenuDraft, value: string) => {
    setMenuItems((items) =>
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    );
  };

  const fieldError = (field: RequiredField) =>
    fieldErrors[field] ? <span className="mt-1 block text-xs" role="alert">{fieldErrors[field]}</span> : null;

  return (
    <div className="page-shell vintage-page">
      <div className="section-kicker">Business owner</div>
      <h1 className="section-title">Add a Place</h1>
      <div className="surface-card mt-5 p-4">
        <div className="grid gap-3">
          {fieldError('community')}
          <label className="text-xs font-black">
            Business name *
            <input
              className="hooma-input mt-1"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                clearFieldError('name');
              }}
              aria-invalid={Boolean(fieldErrors.name)}
            />
            {fieldError('name')}
          </label>
          <label className="text-xs font-black">
            Type *
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
              onChange={(event) => {
                setPhotoUrl(event.target.value);
                clearFieldError('photoUrl');
              }}
              placeholder="https://..."
              aria-invalid={Boolean(fieldErrors.photoUrl)}
            />
            {fieldError('photoUrl')}
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
            Full address *
            <input
              className="hooma-input mt-1"
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
                clearFieldError('address');
              }}
              aria-invalid={Boolean(fieldErrors.address)}
            />
            {fieldError('address')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-black">
              City *
              <input
                className="hooma-input mt-1"
                value={city}
                onChange={(event) => {
                  setCity(event.target.value);
                  clearFieldError('city');
                }}
                aria-invalid={Boolean(fieldErrors.city)}
              />
              {fieldError('city')}
            </label>
            <label className="text-xs font-black">
              Houma *
              <input
                className="hooma-input mt-1"
                value={houma}
                onChange={(event) => {
                  setHouma(event.target.value);
                  clearFieldError('houma');
                }}
                aria-invalid={Boolean(fieldErrors.houma)}
              />
              {fieldError('houma')}
            </label>
          </div>
          <label className="text-xs font-black">
            Public phone *
            <input
              className="hooma-input mt-1"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                clearFieldError('phone');
              }}
              aria-invalid={Boolean(fieldErrors.phone)}
            />
            {fieldError('phone')}
          </label>
          <label className="text-xs font-black">
            Public email
            <input
              className="hooma-input mt-1"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
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
            disabled={create.isPending}
            onClick={handleSubmit}
          >
            {create.isPending ? 'Adding place…' : 'Add place'}
          </button>
        </div>
      </div>
    </div>
  );
}
