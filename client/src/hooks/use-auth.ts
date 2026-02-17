import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";

// Error messages for common auth scenarios
const AUTH_ERROR_MESSAGES = {
  NETWORK_ERROR: "Network connection failed. Please check your internet connection.",
  SESSION_EXPIRED: "Your session has expired. Please log in again.",
  INVALID_CREDENTIALS: "Invalid email or password. Please try again.",
  USER_NOT_FOUND: "User account not found. Please sign up.",
  INVALID_ROLE: "Invalid role selection. Please try again.",
  PROFILE_MISSING: "Your profile data is incomplete. Please complete your profile.",
  LOGOUT_FAILED: "Failed to log out. Please try again or clear your browser cache.",
  SWITCH_ROLE_FAILED: "Failed to switch roles. Please try again.",
  SERVER_ERROR: "Server error. Please try again later.",
  UNAUTHORIZED: "You are not authorized to access this resource.",
  SUBSCRIPTION_REQUIRED: "This feature requires a premium subscription.",
};

async function fetchUser(): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/user", {
      credentials: "include",
    });

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      if (response.status === 403) {
        throw {
          status: 403,
          message: AUTH_ERROR_MESSAGES.UNAUTHORIZED,
          type: "unauthorized",
        };
      }
      if (response.status === 500) {
        throw {
          status: 500,
          message: AUTH_ERROR_MESSAGES.SERVER_ERROR,
          type: "server_error",
        };
      }
      throw {
        status: response.status,
        message: AUTH_ERROR_MESSAGES.SERVER_ERROR,
        type: "fetch_error",
      };
    }

    const userData = await response.json();
    
    // Return user data even if role is not set
    // The routing logic will handle redirecting to role selection
    return userData;
  } catch (error) {
    if (error instanceof TypeError) {
      throw {
        status: 0,
        message: AUTH_ERROR_MESSAGES.NETWORK_ERROR,
        type: "network_error",
      };
    }
    throw error;
  }
}

async function logout(): Promise<void> {
  try {
    const response = await fetch("/api/logout", {
      credentials: "include",
    });

    if (!response.ok) {
      throw {
        status: response.status,
        message: AUTH_ERROR_MESSAGES.LOGOUT_FAILED,
        type: "logout_error",
      };
    }

    // Redirect to logout endpoint
    window.location.href = "/api/logout";
  } catch (error) {
    if (error instanceof TypeError) {
      throw {
        status: 0,
        message: AUTH_ERROR_MESSAGES.NETWORK_ERROR,
        type: "network_error",
      };
    }
    throw error;
  }
}

async function switchRole(role: 'player' | 'coach' | 'recruiter'): Promise<User> {
  try {
    if (!role || !['player', 'coach', 'recruiter'].includes(role)) {
      throw {
        status: 400,
        message: AUTH_ERROR_MESSAGES.INVALID_ROLE,
        type: "validation_error",
      };
    }

    const response = await fetch("/api/auth/role", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        throw {
          status: 401,
          message: AUTH_ERROR_MESSAGES.SESSION_EXPIRED,
          type: "session_expired",
        };
      }
      if (response.status === 403) {
        throw {
          status: 403,
          message: AUTH_ERROR_MESSAGES.UNAUTHORIZED,
          type: "unauthorized",
        };
      }
      if (response.status === 400) {
        throw {
          status: 400,
          message: errorData.message || AUTH_ERROR_MESSAGES.INVALID_ROLE,
          type: "validation_error",
        };
      }

      throw {
        status: response.status,
        message: errorData.message || AUTH_ERROR_MESSAGES.SWITCH_ROLE_FAILED,
        type: "switch_role_error",
      };
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw {
        status: 0,
        message: AUTH_ERROR_MESSAGES.NETWORK_ERROR,
        type: "network_error",
      };
    }
    throw error;
  }
}

export interface AuthError {
  status: number;
  message: string;
  type: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { 
    data: user, 
    isLoading, 
    error: fetchError,
    isError: isFetchError,
  } = useQuery<User | null, AuthError>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logoutMutation = useMutation<void, AuthError>({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  const switchRoleMutation = useMutation<User, AuthError, 'player' | 'coach' | 'recruiter'>({
    mutationFn: switchRole,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/auth/user"], updatedUser);
      // Also update the extended user query used by App.tsx
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    },
  });

  // Detect session expiry
  const isSessionExpired = 
    isFetchError && 
    (fetchError?.status === 401 || fetchError?.type === "session_expired");

  // Detect network errors
  const isNetworkError = 
    (isFetchError && fetchError?.type === "network_error") ||
    (logoutMutation.isError && logoutMutation.error?.type === "network_error") ||
    (switchRoleMutation.isError && switchRoleMutation.error?.type === "network_error");

  // Get the current error (from any auth operation)
  const authError = fetchError || logoutMutation.error || switchRoleMutation.error;

  return {
    // User state
    user,
    isLoading,
    isAuthenticated: !!user,

    // Error handling
    error: authError,
    isError: isFetchError || logoutMutation.isError || switchRoleMutation.isError,
    isSessionExpired,
    isNetworkError,
    errorMessage: authError?.message || null,
    errorType: authError?.type || null,

    // Logout
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    logoutError: logoutMutation.error,

    // Role switching
    switchRole: switchRoleMutation.mutate,
    isSwitchingRole: switchRoleMutation.isPending,
    switchRoleError: switchRoleMutation.error,
  };
}
