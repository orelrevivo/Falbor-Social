// ─── Our Own User / Post Types (replaces Lens-generated types) ───────────────

export interface User {
  id: string;
  email?: string; // only present on /me
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  website: string | null;
  location: string | null;
  isVerified: boolean;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  postsCount?: number;
  isFollowing?: boolean;
}

export interface PostAuthor {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
}

export interface Post {
  id: string;
  content: string;
  mediaUrls: string[];
  parentId: string | null;
  repostOfId: string | null;
  createdAt: string;
  author: PostAuthor;
  commentsCount: number;
  repostsCount: number;
  bookmarksCount?: number;
  hasBookmarked: boolean;
  score: number;
  upvotesCount: number;
  downvotesCount: number;
  userVote: 1 | -1 | 0;
}

export interface PaginatedPosts {
  items: Post[];
  nextCursor: string | null;
}

export interface Notification {
  id: string;
  type: "upvote" | "comment" | "follow" | "repost" | "mention";
  read: boolean;
  createdAt: string;
  postId: string | null;
  actor: PostAuthor;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface SearchResult {
  accounts: User[];
  posts: Post[];
}
