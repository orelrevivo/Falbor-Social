import { UserGroupIcon } from "@heroicons/react/24/outline";
import { memo, useCallback, useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Post } from "@/types/api";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { Button, Card, Spinner } from "@/components/Shared/UI";
import SimplePostCard from "@/components/Post/SimplePostCard";
import Loader from "@/components/Shared/Loader";

interface TimelineProps {
  isExplore?: boolean;
}

const Timeline = ({ isExplore }: TimelineProps = {}) => {
  const { currentAccount } = useAccountStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPosts = useCallback(async (nextCursor?: string) => {
    try {
      const data = isExplore ? await api.posts.feed(nextCursor) : await api.posts.timeline(nextCursor);
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

  // Initial load and reload when feed type changes
  useEffect(() => {
    if (currentAccount) {
      setLoading(true);
      loadPosts();
    }
  }, [currentAccount, isExplore, loadPosts]);

  const handleLoadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    await loadPosts(cursor);
  };

  if (loading) {
    return <Loader className="my-12" message="Loading your feed..." />;
  }

  if (!posts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <UserGroupIcon className="mb-3 size-8 text-gray-400" />
        <p className="text-gray-500">No posts yet! Follow people to see their posts.</p>
      </div>
    );
  }

  return (
    <Card className="space-y-0 divide-y divide-gray-200 dark:divide-gray-800 bg-white border">
      {posts.map((post) => (
        <SimplePostCard key={post.id} post={post} onUpdate={(updated) => {
          setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }} />
      ))}
      {hasMore && (
        <div className="flex justify-center py-4">
          <Button
            disabled={loadingMore}
            onClick={handleLoadMore}
            type="button"
          >
            {loadingMore ? <Spinner size="sm" /> : "Load more"}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default memo(Timeline);
