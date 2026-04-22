# Spec: Currency System & Casino Games

## Overview

Add a hidden virtual currency system and casino ecosystem to the Windows 95 portfolio. The feature is **locked behind a secret terminal command** (`777`), giving it an easter-egg discovery mechanic. Once unlocked, two new apps appear (Casino + Bank), the Credits balance displays in the taskbar, and a debt/collateral system lets the player bet the portfolio's own applications — up to total bankruptcy.

---

## Stack & Constraints

- React 19 + TypeScript + Vite
- Zustand 5.0.12 (already installed) — `persist` middleware is built-in via `zustand/middleware`, no extra package needed
- 98.css + custom CSS — must feel like a native Win95 app throughout
- Web Audio API for sounds (synthesized, zero extra files)
- No additional dependencies

---

## Unlock Mechanic

| Detail | Decision |
|---|---|
| Command | `777` typed in the Terminal shell app |
| Feedback | Terminal prints a confirmation message; Credits widget animates into the taskbar |
| Persistence | `localStorage` key `win95-casino-v1` — permanent until a full Restart |
| What unlocks | Casino icon on desktop + Bank icon on desktop + Credits/Debt display in taskbar |

---

## Currency System

### Core Properties
- **Name**: Credits
- **Starting balance**: 500 Credits
- **Debt**: starts at 0; appears in taskbar only when > 0

### Taskbar Display (post-unlock only)
```
[ Start ] .............. [ 💰 200 | 🚨 -300 | 12:34 ]
```
- Credits always visible after unlock
- Debt indicator (`🚨 -300`) appears only when debt > 0

### Zustand Store (`src/store/casinoStore.ts` — NEW FILE)
```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CasinoState {
  unlocked: boolean       // has 777 been typed?
  credits: number         // current free balance
  debt: number            // total owed (always >= 0)
  pledgedApps: AppType[]  // app types currently repossessed
  // Actions
  unlockCasino: () => void
  addCredits: (amount: number) => void
  deductCredits: (amount: number) => void
  pledgeApps: (apps: AppType[]) => void
  redeemApps: (apps: AppType[]) => void
  declareBankruptcy: () => void  // clears localStorage, reloads
}

// localStorage key: 'win95-casino-v1'
```

---

## Files to Modify

### 1. `src/data/filesystem.ts`
- Add to `AppType` union: `| 'casino' | 'bank'`

### 2. `src/store/windowStore.ts`
- Add to `DEFAULT_SIZES`: `casino: { width: 480, height: 400 }`, `bank: { width: 420, height: 360 }`
- Add to `APP_TITLES`: `casino: 'Casino'`, `bank: 'First National Bank of Win95'`
- Add to `APP_ICONS`: `casino: 'casino'`, `bank: 'bank'`
- In `openWindow`: check `casinoStore.getState().pledgedApps.includes(app)` → block if pledged

### 3. `src/components/apps/ContactApp.tsx`
- `COMMANDS` record (line 9): add `'777'` handler that calls `casinoStore.unlockCasino()` and returns unlock message lines
- The `handleSubmit` (line 69) already routes commands via `COMMANDS[cmd]`

### 4. `src/App.tsx`
- Add lazy imports for `CasinoApp` and `BankApp`
- Add cases to `AppContent` switch (line 45): `case 'casino'` and `case 'bank'`

### 5. `src/components/Taskbar/Taskbar.tsx`
- Import `useCasinoStore` and new `<CreditsDisplay>` component
- Insert `{unlocked && <CreditsDisplay />}` just before `<TaskbarClock>` (line 88)

### 6. `src/components/Desktop/Desktop.tsx`
- `DESKTOP_ICONS` static array (line 34): casino and bank icons must be added **conditionally**
- The component currently maps over a static array. Since it's a function component that already uses hooks (`useLocalStorage`, `useWindowStore`), add `useCasinoStore` and filter/extend the icon list based on `unlocked`
- Pledged apps: in the icon render loop (line 383), check `pledgedApps.includes(icon.app)` → apply `styles.pledged` class (grayed + lock overlay)
- The `handleIconClick` double-click handler (line 335): add guard — if app is pledged, do nothing

---

## New Files to Create

| File | Purpose |
|---|---|
| `src/store/casinoStore.ts` | Zustand persist store |
| `src/components/apps/CasinoApp.tsx` | Casino window + Slot Machine |
| `src/components/apps/CasinoApp.module.css` | Casino styles |
| `src/components/apps/BankApp.tsx` | Bank window + Borrow/Repay tabs |
| `src/components/apps/BankApp.module.css` | Bank styles |
| `src/components/Taskbar/CreditsDisplay.tsx` | Taskbar Credits/Debt widget |
| `src/components/GameOverDialog.tsx` | Bankruptcy full-screen dialog |

---

## Casino App (`CasinoApp.tsx`)

### Slot Machine

**Reels**: 3 columns, CSS animation spin (reel strip scrolling)

**Symbols** (fruit classics, in order of rarity):
| Symbol | Rarity | Payout (3x) |
|---|---|---|
| ⭐ Star | Rarest | ×50 |
| 🔔 Bell | Very rare | ×20 |
| 🍒 Cherry | Rare | ×10 |
| 🍋 Lemon | Uncommon | ×8 |
| 🍊 Orange | Common | ×5 |
| 🍇 Grapes | Most common | ×3 |

**Win conditions**: 3 identical symbols only. No partial wins.

**Betting**:
- Incremental `[ − ] [ 10 ] [ + ]` buttons, step = 5
- Minimum: 5 Credits | Maximum: 50 Credits
- Cannot bet more than current balance

**Sounds** (Web Audio API — synthesized):
- Spin: fast ticking oscillator while reels spin
- Win: ascending tone sequence
- Loss: short descending buzz

**Payout table**: visible static panel within the Casino window

---

## Bank App (`BankApp.tsx`)

"First National Bank of Win95" — two tabs: **Borrow** and **Repay**

### Borrow Tab
- Lists all apps currently accessible (non-pledged), **excluding Casino**
- Each app = +100 Credits on pledge
- Checkboxes to select; running total shown
- `[ Confirm Loan ]` → `casinoStore.pledgeApps(selected)` + `addCredits(selected.length * 100)`

### Repay Tab
- Lists all currently pledged apps (`casinoStore.pledgedApps`)
- Each app costs 100 Credits to recover
- Checkboxes; running cost shown; cannot redeem more than current balance
- `[ Repay & Recover ]` → `casinoStore.redeemApps(selected)` + `deductCredits(selected.length * 100)`

---

## Pledged App Behavior

| State | Visual on Desktop | Behavior |
|---|---|---|
| Available | Normal icon | Double-click opens app |
| Pledged | Grayed + 🔒 overlay (`styles.pledged`) | Double-click does nothing |

- Casino is never in the pledgeable list
- If Casino is the **only non-pledged app** → trigger bankruptcy

---

## Bankruptcy

**Detection**: after any `pledgeApps()` call, check if `pledgedApps` covers all AppTypes except `'casino'`

**Result**:
- All app icons hidden
- `<GameOverDialog>` rendered full-screen (or as a modal over the desktop)

```
┌─ Game Over ──────────────────────────────────┐
│                                               │
│  ⚠  Bankruptcy declared.                     │
│                                               │
│  All assets have been seized.                 │
│  Your portfolio is now empty.                 │
│                                               │
│                 [  Restart  ]                 │
└───────────────────────────────────────────────┘
```

**[Restart] button**: calls `localStorage.clear()` then `window.location.reload()` — full reset, 777 must be re-discovered.

---

## Existing localStorage Keys (do not conflict)
- `win95-desktop-theme-v1` — desktop theme (Desktop.tsx)
- `win95-icon-positions-v2` — icon grid positions (Desktop.tsx)
- `win95-sound` — sound on/off (Taskbar.tsx)
- **`win95-casino-v1`** ← new key for casinoStore

---

## Existing Patterns to Follow

- **Lazy imports**: all app components are lazy-loaded in `App.tsx` via `lazy(() => import(...).then(m => ({ default: m.ComponentName })))`
- **Named exports**: all components use named exports (e.g., `export function CasinoApp()`)
- **CSS Modules**: each component has its own `.module.css`
- **useLocalStorage hook**: available at `src/hooks/useLocalStorage.ts` (used for simple non-reactive persistence; use Zustand persist for casinoStore instead)
- **Double-click to open**: Desktop handles single-click = select, double-click = `openWindow()` (see `handleIconClick` in `Desktop.tsx:335`)

---

## Out of Scope (Phase 1)

- Blackjack
- Pachinko
- Daily bonus / passive income
- Transaction history
- Variable app value (all apps = 100 Credits)
- Interest on loans
- Currency spending outside the casino ecosystem

---

## Open Questions (Phase 2)

- Blackjack card visual style (flat Win95 cards vs. pixel art?)
- Pachinko physics approach (Matter.js? or pure canvas?)
- Future "shop" for spending Credits on themes/desktop customization
