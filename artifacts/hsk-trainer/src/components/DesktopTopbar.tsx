import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Settings, CreditCard, LogOut, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { useSidebar } from "@/contexts/sidebar-context";
import { useAuth } from "@/contexts/auth-context";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/flashcards": "Flashcards",
  "/quiz": "Quiz",
  "/review": "Review",
  "/phrases": "Phrase Practice",
  "/strokes": "Stroke Learning",
  "/settings": "Settings",
  "/membership": "Membership",
  "/affiliate": "Affiliate",
  "/chinese-themes": "Chinese Themes",
};

function getPageTitle(location: string): string {
  for (const [prefix, title] of Object.entries(PAGE_TITLES)) {
    if (location.startsWith(prefix)) return title;
  }
  return "Hanplay";
}

function UserDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const email = user?.email ?? "";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
    navigate("/");
  };

  const displayName = profile?.name || email.split("@")[0] || "Account";
  const initial = (profile?.name || email)[0]?.toUpperCase() || "?";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors",
          "hover:bg-muted text-foreground",
          open && "bg-muted"
        )}
      >
        <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
          <span className="text-[11px] font-bold text-primary">{initial}</span>
        </div>
        <span className="hidden lg:block text-sm font-medium max-w-[120px] truncate">{displayName}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-60 bg-card border border-border/60 rounded-2xl shadow-xl shadow-black/8 z-50 overflow-hidden"
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{initial}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{email}</p>
                </div>
              </div>
              {profile?.is_premium && (
                <div className="flex items-center gap-1.5 mt-2.5 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/30">
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Premium · All levels</span>
                </div>
              )}
            </div>

            {/* Links */}
            <div className="py-1.5">
              {[
                { icon: CreditCard, label: "Membership", href: "/membership" },
                { icon: Settings, label: "Settings", href: "/settings" },
              ].map(({ icon: Icon, label, href }) => (
                <button
                  key={href}
                  onClick={() => { setOpen(false); navigate(href); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  {label}
                </button>
              ))}
            </div>

            <div className="border-t border-border/40 py-1.5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DesktopTopbar() {
  const { isExpanded } = useSidebar();
  const [location] = useLocation();
  const pageTitle = getPageTitle(location);

  return (
    <header
      className={cn(
        "hidden md:flex fixed top-0 right-0 z-20 h-[60px]",
        "bg-background/95 backdrop-blur-xl border-b border-border/60",
        "items-center px-4 gap-3",
        "transition-[left] duration-200 ease-in-out",
        isExpanded ? "left-[240px]" : "left-[64px]"
      )}
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={pageTitle}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="text-sm font-semibold text-foreground/70 mr-auto"
        >
          {pageTitle}
        </motion.p>
      </AnimatePresence>

      <div className="flex items-center gap-1">
        <NotificationBell />
        <ThemeToggle />
        <div className="w-px h-5 bg-border/60 mx-1" />
        <UserDropdown />
      </div>
    </header>
  );
}
