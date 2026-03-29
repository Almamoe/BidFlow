# BidFlow — Real-Time Charity Auction Tracker

> Every dollar tracked is a donation protected.

**BidFlow** is a real-time bid tracking system built for Islamic Relief Canada charity auctions. It replaces paper-based tracking with three purpose-built interfaces — Admin, Volunteer, and Live Display — all synced in real time.

Built for the **Western MSA × IRC Hackathon**.

---

## Features

### Three Role-Based Interfaces

| Role | Route | Purpose |
|------|-------|---------|
| **Admin** | `/admin` | Manage items, register bidders, control auction flow, handle checkout |
| **Volunteer** | `/volunteer` | Speed-optimized bid entry with paddle number search |
| **Live Display** | `/display` | Dark-themed projector view with animated bid counter |

### Core Capabilities

- **Paddle Number System** — Bidders get auto-assigned paddle numbers for fast lookup
- **Solo Bids** — Quick entry: paddle # → amount → submit
- **Team Bids** — Add multiple members, set individual contributions, split evenly
- **Real-Time Sync** — All views update instantly via Supabase real-time subscriptions
- **Live Display** — Animated bid counter, bid feed, running "total raised" for projectors
- **Payment Checkout** — See what each bidder owes, mark as paid, export CSV
- **Auction Flow Control** — Set items as upcoming → active → sold

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | **Next.js 14** + React 18 | File-based routing, SSR, fast dev |
| Styling | **Tailwind CSS** | Rapid, polished UI without custom CSS |
| Database | **Supabase** (PostgreSQL) | Relational data, real-time, auth, free tier |
| Real-time | **Supabase Realtime** | Instant sync across all views |
| Animation | **Framer Motion** | Polished transitions and bid animations |
| Deployment | **Vercel** | Zero-config, free, instant deploys |

---

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo-url>
cd bidflow
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project (free tier works)
2. Once your project is ready, go to **SQL Editor**
3. Copy the entire contents of `supabase/schema.sql` and run it
4. Go to **Settings → API** and copy your **Project URL** and **anon public key**

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll see the role selector.

### 5. Deploy to Vercel (for demo)

```bash
npx vercel
```

Add your environment variables in the Vercel dashboard. Done — judges can access it on their phones.

---

## Demo Script (5 minutes)

1. **Open 3 browser tabs** side by side: `/admin`, `/volunteer`, `/display`
2. **Admin**: Set "Calligraphy Art Print" to **Go Live**
3. **Display**: Watch the item appear with its image and starting bid
4. **Volunteer**: Place a **solo bid** — type paddle `07`, enter $150, submit
5. **Display**: Watch the bid counter animate to $150
6. **Volunteer**: Switch to **Team Bid** — add 3 members, enter $500 total, hit "Split Evenly", submit
7. **Display**: Counter jumps to $500, shows "Team Bid (3 members)"
8. **Admin**: Mark item as **Sold**, go to **Checkout** — show bidder totals and "Mark Paid"
9. **Admin**: Hit **Export CSV** — download the payment report

---

## Project Structure

```
bidflow/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing / role selector
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Tailwind + custom styles
│   │   ├── admin/
│   │   │   ├── layout.tsx        # Sidebar nav
│   │   │   ├── page.tsx          # Dashboard with stats
│   │   │   ├── items/page.tsx    # Item CRUD + auction control
│   │   │   ├── bidders/page.tsx  # Bidder registration
│   │   │   └── checkout/page.tsx # Payment reconciliation
│   │   ├── volunteer/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx          # Speed bid entry + team bids
│   │   └── display/
│   │       ├── layout.tsx
│   │       └── page.tsx          # Projector live view
│   └── lib/
│       ├── supabase.ts           # Supabase client
│       ├── hooks.ts              # Real-time data hooks
│       ├── types.ts              # TypeScript types
│       └── utils.ts              # Formatters + helpers
├── supabase/
│   └── schema.sql                # Full DB schema + seed data
├── tailwind.config.ts
├── package.json
└── README.md
```

---

## Design Decisions (for judges)

**Why Supabase over Firebase?**
Auction data is deeply relational — a team bid connects bidders, items, and individual contributions. PostgreSQL handles JOINs natively; Firestore would need complex client-side aggregation.

**Why three separate views?**
At a real charity dinner, the admin (backstage), volunteers (roaming the room), and audience (watching a screen) have completely different needs. One generic dashboard serves none of them well.

**Why paddle numbers?**
Real auction houses use them because they're faster than name search. In a loud, fast-paced room, typing "7" beats searching for "Muhammad" among 8 results.

**Why real-time is critical?**
If the live display doesn't update instantly when a bid is placed, the audience loses trust and energy. Supabase real-time gives us this with ~3 lines of code per subscription.

---

## License

MIT — Built with ❤️ for Islamic Relief Canada
