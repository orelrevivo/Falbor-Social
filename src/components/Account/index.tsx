import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { MapPinIcon, LinkIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import dayjs from "dayjs";

import { api } from "@/lib/api";
import type { User, Post } from "@/types/api";
import { useAccountStore } from "@/store/persisted/useAccountStore";

import PageLayout from "@/components/Shared/PageLayout";
import Cover from "@/components/Shared/Cover";
import { Button, Spinner } from "@/components/Shared/UI";
import Loader from "@/components/Shared/Loader";
import Custom404 from "@/components/Shared/404";
import SimplePostCard from "@/components/Post/SimplePostCard";
import NewPostModal from "@/components/Composer/NewPostModal";

const ViewAccount = () => {
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  const { currentAccount } = useAccountStore();
  
  const [account, setAccount] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState(false);

  const loadAccount = useCallback(async () => {
    if (!username) return;
    try {
      const data = await api.accounts.get(username);
      setAccount(data.account);
      setIsFollowing(!!data.account.isFollowing);
    } catch {
      setError(true);
    } finally {
      setLoadingAccount(false);
    }
  }, [username]);

  const loadPosts = useCallback(async (nextCursor?: string) => {
    if (!username) return;
    try {
      const data = await api.accounts.posts(username, nextCursor);
      setPosts((prev) => (nextCursor ? [...prev, ...data.items] : data.items));
      setCursor(data.nextCursor);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to load posts");
    } finally {
      setLoadingPosts(false);
      setLoadingMore(false);
    }
  }, [username]);

  useEffect(() => {
    setLoadingAccount(true);
    setLoadingPosts(true);
    setCursor(null);
    setPosts([]);
    loadAccount();
    loadPosts();
  }, [loadAccount, loadPosts]);

  const handleFollow = async () => {
    if (!currentAccount) {
      toast.error("Please login to follow");
      return;
    }
    if (!account) return;
    setFollowLoading(true);
    setIsFollowing(!isFollowing);
    try {
      await api.accounts.follow(account.username);
    } catch {
      setIsFollowing(isFollowing);
      toast.error("Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    loadPosts(cursor);
  };

  if (loadingAccount) return <Loader className="my-12" message="Loading profile..." />;
  if (error || !account) return <Custom404 />;

  const isOwner = currentAccount?.id === account.id;
  const avatarUrl = account.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${account.username}`;
  const coverUrl = account.coverUrl || "https://static.hey.xyz/images/patterns/2.svg";

  return (
    <PageLayout title={`${account.displayName ?? account.username} (@${account.username}) • Hey`} zeroTopMargin>
      <Cover cover={coverUrl} />
      <div className="mb-4 space-y-3 px-5 md:px-0">
        <div className="flex items-start justify-between">
          <div className="relative -mt-14 ml-5 size-20 sm:-mt-24 sm:size-36">
            <img
              alt={account.username}
              className="size-20 rounded-full bg-white object-cover ring-4 ring-white sm:size-36 dark:bg-black dark:ring-black"
              src={avatarUrl}
            />
          </div>
          <div className="mt-3 flex items-center gap-x-2">
            {!isOwner && (
              <Button onClick={handleFollow} outline={!isFollowing} disabled={followLoading}>
                {isFollowing ? "Following" : "Follow"}
              </Button>
            )}
            {isOwner && (
              <Button outline onClick={() => navigate('/settings')}>
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-1 py-2">
          <h1 className="text-xl font-bold truncate text-gray-900 dark:text-white">
            {account.displayName ?? account.username}
          </h1>
          <div className="text-gray-500">@{account.username}</div>
        </div>

        {account.bio && (
          <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
            {account.bio}
          </div>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
          {account.location && (
            <div className="flex items-center gap-1">
              <MapPinIcon className="size-4" />
              <span>{account.location}</span>
            </div>
          )}
          {account.website && (
            <div className="flex items-center gap-1">
              <LinkIcon className="size-4" />
              <a href={account.website.startsWith('http') ? account.website : `https://${account.website}`} target="_blank" rel="noreferrer" className="text-brand-500 hover:underline">
                {account.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          <div className="flex items-center gap-1">
            <CalendarDaysIcon className="size-4" />
            <span>Joined {dayjs(account.createdAt).format('MMMM YYYY')}</span>
          </div>
        </div>

        <div className="flex gap-4 text-sm mt-3 border-b border-gray-200 pb-5 dark:border-gray-800">
          <div className="flex gap-1 hover:underline cursor-pointer">
            <span className="font-bold text-gray-900 dark:text-white">{account.followingCount}</span>
            <span className="text-gray-500">Following</span>
          </div>
          <div className="flex gap-1 hover:underline cursor-pointer">
            <span className="font-bold text-gray-900 dark:text-white">{account.followersCount}</span>
            <span className="text-gray-500">Followers</span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 mb-10 overflow-hidden">
        {isOwner && (
          <div className="border-b border-gray-200 dark:border-gray-800">
             <NewPostModal onClose={() => {}} onSuccess={() => loadPosts()} />
          </div>
        )}
        
        {loadingPosts ? (
          <Loader className="my-10" />
        ) : posts.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No posts yet.</div>
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

        {cursor && (
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

export default ViewAccount;
