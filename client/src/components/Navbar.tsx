/* ============================================================
   Navbar.tsx — Shared navigation component
   Design: Elastic Signal — dark #0a0d12, teal #00e5a0 accent
   Features: Dropdown menus for Products & Resources, mobile hamburger
   ============================================================ */

import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import PrimalEdgeLogo from "./PrimalEdgeLogo";
import { useAuth } from "../contexts/AuthContext";
import { useLoginModal } from "../contexts/LoginModalContext";

const PRODUCTS_LINKS = [
  { label: "Primal Edge AI Cockpit", href: "/ai-dashboard", badge: "LIVE", badgeColor: "#00e5a0" },
  { label: "Weekly Income \u2014 Standard", href: "/weekly-income", badge: "LIVE", badgeColor: "#00e5a0" },
  { label: "Weekly Income \u2014 Micro", href: "/micro", badge: "LIVE", badgeColor: "#00e5a0" },
  { label: "Options Prep", href: "/options-prep", badge: "IN DEV", badgeColor: "#3b82f6" },
  { label: "Market Sentiment", href: "/market-sentiment", badge: "LIVE", badgeColor: "#00e5a0" },
  { label: "Sectors", href: "/sectors", badge: "COMING SOON", badgeColor: "#f59e0b" },
  { label: "All Products", href: "/products", badge: null, badgeColor: "" },
];

const RESOURCES_LINKS = [
  { label: "Charts & Indicators", href: "/charts" },
  { label: "Education", href: "/education" },
  { label: "Podcasts", href: "/podcasts" },
  { label: "References", href: "/references" },
  { label: "Development Requests", href: "/dev-requests" },
];

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DropdownMenu({ links }: { links: { label: string; href: string; badge?: string | null; badgeColor?: string }[] }) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-[#0d1118] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          <div className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer group">
            <span className="text-white/70 group-hover:text-white text-sm transition-colors">{link.label}</span>
            {link.badge && (
              <span
                className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full border"
                style={{
                  color: link.badgeColor,
                  borderColor: `${link.badgeColor}40`,
                  backgroundColor: `${link.badgeColor}15`,
                }}
              >
                {link.badge}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function Navbar() {
  const [productsOpen, setProductsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [location] = useLocation();
  const { user, signOut } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const productsRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (productsRef.current && !productsRef.current.contains(e.target as Node)) {
        setProductsOpen(false);
      }
      if (resourcesRef.current && !resourcesRef.current.contains(e.target as Node)) {
        setResourcesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const close = () => setUserMenuOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [userMenuOpen]);

  const isProductsActive = PRODUCTS_LINKS.some((l) => l.href === location);
  const isResourcesActive = RESOURCES_LINKS.some((l) => l.href === location);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0d12]/95 backdrop-blur-md border-b border-white/5">
        <div className="container flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <PrimalEdgeLogo size="sm" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1 text-sm">
            {/* Products Dropdown */}
            <div ref={productsRef} className="relative">
              <button
                onClick={() => { setProductsOpen(!productsOpen); setResourcesOpen(false); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                  isProductsActive ? "text-[#00e5a0]" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                Products
                <ChevronDown open={productsOpen} />
              </button>
              {productsOpen && <DropdownMenu links={PRODUCTS_LINKS} />}
            </div>

            {/* Resources Dropdown */}
            <div ref={resourcesRef} className="relative">
              <button
                onClick={() => { setResourcesOpen(!resourcesOpen); setProductsOpen(false); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                  isResourcesActive ? "text-[#00e5a0]" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                Resources
                <ChevronDown open={resourcesOpen} />
              </button>
              {resourcesOpen && <DropdownMenu links={RESOURCES_LINKS} />}
            </div>

            {/* Dev Requests */}
            <Link href="/dev-requests">
              <span className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                location === "/dev-requests" ? "text-[#00e5a0]" : "text-white/60 hover:text-white hover:bg-white/5"
              }`}>
                Dev Requests
              </span>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Member Login / User Menu */}
            <div className="hidden sm:block relative">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
                    style={{
                      border: "1px solid rgba(0,255,150,0.3)",
                      color: "#00ff96",
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full bg-[#00ff96] animate-pulse"
                    />
                    {(user.email || "").length > 20
                      ? (user.email || "").slice(0, 20) + "..."
                      : user.email}
                  </button>
                  {userMenuOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 py-1 rounded-lg shadow-xl"
                      style={{
                        background: "#0d0d0d",
                        border: "1px solid rgba(255,255,255,0.1)",
                        minWidth: "160px",
                        zIndex: 100,
                      }}
                    >
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut();
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => openLoginModal()}
                  className="px-4 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#ccc",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0,255,150,0.5)";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                    e.currentTarget.style.color = "#ccc";
                  }}
                >
                  Member Login
                </button>
              )}
            </div>

            {location !== "/ai-dashboard" && (
              <Link href="/subscribe" className="hidden sm:block">
                <button className="bg-[#00e5a0] text-[#0a0d12] font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-[#00e5a0]/90 transition-colors">
                  Get Access
                </button>
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 4l12 12M16 4L4 16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 5h14M3 10h14M3 15h14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden bg-[#0d1118] border-t border-white/5 px-4 py-4 space-y-1">
            {/* Products */}
            <button
              onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm"
            >
              <span>Products</span>
              <ChevronDown open={mobileProductsOpen} />
            </button>
            {mobileProductsOpen && (
              <div className="pl-4 space-y-1">
                {PRODUCTS_LINKS.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors text-sm cursor-pointer">
                      <span>{link.label}</span>
                      {link.badge && (
                        <span className="text-[10px] font-bold" style={{ color: link.badgeColor }}>
                          {link.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Resources */}
            <button
              onClick={() => setMobileResourcesOpen(!mobileResourcesOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm"
            >
              <span>Resources</span>
              <ChevronDown open={mobileResourcesOpen} />
            </button>
            {mobileResourcesOpen && (
              <div className="pl-4 space-y-1">
                {RESOURCES_LINKS.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <div className="px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors text-sm cursor-pointer">
                      {link.label}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Dev Requests */}
            <Link href="/dev-requests">
              <div className="px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm cursor-pointer">
                Dev Requests
              </div>
            </Link>

            {/* Mobile Member Login */}
            {user ? (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  signOut();
                }}
                className="w-full text-left py-3 text-sm flex items-center gap-2"
                style={{ color: "#00ff96" }}
              >
                <span className="w-2 h-2 rounded-full bg-[#00ff96]" />
                Sign Out ({(user.email || "").split("@")[0]})
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  openLoginModal();
                }}
                className="w-full text-left py-3 text-sm text-white/60 hover:text-white transition-colors"
              >
                Member Login
              </button>
            )}

            {/* CTA */}
            {location !== "/ai-dashboard" && (
              <div className="pt-2">
                <Link href="/subscribe">
                  <button className="w-full bg-[#00e5a0] text-[#0a0d12] font-bold py-3 rounded-xl text-sm">
                    Get Access →
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
