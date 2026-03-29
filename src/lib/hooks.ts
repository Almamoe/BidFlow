"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";
import type { Bidder, Item, Bid, TeamMember, AuctionStats } from "./types";

// ─── Bidders ───────────────────────────────────────────

export function useBidders() {
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("bidders")
      .select("*")
      .order("paddle_number", { ascending: true });
    if (data) setBidders(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel("bidders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bidders" },
        () => fetch()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  return { bidders, loading, refetch: fetch };
}

// ─── Items ─────────────────────────────────────────────

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("items")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel("items-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items" },
        () => fetch()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  const activeItem = items.find((i) => i.status === "active") || null;

  return { items, activeItem, loading, refetch: fetch };
}

// ─── Bids (with joins) ────────────────────────────────

export function useBids(itemId?: string) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    let query = supabase
      .from("bids")
      .select(`*, bidder:bidders(*), team_members(*, bidder:bidders(*))`)
      .order("created_at", { ascending: false });

    if (itemId) {
      query = query.eq("item_id", itemId);
    }

    const { data } = await query;
    if (data) setBids(data as Bid[]);
    setLoading(false);
  }, [itemId]);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel(`bids-changes-${itemId || "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bids" },
        () => fetch()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_members" },
        () => fetch()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch, itemId]);

  const highestBid = bids.length > 0
    ? bids.reduce((max, b) => (b.amount > max.amount ? b : max), bids[0])
    : null;

  return { bids, highestBid, loading, refetch: fetch };
}

// ─── All bids (for display) ──────────────────────────

export function useAllBids() {
  const [bids, setBids] = useState<Bid[]>([]);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("bids")
      .select(`*, bidder:bidders(*), item:items(*), team_members(*, bidder:bidders(*))`)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setBids(data as Bid[]);
  }, []);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel("all-bids-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bids" },
        () => fetch()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  return { bids, refetch: fetch };
}

// ─── Auction stats ────────────────────────────────────

export function useAuctionStats() {
  const [stats, setStats] = useState<AuctionStats>({
    totalRaised: 0,
    itemsSold: 0,
    totalBids: 0,
    teamBids: 0,
    bidderCount: 0,
    activeItem: null,
  });

  const fetch = useCallback(async () => {
    const [bidsRes, itemsRes, biddersRes] = await Promise.all([
      supabase.from("bids").select("amount, is_team_bid"),
      supabase.from("items").select("*"),
      supabase.from("bidders").select("id"),
    ]);

    const allBids = bidsRes.data || [];
    const allItems = (itemsRes.data || []) as Item[];

    setStats({
      totalRaised: allBids.reduce((sum, b) => sum + Number(b.amount), 0),
      itemsSold: allItems.filter((i) => i.status === "sold").length,
      totalBids: allBids.length,
      teamBids: allBids.filter((b) => b.is_team_bid).length,
      bidderCount: (biddersRes.data || []).length,
      activeItem: allItems.find((i) => i.status === "active") || null,
    });
  }, []);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel("stats-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "bids" }, () => fetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, () => fetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "bidders" }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  return stats;
}

// ─── Bidder totals (for checkout) ─────────────────────

export function useBidderTotals() {
  const [totals, setTotals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from("bidder_totals").select("*");
    if (data) setTotals(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel("checkout-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "bids" }, () => fetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "team_members" }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  return { totals, loading, refetch: fetch };
}
