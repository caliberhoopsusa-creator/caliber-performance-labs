import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";

async function fetchUser(): Promise<User | null> {
  const response = await fetch("/api/auth/user", {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function logout(): Promise<void> {
  window.location.href = "/api/logout";
}

async function switchRole(role: 'player' | 'coach'): Promise<User> {
  const response = await fetch("/api/auth/role", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to switch role");
  }

  return response.json();
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  const switchRoleMutation = useMutation({
    mutationFn: switchRole,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/auth/user"], updatedUser);
      // Also update the extended user query used by App.tsx
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    switchRole: switchRoleMutation.mutate,
    isSwitchingRole: switchRoleMutation.isPending,
  };
}
