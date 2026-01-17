import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Notification {
  id: number;
  playerId: number;
  notificationType: string;
  title: string;
  message: string;
  relatedId: number | null;
  relatedType: string | null;
  isRead: boolean;
  createdAt: string;
}

interface UnreadCount {
  count: number;
}

export function useNotifications() {
  const { data: notifications = [], isLoading: notificationsLoading, refetch: refetchNotifications } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    staleTime: 1000 * 30,
  });

  const { data: unreadData, isLoading: countLoading } = useQuery<UnreadCount>({
    queryKey: ["/api/notifications", "unread-count"],
    staleTime: 1000 * 30,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications", "unread-count"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications", "unread-count"] });
    },
  });

  return {
    notifications,
    unreadCount: unreadData?.count ?? 0,
    isLoading: notificationsLoading || countLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingRead: markAsReadMutation.isPending,
    isMarkingAllRead: markAllAsReadMutation.isPending,
    refetch: refetchNotifications,
  };
}
