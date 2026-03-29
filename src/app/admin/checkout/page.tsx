"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatPaddle, getInitials } from "@/lib/utils";
import { CreditCard, Search, Check, Clock, Download, Users, DollarSign, ArrowUpDown, ChevronDown, ChevronUp, Printer } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/language-context";

interface CheckoutBidder {
  bidder_id: string; name: string; paddle_number: number; phone: string | null; email: string | null;
  solo_total: number; team_total: number; grand_total: number; pending_amount: number; overall_status: string;
}
type SortKey = "amount" | "paddle" | "name" | "status";
type SortDir = "asc" | "desc";

const avatarColors = [
  "bg-emerald-900/40 text-emerald-300",
  "bg-violet-900/40 text-violet-300",
  "bg-amber-900/40 text-amber-300",
  "bg-sky-900/40 text-sky-300",
  "bg-rose-900/40 text-rose-300",
  "bg-teal-900/40 text-teal-300",
];

export default function CheckoutPage() {
  const { t } = useLanguage();
  const [bidders, setBidders] = useState<CheckoutBidder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("all");
  const [paidMap, setPaidMap] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState<SortKey>("amount");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    const { data } = await supabase.from("bidder_totals").select("*");
    if (data) setBidders(data.filter((b: CheckoutBidder) => b.grand_total > 0));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel("checkout-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bids" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "team_members" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const totalOwed = bidders.reduce((s, b) => s + Number(b.grand_total), 0);
  const totalPaid = bidders.filter((b) => paidMap[b.bidder_id]).reduce((s, b) => s + Number(b.grand_total), 0);
  const totalPending = totalOwed - totalPaid;
  const paidCount = bidders.filter((b) => paidMap[b.bidder_id]).length;
  const checkoutProgress = bidders.length > 0 ? Math.round((paidCount / bidders.length) * 100) : 0;

  const sorted = [...bidders].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "amount") cmp = Number(a.grand_total) - Number(b.grand_total);
    else if (sortKey === "paddle") cmp = a.paddle_number - b.paddle_number;
    else if (sortKey === "name") cmp = a.name.localeCompare(b.name);
    else if (sortKey === "status") cmp = (paidMap[a.bidder_id] ? 1 : 0) - (paidMap[b.bidder_id] ? 1 : 0);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const filtered = sorted.filter((b) => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase()) || String(b.paddle_number).includes(search);
    const isPaid = paidMap[b.bidder_id] === true;
    if (filter === "paid") return matchSearch && isPaid;
    if (filter === "pending") return matchSearch && !isPaid;
    return matchSearch;
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  function togglePaid(bidderId: string) {
    setPaidMap((prev) => {
      const next = { ...prev, [bidderId]: !prev[bidderId] };
      toast.success(next[bidderId] ? t.mark_paid : t.mark_unpaid);
      return next;
    });
  }

  async function markTeamMembersPaid(bidderId: string) {
    await supabase.from("team_members").update({ payment_status: "paid" }).eq("bidder_id", bidderId);
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function printReceipt(bidder: CheckoutBidder) {
    const isPaid = paidMap[bidder.bidder_id];
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;
    win.document.write(`<html><head><title>Receipt — ${bidder.name}</title>
    <style>body{font-family:system-ui,sans-serif;padding:32px;max-width:360px;}h1{font-size:20px;margin:0 0 4px;}.paddle{font-size:14px;color:#5C5A56;margin-bottom:24px;}.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #E8E7E5;font-size:14px;}.total{font-weight:bold;font-size:18px;padding-top:12px;}.status{margin-top:16px;padding:10px;border-radius:8px;font-size:14px;font-weight:600;text-align:center;background:${isPaid?"#D1FAE5":"#FEF3C7"};color:${isPaid?"#065F46":"#92400E"};}.footer{margin-top:32px;font-size:11px;color:#A9A7A2;text-align:center;}</style></head><body>
    <h1>${bidder.name}</h1><div class="paddle">Paddle ${formatPaddle(bidder.paddle_number)}</div>
    ${Number(bidder.solo_total)>0?`<div class="row"><span>Solo Bids</span><span>${formatCurrency(bidder.solo_total)}</span></div>`:""}
    ${Number(bidder.team_total)>0?`<div class="row"><span>Team Contributions</span><span>${formatCurrency(bidder.team_total)}</span></div>`:""}
    <div class="row total"><span>Total Owed</span><span>${formatCurrency(bidder.grand_total)}</span></div>
    <div class="status">${isPaid?"✓ Paid":"⏳ Payment Pending"}</div>
    <div class="footer">BidFlow · Islamic Relief Canada<br/>Thank you for your generosity</div></body></html>`);
    win.document.close(); win.print();
  }

  function exportCSV() {
    const rows = [
      ["Paddle #","Name","Phone","Email","Solo Bids","Team Contributions","Total Owed","Status"],
      ...bidders.map((b) => [formatPaddle(b.paddle_number),b.name,b.phone||"",b.email||"",b.solo_total.toFixed(2),b.team_total.toFixed(2),b.grand_total.toFixed(2),paidMap[b.bidder_id]?"Paid":"Pending"]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `bidflow-checkout-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url); toast.success("CSV exported!");
  }

  if (loading) {
    return (
      <div className="max-w-4xl">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="stat-card mb-3 animate-pulse" style={{ height: 80 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-10"
      >
        <div>
          <h1 className="page-header">{t.checkout_title}</h1>
          <p className="mt-1" style={{ fontSize: "13px", color: "#5C5C5F" }}>{t.checkout_subtitle}</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary">
          <Download style={{ width: 14, height: 14 }} /> Export CSV
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: t.stat_total_raised, value: formatCurrency(totalOwed), icon: DollarSign, color: "#ECECEC" },
          { label: t.paid_label, value: formatCurrency(totalPaid), icon: Check, color: "#34D399" },
          { label: t.filter_pending, value: formatCurrency(totalPending), icon: Clock, color: "#E2B340" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#5C5C5F" }}>{s.label}</span>
              <s.icon style={{ width: 14, height: 14, color: "#3A3A3D" }} />
            </div>
            <p style={{ fontSize: "24px", fontWeight: 600, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Progress */}
      {bidders.length > 0 && (
        <div className="card px-6 py-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#5C5C5F" }}>
              {t.checkout_title}
            </span>
            <span style={{ fontSize: "12px", color: "#5C5C5F" }}>
              {t.progress_paid(paidCount, bidders.length)}
            </span>
          </div>
          <div className="w-full rounded-full overflow-hidden" style={{ height: "3px", background: "#1C1C1F" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${checkoutProgress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "#34D399" }}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2" style={{ width: 15, height: 15, color: "#3A3A3D" }} />
          <input className="input !pl-11" placeholder="Search by name or paddle..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Filter text buttons */}
        <div className="flex items-center gap-4">
          {(["all", "pending", "paid"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="capitalize transition-all duration-200 pb-0.5"
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: filter === f ? "#ECECEC" : "#5C5C5F",
                borderBottom: filter === f ? "1px solid #ECECEC" : "1px solid transparent",
              }}
            >
              {f === "all" ? t.filter_all : f === "pending" ? t.filter_pending : t.filter_paid}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1">
          {([{ key: "amount", label: t.sort_amount_label }, { key: "paddle", label: t.paddle_label }, { key: "name", label: t.sort_name_label }] as { key: SortKey; label: string }[]).map((s) => (
            <button
              key={s.key}
              onClick={() => toggleSort(s.key)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors duration-200"
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: sortKey === s.key ? "#ECECEC" : "#5C5C5F",
                background: sortKey === s.key ? "rgba(255,255,255,0.05)" : "transparent",
              }}
            >
              {s.label}
              {sortKey === s.key ? (
                sortDir === "asc" ? <ChevronUp style={{ width: 11, height: 11 }} /> : <ChevronDown style={{ width: 11, height: 11 }} />
              ) : (
                <ArrowUpDown style={{ width: 11, height: 11, opacity: 0.3 }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bidder list */}
      <div className="space-y-2">
        {filtered.map((bidder, i) => {
          const isPaid = paidMap[bidder.bidder_id] === true;
          const isExpanded = expandedIds.has(bidder.bidder_id);

          return (
            <motion.div
              key={bidder.bidder_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="card overflow-hidden"
              style={{ opacity: isPaid ? 0.55 : 1 }}
            >
              <div className="px-5 py-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0 ${avatarColors[bidder.paddle_number % avatarColors.length]}`}>
                  {getInitials(bidder.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#ECECEC" }}>{bidder.name}</h3>
                    <span className="rounded-full px-2 py-0.5" style={{ fontSize: "11px", fontWeight: 600, background: "rgba(255,255,255,0.04)", color: "#5C5C5F" }}>
                      {formatPaddle(bidder.paddle_number)}
                    </span>
                    {isPaid && <span className="badge-paid">{t.paid_label}</span>}
                  </div>
                  <div className="flex items-center gap-4 flex-wrap" style={{ fontSize: "12px", color: "#5C5C5F" }}>
                    {Number(bidder.solo_total) > 0 && <span>{t.solo_label}: {formatCurrency(bidder.solo_total)}</span>}
                    {Number(bidder.team_total) > 0 && (
                      <span className="flex items-center gap-1">
                        <Users style={{ width: 11, height: 11 }} />{t.team_label}: {formatCurrency(bidder.team_total)}
                      </span>
                    )}
                    {bidder.phone && <span>{bidder.phone}</span>}
                  </div>
                </div>

                <div className="text-right mr-2 flex-shrink-0">
                  <p style={{ fontSize: "11px", color: "#5C5C5F", marginBottom: 2 }}>{t.total_col}</p>
                  <p style={{
                    fontFamily: '"DM Serif Display", Georgia, serif',
                    fontSize: "20px",
                    color: isPaid ? "#34D399" : Number(bidder.grand_total) > 500 ? "#FB7185" : "#ECECEC",
                  }}>
                    {formatCurrency(bidder.grand_total)}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => printReceipt(bidder)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200"
                    style={{ background: "rgba(255,255,255,0.04)", color: "#5C5C5F" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "#ECECEC"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.color = "#5C5C5F"; }}
                  >
                    <Printer style={{ width: 15, height: 15 }} />
                  </button>
                  <button
                    onClick={() => { togglePaid(bidder.bidder_id); if (!isPaid && Number(bidder.team_total) > 0) markTeamMembersPaid(bidder.bidder_id); }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                    style={isPaid
                      ? { background: "rgba(52,211,153,0.1)", color: "#34D399" }
                      : { background: "rgba(255,255,255,0.04)", color: "#5C5C5F" }
                    }
                    onMouseEnter={(e) => { if (!isPaid) { (e.currentTarget as HTMLElement).style.background = "rgba(52,211,153,0.08)"; (e.currentTarget as HTMLElement).style.color = "#34D399"; }}}
                    onMouseLeave={(e) => { if (!isPaid) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.color = "#5C5C5F"; }}}
                  >
                    {isPaid ? <><Check style={{ width: 13, height: 13 }} /> {t.paid_label}</> : <><CreditCard style={{ width: 13, height: 13 }} /> {t.mark_paid}</>}
                  </button>
                  {(Number(bidder.solo_total) > 0 || Number(bidder.team_total) > 0) && (
                    <button
                      onClick={() => toggleExpanded(bidder.bidder_id)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200"
                      style={{ background: "rgba(255,255,255,0.04)", color: "#5C5C5F" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "#ECECEC"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.color = "#5C5C5F"; }}
                    >
                      {isExpanded ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
                    </button>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 grid grid-cols-2 gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 12 }}>
                      {Number(bidder.solo_total) > 0 && (
                        <div className="rounded-xl p-3" style={{ background: "rgba(52,211,153,0.05)" }}>
                          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#34D399", marginBottom: 4 }}>{t.solo_label}</p>
                          <p style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "18px", color: "#34D399" }}>{formatCurrency(bidder.solo_total)}</p>
                        </div>
                      )}
                      {Number(bidder.team_total) > 0 && (
                        <div className="rounded-xl p-3" style={{ background: "rgba(167,139,250,0.05)" }}>
                          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#A78BFA", marginBottom: 4 }}>{t.team_label}</p>
                          <p style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "18px", color: "#A78BFA" }}>{formatCurrency(bidder.team_total)}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="card p-16 text-center">
            <CreditCard style={{ width: 28, height: 28, color: "#2A2A2E", margin: "0 auto 12px" }} />
            <p style={{ fontSize: "13px", color: "#3A3A3D" }}>
              {bidders.length === 0 ? t.no_checkouts : t.no_checkouts}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
