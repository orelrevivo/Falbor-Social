import {
  BookmarkIcon,
  ChatBubbleOvalLeftIcon,
  ArrowUpIcon as ArrowUpOutline,
  ArrowDownIcon as ArrowDownOutline,
  TrashIcon
} from "@heroicons/react/24/outline";
import {
  BookmarkIcon as BookmarkSolid,
  ArrowUpIcon as ArrowUpSolid,
  ArrowDownIcon as ArrowDownSolid
} from "@heroicons/react/24/solid";
import { memo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Post } from "@/types/api";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import Audio from "@/components/Shared/Audio";
import sanitizeDStorageUrl from "@/helpers/sanitizeDStorageUrl";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface SimplePostCardProps {
  post: Post;
  onUpdate?: (updated: Post) => void;
  onDelete?: (id: string) => void;
}

const SimplePostCard = ({ post, onUpdate, onDelete }: SimplePostCardProps) => {
  const { currentAccount } = useAccountStore();
  const [localPost, setLocalPost] = useState(post);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  const avatarUrl =
    localPost.author.avatarUrl ??
    `https://api.dicebear.com/8.x/initials/svg?seed=${localPost.author.username}`;

  const handleVote = async (e: React.MouseEvent, type: "up" | "down") => {
    e.preventDefault();
    if (!currentAccount) {
      toast.error("Please log in to vote");
      return;
    }
    if (isLiking) return;
    setIsLiking(true);

    const voteValue = type === "up" ? 1 : -1;
    // If clicking the same vote, we remove it (toggle off)
    const newValue = localPost.userVote === voteValue ? 0 : voteValue;

    // Calculate optimistic score
    let scoreDiff = 0;
    if (localPost.userVote === 1) scoreDiff -= 1; // remove previous upvote
    if (localPost.userVote === -1) scoreDiff += 1; // remove previous downvote
    if (newValue === 1) scoreDiff += 1; // add new upvote
    if (newValue === -1) scoreDiff -= 1; // add new downvote

    const optimistic: Post = {
      ...localPost,
      userVote: newValue,
      score: localPost.score + scoreDiff
    };

    setLocalPost(optimistic);
    onUpdate?.(optimistic);

    try {
      await api.posts.vote(localPost.id, newValue);
    } catch {
      // revert
      setLocalPost(localPost);
      onUpdate?.(localPost);
      toast.error("Failed to vote on post");
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentAccount) {
      toast.error("Please log in to bookmark posts");
      return;
    }
    if (isBookmarking) return;
    setIsBookmarking(true);
    const optimistic: Post = {
      ...localPost,
      hasBookmarked: !localPost.hasBookmarked
    };
    setLocalPost(optimistic);
    onUpdate?.(optimistic);
    try {
      await api.posts.bookmark(localPost.id);
    } catch {
      setLocalPost(localPost);
      onUpdate?.(localPost);
      toast.error("Failed to bookmark post");
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.posts.delete(localPost.id);
      onDelete?.(localPost.id);
      toast.success("Post deleted");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete post");
    }
  };

  const isOwner = currentAccount?.id === localPost.author.id;

  return (
    <article className="group relative px-4 py-4 transition hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
      <div className="flex gap-3">
        {/* Avatar */}
        <Link
          className="shrink-0"
          to={`/u/${localPost.author.username}`}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            alt={localPost.author.username}
            className="size-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-900"
            src={avatarUrl}
          />
        </Link>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-center gap-1.5">
            <Link
              className="font-semibold text-gray-900 text-sm hover:underline dark:text-white"
              to={`/u/${localPost.author.username}`}
              onClick={(e) => e.stopPropagation()}
            >
              {localPost.author.displayName ?? localPost.author.username}
            </Link>
            <span className="text-gray-400 text-sm">
              @{localPost.author.username}
            </span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span
              className="text-gray-400 text-xs"
              title={dayjs(localPost.createdAt).format("MMMM D, YYYY h:mm A")}
            >
              {dayjs(localPost.createdAt).fromNow()}
            </span>
            {isOwner && (
              <button
                className="ml-auto hidden text-gray-400 hover:text-red-500 group-hover:block"
                onClick={handleDelete}
                title="Delete post"
                type="button"
              >
                <TrashIcon className="size-4" />
              </button>
            )}
          </div>

          {/* Text */}
          <Link to={`/posts/${localPost.id}`}>
            <p className="mt-1 whitespace-pre-wrap break-words text-gray-800 text-sm leading-relaxed dark:text-gray-200">
              {localPost.content}
            </p>
          </Link>

          {/* Media */}
          {localPost.mediaUrls.length > 0 && (
            <div
              className={`mt-2.5 grid gap-1 overflow-hidden rounded-2xl ${
                localPost.mediaUrls.length === 1
                  ? "grid-cols-1"
                  : "grid-cols-2"
              }`}
            >
              {localPost.mediaUrls.map((url, i) => {
                const isVideo = url.includes("#type=Video") || url.match(/\.(mp4|webm|mov)$/i);
                const isAudio = url.includes("#type=Audio") || url.match(/\.(mp3|wav|ogg)$/i);
                const cleanUrl = sanitizeDStorageUrl(url.split("#")[0]);

                if (isVideo) {
                  return (
                    <video
                      key={url}
                      src={cleanUrl}
                      controls
                      className="h-56 w-full object-cover"
                    />
                  );
                }
                
                if (isAudio) {
                  // Parse metadata if available
                  const params = new URLSearchParams(url.split("#")[1] || "");
                  const title = params.get("title") || "Audio Post";
                  const artist = params.get("artist") || `@${localPost.author.username}`;
                  const cover = params.get("cover") || avatarUrl;

                  return (
                    <div key={url} className="mt-2 w-full">
                      <Audio
                        src={cleanUrl}
                        title={title}
                        artist={artist}
                        poster={cover}
                      />
                    </div>
                  );
                }

                return (
                  <Link to={`/posts/${localPost.id}`} key={url}>
                    <img
                      alt={`media-${i}`}
                      className="h-56 w-full object-cover"
                      src={cleanUrl}
                    />
                  </Link>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-5">
            {/* Comment */}
            <Link
              className="flex items-center gap-1.5 text-gray-400 text-xs hover:text-[#0099ff]"
              to={`/posts/${localPost.id}`}
            >
              <ChatBubbleOvalLeftIcon className="size-4" />
              <span>{localPost.commentsCount}</span>
            </Link>

            {/* Upvote / Downvote */}
            <div className="flex items-center gap-1">
              <button
                className={`flex items-center p-1 rounded-full transition ${
                  localPost.userVote === 1
                    ? "text-[#0099ff] bg-[#0099ff]/20 dark:bg-orange-900/20"
                    : "text-gray-400 hover:text-[#0099ff] hover:bg-[#0099ff]/20 dark:hover:bg-orange-900/20"
                }`}
                disabled={isLiking}
                onClick={(e) => handleVote(e, "up")}
                type="button"
              >
                {localPost.userVote === 1 ? (
                  <ArrowUpSolid className="size-4" />
                ) : (
                  <ArrowUpOutline className="size-4" />
                )}
              </button>
              <span className={`text-xs font-medium min-w-[1ch] text-center ${localPost.userVote === 1 ? 'text-[#0099ff]' : localPost.userVote === -1 ? 'text-[#0099ff]' : 'text-gray-400'}`}>
                {localPost.score}
              </span>
              <button
                className={`flex items-center p-1 rounded-full transition ${
                  localPost.userVote === -1
                    ? "text-[#0099ff] bg-[#0099ff]/20 dark:bg-indigo-900/20"
                    : "text-gray-400 hover:text-[#0099ff] hover:bg-[#0099ff]/20 dark:hover:bg-indigo-900/20"
                }`}
                disabled={isLiking}
                onClick={(e) => handleVote(e, "down")}
                type="button"
              >
                {localPost.userVote === -1 ? (
                  <ArrowDownSolid className="size-4" />
                ) : (
                  <ArrowDownOutline className="size-4" />
                )}
              </button>
            </div>

            {/* Bookmark */}
            <button
              className={`flex items-center gap-1.5 text-xs transition ${
                localPost.hasBookmarked
                  ? "text-[#0099ff]"
                  : "text-gray-400 hover:text-[#0099ff]"
              }`}
              disabled={isBookmarking}
              onClick={handleBookmark}
              type="button"
            >
              {localPost.hasBookmarked ? (
                <BookmarkSolid className="size-4" />
              ) : (
                <BookmarkIcon className="size-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default memo(SimplePostCard);
