import { useEffect, useState } from "react";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { api } from "@/lib/api";
import type { Post } from "@/types/api";

import Footer from "@/components/Shared/Footer";
import PageLayout from "@/components/Shared/PageLayout";
import { Spinner } from "@/components/Shared/UI";
import Loader from "@/components/Shared/Loader";
import SimplePostCard from "@/components/Post/SimplePostCard";

const Explore = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const loadExplore = async () => {
      try {
        const data = await api.posts.feed();
        setPosts(data.items);
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to load explore feed");
      } finally {
        setLoading(false);
      }
    };
    loadExplore();
  }, []);

  const handleLoadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await api.posts.feed(cursor);
      setPosts((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to load more posts");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <PageLayout
      sidebar={
        <>
          <Footer />
        </>
      }
      title="Explore"
    >
      <div className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-10">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <GlobeAltIcon className="size-6 text-brand-500" />
            Explore
          </h2>
          <p className="text-gray-500 text-sm mt-1">Discover what's happening on Hey.</p>
        </div>
        
        {loading ? (
          <Loader className="my-10" />
        ) : posts.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <GlobeAltIcon className="mx-auto mb-4 size-10 text-gray-300" />
            <p>Nothing here yet.</p>
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

export default Explore;
