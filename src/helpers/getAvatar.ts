import type { User, PostAuthor } from "@/types/api";

/**
 * Get the avatar URL for a user.
 * Falls back to DiceBear initials avatar if none is set.
 */
const getAvatar = (
  entity: User | PostAuthor | null | undefined
): string => {
  if (!entity) {
    return `https://api.dicebear.com/8.x/initials/svg?seed=user`;
  }

  if (entity.avatarUrl) {
    return entity.avatarUrl;
  }

  const seed = encodeURIComponent(entity.username ?? "user");
  return `https://api.dicebear.com/8.x/initials/svg?seed=${seed}`;
};

export default getAvatar;
