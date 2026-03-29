"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useItems, useBidders, useBids } from "@/lib/hooks";
import { supabase } from "@/lib/supabase";
import {
  formatCurrency,
  formatPaddle,
  formatTime,
  getInitials,
} from "@/lib/utils";
import {
  ChevronLeft,
  Gavel,
  Users,
  Search,
  Plus,
  X,
  Zap,
  Clock,
  UserPlus,
  SplitSquareVertical,
  Send,
  Loader2,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { Bidder, Bid } from "@/lib/types";
import { useLanguage } from "@/lib/language-context";

type BidMode = "solo" | "team";

interface TeamEntry {
  bidder: Bidder;
  contribution: string;
}

// ── Web Audio success beep ──────────────────────────────────────────
function playSuccessBeep() {
  try {
    const ctx = new (window.AudioContext ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // audio not supported
  }
}

// ── Haptic feedback ─────────────────────────────────────────────────
function vibrate() {
  try {
    navigator.vibrate?.([80, 40, 80]);
  } catch {
    // not available
  }
}

// ── Success overlay ─────────────────────────────────────────────────
function SuccessOverlay({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-32 h-32 rounded-full flex items-center justify-center"
            style={{ background: "#34D399", boxShadow: "0 0 80px rgba(52,211,153,0.4)" }}
          >
            <CheckCircle2 className="w-16 h-16" style={{ color: "#0C0C0E" }} strokeWidth={2} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Avatar colors ───────────────────────────────────────────────────
const avatarColors = [
  { bg: "rgba(52,211,153,0.1)", color: "#34D399" },
  { bg: "rgba(251,181,133,0.1)", color: "#FBBF77" },
  { bg: "rgba(167,139,250,0.1)", color: "#A78BFA" },
  { bg: "rgba(96,165,250,0.1)", color: "#60A5FA" },
  { bg: "rgba(251,113,133,0.1)", color: "#FB7185" },
  { bg: "rgba(45,212,191,0.1)", color: "#2DD4BF" },
];

// ── Main Component ──────────────────────────────────────────────────
export default function VolunteerPage() {
  const { activeItem } = useItems();
  const { bidders } = useBidders();
  const { bids, highestBid } = useBids(activeItem?.id);
  const { t, toggleLang } = useLanguage();

  const [mode, setMode] = useState<BidMode>("solo");
  const [paddleSearch, setPaddleSearch] = useState("");
  const [selectedBidder, setSelectedBidder] = useState<Bidder | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastBid, setLastBid] = useState<{
    name: string;
    amount: number;
    isTeam?: boolean;
    memberCount?: number;
  } | null>(null);

  const [teamMembers, setTeamMembers] = useState<TeamEntry[]>([]);
  const [teamSearch, setTeamSearch] = useState("");
  const [teamTotal, setTeamTotal] = useState("");

  const paddleRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const filteredBidders = paddleSearch.trim()
    ? bidders
        .filter(
          (b) =>
            String(b.paddle_number).includes(paddleSearch) ||
            b.name.toLowerCase().includes(paddleSearch.toLowerCase())
        )
        .slice(0, 8)
    : [];

  const teamFilteredBidders = teamSearch.trim()
    ? bidders
        .filter(
          (b) =>
            !teamMembers.some((tm) => tm.bidder.id === b.id) &&
            (String(b.paddle_number).includes(teamSearch) ||
              b.name.toLowerCase().includes(teamSearch.toLowerCase()))
        )
        .slice(0, 6)
    : [];

  const currentBid = highestBid?.amount || activeItem?.starting_bid || 0;
  const quickAmounts = currentBid > 0
    ? [
        Math.ceil((currentBid * 1.05) / 25) * 25,
        Math.ceil((currentBid * 1.15) / 25) * 25,
        Math.ceil((currentBid * 1.25) / 25) * 25,
        Math.ceil((currentBid * 1.5) / 25) * 25,
        Math.ceil((currentBid * 2) / 50) * 50,
      ].filter((v, i, arr) => arr.indexOf(v) === i && v > currentBid)
    : [50, 100, 150, 200, 250, 500];

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (mode === "solo") {
          setSelectedBidder(null);
          setBidAmount("");
          setPaddleSearch("");
          paddleRef.current?.focus();
        } else {
          setTeamMembers([]);
          setTeamSearch("");
          setTeamTotal("");
        }
        return;
      }
      if (e.key === "Enter" && e.ctrlKey && !submitting) {
        if (mode === "solo" && selectedBidder && bidAmount) {
          submitSoloBid();
        } else if (mode === "team" && teamMembers.length >= 2 && teamTotal) {
          submitTeamBid();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedBidder, bidAmount, teamMembers, teamTotal, submitting]);

  function selectBidder(bidder: Bidder) {
    setSelectedBidder(bidder);
    setPaddleSearch("");
    setTimeout(() => amountRef.current?.focus(), 100);
  }

  function addTeamMember(bidder: Bidder) {
    setTeamMembers((prev) => [...prev, { bidder, contribution: "" }]);
    setTeamSearch("");
  }

  function removeTeamMember(bidderId: string) {
    setTeamMembers((prev) => prev.filter((m) => m.bidder.id !== bidderId));
  }

  function updateContribution(bidderId: string, value: string) {
    setTeamMembers((prev) =>
      prev.map((m) => (m.bidder.id === bidderId ? { ...m, contribution: value } : m))
    );
  }

  function splitEvenly() {
    const total = parseFloat(teamTotal);
    if (!total || teamMembers.length === 0) return;
    const perPerson = (total / teamMembers.length).toFixed(2);
    setTeamMembers((prev) => prev.map((m) => ({ ...m, contribution: perPerson })));
    toast.success(t.split_evenly_label(formatCurrency(total), teamMembers.length) + ` — ${formatCurrency(parseFloat(perPerson))}`);
  }

  function triggerSuccess() {
    setShowSuccess(true);
    playSuccessBeep();
    vibrate();
    setTimeout(() => setShowSuccess(false), 1400);
  }

  async function submitSoloBid() {
    if (!selectedBidder || !activeItem) return;
    const amount = parseFloat(bidAmount);
    if (!amount || amount <= 0) {
      toast.error(t.step2_amount);
      return;
    }
    if (highestBid && amount <= highestBid.amount) {
      toast.error(`${t.high_label} ${formatCurrency(highestBid.amount)}`);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("bids").insert({
      item_id: activeItem.id,
      bidder_id: selectedBidder.id,
      amount,
      is_team_bid: false,
    });
    if (error) {
      toast.error("Failed to submit bid");
    } else {
      triggerSuccess();
      toast.success(`${formatCurrency(amount)} — ${selectedBidder.name}`);
      setLastBid({ name: selectedBidder.name, amount });
      setSelectedBidder(null);
      setBidAmount("");
      setPaddleSearch("");
      setTimeout(() => paddleRef.current?.focus(), 200);
    }
    setSubmitting(false);
  }

  async function submitTeamBid() {
    if (!activeItem || teamMembers.length < 2) {
      toast.error(t.add_one_more);
      return;
    }
    const total = parseFloat(teamTotal);
    const contributionSum = teamMembers.reduce((s, m) => s + (parseFloat(m.contribution) || 0), 0);
    if (!total || total <= 0) {
      toast.error(t.step2_total);
      return;
    }
    if (Math.abs(contributionSum - total) > 0.01) {
      toast.error(`${t.contributions_sum}: ${formatCurrency(contributionSum)} / ${formatCurrency(total)}`);
      return;
    }
    setSubmitting(true);
    const { data: bid, error: bidError } = await supabase
      .from("bids")
      .insert({ item_id: activeItem.id, bidder_id: teamMembers[0].bidder.id, amount: total, is_team_bid: true })
      .select()
      .single();
    if (bidError || !bid) {
      toast.error("Failed to create team bid");
      setSubmitting(false);
      return;
    }
    const memberInserts = teamMembers.map((m) => ({
      bid_id: bid.id,
      bidder_id: m.bidder.id,
      contribution: parseFloat(m.contribution) || 0,
      payment_status: "pending" as const,
    }));
    const { error: memberError } = await supabase.from("team_members").insert(memberInserts);
    if (memberError) {
      toast.error("Bid created but failed to add some team members");
    } else {
      triggerSuccess();
      toast.success(`${t.team_bid} — ${formatCurrency(total)} (${teamMembers.length})`);
      setLastBid({ name: t.team_bid, amount: total, isTeam: true, memberCount: teamMembers.length });
    }
    setTeamMembers([]);
    setTeamTotal("");
    setTeamSearch("");
    setSubmitting(false);
  }

  const contributionSum = teamMembers.reduce((s, m) => s + (parseFloat(m.contribution) || 0), 0);
  const totalFloat = parseFloat(teamTotal) || 0;
  const sumsMatch = teamMembers.length > 0 && totalFloat > 0 ? Math.abs(contributionSum - totalFloat) < 0.01 : false;

  return (
    <div className="min-h-screen" style={{ background: "#0C0C0E" }}>
      <SuccessOverlay visible={showSuccess} />

      {/* Sticky header */}
      <header
        className="sticky top-0 z-20"
        style={{
          background: "rgba(12,12,14,0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="max-w-xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 transition-colors duration-200"
            style={{ fontSize: "13px", color: "#5C5C5F" }}
          >
            <ChevronLeft style={{ width: 14, height: 14 }} />
            <span style={{ color: "#ECECEC", fontWeight: 600 }}>BidFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLang}
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#3A3A3D",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#8A8A8D")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#3A3A3D")}
            >
              {t.switch_lang}
            </button>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34D399" }} />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#34D399",
                }}
              >
                {t.volunteer_station}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Last bid banner */}
        <AnimatePresence>
          {lastBid && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{
                background: "rgba(52,211,153,0.05)",
                border: "1px solid rgba(52,211,153,0.15)",
              }}
            >
              <CheckCircle2 style={{ width: 16, height: 16, color: "#34D399", flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: "11px", fontWeight: 600, color: "#34D399", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
                  {t.last_submitted}
                </p>
                <p className="truncate" style={{ fontSize: "13px", fontWeight: 500, color: "#ECECEC" }}>
                  {lastBid.isTeam ? t.team_n_members(lastBid.memberCount || 0) : lastBid.name} — {formatCurrency(lastBid.amount)}
                </p>
              </div>
              <button
                onClick={() => setLastBid(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: "#34D399" }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active item banner */}
        {activeItem ? (
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-5"
            style={{ borderTop: "2px solid rgba(52,211,153,0.4)" }}
          >
            <div className="flex items-start gap-4">
              {activeItem.image_url && (
                <img
                  src={activeItem.image_url}
                  alt={activeItem.name}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Zap style={{ width: 14, height: 14, color: "#34D399" }} />
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#34D399", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {t.now_auctioning}
                  </span>
                </div>
                <h2 style={{ fontSize: "17px", fontWeight: 600, color: "#ECECEC", marginBottom: 4 }}>
                  {activeItem.name}
                </h2>
                <div className="flex items-center gap-4">
                  <span style={{ fontSize: "13px", color: "#5C5C5F" }}>
                    {t.start_label} {formatCurrency(activeItem.starting_bid)}
                  </span>
                  {highestBid && (
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#E2B340" }}>
                      {t.high_label} {formatCurrency(highestBid.amount)}
                    </span>
                  )}
                  <span style={{ fontSize: "13px", color: "#5C5C5F" }}>
                    {t.bid_count(bids.length)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="card p-12 text-center">
            <Clock style={{ width: 28, height: 28, color: "#2A2A2E", margin: "0 auto 10px" }} />
            <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#5C5C5F", marginBottom: 4 }}>
              {t.waiting_for_item}
            </h2>
            <p style={{ fontSize: "13px", color: "#3A3A3D" }}>
              {t.waiting_desc}
            </p>
          </div>
        )}

        {activeItem && (
          <>
            {/* Mode toggle */}
            <div
              className="flex items-center p-1 rounded-2xl"
              style={{ background: "#141416", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <button
                onClick={() => setMode("solo")}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl transition-all duration-200"
                style={{
                  height: 48,
                  fontSize: "14px",
                  fontWeight: 600,
                  background: mode === "solo" ? "#34D399" : "transparent",
                  color: mode === "solo" ? "#0C0C0E" : "#5C5C5F",
                }}
              >
                <Gavel style={{ width: 16, height: 16 }} />
                {t.solo_bid}
              </button>
              <button
                onClick={() => setMode("team")}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl transition-all duration-200"
                style={{
                  height: 48,
                  fontSize: "14px",
                  fontWeight: 600,
                  background: mode === "team" ? "#A78BFA" : "transparent",
                  color: mode === "team" ? "#0C0C0E" : "#5C5C5F",
                }}
              >
                <Users style={{ width: 16, height: 16 }} />
                {t.team_bid}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {/* ─── SOLO BID ─── */}
              {mode === "solo" && (
                <motion.div
                  key="solo"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="card p-5">
                    <label className="label mb-3 block">{t.step1_select}</label>
                    {selectedBidder ? (
                      <motion.div
                        initial={{ scale: 0.97, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-4 p-4 rounded-2xl"
                        style={{
                          background: "rgba(52,211,153,0.05)",
                          border: "1px solid rgba(52,211,153,0.15)",
                        }}
                      >
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                          style={{
                            background: avatarColors[selectedBidder.paddle_number % avatarColors.length].bg,
                            color: avatarColors[selectedBidder.paddle_number % avatarColors.length].color,
                          }}
                        >
                          {getInitials(selectedBidder.name)}
                        </div>
                        <div className="flex-1">
                          <p style={{ fontSize: "16px", fontWeight: 600, color: "#ECECEC" }}>
                            {selectedBidder.name}
                          </p>
                          <p style={{ fontSize: "13px", color: "#34D399", fontWeight: 500 }}>
                            {t.paddle_label} {formatPaddle(selectedBidder.paddle_number)}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedBidder(null);
                            setTimeout(() => paddleRef.current?.focus(), 50);
                          }}
                          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                          style={{ color: "#34D399" }}
                        >
                          <X style={{ width: 16, height: 16 }} />
                        </button>
                      </motion.div>
                    ) : (
                      <div className="relative">
                        <Search
                          style={{
                            position: "absolute",
                            left: 16,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 18,
                            height: 18,
                            color: "#3A3A3D",
                          }}
                        />
                        <input
                          ref={paddleRef}
                          style={{
                            width: "100%",
                            height: 56,
                            paddingLeft: 48,
                            paddingRight: 16,
                            background: "#0C0C0E",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 16,
                            fontSize: "20px",
                            fontWeight: 700,
                            color: "#ECECEC",
                            outline: "none",
                          }}
                          placeholder={t.paddle_search_ph}
                          value={paddleSearch}
                          onChange={(e) => setPaddleSearch(e.target.value)}
                          autoFocus
                          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(52,211,153,0.5)")}
                          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                        />
                        {filteredBidders.length > 0 && (
                          <div
                            className="absolute top-full left-0 right-0 mt-1 max-h-64 overflow-auto z-10 rounded-2xl"
                            style={{
                              background: "#141416",
                              border: "1px solid rgba(255,255,255,0.06)",
                              boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
                            }}
                          >
                            {filteredBidders.map((b) => (
                              <button
                                key={b.id}
                                onClick={() => selectBidder(b)}
                                className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                                  style={{
                                    background: avatarColors[b.paddle_number % avatarColors.length].bg,
                                    color: avatarColors[b.paddle_number % avatarColors.length].color,
                                  }}
                                >
                                  {getInitials(b.name)}
                                </div>
                                <div className="flex-1">
                                  <p style={{ fontSize: "14px", fontWeight: 500, color: "#ECECEC" }}>{b.name}</p>
                                  <p style={{ fontSize: "12px", color: "#5C5C5F" }}>{t.paddle_label} {formatPaddle(b.paddle_number)}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Step 2 — Amount */}
                  <div className="card p-5">
                    <label className="label mb-3 block">{t.step2_amount}</label>
                    <div className="relative mb-4">
                      <span
                        style={{
                          position: "absolute",
                          left: 20,
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "24px",
                          fontWeight: 700,
                          color: "#3A3A3D",
                        }}
                      >
                        $
                      </span>
                      <input
                        ref={amountRef}
                        style={{
                          width: "100%",
                          height: 64,
                          paddingLeft: 44,
                          paddingRight: 16,
                          background: "#0C0C0E",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 16,
                          fontSize: "30px",
                          fontWeight: 700,
                          color: "#ECECEC",
                          outline: "none",
                        }}
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(52,211,153,0.5)")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && selectedBidder && bidAmount && !submitting) {
                            submitSoloBid();
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {quickAmounts.map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setBidAmount(String(amt))}
                          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
                          style={{
                            background: parseFloat(bidAmount) === amt ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.04)",
                            color: parseFloat(bidAmount) === amt ? "#34D399" : "#8A8A8D",
                            border: parseFloat(bidAmount) === amt ? "1px solid rgba(52,211,153,0.3)" : "1px solid transparent",
                          }}
                        >
                          {formatCurrency(amt)}
                        </button>
                      ))}
                    </div>
                    {currentBid > 0 && (
                      <p style={{ fontSize: "12px", color: "#3A3A3D", marginTop: 8 }}>
                        {t.suggested_above}{" "}
                        <span style={{ color: "#8A8A8D", fontWeight: 500 }}>{formatCurrency(currentBid)}</span>
                      </p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    onClick={submitSoloBid}
                    disabled={!selectedBidder || !bidAmount || submitting}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 disabled:opacity-40"
                    style={{ height: 56, fontSize: "16px", background: "#34D399", color: "#0C0C0E" }}
                  >
                    {submitting ? (
                      <Loader2 style={{ width: 22, height: 22 }} className="animate-spin" />
                    ) : (
                      <>
                        <Send style={{ width: 18, height: 18 }} />
                        {t.submit_bid} — {bidAmount ? formatCurrency(parseFloat(bidAmount) || 0) : "$0"}
                      </>
                    )}
                  </button>
                  <p style={{ fontSize: "12px", color: "#3A3A3D", textAlign: "center" }}>
                    <kbd style={{ padding: "2px 6px", borderRadius: 6, background: "#1C1C1F", fontFamily: "monospace", fontSize: "11px", color: "#8A8A8D" }}>Enter</kbd>
                    {" "}{t.enter_hint}{" "}
                    <kbd style={{ padding: "2px 6px", borderRadius: 6, background: "#1C1C1F", fontFamily: "monospace", fontSize: "11px", color: "#8A8A8D" }}>Esc</kbd>
                    {" "}{t.esc_hint}
                  </p>
                </motion.div>
              )}

              {/* ─── TEAM BID ─── */}
              {mode === "team" && (
                <motion.div
                  key="team"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="card p-5">
                    <label className="label mb-3 block">{t.step1_members}</label>
                    <div className="relative mb-3">
                      <UserPlus
                        style={{
                          position: "absolute",
                          left: 16,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 18,
                          height: 18,
                          color: "#3A3A3D",
                        }}
                      />
                      <input
                        style={{
                          width: "100%",
                          height: 48,
                          paddingLeft: 48,
                          paddingRight: 16,
                          background: "#0C0C0E",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 14,
                          fontSize: "14px",
                          color: "#ECECEC",
                          outline: "none",
                        }}
                        placeholder={t.team_search_ph}
                        value={teamSearch}
                        onChange={(e) => setTeamSearch(e.target.value)}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(167,139,250,0.5)")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                      />
                      {teamFilteredBidders.length > 0 && (
                        <div
                          className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-auto z-10 rounded-2xl"
                          style={{
                            background: "#141416",
                            border: "1px solid rgba(255,255,255,0.06)",
                            boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
                          }}
                        >
                          {teamFilteredBidders.map((b) => (
                            <button
                              key={b.id}
                              onClick={() => addTeamMember(b)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(167,139,250,0.05)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <Plus style={{ width: 14, height: 14, color: "#A78BFA", flexShrink: 0 }} />
                              <span style={{ padding: "2px 8px", borderRadius: 8, background: "rgba(255,255,255,0.04)", fontSize: "12px", color: "#8A8A8D", fontWeight: 600, flexShrink: 0 }}>
                                {formatPaddle(b.paddle_number)}
                              </span>
                              <span style={{ fontSize: "14px", fontWeight: 500, color: "#ECECEC" }}>{b.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <AnimatePresence>
                      {teamMembers.map((member) => (
                        <motion.div
                          key={member.bidder.id}
                          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                          animate={{ opacity: 1, height: "auto", marginBottom: 8 }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                          className="flex items-center gap-3 p-3 rounded-xl overflow-hidden"
                          style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.15)" }}
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{
                              background: avatarColors[member.bidder.paddle_number % avatarColors.length].bg,
                              color: avatarColors[member.bidder.paddle_number % avatarColors.length].color,
                            }}
                          >
                            {getInitials(member.bidder.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate" style={{ fontSize: "13px", fontWeight: 600, color: "#ECECEC" }}>
                              {member.bidder.name}
                            </p>
                            <p style={{ fontSize: "12px", color: "#5C5C5F" }}>
                              {formatPaddle(member.bidder.paddle_number)}
                            </p>
                          </div>
                          <div className="relative w-32">
                            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: "12px", color: "#5C5C5F", fontWeight: 600 }}>
                              $
                            </span>
                            <input
                              style={{ width: "100%", height: 36, paddingLeft: 24, paddingRight: 8, textAlign: "right", background: "#0C0C0E", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: "13px", fontWeight: 600, color: "#ECECEC", outline: "none" }}
                              type="number"
                              min="0"
                              step="1"
                              placeholder="0"
                              value={member.contribution}
                              onChange={(e) => updateContribution(member.bidder.id, e.target.value)}
                            />
                          </div>
                          <button
                            onClick={() => removeTeamMember(member.bidder.id)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                            style={{ color: "#FB7185" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(251,113,133,0.1)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <X style={{ width: 14, height: 14 }} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {teamMembers.length === 0 && (
                      <p style={{ fontSize: "13px", color: "#3A3A3D", textAlign: "center", padding: "20px 0" }}>
                        {t.search_add_members}
                      </p>
                    )}
                    {teamMembers.length === 1 && (
                      <p style={{ fontSize: "12px", color: "#E2B340", textAlign: "center", marginTop: 8, fontWeight: 500 }}>
                        {t.add_one_more}
                      </p>
                    )}
                  </div>

                  {/* Total + split */}
                  <div className="card p-5">
                    <label className="label mb-3 block">{t.step2_total}</label>
                    <div className="relative mb-4">
                      <span style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", fontSize: "24px", fontWeight: 700, color: "#3A3A3D" }}>
                        $
                      </span>
                      <input
                        style={{ width: "100%", height: 64, paddingLeft: 44, paddingRight: 16, background: "#0C0C0E", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, fontSize: "30px", fontWeight: 700, color: "#ECECEC", outline: "none" }}
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={teamTotal}
                        onChange={(e) => setTeamTotal(e.target.value)}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(167,139,250,0.5)")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                      />
                    </div>

                    {teamMembers.length >= 2 && (
                      <button
                        onClick={splitEvenly}
                        className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-sm transition-colors duration-150 mb-3"
                        style={{ height: 44, background: "rgba(167,139,250,0.1)", color: "#A78BFA", border: "none" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(167,139,250,0.18)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(167,139,250,0.1)")}
                      >
                        <SplitSquareVertical style={{ width: 16, height: 16 }} />
                        {t.split_evenly_label(teamTotal ? formatCurrency(parseFloat(teamTotal) || 0) : "total", teamMembers.length)}
                      </button>
                    )}

                    {teamMembers.length > 0 && (
                      <div
                        className="flex items-center justify-between text-sm p-3 rounded-xl"
                        style={{
                          background: sumsMatch ? "rgba(52,211,153,0.05)" : totalFloat > 0 ? "rgba(226,179,64,0.05)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${sumsMatch ? "rgba(52,211,153,0.2)" : totalFloat > 0 ? "rgba(226,179,64,0.2)" : "transparent"}`,
                        }}
                      >
                        <span style={{ color: sumsMatch ? "#34D399" : "#5C5C5F", fontWeight: 500 }}>
                          {sumsMatch ? t.contributions_match : t.contributions_sum}
                        </span>
                        <span style={{ fontWeight: 700, color: sumsMatch ? "#34D399" : totalFloat > 0 ? "#E2B340" : "#8A8A8D" }}>
                          {formatCurrency(contributionSum)}
                          {totalFloat > 0 && !sumsMatch && (
                            <span style={{ fontWeight: 400, color: "#5C5C5F" }}> / {formatCurrency(totalFloat)}</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Submit team */}
                  <button
                    onClick={submitTeamBid}
                    disabled={teamMembers.length < 2 || !teamTotal || submitting}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 disabled:opacity-40"
                    style={{ height: 56, fontSize: "16px", background: "#A78BFA", color: "#0C0C0E" }}
                  >
                    {submitting ? (
                      <Loader2 style={{ width: 22, height: 22 }} className="animate-spin" />
                    ) : (
                      <>
                        <Users style={{ width: 18, height: 18 }} />
                        {t.submit_team_bid} — {teamTotal ? formatCurrency(parseFloat(teamTotal) || 0) : "$0"}
                        {teamMembers.length > 0 && ` (${teamMembers.length})`}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => { setTeamMembers([]); setTeamTotal(""); setTeamSearch(""); }}
                    className="w-full flex items-center justify-center gap-2 transition-colors duration-150"
                    style={{ padding: "8px 0", fontSize: "13px", color: "#3A3A3D" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#8A8A8D")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#3A3A3D")}
                  >
                    <RotateCcw style={{ width: 12, height: 12 }} />
                    {t.clear_all}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recent bids */}
            {bids.length > 0 && (
              <div className="pt-2">
                <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#5C5C5F", marginBottom: 10 }}>
                  {t.recent_bids_item}
                </p>
                <div className="space-y-2">
                  {bids.slice(0, 5).map((bid: Bid, i: number) => (
                    <motion.div
                      key={bid.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{
                        background: i === 0 ? "rgba(52,211,153,0.03)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${i === 0 ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.04)"}`,
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          background: bid.is_team_bid ? "rgba(167,139,250,0.1)" : "rgba(52,211,153,0.1)",
                          color: bid.is_team_bid ? "#A78BFA" : "#34D399",
                        }}
                      >
                        {bid.is_team_bid ? "T" : bid.bidder ? formatPaddle(bid.bidder.paddle_number) : "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate" style={{ fontSize: "13px", fontWeight: 500, color: "#ECECEC" }}>
                          {bid.is_team_bid ? t.team_display(bid.team_members?.length || 0) : bid.bidder?.name || t.unknown_label}
                        </p>
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#ECECEC", flexShrink: 0, fontFamily: '"DM Serif Display", Georgia, serif' }}>
                        {formatCurrency(bid.amount)}
                      </span>
                      <span style={{ fontSize: "11px", color: "#3A3A3D", flexShrink: 0 }}>
                        {formatTime(bid.created_at)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
