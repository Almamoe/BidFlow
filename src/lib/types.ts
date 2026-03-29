export interface Bidder {
  id: string;
  paddle_number: number;
  name: string;
  phone: string | null;
  email: string | null;
  table_number: number | null;
  created_at: string;
}

export interface Item {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  starting_bid: number;
  status: "upcoming" | "active" | "sold";
  sort_order: number;
  created_at: string;
}

export interface Bid {
  id: string;
  item_id: string;
  bidder_id: string | null;
  amount: number;
  is_team_bid: boolean;
  created_at: string;
  // Joined data
  bidder?: Bidder;
  item?: Item;
  team_members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  bid_id: string;
  bidder_id: string;
  contribution: number;
  payment_status: "pending" | "paid";
  created_at: string;
  // Joined
  bidder?: Bidder;
}

export interface BidderTotal {
  bidder_id: string;
  name: string;
  paddle_number: number;
  phone: string | null;
  email: string | null;
  solo_total: number;
  team_total: number;
  grand_total: number;
  pending_amount: number;
  overall_status: "none" | "pending" | "paid";
}

export interface AuctionStats {
  totalRaised: number;
  itemsSold: number;
  totalBids: number;
  teamBids: number;
  bidderCount: number;
  activeItem: Item | null;
}
