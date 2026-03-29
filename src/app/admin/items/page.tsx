"use client";

import { useState } from "react";
import { useItems, useBids } from "@/lib/hooks";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import {
  Plus, Package, Play, Square, Trash2, X, ImageIcon, AlertTriangle, Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { Item } from "@/lib/types";
import { useLanguage } from "@/lib/language-context";

function ConfirmModal({
  open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel,
}: {
  open: boolean; title: string; message: string; confirmLabel: string; cancelLabel: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-[60] p-4"
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
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
              style={{ background: "rgba(251,113,133,0.1)" }}
            >
              <AlertTriangle style={{ width: 18, height: 18, color: "#FB7185" }} />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#ECECEC", marginBottom: 6 }}>{title}</h3>
            <p style={{ fontSize: "14px", color: "#5C5C5F", marginBottom: 24, lineHeight: 1.5 }}>{message}</p>
            <div className="flex gap-3">
              <button onClick={onCancel} className="btn-secondary flex-1">{cancelLabel}</button>
              <button
                onClick={onConfirm}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
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

function ItemBids({ itemId, noBidsLabel }: { itemId: string; noBidsLabel: string }) {
  const { bids, highestBid } = useBids(itemId);
  if (!highestBid) return <span style={{ fontSize: "12px", color: "#3A3A3D" }}>{noBidsLabel}</span>;
  return (
    <span style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "15px", color: "#E2B340" }}>
      {formatCurrency(highestBid.amount)}
      <span style={{ fontSize: "11px", color: "#5C5C5F", marginLeft: 4 }}>
        ({bids.length})
      </span>
    </span>
  );
}

export default function ItemsPage() {
  const { t } = useLanguage();
  const { items, refetch } = useItems();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState({ name: "", description: "", image_url: "", starting_bid: "" });
  const [nameError, setNameError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);

  const activeItem = items.find((i) => i.status === "active");

  async function handleSave() {
    if (!form.name.trim()) { setNameError(t.item_name_label); return; }
    setNameError("");
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      starting_bid: parseFloat(form.starting_bid) || 0,
      sort_order: editing ? editing.sort_order : items.length + 1,
    };
    if (editing) {
      await supabase.from("items").update(payload).eq("id", editing.id);
      toast.success("Item updated");
    } else {
      await supabase.from("items").insert(payload);
      toast.success("Item added to queue");
    }
    setSaving(false);
    setShowModal(false);
    setEditing(null);
    setForm({ name: "", description: "", image_url: "", starting_bid: "" });
    refetch();
  }

  async function setItemStatus(item: Item, status: "active" | "sold" | "upcoming") {
    if (status === "active" && activeItem && activeItem.id !== item.id) {
      await supabase.from("items").update({ status: "upcoming" }).eq("id", activeItem.id);
    }
    await supabase.from("items").update({ status }).eq("id", item.id);
    toast.success(
      status === "active" ? `"${item.name}" is now live!`
        : status === "sold" ? `"${item.name}" marked as sold`
        : `"${item.name}" moved back to queue`
    );
    refetch();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await supabase.from("items").delete().eq("id", deleteTarget.id);
    toast.success("Item deleted");
    setDeleteTarget(null);
    refetch();
  }

  function openEdit(item: Item) {
    setEditing(item);
    setNameError("");
    setForm({ name: item.name, description: item.description || "", image_url: item.image_url || "", starting_bid: String(item.starting_bid) });
    setShowModal(true);
  }

  function openNew() {
    setEditing(null);
    setNameError("");
    setForm({ name: "", description: "", image_url: "", starting_bid: "" });
    setShowModal(true);
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-10"
      >
        <div>
          <h1 className="page-header">{t.items_title}</h1>
          <p className="mt-1" style={{ fontSize: "13px", color: "#5C5C5F" }}>
            {items.length} {t.items_subtitle} · {items.filter(i => i.status === "sold").length} {t.status_sold}
          </p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus style={{ width: 14, height: 14 }} /> {t.add_item}
        </button>
      </motion.div>

      {/* Items list */}
      <div className="card overflow-hidden">
        {items.length === 0 ? (
          <div className="p-16 text-center">
            <Package style={{ width: 32, height: 32, color: "#2A2A2E", margin: "0 auto 12px" }} />
            <p style={{ fontWeight: 500, color: "#5C5C5F", marginBottom: 4 }}>{t.no_items_msg}</p>
            <button onClick={openNew} className="btn-primary" style={{ marginTop: 16 }}>
              <Plus style={{ width: 14, height: 14 }} /> {t.add_item}
            </button>
          </div>
        ) : (
          <div>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 px-6 py-4 group transition-colors duration-200"
                style={{
                  borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  background: item.status === "active" ? "rgba(52,211,153,0.02)" : "transparent",
                  borderLeft: item.status === "active" ? "2px solid rgba(52,211,153,0.4)" : "2px solid transparent",
                }}
                onMouseEnter={(e) => { if (item.status !== "active") e.currentTarget.style.background = "rgba(255,255,255,0.015)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = item.status === "active" ? "rgba(52,211,153,0.02)" : "transparent"; }}
              >
                {/* Image */}
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#1C1C1F" }}>
                    <ImageIcon style={{ width: 16, height: 16, color: "#3A3A3D" }} />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {item.status === "active" && (
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: "#34D399" }} />
                    )}
                    <p className="truncate" style={{ fontSize: "14px", fontWeight: 500, color: "#ECECEC" }}>{item.name}</p>
                    <span className={item.status === "active" ? "badge-active" : item.status === "sold" ? "badge-sold" : "badge-upcoming"}>
                      {item.status === "active" ? t.status_active : item.status === "sold" ? t.status_sold : t.status_upcoming}
                    </span>
                  </div>
                  <p className="truncate" style={{ fontSize: "12px", color: "#3A3A3D" }}>
                    {item.description || t.description_placeholder}
                  </p>
                </div>

                {/* Bid info */}
                <div className="text-right flex-shrink-0 mr-2">
                  <p style={{ fontSize: "11px", color: "#3A3A3D", marginBottom: 2 }}>
                    {t.starting_bid}: {formatCurrency(item.starting_bid)}
                  </p>
                  <ItemBids itemId={item.id} noBidsLabel={t.no_bids} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {item.status === "upcoming" && (
                    <button
                      onClick={() => setItemStatus(item, "active")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                      style={{ color: "#34D399" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(52,211,153,0.1)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <Play style={{ width: 12, height: 12 }} /> {t.set_live}
                    </button>
                  )}
                  {item.status === "active" && (
                    <button
                      onClick={() => setItemStatus(item, "sold")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                      style={{ color: "#E2B340" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(226,179,64,0.1)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <Square style={{ width: 12, height: 12 }} /> {t.mark_sold}
                    </button>
                  )}
                  {item.status === "sold" && (
                    <button
                      onClick={() => setItemStatus(item, "upcoming")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                      style={{ color: "#5C5C5F" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {t.reset}
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(item)}
                    className="p-1.5 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                    style={{ color: "#5C5C5F" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ECECEC"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#5C5C5F"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <Pencil style={{ width: 13, height: 13 }} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="p-1.5 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
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
        )}
      </div>

      {/* Add / Edit Modal */}
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
              className="rounded-2xl shadow-2xl max-w-lg w-full"
              style={{ background: "#141416", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="flex items-center justify-between px-8 py-6"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#ECECEC" }}>
                  {editing ? t.edit_item : t.new_item}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="transition-colors duration-200"
                  style={{ color: "#5C5C5F" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ECECEC")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#5C5C5F")}
                >
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>

              <div className="px-8 py-6 space-y-5">
                <div>
                  <label className="label">{t.item_name_label} *</label>
                  <input
                    className="input"
                    style={nameError ? { borderColor: "rgba(251,113,133,0.5)" } : {}}
                    placeholder={t.item_name_placeholder}
                    value={form.name}
                    onChange={(e) => { setForm({ ...form, name: e.target.value }); if (e.target.value.trim()) setNameError(""); }}
                    autoFocus
                  />
                  {nameError && <p style={{ fontSize: "12px", color: "#FB7185", marginTop: 4 }}>{nameError}</p>}
                </div>
                <div>
                  <label className="label">{t.description_label} <span style={{ color: "#3A3A3D" }}>({t.optional})</span></label>
                  <textarea
                    className="input"
                    style={{ minHeight: 80, resize: "none" }}
                    placeholder={t.description_placeholder}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">{t.image_url_label} <span style={{ color: "#3A3A3D" }}>({t.optional})</span></label>
                  <input
                    className="input"
                    placeholder={t.image_url_placeholder}
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  />
                  {form.image_url && (
                    <div className="mt-2">
                      <img
                        src={form.image_url}
                        alt="Preview"
                        className="w-full h-36 object-cover rounded-xl"
                        style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        onLoad={(e) => { (e.target as HTMLImageElement).style.display = "block"; }}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="label">{t.starting_bid} ($)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.starting_bid}
                    onChange={(e) => setForm({ ...form, starting_bid: e.target.value })}
                  />
                </div>
              </div>

              <div
                className="flex items-center justify-end gap-3 px-8 py-5"
                style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
              >
                <button onClick={() => setShowModal(false)} className="btn-secondary">{t.cancel}</button>
                <button onClick={handleSave} className="btn-primary" disabled={saving}>
                  {saving ? t.saving : t.save}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={!!deleteTarget}
        title={t.confirm_delete_item}
        message={`"${deleteTarget?.name}"`}
        confirmLabel={t.confirm_yes}
        cancelLabel={t.confirm_no}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
