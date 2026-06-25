/**
 * Typed API client for our own Hono backend.
 * Handles Bearer token injection and automatic token refresh.
 */

import type {
  AuthResponse,
  Notification,
  PaginatedPosts,
  Post,
  SearchResult,
  User
} from "@/types/api";

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:3000";

// ─── Token Storage ────────────────────────────────────────────────────────────

const TOKEN_KEY = "auth.store";

function getTokens(): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return { accessToken: null, refreshToken: null };
    const parsed = JSON.parse(raw);
    return {
      accessToken: parsed?.state?.accessToken ?? null,
      refreshToken: parsed?.state?.refreshToken ?? null
    };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

function setTokens(accessToken: string, refreshToken: string): void {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    const parsed = raw ? JSON.parse(raw) : { state: {} };
    parsed.state = { ...parsed.state, accessToken, refreshToken };
    localStorage.setItem(TOKEN_KEY, JSON.stringify(parsed));
  } catch {}
}

// ─── Core Fetch ───────────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = (async () => {
    const { refreshToken } = getTokens();
    if (!refreshToken) throw new Error("No refresh token");
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    });
    if (!res.ok) throw new Error("Refresh failed");
    const data = (await res.json()) as {
      accessToken: string;
      refreshToken: string;
    };
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  })().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });
  return refreshPromise;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const { accessToken } = getTokens();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>)
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    try {
      const newToken = await refreshAccessToken();
      headers["Authorization"] = `Bearer ${newToken}`;
      const retried = await fetch(`${API_URL}${path}`, { ...options, headers });
      if (!retried.ok) throw new Error(await retried.text());
      return retried.json() as Promise<T>;
    } catch {
      // Clear tokens on failed refresh
      localStorage.removeItem(TOKEN_KEY);
      throw new Error("Session expired. Please log in again.");
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(
      (err as { error: string }).error ?? "Request failed"
    );
  }

  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    register: (data: {
      email: string;
      username: string;
      password: string;
      displayName?: string;
    }) =>
      apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data)
      }),

    login: (data: { email: string; password: string }) =>
      apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data)
      }),

    logout: (refreshToken: string) =>
      apiFetch<{ success: boolean }>("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken })
      })
  },

  // ─── Me ────────────────────────────────────────────────────────────────────

  me: {
    get: () => apiFetch<{ me: User }>("/me"),
    update: (data: Partial<User>) =>
      apiFetch<{ me: User }>("/me", {
        method: "PATCH",
        body: JSON.stringify(data)
      })
  },

  // ─── Posts ─────────────────────────────────────────────────────────────────

  posts: {
    feed: (cursor?: string) =>
      apiFetch<PaginatedPosts>(
        `/posts${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`
      ),

    timeline: (cursor?: string) =>
      apiFetch<PaginatedPosts>(
        `/posts/timeline${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`
      ),

    get: (id: string) =>
      apiFetch<{ post: Post; comments: Post[] }>(`/posts/${id}`),

    create: (data: {
      content: string;
      mediaUrls?: string[];
      parentId?: string;
    }) =>
      apiFetch<{ post: Post }>("/posts", {
        method: "POST",
        body: JSON.stringify(data)
      }),

    delete: (id: string) =>
      apiFetch<{ success: boolean }>(`/posts/${id}`, { method: "DELETE" }),

    vote: (id: string, value: 1 | -1 | 0) =>
      apiFetch<{ voted: number }>(`/posts/${id}/vote`, { 
        method: "POST",
        body: JSON.stringify({ value })
      }),

    bookmark: (id: string) =>
      apiFetch<{ bookmarked: boolean }>(`/posts/${id}/bookmark`, {
        method: "POST"
      }),

    bookmarks: (cursor?: string) =>
      apiFetch<PaginatedPosts>(
        `/posts/bookmarks/mine${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`
      )
  },

  // ─── Accounts ──────────────────────────────────────────────────────────────

  accounts: {
    get: (username: string) =>
      apiFetch<{ account: User }>(`/accounts/${username}`),

    posts: (username: string, cursor?: string) =>
      apiFetch<PaginatedPosts>(
        `/accounts/${username}/posts${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`
      ),

    follow: (username: string) =>
      apiFetch<{ following: boolean }>(`/accounts/${username}/follow`, {
        method: "POST"
      })
  },

  // ─── Notifications ─────────────────────────────────────────────────────────

  notifications: {
    list: () => apiFetch<{ items: Notification[] }>("/notifications"),
    markRead: () =>
      apiFetch<{ success: boolean }>("/notifications/mark-read", {
        method: "POST"
      }),
    unreadCount: () =>
      apiFetch<{ count: number }>("/notifications/unread-count")
  },

  // ─── Search ────────────────────────────────────────────────────────────────

  search: {
    query: (q: string, type?: "all" | "accounts" | "posts") =>
      apiFetch<SearchResult>(
        `/search?q=${encodeURIComponent(q)}${type ? `&type=${type}` : ""}`
      )
  },

  // ─── AI ────────────────────────────────────────────────────────────────────

  ai: {
    generateImage: (prompt: string) =>
      apiFetch<{ url: string }>("/ai/generate-image", {
        method: "POST",
        body: JSON.stringify({ prompt })
      }),
    
    startWebAgent: (url: string, description: string, requestedByUsername: string) =>
      apiFetch<{ success: boolean }>("/ai/web-agent", {
        method: "POST",
        body: JSON.stringify({ url, description, requestedByUsername })
      })
  }
};
