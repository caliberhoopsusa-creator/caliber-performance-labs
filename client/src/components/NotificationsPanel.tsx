import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  Target,
  Users,
  Flame,
  Gamepad2,
  Bell,
  CheckCheck,
  Loader2,
  Heart,
  Eye,
  UserPlus,
  Shield,
  Star,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SportSpinner } from "@/components/SportSpinner";

interface NotificationsPanelProps {
  onClose?: () => void;
}

const notificationIcons: Record<string, typeof Trophy> = {
  badge_earned: Trophy,
  goal_progress: Target,
  new_follower: UserPlus,
  streak_reminder: Flame,
  game_logged: Gamepad2,
  challenge_update: Target,
  story_reaction: Heart,
  story_view: Eye,
  guardian_request: Shield,
  guardian_approved: Heart,
  guardian_milestone: Star,
  guardian_grade_change: TrendingUp,
  guardian_badge_earned: Trophy,
};

export function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    isMarkingAllRead,
  } = useNotifications();

  const handleNotificationClick = (notification: { id: number; isRead: boolean }) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.isRead);

  if (isLoading) {
    return (
      <div className="w-80 rounded-lg p-4 space-y-3">
        <div className="flex justify-center py-2">
          <SportSpinner size="sm" />
        </div>
        <div className="flex items-center justify-between border-b border-border pb-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 p-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-80 rounded-lg overflow-hidden" data-testid="notifications-panel">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-display text-lg font-semibold tracking-wide">Notifications</h3>
        {unreadNotifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead()}
            disabled={isMarkingAllRead}
            className="text-xs gap-1 text-muted-foreground hover:text-foreground"
            data-testid="button-mark-all-read"
          >
            {isMarkingAllRead ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCheck className="w-3 h-3" />
            )}
            Mark all read
          </Button>
        )}
      </div>

      <ScrollArea className="max-h-96">
        {notifications.length === 0 ? (
          <motion.div 
            className="flex flex-col items-center justify-center py-16 px-4 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-accent/60" />
            </div>
            <p className="text-foreground font-semibold mb-1">No notifications yet</p>
            <p className="text-sm text-muted-foreground">
              We'll notify you about important updates
            </p>
          </motion.div>
        ) : (
          <div className="divide-y divide-border/50">
            {notifications.map((notification) => {
              const IconComponent = notificationIcons[notification.notificationType] || Bell;
              const timeAgo = notification.createdAt
                ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
                : "";

              return (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full text-left p-4 flex gap-3 transition-colors hover-elevate",
                    !notification.isRead && "bg-accent/5"
                  )}
                  data-testid={`notification-item-${notification.id}`}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      notification.isRead ? "bg-secondary/50" : "bg-accent/20"
                    )}
                  >
                    <IconComponent
                      className={cn(
                        "w-4 h-4",
                        notification.isRead ? "text-muted-foreground" : "text-accent"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm font-medium truncate",
                          !notification.isRead && "text-foreground"
                        )}
                      >
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
