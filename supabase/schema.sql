-- ============================================
-- BidFlow — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Bidders (people at the charity dinner)
CREATE TABLE bidders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paddle_number SERIAL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  table_number INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auction items
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  starting_bid DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'sold')),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bids on items
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  bidder_id UUID REFERENCES bidders(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  is_team_bid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team bid members (tracks individual contributions)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bid_id UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES bidders(id) ON DELETE CASCADE,
  contribution DECIMAL(10,2) NOT NULL CHECK (contribution >= 0),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for performance
-- ============================================

CREATE INDEX idx_bids_item ON bids(item_id);
CREATE INDEX idx_bids_bidder ON bids(bidder_id);
CREATE INDEX idx_bids_created ON bids(created_at DESC);
CREATE INDEX idx_team_members_bid ON team_members(bid_id);
CREATE INDEX idx_team_members_bidder ON team_members(bidder_id);
CREATE INDEX idx_items_status ON items(status);

-- ============================================
-- VIEWS for convenient queries
-- ============================================

-- Get the highest bid per item
CREATE OR REPLACE VIEW item_highest_bids AS
SELECT DISTINCT ON (item_id)
  item_id,
  id AS bid_id,
  amount,
  bidder_id,
  is_team_bid,
  created_at
FROM bids
ORDER BY item_id, amount DESC, created_at DESC;

-- Get what each bidder owes (solo bids + team contributions)
CREATE OR REPLACE VIEW bidder_totals AS
SELECT
  b.id AS bidder_id,
  b.name,
  b.paddle_number,
  b.phone,
  b.email,
  COALESCE(solo.total, 0) AS solo_total,
  COALESCE(team.total, 0) AS team_total,
  COALESCE(solo.total, 0) + COALESCE(team.total, 0) AS grand_total,
  COALESCE(team.pending_amount, 0) AS pending_amount,
  CASE
    WHEN COALESCE(solo.total, 0) + COALESCE(team.total, 0) = 0 THEN 'none'
    WHEN COALESCE(team.pending_amount, 0) > 0 THEN 'pending'
    ELSE 'paid'
  END AS overall_status
FROM bidders b
LEFT JOIN (
  SELECT bidder_id, SUM(amount) AS total
  FROM bids
  WHERE is_team_bid = FALSE
  GROUP BY bidder_id
) solo ON solo.bidder_id = b.id
LEFT JOIN (
  SELECT
    bidder_id,
    SUM(contribution) AS total,
    SUM(CASE WHEN payment_status = 'pending' THEN contribution ELSE 0 END) AS pending_amount
  FROM team_members
  GROUP BY bidder_id
) team ON team.bidder_id = b.id;

-- ============================================
-- ENABLE REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE bids;
ALTER PUBLICATION supabase_realtime ADD TABLE items;
ALTER PUBLICATION supabase_realtime ADD TABLE bidders;
ALTER PUBLICATION supabase_realtime ADD TABLE team_members;

-- ============================================
-- ROW LEVEL SECURITY (allow all for hackathon)
-- In production, you'd restrict by auth role
-- ============================================

ALTER TABLE bidders ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to bidders" ON bidders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to items" ON items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to bids" ON bids FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to team_members" ON team_members FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- SEED DATA (for demo)
-- ============================================

INSERT INTO bidders (name, phone, email, table_number) VALUES
  ('Sarah Al-Rashid', '519-555-0101', 'sarah.r@email.com', 1),
  ('Ahmed Khan', '519-555-0102', 'ahmed.k@email.com', 1),
  ('Fatima Osman', '519-555-0103', 'fatima.o@email.com', 2),
  ('Omar Haddad', '519-555-0104', 'omar.h@email.com', 2),
  ('Aisha Yusuf', '519-555-0105', 'aisha.y@email.com', 3),
  ('Bilal Mahmoud', '519-555-0106', 'bilal.m@email.com', 3),
  ('Mariam Nasser', '519-555-0107', 'mariam.n@email.com', 4),
  ('Zain Ibrahim', '519-555-0108', 'zain.i@email.com', 4),
  ('Layla Berrada', '519-555-0109', 'layla.b@email.com', 5),
  ('Hassan Ali', '519-555-0110', 'hassan.a@email.com', 5),
  ('Noor Sheikh', '519-555-0111', 'noor.s@email.com', 6),
  ('Yusuf Qureshi', '519-555-0112', 'yusuf.q@email.com', 6),
  ('Khadijah Patel', '519-555-0113', 'khadijah.p@email.com', 7),
  ('Idris Mohamud', '519-555-0114', 'idris.m@email.com', 7),
  ('Amina Syed', '519-555-0115', 'amina.s@email.com', 8);

INSERT INTO items (name, description, image_url, starting_bid, status, sort_order) VALUES
  ('Hand-painted Ceramic Vase', 'Exquisite Moroccan-style ceramic vase with intricate blue and gold patterns. Handcrafted by a local artisan.', 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600', 50.00, 'sold', 1),
  ('Silk Embroidered Scarf', 'Luxurious hand-embroidered silk scarf with traditional Islamic geometric patterns in emerald and gold.', 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600', 75.00, 'sold', 2),
  ('Calligraphy Art Print', 'Large-format Arabic calligraphy print — Surah Al-Fatiha in gold leaf on midnight blue. Framed and signed.', 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=600', 100.00, 'active', 3),
  ('Luxury Oud Gift Set', 'Premium Arabian oud collection — perfume oil, incense sticks, and bakhoor in a handcrafted wooden box.', 'https://images.unsplash.com/photo-1594035910387-fea081ac45b1?w=600', 60.00, 'upcoming', 4),
  ('Weekend Getaway Package', 'Two-night stay at a lakeside cottage in Muskoka. Donated by Brother Kareem''s family.', 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=600', 200.00, 'upcoming', 5),
  ('Handmade Quilt', 'Queen-sized quilt in warm earth tones with hand-stitched star pattern. Made by the IRC sisters'' crafting circle.', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600', 80.00, 'upcoming', 6),
  ('Private Cooking Class', 'In-home Middle Eastern cooking masterclass for 8 guests by Chef Amira. Includes all ingredients and recipes.', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600', 150.00, 'upcoming', 7),
  ('Antique Brass Lantern', 'Vintage Moroccan-style brass lantern with stained glass panels. A statement piece for any home.', 'https://images.unsplash.com/photo-1530968033775-2c92736b131e?w=600', 40.00, 'upcoming', 8),
  ('Children''s Book Bundle', 'Curated collection of 20 award-winning Islamic children''s books. Ages 3-12. Gift-wrapped.', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600', 30.00, 'upcoming', 9),
  ('Custom Jewelry Piece', 'Gift certificate for a custom-designed piece from Noor Jewellers. Up to $500 value.', 'https://images.unsplash.com/photo-1515562141589-67f0d93b0154?w=600', 120.00, 'upcoming', 10);
