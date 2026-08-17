# HOOMA Design System

## Brand direction

HOOMA is football-first and Telegram-native, not a clone of another application. The UI uses strong rounded cards/containers, compact mobile information hierarchy, and football-specific iconography.

## Theme tokens

### Dark

- pitch-black primary background
- near-black elevated surfaces
- gold accent
- pure white primary text/icons
- restrained muted gray

### Light

- white primary background
- subtle light elevated surfaces
- orange accent
- black primary text/icons
- neutral gray secondary text

Theme is implemented with CSS variables in `apps/miniapp/src/index.css`; components should consume tokens such as `var(--accent)`, `var(--surface)`, `var(--text)` rather than hardcoding theme colors.

## Telegram behavior

Telegram ThemeParams seed the `TELEGRAM` mode. Explicit HOOMA LIGHT/DARK overrides persist immediately and sync to the user preference API.

## Component rules

- shared visual primitives go in `components/ui`
- domain-specific business decisions do not belong in visual components
- do not duplicate existing buttons/cards/loaders for tiny style variations
- avoid arbitrary z-index escalation; use the semantic `layer-composer`, `layer-chrome`, and `layer-popover` classes defined in the design system
- do not use `!important`
- preserve safe-area padding for Telegram mobile chrome
- maintain touch targets suitable for one-handed mobile use

## Core navigation

Bottom navigation emphasizes the highest-frequency football actions. Secondary areas live behind More/Community rather than overloading the bottom bar.

## Formation UI

Formation builder uses actual drag/drop slots for 5v5, 7v7 and 11v11, with server-backed confirmed roster data and optional server team balancing.
