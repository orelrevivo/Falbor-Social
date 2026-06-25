import { LightBulbIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import SimplePostCard from "@/components/Post/SimplePostCard";
import Loader from "@/components/Shared/Loader";
import { api } from "@/lib/api";
import type { Post } from "@/types/api";

const TopAccounts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPosts = useCallback(async (nextCursor?: string) => {
    try {
      const data = await api.posts.feed(nextCursor);
      setPosts((prev) =>
        nextCursor ? [...prev, ...data.items] : data.items
      );
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to load posts");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleLoadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    await loadPosts(cursor);
  };

  if (loading) {
    return <Loader className="my-12" message="Loading posts..." />;
  }

  if (!posts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <LightBulbIcon className="mb-3 size-8 text-gray-400" />
        <p className="text-gray-500">No posts yet. Be the first to post!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-800">
      {posts.map((post) => (
        <SimplePostCard
          key={post.id}
          post={post}
          onUpdate={(updated) => {
            setPosts((prev) =>
              prev.map((p) => (p.id === updated.id ? updated : p))
            );
          }}
          onDelete={(id) => {
            setPosts((prev) => prev.filter((p) => p.id !== id));
          }}
        />
      ))}
      {hasMore && (
        <div className="flex justify-center py-4">
          <button
            className="rounded-xl px-6 py-2 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950"
            disabled={loadingMore}
            onClick={handleLoadMore}
            type="button"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
};

export default TopAccounts;
