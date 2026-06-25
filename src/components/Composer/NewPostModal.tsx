import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/Shared/UI";
import { api } from "@/lib/api";
import { useAccountStore } from "@/store/persisted/useAccountStore";

interface NewPostModalProps {
  onClose: () => void;
  parentId?: string;
  onSuccess?: () => void;
}

const MAX_CHARS = 5000;

const NewPostModal = ({ onClose, parentId, onSuccess }: NewPostModalProps) => {
  const { currentAccount } = useAccountStore();
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaInput, setMediaInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const avatarUrl =
    currentAccount?.avatarUrl ??
    `https://api.dicebear.com/8.x/initials/svg?seed=${currentAccount?.username ?? "user"}`;

  const handleAddMedia = () => {
    const url = mediaInput.trim();
    if (!url) return;
    try {
      new URL(url);
      setMediaUrls((prev) => [...prev, url]);
      setMediaInput("");
    } catch {
      toast.error("Please enter a valid URL");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      await api.posts.create({
        content: content.trim(),
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        parentId
      });
      toast.success(parentId ? "Reply posted!" : "Post created!");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const remaining = MAX_CHARS - content.length;

  return (
    <form className="p-4" onSubmit={handleSubmit}>
      <div className="flex gap-3">
        <img
          alt={currentAccount?.username}
          className="size-10 shrink-0 rounded-full object-cover"
          src={avatarUrl}
        />
        <div className="flex-1">
          <textarea
            autoFocus
            className="w-full resize-none bg-transparent text-gray-900 text-sm outline-none placeholder:text-gray-400 dark:text-white"
            maxLength={MAX_CHARS}
            onChange={(e) => setContent(e.target.value)}
            placeholder={parentId ? "Write a reply..." : "What's on your mind?"}
            ref={textareaRef}
            rows={4}
            value={content}
          />

          {/* Media URLs */}
          {mediaUrls.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {mediaUrls.map((url, i) => (
                <div
                  className="group relative overflow-hidden rounded-xl"
                  key={url}
                >
                  <img
                    alt={`media-${i}`}
                    className="h-24 w-24 object-cover"
                    src={url}
                  />
                  <button
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition group-hover:opacity-100"
                    onClick={() =>
                      setMediaUrls((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    type="button"
                  >
                    <XMarkIcon className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add image URL */}
          {mediaUrls.length < 8 && (
            <div className="mb-3 flex gap-2">
              <input
                className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs outline-none dark:border-gray-700 dark:bg-gray-900"
                onChange={(e) => setMediaInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddMedia())}
                placeholder="Paste image URL and press Enter..."
                value={mediaInput}
              />
              <button
                className="text-gray-400 hover:text-brand-500"
                onClick={handleAddMedia}
                title="Add image"
                type="button"
              >
                <PhotoIcon className="size-4" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
            <span
              className={`text-xs ${remaining < 50 ? "text-red-500" : "text-gray-400"}`}
            >
              {remaining} characters left
            </span>
            <Button
              disabled={isSubmitting || !content.trim()}
              loading={isSubmitting}
              size="sm"
              type="submit"
            >
              {parentId ? "Reply" : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default NewPostModal;
