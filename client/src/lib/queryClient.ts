import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { cacheData, getCachedData } from "./offlineStorage";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const cacheKey = queryKey.join("/");
    
    try {
      const res = await fetch(cacheKey, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      
      cacheData(cacheKey, data);
      
      return data;
    } catch (error) {
      if (!navigator.onLine) {
        const cached = getCachedData(cacheKey);
        if (cached) {
          return cached.data;
        }
      }
      throw error;
    }
  };

function shouldRetry(failureCount: number, error: Error): boolean {
  if (!navigator.onLine) {
    return false;
  }
  
  if (error.message.startsWith("401") || error.message.startsWith("403") || error.message.startsWith("404")) {
    return false;
  }
  
  return failureCount < 3;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: shouldRetry,
      networkMode: "offlineFirst",
    },
    mutations: {
      retry: false,
      networkMode: "offlineFirst",
    },
  },
});
