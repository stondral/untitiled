"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import AuthDropdown from "@/components/auth/AuthDropdown";
import Cart from "@/components/cart/Cart";
import VoiceSearchTrigger from "@/components/search/VoiceSearchTrigger";
import VoiceSearchOverlay from "@/components/search/VoiceSearchOverlay";

import logoston from "./logoston.png";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Discover", badge: "NEW" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/about-us", label: "About Us" },
  { href: "/feedback", label: "Feedback", badge: "HOT" },
];

export default function Navbar() {
   const pathname = usePathname();
   const router = useRouter();
   const [isScrolled, setIsScrolled] = useState(false);
   const [isSearchVisible, setIsSearchVisible] = useState(false);
   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState(false);
   const isImmersivePage = pathname === "/feedback" || pathname === "/meetus";

  useEffect(() => {
    if (!isImmersivePage) return;
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isImmersivePage]);

  return (
    <nav className={`sticky top-4 z-50 w-[95%] max-w-7xl mx-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-black/5 transition-all duration-300 ${
      isImmersivePage && isScrolled ? "opacity-0 pointer-events-none -translate-y-full" : "opacity-100"
    }`}>
      <div className="container flex h-16 items-center px-4 md:px-8 relative overflow-hidden">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent/10 via-transparent to-accent/10 pointer-events-none opacity-50" />

        {/* mobile menu */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2 md:hidden z-10 transition-transform active:scale-90">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px] border-r-0 bg-white/80 backdrop-blur-2xl px-0">
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
            
            <SheetTitle className="px-6 text-2xl font-black tracking-tighter text-slate-900 mt-6">
              STOND <span className="text-orange-500 italic">MENU</span>
            </SheetTitle>
            <SheetDescription className="px-6 text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1 mb-8">
              Premium Shopping Experience
            </SheetDescription>
            
            <nav className="flex flex-col px-4">
              <AnimatePresence>
                {isMenuOpen && (
                  <div className="space-y-1">
                    {NAV_LINKS.map((link, idx) => (
                      <motion.div
                        key={link.href}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`group flex items-center justify-between px-6 py-4 rounded-2xl transition-all ${
                            isActive(link.href, pathname)
                              ? "bg-orange-50 text-orange-600 shadow-sm"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <span className={`text-lg font-black tracking-tight ${isActive(link.href, pathname) ? "" : ""}`}>
                            {link.label}
                          </span>
                          
                          {link.badge && (
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ring-1 ${
                              link.badge === 'NEW' 
                                ? "bg-orange-500 text-white ring-orange-500" 
                                : "bg-white text-orange-500 ring-orange-200"
                            }`}>
                              {link.badge}
                            </span>
                          )}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </nav>

            <div className="absolute bottom-10 left-0 w-full px-6">
              <div className="p-6 rounded-[2rem] bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl shadow-orange-200">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Partner with us</p>
                <h4 className="text-xl font-black mb-4 tracking-tight">Become a Stond Seller</h4>
                <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full bg-white text-orange-600 hover:bg-white/90 rounded-xl font-black text-xs uppercase tracking-widest border-none h-12">
                    Join Today
                  </Button>
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* logo */}
        <Link href="/" className="mr-6 flex items-center gap-2 z-10">
          <Image
            src={logoston}
            alt="Stond Emporium Logo"
            width={64}
            height={64}
            className="rounded-lg"
          />
          <span className="hidden sm:inline text-xl font-bold tracking-tight">
            Stond Emporium
          </span>
        </Link>

        {/* desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium z-10">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors duration-200 pb-1 ${
                isActive(link.href, pathname)
                  ? "text-foreground font-semibold border-b-2 border-accent"
                  : "text-foreground/80 hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* right actions */}
        <div className="flex flex-1 items-center justify-end gap-4 z-10">
          <div className="hidden md:flex relative max-w-[280px] w-full items-center">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const q = formData.get("q");
                if (q)
                  router.push(
                    `/products?q=${encodeURIComponent(q.toString())}`,
                  );
              }}
              className="relative w-full flex items-center"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />

              <Input
                name="q"
                type="search"
                placeholder="Search products..."
                className="h-9 pl-10 pr-10 bg-card border-transparent focus-visible:ring-accent"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex items-center">
                <VoiceSearchTrigger onOpen={() => setIsVoiceOverlayOpen(true)} />
              </div>
            </form>
          </div>

          {/* Mobile Search Button */}
          <div className="md:hidden flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSearchVisible(true)}
              className="text-foreground/60"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>

          <Cart />
          <AuthDropdown />
        </div>

        {/* Mobile Search Overlay */}
        <AnimatePresence>
          {isSearchVisible && (
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl flex items-center px-4 gap-2 z-30"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const q = formData.get("q");
                  if (q) {
                    router.push(`/products?q=${encodeURIComponent(q.toString())}`);
                    setIsSearchVisible(false);
                  }
                }}
                className="flex-1 flex items-center relative"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  type="search"
                  autoFocus
                  placeholder="Search products..."
                  className="h-10 pl-10 pr-10 w-full bg-accent/50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-accent"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex items-center">
                  <VoiceSearchTrigger onOpen={() => setIsVoiceOverlayOpen(true)} />
                </div>
              </form>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsSearchVisible(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isVoiceOverlayOpen && (
            <VoiceSearchOverlay onClose={() => setIsVoiceOverlayOpen(false)} />
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

function isActive(href: string, pathname: string | null) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}
