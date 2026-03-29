"use client";

import { useState } from "react";
import { useBidders } from "@/lib/hooks";
import { supabase } from "@/lib/supabase";
import { formatPaddle, getInitials } from "@/lib/utils";
import { Plus, Users, Search, X, Trash2, Phone, Mail, Hash, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { Bidder } from "@/lib/types";
import { useLanguage } from "@/lib/language-context";

function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel, cancelLabel }: {
  open: boolean; title: string; message: string; confirmLabel: string; cancelLabel: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl shadow-2xl max-w-sm w-full p-8"
            style={{ background: "#141416", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{ background: "rgba(251,113,133,0.1)" }}>
              <AlertTriangle style={{ width: 18, height: 18, color: "#FB7185" }} />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#ECECEC", marginBottom: 6 }}>{title}</h3>
            <p style={{ fontSize: "14px", color: "#5C5C5F", marginBottom: 24, lineHeight: 1.5 }}>{message}</p>
            <div className="flex gap-3">
              <button onClick={onCancel} className="btn-secondary flex-1">{cancelLabel}</button>
              <button
                onClick={onConfirm}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
                style={{ background: "#FB7185", color: "#0C0C0E" }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PaddleSuccessModal({ open, paddleNumber, name, onClose, paddleAssignedLabel, paddleNumberLabel, doneLabel }: {
  open: boolean; paddleNumber: number; name: string; onClose: () => void;
  paddleAssignedLabel: string; paddleNumberLabel: string; doneLabel: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl shadow-2xl max-w-sm w-full p-10 text-center"
            style={{ background: "#141416", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(52,211,153,0.1)" }}
            >
              <CheckCircle2 style={{ width: 28, height: 28, color: "#34D399" }} />
            </motion.div>

            <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#5C5C5F", marginBottom: 4 }}>
              {paddleAssignedLabel}
            </p>
            <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#ECECEC", marginBottom: 24 }}>{name}</h3>

            <div
              className="rounded-2xl py-7 px-8 mb-6"
              style={{ background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)" }}
            >
              <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#34D399", marginBottom: 8 }}>
                {paddleNumberLabel}
              </p>
              <p
                style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: "64px",
                  color: "#34D399",
                  lineHeight: 1,
                }}
              >
                {formatPaddle(paddleNumber)}
              </p>
            </div>

            <p style={{ fontSize: "13px", color: "#5C5C5F", marginBottom: 24 }}>
              Hand paddle <strong style={{ color: "#ECECEC" }}>{formatPaddle(paddleNumber)}</strong> to the guest
            </p>

            <button onClick={onClose} className="btn-primary w-full">{doneLabel}</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const avatarColors = [
  "bg-emerald-900/40 text-emerald-300",
  "bg-violet-900/40 text-violet-300",
  "bg-amber-900/40 text-amber-300",
  "bg-sky-900/40 text-sky-300",
  "bg-rose-900/40 text-rose-300",
  "bg-teal-900/40 text-teal-300",
  "bg-indigo-900/40 text-indigo-300",
  "bg-orange-900/40 text-orange-300",
];

export default function BiddersPage() {
  const { bidders, refetch } = useBidders();
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", table_number: "" });
  const [nameError, setNameError] = useState("");
  const [successPaddle, setSuccessPaddle] = useState<number | null>(null);
  const [successName, setSuccessName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Bidder | null>(null);

  const filtered = bidders.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      String(b.paddle_number).includes(search) ||
      b.email?.toLowerCase().includes(search.toLowerCase()) ||
      b.phone?.includes(search)
  );

  async function handleRegister() {
    if (!form.name.trim()) { setNameError("Name is required"); return; }
    setNameError("");
    const { data, error } = await supabase
      .from("bidders")
      .insert({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        table_number: form.table_number ? parseInt(form.table_number) : null,
      })
      .select()
      .single();
    if (error || !data) { toast.error("Failed to register bidder"); return; }
    setShowModal(false);
    setForm({ name: "", phone: "", email: "", table_number: "" });
    setSuccessName(data.name);
    setSuccessPaddle(data.paddle_number);
    refetch();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await supabase.from("bidders").delete().eq("id", deleteTarget.id);
    toast.success("Bidder removed");
    setDeleteTarget(null);
    refetch();
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="page-header">{t.bidders_title}</h1>
          <p className="mt-1" style={{ fontSize: "13px", color: "#5C5C5F" }}>
            {bidders.length} {t.bidders_subtitle}
          </p>
        </div>
        <button onClick={() => { setForm({ name: "", phone: "", email: "", table_number: "" }); setNameError(""); setShowModal(true); }} className="btn-primary">
          <Plus style={{ width: 14, height: 14 }} /> {t.register_bidder}
        </button>
      </motion.div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2"
          style={{ width: 15, height: 15, color: "#3A3A3D" }}
        />
        <input
          className="input !pl-11"
          placeholder={t.search_bidders}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((bidder, i) => (
          <motion.div
            key={bidder.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02, duration: 0.4 }}
            className="card p-5 group"
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0 ${avatarColors[bidder.paddle_number % avatarColors.length]}`}>
                {getInitials(bidder.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="truncate" style={{ fontSize: "14px", fontWeight: 500, color: "#ECECEC" }}>
                    {bidder.name}
                  </h3>
                  <span
                    className="flex-shrink-0 rounded-full px-2 py-0.5"
                    style={{ fontSize: "11px", fontWeight: 600, background: "rgba(255,255,255,0.04)", color: "#5C5C5F" }}
                  >
                    {formatPaddle(bidder.paddle_number)}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {bidder.phone && (
                    <p className="flex items-center gap-1.5" style={{ fontSize: "12px", color: "#5C5C5F" }}>
                      <Phone style={{ width: 11, height: 11 }} />{bidder.phone}
                    </p>
                  )}
                  {bidder.email && (
                    <p className="flex items-center gap-1.5 truncate" style={{ fontSize: "12px", color: "#5C5C5F" }}>
                      <Mail style={{ width: 11, height: 11, flexShrink: 0 }} />{bidder.email}
                    </p>
                  )}
                  {bidder.table_number && (
                    <p className="flex items-center gap-1.5" style={{ fontSize: "12px", color: "#5C5C5F" }}>
                      <Hash style={{ width: 11, height: 11 }} />Table {bidder.table_number}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setDeleteTarget(bidder)}
                className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{ color: "#3A3A3D" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#FB7185"; (e.currentTarget as HTMLElement).style.background = "rgba(251,113,133,0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#3A3A3D"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <Trash2 style={{ width: 13, height: 13 }} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && bidders.length > 0 && (
        <div className="text-center py-16">
          <p style={{ fontSize: "13px", color: "#3A3A3D" }}>No bidders match &ldquo;{search}&rdquo;</p>
        </div>
      )}

      {bidders.length === 0 && (
        <div className="card p-16 text-center">
          <Users style={{ width: 28, height: 28, color: "#2A2A2E", margin: "0 auto 12px" }} />
          <p style={{ fontWeight: 500, color: "#5C5C5F", marginBottom: 4 }}>{t.no_bidders_msg}</p>
          <p style={{ fontSize: "13px", color: "#3A3A3D", marginBottom: 16 }}>{t.bidders_subtitle}</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus style={{ width: 14, height: 14 }} /> {t.register_bidder}
          </button>
        </div>
      )}

      {/* Register Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl shadow-2xl max-w-md w-full"
              style={{ background: "#141416", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center justify-between px-8 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#ECECEC" }}>{t.register_bidder}</h2>
                <button onClick={() => setShowModal(false)} style={{ color: "#5C5C5F" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#ECECEC")} onMouseLeave={(e) => (e.currentTarget.style.color = "#5C5C5F")}>
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>

              <div className="px-8 py-6 space-y-4">
                <div
                  className="flex items-center gap-2 rounded-xl px-4 py-3"
                  style={{ background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.1)" }}
                >
                  <Hash style={{ width: 14, height: 14, color: "#34D399", flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", color: "#34D399" }}>{t.paddle_assigned}</span>
                </div>
                <div>
                  <label className="label">{t.bidder_name_label} *</label>
                  <input
                    className="input"
                    style={nameError ? { borderColor: "rgba(251,113,133,0.5)" } : {}}
                    placeholder={t.name_placeholder}
                    value={form.name}
                    onChange={(e) => { setForm({ ...form, name: e.target.value }); if (e.target.value.trim()) setNameError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleRegister(); }}
                    autoFocus
                  />
                  {nameError && <p style={{ fontSize: "12px", color: "#FB7185", marginTop: 4 }}>{nameError}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Phone</label>
                    <input className="input" placeholder="519-555-0100" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Table #</label>
                    <input className="input" type="number" min="1" placeholder="e.g., 5" value={form.table_number} onChange={(e) => setForm({ ...form, table_number: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" placeholder="sarah@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-8 py-5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <button onClick={() => setShowModal(false)} className="btn-secondary">{t.cancel}</button>
                <button onClick={handleRegister} className="btn-primary">{t.register}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {successPaddle !== null && (
        <PaddleSuccessModal
          open
          paddleNumber={successPaddle}
          name={successName}
          onClose={() => setSuccessPaddle(null)}
          paddleAssignedLabel={t.paddle_assigned}
          paddleNumberLabel={t.paddle_number_label}
          doneLabel={t.save}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title={`Remove ${deleteTarget?.name}?`}
        message="Their bids will be preserved, but they will no longer appear in the bidder list."
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
