import { useEffect, useState } from "react";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { api } from "@/lib/api";
import type { Post } from "@/types/api";
import { useAccountStore } from "@/store/persisted/useAccountStore";

import PageLayout from "@/components/Shared/PageLayout";
import NotLoggedIn from "@/components/Shared/NotLoggedIn";
import Loader from "@/components/Shared/Loader";
import { Spinner } from "@/components/Shared/UI";
import SimplePostCard from "@/components/Post/SimplePostCard";

const Bookmarks = () => {
  const { currentAccount } = useAccountStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!currentAccount) return;
    const loadBookmarks = async () => {
      try {
        const data = await api.posts.bookmarks();
        setPosts(data.items);
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to load bookmarks");
      } finally {
        setLoading(false);
      }
    };
    loadBookmarks();
  }, [currentAccount]);

  const handleLoadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await api.posts.bookmarks(cursor);
      setPosts((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to load more bookmarks");
    } finally {
      setLoadingMore(false);
    }
  };

  if (!currentAccount) {
    return <NotLoggedIn />;
  }

  return (
    <PageLayout title="Bookmarks">
      <div className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-10">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Bookmarks</h2>
        </div>
        
        {loading ? (
          <Loader className="my-10" />
        ) : posts.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <BookmarkIcon className="mx-auto mb-4 size-10 text-gray-300" />
            <p>You haven't bookmarked any posts yet.</p>
          </div>
        ) : (
          posts.map((post) => (
            <SimplePostCard 
              key={post.id} 
              post={post} 
              onUpdate={(updated) => setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))}
              onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
            />
          ))
        )}

        {hasMore && posts.length > 0 && (
           <div className="flex justify-center py-4">
             <button
               className="rounded-xl px-6 py-2 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950"
               disabled={loadingMore}
               onClick={handleLoadMore}
               type="button"
             >
               {loadingMore ? <Spinner size="sm" /> : "Load more"}
             </button>
           </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Bookmarks;
