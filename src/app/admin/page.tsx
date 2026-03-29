"use client";

import { useEffect, useState } from "react";
import { useAuctionStats, useAllBids, useItems } from "@/lib/hooks";
import { formatCurrency, formatRelativeTime, formatPaddle } from "@/lib/utils";
import {
  DollarSign, Gavel, Users, TrendingUp, Package, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/language-context";

function useNow(intervalMs = 30000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}

export default function AdminDashboard() {
  const stats = useAuctionStats();
  const { bids } = useAllBids();
  const { items } = useItems();
  const { t } = useLanguage();
  useNow();

  const soldCount = items.filter((i) => i.status === "sold").length;
  const auctionProgress = items.length > 0 ? Math.round((soldCount / items.length) * 100) : 0;

  const statCards = [
    { label: t.stat_total_raised, value: formatCurrency(stats.totalRaised), icon: DollarSign, valueStyle: { color: "#E2B340" } },
    { label: t.stat_items_sold, value: `${stats.itemsSold} / ${items.length}`, icon: Gavel, valueStyle: { color: "#ECECEC" } },
    { label: t.stat_total_bids, value: String(stats.totalBids), icon: TrendingUp, valueStyle: { color: "#ECECEC" } },
    { label: t.stat_team_bids, value: String(stats.teamBids), icon: Users, valueStyle: { color: "#ECECEC" } },
  ];

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">{t.dashboard_title}</h1>
            <p className="mt-1" style={{ fontSize: "13px", color: "#5C5C5F" }}>
              {t.dashboard_subtitle}
            </p>
          </div>
          <Link href="/admin/items" className="btn-primary text-sm">
            {t.set_item_live}
          </Link>
        </div>

        {/* Active item banner */}
        {stats.activeItem && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34D399" }} />
            <span style={{ fontSize: "13px", color: "#5C5C5F" }}>
              {t.currently_live}{" "}
              <span style={{ color: "#ECECEC", fontWeight: 500 }}>{stats.activeItem.name}</span>
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="stat-card"
          >
            <div className="flex items-center justify-between mb-4">
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#5C5C5F",
                }}
              >
                {stat.label}
              </span>
              <stat.icon style={{ width: 16, height: 16, color: "#3A3A3D" }} />
            </div>
            <p
              style={{
                fontSize: "28px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                ...stat.valueStyle,
              }}
            >
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Auction progress */}
      {items.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="card p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#5C5C5F",
              }}
            >
              {t.auction_progress}
            </span>
            <span style={{ fontSize: "12px", color: "#5C5C5F" }}>
              {t.items_sold_of(soldCount, items.length)}
            </span>
          </div>
          <div className="w-full rounded-full overflow-hidden" style={{ height: "3px", background: "#1C1C1F" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${auctionProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
              className="h-full rounded-full"
              style={{ background: "#34D399" }}
            />
          </div>
          <div className="flex items-center gap-5 mt-3">
            {[
              { dot: "#232326", label: `${items.filter(i => i.status === "upcoming").length} ${t.upcoming}` },
              ...(stats.activeItem ? [{ dot: "#34D399", label: `1 ${t.live_now}`, pulse: true }] : []),
              { dot: "#E2B340", label: `${soldCount} ${t.sold_label}` },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <div
                  className={s.pulse ? "w-1.5 h-1.5 rounded-full animate-pulse" : "w-1.5 h-1.5 rounded-full"}
                  style={{ background: s.dot }}
                />
                <span style={{ fontSize: "12px", color: "#5C5C5F" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bids */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#5C5C5F",
              }}
            >
              {t.recent_activity}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34D399" }} />
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#34D399", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {t.live}
              </span>
            </div>
          </div>

          {bids.length === 0 ? (
            <div className="py-12 text-center">
              <Gavel style={{ width: 24, height: 24, color: "#2A2A2E", margin: "0 auto 8px" }} />
              <p style={{ fontSize: "13px", color: "#3A3A3D" }}>{t.no_bids_yet}</p>
            </div>
          ) : (
            <div className="space-y-1">
              <AnimatePresence initial={false}>
                {bids.slice(0, 8).map((bid, i) => (
                  <motion.div
                    key={bid.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors duration-200"
                    style={{
                      borderLeft: i === 0 ? "2px solid rgba(52,211,153,0.3)" : "2px solid transparent",
                      background: i === 0 ? "rgba(52,211,153,0.02)" : "transparent",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i === 0 ? "rgba(52,211,153,0.02)" : "transparent")}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-semibold flex-shrink-0"
                      style={{
                        background: bid.is_team_bid ? "rgba(167,139,250,0.1)" : "rgba(255,255,255,0.04)",
                        color: bid.is_team_bid ? "#A78BFA" : "#5C5C5F",
                      }}
                    >
                      {bid.is_team_bid ? "T" : bid.bidder ? formatPaddle(bid.bidder.paddle_number) : "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: "13px", fontWeight: 500, color: "#ECECEC" }}>
                        {bid.is_team_bid ? t.team_bid_n(bid.team_members?.length || 0) : bid.bidder?.name || t.unknown_label}
                      </p>
                      <p className="truncate" style={{ fontSize: "11px", color: "#3A3A3D" }}>
                        {bid.item?.name || t.item_label}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#ECECEC",
                          fontFamily: '"DM Serif Display", Georgia, serif',
                        }}
                      >
                        {formatCurrency(bid.amount)}
                      </p>
                      <p style={{ fontSize: "11px", color: "#3A3A3D" }}>
                        {formatRelativeTime(bid.created_at)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Auction Queue */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#5C5C5F",
              }}
            >
              {t.auction_queue}
            </span>
            <Link
              href="/admin/items"
              className="flex items-center gap-1 transition-colors duration-200"
              style={{ fontSize: "12px", color: "#5C5C5F" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ECECEC")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#5C5C5F")}
            >
              {t.manage} <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>

          <div className="space-y-1">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors duration-200 cursor-default"
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "#1C1C1F" }}
                  >
                    <Package style={{ width: 14, height: 14, color: "#3A3A3D" }} />
                  </div>
                )}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  {item.status === "active" && (
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: "#34D399" }} />
                  )}
                  <p className="truncate" style={{ fontSize: "13px", fontWeight: 500, color: "#ECECEC" }}>
                    {item.name}
                  </p>
                </div>
                <span className={item.status === "active" ? "badge-active" : item.status === "sold" ? "badge-sold" : "badge-upcoming"}>
                  {item.status === "active" ? t.status_active : item.status === "sold" ? t.sold_label : t.upcoming}
                </span>
              </motion.div>
            ))}

            {items.length === 0 && (
              <div className="py-12 text-center">
                <Package style={{ width: 24, height: 24, color: "#2A2A2E", margin: "0 auto 8px" }} />
                <p style={{ fontSize: "13px", color: "#3A3A3D" }}>{t.no_items_yet}</p>
                <Link href="/admin/items" style={{ fontSize: "12px", color: "#34D399" }}>
                  {t.add_items}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
