# HabitHero — Claude Context

A Chrome extension (MV3) that gamifies daily habits using a RuneScape-style skill grid.
Each habit is an independent skill that levels from 1→99 as you check in daily.

**Owner:** Isaac Dessert
**Repo:** https://github.com/isaacdessert/HabitHero
**Status:** ✅ Working v1 — load unpacked, all core features functional

---

## How to Load & Test

```bash
# Run tests
npm install
npm test           # watch mode
npm run test:run   # single run, no watch

# Load extension in Chrome
# 1. chrome://extensions
# 2. Enable Developer Mode (top right)
# 3. Load Unpacked → select this folder
# 4. Click the sword icon in toolbar
```

No build step. Vanilla JS + ES modules. Changes to source files are live after
clicking the refresh icon on chrome://extensions (or Ctrl+R on the popup).

---

## Architecture

```
HabitHero/
├── manifest.json          # MV3, permissions: storage + tabs
├── popup.html             # Quick daily check-in (340px popup)
├── dashboard.html         # Full management page (new tab)
├── styles.css             # Shared styles for both pages
├── js/
│   ├── popup.js           # Compact check-in list renderer
│   ├── dashboard.js       # Full grid controller
│   ├── ui.js              # DOM rendering for dashboard grid/modals
│   ├── habits.js          # Skill CRUD, daily reset, defaults
│   ├── xp.js              # Pure XP/leveling math (no side effects)
│   └── storage.js         # Promise wrapper for chrome.storage.local
├── tests/
│   ├── xp.test.js         # 36 tests — XP math, leveling, streaks
│   └── habits.test.js     # 17 tests — CRUD, validation, storage mock
├── icons/                 # Pixel art sword icons (16/32/48/128px PNG)
├── package.json           # Vitest only — no runtime dependencies
└── vitest.config.js
```

**Two-page UX:**
- **Popup** → quick check-in. Click an extension icon, mark habits done, close. Has a MANAGE button.
- **Dashboard** → opens in a new tab via `chrome.tabs.create`. Add/remove skills, view stats, full grid.

---

## Data Model (`chrome.storage.local`)

```js
{
  skills: [
    {
      id: string,          // crypto.randomUUID()
      name: string,        // "Hydration"
      emoji: string,       // "💧"
      level: number,       // 1–99
      xp: number,          // XP within current level
      totalXp: number,     // all-time XP earned
      streak: number,      // current consecutive days
      lastChecked: string, // "YYYY-MM-DD" or null
    }
  ],
  today: string,           // "YYYY-MM-DD" — set on each popup open
}
```

"Done today" is derived: `skill.lastChecked === today` — no separate boolean field.

---

## XP & Leveling System

| Rule | Value |
|------|-------|
| Base XP per check-in | 50 XP |
| XP to advance from level N | `N × 50` XP |
| Streak 3–6 days | 1.5× multiplier |
| Streak 7+ days | 2.0× multiplier |
| Max level | 99 |
| Total XP to reach 99 | ~121,275 XP |

Level-up: flash animation on tile + "+LEVEL N!" toast. Handled in `ui.js` (dashboard)
and inline in `popup.js` (popup).

---

## Default Skills (seeded on first install)

| Emoji | Name |
|-------|------|
| 💧 | Hydration |
| 💊 | Supplements |
| 🏋️ | Workout |
| 📖 | Reading |

Up to 8 skills total. Add/remove via the dashboard.

---

## Visual Design

**Font:** Press Start 2P (Google Fonts — pixel aesthetic)

| Token | Color | Usage |
|-------|-------|-------|
| `--bg` | `#0a0a0f` | Page background |
| `--tile-bg` | `#16213e` | Skill tile background |
| `--border-light` | `#c8a84b` | Gold tile border (highlight edge) |
| `--border-dark` | `#5a3e10` | Gold tile border (shadow edge) |
| `--gold` | `#ffd700` | Level numbers, headings, CTAs |
| `--green` | `#00c853` | XP bar fill, completed state |
| `--white` | `#e8e8e8` | Body text |
| `--muted` | `#6b7280` | Metadata, hints |

Tiles use a pixel-art 3D border effect via `box-shadow: inset 2px 2px 0 var(--border-light), inset -2px -2px 0 #1a0d00`.

---

## Key Files to Know

| File | What to edit |
|------|-------------|
| `js/xp.js` | Change XP formula, streak thresholds, max level |
| `js/habits.js` | Change default skills, skill capacity limit (currently 8) |
| `js/ui.js` | Change dashboard tile layout, modal content |
| `js/popup.js` | Change popup row layout, XP toast display |
| `styles.css` | All visual styles for both pages |
| `popup.html` / `dashboard.html` | HTML structure, mailto email address |

---

## Suggest a Feature (mailto)

Both pages have a "💡 Suggest a Feature" footer link. The email address is currently
a placeholder. To update:

```
# Find in popup.html and dashboard.html:
mailto:your@email.com

# Replace with your real address
```

---

## Outstanding TODOs

- [ ] **Fill in email address** in `popup.html` and `dashboard.html` mailto links
- [ ] **Fill in real job history** in About page (placeholder content currently in resume section)
- [ ] **Skill reordering** — drag-and-drop or up/down buttons to reorder skills in the grid
- [ ] **Habit history view** — calendar heatmap showing which days each skill was completed
- [ ] **Export/import data** — backup skills + XP to JSON, restore from file
- [ ] **Sound effects** — optional 8-bit sounds on check-in and level-up (toggle in settings)
- [ ] **Notifications** — optional daily reminder via `chrome.alarms` + `chrome.notifications`
- [ ] **Offline font fallback** — Press Start 2P loads from Google Fonts; if offline, fallback to system monospace
- [ ] **Publish to Chrome Web Store** — needs: store listing, screenshots, privacy policy

---

## Session History

### 2026-03-28 — Full rewrite + features
- Rewrote from scratch (old code was a non-functional skeleton)
- Built RuneScape-style skill grid, XP/leveling system (1–99), streak multipliers
- Two-page UX: popup (quick check-in) + dashboard (management tab)
- 53 Vitest tests covering all XP math and habit CRUD
- Pixel art sword icons generated programmatically
- Added "Suggest a Feature" mailto button to popup and dashboard footers
- Existing repo had only placeholder code — full rewrite was appropriate
