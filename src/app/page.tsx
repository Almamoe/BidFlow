"use client";

import Link from "next/link";
import { Shield, HandHelping, Monitor, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/language-context";

const roles = [
  {
    titleKey: "role_admin_title" as const,
    subtitleKey: "role_admin_subtitle" as const,
    descKey: "role_admin_desc" as const,
    href: "/admin",
    icon: Shield,
    hoverIconColor: "#34D399",
  },
  {
    titleKey: "role_volunteer_title" as const,
    subtitleKey: "role_volunteer_subtitle" as const,
    descKey: "role_volunteer_desc" as const,
    href: "/volunteer",
    icon: HandHelping,
    hoverIconColor: "#E2B340",
  },
  {
    titleKey: "role_display_title" as const,
    subtitleKey: "role_display_subtitle" as const,
    descKey: "role_display_desc" as const,
    href: "/display",
    icon: Monitor,
    hoverIconColor: "#ECECEC",
  },
];

export default function HomePage() {
  const { t, toggleLang } = useLanguage();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden"
      style={{ background: "#0C0C0E" }}
    >
      {/* Subtle top-center radial glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(52,211,153,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Language toggle */}
      <button
        onClick={toggleLang}
        className="absolute top-5 right-6 transition-colors duration-200"
        style={{
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#3A3A3D",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 8px",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#8A8A8D")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#3A3A3D")}
      >
        {t.switch_lang}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-3xl relative"
      >
        {/* IRC badge */}
        <div className="flex justify-center mb-8">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.1em] px-4 py-1.5 rounded-full"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "#5C5C5F",
            }}
          >
            {t.irc}
          </span>
        </div>

        {/* Title */}
        <h1
          className="text-center mb-3 leading-none"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(48px, 8vw, 64px)",
            letterSpacing: "-0.03em",
          }}
        >
          <span style={{ color: "#ECECEC" }}>Bid</span>
          <span style={{ color: "#34D399" }}>Flow</span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-center mb-14"
          style={{ fontSize: "16px", color: "#5C5C5F" }}
        >
          {t.landing_subtitle}
        </p>

        {/* Role cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map((role, i) => (
            <motion.div
              key={role.href}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.1 + i * 0.08,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              <Link href={role.href} className="block group">
                <motion.div
                  whileHover={{ scale: 1.005 }}
                  transition={{ duration: 0.2 }}
                  className="card p-8 h-full relative"
                  style={{ minHeight: "220px" }}
                >
                  {/* Icon */}
                  <role.icon
                    className="mb-5 transition-colors duration-300"
                    style={{ width: 20, height: 20, color: "#5C5C5F" }}
                    data-hover-color={role.hoverIconColor}
                  />

                  <style>{`
                    .group:hover [data-hover-color="${role.hoverIconColor}"] {
                      color: ${role.hoverIconColor};
                    }
                  `}</style>

                  <h2
                    className="mb-1 transition-colors duration-200"
                    style={{ fontSize: "16px", fontWeight: 600, color: "#ECECEC" }}
                  >
                    {t[role.titleKey]}
                  </h2>
                  <p className="mb-4" style={{ fontSize: "12px", color: "#5C5C5F" }}>
                    {t[role.subtitleKey]}
                  </p>
                  <p
                    className="leading-relaxed"
                    style={{ fontSize: "13px", color: "#5C5C5F", lineHeight: 1.6 }}
                  >
                    {t[role.descKey]}
                  </p>

                  <div
                    className="absolute bottom-8 right-8 flex items-center gap-1 transition-all duration-200 group-hover:gap-2"
                    style={{ color: "#5C5C5F", fontSize: "14px" }}
                  >
                    <ArrowRight
                      className="transition-transform duration-200 group-hover:translate-x-1"
                      style={{ width: 14, height: 14 }}
                    />
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <p
          className="text-center mt-20"
          style={{ fontSize: "12px", color: "#3A3A3D" }}
        >
          {t.every_dollar}
        </p>
      </motion.div>
    </div>
  );
}
