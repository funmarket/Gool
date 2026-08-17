# HOOMA Teams and Matchday UI Plan

## Purpose

Upgrade HOOMA into a polished matchday hub using the supplied screenshots as visual acceptance references and the pasted Teams specs as functional acceptance references.

This file is the working plan for the implementation. It is not a replacement for source tracing. Before each implementation slice, inspect the existing imports, callers, state, contracts, backend services, repositories, CSS, and routes involved.

## Non-negotiable Rules

- Fix behavior at the source level; do not add patch layers or downstream wrappers.
- Keep backend state and permissions authoritative; never rely on client-only permission checks.
- Do not introduce fake or mocked production data.
- Preserve existing API contracts unless the real feature requires a contract extension.
- Preserve existing working paths for Requests, Ride, FundMe, Events, communities, Telegram auth, and payments.
- Use real migrations for schema changes.
- Verify with available typecheck, build, lint, and tests before claiming completion.

## Visual Direction

- Use the HOOMA public wordmark as the brand source through the committed app asset path `/brand/hooma-wordmark.png`.
- Use a pitch-black base, neon HOOMA green primary accents, gold secondary accents, frosted cards, rounded panels, and controlled glow.
- Keep mobile-first Telegram-safe spacing.
- Use clear cards, visible state, quick actions, and contextual creation.
- Keep Challenge Card visuals distinct: aged cream border, dark green inner card, gold trim, collectible-card styling, crests, VS seal, accepted stamp, lineup panels, leader previews, and a bright green CTA.

## Existing Feature Adoption

### Home

- Replace the current hero-first layout with a Matchday command center.
- Show a top action pill for Create a Match.
- Show Next Up Events with a strong empty state.
- Show quick feature cards for Teams, Requests, Ride, and FundMe.
- Show Community actions rows for Requests, Ride, and FundMe.
- Use live counts from existing APIs; do not hardcode production counters.

### Ride

- Adopt a modal hub with tabs: Open, Mine, History.
- Support creation types: Ride Share, Split Gas Trip, Need a Ride, Pick Me Up.
- Cards should show route, time flexibility, seat count, status pills, gas estimate, participants, and inline actions.
- Exact location permission is requested only after tapping Use my current location.
- State transitions remain backend-owned: join, leave, offer driver, accept driver, start, complete, cancel.
- Extend contracts/schema only where the existing ride model cannot represent the real state.

### FundMe

- Fund cards show title, goal, raised amount, progress bar, percent, and chip-in action.
- Contributor rows expand inline.
- UI shows contributor aggregate totals.
- Backend preserves individual contribution events.
- Money calculations belong in backend/service or shared contract utilities, not duplicated across components.

## Teams Feature Plan

### Product Model

- Teams are global opponent-discovery objects, not scoped only to the active community view.
- V1 supports one active team per community.
- Public active teams are discoverable by any authenticated user.
- Regular users can browse teams, rosters, published lineups, upcoming games, and Challenge Cards.
- Team leaders/admins can manage team details, challenges, lineup, and accepted-challenge messages.

### Backend Models

- `Team`
- `TeamPlayer`
- `TeamLineup`
- `TeamLineupSlot`
- `TeamChallenge`
- `TeamChallengeMessage`
- `TeamGame`

### Required State

- Team status: active, inactive.
- Challenge status: pending, accepted, declined, cancelled, expired.
- Game status: scheduling, confirmed, completed, cancelled.
- Match formats must support smaller formats, not only 11v11: 5v5, 6v6, 7v7, 8v8, 9v9, 11v11.
- Published lineup is public; unpublished lineup data is not returned through public reads.

### Permissions

- `can_manage_team`
- `can_manage_team_challenges`
- `can_manage_team_lineup`

Server-side authorization is required for all management and state transitions. Client UI may hide unavailable actions, but cannot be the source of truth.

### Challenge Flow

- No relationship: show Challenge.
- Outgoing pending: show Challenge sent.
- Incoming pending: show Accept and Decline.
- Accepted: show Open match.
- Duplicate pending challenges between the same teams are blocked in either direction.
- Accept/decline is transactional and concurrency-safe.
- Accepted challenge creates or unlocks a Game.
- Accepted challenge unlocks leader-only short messages.

### Frontend Routes

- `/teams`
- `/teams/:teamId`
- `/teams/challenges/:challengeId`
- `/teams/games/:gameId`
- `/teams/manage`

### Frontend Screens

- Teams hub with tabs: Discover, Requests, Games.
- Discover team cards with crest, name, city/houma, player count, formation, avatars, and contextual actions.
- Requests inbox with incoming and outgoing challenge state.
- Games rail/list with upcoming accepted matches.
- Challenge Card screen matching the supplied collectible-card visual direction.
- Team profile with public roster and published lineup.

## Implementation Order

1. Trace existing app shell, navigation, shared UI primitives, Home, Ride, FundMe, Requests, contracts, services, repositories, schema, and tests.
2. Add visual tokens and shared components only where they are true sources of repeated UI behavior.
3. Update Home to the new Matchday command center using live data.
4. Add Teams frontend route/template with real empty/loading/error states and no fake production data.
5. Add Teams contracts and schema migration.
6. Add Teams repository, service, controller, router wiring, authorization, audit/outbox behavior, and tests.
7. Upgrade Ride hub behavior against the real ride service.
8. Upgrade FundMe cards and contributor aggregates against the real fundraising service.
9. Add Challenge Card rendering from real TeamChallenge/Game/Lineup data.
10. Run validation gates: architecture check, db validate, lint, typecheck, tests, build, and release checks where applicable.

## Acceptance Criteria

- The Home, Teams, and Challenge Card visuals match the supplied screenshots in style, hierarchy, spacing, colors, and mobile-first feel.
- No production screen relies on fake data.
- Empty, loading, error, unauthorized, single-item, many-item, long-text, and narrow/mobile viewport states are handled.
- Team permissions are enforced on the backend.
- Challenge state transitions are idempotent where required and safe under concurrent calls.
- Existing Requests, Ride, FundMe, Events, and Community flows continue to work.
- Validation commands pass, or any remaining failures are reported with exact evidence.
