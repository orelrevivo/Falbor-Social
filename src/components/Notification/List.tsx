import { BellIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Card, EmptyState, ErrorMessage, Spinner } from "@/components/Shared/UI";
import { api } from "@/lib/api";
import type { Notification } from "@/types/api";
import Link from "next/link";
import { AtSymbolIcon, HeartIcon, ChatBubbleLeftIcon } from "@heroicons/react/24/outline";

const List = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.notifications.list();
        setNotifications(res.items);
        await api.notifications.markRead();
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <Card className="flex items-center justify-center p-10">
        <Spinner size="md" />
      </Card>
    );
  }

  if (error) {
    return <ErrorMessage error={error} title="Failed to load notifications" />;
  }

  if (!notifications?.length) {
    return (
      <EmptyState
        icon={<BellIcon className="size-8" />}
        message="Inbox zero!"
      />
    );
  }

  return (
    <Card className="divide-y divide-gray-200 dark:divide-gray-700">
      {notifications.map((notification: any) => {
        let Icon = BellIcon;
        let text = "interacted with you";
        
        if (notification.type === "mention") {
          Icon = AtSymbolIcon;
          text = "mentioned you in a post";
        } else if (notification.type === "like") {
          Icon = HeartIcon;
          text = "liked your post";
        } else if (notification.type === "comment") {
          Icon = ChatBubbleLeftIcon;
          text = "commented on your post";
        }

        return (
          <Link
            key={notification.id}
            href={`/posts/${notification.postId}`}
            className="flex items-center space-x-4 p-5 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer relative"
          >
            {!notification.read && (
              <span className="absolute left-2 top-1/2 -translate-y-1/2 size-2 rounded-full bg-brand-500" />
            )}
            <div className="flex-shrink-0">
              <Icon className="size-6 text-gray-500" />
            </div>
            <img
              src={notification.actor.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${notification.actor.username}`}
              alt={notification.actor.username}
              className="size-10 rounded-full border border-gray-200 dark:border-gray-700"
            />
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-bold">{notification.actor.displayName || notification.actor.username}</span>{" "}
                <span className="text-gray-500">{text}</span>
              </p>
            </div>
          </Link>
        );
      })}
    </Card>
  );
};

export default List;
