"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useItems, useAuctionStats, useBids } from "@/lib/hooks";
import { formatCurrency, formatPaddle, formatTime } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/language-context";
import {
  Users,
  Maximize2,
  Minimize2,
  Trophy,
  Sparkles,
} from "lucide-react";

// ── Live Clock ──────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })
  );
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" }));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span
      style={{
        fontSize: "13px",
        fontFamily: '"DM Mono", monospace',
        color: "#5C5C5F",
        tabularNums: "true",
      } as React.CSSProperties}
    >
      {time}
    </span>
  );
}

// ── Odometer Number ─────────────────────────────────────────────────
function OdometerNumber({ value, className }: { value: number; className?: string }) {
  const prevValueRef = useRef(value);
  const [prevFormatted, setPrevFormatted] = useState(() => formatCurrency(value));
  const [currFormatted, setCurrFormatted] = useState(() => formatCurrency(value));

  useEffect(() => {
    if (value !== prevValueRef.current) {
      setPrevFormatted(formatCurrency(prevValueRef.current));
      setCurrFormatted(formatCurrency(value));
      prevValueRef.current = value;
    }
  }, [value]);

  const maxLen = Math.max(prevFormatted.length, currFormatted.length);
  const prevPadded = prevFormatted.padStart(maxLen, " ");
  const currPadded = currFormatted.padStart(maxLen, " ");

  return (
    <span className={`inline-flex items-end leading-none ${className ?? ""}`}>
      {currPadded.split("").map((char, i) => {
        const wasChar = prevPadded[i] ?? " ";
        const changed = char !== wasChar && char.trim() !== "";
        return (
          <span key={i} className="inline-block overflow-hidden" style={{ height: "1.1em" }}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={`${i}-${char}`}
                className="inline-block"
                initial={changed ? { y: "-115%", opacity: 0 } : false}
                animate={{ y: "0%", opacity: 1 }}
                exit={{ y: "115%", opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 22,
                  delay: changed ? (maxLen - 1 - i) * 0.022 : 0,
                }}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            </AnimatePresence>
          </span>
        );
      })}
    </span>
  );
}

// ── Confetti Burst ──────────────────────────────────────────────────
const CONFETTI_COLORS = ["#E2B340", "#34D399", "#EFC053", "#16A974", "#F5D78E", "#A3F2D2", "#A78BFA", "#f59e0b"];

function Confetti({ triggerKey }: { triggerKey: number }) {
  const [particles] = useState(() =>
    Array.from({ length: 48 }, (_, i) => ({
      id: i,
      x: 30 + Math.random() * 40,
      angle: Math.random() * 360,
      speed: 120 + Math.random() * 240,
      size: 5 + Math.random() * 10,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 0.3,
      shape: Math.random() > 0.5 ? "circle" : "square",
    }))
  );
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(t);
  }, [triggerKey]);

  if (!visible) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        return (
          <motion.div
            key={p.id}
            className={p.shape === "circle" ? "absolute rounded-full" : "absolute rotate-45"}
            style={{ left: `${p.x}%`, top: "38%", width: p.size, height: p.size, backgroundColor: p.color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(rad) * p.speed, y: Math.sin(rad) * p.speed - 150, opacity: 0, scale: 0.1 }}
            transition={{ duration: 1.5, delay: p.delay, ease: [0.2, 0.8, 0.4, 1] }}
          />
        );
      })}
    </div>
  );
}

// ── Auto-scaling item name ──────────────────────────────────────────
function AutoScaleText({ text }: { text: string }) {
  const len = text.length;
  const size = len <= 12 ? 5.5 : Math.max(2.8, 5.5 - ((len - 12) * 2.7) / 22);
  return (
    <h2
      style={{
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontSize: `${size}rem`,
        color: "#ECECEC",
        letterSpacing: "-0.02em",
        lineHeight: 1.05,
        fontWeight: 400,
      }}
    >
      {text}
    </h2>
  );
}

// ── Pulse ring on new bid ───────────────────────────────────────────
function PulseRing({ trigger }: { trigger: number }) {
  const [rings, setRings] = useState<number[]>([]);
  useEffect(() => {
    if (trigger === 0) return;
    const id = Date.now();
    setRings((r) => [...r, id]);
    setTimeout(() => setRings((r) => r.filter((x) => x !== id)), 1200);
  }, [trigger]);
  return (
    <>
      {rings.map((id) => (
        <motion.div
          key={id}
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{ border: "2px solid rgba(226,179,64,0.5)" }}
          initial={{ opacity: 0.8, scale: 1 }}
          animate={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      ))}
    </>
  );
}

// ── Main Display Page ───────────────────────────────────────────────
export default function DisplayPage() {
  const { activeItem } = useItems();
  const stats = useAuctionStats();
  const { bids: activeBids, highestBid } = useBids(activeItem?.id);
  const { t, toggleLang } = useLanguage();

  const [showBidFlash, setShowBidFlash] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const prevBidCount = useRef(0);
  const prevItemId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (activeBids.length > prevBidCount.current && prevBidCount.current > 0) {
      setShowBidFlash(true);
      setConfettiKey((k) => k + 1);
      setPulseKey((k) => k + 1);
      setTimeout(() => setShowBidFlash(false), 900);
    }
    prevBidCount.current = activeBids.length;
  }, [activeBids.length]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch { /* not available */ }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => { prevItemId.current = activeItem?.id; }, [activeItem?.id]);

  const latestBid = activeBids[0];
  const isTeamBid = latestBid?.is_team_bid;
  const bidValue = highestBid?.amount ?? activeItem?.starting_bid ?? 0;

  return (
    <div
      className="min-h-screen overflow-hidden relative select-none"
      style={{ background: "#000000", color: "#ECECEC" }}
    >
      {/* Subtle background orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute animate-[orb-drift_30s_ease-in-out_infinite]"
          style={{
            top: "-20%",
            left: "15%",
            width: 800,
            height: 800,
            background: "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute animate-[orb-drift-alt_24s_ease-in-out_infinite]"
          style={{
            bottom: "-20%",
            right: "15%",
            width: 700,
            height: 700,
            background: "radial-gradient(circle, rgba(226,179,64,0.05) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(60px)",
          }}
        />
        {/* Vignette */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)" }} />
      </div>

      {/* Bid flash */}
      <AnimatePresence>
        {showBidFlash && (
          <motion.div
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 pointer-events-none z-50"
            style={{ background: "rgba(226,179,64,0.06)" }}
          />
        )}
      </AnimatePresence>

      {/* Confetti */}
      {confettiKey > 0 && <Confetti key={confettiKey} triggerKey={confettiKey} />}

      {/* Top bar */}
      <header
        className="relative z-10 flex items-center justify-between px-10 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34D399" }} />
          <div>
            <p style={{ fontSize: "16px", fontWeight: 600, color: "#ECECEC" }}>BidFlow</p>
            <p
              style={{
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#3A3A3D",
              }}
            >
              {t.irc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <LiveClock />
          <button
            onClick={toggleLang}
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#3A3A3D",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#5C5C5F")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#3A3A3D")}
          >
            {t.switch_lang}
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34D399" }} />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#34D399",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              {t.live}
            </span>
          </div>
          <button
            onClick={toggleFullscreen}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.04)", color: "#5C5C5F" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
          >
            {isFullscreen
              ? <Minimize2 style={{ width: 15, height: 15 }} />
              : <Maximize2 style={{ width: 15, height: 15 }} />
            }
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 px-10 py-6 pb-28">
        <AnimatePresence mode="wait">
          {activeItem ? (
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, x: 60, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -60, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            >
              {/* 60% left / 40% right */}
              <div className="grid gap-10 items-start" style={{ gridTemplateColumns: "3fr 2fr" }}>

                {/* ── Left column ── */}
                <div>
                  <p
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.2em",
                      color: "#34D399",
                      marginBottom: 20,
                    }}
                  >
                    {t.now_auctioning}
                  </p>

                  {activeItem.image_url && (
                    <motion.div
                      key={activeItem.id + "-img"}
                      initial={{ opacity: 0, scale: 1.04 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="relative mb-5 rounded-2xl overflow-hidden"
                    >
                      <img
                        src={activeItem.image_url}
                        alt={activeItem.name}
                        className="w-full object-cover"
                        style={{ height: "clamp(180px, 22vh, 280px)" }}
                      />
                      <div
                        className="absolute inset-0"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }}
                      />
                    </motion.div>
                  )}

                  <motion.div
                    key={activeItem.id + "-name"}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                  >
                    <AutoScaleText text={activeItem.name} />
                  </motion.div>

                  {activeItem.description && (
                    <p style={{ fontSize: "15px", color: "#5C5C5F", lineHeight: 1.6, maxWidth: 560, marginTop: 8, marginBottom: 24 }}>
                      {activeItem.description}
                    </p>
                  )}

                  {/* ── HERO BID AMOUNT ── */}
                  <div className="mt-6">
                    <p
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.2em",
                        color: "rgba(226,179,64,0.6)",
                        marginBottom: 12,
                      }}
                    >
                      {highestBid ? t.current_highest : t.starting_bid}
                    </p>

                    <div className="relative inline-block">
                      <PulseRing trigger={pulseKey} />

                      <AnimatePresence>
                        {isTeamBid && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="flex items-center gap-2 mb-2"
                          >
                            <Trophy style={{ width: 14, height: 14, color: "#A78BFA" }} />
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#A78BFA",
                                textTransform: "uppercase",
                                letterSpacing: "0.15em",
                              }}
                            >
                              {t.team_bid_members(latestBid?.team_members?.length || 0)}
                            </span>
                            <Sparkles style={{ width: 12, height: 12, color: "#A78BFA" }} className="animate-pulse" />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.div
                        key={bidValue}
                        initial={{ scale: 1.04, opacity: 0.7 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 14 }}
                        style={{
                          fontFamily: '"DM Serif Display", Georgia, serif',
                          fontSize: "clamp(4rem, 8vw, 80px)",
                          color: "#E2B340",
                          textShadow: "0 0 60px rgba(226,179,64,0.2), 0 0 120px rgba(226,179,64,0.08)",
                          lineHeight: 1,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        <OdometerNumber value={bidValue} />
                      </motion.div>
                    </div>

                    {highestBid && (
                      <motion.div
                        key={highestBid.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mt-4 flex items-center gap-3"
                      >
                        {highestBid.is_team_bid ? (
                          <span
                            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold"
                            style={{
                              background: "rgba(167,139,250,0.1)",
                              border: "1px solid rgba(167,139,250,0.2)",
                              color: "#A78BFA",
                            }}
                          >
                            <Users style={{ width: 14, height: 14 }} />
                            {t.team_bid}
                          </span>
                        ) : highestBid.bidder ? (
                          <span
                            className="px-4 py-1.5 rounded-full text-sm font-medium"
                            style={{
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.06)",
                              color: "#8A8A8D",
                            }}
                          >
                            {t.paddle_attr(formatPaddle(highestBid.bidder.paddle_number), highestBid.bidder.name)}
                          </span>
                        ) : null}
                        <span style={{ fontSize: "13px", color: "#3A3A3D" }}>
                          {activeBids.length} bid{activeBids.length !== 1 ? "s" : ""}
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* ── Right column: Bid Feed ── */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-4">
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "#3A3A3D",
                      }}
                    >
                      {t.bid_activity}
                    </span>
                    {activeBids.length > 0 && (
                      <span style={{ fontSize: "11px", color: "#3A3A3D", fontFamily: '"DM Mono", monospace' }}>
                        {activeBids.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 overflow-auto pr-1" style={{ maxHeight: "calc(100vh - 220px)" }}>
                    <AnimatePresence initial={false}>
                      {activeBids.slice(0, 12).map((bid, i) => (
                        <motion.div
                          key={bid.id}
                          initial={{ opacity: 0, x: 40, scale: 0.96 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ type: "spring", stiffness: 320, damping: 28 }}
                          className="p-3.5 rounded-2xl"
                          style={{
                            background: i === 0
                              ? "rgba(52,211,153,0.04)"
                              : "rgba(255,255,255,0.02)",
                            border: `1px solid ${i === 0 ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.04)"}`,
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{
                                  background: bid.is_team_bid
                                    ? "rgba(167,139,250,0.1)"
                                    : i === 0
                                    ? "rgba(52,211,153,0.12)"
                                    : "rgba(255,255,255,0.04)",
                                  color: bid.is_team_bid ? "#A78BFA" : i === 0 ? "#34D399" : "#5C5C5F",
                                }}
                              >
                                {bid.is_team_bid
                                  ? <Users style={{ width: 14, height: 14 }} />
                                  : bid.bidder ? formatPaddle(bid.bidder.paddle_number) : "?"
                                }
                              </div>
                              <div className="min-w-0">
                                <p
                                  className="truncate"
                                  style={{
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    color: i === 0 ? "#ECECEC" : "#8A8A8D",
                                  }}
                                >
                                  {bid.is_team_bid
                                    ? `Team (${bid.team_members?.length || 0})`
                                    : bid.bidder?.name || "Anonymous"
                                  }
                                </p>
                                <p style={{ fontSize: "11px", color: "#3A3A3D" }}>{formatTime(bid.created_at)}</p>
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: "15px",
                                fontWeight: 400,
                                fontFamily: '"DM Serif Display", Georgia, serif',
                                color: i === 0 ? "#E2B340" : "#5C5C5F",
                                flexShrink: 0,
                              }}
                            >
                              {formatCurrency(bid.amount)}
                            </span>
                          </div>

                          {bid.is_team_bid && bid.team_members && bid.team_members.length > 0 && (
                            <div
                              className="mt-2.5 pt-2.5 space-y-1"
                              style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                            >
                              {bid.team_members.map((tm) => (
                                <div key={tm.id} className="flex justify-between">
                                  <span style={{ fontSize: "11px", color: "#3A3A3D" }}>
                                    {tm.bidder ? `${formatPaddle(tm.bidder.paddle_number)} ${tm.bidder.name}` : "Member"}
                                  </span>
                                  <span style={{ fontSize: "11px", color: "#5C5C5F", fontWeight: 500 }}>
                                    {formatCurrency(tm.contribution)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {activeBids.length === 0 && (
                      <div className="text-center py-16">
                        <p style={{ fontSize: "13px", color: "#2A2A2E" }}>{t.waiting_first}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ── Waiting screen ── */
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.7 }}
              className="flex flex-col items-center justify-center"
              style={{ minHeight: "72vh" }}
            >
              {/* Pulsing emerald dot */}
              <motion.div
                animate={{ scale: [1, 1.08, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-3 h-3 rounded-full mb-12"
                style={{ background: "#34D399", boxShadow: "0 0 20px rgba(52,211,153,0.4)" }}
              />

              <h2
                style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: "clamp(3rem, 6vw, 56px)",
                  color: "#ECECEC",
                  textAlign: "center",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                  marginBottom: 16,
                  fontWeight: 400,
                }}
              >
                {t.charity_auction}
              </h2>
              <p style={{ fontSize: "16px", color: "#3A3A3D", textAlign: "center" }}>
                {t.next_item_soon}
              </p>

              <div className="mt-12 flex items-center gap-4">
                <div
                  className="h-px w-16"
                  style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.06))" }}
                />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#2A2A2E",
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                  }}
                >
                  {t.irc_x_bidflow}
                </span>
                <div
                  className="h-px w-16"
                  style={{ background: "linear-gradient(to left, transparent, rgba(255,255,255,0.06))" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom stats bar ── */}
      <footer
        className="fixed bottom-0 left-0 right-0 z-10"
        style={{
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div className="px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Total Raised */}
            <div>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#3A3A3D",
                  marginBottom: 2,
                }}
              >
                {t.stat_total_raised}
              </p>
              <div
                style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: "36px",
                  color: "#E2B340",
                  textShadow: "0 0 24px rgba(226,179,64,0.3), 0 0 50px rgba(226,179,64,0.12)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                }}
              >
                <OdometerNumber value={stats.totalRaised} />
              </div>
            </div>

            <div
              className="w-px h-10"
              style={{ background: "rgba(255,255,255,0.04)" }}
            />

            <div className="flex items-center gap-6">
              {[
                { label: t.stat_items_sold, value: stats.itemsSold },
                { label: t.stat_total_bids, value: stats.totalBids },
                { label: t.stat_team_bids, value: stats.teamBids },
                { label: t.stat_bidders, value: stats.bidderCount },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p
                    style={{
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#ECECEC",
                      fontFamily: '"DM Mono", monospace',
                      lineHeight: 1.2,
                    }}
                  >
                    {s.value}
                  </p>
                  <p
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#3A3A3D",
                    }}
                  >
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <span style={{ fontSize: "11px", color: "#2A2A2E" }}>
            {t.every_dollar}
          </span>
        </div>
      </footer>
    </div>
  );
}
