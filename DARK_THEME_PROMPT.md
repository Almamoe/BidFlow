# BidFlow — Dark Premium Redesign

## Context

You are working on **BidFlow**, a real-time charity auction bid tracking app built for the Islamic Relief Canada hackathon. It uses **Next.js 14 (App Router)**, **Supabase** (PostgreSQL + Realtime), **Tailwind CSS**, **Framer Motion**, and **Lucide React icons**.

The app has 3 views:
- `/` — Landing page / role selector
- `/admin` — Dashboard, items, bidders, checkout (4 sub-pages with sidebar)
- `/volunteer` — Speed bid entry (solo + team bids)
- `/display` — Full-screen projector view for audience

Run `npm run dev` to start. Open `http://localhost:3000` and visually check each page as you work.

---

## THE VISION

Right now the app looks like a generic light-themed SaaS dashboard. **We're going full dark premium.** Think:
- **Linear.app** — sleek dark UI with subtle borders and glass effects
- **Vercel's dashboard** — dark backgrounds, clean typography, neon-ish accent glows
- **Stripe's dark mode** — sophisticated, lots of depth, beautiful data display
- **Apple keynote slides** — dramatic dark backgrounds with vivid accent colors

The vibe is: **luxury charity gala meets fintech terminal.** This app is used at a formal charity dinner — it should feel expensive, polished, and alive.

---

## DESIGN SYSTEM — Apply Everywhere

### Color Palette

Replace the current light theme entirely. Every page, every component goes dark.

```
Background layers (darkest to lightest):
- Page background:     #09090B (zinc-950 — near black)
- Card/panel bg:       #18181B (zinc-900)  
- Elevated surface:    #27272A (zinc-800)
- Hover/active state:  #3F3F46 (zinc-700)

Borders:
- Default:             #27272A (zinc-800) — subtle, barely visible
- Hover/focus:         #3F3F46 (zinc-700)
- Accent border:       rgba(16, 185, 129, 0.3) — green glow

Text:
- Primary:             #FAFAFA (zinc-50) — bright white
- Secondary:           #A1A1AA (zinc-400) — muted
- Tertiary:            #71717A (zinc-500) — very muted labels
- Disabled:            #52525B (zinc-600)

Accent colors:
- Primary green:       #10B981 (emerald-500) — buttons, active states, success
- Green glow:          #10B981 with 20% opacity for box-shadows and glows
- Gold:                #F59E0B (amber-500) — bid amounts, money, "total raised"
- Gold glow:           #F59E0B with 15% opacity
- Purple:              #8B5CF6 (violet-500) — team bids specifically
- Red/danger:          #EF4444 — errors, delete, warnings
- Blue/info:           #3B82F6 — informational badges
```

### Glass Effect (use sparingly on key cards)
```css
background: rgba(24, 24, 27, 0.80);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.06);
```

### Glow Effects (use on important elements)
```css
/* Green glow for primary buttons and active items */
box-shadow: 0 0 20px rgba(16, 185, 129, 0.15), 0 0 40px rgba(16, 185, 129, 0.05);

/* Gold glow for bid amounts and money */
box-shadow: 0 0 20px rgba(245, 158, 11, 0.15), 0 0 40px rgba(245, 158, 11, 0.05);

/* Subtle card elevation */
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.03);
```

### Gradient Accents
```css
/* For hero text, feature highlights */
background: linear-gradient(135deg, #10B981, #34D399);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;

/* Subtle background gradient on page bg */
background: radial-gradient(ellipse at top, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
```

### Typography
- Keep Plus Jakarta Sans for body/UI
- Playfair Display for hero titles and bid amounts on the display page
- Font weights: 400 for body, 500 for labels, 600 for headings, 700 for hero/display numbers
- All caps + letter-spacing: 0.1em for tiny labels like "TOTAL RAISED", "LIVE", "PADDLE #"

### Border Radius
- Cards: `rounded-2xl` (16px)
- Buttons: `rounded-xl` (12px)
- Inputs: `rounded-xl` (12px)  
- Badges/pills: `rounded-full`
- Avatars: `rounded-xl` (12px, square-ish)

### Animations (Framer Motion)
- Page mount: fade in + slide up (y: 20 → 0), 0.4s
- Cards: stagger children with 0.05s delay each
- Bids arriving: slide in from right with spring physics
- Number changes: scale pulse (1.0 → 1.05 → 1.0)
- Hover on cards: subtle scale(1.01) + brighten border
- All transitions: use `ease: [0.25, 0.1, 0.25, 1]` for smooth cubic-bezier

---

## PAGE-BY-PAGE INSTRUCTIONS

### LANDING PAGE (`/`)

**Current**: Light background, simple cards. **Target**: Dramatic dark hero that makes people say "woah."

- Background: `#09090B` with a large radial gradient glow — emerald green at top center, fading to transparent. Add very subtle noise/grain texture overlay (CSS only, use a repeating SVG pattern or gradient trick).
- Hero section:
  - "Bid" in white, "Flow" in gradient green (emerald-500 → emerald-300). Font size 72px+ on desktop.
  - Subtitle in zinc-400, elegant and short: "Real-time charity auction tracking"
  - A small pill badge above: "Islamic Relief Canada × Western MSA" in a dark pill with green border
- Role cards:
  - Dark card bg (zinc-900) with 1px border (zinc-800)
  - On hover: border transitions to green glow, slight scale up, subtle green box-shadow
  - Icons should be in colored circles — green for admin, amber/gold for volunteer, white for display
  - Each card should have a subtle gradient shimmer on hover (like a light sweep effect)
- Bottom: A faint "Every dollar tracked is a donation protected" tagline in zinc-600
- Optional: Add floating/pulsing geometric shapes (hexagons, circles) in the background at very low opacity, animated slowly with CSS keyframes. Islamic geometric pattern inspired.

### ADMIN SIDEBAR + LAYOUT

- Sidebar background: `#0F0F11` (even darker than page bg) with a right border in zinc-800
- BidFlow logo area: Green heart icon on dark bg, "BidFlow" in white, "Admin" in zinc-500
- Nav items: zinc-400 text normally. Active state: green text + green-tinted background (`rgba(16, 185, 129, 0.1)`) + a 2px green left border accent
- "Real-time connected" indicator at bottom: pulsing green dot + zinc-500 text
- Main content area: `#09090B` background
- On mobile (< 768px): Sidebar becomes a slide-out drawer from the left with a dark overlay. Add a hamburger menu button in a top bar.

### ADMIN DASHBOARD (`/admin`)

- Stat cards: Dark glass cards (zinc-900 bg, zinc-800 border). Each stat should have its accent color:
  - Total Raised → gold text, gold glow
  - Items Sold → green text, green glow  
  - Total Bids → blue text
  - Team Bids → purple text
- The stat VALUE should be large (28-32px) and bold. Label above in zinc-500 uppercase 11px.
- Recent bids feed: 
  - Dark list items with zinc-800 separators
  - The most recent bid should have a subtle green left border to indicate "latest"
  - Team bids show a purple badge, solo bids show green
  - Relative timestamps ("2m ago") instead of absolute times
  - Animate new bids sliding in from top
- Auction queue:
  - Show items with their status as colored dots: green pulsing = active, zinc = upcoming, gold = sold
  - Active item should be highlighted with a green border and slight glow

### ADMIN ITEMS (`/admin/items`)

- Item cards: horizontal layout, dark bg, image thumbnail on left (rounded-xl, 56x56), info in middle, actions on right
- Active item banner at top: dark card with green border glow, pulsing green dot, "LIVE NOW" badge
- "Go Live" button: green with glow. "Mark Sold" button: gold. "Edit": zinc. "Delete": red with hover.
- Add/Edit modal: dark bg (zinc-900), darker overlay (black 60%), zinc-800 borders on inputs, inputs have zinc-900 bg with zinc-700 border that glows green on focus
- Image URL field: when a URL is pasted, show a live preview thumbnail below the input
- Status badges: green pill for active (with subtle glow), zinc pill for upcoming, gold pill for sold

### ADMIN BIDDERS (`/admin/bidders`)

- Bidder cards: dark, compact, show paddle number as a prominent badge
- Avatar circles with initials: use colored backgrounds that are dark-toned (not bright) — `bg-emerald-900 text-emerald-300`, `bg-violet-900 text-violet-300`, etc.
- Search bar: dark input, magnifying glass icon, full width, zinc-800 border → green glow on focus
- Registration modal: dark, paddle number auto-assign note should be a subtle info card with green-tinted bg
- After registering: Show a brief success animation — the new paddle number should appear large and animated

### ADMIN CHECKOUT (`/admin/checkout`)

- Summary cards at top: "Total Owed" in white, "Collected" in green, "Outstanding" in amber
- Progress bar: Show visual bar of payment completion — green fill on dark track
- Bidder rows: dark cards, clear hierarchy — name and paddle big, amounts right-aligned
- "Mark Paid" button: transforms from zinc outlined to solid green with checkmark when toggled
- Paid bidders: reduce opacity to 0.5 and add a green checkmark overlay
- Export CSV button: outlined zinc button with download icon
- Filter tabs (All / Pending / Paid): dark toggle group with the active tab in green

### VOLUNTEER PAGE (`/volunteer`)

This page is used on PHONES in a LOUD ROOM. Everything must be LARGE and OBVIOUS.

- Background: `#09090B` — full dark
- Top bar: glass effect, "BidFlow" left, "VOLUNTEER STATION" right with pulsing green dot
- Active item card: dark with green accent border at top. Large item name (24px). Image if available. Current highest bid in GOLD and LARGE (32px). Show bid count.
- Mode toggle (Solo / Team): Large toggle, full width. Active state = green fill for solo, purple fill for team. 48px+ height. These are essentially the two main actions.
- **Solo bid flow:**
  - Paddle # search: HUGE input. 56px height, 24px font size, centered text, dark bg, green border on focus. This is the most-used element on the whole page.
  - When a bidder is found/selected: show a BIG confirmation card — paddle number huge (48px), name large (20px), table number. Green background tint. Clear "X" to deselect.
  - Amount input: also huge (56px height, 32px font). Dollar sign prefix. Dark bg.
  - Quick amount buttons: Large pill buttons (44px height). Show contextual amounts based on current highest bid. Dark bg, zinc border, green on tap.
  - Submit button: FULL WIDTH, 56px height, green bg with glow, large text "Submit Bid — $XXX". Disabled state = zinc-800.
- **Team bid flow:**
  - Same energy — large inputs, large buttons
  - Team member list: each member in a dark card with their avatar, paddle #, name, and a contribution input
  - "Split Evenly" button: Prominent, purple bg, full width above the submit button
  - Running total: always visible, shows sum vs target with color coding (green = matches, amber = doesn't match yet)
  - Submit button: purple bg with glow for team bids
- **After bid submission:**
  - Brief full-screen success overlay: big green checkmark, "BID PLACED!", bid amount, fades out after 1.5s
  - Form resets automatically
  - Subtle haptic vibration on mobile if available
- Recent bids: minimal, at the bottom, dark compact list

### LIVE DISPLAY (`/display`)

This is the MONEY PAGE. This is what gets projected on a big screen at the charity dinner. It needs to be CINEMATIC.

- Background: Pure black `#000000` with extremely subtle animated gradient orbs:
  - One large emerald green orb (top-left, very low opacity ~5%, slowly drifting)
  - One gold orb (bottom-right, ~3% opacity, slowly pulsing)
  - These create a subtle "alive" feeling without distracting
- Top bar: 
  - Left: BidFlow logo + "Islamic Relief Canada" in zinc-500
  - Right: Current time (updating every second), "LIVE" with red pulsing dot
- When an item IS active:
  - "NOW AUCTIONING" label in green, small, uppercase, tracked
  - Item image: large, rounded-2xl, with a subtle vignette gradient overlay at the bottom. Takes up maybe 30% of left side.
  - Item name: Playfair Display, 48-64px, white, tracking tight
  - Item description: zinc-400, 18px, max 2 lines
  - **THE BID AMOUNT**: This is the star. 
    - 96-128px font size. Playfair Display. Gold color (#F59E0B).
    - Subtle gold text-shadow glow
    - When it changes: animate each digit with a slot-machine roll effect (digits slide up/down independently)
    - Brief gold particle burst on change (just CSS — use multiple small spans with animation-delay that scatter and fade)
    - Below it: "Current Highest Bid" in zinc-500, and whether it's a team bid in purple
  - Bid feed (right column): 
    - Each bid slides in from right with spring animation
    - Latest bid has a green left border accent
    - Team bids show purple accent + member breakdown
    - Show paddle # and name, amount, relative time
- When NO item is active:
  - Center of screen: large animated Islamic geometric pattern (CSS only — rotating hexagon/star shapes at very low opacity)
  - "Charity Auction" in Playfair Display, 64px, white
  - "Next item coming soon..." pulsing gently in zinc-500
  - IRC branding at bottom
- Bottom stats bar:
  - Glass effect bg (black 80% + blur)
  - "TOTAL RAISED" in zinc-500 uppercase tracked
  - The amount in GOLD, 36-48px, Playfair Display, with gold glow
  - Stats: Items Sold, Total Bids, Team Bids, Bidders — in zinc-400
  - Right side: "Every dollar tracked is a donation protected" in zinc-600
  - Fullscreen button (maximize icon) that triggers `document.documentElement.requestFullscreen()`

---

## GLOBAL CHANGES

### Update `globals.css`
- Set `body` background to `#09090B`, text to `#FAFAFA`
- Update all component classes (`.card`, `.btn-primary`, `.input`, etc.) to dark theme
- Add new utility classes for glow effects
- Update scrollbar to dark (zinc-800 thumb on transparent track)
- Selection color: green bg

### Update `tailwind.config.ts`
- Adjust any hardcoded light colors in the theme

### Update ALL components
- Every `bg-white` → `bg-zinc-900`
- Every `border-charcoal-100` → `border-zinc-800`
- Every `text-charcoal-900` → `text-zinc-50`
- Every `text-charcoal-400` → `text-zinc-400`
- Every `hover:bg-charcoal-50` → `hover:bg-zinc-800`
- Every `bg-charcoal-50` → `bg-zinc-950`
- Go through EVERY file and update. Don't leave any light-themed elements.

### Modals
- Overlay: `bg-black/60` with `backdrop-blur-sm`
- Modal bg: `zinc-900` with `zinc-800` border
- Input fields inside modals: `bg-zinc-950` with `zinc-700` border

### Form Inputs
- Background: `bg-zinc-950`
- Border: `border-zinc-700`
- Focus: `ring-emerald-500/20` + `border-emerald-500`
- Placeholder: `text-zinc-600`
- Text: `text-zinc-100`

### Buttons
- Primary: `bg-emerald-600 hover:bg-emerald-500` with green glow on hover
- Secondary: `bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700`
- Danger: `bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20`
- Gold (for auction actions): `bg-amber-500/10 text-amber-400 border-amber-500/20`

### Badges
- Active: `bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`
- Upcoming: `bg-zinc-800 text-zinc-400`
- Sold: `bg-amber-500/10 text-amber-400 border border-amber-500/20`
- Team: `bg-violet-500/10 text-violet-400 border border-violet-500/20`
- Paid: `bg-emerald-500/10 text-emerald-400`
- Pending: `bg-amber-500/10 text-amber-400`

---

## IMPORTANT RULES

- Do NOT change the Supabase schema, env var names, or data logic
- Do NOT remove any existing functionality or real-time subscriptions  
- DO test every page visually after changes — open in browser and verify
- DO make the volunteer page work perfectly on mobile (375px width)
- DO ensure all text is readable on dark backgrounds (contrast check)
- DO preserve all three views and their routing
- Work through files systematically: globals.css → tailwind.config → layout files → page files
- Start the dev server, make changes, and verify in the browser as you go
