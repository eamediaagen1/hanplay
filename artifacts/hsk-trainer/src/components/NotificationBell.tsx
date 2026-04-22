import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative w-9 h-9 rounded-lg flex items-center justify-center",
          "text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
          open && "bg-muted text-foreground",
          className
        )}
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border/60 rounded-2xl shadow-xl shadow-black/8 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
          </div>
          <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-1">
              <Bell className="w-4 h-4 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium text-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground">
              You're all caught up. Check back later.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
