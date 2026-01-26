import { useState } from "react";
import { Link } from "wouter";
import { Bell, Trash2, CheckCheck, AlertTriangle, TrendingDown, Target, TrendingUp, X, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAlerts,
  useUnreadAlerts,
  useMarkAlertRead,
  useMarkAllAlertsRead,
  useDeleteAlert,
  usePlayers,
  type Alert,
} from "@/hooks/use-basketball";
import { cn } from "@/lib/utils";
import { useSport } from "@/components/SportToggle";

const ALERT_TYPE_CONFIG: Record<string, { label: string; icon: typeof TrendingDown; className: string }> = {
  performance_drop: { label: "Performance Drop", icon: TrendingDown, className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  streak_ended: { label: "Streak Ended", icon: AlertTriangle, className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  goal_missed: { label: "Goal Missed", icon: Target, className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  improvement: { label: "Improvement", icon: TrendingUp, className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
};

const SEVERITY_CONFIG: Record<string, { color: string; bgColor: string }> = {
  info: { color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-500" },
  warning: { color: "text-yellow-600 dark:text-yellow-400", bgColor: "bg-yellow-500" },
  critical: { color: "text-red-600 dark:text-red-400", bgColor: "bg-red-500" },
};

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface AlertItemProps {
  alert: Alert;
  playerName?: string;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
  isMarkingRead: boolean;
  isDeleting: boolean;
}

function AlertItem({ alert, playerName, onMarkRead, onDelete, isMarkingRead, isDeleting }: AlertItemProps) {
  const typeConfig = ALERT_TYPE_CONFIG[alert.alertType] || ALERT_TYPE_CONFIG.improvement;
  const severityConfig = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
  const TypeIcon = typeConfig.icon;

  return (
    <div
      data-testid={`alert-item-${alert.id}`}
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border transition-colors",
        !alert.isRead ? "bg-accent/50 border-accent" : "bg-background border-border"
      )}
    >
      <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0", severityConfig.bgColor)} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Badge className={cn("text-xs", typeConfig.className)} data-testid={`alert-type-badge-${alert.id}`}>
            <TypeIcon className="w-3 h-3 mr-1" />
            {typeConfig.label}
          </Badge>
          <span className={cn("text-xs font-medium", severityConfig.color)} data-testid={`alert-severity-${alert.id}`}>
            {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
          </span>
          <span className="text-xs text-muted-foreground" data-testid={`alert-timestamp-${alert.id}`}>
            {formatTimestamp(alert.createdAt)}
          </span>
        </div>

        <h4 className="font-medium text-sm mb-1" data-testid={`alert-title-${alert.id}`}>
          {alert.title}
        </h4>
        <p className="text-sm text-muted-foreground mb-2" data-testid={`alert-message-${alert.id}`}>
          {alert.message}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          {playerName && (
            <Link href={`/players/${alert.playerId}`}>
              <Badge variant="outline" className="text-xs cursor-pointer" data-testid={`alert-player-link-${alert.id}`}>
                {playerName}
              </Badge>
            </Link>
          )}
          {alert.relatedGameId && (
            <Link href={`/players/${alert.playerId}?game=${alert.relatedGameId}`}>
              <Badge variant="secondary" className="text-xs cursor-pointer" data-testid={`alert-game-link-${alert.id}`}>
                View Game
              </Badge>
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {!alert.isRead && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onMarkRead(alert.id)}
            disabled={isMarkingRead}
            data-testid={`button-mark-read-${alert.id}`}
          >
            <CheckCheck className="w-4 h-4" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onDelete(alert.id)}
          disabled={isDeleting}
          data-testid={`button-delete-alert-${alert.id}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

interface AlertsCenterProps {
  playerId?: number;
}

export function AlertsCenter({ playerId }: AlertsCenterProps) {
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);
  const sport = useSport();

  const { data: alerts, isLoading: alertsLoading } = useAlerts(playerId, sport);
  const { data: players } = usePlayers();
  const markRead = useMarkAlertRead();
  const markAllRead = useMarkAllAlertsRead();
  const deleteAlert = useDeleteAlert();

  const playerMap = new Map(players?.map(p => [p.id, p.name]) || []);

  const filteredAlerts = alerts?.filter(alert => {
    if (filterType && alert.alertType !== filterType) return false;
    if (filterSeverity && alert.severity !== filterSeverity) return false;
    return true;
  }) || [];

  const unreadCount = filteredAlerts.filter(a => !a.isRead).length;

  const handleMarkRead = (id: number) => {
    markRead.mutate(id);
  };

  const handleDelete = (id: number) => {
    deleteAlert.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  const clearFilters = () => {
    setFilterType(null);
    setFilterSeverity(null);
  };

  if (alertsLoading) {
    return (
      <Card data-testid="alerts-center-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="alerts-center">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Alerts
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs" data-testid="alerts-unread-count">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" data-testid="button-filter-alerts">
                <Filter className="w-4 h-4 mr-1" />
                Filter
                {(filterType || filterSeverity) && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {(filterType ? 1 : 0) + (filterSeverity ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" data-testid="filter-dropdown">
              <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
              {Object.entries(ALERT_TYPE_CONFIG).map(([key, config]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setFilterType(filterType === key ? null : key)}
                  data-testid={`filter-type-${key}`}
                >
                  <config.icon className="w-4 h-4 mr-2" />
                  {config.label}
                  {filterType === key && <CheckCheck className="w-4 h-4 ml-auto" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Severity</DropdownMenuLabel>
              {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setFilterSeverity(filterSeverity === key ? null : key)}
                  data-testid={`filter-severity-${key}`}
                >
                  <div className={cn("w-3 h-3 rounded-full mr-2", config.bgColor)} />
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                  {filterSeverity === key && <CheckCheck className="w-4 h-4 ml-auto" />}
                </DropdownMenuItem>
              ))}
              {(filterType || filterSeverity) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearFilters} data-testid="button-clear-filters">
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending}
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark All Read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="alerts-empty">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No alerts to display</p>
            {(filterType || filterSeverity) && (
              <Button variant="ghost" onClick={clearFilters} className="mt-2" data-testid="button-clear-filters-empty">
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3" data-testid="alerts-list">
            {filteredAlerts.map(alert => (
              <AlertItem
                key={alert.id}
                alert={alert}
                playerName={playerMap.get(alert.playerId)}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
                isMarkingRead={markRead.isPending}
                isDeleting={deleteAlert.isPending}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AlertsBadgeProps {
  className?: string;
}

export function AlertsBadge({ className }: AlertsBadgeProps) {
  const { data: unreadAlerts, isLoading } = useUnreadAlerts();
  const count = unreadAlerts?.length || 0;

  if (isLoading) {
    return (
      <div className={cn("relative", className)} data-testid="alerts-badge-loading">
        <Bell className="w-5 h-5" />
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} data-testid="alerts-badge">
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 h-5 min-w-5 px-1 text-xs flex items-center justify-center"
          data-testid="alerts-badge-count"
        >
          {count > 99 ? "99+" : count}
        </Badge>
      )}
    </div>
  );
}

export default AlertsCenter;
