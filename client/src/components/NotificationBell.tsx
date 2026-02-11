import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { unreadCount } = useNotifications();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative overflow-visible">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative overflow-visible"
        data-testid="button-notification-bell"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute top-0 right-0 min-w-[18px] h-[18px] flex items-center justify-center",
              "bg-accent text-primary-foreground text-xs font-bold rounded-full",
              "px-1 animate-in zoom-in-50 duration-200 transform translate-x-1 -translate-y-1"
            )}
            data-testid="badge-unread-count"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <NotificationsPanel onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
}
