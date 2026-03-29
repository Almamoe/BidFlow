"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Users,
  CreditCard,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/language-context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, toggleLang } = useLanguage();

  const navItems = [
    { labelKey: "nav_dashboard" as const, href: "/admin", icon: LayoutDashboard },
    { labelKey: "nav_items" as const, href: "/admin/items", icon: Package },
    { labelKey: "nav_bidders" as const, href: "/admin/bidders", icon: Users },
    { labelKey: "nav_checkout" as const, href: "/admin/checkout", icon: CreditCard },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-7 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <Link
          href="/"
          className="flex items-center gap-1.5 mb-5 transition-colors duration-200"
          style={{ fontSize: "12px", color: "#3A3A3D" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#8A8A8D")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#3A3A3D")}
          onClick={() => setMobileOpen(false)}
        >
          <ChevronLeft style={{ width: 12, height: 12 }} />
          {t.back_to_roles}
        </Link>
        <div className="flex items-center gap-2.5">
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "#34D399", flexShrink: 0 }}
          />
          <div>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "#ECECEC", lineHeight: 1.3 }}>
              BidFlow
            </p>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#3A3A3D",
              }}
            >
              {t.administration}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 mt-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn("sidebar-link", isActive && "sidebar-link-active")}
            >
              <item.icon style={{ width: 16, height: 16, flexShrink: 0 }} strokeWidth={1.5} />
              {t[item.labelKey]}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#34D399", opacity: 0.8 }}
            />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#3A3A3D",
              }}
            >
              {t.connected}
            </span>
          </div>
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
              padding: "2px 6px",
              borderRadius: 6,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#8A8A8D")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#3A3A3D")}
          >
            {t.switch_lang}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "#0C0C0E" }}>
      {/* Desktop sidebar */}
      <aside
        className="w-60 flex-col fixed inset-y-0 left-0 z-20 hidden md:flex"
        style={{
          background: "#0A0A0C",
          borderRight: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 py-3"
        style={{
          background: "rgba(10,10,12,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ color: "#5C5C5F" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Menu style={{ width: 18, height: 18 }} />
        </button>
        <p style={{ fontSize: "15px", fontWeight: 600, color: "#ECECEC" }}>BidFlow</p>
        <div className="ml-auto flex items-center gap-3">
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
          >
            {t.switch_lang}
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34D399" }} />
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#34D399", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {t.live}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="fixed inset-y-0 left-0 w-60 z-50 flex flex-col shadow-2xl md:hidden"
              style={{ background: "#0A0A0C", borderRight: "1px solid rgba(255,255,255,0.04)" }}
            >
              <div
                className="flex items-center justify-between p-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#8A8A8D" }}>
                  {t.nav_dashboard}
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: "#5C5C5F" }}
                >
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 md:ml-60 p-6 md:p-10 mt-14 md:mt-0">
        {children}
      </main>
    </div>
  );
}
