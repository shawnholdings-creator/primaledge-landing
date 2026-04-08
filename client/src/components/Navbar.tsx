/* ============================================================
   Navbar.tsx — Shared navigation component
   Design: Elastic Signal — dark #0a0e14, teal #00d4aa accent
   Features: Dropdown menus for Products & Resources, mobile hamburger
   ============================================================ */

import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import PrimalEdgeLogo from "./PrimalEdgeLogo";

const PRODUCTS_LINKS = [
  { label: "Elastic Slingshot Scanner", href: "/", badge: "LIVE", badgeColor: "#00d4aa" },
  { label: "Neural AI Picks", href: "/products", badge: "LIVE", badgeColor: "#a78bfa" },
  { label: "Market Sentiment", href: "/market-sentiment", badge: "COMING SOON", badgeColor: "#f59e0b" },
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
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-[#0d1520] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
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

  const isProductsActive = PRODUCTS_LINKS.some((l) => l.href === location);
  const isResourcesActive = RESOURCES_LINKS.some((l) => l.href === location);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e14]/95 backdrop-blur-md border-b border-white/5">
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
                  isProductsActive ? "text-[#00d4aa]" : "text-white/60 hover:text-white hover:bg-white/5"
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
                  isResourcesActive ? "text-[#00d4aa]" : "text-white/60 hover:text-white hover:bg-white/5"
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
                location === "/dev-requests" ? "text-[#00d4aa]" : "text-white/60 hover:text-white hover:bg-white/5"
              }`}>
                Dev Requests
              </span>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link href="/subscribe" className="hidden sm:flex items-center gap-2 group">
              {/* Members Only badge */}
              <span className="hidden lg:flex items-center gap-1 text-[10px] font-bold tracking-widest text-[#00d4aa] bg-[#00d4aa]/10 border border-[#00d4aa]/30 px-2.5 py-1 rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] shrink-0" />
                MEMBERS ONLY
              </span>
              <button className="bg-[#00d4aa] text-[#0a0e14] font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-[#00d4aa]/90 transition-colors">
                Get Access
              </button>
            </Link>

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
          <div className="md:hidden bg-[#0d1520] border-t border-white/5 px-4 py-4 space-y-1">
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

            {/* CTA */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-widest text-[#00d4aa]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse shrink-0" />
                MEMBERS ONLY — INVITE REQUIRED
              </div>
              <Link href="/subscribe">
                <button className="w-full bg-[#00d4aa] text-[#0a0e14] font-bold py-3 rounded-xl text-sm">
                  Get Access →
                </button>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
