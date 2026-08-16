export type Role = 'OWNER' | 'ADMIN' | 'MEMBER';
export type PaymentMethod = 'CASH' | 'TELEGRAM_STARS';
export type PaymentStatus =
  | 'CREATED'
  | 'AWAITING_PAYMENT'
  | 'AWAITING_CASH'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';
export type MinorAmount = string | number;
export type CursorPage<T> = { items: T[]; nextCursor: string | null };

export type PaymentMethodSetting = {
  id: string;
  method: PaymentMethod;
  enabled: boolean;
  sortOrder: number;
};
export type PaymentSummary = {
  id: string;
  status: PaymentStatus;
  selectedMethod?: PaymentMethod | null;
  amountMinor: MinorAmount;
  currency: string;
};
export type Person = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  photoUrl?: string | null;
};

export type Community = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  city?: string | null;
  visibility?: 'PUBLIC' | 'PRIVATE';
  role: Role;
  paymentDefaults?: PaymentMethodSetting[];
};
export type CommunityListResponse = {
  activeCommunityId: string | null;
  communities: Community[];
};

export type Club = {
  id: string;
  name: string;
  slug: string;
  countryCode?: string | null;
  logoUrl?: string | null;
};

export type EventItem = {
  id: string;
  communityId: string;
  type: 'PLAY' | 'WATCH';
  status: string;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt?: string | null;
  timezone: string;
  venueName?: string | null;
  address?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  capacity?: number | null;
  waitlistEnabled: boolean;
  cashRsvpPolicy: 'CONFIRM_IMMEDIATELY' | 'REQUIRE_CASH_CONFIRMATION';
  paymentMethods?: PaymentMethodSetting[];
  playDetails?: {
    pitchType: string;
    skillLevel: string;
    format: string;
    entryFeeMinor: MinorAmount;
    currency: string;
    paymentRequired: boolean;
  } | null;
  watchDetails?: {
    homeClub?: Club | null;
    awayClub?: Club | null;
    homeClubId?: string | null;
    awayClubId?: string | null;
  } | null;
  community?: Pick<Community, 'id' | 'name' | 'avatarUrl'>;
  rsvps?: Array<{
    id: string;
    userId?: string;
    status: string;
    waitlistPosition?: number | null;
    seatHoldExpiresAt?: string | null;
    paymentIntent?: PaymentSummary | null;
    user?: Person & { profile?: { skillRating?: number } | null };
  }>;
  _count?: { rsvps: number };
};

export type RequestItem = {
  id: string;
  communityId: string;
  eventId?: string | null;
  kind: string;
  title: string;
  details?: string | null;
  position?: string | null;
  quantity: number;
  status: string;
  expiresAt: string;
  event?: { id: string; title: string } | null;
  createdBy?: Person;
  claims?: Array<{
    id: string;
    userId: string;
    quantity: number;
    status?: string;
    user?: Person;
  }>;
};

export type RequestPage = CursorPage<RequestItem>;

export type RideOfferItem = {
  id: string;
  communityId: string;
  eventId?: string | null;
  status: string;
  title: string;
  originLabel: string;
  destinationLabel: string;
  originLatitude: string | number;
  originLongitude: string | number;
  destinationLatitude: string | number;
  destinationLongitude: string | number;
  departureAt: string;
  seatsTotal: number;
  seatPriceMinor: MinorAmount;
  currency: string;
  costSplitMode: string;
  liveTrackingEnabled: boolean;
  paymentMethods?: PaymentMethodSetting[];
  driver?: Person;
  matches?: Array<{
    id: string;
    riderUserId: string;
    seats: number;
    status: string;
    quotedShareMinor?: MinorAmount;
    rider?: Person;
    paymentIntent?: PaymentSummary | null;
  }>;
};

export type RideRequestItem = {
  id: string;
  communityId: string;
  eventId?: string | null;
  status: string;
  title: string;
  pickupLabel: string;
  pickupLatitude: string | number;
  pickupLongitude: string | number;
  seatsNeeded: number;
  desiredDepartureAt: string;
  requester?: Person;
};
export type RideListResponse = {
  offers: RideOfferItem[];
  requests: RideRequestItem[];
  nextOfferCursor: string | null;
  nextRequestCursor: string | null;
};

export type FundItem = {
  id: string;
  communityId: string;
  eventId?: string | null;
  purpose: string;
  status: string;
  title: string;
  description?: string | null;
  goalMinor: MinorAmount;
  collectedMinor: MinorAmount;
  currency: string;
  deadline?: string | null;
  paymentMethods?: PaymentMethodSetting[];
  organizer?: Person;
  event?: { id: string; title: string } | null;
};

export type FundPage = CursorPage<FundItem>;

export type Me = Person & {
  telegramUserId: string;
  profile?: {
    skillLevel: string;
    skillRating: number;
    preferredPositions: string[];
    favoriteClubId?: string | null;
    favoriteClub?: Club | null;
    bio?: string | null;
  } | null;
  preference?: { activeCommunityId?: string | null; themeOverride?: string | null } | null;
};

export type DigitalProduct = {
  id: string;
  communityId: string;
  sku: 'SUPPORTER_BADGE';
  title: string;
  description?: string | null;
  starsAmount: number;
  active: boolean;
  owned: boolean;
};

export type CommunityInvite = {
  id: string;
  codePrefix: string;
  role: 'MEMBER' | 'ADMIN';
  maxUses?: number | null;
  useCount: number;
  expiresAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
  createdBy?: Person;
};
